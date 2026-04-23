import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getNewsArticle, getNews, getOpportunities } from '@/app/actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import { Newspaper, AlertTriangle, Sparkles, Lightbulb, Star, Clapperboard } from 'lucide-react';
import MarkdownBody from '@/components/MarkdownBody';
import { decodeEntities, cleanText } from '@/lib/decodeEntities';
import Breadcrumbs from '@/components/Breadcrumbs';
import TrackNewsRead from '@/components/TrackNewsRead';
import TrackOutboundLink from '@/components/TrackOutboundLink';

export const dynamic = 'force-dynamic';

const categoryConfig: Record<string, { label: string; icon: typeof Newspaper; color: string; bg: string }> = {
  industry_news: { label: 'Industry News', icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  deadline_alert: { label: 'Deadline Alert', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  new_opportunity: { label: 'New Opportunity', icon: Sparkles, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  tip: { label: 'Pro Tip', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  community_spotlight: { label: 'Community Spotlight', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  trailer: { label: 'Trailer', icon: Clapperboard, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  industry_analysis: { label: 'Industry Analysis', icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  opportunities: { label: 'Opportunities', icon: Sparkles, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticle(slug);
  if (!article) return { title: 'Article Not Found' };

  return {
    title: `${article.title} | Film Resource Africa`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: article.published_at,
      siteName: 'Film Resource Africa',
      ...(article.image_url ? { images: [{ url: article.image_url, width: 1200, height: 630, alt: article.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      ...(article.image_url ? { images: [article.image_url] } : {}),
    },
    alternates: {
      canonical: `https://film-resource-africa.com/news/${slug}`,
    },
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, relatedNews, opportunities] = await Promise.all([
    getNewsArticle(slug),
    getNews(),
    getOpportunities(),
  ]);

  if (!article) notFound();

  const config = categoryConfig[article.category] || categoryConfig.industry_news;
  const Icon = config.icon;

  // Pick 3 related opportunities based on keyword matching
  const articleWords = (article.title + ' ' + article.summary).toLowerCase();
  const relatedOpps = opportunities
    .filter(opp => {
      const oppWords = (opp.title + ' ' + (opp.category || '')).toLowerCase();
      return articleWords.split(' ').some(w => w.length > 4 && oppWords.includes(w));
    })
    .slice(0, 3);

  const otherNews = relatedNews.filter(n => n.id !== article.id).slice(0, 3);

  // Article JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    datePublished: article.published_at,
    ...(article.image_url ? { image: article.image_url } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Film Resource Africa',
      url: 'https://film-resource-africa.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://film-resource-africa.com/news/${slug}`,
    },
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackNewsRead slug={slug} category={article.category} />

      <div className="container mx-auto px-4 py-10 max-w-3xl">

        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumbs items={[
            { name: 'Home', href: '/' },
            { name: 'News', href: '/news' },
            { name: decodeEntities(article.title), href: `/news/${slug}` },
          ]} />
        </div>

        {/* Article masthead */}
        <header className="mb-8">
          {/* Category rubric + date dateline */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`editorial-label ${config.color}`}>
              {config.label}
            </span>
            <span className="text-[11px] font-medium" style={{ color: 'var(--foreground-tertiary)' }}>
              {formatDate(article.published_at)}
            </span>
          </div>

          {/* Horizontal rule — muted */}
          <div className="h-px mb-6" style={{ background: 'var(--border)' }} />

          <h1 className="text-[28px] md:text-[42px] font-extrabold font-heading leading-[1.08] tracking-tight text-foreground mb-5">
            {decodeEntities(article.title)}
          </h1>

          {/* Standfirst */}
          <p className="text-[16px] md:text-[18px] leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
            {cleanText(article.summary)}
          </p>
        </header>

        {/* Hero image */}
        {article.image_url && (
          <div className="relative w-full h-56 md:h-[420px] overflow-hidden rounded-xl mb-8 border border-white/[0.08]">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* Article body */}
        <article className="mb-10 border-t border-white/[0.08] pt-8">
          <div className="prose prose-invert prose-base max-w-none">
            {article.content && (
              <MarkdownBody content={decodeEntities(article.content)} />
            )}
          </div>

          {/* Source attribution */}
          {article.url && (
            <div className="mt-8 pt-5 border-t border-white/[0.06]">
              <p className="text-[12px]" style={{ color: 'var(--foreground-tertiary)' }}>
                Source:{' '}
                <TrackOutboundLink
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  context="news_source"
                  className="underline underline-offset-2 hover:text-foreground/60 transition-colors"
                >
                  {(() => {
                    try { return new URL(article.url).hostname.replace('www.', ''); }
                    catch { return 'Original article'; }
                  })()}
                </TrackOutboundLink>
              </p>
            </div>
          )}
        </article>

        {/* Newsletter CTA */}
        <div className="mb-12">
          <NewsletterCTA
            variant="banner"
            heading="Get stories like this in your inbox"
            subtext="Weekly deadline alerts, new opportunities, and industry insights for African filmmakers."
          />
        </div>

        {/* Related Opportunities */}
        {relatedOpps.length > 0 && (
          <section className="mb-12">
            <div className="h-px mb-5" style={{ background: 'var(--border)' }} />
            <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-tertiary)' }}>
              Related Opportunities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {relatedOpps.map((opp) => (
                <Link
                  key={opp.id}
                  href="/#directory"
                  className="p-4 rounded-xl border border-white/[0.08] hover:border-white/[0.16] hover:-translate-y-0.5 transition-all group"
                  style={{ background: 'var(--surface)' }}
                >
                  <h3 className="text-[13px] font-bold font-heading text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                    {opp.title}
                  </h3>
                  {opp.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--foreground-tertiary)' }}>
                      {opp.category}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More News */}
        {otherNews.length > 0 && (
          <section>
            <div className="h-px mb-5" style={{ background: 'var(--border)' }} />
            <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-tertiary)' }}>
              More News
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {otherNews.map((item) => {
                const itemConfig = categoryConfig[item.category] || categoryConfig.industry_news;
                const ItemIcon = itemConfig.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.slug ? `/news/${item.slug}` : '#'}
                    className="p-4 rounded-xl border border-white/[0.08] hover:border-white/[0.16] hover:-translate-y-0.5 transition-all group"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <ItemIcon size={10} className={itemConfig.color} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${itemConfig.color}`}>
                        {itemConfig.label}
                      </span>
                    </div>
                    <h3 className="text-[13px] font-bold font-heading text-foreground group-hover:text-primary transition-colors leading-snug">
                      {decodeEntities(item.title)}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
