import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = { title: 'Check your email' };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md text-center space-y-6">

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            ✉
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-heading font-bold text-2xl">Check your inbox</h1>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
            We sent a magic link to{' '}
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
              {email ?? 'your email'}
            </span>
            .<br />
            Click the link to sign in — it expires in 1 hour.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] p-5 text-left space-y-2"
          style={{ background: 'var(--surface)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-tertiary)' }}>
            Can&apos;t find it?
          </p>
          <ul className="text-sm space-y-1.5" style={{ color: 'var(--foreground-secondary)' }}>
            <li>• Check your spam / junk folder</li>
            <li>• The sender is <span style={{ color: 'var(--foreground)' }}>hello@film-resource-africa.com</span></li>
            <li>• <a href="/login" style={{ color: '#93c5fd' }}>Try again with a different address</a></li>
          </ul>
        </div>

      </div>
    </main>
  );
}
