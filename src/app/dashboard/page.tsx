import Link from 'next/link';
import { getStamp, getGreeting } from '@/lib/greetings';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/buck/SiteHeader';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';
import { formatUSD, relativeTime, formatDuration } from '@/lib/utils';
import type { Session, Diary } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, monthly_budget_usd')
    .eq('id', user.id)
    .single();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: diaries } = await supabase
    .from('diaries')
    .select('session_id, summary')
    .order('created_at', { ascending: false })
    .limit(20);
  const diaryBySession = Object.fromEntries((diaries ?? []).map((d) => [d.session_id, d]));

  const { data: monthlySpendData } = await supabase.rpc('user_monthly_spend', { p_user_id: user.id });
  const monthlySpend = Number(monthlySpendData ?? 0);
  const monthlyBudget = Number(profile?.monthly_budget_usd ?? 100);
  const pctUsed = Math.min(100, (monthlySpend / Math.max(monthlyBudget, 0.01)) * 100);

  const { count: pendingApprovals } = await supabase
    .from('approval_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: pendingChanges } = await supabase
    .from('pending_changes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Greeting */}
        <div className="flex items-end justify-between mb-12 reveal">
          <div>
            <Stamp>{getStamp()}</Stamp>
            <h1 className="display text-5xl mt-3 leading-tight">
              {getGreeting()},{' '}
              <em>{(profile?.display_name || user.email?.split('@')[0] || 'friend').split(' ')[0]}</em>.
            </h1>
          </div>
          <Link href="/sessions/new" className="btn btn-buck">+ New session</Link>
        </div>

        {/* Stats strip */}
        <div className="grid sm:grid-cols-3 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)] mb-10">
          <StatCell
            label="This month"
            value={formatUSD(monthlySpend)}
            sub={`of ${formatUSD(monthlyBudget)} budget`}
            pct={pctUsed}
          />
          <StatCell
            label="Pending approvals"
            value={String(pendingApprovals ?? 0)}
            sub={pendingApprovals ? <Link href="#approvals" className="underline">review →</Link> : 'all clear'}
          />
          <StatCell
            label="Buck's proposals"
            value={String(pendingChanges ?? 0)}
            sub={pendingChanges ? <Link href="/script" className="underline">see them →</Link> : 'no proposed changes'}
          />
        </div>

        {/* Pending approvals */}
        {(pendingApprovals ?? 0) > 0 && (
          <PendingApprovals userId={user.id} />
        )}

        {/* Sessions list */}
        <div className="flex items-end justify-between mb-6">
          <h2 className="display text-3xl">Sessions</h2>
          <span className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">
            most recent first
          </span>
        </div>

        {(!sessions || sessions.length === 0) ? (
          <PaperCard className="text-center py-16">
            <p className="display italic text-2xl">No sessions yet.</p>
            <p className="mt-2 text-[var(--color-ink-soft)]">Hand Buck a task list and clock out.</p>
            <Link href="/sessions/new" className="btn btn-buck mt-6 inline-flex">+ Start one</Link>
          </PaperCard>
        ) : (
          <div className="border border-[var(--color-rule)] bg-[var(--color-paper)]">
            {sessions.map((s, i) => (
              <SessionRow
                key={s.id}
                session={s as Session}
                diary={diaryBySession[s.id] as Diary | undefined}
                isLast={i === sessions.length - 1}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function nightOrDay() {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Hello';
  return 'Good evening';
}

function StatCell({
  label,
  value,
  sub,
  pct,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  pct?: number;
}) {
  return (
    <div className="bg-[var(--color-paper)] p-6">
      <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)]">{label}</div>
      <div className="display text-4xl mt-2">{value}</div>
      <div className="mt-2 text-sm text-[var(--color-ink-soft)]">{sub}</div>
      {typeof pct === 'number' && (
        <div className="mt-3 h-1 bg-[var(--color-paper-deep)] border border-[var(--color-rule)]">
          <div
            className="h-full bg-[var(--color-buck)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SessionRow({ session, diary, isLast }: { session: Session; diary?: Diary; isLast: boolean }) {
  const dur = session.started_at && session.ended_at
    ? formatDuration(new Date(session.ended_at).getTime() - new Date(session.started_at).getTime())
    : session.status === 'running' ? 'running' : '—';

  return (
    <Link
      href={`/sessions/${session.id}`}
      className={`block px-6 py-5 hover:bg-[var(--color-paper-deep)] transition ${isLast ? '' : 'border-b border-[var(--color-rule)]'}`}
    >
      <div className="flex items-start gap-6">
        <div className="w-32 shrink-0 mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">
          {relativeTime(session.created_at)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <StatusStamp status={session.status} />
            <span className="mono text-xs text-[var(--color-ink-faint)]">{session.model}</span>
            <span className="mono text-xs text-[var(--color-ink-faint)]">· {session.task_ids.length} task{session.task_ids.length === 1 ? '' : 's'}</span>
            <span className="mono text-xs text-[var(--color-ink-faint)]">· {dur}</span>
          </div>
          <p className="serif text-base leading-snug truncate text-[var(--color-ink-soft)]">
            {diary?.summary || (session.status === 'running' ? 'Buck is at it.' : session.error || 'No diary yet.')}
          </p>
        </div>
        <div className="shrink-0 mono text-sm text-[var(--color-ink-soft)]">
          {formatUSD(Number(session.cost_usd))}
        </div>
      </div>
    </Link>
  );
}

function StatusStamp({ status }: { status: Session['status'] }) {
  const tone =
    status === 'completed' ? 'buck' :
    status === 'running' ? 'buck' :
    status === 'budget_halt' ? 'warn' :
    status === 'failed' ? 'danger' :
    'default';
  const label =
    status === 'running' ? '◉ running' :
    status === 'completed' ? '✓ completed' :
    status === 'budget_halt' ? '! budget halt' :
    status === 'cancelled' ? 'cancelled' :
    status === 'failed' ? '✗ failed' :
    'queued';
  return <Stamp tone={tone}>{label}</Stamp>;
}

async function PendingApprovals({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: approvals } = await supabase
    .from('approval_requests')
    .select('id, action_type, description, requested_at, session_id')
    .eq('status', 'pending')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });

  if (!approvals || approvals.length === 0) return null;

  return (
    <div id="approvals" className="mb-10">
      <div className="flex items-end justify-between mb-3">
        <h2 className="display text-2xl">Buck is waiting on you.</h2>
        <Stamp tone="warn">{approvals.length} pending</Stamp>
      </div>
      <PaperCard className="!p-0">
        {approvals.map((a, i) => (
          <div key={a.id} className={`p-5 flex items-center gap-6 ${i < approvals.length - 1 ? 'border-b border-[var(--color-rule)]' : ''}`}>
            <Stamp tone="warn">{a.action_type}</Stamp>
            <div className="flex-1 min-w-0">
              <p className="serif text-base truncate">{a.description}</p>
              <p className="mono text-xs text-[var(--color-ink-faint)] mt-1">
                {relativeTime(a.requested_at)} · session {a.session_id.slice(0, 8)}
              </p>
            </div>
            <Link href={`/sessions/${a.session_id}`} className="btn">Open →</Link>
          </div>
        ))}
      </PaperCard>
    </div>
  );
}
