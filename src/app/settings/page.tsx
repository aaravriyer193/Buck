import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/buck/SiteHeader';
import { Stamp } from '@/components/ui/Stamp';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <Stamp>The Settings</Stamp>
          <h1 className="display text-5xl mt-3 leading-tight">How Buck behaves.</h1>
        </div>
        <SettingsForm
          initial={{
            display_name: profile?.display_name ?? '',
            notification_email: profile?.notification_email ?? user.email ?? '',
            monthly_budget_usd: Number(profile?.monthly_budget_usd ?? 100),
            per_session_budget_usd: Number(profile?.per_session_budget_usd ?? 5),
            self_modify_mode: (profile?.self_modify_mode ?? 'approval') as 'approval' | 'auto' | 'off',
            require_approval_for: profile?.require_approval_for ?? [
            'email_send','file_delete','payment','calendar_invite','public_post','destructive_db_write'
            ],
          }}
        />
      </main>
    </div>
  );
}
