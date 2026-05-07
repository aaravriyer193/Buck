// =============================================================================
// Buck — tool registry
// =============================================================================
// Builds the tool surface for the LLM from the user's enabled integrations,
// plus a small set of internal "buck.*" tools for task tracking and session
// completion. Tool execution itself happens server-side by calling out to the
// integration's runtime adapter.
// =============================================================================

import type { ToolDef } from '@/lib/openrouter/client';
import { ALL_INTEGRATIONS } from '@/integrations';
import { runIntegrationTool } from './tool_runner';

export interface Tool {
  def: ToolDef;
  /** Action category used by approval gate. */
  actionType: string;
  /** True if the user has marked this category as approval-required. */
  requiresApproval: (approvalActions: string[]) => boolean;
  describeCall: (args: Record<string, unknown>) => string;
  run: (args: Record<string, unknown>) => Promise<unknown>;
}

interface InitArgs {
  enabledServices: string[];
  sessionId: string;
}

export async function initToolRegistry({ enabledServices, sessionId }: InitArgs): Promise<Tool[]> {
  const tools: Tool[] = [];

  // Internal Buck tools — always present
  tools.push(buckTaskUpdateTool());
  tools.push(buckSessionDoneTool());

  // Integration tools — only for services the user has enabled
  for (const integration of ALL_INTEGRATIONS) {
    if (!enabledServices.includes(integration.service)) continue;
    for (const t of integration.tools) {
      const actionType = inferActionType(t.name, t.destructive);
      tools.push({
        def: {
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        },
        actionType,
        requiresApproval: (approvalActions) =>
          !!t.destructive && approvalActions.includes(actionType),
        describeCall: (args) => describeToolCall(t.name, args),
        run: (args) => runIntegrationTool(integration.service, t.name, args, sessionId),
      });
    }
  }

  return tools;
}

function inferActionType(name: string, destructive: boolean | undefined): string {
  if (!destructive) return 'read';
  if (/send|post_message|email|notify/.test(name)) return 'email_send';
  if (/delete|remove|destroy/.test(name)) return 'file_delete';
  if (/charge|payment|invoice/.test(name)) return 'payment';
  if (/calendar|event/.test(name)) return 'calendar_invite';
  if (/comment|append|post|publish/.test(name)) return 'public_post';
  if (/create|update/.test(name)) return 'destructive_db_write';
  return 'destructive_db_write';
}

function describeToolCall(name: string, args: Record<string, unknown>): string {
  const summary = Object.entries(args)
    .slice(0, 3)
    .map(([k, v]) => {
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return `${k}=${s.length > 60 ? s.slice(0, 60) + '…' : s}`;
    })
    .join(', ');
  return `${name}(${summary})`;
}

// ---------------------------------------------------------------------------
// Internal Buck tools
// ---------------------------------------------------------------------------

function buckTaskUpdateTool(): Tool {
  return {
    def: {
      type: 'function',
      function: {
        name: 'buck.task_update',
        description:
          'Update the status of a task. Call this when you start, finish, skip, or fail a task.',
        parameters: {
          type: 'object',
          properties: {
            task_id: { type: 'string' },
            status: { type: 'string', enum: ['in_progress', 'completed', 'skipped', 'failed'] },
            summary: { type: 'string', description: 'One-sentence summary of outcome.' },
          },
          required: ['task_id', 'status'],
        },
      },
    },
    actionType: 'internal',
    requiresApproval: () => false,
    describeCall: () => 'task_update',
    run: async () => ({ ok: true }),
  };
}

function buckSessionDoneTool(): Tool {
  return {
    def: {
      type: 'function',
      function: {
        name: 'buck.session_done',
        description: 'Call this when all tasks are processed and the session should end.',
        parameters: { type: 'object', properties: {} },
      },
    },
    actionType: 'internal',
    requiresApproval: () => false,
    describeCall: () => 'session_done',
    run: async () => ({ ok: true }),
  };
}
