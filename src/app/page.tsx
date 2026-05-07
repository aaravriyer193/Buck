import Link from 'next/link';
import { TypingText } from '@/components/buck/TypingText';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';
import { ALL_INTEGRATIONS } from '@/integrations';

// Inline crest. Uses currentColor so it tints with text-* classes.
function BuckMark({ size = 32, withMoon = true }: { size?: number; withMoon?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Buck"
      style={{ color: 'var(--color-buck)' }}
      className="inline-block"
    >
      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="0.9" />
      {withMoon && (
        <>
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
        </>
      )}
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

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* HEADER */}
      <header className="border-b border-[var(--color-rule)] relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BuckMark size={32} />
            <span className="display text-2xl">Buck</span>
            <span className="hidden sm:inline mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-faint)] mt-1">
              night shift
            </span>
          </Link>
          <nav className="mono text-xs uppercase tracking-widest flex items-center gap-6">
            <a href="#how" className="hidden sm:inline hover:text-[var(--color-buck)]">How</a>
            <a href="#diary" className="hidden sm:inline hover:text-[var(--color-buck)]">Diary</a>
            <a href="#integrations" className="hidden md:inline hover:text-[var(--color-buck)]">Tools</a>
            <Link href="/auth/sign-in" className="btn">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute right-[-80px] top-[20px] opacity-[0.06] pointer-events-none select-none"
        >
          <BuckMark size={620} />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-12 gap-10 items-end relative">
          <div className="md:col-span-7 reveal">
            <div className="mono text-xs uppercase tracking-[0.3em] text-[var(--color-ink-faint)] mb-6 flex items-center gap-3">
              <span>№ 001</span>
              <span className="h-px w-8 bg-[var(--color-rule)]" />
              <span>overnight agent</span>
            </div>
            <h1 className="display text-[clamp(3rem,8vw,6.5rem)] leading-[0.95] tracking-tight">
              Stop&nbsp;working.
              <br />
              <span className="italic">
                <TypingText text="Start sleeping." cps={14} startDelay={500} />
              </span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed max-w-xl">
              Buck is an autonomous agent who takes the night shift. Hand him a task list at
              bedtime; wake up to a diary entry, a finished checklist, and an inbox that&apos;s
              already been swept.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link href="/auth/sign-in" className="btn btn-buck">Hire Buck →</Link>
              <a href="#how" className="mono text-xs uppercase tracking-widest underline underline-offset-4 decoration-[var(--color-rule)] hover:decoration-[var(--color-ink)]">
                How he works
              </a>
            </div>
          </div>

          <div className="md:col-span-5">
            <PaperCard className="rotate-[-1.2deg] shadow-[0_24px_60px_-30px_rgba(28,22,17,0.55)] relative">
              <div className="absolute -top-3 -right-3">
                <BuckMark size={56} />
              </div>
              <div className="flex items-center justify-between mb-4 pr-12">
                <Stamp tone="buck">Diary · 03:42</Stamp>
                <span className="mono text-xs text-[var(--color-ink-faint)]">conf. 86%</span>
              </div>
              <p className="serif text-lg leading-relaxed italic">
                <TypingText
                  text="Worked through the inbox. Replied to 11, archived 34, flagged 2 for you (one from your CFO, one from a vendor). Linear ticket ENG-204 is ready for review — pushed a comment with my notes. Skipped task #5 — couldn't reach the calendar API; the token may be stale."
                  cps={32}
                  startDelay={1400}
                />
              </p>
              <div className="rule" />
              <div className="flex items-center justify-between mono text-xs uppercase tracking-widest">
                <span className="text-[var(--color-ink-faint)]">cost · 4h 12m</span>
                <span>$0.42</span>
              </div>
            </PaperCard>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule-thick" /></div>

      {/* HOW */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <Stamp>The Method</Stamp>
            <h2 className="display text-5xl mt-4 leading-tight">
              Three&nbsp;steps.
              <br />
              <em>Then sleep.</em>
            </h2>
          </div>
          <ol className="md:col-span-8 grid sm:grid-cols-3 gap-6">
            {[
              { n: '01', t: 'Write the list', b: 'Type your tasks. Buck reads it, asks for clarifications only when necessary, and gives you a cost estimate before he starts.' },
              { n: '02', t: 'Go to bed', b: 'Buck spins up a sandbox, loads your integration tokens as env vars, and works through the list. He pauses for permission on destructive actions.' },
              { n: '03', t: 'Read the diary', b: "In the morning: a wake-up email and a diary entry. What worked, what didn't, what he'd want different about himself next time." },
            ].map((s) => (
              <li key={s.n}>
                <PaperCard flat className="h-full">
                  <div className="mono text-xs uppercase tracking-widest text-[var(--color-buck)] mb-3">{s.n}</div>
                  <h3 className="display text-2xl mb-2">{s.t}</h3>
                  <p className="text-[var(--color-ink-soft)] leading-relaxed">{s.b}</p>
                </PaperCard>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule" /></div>

      {/* DIARY */}
      <section id="diary" className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Stamp>The Diary</Stamp>
          <h2 className="display text-5xl mt-4 leading-tight">
            He keeps a&nbsp;<em>journal</em>.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-ink-soft)]">
            Every morning Buck leaves you a short, plainspoken account of the night. What got
            done. What stalled. What he&apos;d want different about himself next time.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-ink-soft)]">
            <strong>You approve any change he proposes to his own script before it ships.</strong>{' '}
            No surprises. No drift.
          </p>
        </div>
        <div className="md:col-span-7">
          <PaperCard ruled className="font-serif text-lg leading-[1.5em] py-10 relative">
            <div className="absolute top-4 right-4 opacity-30">
              <BuckMark size={40} withMoon={false} />
            </div>
            <div className="display italic text-3xl leading-tight mb-4">Wednesday, ~ 04:11</div>
            <p>Worked through 9 of 10 tasks tonight. Skipped the last —</p>
            <p>the Calendly token came back unauthorized; I noted it in</p>
            <p>your settings so you can rotate it. The Linear sweep was</p>
            <p>tidy: 14 stale tickets nudged, 3 escalated. The one I&apos;d</p>
            <p>flag for tomorrow is the vendor reply (Susan, NorthGrove)</p>
            <p>— she&apos;s asking about pricing I shouldn&apos;t quote myself.</p>
            <br />
            <p><em>What I&apos;d change:</em> I spent two iterations second-</p>
            <p>guessing the Slack channel selection. Worth being more</p>
            <p>direct in the prompt about default channels per task.</p>
            <br />
            <p className="text-[var(--color-ink-faint)] mono text-xs">— Buck</p>
          </PaperCard>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule" /></div>

      {/* INTEGRATIONS */}
      <section id="integrations" className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Stamp>The Tools</Stamp>
            <h2 className="display text-5xl mt-4 leading-tight">Bring your own keys.</h2>
          </div>
          <p className="max-w-md text-[var(--color-ink-soft)] leading-relaxed">
            Buck never holds your third-party credentials. You paste them once into an encrypted
            vault; they&apos;re injected into a fresh sandbox at session start, and gone again
            when he clocks off.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
          {ALL_INTEGRATIONS.map((it) => (
            <div key={it.service} className="bg-[var(--color-paper)] p-5 hover:bg-[var(--color-paper-deep)] transition">
              <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">{it.category}</div>
              <div className="display text-xl">{it.display_name}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">
          {ALL_INTEGRATIONS.length} integrations · more on the way
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule-thick" /></div>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="flex justify-center mb-8 opacity-90"><BuckMark size={120} /></div>
        <h2 className="display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] italic">Sleep already.</h2>
        <p className="mt-6 text-xl text-[var(--color-ink-soft)]">Buck has it.</p>
        <Link href="/auth/sign-in" className="btn btn-buck mt-10 inline-flex">Hire Buck →</Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--color-rule)]">
        <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 items-center">
          <div className="flex items-center gap-3">
            <BuckMark size={36} />
            <div>
              <div className="display text-xl">Buck</div>
              <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
                stop working · start sleeping
              </div>
            </div>
          </div>
          <div className="text-center mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-faint)]">
            set in source serif &amp; jetbrains mono
            <br />
            on beige paper, ruled
          </div>
          <div className="md:text-right mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-faint)]">
            v0.1 — mvp
            <br />
            © buck, the night shift
          </div>
        </div>
      </footer>
    </div>
  );
}