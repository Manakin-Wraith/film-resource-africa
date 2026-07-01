import 'server-only';
import { getSessionUser } from '@/lib/supabase/server';
import { afxAdmin } from '@/lib/afx/server/documentAccess';

export interface StaffAccess { userId: string; role: 'reviewer' | 'admin'; }

/** Resolve the calling session to a staff member via the afx_staff allowlist.
 *  Service-role read (afx_staff has RLS on, no client policies). Returns null for
 *  non-staff. This is THE gate — every staff route/action/layout calls it first. */
export async function resolveStaff(): Promise<StaffAccess | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { data } = await afxAdmin
    .from('afx_staff').select('user_id, role').eq('user_id', user.id)
    .maybeSingle<{ user_id: string; role: 'reviewer' | 'admin' }>();
  if (!data) return null;
  return { userId: data.user_id, role: data.role };
}
