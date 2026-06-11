'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem, trackSponsoredClick } from '@/app/actions';
import type { SponsoredPlacement } from '@/app/actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import { NewsSponsoredCard } from '@/components/SponsoredCard';
import { Newspaper, Lightbulb, ArrowRight, Clapperboard, Play } from 'lucide-react';
import RelativeDate from '@/components/RelativeDate';
import GeoIndicator from '@/components/GeoIndicator';
import { decodeEntities, cleanText } from '@/lib/decodeEntities';
import NewsImageFallback from '@/components/NewsImageFallback';
import { newsCategories as categoryConfig } from '@/lib/newsCategoryConfig';

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: Newspaper },
  { key: 'industry_news', label: 'Industry News', icon: Newspaper },
  { key: 'trailer', label: 'Trailers', icon: Clapperboard },
  { key: 'tip', label: 'Tips', icon: Lightbulb },
] as const;

export default function NewsPageClient({ news, placements = [] }: { news: NewsItem[]; placements?: SponsoredPlacement[] }) {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = activeFilter === 'all'
    ? news
    : news.filter(item => item.category === activeFilter);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 max-w-5xl">

        {/* Editorial header */}
        <div className="mb-8 md:mb-10">
          <div className="section-rule section-rule-muted" />
          <span className="section-rubric">News & Insights</span>
          <div className="flex items-baseline justify-between">
            <h1 className="text-[26px] md:text-[38px] font-bold font-heading leading-tight text-foreground">
              From the Industry
            </h1>
            <span className="text-sm font-medium ml-4 shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
              {news.length} articles
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.key;
            const count = tab.key === 'all' ? news.length : news.filter(n => n.category === tab.key).length;
            if (tab.key !== 'all' && count === 0) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                  isActive
                    ? 'border-line-strong text-foreground bg-surface-raised'
                    : 'border-line hover:border-line-mid hover:text-foreground bg-surface text-(--foreground-secondary)'
                }`}
              >
                <Icon size={13} />
                {tab.label}
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-surface-raised text-(--foreground-tertiary)">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--foreground-tertiary)' }}>
            <p>No articles in this category yet.</p>
          </div>
        )}

        {/* Featured (first) article */}
        {featured && (() => {
          const config = categoryConfig[featured.category] || categoryConfig.industry_news;
          const Icon = config.icon;
          const href = featured.slug ? `/news/${featured.slug}` : '#';
          const isTrailer = featured.category === 'trailer';
          return (
            <Link
              href={href}
              className="block rounded-xl border border-white/8 hover:border-white/16 transition-all group overflow-hidden mb-6"
              style={{ background: 'var(--surface)' }}
            >
              {featured.image_url ? (
                <div className={`relative w-full ${isTrailer ? 'h-64 md:h-80' : 'h-52 md:h-72'} overflow-hidden`}>
                  <Image
                    src={featured.image_url}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 960px"
                    priority
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  {isTrailer && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-pink-500/80 flex items-center justify-center border border-pink-400/30 group-hover:scale-110 transition-transform">
                        <Play size={22} className="text-white ml-1" fill="white" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NewsImageFallback category={featured.category} title={featured.title} className={isTrailer ? 'h-64 md:h-80' : 'h-52 md:h-72'} />
              )}
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`editorial-label ${config.color}`}>
                    <Icon size={11} className="inline mr-1" />
                    {config.label}
                  </span>
                  <GeoIndicator geoScope={featured.geo_scope} countryIso={featured.country_iso} countryName={featured.country_name} variant="pill" />
                  <span className="text-[11px]" style={{ color: 'var(--foreground-tertiary)' }}>
                    <RelativeDate date={featured.published_at} />
                  </span>
                </div>
                <h2 className="text-[20px] md:text-[26px] font-bold font-heading leading-[1.1] text-foreground mb-2 group-hover:text-primary transition-colors">
                  {decodeEntities(featured.title)}
                </h2>
                <p className="text-[14px] md:text-[15px] leading-relaxed mb-4" style={{ color: 'var(--foreground-secondary)' }}>
                  {cleanText(featured.summary)}
                </p>
                <span className="inline-flex items-center gap-2 text-primary text-[13px] font-semibold group-hover:gap-3 transition-all">
                  {isTrailer ? 'Watch trailer' : 'Read article'} <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          );
        })()}

        {/* Secondary grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {(() => {
            const items: React.ReactNode[] = [];
            let placementIdx = 0;

            rest.forEach((item, i) => {
              if (i > 0 && i % 4 === 0 && placementIdx < placements.length) {
                const p = placements[placementIdx];
                items.push(
                  <NewsSponsoredCard
                    key={`sponsor-${p.id}`}
                    placement={p}
                    sectionLabel="Latest News"
                    defaultVariant="branded"
                    slotsAvailable={0}
                    onClaim={() => {
                      trackSponsoredClick(p.id, p.partner_id, 'news_feed', p.slot_position);
                      if (p.partner_cta_url) window.open(p.partner_cta_url, '_blank');
                    }}
                  />
                );
                placementIdx++;
              }

              const config = categoryConfig[item.category] || categoryConfig.industry_news;
              const Icon = config.icon;
              const href = item.slug ? `/news/${item.slug}` : '#';
              const isTrailer = item.category === 'trailer';

              items.push(
                <Link
                  key={item.id}
                  href={href}
                  className="rounded-xl border border-white/8 hover:border-white/16 transition-all group flex flex-col overflow-hidden"
                  style={{ background: 'var(--surface)' }}
                >
                  {item.image_url ? (
                    <div className={`relative w-full ${isTrailer ? 'h-44' : 'h-36'} overflow-hidden`}>
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      {isTrailer && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-pink-500/80 flex items-center justify-center border border-pink-400/30 group-hover:scale-110 transition-transform">
                            <Play size={16} className="text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <NewsImageFallback category={item.category} title={item.title} className={isTrailer ? 'h-44' : 'h-36'} />
                  )}
                  <div className="p-4 flex flex-col grow">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`editorial-label ${config.color}`}>
                        <Icon size={10} className="inline mr-1" />
                        {config.label}
                      </span>
                      <GeoIndicator geoScope={item.geo_scope} countryIso={item.country_iso} countryName={item.country_name} variant="pill" />
                      <span className="text-[11px] ml-auto" style={{ color: 'var(--foreground-tertiary)' }}>
                        <RelativeDate date={item.published_at} />
                      </span>
                    </div>
                    <h2 className="text-[15px] font-bold font-heading leading-snug text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                      {decodeEntities(item.title)}
                    </h2>
                    <p className="text-[13px] leading-relaxed grow line-clamp-2 mb-3" style={{ color: 'var(--foreground-secondary)' }}>
                      {cleanText(item.summary)}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-primary text-[12px] font-semibold mt-auto group-hover:gap-2.5 transition-all">
                      {isTrailer ? 'Watch' : 'Read'} <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            });

            return items;
          })()}
        </div>

        {/* Newsletter CTA */}
        <NewsletterCTA
          variant="banner"
          heading="Never miss a story"
          subtext="Weekly deadline alerts, industry news, and insights — straight to your inbox."
        />
      </div>
    </main>
  );
}
