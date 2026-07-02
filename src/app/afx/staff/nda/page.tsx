import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listNdaSignatures } from '@/lib/afx/server/staffNdaLog';
import StaffNdaLog from '@/components/afx/staff/StaffNdaLog';

export default async function AfxStaffNdaPage() {
  const staff = await resolveStaff();
  if (!staff) redirect('/afx/staff');
  const entries = await listNdaSignatures();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffNdaLog entries={entries} />
      </main>
    </div>
  );
}
