'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaperCard } from '@/components/ui/PaperCard';

interface Initial {
  display_name: string;
  notification_email: string;
  monthly_budget_usd: number;
  per_session_budget_usd: number;
  self_modify_mode: 'approval' | 'auto' | 'off';
}

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [vals, setVals] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vals),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 1800);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <PaperCard>
        <h2 className="display text-2xl mb-4">You</h2>
        <div className="space-y-4">
          <Field label="Display name">
            <input
              className="input"
              value={vals.display_name}
              onChange={(e) => setVals((s) => ({ ...s, display_name: e.target.value }))}
            />
          </Field>
          <Field label="Notification email" help="Where Buck sends the wake-up summary.">
            <input
              type="email"
              className="input"
              value={vals.notification_email}
              onChange={(e) => setVals((s) => ({ ...s, notification_email: e.target.value }))}
            />
          </Field>
        </div>
      </PaperCard>

      <PaperCard>
        <h2 className="display text-2xl mb-4">Budget</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Per-session cap (USD)" help="Buck halts gracefully if a single session hits this.">
            <input
              type="number" step="0.5" min="0"
              className="input"
              value={vals.per_session_budget_usd}
              onChange={(e) => setVals((s) => ({ ...s, per_session_budget_usd: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Monthly budget (USD)" help="Cumulative ceiling across all sessions this month.">
            <input
              type="number" step="5" min="0"
              className="input"
              value={vals.monthly_budget_usd}
              onChange={(e) => setVals((s) => ({ ...s, monthly_budget_usd: Number(e.target.value) }))}
            />
          </Field>
        </div>
      </PaperCard>

      <PaperCard>
        <h2 className="display text-2xl mb-4">Self-modification</h2>
        <p className="text-[var(--color-ink-soft)] mb-4 leading-relaxed">
          After each session Buck may propose a change to his own script or prompt.
          You decide what to do with it.
        </p>
        <div className="space-y-2">
          {(['approval', 'auto', 'off'] as const).map((m) => (
            <label key={m} className="flex items-start gap-3 cursor-pointer p-3 border border-[var(--color-rule)] hover:bg-[var(--color-paper-deep)]">
              <input
                type="radio" name="self_modify_mode"
                checked={vals.self_modify_mode === m}
                onChange={() => setVals((s) => ({ ...s, self_modify_mode: m }))}
                className="mt-1 accent-[var(--color-buck)]"
              />
              <div>
                <div className="mono text-xs uppercase tracking-widest">{labelFor(m)}</div>
                <div className="text-sm text-[var(--color-ink-soft)] mt-1">{descFor(m)}</div>
              </div>
            </label>
          ))}
        </div>
      </PaperCard>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="mono text-xs uppercase tracking-widest text-[var(--color-buck)]">saved ✓</span>}
        <button type="submit" disabled={busy} className="btn btn-buck">
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mono text-xs uppercase tracking-widest">{label}</label>
      <div className="mt-1">{children}</div>
      {help && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{help}</p>}
    </div>
  );
}

function labelFor(m: 'approval' | 'auto' | 'off'): string {
  return m === 'approval' ? 'Approval-gated (recommended)' :
         m === 'auto' ? 'Auto-apply with rollback' :
         'Off';
}

function descFor(m: 'approval' | 'auto' | 'off'): string {
  return m === 'approval' ? 'Buck proposes changes; you review and approve. Locked safety regions are protected.' :
         m === 'auto' ? 'Apply automatically; auto-rollback if 3 consecutive sessions fail.' :
         'Buck does not propose changes to himself.';
}
