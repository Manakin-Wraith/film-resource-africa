import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listStaff } from '@/lib/afx/server/staffAdmin';
import StaffTeam from '@/components/afx/staff/StaffTeam';

export default async function AfxStaffTeamPage() {
  const staff = await resolveStaff();
  if (staff?.role !== 'admin') redirect('/afx/staff');
  const members = await listStaff();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" staffRole={staff?.role ?? null} />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffTeam members={members} selfUserId={staff.userId} />
      </main>
    </div>
  );
}
