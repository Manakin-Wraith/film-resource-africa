'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Calendar } from 'lucide-react';
import type { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { formatDeadline } from '@/lib/dateUtils';
import { decodeHtmlEntities, getApplyUrl } from '@/lib/textUtils';
import { trackOpportunityClick } from '@/lib/analytics';
import CardVisualHeader from './CardVisualHeader';

/* ── Featured cover-story card ─────────────────────────────────────── */
function FeaturedCard({ opp }: { opp: Opportunity }) {
  const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const href = `/opportunities/${opp.slug}`;
  const applyUrl = getApplyUrl(opp['Apply:']);
  const track = () => trackOpportunityClick(opp.title, opp.category || '', 'Closing Soon Featured');

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-line group"
      style={{ background: 'var(--surface)' }}
    >
      {/* Stretched link — whole card navigates; inner CTAs sit above it */}
      <Link href={href} onClick={track} className="absolute inset-0 z-10" aria-label={opp.title} />
      {/* Visual header — 4-tier fallback: og_image → logo → gradient → pattern
          Desktop gets taller via CSS without dual-mounting the component */}
      <div className="md:[&>div]:!h-56">
        <CardVisualHeader
          logo={opp.logo}
          ogImage={opp.og_image_url}
          category={opp.category}
          title={opp.title}
          geoScope={opp.geo_scope}
          countryIso={opp.country_iso}
          countryName={opp.country_name}
        />
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Amber dateline */}
        {deadline && deadline.urgency !== 'passed' && (
          <span className="editorial-dateline mb-3 block">
            {opp['Next Deadline']
              ? `Deadline: ${opp['Next Deadline'].substring(0, 50)}`
              : `Deadline: ${deadline.dateFormatted}`}
            {deadline.urgency !== 'normal' && (
              <span className="ml-2 font-semibold text-xs text-urgent">
                — {deadline.countdownText}
              </span>
            )}
          </span>
        )}

        {/* Title — display scale */}
        <h3 className="text-[28px] leading-[1.08] md:text-[42px] font-extrabold font-heading text-foreground mb-4 group-hover:text-primary transition-colors">
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
        <div className="relative z-20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm px-6 rounded-xl transition-all hover:-translate-y-0.5 min-h-[48px]"
            >
              Apply Now <ExternalLink size={14} />
            </a>
          )}
          <Link
            href={href}
            onClick={track}
            className="flex items-center justify-center gap-2 border border-white/[0.16] hover:border-white/30 text-foreground/70 hover:text-foreground font-semibold text-sm px-6 rounded-xl transition-all min-h-[48px]"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Compact strip card ─────────────────────────────────────────────── */
function CompactCard({ opp }: { opp: Opportunity }) {
  const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const catStyle = getCategoryStyle(opp.category);
  const CatIcon = catStyle.icon;

  return (
    <Link
      href={`/opportunities/${opp.slug}`}
      onClick={() => trackOpportunityClick(opp.title, opp.category || '', 'Closing Soon Strip')}
      className="block rounded-xl min-w-[260px] max-w-[300px] flex-shrink-0 snap-start border border-white/[0.08] hover:border-white/[0.16] hover:-translate-y-0.5 transition-all group overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      {/* Mini visual header — logo or category fallback */}
      {opp.logo ? (
        <div className={`h-14 flex items-center px-4 bg-gradient-to-br ${catStyle.headerGradient} border-b border-white/[0.05]`}>
          <Image
            src={opp.logo}
            alt=""
            width={72}
            height={28}
            className="object-contain max-h-[28px] opacity-80"
          />
        </div>
      ) : (
        <div className={`h-10 flex items-center px-4 gap-2 bg-gradient-to-br ${catStyle.headerGradient} border-b border-white/[0.05]`}>
          <CatIcon size={14} className={catStyle.color} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${catStyle.color}`}>
            {catStyle.label}
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Dateline */}
        {deadline && deadline.urgency !== 'passed' && (
          <span className="editorial-dateline text-xs mb-1 block">
            {deadline.countdownText}
          </span>
        )}

        {/* Title */}
        <h4 className="text-[15px] font-bold font-heading text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3 leading-snug">
          {opp.title}
        </h4>

        {/* Deadline row */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
          <Calendar size={10} />
          <span className="truncate">
            {opp['Next Deadline']?.substring(0, 32) || 'Check website'}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Section ────────────────────────────────────────────────────────── */
export default function ClosingSoonSection({
  opportunities,
}: {
  opportunities: Opportunity[];
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
      <FeaturedCard opp={featured} />

      {/* Compact strip for remaining */}
      {rest.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 mt-5 snap-x snap-mandatory -mx-4 px-4 md:-mx-0 md:px-0 scrollbar-thin">
          {rest.map((opp) => (
            <CompactCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}
    </section>
  );
}
