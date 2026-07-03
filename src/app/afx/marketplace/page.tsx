import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listFunderMarketRows } from '@/lib/afx/server/funderMarketplace';
import FunderMarket from '@/components/afx/marketplace/FunderMarket';

export default async function AfxMarketplacePage() {
  const staff = await resolveStaff();
  if (!staff) redirect('/afx/staff');
  const rows = await listFunderMarketRows();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="Deal screening" />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <FunderMarket rows={rows} />
      </main>
    </div>
  );
}
