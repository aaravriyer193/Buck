'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';
import { TypingText } from '@/components/buck/TypingText';
import { formatUSD, formatDuration, relativeTime } from '@/lib/utils';
import type {
  Session, SessionEvent, Diary, ApprovalRequest, Task,
} from '@/lib/supabase/types';

interface Props {
  session: Session;
  initialTasks: Task[];
  initialEvents: SessionEvent[];
  initialDiary: Diary | null;
  initialApproval: ApprovalRequest | null;
}

export function SessionLive({ session: initial, initialTasks, initialEvents, initialDiary, initialApproval }: Props) {
  const [session, setSession] = useState<Session>(initial);
  const [events, setEvents] = useState<SessionEvent[]>(initialEvents);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [diary, setDiary] = useState<Diary | null>(initialDiary);
  const [approval, setApproval] = useState<ApprovalRequest | null>(initialApproval);
  const tailRef = useRef<HTMLDivElement>(null);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`session:${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_events', filter: `session_id=eq.${session.id}` },
        (payload) => {
          setEvents((prev) => [...prev, payload.new as SessionEvent]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          setSession(payload.new as Session);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'approval_requests', filter: `session_id=eq.${session.id}` },
        (payload) => {
          if ((payload.new as ApprovalRequest).status === 'pending') {
            setApproval(payload.new as ApprovalRequest);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'approval_requests', filter: `session_id=eq.${session.id}` },
        (payload) => {
          const next = payload.new as ApprovalRequest;
          if (next.status !== 'pending') setApproval(null);
          else setApproval(next);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'diaries', filter: `session_id=eq.${session.id}` },
        (payload) => {
          setDiary(payload.new as Diary);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id]);

  // Periodically refetch tasks (simpler than wiring another channel)
  useEffect(() => {
    if (!['queued', 'running'].includes(session.status)) return;
    const supabase = createClient();
    const i = setInterval(async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, status, result_summary')
        .in('id', session.task_ids);
      if (data) setTasks(data as Task[]);
    }, 3000);
    return () => clearInterval(i);
  }, [session.status, session.task_ids]);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [events.length]);

  const isLive = session.status === 'queued' || session.status === 'running';
  const duration = useMemo(() => {
    if (!session.started_at) return '—';
    const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
    return formatDuration(end - new Date(session.started_at).getTime());
  }, [session.started_at, session.ended_at, events.length]);

  const tasksByStatus = useMemo(() => {
    return {
      completed: tasks.filter((t) => t.status === 'completed').length,
      skipped: tasks.filter((t) => t.status === 'skipped').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
      pending: tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
    };
  }, [tasks]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      {/* Header strip */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] hover:text-[var(--color-buck)]">
            ← All sessions
          </Link>
          <span className="mono text-xs text-[var(--color-ink-faint)]">{session.id.slice(0, 8)}</span>
        </div>
        {isLive && (
          <CancelButton sessionId={session.id} />
        )}
      </div>

      {/* Title + status */}
      <div className="grid md:grid-cols-12 gap-8 mb-10">
        <div className="md:col-span-8">
          <Stamp tone={isLive ? 'buck' : 'default'}>
            {session.status === 'running' ? '◉ live' :
             session.status === 'queued' ? 'queued' :
             session.status === 'completed' ? '✓ completed' :
             session.status === 'budget_halt' ? '! budget halt' :
             session.status === 'cancelled' ? 'cancelled' :
             '✗ ' + session.status}
          </Stamp>
          <h1 className="display text-5xl mt-4 leading-tight">
            {isLive ? <em>Buck is at it.</em> : session.status === 'completed' ? 'Buck has clocked off.' : 'Session ended.'}
          </h1>
          <p className="mt-3 text-[var(--color-ink-soft)]">
            {relativeTime(session.created_at)} · model {session.model} · duration {duration}
          </p>
        </div>

        <div className="md:col-span-4 grid grid-cols-2 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
          <div className="bg-[var(--color-paper)] p-4">
            <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)]">Spent</div>
            <div className="display text-3xl mt-1">
              <SpendCounter value={Number(session.cost_usd)} live={isLive} />
            </div>
          </div>
          <div className="bg-[var(--color-paper)] p-4">
            <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)]">Tasks</div>
            <div className="display text-3xl mt-1">
              <span className="text-[var(--color-buck)]">{tasksByStatus.completed}</span>
              <span className="text-[var(--color-ink-faint)]"> / {tasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {approval && <ApprovalCard approval={approval} />}

      <div className="grid md:grid-cols-12 gap-8">
        {/* Tasks */}
        <div className="md:col-span-4">
          <h2 className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">
            The list
          </h2>
          <PaperCard className="!p-0">
            {tasks.length === 0 && (
              <div className="p-5 text-[var(--color-ink-faint)]">No tasks.</div>
            )}
            {tasks.map((t, i) => (
              <div
                key={t.id}
                className={`p-5 ${i < tasks.length - 1 ? 'border-b border-[var(--color-rule)]' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <TaskCheckbox status={t.status} />
                  <div className="flex-1 min-w-0">
                    <p className={`serif text-base leading-snug ${t.status === 'completed' ? 'text-[var(--color-ink-faint)] line-through' : ''}`}>
                      {t.title}
                    </p>
                    {t.result_summary && (
                      <p className="mt-1 mono text-xs text-[var(--color-ink-faint)]">{t.result_summary}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </PaperCard>
        </div>

        {/* Live feed */}
        <div className="md:col-span-8">
          <h2 className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">
            {isLive ? 'Buck — thinking out loud' : 'Session log'}
          </h2>
          <PaperCard className="!p-0">
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              {events.length === 0 && (
                <p className="text-[var(--color-ink-faint)] italic">
                  {isLive ? 'Buck is waking up…' : 'No events recorded.'}
                </p>
              )}
              {events.map((e) => (
                <EventRow key={e.id} ev={e} animate={isLive && e === events[events.length - 1]} />
              ))}
              <div ref={tailRef} />
            </div>
          </PaperCard>
        </div>
      </div>

      {/* Diary entry — appears after session ends */}
      {diary && (
        <div className="mt-12">
          <h2 className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">
            The diary
          </h2>
          <PaperCard ruled className="serif text-lg leading-[1.5em] py-10 px-10">
            <div className="display italic text-3xl leading-tight mb-6">
              {new Date(diary.created_at).toLocaleString(undefined, {
                weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </div>
            <p className="whitespace-pre-wrap">{diary.summary}</p>
            {diary.what_worked && (
              <>
                <br /><p><em>What worked:</em> {diary.what_worked}</p>
              </>
            )}
            {diary.what_failed && (
              <>
                <br /><p><em>What I&apos;d change:</em> {diary.what_failed}</p>
              </>
            )}
            <br />
            <p className="text-[var(--color-ink-faint)] mono text-xs">— Buck</p>

            {(diary.proposed_changes as { has_proposal?: boolean })?.has_proposal && (
              <div className="mt-8 p-4 border border-[var(--color-buck)]">
                <Stamp tone="buck">Proposed change</Stamp>
                <p className="mt-2">Buck has a change he&apos;d like to make to his own script.</p>
                <Link href="/script" className="btn btn-buck mt-4 inline-flex">Review →</Link>
              </div>
            )}
          </PaperCard>
        </div>
      )}
    </main>
  );
}

function TaskCheckbox({ status }: { status: Task['status'] }) {
  if (status === 'completed') {
    return <div className="mt-1 w-4 h-4 border border-[var(--color-buck)] bg-[var(--color-buck)] text-[var(--color-paper)] flex items-center justify-center text-[10px]">✓</div>;
  }
  if (status === 'skipped') {
    return <div className="mt-1 w-4 h-4 border border-[var(--color-ink-faint)] text-[var(--color-ink-faint)] flex items-center justify-center text-[10px]">—</div>;
  }
  if (status === 'failed') {
    return <div className="mt-1 w-4 h-4 border border-[var(--color-danger)] text-[var(--color-danger)] flex items-center justify-center text-[10px]">✗</div>;
  }
  if (status === 'in_progress') {
    return <div className="mt-1 w-4 h-4 border border-[var(--color-buck)] flex items-center justify-center"><span className="block w-1.5 h-1.5 bg-[var(--color-buck)] animate-pulse" /></div>;
  }
  return <div className="mt-1 w-4 h-4 border border-[var(--color-rule)]" />;
}

function EventRow({ ev, animate }: { ev: SessionEvent; animate: boolean }) {
  const ts = new Date(ev.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (ev.type === 'thought') {
    const text = String((ev.payload as { text?: string }).text ?? '');
    return (
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] pt-1">{ts}</div>
        <div className="serif italic leading-relaxed text-[var(--color-ink-soft)]">
          {animate ? <TypingText text={text} cps={70} cursor={false} /> : text}
        </div>
      </div>
    );
  }

  if (ev.type === 'tool_call') {
    const p = ev.payload as { name?: string; args?: unknown };
    return (
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] pt-1">{ts}</div>
        <div className="mono text-sm">
          <span className="text-[var(--color-buck)]">→</span>{' '}
          <span className="text-[var(--color-ink)]">{p.name}</span>
          <span className="text-[var(--color-ink-faint)]">({truncJSON(p.args)})</span>
        </div>
      </div>
    );
  }

  if (ev.type === 'tool_result') {
    const p = ev.payload as { name?: string; result?: unknown };
    return (
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] pt-1">{ts}</div>
        <div className="mono text-xs text-[var(--color-ink-faint)] pl-4 border-l border-[var(--color-rule)]">
          {truncJSON(p.result, 280)}
        </div>
      </div>
    );
  }

  if (ev.type === 'error') {
    return (
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-danger)] pt-1">{ts}</div>
        <div className="mono text-sm text-[var(--color-danger)]">
          ⚠ {String((ev.payload as { message?: string }).message ?? '')}
        </div>
      </div>
    );
  }

  if (ev.type === 'budget_warning') {
    return (
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-warn)] pt-1">{ts}</div>
        <div className="mono text-sm text-[var(--color-warn)]">
          $ {String((ev.payload as { text?: string }).text ?? '')}
        </div>
      </div>
    );
  }

  if (ev.type === 'approval_request') {
    return (
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-warn)] pt-1">{ts}</div>
        <div className="mono text-sm">
          ⏸ Buck pauses for approval — {String((ev.payload as { description?: string }).description ?? '')}
        </div>
      </div>
    );
  }

  if (ev.type === 'approval_decision') {
    const decision = String((ev.payload as { decision?: string }).decision ?? '');
    return (
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] pt-1">{ts}</div>
        <div className="mono text-sm">▶ Buck resumes ({decision})</div>
      </div>
    );
  }

  if (ev.type === 'task_completed' || ev.type === 'task_skipped' || ev.type === 'task_started') {
    const verb = ev.type === 'task_completed' ? 'finished' : ev.type === 'task_skipped' ? 'skipped' : 'started';
    return (
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] pt-1">{ts}</div>
        <div className="mono text-xs text-[var(--color-ink-faint)]">— task {verb}</div>
      </div>
    );
  }

  // system / fallback
  return (
    <div className="grid grid-cols-[80px_1fr] gap-4">
      <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] pt-1">{ts}</div>
      <div className="mono text-xs text-[var(--color-ink-faint)] italic">
        {String((ev.payload as { message?: string }).message ?? JSON.stringify(ev.payload))}
      </div>
    </div>
  );
}

