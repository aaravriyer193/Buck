// =============================================================================
// Buck — main.ts (v1, default)
// =============================================================================
// This is Buck's mutable main script. It is versioned in the database and
// users approve any changes Buck proposes to it. Locked regions are marked
// `// @buck:locked` and cannot be modified by Buck's reflection pass — they
// hold the safety primitives (budget guard, approval gate).
// =============================================================================

import { agentLoop } from './loop';
import { writeDiary } from './diary_writer';
import { initToolRegistry } from './tool_registry';
import { eventStream } from './event_stream';

interface BuckContext {
  sessionId: string;
  userId: string;
  tasks: Array<{ id: string; title: string; prompt: string | null }>;
  promptMd: string;
  model: string;
  enabledServices: string[];
  perSessionBudgetUsd: number;
  monthlyBudgetRemainingUsd: number;
  approvalActions: string[];
}

export async function runBuck(ctx: BuckContext): Promise<void> {
  const stream = eventStream(ctx.sessionId);
  await stream.system('Buck is waking up.');

  // @buck:locked-start: tool_registry_init
  const tools = await initToolRegistry({
    enabledServices: ctx.enabledServices,
    sessionId: ctx.sessionId,
  });
  await stream.system(`Loaded ${tools.length} tool(s).`);
  // @buck:locked-end

  let exitReason: 'completed' | 'failed' | 'budget_halt' | 'cancelled' = 'completed';
  let errorMessage: string | undefined;

  try {
    await agentLoop({
      ctx,
      tools,
      stream,
    });
  } catch (err) {
    if ((err as Error).message === 'BUDGET_HALT') {
      exitReason = 'budget_halt';
    } else if ((err as Error).message === 'CANCELLED') {
      exitReason = 'cancelled';
    } else {
      exitReason = 'failed';
      errorMessage = (err as Error).message;
      await stream.error(errorMessage);
    }
  }

  // @buck:locked-start: diary_write
  // The diary write must always run, even on failure. It is how Buck reflects
  // and how the user knows what happened.
  await stream.system('Writing diary entry.');
  await writeDiary({
    sessionId: ctx.sessionId,
    userId: ctx.userId,
    exitReason,
    errorMessage,
    model: ctx.model,
  });
  // @buck:locked-end

  await stream.system(`Buck is going to sleep. (${exitReason})`);
}
