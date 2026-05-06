import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Welcome to FRA Members | Film Resource Africa',
};

export default function MembersWelcomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full text-center space-y-8">

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-heading font-extrabold text-[36px] md:text-[44px] leading-tight text-foreground">
            You&rsquo;re in.
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
            Welcome to Film Resource Africa. Your founding member spot is confirmed and your price is locked for life.
          </p>
        </div>

        <div
          className="rounded-xl border border-white/[0.08] p-6 text-left space-y-4"
          style={{ background: 'var(--surface-raised)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-tertiary)' }}>
            What happens next
          </p>
          <ul className="space-y-3">
            {[
              'Gerhard will reach out within 24 hours to confirm your profile details.',
              'Your directory listing will be built once we receive your bio, headshot, and links.',
              'Individual members: your MOU will be sent for e-signature before your first submission.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px]" style={{ color: 'var(--foreground-secondary)' }}>
                <span
                  className="w-5 h-5 rounded-full border border-primary/40 bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors"
          >
            Browse opportunities <ArrowRight size={15} />
          </Link>
          <Link
            href="/members"
            className="flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-sm rounded-xl transition-colors border border-white/[0.12] hover:bg-white/[0.04]"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            Back to Members
          </Link>
        </div>

      </div>
    </main>
  );
}
