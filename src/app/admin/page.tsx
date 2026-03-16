import { getAllOpportunities } from '@/app/actions';
import AdminClient from '@/components/AdminClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_auth')?.value === 'true';

  if (!isAdmin) {
    redirect('/login');
  }

  const opportunities = await getAllOpportunities();

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

        <AdminClient initialData={opportunities} />
      </div>
    </main>
  );
}
