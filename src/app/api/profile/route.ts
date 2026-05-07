import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Body = z.object({
  display_name: z.string().max(100).nullable().optional(),
  notification_email: z.string().email().nullable().optional(),
  monthly_budget_usd: z.number().min(0).max(10000).optional(),
  per_session_budget_usd: z.number().min(0).max(1000).optional(),
  self_modify_mode: z.enum(['approval', 'auto', 'off']).optional(),
  require_approval_for: z.array(z.string()).optional(),  // ← new
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { error } = await supabase
    .from('profiles')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
