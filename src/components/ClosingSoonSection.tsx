'use client';

import Image from 'next/image';
import { ExternalLink, Calendar } from 'lucide-react';
import type { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { formatDeadline } from '@/lib/dateUtils';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { trackOpportunityClick } from '@/lib/analytics';

/* ── Featured cover-story card ─────────────────────────────────────── */
function FeaturedCard({ opp, onSelect }: { opp: Opportunity; onSelect: (o: Opportunity) => void }) {
  const hasImage = !!opp.og_image_url;
  const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const catStyle = getCategoryStyle(opp.category);
  const CatIcon = catStyle.icon;

  const handleClick = () => {
    trackOpportunityClick(opp.title, opp.category || '', 'Closing Soon Featured');
    onSelect(opp);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/[0.08] cursor-pointer group"
      style={{ background: 'var(--surface)' }}
      onClick={handleClick}
    >
      {/* Banner image */}
      {hasImage && (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9]">
          <Image
            src={opp.og_image_url!}
            alt={opp.title}
            fill
            sizes="(max-width: 768px) 100vw, 1280px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/20 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3">
          <span className="editorial-label flex items-center gap-1.5 text-foreground/45">
            <CatIcon size={10} />
            {catStyle.label}
          </span>
          {opp.logo && !hasImage && (
            <div className="ml-auto w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white/5">
              <Image
                src={opp.logo}
                alt=""
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Amber dateline */}
        {deadline && deadline.urgency !== 'passed' && (
          <span className="editorial-dateline mb-4 block">
            {opp['Next Deadline']
              ? `Deadline: ${opp['Next Deadline'].substring(0, 50)}`
              : `Deadline: ${deadline.dateFormatted}`}
            {deadline.urgency !== 'normal' && (
              <span className="ml-2 text-[#ef4444] font-semibold text-[12px]">
                — {deadline.countdownText}
              </span>
            )}
          </span>
        )}

        {/* Title — display scale */}
        <h3 className="text-[30px] leading-[1.08] md:text-[44px] font-extrabold font-heading text-foreground mb-4 group-hover:text-primary transition-colors">
          {opp.title}
        </h3>

        {/* Description */}
        {opp['What Is It?'] && (
          <p
            className="text-[15px] leading-relaxed mb-6 line-clamp-2 md:line-clamp-3"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            {decodeHtmlEntities(opp['What Is It?'])}
          </p>
        )}

        {/* CTA row — full-width on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {opp['Apply:'] && (
            <a
              href={opp['Apply:']}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold text-sm px-6 rounded-xl transition-all hover:-translate-y-0.5 min-h-[48px]"
            >
              Apply Now <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              trackOpportunityClick(opp.title, opp.category || '', 'Closing Soon Featured');
              onSelect(opp);
            }}
            className="flex items-center justify-center gap-2 border border-white/[0.16] hover:border-white/30 text-foreground/70 hover:text-foreground font-semibold text-sm px-6 rounded-xl transition-all min-h-[48px]"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Compact strip card ─────────────────────────────────────────────── */
function CompactCard({ opp, onSelect }: { opp: Opportunity; onSelect: (o: Opportunity) => void }) {
  const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const catStyle = getCategoryStyle(opp.category);
  const CatIcon = catStyle.icon;

  return (
    <div
      onClick={() => {
        trackOpportunityClick(opp.title, opp.category || '', 'Closing Soon Strip');
        onSelect(opp);
      }}
      className="rounded-xl min-w-[264px] max-w-[300px] flex-shrink-0 snap-start cursor-pointer border border-white/[0.08] hover:border-white/[0.16] hover:-translate-y-0.5 transition-all group p-5"
      style={{ background: 'var(--surface)' }}
    >
      {/* Dateline */}
      {deadline && deadline.urgency !== 'passed' && (
        <span className="editorial-dateline text-[12px] mb-1 block">
          {deadline.countdownText}
        </span>
      )}

      {/* Category */}
      <span className="editorial-label flex items-center gap-1 mb-2 text-foreground/40">
        <CatIcon size={10} />
        {catStyle.label}
      </span>

      {/* Title */}
      <h4 className="text-[15px] font-bold font-heading text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3 leading-snug">
        {opp.title}
      </h4>

      {/* Deadline row */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
        <Calendar size={11} />
        <span className="truncate">
          {opp['Next Deadline']?.substring(0, 32) || 'Check website'}
        </span>
      </div>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────────────── */
export default function ClosingSoonSection({
  opportunities,
  onSelect,
}: {
  opportunities: Opportunity[];
  onSelect: (opp: Opportunity) => void;
}) {
  if (!opportunities.length) return null;

  const [featured, ...rest] = opportunities;

  return (
    <section id="closing-soon" className="mt-14 md:mt-20">
      {/* Section anatomy: rule → rubric → headline */}
      <div className="section-rule section-rule-urgent" />
      <span className="section-rubric">Closing Soon</span>
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <h2 className="text-[26px] md:text-[34px] font-bold font-heading leading-tight text-foreground">
          Apply Now or Miss Out
        </h2>
        <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
          {opportunities.length} closing
        </span>
      </div>

      {/* Featured cover-story card */}
      <FeaturedCard opp={featured} onSelect={onSelect} />

      {/* Compact strip for remaining */}
      {rest.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 mt-5 snap-x snap-mandatory -mx-4 px-4 md:-mx-0 md:px-0 scrollbar-thin">
          {rest.map((opp) => (
            <CompactCard key={opp.id} opp={opp} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}
