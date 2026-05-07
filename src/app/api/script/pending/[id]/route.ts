import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const Body = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const service = createServiceClient();
  const { data: pending } = await service
    .from('pending_changes')
    .select('*')
    .eq('id', id)
    .single();
  if (!pending || pending.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (pending.status !== 'pending') {
    return NextResponse.json({ error: 'already_decided' }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (parsed.data.decision === 'reject') {
    await service
      .from('pending_changes')
      .update({ status: 'rejected', decided_at: now, decision_note: parsed.data.note ?? null })
      .eq('id', id);
    return NextResponse.json({ ok: true, applied: false });
  }

  // Approve: create new active version, demote prior
  await service
    .from('script_versions')
    .update({ status: 'superseded' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  const inserted = await service
    .from('script_versions')
    .insert({
      user_id: user.id,
      parent_id: pending.base_version_id,
      main_ts: pending.proposed_main_ts,
      prompt_md: pending.proposed_prompt_md,
      created_by: 'buck',
      status: 'active',
      notes: pending.rationale,
    })
    .select('id')
    .single();

  if (inserted.error) {
    return NextResponse.json({ error: inserted.error.message }, { status: 500 });
  }

  await service
    .from('pending_changes')
    .update({ status: 'approved', decided_at: now, decision_note: parsed.data.note ?? null })
    .eq('id', id);

  return NextResponse.json({ ok: true, applied: true, new_version_id: inserted.data?.id });
}
