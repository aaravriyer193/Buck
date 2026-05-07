// =============================================================================
// Buck — approval gate
// =============================================================================
// When Buck wants to take a destructive action that the user has flagged as
// requiring approval, this gate creates an approval_request, streams it live
// to the user's dashboard, and polls until the user decides (or the timeout
// fires).
// =============================================================================

import { createServiceClient } from '@/lib/supabase/server';
import type { ApprovalStatus } from '@/lib/supabase/types';
import type { EventStream } from './event_stream';

const POLL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 1000 * 60 * 60 * 8; // 8 hours

export interface ApprovalArgs {
  sessionId: string;
  userId: string;
  actionType: string;
  description: string;
  payload: Record<string, unknown>;
  stream: EventStream;
  timeoutMs?: number;
}

export async function approvalGate(args: ApprovalArgs): Promise<ApprovalStatus> {
  const supabase = createServiceClient();
  const timeoutAt = new Date(Date.now() + (args.timeoutMs ?? DEFAULT_TIMEOUT_MS)).toISOString();

  const { data: req, error } = await supabase
    .from('approval_requests')
    .insert({
      session_id: args.sessionId,
      user_id: args.userId,
      action_type: args.actionType,
      description: args.description,
      payload: args.payload,
      timeout_at: timeoutAt,
    })
    .select('id')
    .single();

  if (error || !req) {
    args.stream.error(`Failed to create approval request: ${error?.message ?? 'unknown'}`);
    // If we can't ask, default to denying to be safe.
    return 'denied';
  }

  await args.stream.approvalRequest(req.id, args.actionType, args.description);

  const deadline = Date.now() + (args.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const { data: latest } = await supabase
      .from('approval_requests')
      .select('status')
      .eq('id', req.id)
      .single();
    if (latest && latest.status !== 'pending') {
      await args.stream.approvalDecision(req.id, latest.status as 'approved' | 'denied' | 'timeout');
      return latest.status as ApprovalStatus;
    }
  }

  // Timeout — mark as such
  await supabase
    .from('approval_requests')
    .update({ status: 'timeout', decided_at: new Date().toISOString() })
    .eq('id', req.id)
    .eq('status', 'pending');

  await args.stream.approvalDecision(req.id, 'timeout');
  return 'timeout';
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
