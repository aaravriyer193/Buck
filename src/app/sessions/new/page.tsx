import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/buck/SiteHeader';
import { PaperCard } from '@/components/ui/PaperCard';
import { Stamp } from '@/components/ui/Stamp';
import { NewSessionForm } from './NewSessionForm';

export const dynamic = 'force-dynamic';

export default async function NewSessionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: integrations } = await supabase
    .from('integrations')
    .select('id, service, display_name, enabled')
    .eq('enabled', true)
    .order('service');

  const enabledServices = Array.from(new Set((integrations ?? []).map((i) => i.service)));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Stamp>The Brief</Stamp>
          <h1 className="display text-5xl mt-3 leading-tight">Hand Buck the list.</h1>
          <p className="mt-3 text-[var(--color-ink-soft)]">
            One task per line. Keep it specific — Buck does better with sharp asks than fuzzy ones.
          </p>
        </div>

        {enabledServices.length === 0 ? (
          <PaperCard className="text-center py-12 mb-8">
            <p className="display italic text-2xl">No tools.</p>
            <p className="mt-2 text-[var(--color-ink-soft)]">
              Buck can still think, but he can't do much without integrations.
            </p>
            <Link href="/integrations" className="btn btn-buck mt-6 inline-flex">
              Connect something →
            </Link>
          </PaperCard>
        ) : (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)] mr-2">
              Available tools:
            </span>
            {enabledServices.map((s) => (
              <Stamp key={s}>{s}</Stamp>
            ))}
          </div>
        )}

        <NewSessionForm canStart={enabledServices.length > 0} />
      </main>
    </div>
  );
}
