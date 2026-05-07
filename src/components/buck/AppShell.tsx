import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

// Inline crest — same as on the landing page, currentColor-aware.
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

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', glyph: '▦' },
  { href: '/sessions/new', label: 'New session', glyph: '＋' },
  { href: '/integrations', label: 'Integrations', glyph: '◉' },
  { href: '/script', label: 'Script', glyph: '✎' },
  { href: '/settings', label: 'Settings', glyph: '⚙' },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name').eq('id', user.id).single()
    : { data: null };

  const name = profile?.display_name || user?.email?.split('@')[0] || 'friend';

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[var(--color-rule)] bg-[var(--color-paper)]/60 backdrop-blur-[1px]">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5 border-b border-[var(--color-rule)]">
          <BuckMark size={32} />
          <div>
            <div className="display text-2xl leading-none">Buck</div>
            <div className="mono text-[9px] uppercase tracking-[0.28em] text-[var(--color-ink-faint)] mt-1">
              night shift
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <div className="mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-faint)] px-2 mb-2">
            Workspace
          </div>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-2 py-2 text-sm hover:bg-[var(--color-paper-deep)] transition group"
                >
                  <span className="mono text-xs text-[var(--color-ink-faint)] group-hover:text-[var(--color-buck)] w-4 text-center">
                    {item.glyph}
                  </span>
                  <span className="serif">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User strip */}
        {user && (
          <div className="border-t border-[var(--color-rule)] px-5 py-4">
            <div className="serif text-sm truncate">{name}</div>
            <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] truncate">
              {user.email}
            </div>
            <form action="/auth/sign-out" method="post" className="mt-3">
              <button
                type="submit"
                className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] hover:text-[var(--color-buck)]"
              >
                Sign out →
              </button>
            </form>
          </div>
        )}
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[var(--color-paper)] border-b border-[var(--color-rule)] flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BuckMark size={24} />
          <span className="display text-xl">Buck</span>
        </Link>
        <details className="relative">
          <summary className="mono text-xs uppercase tracking-widest cursor-pointer list-none">
            Menu
          </summary>
          <div className="absolute right-0 top-full mt-2 w-56 paper-card !p-2 z-40">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 serif hover:bg-[var(--color-paper-deep)]"
              >
                {item.label}
              </Link>
            ))}
            <div className="rule !my-2" />
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="block w-full text-left px-3 py-2 mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </details>
      </div>

      {/* MAIN */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}