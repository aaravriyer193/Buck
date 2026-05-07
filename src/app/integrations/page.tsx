import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/buck/SiteHeader';
import { Stamp } from '@/components/ui/Stamp';
import { ALL_INTEGRATIONS } from '@/integrations';
import { IntegrationsGrid } from './IntegrationsGrid';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: connected } = await supabase
    .from('integrations')
    .select('id, service, display_name, enabled, last_used_at, created_at');

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <Stamp>The Vault</Stamp>
          <h1 className="display text-5xl mt-3 leading-tight">Buck&apos;s tools.</h1>
          <p className="mt-3 text-[var(--color-ink-soft)] max-w-2xl">
            Bring your own keys. They&apos;re encrypted at rest with AES-256-GCM and only ever
            decrypted into a fresh sandbox at session start.
          </p>
        </div>
        <IntegrationsGrid manifests={ALL_INTEGRATIONS} connected={connected ?? []} />
      </main>
    </div>
  );
}
