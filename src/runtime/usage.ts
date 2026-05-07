// =============================================================================
// Buck — usage tracking
// =============================================================================
// Writes individual cost events and updates the session's running total.
// =============================================================================

import { createServiceClient } from '@/lib/supabase/server';

export interface UsageEvent {
  sessionId: string;
  userId: string;
  kind: 'llm_tokens' | 'sandbox_seconds';
  units: number;
  unitCostUsd: number;
  totalUsd: number;
  meta?: Record<string, unknown>;
}

export async function recordUsage(ev: UsageEvent): Promise<void> {
  const supabase = createServiceClient();

  await supabase.from('usage_events').insert({
    user_id: ev.userId,
    session_id: ev.sessionId,
    kind: ev.kind,
    units: ev.units,
    unit_cost_usd: ev.unitCostUsd,
    total_usd: ev.totalUsd,
    meta: ev.meta ?? {},
  });

  // Bump the session's running cost. We rely on UPDATE ... SET cost = cost + ?
  // so concurrent updates from parallel tool calls are safe.
  await supabase.rpc('increment_session_cost', {
    p_session_id: ev.sessionId,
    p_delta: ev.totalUsd,
  });
}
