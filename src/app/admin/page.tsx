import { getAllOpportunities, getAllCallSheetListings, getAllDirectoryListings, getAllPartners, getAllNewsAdmin } from '@/app/actions';
import AdminClient from '@/components/AdminClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Dashboard | Film Resource Africa',
  robots: 'noindex, nofollow',
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_auth')?.value === 'true';

  if (!isAdmin) {
    redirect('/login');
  }

  let opportunities: Awaited<ReturnType<typeof getAllOpportunities>> = [];
  let callSheetListings: Awaited<ReturnType<typeof getAllCallSheetListings>> = [];
  let directoryListings: Awaited<ReturnType<typeof getAllDirectoryListings>> = [];
  let partners: Awaited<ReturnType<typeof getAllPartners>> = [];
  let newsItems: Awaited<ReturnType<typeof getAllNewsAdmin>> = [];
  try {
    [opportunities, callSheetListings, directoryListings, partners, newsItems] = await Promise.all([
      getAllOpportunities(),
      getAllCallSheetListings(),
      getAllDirectoryListings(),
      getAllPartners(),
      getAllNewsAdmin(),
    ]);
  } catch (err) {
    console.error('Admin data fetch failed:', err);
  }

  return (
    <main className="min-h-screen bg-background relative z-10 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center bg-white/5 p-6 rounded-2xl glass-panel">
          <div>
            <h1 className="text-3xl font-bold font-heading text-primary">Admin Dashboard</h1>
            <p className="text-sm opacity-60">Manage your directory entries</p>
          </div>
          <form action={async () => {
            'use server';
            const { cookies } = await import('next/headers');
            const store = await cookies();
            store.delete('admin_auth');
            redirect('/login');
          }}>
            <button type="submit" className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors font-medium">
              Logout
            </button>
          </form>
        </header>

        <AdminClient initialData={opportunities} callSheetData={callSheetListings} directoryData={directoryListings} partnerData={partners} newsData={newsItems} />
      </div>
    </main>
  );
}
