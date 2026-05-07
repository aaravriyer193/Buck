import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/buck/SiteHeader';
import { SessionLive } from './SessionLive';

export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();
  if (!session) notFound();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, result_summary, user_id, prompt, created_at, updated_at')
    .in('id', session.task_ids);

  const { data: events } = await supabase
    .from('session_events')
    .select('*')
    .eq('session_id', id)
    .order('seq', { ascending: true });

  const { data: diary } = await supabase
    .from('diaries')
    .select('*')
    .eq('session_id', id)
    .maybeSingle();

  const { data: pendingApproval } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('session_id', id)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <SessionLive
        session={session}
        initialTasks={tasks ?? []}
        initialEvents={events ?? []}
        initialDiary={diary ?? null}
        initialApproval={pendingApproval ?? null}
      />
    </div>
  );
}
