import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const { data: session } = await service
    .from('sessions')
    .select('user_id, status')
    .eq('id', id)
    .single();

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!['queued', 'running'].includes(session.status)) {
    return NextResponse.json({ error: 'not_cancellable', status: session.status }, { status: 409 });
  }

  await service
    .from('sessions')
    .update({ status: 'cancelled', ended_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({ ok: true });
}
