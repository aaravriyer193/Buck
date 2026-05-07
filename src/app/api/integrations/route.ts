import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { encryptSecrets } from '@/lib/buck/vault';
import { getIntegration } from '@/integrations';

const Body = z.object({
  service: z.string().min(1),
  display_name: z.string().max(100).optional(),
  secrets: z.record(z.string(), z.string()),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const manifest = getIntegration(parsed.data.service);
  if (!manifest) return NextResponse.json({ error: 'unknown_service' }, { status: 400 });

  // Validate required env vars are present
  for (const ev of manifest.env_vars) {
    if (!ev.optional && !parsed.data.secrets[ev.name]) {
      return NextResponse.json({ error: 'missing_field', field: ev.name }, { status: 400 });
    }
  }

  const ciphertext = encryptSecrets(parsed.data.secrets);
  const service = createServiceClient();

  // Upsert by (user_id, service, display_name)
  const { error } = await service.from('integrations').upsert(
    {
      user_id: user.id,
      service: parsed.data.service,
      display_name: parsed.data.display_name ?? null,
      secrets_encrypted: ciphertext,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,service,display_name' }
  );

  if (error) {
    return NextResponse.json({ error: 'upsert_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
