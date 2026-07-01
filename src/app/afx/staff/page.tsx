import AfxTopBar from '@/components/afx/AfxTopBar';
import Link from 'next/link';
import { listSubmissions } from '@/lib/afx/server/staffReview';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import StaffQueue from '@/components/afx/staff/StaffQueue';

const navLink: React.CSSProperties = { fontFamily: 'var(--afx-mono)', fontSize: 11, fontWeight: 700, color: 'var(--afx-muted)', textDecoration: 'none', border: '1px solid var(--afx-border)', borderRadius: 8, padding: '7px 13px' };

export default async function AfxStaffPage() {
  const staff = await resolveStaff();
  const open = await listSubmissions('open');
  const decided = await listSubmissions('decided');
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
          <Link href="/afx/staff/invites" style={navLink}>Invites →</Link>
          {staff?.role === 'admin' ? (
            <Link href="/afx/staff/team" style={navLink}>Manage team →</Link>
          ) : null}
        </div>
        <StaffQueue open={open} decided={decided} />
      </main>
    </div>
  );
}
