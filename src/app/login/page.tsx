'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmed = email.trim().toLowerCase();

    /* Verify email belongs to an active member before sending link */
    const checkRes = await fetch(`/api/members/check-email?email=${encodeURIComponent(trimmed)}`);
    const { active } = await checkRes.json();

    if (!active) {
      setError("We don't have an active membership for that email. Check the address or join below.");
      setLoading(false);
      return;
    }

    const callbackUrl = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser: true,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(`/login/check-email?email=${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/icon.png" alt="FRA" width={40} height={40} className="opacity-90" />
          <div className="text-center">
            <h1 className="font-heading font-bold text-2xl">Member login</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--foreground-secondary)' }}>
              We&apos;ll send a magic link to your inbox — no password needed.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/[0.08] p-8 space-y-5"
          style={{ background: 'var(--surface)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--foreground-secondary)' }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                {error}
                {error.includes('join') && (
                  <span> <a href="/members#pricing" style={{ color: '#93c5fd', textDecoration: 'underline' }}>Join here →</a></span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-sm transition-colors"
              style={{
                background: loading ? 'rgba(59,130,246,0.5)' : '#3b82f6',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {loading ? 'Sending…' : 'Send magic link →'}
            </button>
          </form>

          <p className="text-center text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
            Not a member yet?{' '}
            <a href="/members#pricing" style={{ color: '#93c5fd' }}>Join FRA →</a>
          </p>
        </div>

        {/* Discreet admin link */}
        <p className="text-center text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
          <a href="/admin/login" style={{ color: 'rgba(250,250,250,0.15)' }}>Admin</a>
        </p>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
