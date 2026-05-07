import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b border-[var(--color-rule)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={user ? '/dashboard' : '/'} className="display text-2xl tracking-tight">
          Buck
          <span className="ml-2 mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">
            night shift
          </span>
        </Link>
        <nav className="flex items-center gap-5 mono text-xs uppercase tracking-wider">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-[var(--color-buck)]">Dashboard</Link>
              <Link href="/integrations" className="hover:text-[var(--color-buck)]">Integrations</Link>
              <Link href="/script" className="hover:text-[var(--color-buck)]">Script</Link>
              <Link href="/settings" className="hover:text-[var(--color-buck)]">Settings</Link>
              <form action="/auth/sign-out" method="post">
                <button type="submit" className="hover:text-[var(--color-buck)] uppercase">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/auth/sign-in" className="hover:text-[var(--color-buck)]">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
