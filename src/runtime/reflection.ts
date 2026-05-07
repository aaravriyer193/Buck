// =============================================================================
// Buck — reflection
// =============================================================================
// Runs after the diary is written. Reads the diary + recent script versions
// and proposes a `pending_change` (a diff to main.ts and/or prompt.md) if Buck
// has a real improvement to offer. With BUCK_SELF_MODIFY_MODE=approval (the
// default), the change goes into the pending inbox for the user to review.
//
// Locked regions in main.ts (// @buck:locked-start ... // @buck:locked-end)
// must be preserved unchanged in any proposal.
// =============================================================================

import { chat } from '@/lib/openrouter/client';
import { createServiceClient } from '@/lib/supabase/server';

interface ReflectionArgs {
  sessionId: string;
  userId: string;
  scriptVersionId: string;
}

export async function runReflection(args: ReflectionArgs): Promise<{
  proposed: boolean;
  pending_change_id?: string;
  reason?: string;
}> {
  const supabase = createServiceClient();

  const profile = await supabase
    .from('profiles')
    .select('self_modify_mode')
    .eq('id', args.userId)
    .single();

  if (profile.data?.self_modify_mode === 'off') {
    return { proposed: false, reason: 'self_modify_off' };
  }

  const diary = await supabase
    .from('diaries')
    .select('summary, what_worked, what_failed')
    .eq('session_id', args.sessionId)
    .single();

  if (!diary.data) return { proposed: false, reason: 'no_diary' };

  const version = await supabase
    .from('script_versions')
    .select('id, main_ts, prompt_md')
    .eq('id', args.scriptVersionId)
    .single();

  if (!version.data) return { proposed: false, reason: 'no_version' };

  const reflectionModel =
    process.env.OPENROUTER_REFLECTION_MODEL ||
    process.env.OPENROUTER_FALLBACK_MODEL ||
    process.env.OPENROUTER_DEFAULT_MODEL ||
    'zhipu/glm-5';

  const prompt = `You are reviewing your own performance as the agent Buck.

Below is your diary from the latest session, followed by your current main.ts and prompt.md.

Diary:
SUMMARY: ${diary.data.summary}
WHAT WORKED: ${diary.data.what_worked}
WHAT I'D CHANGE: ${diary.data.what_failed}

Current main.ts:
\`\`\`ts
${version.data.main_ts}
\`\`\`

Current prompt.md:
\`\`\`md
${version.data.prompt_md}
\`\`\`

If you have a concrete, narrow improvement to propose — and only if you do — return JSON:

{
  "propose": true,
  "rationale": "One paragraph explaining the change and why.",
  "new_main_ts": "the full new contents of main.ts",
  "new_prompt_md": "the full new contents of prompt.md"
}

Constraints:
- Preserve every \`// @buck:locked-start\` ... \`// @buck:locked-end\` region byte-for-byte. The rationale must not propose changes to those regions.
- Prefer prompt.md changes over main.ts changes when the desired effect is achievable through prompting.
- If you have nothing worth proposing, return {"propose": false, "rationale": "why not"}.

Output ONLY the JSON.`;

  let parsed: {
    propose: boolean;
    rationale?: string;
    new_main_ts?: string;
    new_prompt_md?: string;
  };

  try {
    const result = await chat({
      model: reflectionModel,
      messages: [
        { role: 'system', content: 'You propose careful, narrow self-modifications for the agent Buck.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 4000,
    });
    parsed = JSON.parse(stripFences(result.content));
  } catch (err) {
    return { proposed: false, reason: `reflection_failed:${(err as Error).message}` };
  }

  if (!parsed.propose) return { proposed: false, reason: 'no_proposal' };

  // Validate locked regions are preserved
  if (
    !lockedRegionsMatch(version.data.main_ts, parsed.new_main_ts ?? version.data.main_ts)
  ) {
    return { proposed: false, reason: 'locked_region_violated' };
  }

  const { data: pending, error } = await supabase
    .from('pending_changes')
    .insert({
      user_id: args.userId,
      session_id: args.sessionId,
      base_version_id: args.scriptVersionId,
      proposed_main_ts: parsed.new_main_ts ?? version.data.main_ts,
      proposed_prompt_md: parsed.new_prompt_md ?? version.data.prompt_md,
      rationale: parsed.rationale ?? '(no rationale provided)',
    })
    .select('id')
    .single();

  if (error || !pending) {
    return { proposed: false, reason: `insert_failed:${error?.message ?? 'unknown'}` };
  }

  // Update the diary so the dashboard can surface "Buck has a proposal"
  await supabase
    .from('diaries')
    .update({ proposed_changes: { has_proposal: true, pending_change_id: pending.id } })
    .eq('session_id', args.sessionId);

  return { proposed: true, pending_change_id: pending.id };
}

function stripFences(s: string): string {
  return s.replace(/```json|```/g, '').trim();
}

const LOCKED_REGION_RE = /\/\/ @buck:locked-start[\s\S]*?\/\/ @buck:locked-end/g;

function lockedRegionsMatch(original: string, proposed: string): boolean {
  const a = original.match(LOCKED_REGION_RE) ?? [];
  const b = proposed.match(LOCKED_REGION_RE) ?? [];
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
