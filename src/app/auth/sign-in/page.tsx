'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';

function SignInInner() {
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const error = params.get('error');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="display text-3xl">Buck</Link>
          <p className="mt-2 italic text-[var(--color-ink-soft)]">Stop working. Start sleeping.</p>
        </div>
        <PaperCard className="text-center">
          <Stamp>The Door</Stamp>
          <h1 className="display text-3xl mt-4">Welcome back.</h1>
          <p className="mt-2 text-[var(--color-ink-soft)]">Sign in to hand Buck tonight's list.</p>

          <button onClick={signIn} disabled={busy} className="btn btn-buck w-full mt-8 justify-center">
            {busy ? 'Opening Google…' : 'Continue with Google'}
          </button>

          {error && (
            <p className="mt-4 mono text-xs uppercase tracking-widest text-[var(--color-danger)]">
              Sign-in failed. Try again.
            </p>
          )}

          <p className="mt-8 text-xs text-[var(--color-ink-faint)]">
            We use Supabase Auth with Google. Buck never sees your password.
          </p>
        </PaperCard>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}
