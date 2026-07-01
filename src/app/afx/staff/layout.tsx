import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { resolveStaff } from '@/lib/afx/server/staffAccess';

export default async function AfxStaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/afx/staff');
  const staff = await resolveStaff();
  if (!staff) redirect('/afx');
  return <>{children}</>;
}
