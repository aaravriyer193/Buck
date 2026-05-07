// =============================================================================
// Buck — agent loop
// =============================================================================
// Plan → act → observe, with token + cost accounting and the approval gate.
// =============================================================================

import { chat, type ChatMessage, type ToolCall } from '@/lib/openrouter/client';
import type { EventStream } from './event_stream';
import type { Tool } from './tool_registry';
import { budgetGuard } from './budget_guard';
import { approvalGate } from './approval_gate';
import { recordUsage } from './usage';
import { recordTaskUpdate } from './tasks';

export interface AgentLoopArgs {
  ctx: {
    sessionId: string;
    userId: string;
    tasks: Array<{ id: string; title: string; prompt: string | null }>;
    promptMd: string;
    model: string;
    perSessionBudgetUsd: number;
    monthlyBudgetRemainingUsd: number;
    approvalActions: string[];
  };
  tools: Tool[];
  stream: EventStream;
}

const MAX_ITERATIONS = 40;

export async function agentLoop({ ctx, tools, stream }: AgentLoopArgs): Promise<void> {
  const taskList = ctx.tasks
    .map((t, i) => `${i + 1}. ${t.title}${t.prompt ? `\n   Detail: ${t.prompt}` : ''}`)
    .join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: ctx.promptMd },
    {
      role: 'user',
      content:
        `Tonight's tasks:\n${taskList}\n\n` +
        `Work through them in order. Mark each task complete, skipped, or failed as you go ` +
        `by calling the buck.task_update tool. When all tasks are processed, call buck.session_done.`,
    },
  ];

  const toolDefs = tools.map((t) => t.def);

  let iter = 0;
  let totalCost = 0;

  while (iter < MAX_ITERATIONS) {
    iter += 1;

    // @buck:locked-start: budget_check
    await budgetGuard({
      sessionId: ctx.sessionId,
      userId: ctx.userId,
      sessionBudget: ctx.perSessionBudgetUsd,
      monthlyRemaining: ctx.monthlyBudgetRemainingUsd,
      currentSessionCost: totalCost,
      stream,
    });
    // @buck:locked-end

    const result = await chat({
      model: ctx.model,
      messages,
      tools: toolDefs,
    });

    totalCost += result.cost_usd;
    await recordUsage({
      sessionId: ctx.sessionId,
      userId: ctx.userId,
      kind: 'llm_tokens',
      units: result.usage.total_tokens,
      unitCostUsd: result.cost_usd / Math.max(result.usage.total_tokens, 1),
      totalUsd: result.cost_usd,
      meta: { model: result.model, prompt_tokens: result.usage.prompt_tokens, completion_tokens: result.usage.completion_tokens },
    });

    if (result.content) {
      await stream.thought(result.content);
    }

    if (!result.tool_calls || result.tool_calls.length === 0) {
      // No tool calls and no obvious continuation — Buck is done.
      await stream.system('No further actions. Wrapping up.');
      return;
    }

    // Append the assistant turn (with tool calls) to history
    messages.push({
      role: 'assistant',
      content: result.content,
      tool_calls: result.tool_calls,
    });

    // Execute every tool call before continuing the loop
    for (const call of result.tool_calls) {
      const toolName = call.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      } catch (err) {
        await stream.error(`Bad tool args from model: ${(err as Error).message}`);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: toolName,
          content: JSON.stringify({ error: 'invalid_arguments' }),
        });
        continue;
      }

      // Internal Buck-only tools (task updates, session done) bypass approval.
      if (toolName === 'buck.task_update') {
        await handleTaskUpdate(ctx, args, stream);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: toolName,
          content: JSON.stringify({ ok: true }),
        });
        continue;
      }
      if (toolName === 'buck.session_done') {
        await stream.system('Session marked done by Buck.');
        return;
      }

      const tool = tools.find((t) => t.def.function.name === toolName);
      if (!tool) {
        await stream.error(`Unknown tool: ${toolName}`);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: toolName,
          content: JSON.stringify({ error: `unknown_tool:${toolName}` }),
        });
        continue;
      }

      // @buck:locked-start: approval_gate
      if (tool.requiresApproval(ctx.approvalActions)) {
        const decision = await approvalGate({
          sessionId: ctx.sessionId,
          userId: ctx.userId,
          actionType: tool.actionType,
          description: tool.describeCall(args),
          payload: args,
          stream,
        });
        if (decision !== 'approved') {
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            name: toolName,
            content: JSON.stringify({ skipped: true, reason: `user_${decision}` }),
          });
          continue;
        }
      }
      // @buck:locked-end

      await stream.toolCall(toolName, args);
      try {
        const out = await tool.run(args);
        await stream.toolResult(toolName, out);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: toolName,
          content: typeof out === 'string' ? out : JSON.stringify(out),
        });
      } catch (err) {
        const message = (err as Error).message;
        await stream.error(`${toolName} failed: ${message}`);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: toolName,
          content: JSON.stringify({ error: message }),
        });
      }
    }
  }

  await stream.system(`Hit iteration cap (${MAX_ITERATIONS}). Stopping.`);
}

async function handleTaskUpdate(
  ctx: AgentLoopArgs['ctx'],
  args: Record<string, unknown>,
  stream: EventStream
): Promise<void> {
  const taskId = String(args.task_id || '');
  const status = String(args.status || '');
  const summary = args.summary ? String(args.summary) : null;
  if (!taskId || !['completed', 'skipped', 'failed', 'in_progress'].includes(status)) {
    await stream.error('buck.task_update called with bad args');
    return;
  }
  await recordTaskUpdate({ taskId, userId: ctx.userId, status, summary });
  if (status === 'completed') await stream.taskCompleted(taskId, summary);
  else if (status === 'skipped') await stream.taskSkipped(taskId, summary);
  else if (status === 'failed') await stream.taskCompleted(taskId, summary); // logged as completion event with failure note
}
