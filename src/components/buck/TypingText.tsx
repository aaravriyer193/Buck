'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypingTextProps {
  text: string;
  /** Average characters per second. */
  cps?: number;
  /** Variability in cadence (0–1). 0 = robot, 0.6 = nice and human-feeling. */
  jitter?: number;
  /** Show the blinking cursor while typing and after. */
  cursor?: boolean;
  className?: string;
  startDelay?: number;
  onDone?: () => void;
}

/**
 * Variable-cadence typewriter. Pauses very briefly after punctuation and on
 * randomly selected characters to feel like a person thinking, not a printer.
 */
export function TypingText({
  text,
  cps = 55,
  jitter = 0.55,
  cursor = true,
  className,
  startDelay = 0,
  onDone,
}: TypingTextProps) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setOut('');
    setDone(false);
    let cancelled = false;
    let i = 0;

    const tick = () => {
      if (cancelled) return;
      if (i >= text.length) {
        setDone(true);
        onDoneRef.current?.();
        return;
      }
      const ch = text[i];
      i += 1;
      setOut(text.slice(0, i));

      // Base delay
      const base = 1000 / Math.max(cps, 1);
      // Jitter
      const noise = base * jitter * (Math.random() - 0.5) * 2;
      // Punctuation pauses
      let pause = 0;
      if ('.!?'.includes(ch)) pause = 240;
      else if (',;:—'.includes(ch)) pause = 110;
      // Random "thinking" pauses
      else if (Math.random() < 0.012) pause = 200 + Math.random() * 300;

      const delay = Math.max(8, base + noise) + pause;
      setTimeout(tick, delay);
    };

    const start = setTimeout(tick, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [text, cps, jitter, startDelay]);

  return (
    <span className={cn(className, cursor && (!done || cursor) && 'caret')}>
      {out}
    </span>
  );
}
