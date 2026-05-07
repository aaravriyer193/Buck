'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';
import { DiffView } from '@/components/ui/DiffView';
import { relativeTime } from '@/lib/utils';

interface Props {
  pendingId: string;
  rationale: string;
  baseMain: string;
  baseProm: string;
  proposedMain: string;
  proposedProm: string;
  createdAt: string;
}

export function PendingChangeReview(props: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'main' | 'prompt'>('main');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const mainChanged = props.baseMain !== props.proposedMain;
  const promChanged = props.baseProm !== props.proposedProm;

  async function decide(decision: 'approve' | 'reject') {
    setBusy(decision);
    await fetch(`/api/script/pending/${props.pendingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <PaperCard className="!p-0">
      <div className="px-6 pt-5 pb-4 border-b border-[var(--color-rule)]">
        <div className="flex items-center gap-3 mb-2">
          <Stamp tone="warn">Buck proposes</Stamp>
          <span className="mono text-xs text-[var(--color-ink-faint)]">{relativeTime(props.createdAt)}</span>
        </div>
        <p className="serif text-lg leading-relaxed italic">
          {props.rationale}
        </p>
      </div>

      <div className="flex border-b border-[var(--color-rule)]">
        <button
          onClick={() => setTab('main')}
          className={`px-5 py-3 mono text-xs uppercase tracking-widest ${tab === 'main' ? 'text-[var(--color-buck)] border-b-2 border-[var(--color-buck)]' : 'text-[var(--color-ink-faint)]'}`}
        >
          main.ts {mainChanged && <span className="text-[var(--color-buck)]">●</span>}
        </button>
        <button
          onClick={() => setTab('prompt')}
          className={`px-5 py-3 mono text-xs uppercase tracking-widest ${tab === 'prompt' ? 'text-[var(--color-buck)] border-b-2 border-[var(--color-buck)]' : 'text-[var(--color-ink-faint)]'}`}
        >
          prompt.md {promChanged && <span className="text-[var(--color-buck)]">●</span>}
        </button>
      </div>

      <div className="p-6">
        {tab === 'main' ? (
          mainChanged ? (
            <DiffView before={props.baseMain} after={props.proposedMain} />
          ) : (
            <p className="serif italic text-[var(--color-ink-faint)]">No changes to main.ts.</p>
          )
        ) : (
          promChanged ? (
            <DiffView before={props.baseProm} after={props.proposedProm} />
          ) : (
            <p className="serif italic text-[var(--color-ink-faint)]">No changes to prompt.md.</p>
          )
        )}
      </div>

      <div className="px-6 py-4 border-t border-[var(--color-rule)] flex items-center justify-end gap-3">
        <button onClick={() => decide('reject')} disabled={!!busy} className="btn">
          {busy === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
        <button onClick={() => decide('approve')} disabled={!!busy} className="btn btn-buck">
          {busy === 'approve' ? 'Approving…' : 'Approve & promote'}
        </button>
      </div>
    </PaperCard>
  );
}
