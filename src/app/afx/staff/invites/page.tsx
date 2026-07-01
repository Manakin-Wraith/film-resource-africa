import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listInvites } from '@/lib/afx/server/staffInvites';
import StaffInvites from '@/components/afx/staff/StaffInvites';

export default async function AfxStaffInvitesPage() {
  const staff = await resolveStaff();
  if (!staff) redirect('/afx/staff');
  const rows = await listInvites();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffInvites rows={rows} />
      </main>
    </div>
  );
}
