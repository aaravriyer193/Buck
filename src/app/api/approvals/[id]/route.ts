import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const Body = z.object({
  decision: z.enum(['approved', 'denied']),
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
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: req } = await service
    .from('approval_requests')
    .select('user_id, status')
    .eq('id', id)
    .single();
  if (!req || req.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (req.status !== 'pending') {
    return NextResponse.json({ error: 'already_decided', status: req.status }, { status: 409 });
  }

  await service
    .from('approval_requests')
    .update({
      status: parsed.data.decision,
      decided_at: new Date().toISOString(),
      decision_note: parsed.data.note ?? null,
    })
    .eq('id', id);

  return NextResponse.json({ ok: true });
}
