'use client';

import type { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { formatDeadline } from '@/lib/dateUtils';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { trackOpportunityClick } from '@/lib/analytics';
import CardVisualHeader from './CardVisualHeader';

function JustAddedCard({ opp, onSelect }: { opp: Opportunity; onSelect: (o: Opportunity) => void }) {
  const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const catStyle = getCategoryStyle(opp.category);
  const CatIcon = catStyle.icon;

  return (
    <div
      onClick={() => { trackOpportunityClick(opp.title, opp.category || '', 'Just Added'); onSelect(opp); }}
      className="rounded-xl overflow-hidden border border-white/[0.08] hover:border-white/[0.16] hover:-translate-y-0.5 transition-all cursor-pointer group"
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
            {opp['Next Deadline']?.substring(0, 40) || deadline.dateFormatted}
            {deadline.urgency !== 'normal' && (
              <span className="ml-1.5 font-semibold" style={{ color: '#ef4444' }}>
                {' '}— {deadline.countdownText}
              </span>
            )}
          </span>
        )}
        <h3 className="text-[15px] font-bold font-heading text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
          {opp.title}
        </h3>
        {opp['What Is It?'] && (
          <p className="text-[13px] line-clamp-2 leading-relaxed mb-3" style={{ color: 'var(--foreground-secondary)' }}>
            {decodeHtmlEntities(opp['What Is It?'])}
          </p>
        )}
        <div className="flex items-center gap-1.5">
          <CatIcon size={10} className={catStyle.color} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${catStyle.color}`}>
            {catStyle.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function JustAddedSection({
  opportunities,
  onSelect,
}: {
  opportunities: Opportunity[];
  onSelect: (opp: Opportunity) => void;
}) {
  if (!opportunities.length) return null;

  return (
    <section id="just-added" className="mt-14 md:mt-20">
      <div className="section-rule section-rule-primary" />
      <span className="section-rubric">Just Added</span>
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <h2 className="text-[26px] md:text-[34px] font-bold font-heading leading-tight text-foreground">
          New This Week
        </h2>
        <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
          {opportunities.length} new
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {opportunities.slice(0, 6).map((opp) => (
          <JustAddedCard key={opp.id} opp={opp} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
