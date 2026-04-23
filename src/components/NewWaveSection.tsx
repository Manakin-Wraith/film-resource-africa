'use client';

import { ArrowRight } from 'lucide-react';
import type { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { formatDeadline } from '@/lib/dateUtils';
import { trackOpportunityClick } from '@/lib/analytics';

function NewWaveRow({ opp, onSelect }: { opp: Opportunity; onSelect: (o: Opportunity) => void }) {
  const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const catStyle = getCategoryStyle(opp.category);
  const CatIcon = catStyle.icon;

  return (
    <div
      onClick={() => { trackOpportunityClick(opp.title, opp.category || '', 'New Wave'); onSelect(opp); }}
      className="flex items-center gap-4 py-4 border-b border-white/[0.06] last:border-0 cursor-pointer group hover:bg-white/[0.02] -mx-4 px-4 md:-mx-0 md:px-0 transition-colors rounded-sm"
    >
      {/* Category icon pip */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${catStyle.headerGradient}`}>
        <CatIcon size={14} className={catStyle.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] md:text-[15px] font-bold font-heading text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
          {opp.title}
        </h3>
        {deadline && deadline.urgency !== 'passed' && (
          <span className="editorial-dateline text-[11px]">
            {opp['Next Deadline']?.substring(0, 36) || deadline.dateFormatted}
            {deadline.urgency !== 'normal' && (
              <span className="ml-1 font-semibold" style={{ color: '#ef4444' }}>
                {' '}— {deadline.countdownText}
              </span>
            )}
          </span>
        )}
      </div>

      <ArrowRight
        size={14}
        className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
        style={{ color: 'var(--foreground-tertiary)' }}
      />
    </div>
  );
}

export default function NewWaveSection({
  opportunities,
  onSelect,
}: {
  opportunities: Opportunity[];
  onSelect: (opp: Opportunity) => void;
}) {
  if (!opportunities.length) return null;

  return (
    <section id="new-wave" className="mt-14 md:mt-20">
      <div className="section-rule section-rule-accent" />
      <span className="section-rubric">The New Wave</span>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-[26px] md:text-[34px] font-bold font-heading leading-tight text-foreground">
          AI Filmmaking
        </h2>
        <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
          {opportunities.length} listings
        </span>
      </div>
      <p className="text-[14px] mb-5" style={{ color: 'var(--foreground-secondary)' }}>
        Festivals, funds, and awards for AI-powered creators
      </p>
      <div>
        {opportunities.map((opp) => (
          <NewWaveRow key={opp.id} opp={opp} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
