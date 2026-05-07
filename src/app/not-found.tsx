import Link from 'next/link';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <PaperCard className="text-center max-w-md">
        <Stamp>404</Stamp>
        <h1 className="display text-4xl mt-4 italic">Buck doesn&apos;t know this place.</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          Whatever you were looking for, it isn&apos;t here.
        </p>
        <Link href="/" className="btn btn-buck mt-6 inline-flex">← Back home</Link>
      </PaperCard>
    </main>
  );
}
