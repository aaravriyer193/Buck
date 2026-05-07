// =============================================================================
// Buck — event stream
// =============================================================================
// Every thought, tool call, and result is written to session_events. Subscribers
// (the live dashboard) tail this table via Supabase Realtime.
// =============================================================================

import { createServiceClient } from '@/lib/supabase/server';
import type { EventType } from '@/lib/supabase/types';

export interface EventStream {
  thought: (text: string) => Promise<void>;
  action: (text: string, payload?: Record<string, unknown>) => Promise<void>;
  toolCall: (name: string, args: Record<string, unknown>) => Promise<void>;
  toolResult: (name: string, result: unknown) => Promise<void>;
  error: (message: string) => Promise<void>;
  system: (message: string) => Promise<void>;
  approvalRequest: (id: string, actionType: string, description: string) => Promise<void>;
  approvalDecision: (id: string, decision: 'approved' | 'denied' | 'timeout') => Promise<void>;
  budgetWarning: (text: string, payload: Record<string, unknown>) => Promise<void>;
  taskStarted: (taskId: string) => Promise<void>;
  taskCompleted: (taskId: string, summary: string | null) => Promise<void>;
  taskSkipped: (taskId: string, reason: string | null) => Promise<void>;
}

export function eventStream(sessionId: string): EventStream {
  const supabase = createServiceClient();
  let seq = 0;

  async function push(type: EventType, payload: Record<string, unknown>) {
    seq += 1;
    const { error } = await supabase.from('session_events').insert({
      session_id: sessionId,
      seq,
      type,
      payload,
    });
    if (error) {
      // We swallow stream errors so an event-store outage can't kill Buck mid-task.
      console.error('event_stream insert failed', error);
    }
  }

  return {
    thought: (text) => push('thought', { text }),
    action: (text, payload) => push('action', { text, ...(payload ?? {}) }),
    toolCall: (name, args) => push('tool_call', { name, args }),
    toolResult: (name, result) => push('tool_result', { name, result: trim(result) }),
    error: (message) => push('error', { message }),
    system: (message) => push('system', { message }),
    approvalRequest: (id, actionType, description) =>
      push('approval_request', { id, action_type: actionType, description }),
    approvalDecision: (id, decision) => push('approval_decision', { id, decision }),
    budgetWarning: (text, payload) => push('budget_warning', { text, ...payload }),
    taskStarted: (taskId) => push('task_started', { task_id: taskId }),
    taskCompleted: (taskId, summary) => push('task_completed', { task_id: taskId, summary }),
    taskSkipped: (taskId, reason) => push('task_skipped', { task_id: taskId, reason }),
  };
}

/**
 * Tool results can be large. We truncate before storing so the stream stays
 * responsive. The full result is still in the sandbox memory for the agent.
 */
function trim(value: unknown): unknown {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (str.length <= 4000) return value;
  return { _truncated: true, preview: str.slice(0, 4000), full_length: str.length };
}
