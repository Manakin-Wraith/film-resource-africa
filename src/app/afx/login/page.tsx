'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function AfxLoginForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get('error') === 'auth_failed';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notInvited, setNotInvited] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError(''); setNotInvited(false);
    const trimmed = email.trim().toLowerCase();
    try {
      const res = await fetch(`/api/afx/invite-check?email=${encodeURIComponent(trimmed)}`);
      const { invited } = await res.json();
      if (!invited) { setNotInvited(true); return; }
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/afx/producer`, shouldCreateUser: true },
      });
      if (authError) { setError(authError.message); return; }
      setSent(true);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="afx-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--afx-bg)', fontFamily: 'var(--afx-body)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--afx-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--afx-accent)', marginBottom: 10 }}>AFX — producer login</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px', margin: 0, color: 'var(--afx-ink)' }}>Sign in to AFX</h1>
          <p style={{ fontSize: 13.5, color: 'var(--afx-muted)', marginTop: 8 }}>We&apos;ll email you a magic link — no password.</p>
        </div>

        {linkExpired && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)', fontSize: 13, color: '#c0392b', textAlign: 'center' }}>
            That link has expired or was opened in a different browser. Enter your email below to get a new one — make sure to open it in <strong>this browser</strong>.
          </div>
        )}

        <div style={{ border: '1px solid var(--afx-border)', borderRadius: 14, background: 'var(--afx-surface)', padding: 24 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--afx-ink)', marginBottom: 6 }}>Check your inbox</div>
              <p style={{ fontSize: 13, color: 'var(--afx-muted)', margin: 0 }}>We sent a magic link to <strong>{email.trim().toLowerCase()}</strong>. Open it on this device to finish signing in.</p>
            </div>
          ) : notInvited ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--afx-ink)', marginBottom: 6 }}>You&apos;re not on the AFX list yet</div>
              <p style={{ fontSize: 13, color: 'var(--afx-muted)', margin: '0 0 16px' }}>AFX is invite-only. If you&apos;re an FRA producer and want access to the finance layer, request an invite.</p>
              <a href="mailto:hello@film-resource-africa.com?subject=AFX%20producer%20access" style={{ display: 'inline-block', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 9, border: '1px solid var(--afx-ink)', background: 'var(--afx-ink)', color: '#fff', textDecoration: 'none' }}>Request access</a>
              <div style={{ marginTop: 14 }}>
                <button onClick={() => setNotInvited(false)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--afx-mono)', fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'underline' }}>Try a different email</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--afx-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)', marginBottom: 6 }}>Email address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--afx-body)', fontSize: 14, border: '1px solid var(--afx-border)', borderRadius: 9, padding: '11px 13px', background: '#fff', color: 'var(--afx-ink)' }} />
              </div>
              {error ? <div style={{ fontSize: 12.5, color: '#c0392b' }}>{error}</div> : null}
              <button type="submit" disabled={loading}
                style={{ cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'var(--afx-body)', fontSize: 14, fontWeight: 700, padding: '12px', borderRadius: 9, border: '1px solid var(--afx-ink)', background: 'var(--afx-ink)', color: '#fff' }}>
                {loading ? 'Sending…' : 'Send magic link →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AfxLoginPage() {
  return (
    <Suspense fallback={null}>
      <AfxLoginForm />
    </Suspense>
  );
}
