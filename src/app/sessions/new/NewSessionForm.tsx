'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaperCard } from '@/components/ui/PaperCard';

const MODEL_OPTIONS = [
  { group: 'Recommended', models: [
    { value: 'anthropic/claude-sonnet-4.6',           label: 'Claude Sonnet 4.6',  hint: 'sharpest reasoning · best for complex tasks' },
    { value: 'openai/gpt-5',                      label: 'GPT-5',          hint: 'solid all-rounder · good tool use' },
  ]},
  { group: 'Cheerful', models: [
    { value: 'z-ai/glm-5',                         label: 'GLM-5',            hint: 'Long running and cheap · default' },
    { value: 'nvidia/nemotron-3-super-120b-a12b',   label: 'Nemotron 3',       hint: 'verbose, capable, very cheap' },
    { value: 'meta-llama/llama-3.3-70b-instruct',   label: 'Llama 3.3 70B',    hint: 'open-weight workhorse' },
  ]},
];

export function NewSessionForm({ canStart }: { canStart: boolean }) {
  const router = useRouter();
  const [taskList, setTaskList] = useState('');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lines = taskList.split('\n').map((l) => l.trim()).filter(Boolean);

  function normalize(s: string) {
    return s
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u00a0/g, ' ')
      .trim();
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0 || !canStart) return;
    setBusy(true);
    setErr(null);
    try {
      const chosenModel =
        model === '__custom__' ? (customModel || undefined) :
        model || undefined;

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_titles: lines.map(normalize),
          prompt: extraPrompt ? normalize(extraPrompt) : undefined,
          model: chosenModel,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('Session creation failed:', json);
        throw new Error(
          typeof json.issues === 'object'
            ? `Validation failed: ${JSON.stringify(json.issues)}`
            : json.error || 'failed'
        );
      }
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

      {/* Model picker */}
      <div className="mt-6">
        <label className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] block mb-2">
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="input mono text-sm"
        >
          <option value="">Use default</option>
          {MODEL_OPTIONS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} — {m.hint}
                </option>
              ))}
            </optgroup>
          ))}
          <optgroup label="Custom">
            <option value="__custom__">Other (paste OpenRouter slug)</option>
          </optgroup>
        </select>
        {model === '__custom__' && (
          <input
            type="text"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="e.g. mistralai/mistral-large-2411"
            className="input mt-2 mono text-sm"
          />
        )}
        <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
          Sonnet 4 is sharper for complex tasks. GLM-5 and Nemotron are cheaper for simple ones.
        </p>
      </div>

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