function truncJSON(v: unknown, max = 120): string {
  if (v === undefined || v === null) return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function SpendCounter({ value, live }: { value: number; live: boolean }) {
  // While live, gently animate the trailing digit so it feels alive even
  // between insert events.
  const [shown, setShown] = useState(value);
  useEffect(() => {
    setShown(value);
  }, [value]);
  useEffect(() => {
    if (!live) return;
    const i = setInterval(() => {
      // Subtle shimmer at sub-cent level
      setShown((v) => v + (Math.random() < 0.5 ? 0 : 0.0001));
    }, 1200);
    return () => clearInterval(i);
  }, [live]);
  return <>{formatUSD(shown, { precision: shown < 1 ? 4 : 2 })}</>;
}

function CancelButton({ sessionId }: { sessionId: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!confirm('Cancel this session?')) return;
    setBusy(true);
    await fetch(`/api/sessions/${sessionId}/cancel`, { method: 'POST' });
    setBusy(false);
  }
  return (
    <button onClick={go} disabled={busy} className="btn">
      {busy ? 'Cancelling…' : 'Cancel'}
    </button>
  );
}

function ApprovalCard({ approval }: { approval: ApprovalRequest }) {
  const [busy, setBusy] = useState<'approve' | 'deny' | 'silence' | null>(null);
  async function decide(decision: 'approved' | 'denied', dontAskAgain = false) {
    setBusy(decision === 'approved' ? (dontAskAgain ? 'silence' : 'approve') : 'deny');
    await fetch(`/api/approvals/${approval.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, dont_ask_again: dontAskAgain }),
    });
  }
  return (
    <div className="mb-10 reveal">
      <PaperCard className="border-[var(--color-warn)]">
        <div className="flex items-center gap-3 mb-3">
          <Stamp tone="warn">Buck is paused</Stamp>
          <span className="mono text-xs text-[var(--color-ink-faint)]">{approval.action_type}</span>
        </div>
        <p className="serif text-xl leading-relaxed">
          He wants to: <strong>{approval.description}</strong>
        </p>
        {approval.payload && (
          <pre className="mt-4 mono text-xs bg-[var(--color-paper-deep)] p-3 border border-[var(--color-rule)] overflow-x-auto">
            {JSON.stringify(approval.payload, null, 2)}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <button onClick={() => decide('approved')} disabled={!!busy} className="btn btn-buck">
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button onClick={() => decide('denied')} disabled={!!busy} className="btn">
            {busy === 'deny' ? 'Denying…' : 'Deny & skip'}
          </button>
          <button
            onClick={() => decide('approved', true)}
            disabled={!!busy}
            className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] hover:text-[var(--color-buck)] underline underline-offset-4 ml-auto"
            title={`Approve and stop asking about "${approval.action_type}" actions in future sessions`}
          >
            {busy === 'silence' ? 'Saving…' : `Approve · don't ask again for ${approval.action_type}`}
          </button>
        </div>
      </PaperCard>
    </div>
  );
}