// =============================================================================
// Buck — wake-up email
// =============================================================================
// Beige paper, serif, the same aesthetic as the dashboard.
// Sent when a session ends, regardless of outcome.
// =============================================================================

import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';

export async function sendWakeUpEmail(sessionId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BUCK_NOTIFICATION_FROM;
  if (!apiKey || !from) return; // No-op if email not configured

  const supabase = createServiceClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, started_at, ended_at, cost_usd, confidence_score, task_ids, error')
    .eq('id', sessionId)
    .single();
  if (!session) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, notification_email')
    .eq('id', (await supabase.from('sessions').select('user_id').eq('id', sessionId).single()).data!.user_id)
    .single();

  if (!profile?.notification_email) return;

  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, status, result_summary')
    .in('id', session.task_ids);

  const { data: diary } = await supabase
    .from('diaries')
    .select('summary, what_worked, what_failed, proposed_changes')
    .eq('session_id', sessionId)
    .single();

  const completed = (tasks ?? []).filter((t: { status: string }) => t.status === 'completed').length;
  const skipped = (tasks ?? []).filter((t: { status: string }) => t.status === 'skipped').length;
  const failed = (tasks ?? []).filter((t: { status: string }) => t.status === 'failed').length;
  const total = (tasks ?? []).length;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const sessionUrl = `${appUrl}/sessions/${sessionId}`;
  const proposalUrl = (diary?.proposed_changes as { has_proposal?: boolean })?.has_proposal
    ? `${appUrl}/script`
    : null;

  const html = renderEmail({
    name: profile.display_name || 'friend',
    statusLine: statusLineFor(session.status),
    completed,
    skipped,
    failed,
    total,
    cost: Number(session.cost_usd ?? 0),
    summary: diary?.summary || 'Buck did not record a diary entry this session.',
    sessionUrl,
    proposalUrl,
    error: session.error,
  });

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: from,
    to: profile.notification_email,
    subject: subjectFor(session.status, completed, total),
    html,
  });
}

function statusLineFor(status: string): string {
  switch (status) {
    case 'completed':    return 'Buck has clocked off.';
    case 'budget_halt':  return 'Buck stopped at the budget cap.';
    case 'cancelled':    return 'Buck was cancelled.';
    case 'failed':       return 'Buck hit an error.';
    default:             return `Session ended (${status}).`;
  }
}

function subjectFor(status: string, completed: number, total: number): string {
  if (status === 'completed') return `Buck finished ${completed}/${total} tasks while you slept`;
  if (status === 'budget_halt') return `Buck paused at the budget cap`;
  if (status === 'cancelled') return `Buck was cancelled`;
  return `Buck needs your attention`;
}

function renderEmail(args: {
  name: string;
  statusLine: string;
  completed: number;
  skipped: number;
  failed: number;
  total: number;
  cost: number;
  summary: string;
  sessionUrl: string;
  proposalUrl: string | null;
  error: string | null;
}): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4ecd8;font-family:Georgia,'Iowan Old Style',serif;color:#1c1611;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4ecd8;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#f4ecd8;border:1px solid #c8bb9a;">
      <tr><td style="padding:32px 32px 8px 32px;">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;color:#8b7e68;text-transform:uppercase;">— Diary &nbsp;·&nbsp; Buck —</div>
      </td></tr>
      <tr><td style="padding:8px 32px 24px 32px;">
        <h1 style="margin:0;font-size:30px;font-weight:400;letter-spacing:-0.01em;font-family:Georgia,serif;font-style:italic;">Good morning, ${escapeHtml(args.name)}.</h1>
        <p style="margin:8px 0 0 0;font-size:17px;line-height:1.5;">${escapeHtml(args.statusLine)}</p>
      </td></tr>
      <tr><td style="padding:0 32px;"><div style="height:1px;background:#c8bb9a;"></div></td></tr>
      <tr><td style="padding:24px 32px;">
        <table width="100%"><tr>
          <td style="padding-right:16px;">
            <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#8b7e68;text-transform:uppercase;">Done</div>
            <div style="font-size:32px;font-weight:400;color:#3a5a40;font-family:Georgia,serif;">${args.completed}</div>
          </td>
          <td style="padding-right:16px;">
            <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#8b7e68;text-transform:uppercase;">Skipped</div>
            <div style="font-size:32px;font-weight:400;font-family:Georgia,serif;">${args.skipped}</div>
          </td>
          <td style="padding-right:16px;">
            <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#8b7e68;text-transform:uppercase;">Failed</div>
            <div style="font-size:32px;font-weight:400;color:#8b2c1c;font-family:Georgia,serif;">${args.failed}</div>
          </td>
          <td>
            <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#8b7e68;text-transform:uppercase;">Spent</div>
            <div style="font-size:32px;font-weight:400;font-family:Georgia,serif;">$${args.cost.toFixed(args.cost < 1 ? 4 : 2)}</div>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:0 32px;"><div style="height:1px;background:#c8bb9a;"></div></td></tr>
      <tr><td style="padding:24px 32px;">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#8b7e68;text-transform:uppercase;margin-bottom:8px;">From the diary</div>
        <p style="margin:0;font-size:16px;line-height:1.65;">${escapeHtml(args.summary)}</p>
      </td></tr>
      ${args.error ? `
      <tr><td style="padding:0 32px 24px 32px;">
        <div style="border:1px solid #8b2c1c;padding:12px 16px;color:#8b2c1c;font-family:'Courier New',monospace;font-size:13px;">
          ${escapeHtml(args.error)}
        </div>
      </td></tr>` : ''}
      ${args.proposalUrl ? `
      <tr><td style="padding:0 32px 24px 32px;">
        <div style="border:1px solid #3a5a40;padding:12px 16px;font-size:14px;">
          Buck has a proposed change to his own script. <a href="${args.proposalUrl}" style="color:#3a5a40;">Review it →</a>
        </div>
      </td></tr>` : ''}
      <tr><td style="padding:8px 32px 32px 32px;">
        <a href="${args.sessionUrl}" style="display:inline-block;padding:11px 20px;background:#3a5a40;color:#f4ecd8;text-decoration:none;font-family:'Courier New',monospace;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;border:1px solid #3a5a40;">Open session</a>
      </td></tr>
      <tr><td style="padding:24px 32px;border-top:1px solid #c8bb9a;">
        <div style="font-family:Georgia,serif;font-style:italic;color:#8b7e68;font-size:13px;">Stop working. Start sleeping.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
