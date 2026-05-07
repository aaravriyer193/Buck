-- =============================================================================
-- Buck — helper functions
-- =============================================================================

-- Atomically increment the cost of a session.
create or replace function public.increment_session_cost(
  p_session_id uuid,
  p_delta numeric
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.sessions
     set cost_usd = cost_usd + p_delta
   where id = p_session_id;
end;
$$;

-- Sum monthly spend for a user (used at session start to enforce monthly cap).
create or replace function public.user_monthly_spend(p_user_id uuid)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  total numeric;
begin
  select coalesce(sum(total_usd), 0)
    into total
    from public.usage_events
   where user_id = p_user_id
     and ts >= date_trunc('month', now());
  return total;
end;
$$;

-- Roll back to the most recent active script version, used by auto-rollback
-- safety net after N consecutive failures.
create or replace function public.rollback_active_script(p_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  prev_id uuid;
begin
  -- Find the previous version (parent of the current active one)
  with current_active as (
    select id, parent_id from public.script_versions
     where user_id = p_user_id and status = 'active'
     limit 1
  )
  select parent_id into prev_id from current_active;

  if prev_id is null then
    return null;
  end if;

  update public.script_versions
     set status = 'rolled_back'
   where user_id = p_user_id and status = 'active';

  update public.script_versions
     set status = 'active'
   where id = prev_id;

  return prev_id;
end;
$$;
