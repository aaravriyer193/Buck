// =============================================================================
// Database row types — generated to match the Supabase schema in
// /supabase/migrations/. Run `pnpm db:types` after schema changes to regenerate.
// =============================================================================

export type SelfModifyMode = 'approval' | 'auto' | 'off';

export type SessionStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'budget_halt';

export type EventType =
  | 'thought'
  | 'action'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'approval_request'
  | 'approval_decision'
  | 'budget_warning'
  | 'system'
  | 'task_started'
  | 'task_completed'
  | 'task_skipped';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'failed';

export type ScriptVersionStatus =
  | 'active'
  | 'draft'
  | 'rejected'
  | 'rolled_back'
  | 'superseded';

export type PendingChangeStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'superseded';

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'timeout';

export interface Profile {
  id: string;
  display_name: string | null;
  notification_email: string | null;
  monthly_budget_usd: number;
  per_session_budget_usd: number;
  self_modify_mode: SelfModifyMode;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  service: string;
  display_name: string | null;
  secrets_encrypted: string;
  enabled: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScriptVersion {
  id: string;
  user_id: string;
  parent_id: string | null;
  main_ts: string;
  prompt_md: string;
  created_by: 'user' | 'buck' | 'system';
  status: ScriptVersionStatus;
  notes: string | null;
  created_at: string;
}

export interface PendingChange {
  id: string;
  user_id: string;
  session_id: string | null;
  base_version_id: string;
  proposed_main_ts: string;
  proposed_prompt_md: string;
  rationale: string;
  status: PendingChangeStatus;
  created_at: string;
  decided_at: string | null;
  decision_note: string | null;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  prompt: string | null;
  status: TaskStatus;
  result_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  script_version_id: string;
  model: string;
  status: SessionStatus;
  task_ids: string[];
  started_at: string | null;
  ended_at: string | null;
  cost_usd: number;
  cost_estimate_low: number | null;
  cost_estimate_high: number | null;
  confidence_score: number | null;
  error: string | null;
  created_at: string;
}

export interface SessionEvent {
  id: number;
  session_id: string;
  seq: number;
  type: EventType;
  payload: Record<string, unknown>;
  ts: string;
}

export interface Diary {
  id: string;
  session_id: string;
  user_id: string;
  summary: string;
  what_worked: string | null;
  what_failed: string | null;
  proposed_changes: { has_proposal: boolean; pending_change_id?: string } | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  session_id: string;
  user_id: string;
  action_type: string;
  description: string;
  payload: Record<string, unknown> | null;
  status: ApprovalStatus;
  requested_at: string;
  decided_at: string | null;
  decision_note: string | null;
  timeout_at: string | null;
}

export interface UsageEvent {
  id: number;
  user_id: string;
  session_id: string | null;
  kind: 'llm_tokens' | 'sandbox_seconds';
  units: number;
  unit_cost_usd: number;
  total_usd: number;
  meta: Record<string, unknown>;
  ts: string;
}
