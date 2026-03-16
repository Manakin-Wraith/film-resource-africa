'use client';

import Link from 'next/link';
import Image from 'next/image';
import { NewsItem } from '@/app/actions';
import { Newspaper, AlertTriangle, Sparkles, Lightbulb, ArrowRight, Clock } from 'lucide-react';
import { formatRelativeDate } from '@/lib/dateUtils';

const categoryConfig: Record<string, { icon: typeof Newspaper; label: string; color: string; bg: string }> = {
  industry_news: { icon: Newspaper, label: 'Industry News', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  deadline_alert: { icon: AlertTriangle, label: 'Deadline Alert', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  new_opportunity: { icon: Sparkles, label: 'New Opportunity', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  tip: { icon: Lightbulb, label: 'Pro Tip', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

export default function NewsSection({ news }: { news: NewsItem[] }) {
  if (!news.length) return null;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Newspaper size={20} className="text-accent" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading">Latest News</h2>
        </div>
        <Link
          href="/news"
          className="text-sm font-semibold text-primary hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map((item) => {
          const config = categoryConfig[item.category] || categoryConfig.industry_news;
          const Icon = config.icon;
          const href = item.slug ? `/news/${item.slug}` : '#';

          return (
            <Link
              key={item.id}
              href={href}
              className="glass-card rounded-[1.5rem] border border-white/10 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(59,130,246,0.2)] transition-all duration-300 group flex flex-col overflow-hidden"
            >
              {item.image_url && (
                <div className="relative w-full h-44 overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
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
                    {formatRelativeDate(item.published_at)}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-heading mb-2 group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-foreground/60 text-sm leading-relaxed flex-grow mb-4">
                  {item.summary}
                </p>

                <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold mt-auto group-hover:gap-3 transition-all">
                  Read article <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
