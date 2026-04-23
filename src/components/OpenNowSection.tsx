'use client';

import { ExternalLink } from 'lucide-react';
import type { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { formatDeadline } from '@/lib/dateUtils';
import { trackOpportunityClick } from '@/lib/analytics';
import CardVisualHeader from './CardVisualHeader';

function OpenNowCard({ opp, onSelect }: { opp: Opportunity; onSelect: (o: Opportunity) => void }) {
  const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const catStyle = getCategoryStyle(opp.category);
  const CatIcon = catStyle.icon;

  return (
    <div
      onClick={() => { trackOpportunityClick(opp.title, opp.category || '', 'Open Now'); onSelect(opp); }}
      className="rounded-xl min-w-[268px] max-w-[300px] flex-shrink-0 snap-start overflow-hidden border border-white/[0.08] hover:border-white/[0.16] hover:-translate-y-0.5 transition-all cursor-pointer group"
      style={{ background: 'var(--surface)' }}
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
      <div className="p-4">
        {deadline && deadline.urgency !== 'passed' && (
          <span className="editorial-dateline text-[11px] mb-1.5 block">
            {opp['Next Deadline']?.substring(0, 36) || deadline.dateFormatted}
          </span>
        )}
        <h3 className="text-[14px] font-bold font-heading text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-3">
          {opp.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CatIcon size={10} className={catStyle.color} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${catStyle.color}`}>
              {catStyle.label}
            </span>
          </div>
          {opp['Apply:'] && (
            <a
              href={opp['Apply:']}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-blue-400 transition-colors"
            >
              Apply <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OpenNowSection({
  opportunities,
  onSelect,
}: {
  opportunities: Opportunity[];
  onSelect: (opp: Opportunity) => void;
}) {
  if (!opportunities.length) return null;

  return (
    <section id="open-now" className="mt-14 md:mt-20">
      <div className="section-rule section-rule-success" />
      <span className="section-rubric">Open Now</span>
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-[26px] md:text-[34px] font-bold font-heading leading-tight text-foreground">
          Accepting Applications
        </h2>
        <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
          {opportunities.length} open
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 md:-mx-0 md:px-0 scrollbar-thin">
        {opportunities.map((opp) => (
          <OpenNowCard key={opp.id} opp={opp} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
