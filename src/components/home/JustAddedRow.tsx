import Link from 'next/link';
import type { Opportunity } from '@/app/actions';
import CardVisualHeader from '@/components/CardVisualHeader';
import { formatDeadline, isNewListing } from '@/lib/dateUtils';

export default function JustAddedRow({ opportunities }: { opportunities: Opportunity[] }) {
  if (opportunities.length === 0) return null;
  return (
    <section className="mt-[72px]">
      <div className="flex items-baseline justify-between gap-4 pb-3.5 mb-[22px] border-b border-line">
        <div>
          <span className="block mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--foreground-tertiary)' }}>Just added</span>
          <h2 className="font-heading font-semibold text-[30px] tracking-[-0.015em] text-foreground">New this week</h2>
        </div>
        <span className="text-[13px] flex-none" style={{ color: 'var(--foreground-tertiary)' }}>{opportunities.length} new</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {opportunities.map((opp) => {
          const dl = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
          const isNew = isNewListing(opp.created_at, opp.id);
          const isFree = /free/i.test(opp['Cost'] || '');
          return (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.slug}`}
              className="group flex flex-col rounded-2xl border border-line bg-surface overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_10px_28px_-12px_rgba(31,24,19,0.22)]"
            >
              <CardVisualHeader
                logo={opp.logo}
                ogImage={opp.og_image_url}
                category={opp.category}
                title={opp.title}
                geoScope={opp.geo_scope}
                countryIso={opp.country_iso}
                countryName={opp.country_name}
              />
              <div className="p-[18px] flex flex-col flex-grow">
                {opp.category && (
                  <span className="block mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--foreground-tertiary)' }}>{opp.category}</span>
                )}
                <h3 className="font-heading font-semibold text-[18px] leading-[1.22] tracking-[-0.01em] text-foreground mb-2 transition-colors group-hover:text-[color:var(--color-primary-text)]">
                  {opp.title}
                </h3>
                {opp['What Is It?'] && (
                  <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: 'var(--foreground-secondary)' }}>{opp['What Is It?']}</p>
                )}
                <div className="flex items-baseline justify-between gap-3 border-t border-line mt-auto pt-3">
                  <span className="text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
                    {isNew && <span className="text-[color:var(--color-primary-text)]">● New</span>}
                    {isNew && isFree && ' · '}
                    {isFree && <span className="text-[color:var(--color-moss-text)]">Free to apply</span>}
                  </span>
                  {dl && dl.urgency !== 'passed' && (
                    <span className="font-mono text-[11.5px] text-[color:var(--color-primary-text)]">{dl.dateFormatted}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
