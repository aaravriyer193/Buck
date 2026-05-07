# Buck

> **Stop working. Start sleeping.**
>
> An overnight autonomous agent. Hand him a task list at bedtime; wake up to a diary, a finished checklist, and an inbox that's already been swept.

Buck runs in an E2B sandbox with your integration tokens injected as `process.env`, executes through OpenRouter (GLM-5 default), streams every thought to a live dashboard, and writes a diary entry when he clocks off. After each session he may propose a change to his own script — you approve it or you don't.

This repository is the v1 MVP, covering phases 1–9 of the build plan:

- ✅ Auth (Google OAuth via Supabase)
- ✅ Integration vault (AES-256-GCM, bring your own keys)
- ✅ Buck's runtime (loop, tools, approval gate, budget guard)
- ✅ Session orchestration (E2B sandbox boot, secret injection)
- ✅ Live dashboard with realtime event streaming and typing animations
- ✅ Wake-up email summary
- ✅ Approval-gated self-modification with diff review
- ✅ Multi-Buck (parallel sessions per user)

Out of scope for this MVP: payments/Stripe, replay mode, public diary sharing, scheduled cron sessions.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Set up Supabase
supabase start                              # local
supabase db push                            # apply migrations

# 3. Configure
cp .env.example .env.local
# Fill in: Supabase URL/keys, Google OAuth, OpenRouter, E2B, Resend, VAULT_ENCRYPTION_KEY

# 4. Run
npm run dev
```

### Generating `VAULT_ENCRYPTION_KEY`

```bash
openssl rand -base64 32
```

This is the key that protects every user's integration tokens at rest. **Rotating it requires re-encrypting all `integrations.secrets_encrypted` rows** — there's no automatic migration. Don't lose it.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Browser (Next.js client)                                      │
│  ─ Live session view subscribes to Supabase Realtime channel   │
│  ─ Typing animations on streamed events                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼─────────────────────────────────────────────┐
│  Next.js server                                                │
│  ─ /api/sessions creates session, kicks orchestrator           │
│  ─ Orchestrator decrypts integration secrets, boots E2B,       │
│    runs Buck, writes diary, runs reflection, sends email       │
└──┬──────────┬──────────┬──────────┬────────────────────────────┘
   │          │          │          │
┌──▼──┐   ┌──▼──┐    ┌──▼──┐    ┌──▼──┐
│ DB  │   │ E2B │    │ OR  │    │Mail │
│Sup. │   │ box │    │GLM-5│    │Res. │
└─────┘   └─────┘    └─────┘    └─────┘
```

### Data flow for a single session

1. User submits task list → `POST /api/sessions` creates a `sessions` row (status `queued`)
2. Orchestrator (still server-side) loads the user's profile, active script version, and enabled integrations
3. Integration secrets are decrypted from the vault and merged into a single env map
4. E2B sandbox boots with those env vars
5. Buck's `runBuck()` runs: agent loop → plan → call tools → observe → repeat
6. Every event is written to `session_events` (Supabase publishes to clients via Realtime)
7. Destructive tool calls hit the approval gate, which polls `approval_requests` until the user decides
8. Token usage from OpenRouter and sandbox seconds are written to `usage_events`; `sessions.cost_usd` is incremented atomically
9. On exit, Buck writes a structured diary entry. Orchestrator then runs the reflection pass, which may insert a `pending_change`
10. Orchestrator sends the wake-up email via Resend

### Self-modification

Buck's mutable agent code lives in two files, versioned in the database:

- `main.ts` — the agent loop entrypoint
- `prompt.md` — the system prompt

After every session, a reflection pass reads the diary plus current versions and may propose a new pair. The proposal goes into `pending_changes`. The user reviews a side-by-side diff at `/script` and approves or rejects.

Locked regions in `main.ts` are marked `// @buck:locked-start` ... `// @buck:locked-end`. The reflection pass will reject its own proposal if those regions don't match byte-for-byte. The budget guard, the diary write, and the approval gate are all locked.

### The vault

User-supplied integration tokens are encrypted with AES-256-GCM (12-byte IV, 16-byte auth tag, key from `VAULT_ENCRYPTION_KEY`). The ciphertext is stored as base64 in `integrations.secrets_encrypted`. Decryption only ever happens server-side at session boot; the plaintext lives only in the E2B sandbox's `process.env`.

This means:
- No third-party OAuth handshakes for the platform to manage
- The user is responsible for scoping their tokens narrowly
- The platform never has the credentials in a form it can leak

---

## Project layout

```
src/
├── app/                           # Next.js routes
│   ├── api/                       # Server endpoints
│   ├── auth/                      # Sign-in, OAuth callback
│   ├── dashboard/                 # Session list
│   ├── sessions/[id]/             # Live session view
│   ├── integrations/              # Vault UI
│   ├── script/                    # Script + pending changes inbox
│   └── settings/                  # Profile, budget, self-mod mode
├── components/
│   ├── buck/                      # TypingText, SiteHeader
│   └── ui/                        # PaperCard, Stamp, DiffView
├── integrations/                  # 10 integration manifests
├── lib/
│   ├── buck/                      # Vault, orchestrator, script bootstrap
│   ├── e2b/                       # Sandbox helpers
│   ├── email/                     # Wake-up email
│   ├── openrouter/                # LLM client with fallback
│   └── supabase/                  # Server, browser, service clients
├── runtime/                       # Buck himself
│   ├── main.ts                    # Mutable, versioned, self-modifiable
│   ├── prompt.md                  # Mutable, versioned, self-modifiable
│   ├── loop.ts                    # The agent loop
│   ├── tool_registry.ts           # Builds the tool surface from manifests
│   ├── tool_runner.ts             # Dispatches tool calls into the sandbox
│   ├── event_stream.ts            # Live event publishing
│   ├── approval_gate.ts           # Pause/resume on destructive actions
│   ├── budget_guard.ts            # Halts gracefully at cost cap
│   ├── diary_writer.ts            # Reflective summary
│   └── reflection.ts              # Proposes self-modifications
└── middleware.ts                  # Route protection

supabase/migrations/               # Schema, RLS, helper functions
```

---

## Adding a new integration

1. Create `src/integrations/<service>.ts` exporting an `IntegrationManifest`
2. Add the manifest to the array in `src/integrations/index.ts`
3. Add an adapter to `ADAPTERS` in `src/runtime/tool_runner.ts` for each tool

The manifest declares the env vars Buck needs and the tool surface he can call. The user pastes their tokens into `/integrations`, and they're encrypted into the vault. At session boot, those tokens become `process.env.WHATEVER` inside the sandbox.

---

## Known limitations of this MVP

- **Tool adapters** for Gmail, Drive, Calendar, Notion, Linear, and Airtable are stubs. GitHub, Slack, Resend, and Firecrawl are fully implemented as the pattern. The stubs return a clear `not_implemented` error; Buck reports it in the diary. Filling them in is mechanical.
- **Sandbox cost** is computed using a static $/sec figure. Hook E2B's billing API in `orchestrator.ts` for accuracy.
- **Reflection model** defaults to OpenRouter's fallback if not set. For better self-mod proposals, set `OPENROUTER_REFLECTION_MODEL` to a stronger model.
- **Sessions run inline** in the API route process. For production, move `orchestrateSession` to a queue worker (Inngest, Trigger.dev, or a custom queue) — currently if the Next.js server restarts mid-session, the session is orphaned and will need manual cleanup.
- **No scheduled sessions** — "run tonight at 11pm" is left for a follow-up cron endpoint.

---

## Tagline

> Stop working. Start sleeping.
