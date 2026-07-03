import { notFound } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { getSubmissionDetail } from '@/lib/afx/server/staffReview';
import StaffSubmissionDetail from '@/components/afx/staff/StaffSubmissionDetail';

export default async function AfxStaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await resolveStaff();
  const detail = await getSubmissionDetail(id);
  if (!detail) notFound();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" staffRole={staff?.role ?? null} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffSubmissionDetail detail={detail} />
      </main>
    </div>
  );
}
