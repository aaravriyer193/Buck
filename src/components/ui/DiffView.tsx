'use client';

import { diffLines } from 'diff';

export function DiffView({ before, after }: { before: string; after: string }) {
  const parts = diffLines(before, after);
  return (
    <pre className="mono text-xs leading-relaxed bg-[var(--color-paper-deep)] border border-[var(--color-rule)] p-4 overflow-x-auto whitespace-pre">
      {parts.map((p, i) => {
        if (p.added) {
          return p.value.split('\n').filter(Boolean).map((line, j) => (
            <div key={`${i}-a-${j}`} className="diff-add">+ {line}</div>
          ));
        }
        if (p.removed) {
          return p.value.split('\n').filter(Boolean).map((line, j) => (
            <div key={`${i}-r-${j}`} className="diff-del">- {line}</div>
          ));
        }
        // Context — only show first/last few lines if huge
        const lines = p.value.split('\n');
        if (lines.length > 8) {
          return [
            <div key={`${i}-c-top`}>
              {lines.slice(0, 3).map((l, j) => <div key={j} className="diff-meta">  {l}</div>)}
            </div>,
            <div key={`${i}-c-skip`} className="diff-meta italic">
              ⋮ {lines.length - 6} unchanged lines
            </div>,
            <div key={`${i}-c-bot`}>
              {lines.slice(-3).map((l, j) => <div key={j} className="diff-meta">  {l}</div>)}
            </div>,
          ];
        }
        return lines.filter(Boolean).map((l, j) => (
          <div key={`${i}-c-${j}`} className="diff-meta">  {l}</div>
        ));
      })}
    </pre>
  );
}
