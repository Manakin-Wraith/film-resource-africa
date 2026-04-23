'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { NewsItem } from '@/app/actions';
import RelativeDate from '@/components/RelativeDate';
import { decodeEntities, cleanText } from '@/lib/decodeEntities';
import GeoIndicator from '@/components/GeoIndicator';
import { NewsSponsoredCard } from './SponsoredCard';
import type { SponsoredPlacement } from '@/app/actions';

interface NewsSectionProps {
  news: NewsItem[];
  placements?: SponsoredPlacement[];
  onSponsoredClaim?: (placement: SponsoredPlacement | null, section: string) => void;
}

function FeaturedNewsCard({ item }: { item: NewsItem }) {
  const href = item.slug ? `/news/${item.slug}` : '#';
  return (
    <Link href={href} className="block group mb-5">
      <div
        className="rounded-xl overflow-hidden border border-white/[0.08] hover:border-white/[0.16] transition-all"
        style={{ background: 'var(--surface)' }}
      >
        {item.image_url && (
          <div className="relative w-full h-48 md:h-64 overflow-hidden">
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              sizes="100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="editorial-dateline">
              <RelativeDate date={item.published_at} />
            </span>
            <GeoIndicator geoScope={item.geo_scope} countryIso={item.country_iso} countryName={item.country_name} variant="pill" />
          </div>
          <h3 className="text-[20px] md:text-[26px] font-bold font-heading text-foreground group-hover:text-primary transition-colors leading-snug mb-3">
            {decodeEntities(item.title)}
          </h3>
          <p className="text-[14px] leading-relaxed line-clamp-2" style={{ color: 'var(--foreground-secondary)' }}>
            {cleanText(item.summary)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SecondaryNewsCard({ item }: { item: NewsItem }) {
  const href = item.slug ? `/news/${item.slug}` : '#';
  return (
    <Link
      href={href}
      className="flex gap-3 p-4 rounded-xl border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.02] transition-all group"
      style={{ background: 'var(--surface)' }}
    >
      {item.image_url && (
        <div className="relative flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden">
          <Image src={item.image_url} alt={item.title} fill sizes="72px" className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="editorial-dateline text-[11px] mb-1 block">
          <RelativeDate date={item.published_at} />
        </span>
        <h4 className="text-[13px] font-bold font-heading text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {decodeEntities(item.title)}
        </h4>
      </div>
    </Link>
  );
}

export default function NewsSection({ news, placements = [], onSponsoredClaim }: NewsSectionProps) {
  if (!news.length && !onSponsoredClaim) return null;

  const [featured, ...rest] = news;
  const secondaryItems = rest.slice(0, 4);
  const headlinePlacement = placements.find(p => p.partner_bundle === 'headline') || null;

  return (
    <section id="news" className="mt-14 md:mt-20">
      <div className="section-rule section-rule-muted" />
      <span className="section-rubric">Latest News</span>
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <h2 className="text-[26px] md:text-[34px] font-bold font-heading leading-tight text-foreground">
          From the Industry
        </h2>
        <Link
          href="/news"
          className="text-sm font-semibold text-primary hover:text-blue-400 transition-colors flex items-center gap-1 ml-4 flex-shrink-0"
        >
          All news <ArrowRight size={12} />
        </Link>
      </div>

      {featured && <FeaturedNewsCard item={featured} />}

      {secondaryItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {secondaryItems.map((item, i) => (
            <React.Fragment key={item.id}>
              {/* Sponsored slot after 2nd item */}
              {i === 2 && onSponsoredClaim && (
                <NewsSponsoredCard
                  placement={headlinePlacement}
                  sectionLabel="Latest News"
                  defaultVariant="minimal"
                  slotsAvailable={headlinePlacement ? 0 : 1}
                  onClaim={(p) => onSponsoredClaim(p, 'Latest News')}
                />
              )}
              <SecondaryNewsCard item={item} />
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
