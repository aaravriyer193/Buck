import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

function BuckMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Buck"
      style={{ color: 'var(--color-buck)' }}
      className="inline-block shrink-0"
    >
      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <g transform="translate(100,28)">
        <circle r="6" fill="currentColor" />
        <circle r="5" cx="2" cy="-0.7" fill="var(--color-paper)" />
      </g>
      <g fill="currentColor">
        <circle cx="74" cy="34" r="1.3" />
        <circle cx="126" cy="34" r="1.3" />
        <circle cx="64" cy="48" r="1" />
        <circle cx="136" cy="48" r="1" />
      </g>
      <g fill="currentColor">
        <path d="M 100 78 C 86 80, 76 92, 76 108 C 76 122, 84 134, 92 142 C 96 146, 99 152, 100 158 C 101 152, 104 146, 108 142 C 116 134, 124 122, 124 108 C 124 92, 114 80, 100 78 Z" />
        <path d="M 78 98 C 71 93, 66 88, 64 82 C 64 92, 69 102, 76 106 Z" />
        <path d="M 122 98 C 129 93, 134 88, 136 82 C 136 92, 131 102, 124 106 Z" />
      </g>
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M 86 82 C 78 72, 70 65, 62 60" />
        <path d="M 72 68 C 66 62, 58 56, 50 53" />
        <path d="M 76 76 C 68 71, 58 68, 48 68" />
        <path d="M 82 78 C 76 70, 70 62, 64 54" />
        <path d="M 114 82 C 122 72, 130 65, 138 60" />
        <path d="M 128 68 C 134 62, 142 56, 150 53" />
        <path d="M 124 76 C 132 71, 142 68, 152 68" />
        <path d="M 118 78 C 124 70, 130 62, 136 54" />
      </g>
      <g fill="var(--color-paper)">
        <ellipse cx="92" cy="110" rx="1.9" ry="2.6" />
        <ellipse cx="108" cy="110" rx="1.9" ry="2.6" />
      </g>
    </svg>
  );
}

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b border-[var(--color-rule)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3">
          <BuckMark size={28} />
          <span className="display text-2xl tracking-tight">Buck</span>
          <span className="hidden sm:inline mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-faint)] mt-1">
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