// =============================================================================
// Buck — diary writer
// =============================================================================
// At session end, summarize the session_events into a structured diary entry.
// This runs on a separate LLM call and uses a stronger model when available
// because the reflection quality matters more than raw speed.
// =============================================================================

import { chat } from '@/lib/openrouter/client';
import { createServiceClient } from '@/lib/supabase/server';

interface DiaryArgs {
  sessionId: string;
  userId: string;
  exitReason: 'completed' | 'failed' | 'budget_halt' | 'cancelled';
  errorMessage?: string;
  model: string;
}

export async function writeDiary(args: DiaryArgs): Promise<void> {
  const supabase = createServiceClient();

  // Pull the session events. We pass them in compressed form to keep tokens down.
  const { data: events } = await supabase
    .from('session_events')
    .select('seq, type, payload, ts')
    .eq('session_id', args.sessionId)
    .order('seq', { ascending: true });

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, result_summary')
    .eq('user_id', args.userId)
    .in(
      'id',
      ((await supabase.from('sessions').select('task_ids').eq('id', args.sessionId).single()).data
        ?.task_ids ?? []) as string[]
    );

  const compactEvents = (events ?? [])
    .map((e: { type: string; payload: unknown }) => `[${e.type}] ${JSON.stringify(e.payload).slice(0, 400)}`)
    .join('\n');
  const taskSummary = (tasks ?? [])
    .map((t: { title: string; status: string; result_summary: string | null }) =>
      `- ${t.title} → ${t.status}${t.result_summary ? ` (${t.result_summary})` : ''}`)
    .join('\n');

  const diaryPrompt = `You just finished a session as Buck. Reflect on it.

Exit reason: ${args.exitReason}
${args.errorMessage ? `Error: ${args.errorMessage}` : ''}

Tasks:
${taskSummary || '(none)'}

Compact event log:
${compactEvents}

Write a diary entry in three short paragraphs:

1. **Summary** — one paragraph, plainspoken. What did you set out to do, what got done, what didn't.
2. **What worked** — one paragraph, specific. The approach, tool, or framing that paid off.
3. **What I'd change** — one paragraph. If there's a concrete thing about your prompt, your approach, or the way you reasoned that you'd want different next time, name it. If nothing comes to mind, say so plainly.

Use first person. Be honest. The user will read this in the morning.

Reply as JSON: {"summary": "...", "what_worked": "...", "what_failed": "..."}.
Output ONLY the JSON, no prose around it.`;

  const reflectionModel =
    process.env.OPENROUTER_REFLECTION_MODEL ||
    process.env.OPENROUTER_FALLBACK_MODEL ||
    args.model;

  let entry: { summary: string; what_worked: string; what_failed: string };

  try {
    const result = await chat({
      model: reflectionModel,
      messages: [
        { role: 'system', content: 'You write thoughtful diary entries as the agent Buck.' },
        { role: 'user', content: diaryPrompt },
      ],
      temperature: 0.5,
      maxTokens: 1500,
    });
    entry = parseDiary(result.content);
  } catch (err) {
    entry = {
      summary: `Session ended (${args.exitReason}). Diary generation failed.`,
      what_worked: '',
      what_failed: (err as Error).message,
    };
  }

  await supabase.from('diaries').insert({
    session_id: args.sessionId,
    user_id: args.userId,
    summary: entry.summary,
    what_worked: entry.what_worked,
    what_failed: entry.what_failed,
    proposed_changes: { has_proposal: false }, // reflection.ts may update this
  });
}

function parseDiary(content: string): { summary: string; what_worked: string; what_failed: string } {
  // Strip code fences if present
  const cleaned = content.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    return { summary: content.slice(0, 600), what_worked: '', what_failed: '' };
  }
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    return {
      summary: String(obj.summary ?? ''),
      what_worked: String(obj.what_worked ?? ''),
      what_failed: String(obj.what_failed ?? ''),
    };
  } catch {
    return { summary: content.slice(0, 600), what_worked: '', what_failed: '' };
  }
}
