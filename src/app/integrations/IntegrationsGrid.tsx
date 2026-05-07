'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IntegrationManifest } from '@/integrations';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';

interface ConnectedIntegration {
  id: string;
  service: string;
  display_name: string | null;
  enabled: boolean;
  last_used_at: string | null;
  created_at: string;
}

export function IntegrationsGrid({
  manifests,
  connected,
}: {
  manifests: IntegrationManifest[];
  connected: ConnectedIntegration[];
}) {
  const [active, setActive] = useState<IntegrationManifest | null>(null);
  const connectedByService = new Map(connected.map((c) => [c.service, c]));

  // Group by category
  const byCategory: Record<string, IntegrationManifest[]> = {};
  for (const m of manifests) {
    (byCategory[m.category] ||= []).push(m);
  }

  return (
    <>
      <div className="space-y-10">
        {Object.entries(byCategory).map(([cat, items]) => (
          <section key={cat}>
            <div className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">
              {cat}
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
              {items.map((m) => {
                const c = connectedByService.get(m.service);
                return (
                  <button
                    key={m.service}
                    onClick={() => setActive(m)}
                    className="bg-[var(--color-paper)] p-5 text-left hover:bg-[var(--color-paper-deep)] transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="display text-2xl">{m.display_name}</div>
                      {c && <Stamp tone="buck">connected</Stamp>}
                    </div>
                    <p className="text-sm text-[var(--color-ink-soft)] leading-snug line-clamp-2">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {active && (
        <ConnectModal
          manifest={active}
          existing={connectedByService.get(active.service)}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

function ConnectModal({
  manifest,
  existing,
  onClose,
}: {
  manifest: IntegrationManifest;
  existing?: ConnectedIntegration;
  onClose: () => void;
}) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: manifest.service, secrets: vals }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(json.error === 'missing_field' ? `Missing required field: ${json.field}` : json.error || 'failed');
      return;
    }
    onClose();
    router.refresh();
  }

  async function remove() {
    if (!existing) return;
    if (!confirm(`Disconnect ${manifest.display_name}?`)) return;
    await fetch(`/api/integrations/${existing.id}`, { method: 'DELETE' });
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      style={{ background: 'rgba(28,22,17,0.4)' }}
      onClick={onClose}
    >
      <div
        className="paper-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-4 border-b border-[var(--color-rule)] flex items-start justify-between">
          <div>
            <Stamp>{manifest.category}</Stamp>
            <h2 className="display text-3xl mt-2">{manifest.display_name}</h2>
            <p className="mt-2 text-[var(--color-ink-soft)]">{manifest.description}</p>
          </div>
          <button onClick={onClose} className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            ✕ Close
          </button>
        </div>

        <div className="px-8 py-6">
          <h3 className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">Setup</h3>
          <pre className="serif text-base leading-relaxed whitespace-pre-wrap text-[var(--color-ink-soft)]">
            {manifest.setup_instructions}
          </pre>
        </div>

        <form onSubmit={save} className="px-8 py-6 border-t border-[var(--color-rule)]">
          <h3 className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">Credentials</h3>
          <div className="space-y-4">
            {manifest.env_vars.map((v) => (
              <div key={v.name}>
                <label className="block mb-1">
                  <span className="mono text-xs uppercase tracking-widest">{v.label}</span>
                  {!v.optional && <span className="text-[var(--color-buck)] mono text-xs ml-1">*</span>}
                </label>
                <input
                  type={v.secret ? 'password' : 'text'}
                  className="input"
                  value={vals[v.name] ?? ''}
                  onChange={(e) => setVals((s) => ({ ...s, [v.name]: e.target.value }))}
                  placeholder={v.example || ''}
                  autoComplete="off"
                />
                {v.help && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{v.help}</p>}
              </div>
            ))}
          </div>

          {err && (
            <p className="mt-4 mono text-xs uppercase tracking-widest text-[var(--color-danger)]">{err}</p>
          )}

          <div className="mt-6 flex items-center justify-between">
            {existing ? (
              <button type="button" onClick={remove} className="mono text-xs uppercase tracking-widest text-[var(--color-danger)] hover:underline">
                Disconnect
              </button>
            ) : <span />}
            <button type="submit" disabled={busy} className="btn btn-buck">
              {busy ? 'Saving…' : existing ? 'Update' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
