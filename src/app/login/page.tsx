import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    'use server';
    const password = formData.get('password');
    if (password === 'admin123') { // Simple hardcoded password for MVP
      const store = await cookies();
      store.set('admin_auth', 'true', { secure: process.env.NODE_ENV === 'production', path: '/' });
      redirect('/admin');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full glass-card p-8 rounded-2xl relative z-10">
        <h1 className="text-3xl font-bold font-heading text-center mb-6">Admin Login</h1>
        <form action={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium opacity-80 mb-2">Password</label>
            <input 
              type="password" 
              name="password" 
              required
              className="w-full bg-black/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Enter password"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl px-4 py-3 font-medium transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
