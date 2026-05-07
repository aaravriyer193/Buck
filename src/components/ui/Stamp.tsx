import { cn } from '@/lib/utils';

type Tone = 'default' | 'buck' | 'warn' | 'danger';

export function Stamp({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'stamp',
        tone === 'buck' && 'stamp-buck',
        tone === 'warn' && 'stamp-warn',
        tone === 'danger' && 'stamp-danger',
        className
      )}
    >
      {children}
    </span>
  );
}
