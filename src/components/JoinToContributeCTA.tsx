import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';

/**
 * Logged-out / ineligible gate shown in place of a submission form.
 * Used across the (members-only) submit routes.
 */
export default function JoinToContributeCTA({
  title = 'Contributing is a member benefit',
  body = 'Listings on Film Resource Africa are added by members. Join to promote your opportunities, briefs, and projects to filmmakers across the continent.',
  primaryHref = '/members',
  primaryLabel = 'Become a member',
  secondaryHref = '/login',
  secondaryLabel = 'Member login',
}: {
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="max-w-xl mx-auto rounded-2xl p-10 md:p-12 text-center border border-white/[0.08] mt-10" style={{ background: 'var(--surface)' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-7 border border-primary/30 bg-primary/10 text-primary">
        <Lock size={26} />
      </div>
      <h1 className="text-3xl md:text-[34px] font-bold font-heading text-foreground mb-4 text-balance">{title}</h1>
      <p className="text-[15px] leading-relaxed mb-9 text-balance" style={{ color: 'var(--foreground-secondary)' }}>{body}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
        >
          {primaryLabel} <ArrowRight size={18} />
        </Link>
        <Link
          href={secondaryHref}
          className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold border border-white/[0.2] hover:bg-white/[0.06] transition-colors text-foreground"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
