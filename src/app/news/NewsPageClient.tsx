'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem } from '@/app/actions';
import type { SponsoredPlacement } from '@/app/actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import { NewsSponsoredCard } from '@/components/SponsoredCard';
import { ArrowLeft, Newspaper, AlertTriangle, Sparkles, Lightbulb, Clock, ArrowRight, Star, Clapperboard, Play } from 'lucide-react';
import RelativeDate from '@/components/RelativeDate';
import { decodeEntities, cleanText } from '@/lib/decodeEntities';

const categoryConfig: Record<string, { label: string; icon: typeof Newspaper; color: string; bg: string }> = {
  industry_news: { label: 'Industry News', icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  deadline_alert: { label: 'Deadline Alert', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  new_opportunity: { label: 'New Opportunity', icon: Sparkles, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  tip: { label: 'Pro Tip', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  community_spotlight: { label: 'Community Spotlight', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  trailer: { label: 'Trailer', icon: Clapperboard, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: Newspaper },
  { key: 'industry_news', label: 'Industry News', icon: Newspaper },
  { key: 'trailer', label: 'Trailers & First Looks', icon: Clapperboard },
  { key: 'tip', label: 'Tips', icon: Lightbulb },
] as const;

export default function NewsPageClient({ news, placements = [] }: { news: NewsItem[]; placements?: SponsoredPlacement[] }) {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = activeFilter === 'all'
    ? news
    : news.filter(item => item.category === activeFilter);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 -left-64 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground/50 hover:text-primary transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Directory
          </Link>
        </div>

        {/* Page Header */}
        <header className="mb-8 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            News & Insights
          </h1>
          <p className="text-lg text-foreground/60 max-w-xl mx-auto">
            Industry updates, deadline alerts, and strategic insights for African filmmakers.
          </p>
        </header>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.key;
            const count = tab.key === 'all' ? news.length : news.filter(n => n.category === tab.key).length;
            if (tab.key !== 'all' && count === 0) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_12px_-3px_rgba(59,130,246,0.3)]'
                    : 'bg-white/5 border-white/10 text-foreground/60 hover:bg-white/10 hover:text-foreground/80'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-primary/20' : 'bg-white/10'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* News Grid with scattered sponsor profile cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {(() => {
            const items: React.ReactNode[] = [];
            let placementIdx = 0;

            filtered.forEach((item, i) => {
              // Insert a sponsor profile card every 4th position (after items 3, 7, 11...)
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
                  className="glass-card rounded-[1.5rem] border border-white/10 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(59,130,246,0.2)] transition-all duration-300 group flex flex-col overflow-hidden"
                >
                  {item.image_url && (
                    <div className={`relative w-full ${isTrailer ? 'h-56' : 'h-48'} overflow-hidden`}>
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      {isTrailer && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-pink-500/80 backdrop-blur-sm flex items-center justify-center border border-pink-400/30 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                            <Play size={22} className="text-white ml-1" fill="white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.color}`}>
                        <Icon size={14} />
                        {config.label}
                      </span>
                      <span className="text-foreground/40 text-xs whitespace-nowrap flex items-center gap-1">
                        <Clock size={12} />
                        <RelativeDate date={item.published_at} />
                      </span>
                    </div>

                    <h2 className="text-xl font-bold font-heading mb-2 group-hover:text-primary transition-colors leading-snug">
                      {decodeEntities(item.title)}
                    </h2>

                    <p className="text-foreground/60 text-sm leading-relaxed flex-grow mb-4">
                      {cleanText(item.summary)}
                    </p>

                    <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold mt-auto group-hover:gap-3 transition-all">
                      {isTrailer ? 'Watch trailer' : 'Read article'} <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            });

            return items;
          })()}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-foreground/40">
            <p className="text-lg">No articles in this category yet.</p>
          </div>
        )}

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
