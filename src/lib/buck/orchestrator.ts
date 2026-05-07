// =============================================================================
// Buck — orchestrator
// =============================================================================
// Glues everything together. Takes a session record, decrypts the user's
// integration secrets, boots an E2B sandbox with them as env vars, runs Buck's
// loop, finalizes the session with cost tallies, and triggers the wake-up email.
// =============================================================================

import { createServiceClient } from '@/lib/supabase/server';
import { decryptSecrets } from '@/lib/buck/vault';
import { bootSandbox } from '@/lib/e2b/sandbox';
import { runBuck } from '@/runtime/main';
import { setCurrentSandbox } from '@/runtime/sandbox_context';
import { runReflection } from '@/runtime/reflection';
import { sendWakeUpEmail } from '@/lib/email/wake_up';

export async function orchestrateSession(sessionId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionErr || !session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  if (session.status !== 'queued') {
    // Idempotency — don't restart a session that's running, ended, etc.
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user_id)
    .single();

  const { data: scriptVersion } = await supabase
    .from('script_versions')
    .select('*')
    .eq('id', session.script_version_id)
    .single();

  const { data: integrations } = await supabase
    .from('integrations')
    .select('service, secrets_encrypted, enabled')
    .eq('user_id', session.user_id)
    .eq('enabled', true);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, prompt')
    .in('id', session.task_ids);

  const monthlySpendRpc = await supabase.rpc('user_monthly_spend', { p_user_id: session.user_id });
  const monthlySpend = Number(monthlySpendRpc.data ?? 0);
  const monthlyRemaining = Math.max(0, (profile?.monthly_budget_usd ?? 100) - monthlySpend);

  // Decrypt secrets and merge into env
  const integrationEnvs: Record<string, string> = {};
  const enabledServices: string[] = [];
  for (const it of integrations ?? []) {
    try {
      const secrets = decryptSecrets(it.secrets_encrypted);
      Object.assign(integrationEnvs, secrets);
      enabledServices.push(it.service);
    } catch (err) {
      console.error(`Failed to decrypt secrets for ${it.service}:`, err);
    }
  }

  // Mark session running
  await supabase
    .from('sessions')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', sessionId);

  const sandboxStart = Date.now();
  const sandbox = await bootSandbox({
    envs: integrationEnvs,
    timeoutMs: Number(process.env.E2B_DEFAULT_TIMEOUT_MS ?? 14400000),
  });
  setCurrentSandbox(sandbox);

  let exitStatus: 'completed' | 'failed' | 'cancelled' | 'budget_halt' = 'completed';
  let errorText: string | null = null;

  try {
    await runBuck({
      sessionId,
      userId: session.user_id,
      tasks: tasks ?? [],
      promptMd: scriptVersion?.prompt_md ?? '',
      model: session.model,
      enabledServices,
      perSessionBudgetUsd: profile?.per_session_budget_usd ?? 5,
      monthlyBudgetRemainingUsd: monthlyRemaining,
      approvalActions: (process.env.BUCK_REQUIRE_APPROVAL_FOR ?? '').split(',').filter(Boolean),
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'BUDGET_HALT') exitStatus = 'budget_halt';
    else if (message === 'CANCELLED') exitStatus = 'cancelled';
    else {
      exitStatus = 'failed';
      errorText = message;
    }
  } finally {
    setCurrentSandbox(null);
    try {
      await sandbox.kill();
    } catch { /* ignore */ }

    // Sandbox time billing
    const sandboxSeconds = (Date.now() - sandboxStart) / 1000;
    const sandboxUnitCost = 0.0001; // TODO(buck): pull from E2B pricing API
    const sandboxCost = sandboxSeconds * sandboxUnitCost;
    await supabase.from('usage_events').insert({
      user_id: session.user_id,
      session_id: sessionId,
      kind: 'sandbox_seconds',
      units: sandboxSeconds,
      unit_cost_usd: sandboxUnitCost,
      total_usd: sandboxCost,
    });
    await supabase.rpc('increment_session_cost', { p_session_id: sessionId, p_delta: sandboxCost });
  }

  // Finalize session
  await supabase
    .from('sessions')
    .update({
      status: exitStatus,
      ended_at: new Date().toISOString(),
      error: errorText,
    })
    .eq('id', sessionId);

  // Diary is written from inside the runtime (main.ts). Now run reflection.
  try {
    if ((profile?.self_modify_mode ?? 'approval') !== 'off') {
      await runReflection({
        sessionId,
        userId: session.user_id,
        scriptVersionId: session.script_version_id,
      });
    }
  } catch (err) {
    console.error('reflection failed', err);
  }

  // Wake-up email
  try {
    await sendWakeUpEmail(sessionId);
  } catch (err) {
    console.error('wake-up email failed', err);
  }
}
