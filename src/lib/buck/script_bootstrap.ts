// =============================================================================
// Buck — script bootstrap
// =============================================================================
// When a user runs their first session, they need an initial script_version
// row containing Buck's default main.ts and prompt.md. We read these from the
// runtime files at build time and seed them per-user on demand.
// =============================================================================

import { readFile } from 'fs/promises';
import { join } from 'path';
import { createServiceClient } from '@/lib/supabase/server';

let cached: { main_ts: string; prompt_md: string } | null = null;

async function loadDefaults() {
  if (cached) return cached;
  const root = process.cwd();
  const main = await readFile(join(root, 'src/runtime/main.ts'), 'utf8');
  const prompt = await readFile(join(root, 'src/runtime/prompt.md'), 'utf8');
  cached = { main_ts: main, prompt_md: prompt };
  return cached;
}

export async function ensureActiveScript(userId: string): Promise<{ id: string; main_ts: string; prompt_md: string }> {
  const supabase = createServiceClient();
  const existing = await supabase
    .from('script_versions')
    .select('id, main_ts, prompt_md')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (existing.data) return existing.data;

  const defaults = await loadDefaults();
  const inserted = await supabase
    .from('script_versions')
    .insert({
      user_id: userId,
      main_ts: defaults.main_ts,
      prompt_md: defaults.prompt_md,
      created_by: 'system',
      status: 'active',
      notes: 'Default Buck script v1.',
    })
    .select('id, main_ts, prompt_md')
    .single();

  if (inserted.error || !inserted.data) {
    throw new Error(`Failed to seed script: ${inserted.error?.message}`);
  }
  return inserted.data;
}
