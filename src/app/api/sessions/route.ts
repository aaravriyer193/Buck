import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ensureActiveScript } from '@/lib/buck/script_bootstrap';
import { orchestrateSession } from '@/lib/buck/orchestrator';

const CreateBody = z.object({
  task_titles: z.array(z.string().min(1).max(500)).min(1).max(50),
  prompt: z.string().max(8000).optional(),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.format() }, { status: 400 });
  }
  const { task_titles, prompt, model } = parsed.data;

  // Concurrency cap
  const maxParallel = Number(process.env.MAX_PARALLEL_SESSIONS_PER_USER ?? 3);
  const { count: running } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['queued', 'running']);
  if ((running ?? 0) >= maxParallel) {
    return NextResponse.json(
      { error: 'too_many_sessions', running, cap: maxParallel },
      { status: 429 }
    );
  }

  const service = createServiceClient();

  // Create tasks
  const taskRows = task_titles.map((title, i) => ({
    user_id: user.id,
    title,
    prompt: i === 0 && prompt ? prompt : null,
  }));
  const { data: tasks, error: taskErr } = await service
    .from('tasks')
    .insert(taskRows)
    .select('id') as { data: { id: string }[] | null; error: Error | null };
  if (taskErr || !tasks) {
    return NextResponse.json({ error: 'task_insert_failed', message: taskErr?.message }, { status: 500 });
  }

  // Active script for this user
  const script = await ensureActiveScript(user.id);

  const chosenModel = model || process.env.OPENROUTER_DEFAULT_MODEL || 'zhipu/glm-5';

  const { data: session, error: sessionErr } = await service
    .from('sessions')
    .insert({
      user_id: user.id,
      script_version_id: script.id,
      model: chosenModel,
      task_ids: tasks.map((t: { id: string }) => t.id),
      status: 'queued',
    })
    .select('id')
    .single();
  if (sessionErr || !session) {
    return NextResponse.json({ error: 'session_insert_failed', message: sessionErr?.message }, { status: 500 });
  }

  // Fire and forget — orchestrator runs the session.
  // In production this would be queued (Inngest, Trigger.dev, or a worker).
  // For v1, we kick it off here.
  void orchestrateSession(session.id).catch(async (err) => {
    console.error('orchestrateSession failed', err);
    await service
      .from('sessions')
      .update({ status: 'failed', ended_at: new Date().toISOString(), error: String(err?.message ?? err) })
      .eq('id', session.id);
  });

  return NextResponse.json({ id: session.id });
}
