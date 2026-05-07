import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureActiveScript } from '@/lib/buck/script_bootstrap';
import { SiteHeader } from '@/components/buck/SiteHeader';
import { Stamp } from '@/components/ui/Stamp';
import { PendingChangeReview } from './PendingChangeReview';
import { ScriptViewer } from './ScriptViewer';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ScriptPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  // Make sure they have an active script
  await ensureActiveScript(user.id);

  const { data: active } = await supabase
    .from('script_versions')
    .select('*')
    .eq('status', 'active')
    .single();

  const { data: pending } = await supabase
    .from('pending_changes')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { data: history } = await supabase
    .from('script_versions')
    .select('id, status, notes, created_by, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <Stamp>The Script</Stamp>
          <h1 className="display text-5xl mt-3 leading-tight">Buck&apos;s mind, in writing.</h1>
          <p className="mt-3 text-[var(--color-ink-soft)] max-w-2xl">
            This is the file Buck runs and the prompt he reads. He may propose changes after a
            session — you decide whether to accept them.
          </p>
        </div>

        {(pending && pending.length > 0) && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="display text-3xl">Proposed changes</h2>
              <Stamp tone="warn">{pending.length} pending</Stamp>
            </div>
            <div className="space-y-6">
              {pending.map((p) => (
                <PendingChangeReview
                  key={p.id}
                  pendingId={p.id}
                  rationale={p.rationale}
                  baseMain={active?.main_ts ?? ''}
                  baseProm={active?.prompt_md ?? ''}
                  proposedMain={p.proposed_main_ts}
                  proposedProm={p.proposed_prompt_md}
                  createdAt={p.created_at}
                />
              ))}
            </div>
          </section>
        )}

        {/* Active version */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="display text-3xl">Active version</h2>
            <Stamp tone="buck">v {(active?.id ?? '').slice(0, 6)}</Stamp>
            {active?.notes && <span className="serif italic text-[var(--color-ink-soft)]">— {active.notes}</span>}
          </div>
          {active && <ScriptViewer mainTs={active.main_ts} promptMd={active.prompt_md} />}
        </section>

        {/* History */}
        {history && history.length > 1 && (
          <section>
            <h2 className="display text-3xl mb-4">History</h2>
            <div className="border border-[var(--color-rule)]">
              {history.map((h, i) => (
                <div
                  key={h.id}
                  className={`px-5 py-4 flex items-center gap-4 ${i < history.length - 1 ? 'border-b border-[var(--color-rule)]' : ''}`}
                >
                  <Stamp tone={h.status === 'active' ? 'buck' : 'default'}>{h.status}</Stamp>
                  <span className="mono text-xs text-[var(--color-ink-faint)]">{h.id.slice(0, 8)}</span>
                  <span className="mono text-xs text-[var(--color-ink-faint)]">by {h.created_by}</span>
                  <span className="serif text-sm flex-1 truncate">{h.notes || '—'}</span>
                  <span className="mono text-xs text-[var(--color-ink-faint)]">{relativeTime(h.created_at)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
