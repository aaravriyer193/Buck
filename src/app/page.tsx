import Link from 'next/link';
import { TypingText } from '@/components/buck/TypingText';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';
import { ALL_INTEGRATIONS } from '@/integrations';

// =============================================================================
// Inline crest — currentColor-aware
// =============================================================================
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

// Tiny printer's-mark fleurons used as section dividers
function Fleuron() {
  return (
    <div className="flex items-center justify-center gap-3 my-12 text-[var(--color-ink-faint)]">
      <span className="h-px w-16 bg-[var(--color-rule)]" />
      <span className="serif text-2xl">❦</span>
      <span className="h-px w-16 bg-[var(--color-rule)]" />
    </div>
  );
}

export default function Home() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="overflow-x-hidden">
      {/* ─── MASTHEAD ──────────────────────────────────────────────────────── */}
      <header className="border-b-[3px] border-double border-[var(--color-ink)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
          <span>{today}</span>
          <span>VOL. I · NO. 001 · ESTABLISHED 2026</span>
          <span>Price: free · two cents</span>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-3 pb-5 flex items-end justify-between border-t border-[var(--color-rule)]">
          <Link href="/" className="flex items-end gap-4">
            <BuckMark size={56} />
            <div>
              <div className="display text-5xl leading-none">Buck</div>
              <div className="mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-faint)] mt-2">
                The night-shift gazette · for those who would rather sleep
              </div>
            </div>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 mono text-xs uppercase tracking-widest">
            <a href="#how" className="hover:text-[var(--color-buck)]">How</a>
            <a href="#diary" className="hover:text-[var(--color-buck)]">Diary</a>
            <a href="#trust" className="hover:text-[var(--color-buck)]">Trust</a>
            <a href="#pricing" className="hover:text-[var(--color-buck)]">Plans</a>
            <Link href="/auth/sign-in" className="btn">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute right-[-100px] top-[40px] opacity-[0.05] pointer-events-none select-none"
        >
          <BuckMark size={680} />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-12 gap-10 items-end relative">
          <div className="md:col-span-7 reveal">
            <div className="mono text-xs uppercase tracking-[0.3em] text-[var(--color-ink-faint)] mb-6 flex items-center gap-3">
              <span>FROM THE EDITOR</span>
              <span className="h-px w-10 bg-[var(--color-rule)]" />
              <span>An overnight agent</span>
            </div>
            <h1 className="display text-[clamp(3.25rem,9vw,7rem)] leading-[0.92] tracking-tight">
              Stop&nbsp;working.
              <br />
              <span className="italic">
                <TypingText text="Start sleeping." cps={14} startDelay={500} />
              </span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed max-w-xl">
              Buck is an autonomous agent who takes the night shift. Hand him a task list at
              bedtime — emails, errands, code, research — and wake up to a finished checklist,
              an inbox already swept, and a diary entry on your nightstand explaining everything
              he did and what he&apos;d do differently next time.
            </p>

            <div className="mt-10 flex items-center gap-6">
              <Link href="/auth/sign-in" className="btn btn-buck">
                Hire Buck →
              </Link>
              <a href="#how" className="mono text-xs uppercase tracking-widest underline underline-offset-4 decoration-[var(--color-rule)] hover:decoration-[var(--color-ink)]">
                Watch him work ↓
              </a>
            </div>
          </div>

          {/* Diary card */}
          <div className="md:col-span-5">
            <PaperCard className="rotate-[-1.2deg] shadow-[0_24px_60px_-30px_rgba(28,22,17,0.55)] relative">
              <div className="absolute -top-3 -right-3"><BuckMark size={56} /></div>
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

      {/* ─── THREE MOVEMENTS ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <Stamp>The pitch</Stamp>
          <h2 className="display text-5xl mt-4 italic leading-tight">In three movements.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
          {[
            {
              num: 'I.',
              title: 'What it is',
              body: 'A single autonomous agent — not a workflow builder, not a chat assistant. You give Buck a task list. He executes against your tools, in a sandbox, while you sleep. He writes a diary entry. He proposes how to do better next time. You approve or reject his proposed changes to himself. That is the entire product.',
            },
            {
              num: 'II.',
              title: 'Who it is for',
              body: 'Engineers, founders, and operators who already know exactly what they want done, and who would rather see it done than do it. Buck rewards specificity. He is bad with vague briefs and good with sharp ones. If you have ever closed your laptop wishing a competent intern would just handle the next thing on the list — that is who Buck is for.',
            },
            {
              num: 'III.',
              title: 'Why now',
              body: 'Models are finally good enough at tool use that an agent running for hours, unsupervised, against real production credentials, can be trusted to behave. The remaining problem is not the model. It is the surface around it: the sandbox, the credential vault, the approval gate, the diary, the self-correction loop. Buck is that surface.',
            },
          ].map((m) => (
            <div key={m.num} className="bg-[var(--color-paper)] p-8">
              <div className="display italic text-3xl text-[var(--color-buck)] mb-3">{m.num}</div>
              <h3 className="display text-2xl mb-3">{m.title}</h3>
              <p className="text-[var(--color-ink-soft)] leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Fleuron />

      {/* ─── HOW (3 STEPS) ─────────────────────────────────────────────────── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <Stamp>The Method</Stamp>
            <h2 className="display text-5xl mt-4 leading-tight">
              Three&nbsp;steps.<br /><em>Then sleep.</em>
            </h2>
            <p className="mt-6 text-[var(--color-ink-soft)] leading-relaxed">
              No workflows. No graphs. No drag-and-drop builder. Buck&apos;s entire product surface
              is a textarea and a list of integrations. The complexity lives on his side, where it
              should.
            </p>
          </div>
          <ol className="md:col-span-8 grid sm:grid-cols-3 gap-6">
            {[
              { n: '01', t: 'Write the list', b: 'Type your tasks — one per line — into the textarea before bed. Buck reads it, proposes a cost estimate, and asks for clarifications only when something is genuinely ambiguous.' },
              { n: '02', t: 'Go to bed', b: "Buck spins up an isolated sandbox, loads your integration tokens as environment variables, and works the list. He pauses for permission on destructive actions. He halts cleanly if he hits your budget cap." },
              { n: '03', t: 'Read the diary', b: "In the morning: a wake-up email, a finished checklist, and a diary entry written in his own voice. What worked. What didn't. What he'd want to change about himself next time." },
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

      <Fleuron />

      {/* ─── LIVE SESSION (animated mock) ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <Stamp tone="buck">Live · ◉</Stamp>
          <h2 className="display text-5xl mt-4 italic leading-tight">
            Watch him work.
          </h2>
          <p className="mt-4 text-[var(--color-ink-soft)] max-w-xl mx-auto leading-relaxed">
            What you see in the dashboard while Buck is on shift. Every thought, every tool call,
            streamed live.
          </p>
        </div>
        <PaperCard className="!p-0 max-w-3xl mx-auto">
          <div className="px-5 py-3 border-b border-[var(--color-rule)] flex items-center justify-between">
            <Stamp tone="buck">◉ live</Stamp>
            <span className="mono text-xs text-[var(--color-ink-faint)]">session 5bc80a · model claude-sonnet-4.6 · 4h 12m</span>
          </div>
          <div className="p-6 space-y-4 mono text-sm leading-relaxed">
            {[
              { t: '03:01:14', kind: 'system', text: 'Buck is waking up.' },
              { t: '03:01:14', kind: 'system', text: 'Loaded 21 tools.' },
              { t: '03:01:32', kind: 'thought', text: "Three tasks tonight. Starting with the inbox sweep — that's the highest-leverage and easiest to undo if I get it wrong." },
              { t: '03:01:48', kind: 'tool', text: '→ gmail.search({"q":"newer_than:1d is:unread","max":50})' },
              { t: '03:01:50', kind: 'result', text: '{"ok":true,"count":47}' },
              { t: '03:02:21', kind: 'thought', text: '47 unread. About 11 are likely to need a real reply. Drafting now.' },
              { t: '03:18:04', kind: 'tool', text: '→ gmail.send({"to":"susan@northgrove.io",…})' },
              { t: '03:18:05', kind: 'result', text: '{"ok":true,"id":"19a4..."}' },
              { t: '03:42:11', kind: 'system', text: '— task completed: inbox sweep' },
              { t: '03:42:33', kind: 'thought', text: "On to the GitHub triage. I'll start by listing repos and ranking by stale issues." },
            ].map((e, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr] gap-4">
                <div className="text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] pt-1">{e.t}</div>
                <div className={
                  e.kind === 'thought' ? 'serif italic text-[var(--color-ink-soft)] not-italic' :
                  e.kind === 'tool' ? 'text-[var(--color-buck)]' :
                  e.kind === 'result' ? 'text-xs text-[var(--color-ink-faint)] pl-4 border-l border-[var(--color-rule)]' :
                  'text-xs text-[var(--color-ink-faint)] italic'
                }>
                  {e.kind === 'thought' ? <span className="serif italic">{e.text}</span> : e.text}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-[var(--color-rule)] flex items-center justify-between mono text-xs">
            <span className="text-[var(--color-ink-faint)]">spent</span>
            <span className="text-[var(--color-buck)]">$0.41</span>
          </div>
        </PaperCard>
      </section>

      <Fleuron />

      {/* ─── DIARY (full page) ─────────────────────────────────────────────── */}
      <section id="diary" className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Stamp>The Diary</Stamp>
          <h2 className="display text-5xl mt-4 leading-tight">
            He keeps a&nbsp;<em>journal</em>.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-ink-soft)]">
            Every morning, a short, plainspoken account of the night. Buck is calm, slightly
            literary, and honest about what didn&apos;t work — sometimes uncomfortably so.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-ink-soft)]">
            <strong>This is the entire product, in a way.</strong> Most agents narrate. Buck
            reflects. The diary is what makes the difference between a tool you forget about and
            a colleague you trust.
          </p>
          <div className="mt-8 paper-card-flat p-5">
            <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] mb-2">From a real session</div>
            <p className="serif italic leading-relaxed">
              &ldquo;Honestly, nothing worked this session. The tools I had loaded couldn&apos;t do
              what was asked. I recognized the limitation quickly and didn&apos;t waste time
              spinning my wheels — but that&apos;s a low bar. If I could change something, I&apos;d
              flag the gap upfront so you could pivot, instead of leaving you with a skipped task
              and an empty session.&rdquo;
            </p>
            <p className="mt-2 mono text-xs text-[var(--color-ink-faint)]">— Buck, after a failed run</p>
          </div>
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
            <p><em>What worked:</em> Batching the Slack drafts before posting</p>
            <p>was a good call — it let me catch a tone problem in the</p>
            <p>second-to-last one before sending. Worth keeping.</p>
            <br />
            <p><em>What I&apos;d change:</em> I spent two iterations second-</p>
            <p>guessing the Slack channel selection. Worth being more</p>
            <p>direct in the prompt about default channels per task.</p>
            <br />
            <p className="text-[var(--color-ink-faint)] mono text-xs">— Buck</p>
          </PaperCard>
        </div>
      </section>

      <Fleuron />

      {/* ─── INTEGRATIONS WALL ─────────────────────────────────────────────── */}
      <section id="integrations" className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Stamp>The Tools</Stamp>
            <h2 className="display text-5xl mt-4 leading-tight">Bring your own keys.</h2>
          </div>
          <p className="max-w-md text-[var(--color-ink-soft)] leading-relaxed">
            Buck never holds your third-party credentials. You paste them once into an encrypted
            vault; they&apos;re injected into a fresh sandbox at session start, and gone again
            when he clocks off. He also has his own sandbox — a Python and Node runtime where he
            can write code, test it, and iterate before committing anything.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
          {ALL_INTEGRATIONS.map((it) => (
            <div key={it.service} className="bg-[var(--color-paper)] p-5 hover:bg-[var(--color-paper-deep)] transition relative">
              {it.service === 'sandbox' && (
                <span className="absolute top-2 right-2 mono text-[8px] uppercase tracking-widest text-[var(--color-buck)]">
                  always on
                </span>
              )}
              <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
                {it.category}
              </div>
              <div className="display text-xl">{it.display_name}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">
          {ALL_INTEGRATIONS.length} integrations · more on the way · open an issue to request one
        </p>
      </section>

      <Fleuron />

      {/* ─── TRUST COLUMN ──────────────────────────────────────────────────── */}
      <section id="trust" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <Stamp>The Architecture</Stamp>
          <h2 className="display text-5xl mt-4 italic leading-tight">How he can be trusted.</h2>
          <p className="mt-4 text-[var(--color-ink-soft)] max-w-2xl mx-auto leading-relaxed">
            An autonomous agent with your live credentials is a serious thing to ship. Buck is
            built on five load-bearing primitives that are not negotiable.
          </p>
        </div>
        <div className="grid md:grid-cols-5 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
          {[
            {
              n: 'I',
              title: 'The vault',
              body: 'Tokens are encrypted at rest with AES-256-GCM, decrypted only at session boot, and exist as plaintext only inside the sandbox process. No logs.',
            },
            {
              n: 'II',
              title: 'The sandbox',
              body: 'Each session boots a fresh, isolated E2B sandbox. It dies when Buck clocks off. Sandboxes do not share state or filesystems with each other or with you.',
            },
            {
              n: 'III',
              title: 'The approval gate',
              body: 'Buck pauses before destructive actions — sending email, deleting files, charging cards — and waits for your tap. You configure exactly which categories require approval.',
            },
            {
              n: 'IV',
              title: 'The budget guard',
              body: 'Hard caps per session and per month. Buck halts cleanly when he hits them and writes a diary entry explaining where he stopped.',
            },
            {
              n: 'V',
              title: 'The script lock',
              body: "Buck can propose changes to his own script after each session — but you review and approve every diff. Safety regions are protected and can't be modified by him.",
            },
          ].map((p) => (
            <div key={p.n} className="bg-[var(--color-paper)] p-6">
              <div className="display italic text-3xl text-[var(--color-buck)] mb-2">{p.n}</div>
              <h3 className="display text-xl mb-2">{p.title}</h3>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Fleuron />

      {/* ─── PROPOSED CHANGE DEMO ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-5">
            <Stamp tone="warn">The unusual part</Stamp>
            <h2 className="display text-5xl mt-4 leading-tight">
              He proposes changes to&nbsp;<em>himself</em>.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-ink-soft)]">
              After every session, Buck reflects on what worked and what didn&apos;t. If he sees
              a concrete improvement to his own prompt or behavior, he proposes it as a diff.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--color-ink-soft)]">
              You review the change, side-by-side. You approve it, reject it, or leave it pending.
              Locked safety regions can&apos;t be modified. Auto-rollback kicks in if he proposes
              changes that make things worse.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--color-ink-soft)]">
              <strong>This is the loop that makes Buck get better the longer you use him.</strong>{' '}
              It is also the part that you, the operator, must remain in charge of. We do not
              ship a Buck that rewrites himself behind your back.
            </p>
          </div>
          <div className="md:col-span-7">
            <PaperCard className="!p-0">
              <div className="px-5 py-4 border-b border-[var(--color-rule)]">
                <div className="flex items-center gap-3 mb-2">
                  <Stamp tone="warn">Buck proposes</Stamp>
                  <span className="mono text-xs text-[var(--color-ink-faint)]">14m ago</span>
                </div>
                <p className="serif italic leading-relaxed">
                  The diary identifies a clear lesson: I made assumptions about an ambiguous task
                  instead of flagging the ambiguity upfront. Since the user is asleep and cannot
                  be asked for clarification, I should explicitly note ambiguous task definitions,
                  state my interpretation, and proceed with the most reasonable reading.
                </p>
              </div>
              <div className="flex border-b border-[var(--color-rule)]">
                <div className="px-5 py-3 mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">main.ts</div>
                <div className="px-5 py-3 mono text-xs uppercase tracking-widest text-[var(--color-buck)] border-b-2 border-[var(--color-buck)]">prompt.md ●</div>
              </div>
              <pre className="p-6 mono text-xs leading-relaxed bg-[var(--color-paper-deep)] overflow-x-auto">
{`  ## Rules

  - **Honor the approval gate.** If a tool is marked destructive...
  - **Stay inside your tools.** Do not invent capabilities. If a task...
`}<span className="diff-add">{`+ - **Flag ambiguity.** When a task is vague or could be interpreted
+   multiple ways, state the ambiguity and your chosen interpretation
+   explicitly. The user is asleep — proceed with the most reasonable
+   reading rather than waiting.`}</span>{`
  - **Budget-aware.** Tasks should match the budget. Long thinking...
  - **Concise reasoning.** When you "think out loud" between tool...`}
              </pre>
              <div className="px-5 py-4 border-t border-[var(--color-rule)] flex items-center justify-end gap-3">
                <button className="btn">Reject</button>
                <button className="btn btn-buck">Approve & promote</button>
              </div>
            </PaperCard>
          </div>
        </div>
      </section>

      <Fleuron />

      {/* ─── FOUNDER NOTE ──────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <Stamp>A note from the desk</Stamp>
        </div>
        <PaperCard className="px-10 py-12 relative">
          <div className="absolute top-4 right-4 opacity-30">
            <BuckMark size={32} withMoon={false} />
          </div>
          <p className="serif text-lg leading-relaxed mb-4">
            I built Buck because I was tired of closing my laptop at midnight with a list of
            ten things I wished someone would just <em>handle</em> by morning. Replies. Triage.
            A little research. The unsexy connective tissue of running anything.
          </p>
          <p className="serif text-lg leading-relaxed mb-4">
            Most agent products want to be everything: a builder, a chatbot, a marketplace, a
            framework. Buck is one thing. He works overnight, against your real tools, and tells
            you what he did. He is not a magic wish-machine. He is closer to a competent intern
            who reads the brief carefully and writes a real diary entry in the morning.
          </p>
          <p className="serif text-lg leading-relaxed mb-4">
            He&apos;ll get smarter the longer you use him — by proposing changes to his own
            instructions and waiting for you to approve them. That feedback loop is what I
            think is genuinely new about Buck, and it&apos;s the part I&apos;m most proud of.
          </p>
          <p className="serif text-lg leading-relaxed mb-6">
            If any of this resonates, hire him for a night. If it doesn&apos;t, the marketing
            page itself is decent reading.
          </p>
          <div className="display italic text-2xl">— Aarav</div>
          <div className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mt-1">
            Founder · Walnut Labs
          </div>
        </PaperCard>
      </section>

      <Fleuron />

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <Stamp>The Plans</Stamp>
          <h2 className="display text-5xl mt-4 leading-tight">Pay for the work, not the seat.</h2>
          <p className="mt-4 text-[var(--color-ink-soft)] max-w-xl mx-auto leading-relaxed">
            Buck is in beta and free for now. When billing arrives, it will look something
            like this. You only pay for what Buck actually does.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              tier: 'Beta',
              price: 'Free',
              note: 'while we are in beta',
              perks: ['5 sessions / month', 'All integrations', 'Default models', 'Approval-gated self-mod', 'Email support — when I see it'],
              cta: 'Hire Buck',
              ctaUrl: '/auth/sign-in',
              featured: false,
            },
            {
              tier: 'Pro',
              price: '$20',
              note: 'per month, when billing lands',
              perks: ['100 sessions / month', 'All integrations including sandbox', 'Premium models (sonnet 4.6, GPT-5)', '4-hour sandbox sessions', 'Multi-Buck (3 parallel)', 'Priority email'],
              cta: 'Coming soon',
              ctaUrl: null,
              featured: true,
            },
            {
              tier: 'Power',
              price: '$60',
              note: 'per month',
              perks: ['Unlimited sessions', 'Unlimited tokens per session', 'Unlimited parallel Bucks', 'Custom model bring-your-own', 'Early features', 'Slack support'],
              cta: 'Coming soon',
              ctaUrl: null,
              featured: false,
            },
          ].map((p) => (
            <PaperCard key={p.tier} className={p.featured ? 'border-[var(--color-buck)] border-2 relative' : 'relative'}>
              {p.featured && (
                <div className="absolute -top-3 left-6">
                  <Stamp tone="buck">Recommended</Stamp>
                </div>
              )}
              <div className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mb-2">{p.tier}</div>
              <div className="display text-5xl">{p.price}</div>
              <div className="mono text-xs text-[var(--color-ink-faint)] mt-1 mb-6">{p.note}</div>
              <ul className="space-y-2 mb-6">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--color-buck)] mt-0.5">·</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              {p.ctaUrl ? (
                <Link href={p.ctaUrl} className={p.featured ? 'btn btn-buck w-full justify-center' : 'btn w-full justify-center'}>
                  {p.cta}
                </Link>
              ) : (
                <span className="btn w-full justify-center opacity-50 cursor-not-allowed">
                  {p.cta}
                </span>
              )}
            </PaperCard>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-[var(--color-ink-soft)] italic">
          You cover the LLM and sandbox costs Buck incurs at-cost — no markup during beta. Caps
          are enforced. Buck halts cleanly when he hits them.
        </p>
      </section>

      <Fleuron />

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <Stamp>Questions</Stamp>
          <h2 className="display text-5xl mt-4 leading-tight">Asked & answered.</h2>
        </div>
        <div className="space-y-8">
          {[
            { q: 'Does Buck see my passwords or credentials?',
              a: 'No. You paste integration tokens into an encrypted vault. They are decrypted only at session boot and exist as plaintext only inside an isolated sandbox that dies when the session ends. The platform itself never reads or logs the values.' },
            { q: 'What if Buck does something I didn\'t want?',
              a: "He pauses before destructive actions — sending email, deleting files, charging cards — and waits for your approval. You configure which categories require pauses. You can also cancel a session at any time, and the diary will tell you exactly what he did up to that point." },
            { q: 'How does the self-modification work?',
              a: "After each session Buck may propose a diff to his own prompt or main script, with a written rationale. You review the diff side-by-side and approve or reject. Locked safety regions can't be modified. If approved changes lead to repeated failures, automatic rollback restores the previous version." },
            { q: "What models can I use?",
              a: "Anything on OpenRouter. Default is GLM-5 (cheap and fast). For complex tasks, switch to Claude sonnet 4.6 or GPT-5 from the model picker on the new-session form. You can also paste a custom OpenRouter slug." },
            { q: "How long can a session run?",
              a: "Up to 4 hours per session in current limits, with a 40-iteration loop cap on the agent itself. Most real tasks finish in 2 to 30 minutes. The 'overnight' framing is about when you start a session, not how long it runs." },
            { q: "Can I run Buck against a private API?",
              a: "Yes — set the relevant env vars in your integration vault and Buck can fetch any URL. For frequently-used APIs you can add a typed manifest entry; for one-offs, use the built-in sandbox.shell tool to curl them directly." },
            { q: "Is my data shared with model providers?",
              a: "Tool inputs and outputs are sent to your chosen LLM (OpenRouter, then onwards to the model provider) as part of normal agent operation. Nothing else is shared. We do not train on your data." },
            { q: "Open source?",
              a: "Not yet. The architecture (vault, sandbox, approval gate, self-mod loop) is novel enough that we'd like to refine it before opening the source. Drop a note if you'd like early access to the code." },
          ].map((item, i) => (
            <div key={i} className="border-b border-[var(--color-rule)] pb-6 last:border-0">
              <h3 className="display text-2xl mb-2">{item.q}</h3>
              <p className="serif leading-relaxed text-[var(--color-ink-soft)]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule-thick" /></div>

      {/* ─── CTA ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-32 text-center relative">
        <div className="flex justify-center mb-10 opacity-90">
          <BuckMark size={140} />
        </div>
        <h2 className="display text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.92] italic">
          Sleep already.
        </h2>
        <p className="mt-6 text-2xl text-[var(--color-ink-soft)] serif italic">Buck has it.</p>
        <Link href="/auth/sign-in" className="btn btn-buck mt-10 inline-flex">
          Hire Buck →
        </Link>
        <p className="mt-6 mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-faint)]">
          Free during beta · No credit card · Sign in with Google
        </p>
      </section>

      {/* ─── COLOPHON FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t-[3px] border-double border-[var(--color-ink)]">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BuckMark size={36} />
              <div>
                <div className="display text-xl">Buck</div>
                <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
                  the night-shift gazette
                </div>
              </div>
            </div>
            <p className="serif italic text-[var(--color-ink-soft)] text-sm">
              Stop working. Start sleeping.
            </p>
          </div>
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">Product</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#how" className="hover:text-[var(--color-buck)]">How it works</a></li>
              <li><a href="#diary" className="hover:text-[var(--color-buck)]">The diary</a></li>
              <li><a href="#integrations" className="hover:text-[var(--color-buck)]">Integrations</a></li>
              <li><a href="#trust" className="hover:text-[var(--color-buck)]">Architecture</a></li>
              <li><a href="#pricing" className="hover:text-[var(--color-buck)]">Plans</a></li>
            </ul>
          </div>
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">Account</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/sign-in" className="hover:text-[var(--color-buck)]">Sign in</Link></li>
              <li><Link href="/dashboard" className="hover:text-[var(--color-buck)]">Dashboard</Link></li>
              <li><Link href="/integrations" className="hover:text-[var(--color-buck)]">Integrations</Link></li>
              <li><Link href="/script" className="hover:text-[var(--color-buck)]">Buck&apos;s script</Link></li>
            </ul>
          </div>
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">Colophon</div>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Set in Source Serif 4 and JetBrains Mono on beige paper, ruled.
              Crest engraved by hand. Built by one person who would rather sleep.
            </p>
          </div>
        </div>
        <div className="border-t border-[var(--color-rule)]">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-faint)]">
            <span>© Buck · Walnut Labs · {new Date().getFullYear()}</span>
            <span>v0.1 · MVP · Built overnight</span>
          </div>
        </div>
      </footer>
    </div>
  );
}