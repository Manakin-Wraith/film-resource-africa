import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin | Film Resource Africa',
  robots: 'noindex, nofollow',
};

export default function AdminLoginPage() {
  async function handleLogin(formData: FormData) {
    'use server';
    const password = formData.get('password');
    if (password === 'admin123') {
      const store = await cookies();
      store.set('admin_auth', 'true', { secure: process.env.NODE_ENV === 'production', path: '/' });
      redirect('/admin');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] p-8 space-y-6"
        style={{ background: 'var(--surface)' }}>
        <h1 className="font-heading font-bold text-xl text-center">Admin access</h1>
        <form action={handleLogin} className="space-y-4">
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="Password"
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--foreground)',
            }}
          />
          <button
            type="submit"
            className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-white"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
