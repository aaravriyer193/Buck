// =============================================================================
// Buck — task tracking helper
// =============================================================================

import { createServiceClient } from '@/lib/supabase/server';

export async function recordTaskUpdate(args: {
  taskId: string;
  userId: string;
  status: string;
  summary: string | null;
}): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('tasks')
    .update({
      status: args.status,
      result_summary: args.summary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', args.taskId)
    .eq('user_id', args.userId);
}
