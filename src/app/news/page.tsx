import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllNews } from '@/app/actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import { ArrowLeft, Newspaper, AlertTriangle, Sparkles, Lightbulb, Clock, ArrowRight } from 'lucide-react';
import RelativeDate from '@/components/RelativeDate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'News & Insights | Film Resource Africa',
  description: 'Latest industry news, deadline alerts, and insights for African filmmakers and creators.',
  openGraph: {
    title: 'News & Insights | Film Resource Africa',
    description: 'Latest industry news, deadline alerts, and insights for African filmmakers and creators.',
    siteName: 'Film Resource Africa',
  },
};

const categoryConfig: Record<string, { label: string; icon: typeof Newspaper; color: string; bg: string }> = {
  industry_news: { label: 'Industry News', icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  deadline_alert: { label: 'Deadline Alert', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  new_opportunity: { label: 'New Opportunity', icon: Sparkles, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  tip: { label: 'Pro Tip', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};


export default async function NewsPage() {
  const news = await getAllNews();

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
        <header className="mb-12 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            News & Insights
          </h1>
          <p className="text-lg text-foreground/60 max-w-xl mx-auto">
            Industry updates, deadline alerts, and strategic insights for African filmmakers.
          </p>
        </header>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
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
                  <div className="relative w-full h-48 overflow-hidden">
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
                      <RelativeDate date={item.published_at} />
                    </span>
                  </div>

                  <h2 className="text-xl font-bold font-heading mb-2 group-hover:text-primary transition-colors leading-snug">
                    {item.title}
                  </h2>

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
