import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listReviewRows } from '@/lib/afx/server/staffReviewMarketplace';
import StaffMarketplace from '@/components/afx/staff/StaffMarketplace';

export default async function AfxStaffMarketplacePage() {
  const staff = await resolveStaff();
  if (!staff) redirect('/afx/staff');
  const rows = await listReviewRows();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffMarketplace rows={rows} />
      </main>
    </div>
  );
}
