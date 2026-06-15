import Link from 'next/link';
import type { Opportunity } from '@/app/actions';
import { formatDeadline } from '@/lib/dateUtils';

export default function LeadStory({ opp }: { opp: Opportunity }) {
  const dl = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const media = opp.og_image_url || opp.logo || null;
  const sprocket = 'repeating-linear-gradient(180deg, var(--background) 0 12px, transparent 12px 26px)';

  return (
    <Link href={`/opportunities/${opp.slug}`} className="group block md:pr-10 md:border-r md:border-line">
      <div
        className="relative rounded-2xl overflow-hidden aspect-[16/8.5]"
        style={{
          backgroundImage: media ? `url(${media})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          background: media ? undefined : 'radial-gradient(110% 90% at 25% 20%, rgba(217,142,43,.30) 0%, transparent 55%), radial-gradient(120% 110% at 85% 90%, rgba(207,67,39,.24) 0%, transparent 60%), linear-gradient(160deg,#3a2a18 0%,#17100a 70%)',
        }}
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-5 border-r border-white/10" style={{ background: sprocket }} />
        <span aria-hidden className="absolute inset-y-0 right-0 w-5 border-l border-white/10" style={{ background: sprocket }} />
        {opp.category && (
          <span className="absolute bottom-3.5 left-9 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: 'rgba(246,239,230,.6)' }}>
            {opp.category}
          </span>
        )}
      </div>
      <div className="pt-[18px]">
        <span className="block mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary-text)]">
          Lead story · Closing soon
        </span>
        <h2 className="font-heading font-semibold text-[clamp(26px,3vw,40px)] leading-[1.08] tracking-[-0.015em] text-foreground mb-3 transition-colors group-hover:text-[color:var(--color-primary-text)]">
          {opp.title}
        </h2>
        {opp['What Is It?'] && (
          <p className="text-[15px] leading-relaxed max-w-[58ch] line-clamp-3" style={{ color: 'var(--foreground-secondary)' }}>
            {opp['What Is It?']}
          </p>
        )}
        <div className="flex items-baseline gap-[18px] mt-3.5">
          {dl && dl.urgency !== 'passed' && (
            <span className="text-[13px] font-semibold text-urgent">
              Closes {dl.dateFormatted} — {dl.daysLeft} {dl.daysLeft === 1 ? 'day' : 'days'}
            </span>
          )}
          {opp.category && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--foreground-tertiary)' }}>
              {opp.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
