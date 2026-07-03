import AfxTopBar from '@/components/afx/AfxTopBar';
import { listSubmissions } from '@/lib/afx/server/staffReview';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import StaffQueue from '@/components/afx/staff/StaffQueue';

export default async function AfxStaffPage() {
  const staff = await resolveStaff();
  const open = await listSubmissions('open');
  const decided = await listSubmissions('decided');
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" staffRole={staff?.role ?? null} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffQueue open={open} decided={decided} />
      </main>
    </div>
  );
}
