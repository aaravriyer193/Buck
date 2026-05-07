'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaperCard } from '@/components/ui/PaperCard';

export function NewSessionForm({ canStart }: { canStart: boolean }) {
  const router = useRouter();
  const [taskList, setTaskList] = useState('');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lines = taskList.split('\n').map((l) => l.trim()).filter(Boolean);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0 || !canStart) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_titles: lines,
          prompt: extraPrompt || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'failed');
      router.push(`/sessions/${json.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start}>
      <PaperCard className="!p-0">
        <div className="px-6 pt-5 pb-3 border-b border-[var(--color-rule)] flex items-center justify-between">
          <span className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">
            Task list
          </span>
          <span className="mono text-xs text-[var(--color-ink-faint)]">
            {lines.length} {lines.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        <textarea
          autoFocus
          value={taskList}
          onChange={(e) => setTaskList(e.target.value)}
          placeholder={`Reply to investor emails older than 24h\nReview and merge the dependabot PRs in the api repo\nDraft tomorrow's standup notes from yesterday's Linear updates`}
          className="textarea border-0 !min-h-[220px] focus:!shadow-none"
          rows={10}
        />
      </PaperCard>

      <details className="mt-6">
        <summary className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] cursor-pointer hover:text-[var(--color-buck)]">
          + Extra context for Buck (optional)
        </summary>
        <div className="mt-3">
          <textarea
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            placeholder="Voice, preferences, things to watch out for. Buck will read this before starting."
            className="textarea !min-h-[100px]"
          />
        </div>
      </details>

      {err && (
        <p className="mt-4 mono text-xs uppercase tracking-widest text-[var(--color-danger)]">
          {err}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="serif italic text-[var(--color-ink-soft)]">
          Buck will start now and email you when he's done.
        </p>
        <button
          type="submit"
          disabled={busy || lines.length === 0 || !canStart}
          className="btn btn-buck"
        >
          {busy ? 'Sending Buck in…' : 'Start session →'}
        </button>
      </div>
    </form>
  );
}
