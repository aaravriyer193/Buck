-- =============================================================================
-- Buck — initial schema
-- =============================================================================
-- Approval-gated self-modification, integration vault, sessions, diaries,
-- live event stream for replay, and usage events for cost tracking.
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =============================================================================
-- profiles — extends auth.users
-- =============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  notification_email text,
  monthly_budget_usd numeric(10,2) not null default 100.00,
  per_session_budget_usd numeric(10,2) not null default 5.00,
  self_modify_mode text not null default 'approval'
    check (self_modify_mode in ('approval', 'auto', 'off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, notification_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- integrations — encrypted vault
-- =============================================================================
-- secrets_encrypted is JSON encoded as base64-encrypted bytes; we use
-- application-level encryption via VAULT_ENCRYPTION_KEY (see /lib/buck/vault.ts).
-- =============================================================================
create table public.integrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service text not null,                   -- e.g. 'github', 'slack', 'notion'
  display_name text,                       -- user-supplied label
  secrets_encrypted text not null,         -- ciphertext (base64)
  enabled boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, service, display_name)
);

create index idx_integrations_user on public.integrations(user_id);

-- =============================================================================
-- script_versions — versioned mutable agent files (main.ts + prompt.md)
-- =============================================================================
create table public.script_versions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.script_versions(id) on delete set null,
  main_ts text not null,
  prompt_md text not null,
  created_by text not null check (created_by in ('user', 'buck', 'system')),
  status text not null default 'active'
    check (status in ('active', 'draft', 'rejected', 'rolled_back', 'superseded')),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_script_versions_user_active on public.script_versions(user_id) where status = 'active';
create index idx_script_versions_user_created on public.script_versions(user_id, created_at desc);

-- =============================================================================
-- pending_changes — Buck's self-mod proposals awaiting user approval
-- =============================================================================
create table public.pending_changes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid,
  base_version_id uuid not null references public.script_versions(id) on delete cascade,
  proposed_main_ts text not null,
  proposed_prompt_md text not null,
  rationale text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'superseded')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decision_note text
);

create index idx_pending_changes_user_pending on public.pending_changes(user_id) where status = 'pending';

-- =============================================================================
-- tasks — items the user wants Buck to do
-- =============================================================================
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text,                             -- optional extra detail
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
  result_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_user on public.tasks(user_id, created_at desc);

-- =============================================================================
-- sessions — one Buck run
-- =============================================================================
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  script_version_id uuid not null references public.script_versions(id),
  model text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled', 'budget_halt')),
  task_ids uuid[] not null default '{}',
  started_at timestamptz,
  ended_at timestamptz,
  cost_usd numeric(10,4) not null default 0,
  cost_estimate_low numeric(10,4),
  cost_estimate_high numeric(10,4),
  confidence_score smallint,               -- 0-100
  error text,
  created_at timestamptz not null default now()
);

create index idx_sessions_user_created on public.sessions(user_id, created_at desc);
create index idx_sessions_status on public.sessions(status) where status in ('queued', 'running');

-- =============================================================================
-- session_events — live + replay event stream
-- =============================================================================
create table public.session_events (
  id bigserial primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  seq integer not null,
  type text not null
    check (type in ('thought', 'action', 'tool_call', 'tool_result', 'error',
                    'approval_request', 'approval_decision', 'budget_warning',
                    'system', 'task_started', 'task_completed', 'task_skipped')),
  payload jsonb not null default '{}'::jsonb,
  ts timestamptz not null default now(),
  unique (session_id, seq)
);

create index idx_session_events_session_seq on public.session_events(session_id, seq);

-- Enable realtime for live streaming
alter publication supabase_realtime add table public.session_events;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.approval_requests;

-- =============================================================================
-- diaries — Buck's reflection on each session
-- =============================================================================
create table public.diaries (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  what_worked text,
  what_failed text,
  proposed_changes jsonb,                  -- {has_proposal: bool, pending_change_id?: uuid}
  created_at timestamptz not null default now()
);

create index idx_diaries_user on public.diaries(user_id, created_at desc);

-- =============================================================================
-- approval_requests — Buck pauses, asks user, resumes
-- =============================================================================
create table public.approval_requests (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,               -- email_send, file_delete, etc.
  description text not null,
  payload jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied', 'timeout')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decision_note text,
  timeout_at timestamptz
);

create index idx_approval_requests_session on public.approval_requests(session_id);
create index idx_approval_requests_user_pending on public.approval_requests(user_id) where status = 'pending';

-- =============================================================================
-- usage_events — granular cost tracking
-- =============================================================================
create table public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  kind text not null check (kind in ('llm_tokens', 'sandbox_seconds')),
  units numeric(12,4) not null,            -- tokens or seconds
  unit_cost_usd numeric(12,8) not null,
  total_usd numeric(10,6) not null,
  meta jsonb default '{}'::jsonb,
  ts timestamptz not null default now()
);

create index idx_usage_events_user_ts on public.usage_events(user_id, ts desc);
create index idx_usage_events_session on public.usage_events(session_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.integrations enable row level security;
alter table public.script_versions enable row level security;
alter table public.pending_changes enable row level security;
alter table public.tasks enable row level security;
alter table public.sessions enable row level security;
alter table public.session_events enable row level security;
alter table public.diaries enable row level security;
alter table public.approval_requests enable row level security;
alter table public.usage_events enable row level security;

-- profiles
create policy "users read own profile"      on public.profiles for select using (auth.uid() = id);
create policy "users update own profile"    on public.profiles for update using (auth.uid() = id);

-- integrations
create policy "users manage own integrations" on public.integrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- script_versions
create policy "users manage own scripts" on public.script_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pending_changes
create policy "users manage own pending_changes" on public.pending_changes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tasks
create policy "users manage own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sessions
create policy "users read own sessions"   on public.sessions for select using (auth.uid() = user_id);
create policy "users insert own sessions" on public.sessions for insert with check (auth.uid() = user_id);
create policy "users update own sessions" on public.sessions for update using (auth.uid() = user_id);

-- session_events: read-only for users (writes are server-side via service role)
create policy "users read own session_events" on public.session_events
  for select using (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- diaries
create policy "users read own diaries" on public.diaries for select using (auth.uid() = user_id);

-- approval_requests
create policy "users manage own approvals" on public.approval_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- usage_events
create policy "users read own usage" on public.usage_events
  for select using (auth.uid() = user_id);
