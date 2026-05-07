'use client';

import { useState } from 'react';
import { PaperCard } from '@/components/ui/PaperCard';

export function ScriptViewer({ mainTs, promptMd }: { mainTs: string; promptMd: string }) {
  const [tab, setTab] = useState<'main' | 'prompt'>('main');

  return (
    <PaperCard className="!p-0">
      <div className="flex border-b border-[var(--color-rule)]">
        <button
          onClick={() => setTab('main')}
          className={`px-5 py-3 mono text-xs uppercase tracking-widest ${tab === 'main' ? 'text-[var(--color-buck)] border-b-2 border-[var(--color-buck)]' : 'text-[var(--color-ink-faint)]'}`}
        >
          main.ts
        </button>
        <button
          onClick={() => setTab('prompt')}
          className={`px-5 py-3 mono text-xs uppercase tracking-widest ${tab === 'prompt' ? 'text-[var(--color-buck)] border-b-2 border-[var(--color-buck)]' : 'text-[var(--color-ink-faint)]'}`}
        >
          prompt.md
        </button>
      </div>
      <pre className="p-6 mono text-xs leading-relaxed overflow-x-auto whitespace-pre">
        {tab === 'main' ? mainTs : promptMd}
      </pre>
    </PaperCard>
  );
}
