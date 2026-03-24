import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getNewsArticle, getNews, getOpportunities } from '@/app/actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import { ArrowLeft, ExternalLink, Calendar, Newspaper, AlertTriangle, Sparkles, Lightbulb, Star, Clapperboard } from 'lucide-react';
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
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 -left-64 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TrackNewsRead slug={slug} category={article.category} />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumbs items={[
            { name: 'Home', href: '/' },
            { name: 'News', href: '/news' },
            { name: decodeEntities(article.title), href: `/news/${slug}` },
          ]} />
        </div>

        {/* Article Header */}
        <header className="mb-10 space-y-6">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.color}`}>
              <Icon size={14} />
              {config.label}
            </span>
            <span className="flex items-center gap-1.5 text-foreground/40 text-sm">
              <Calendar size={14} />
              {formatDate(article.published_at)}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold font-heading leading-tight">
            {decodeEntities(article.title)}
          </h1>

          <p className="text-xl text-foreground/60 leading-relaxed">
            {cleanText(article.summary)}
          </p>
        </header>

        {/* Featured Image */}
        {article.image_url && (
          <div className="relative w-full h-64 md:h-96 rounded-[2rem] overflow-hidden mb-10 border border-white/10">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        )}

        {/* Article Body */}
        <article className="glass-card rounded-[2rem] p-8 md:p-12 border border-white/10 mb-12">
          <div className="prose prose-invert prose-lg max-w-none">
            {article.content ? (
              <MarkdownBody content={decodeEntities(article.content)} />
            ) : null}
          </div>

          {/* Source Attribution */}
          {article.url && (
            <div className="mt-10 pt-6 border-t border-white/5">
              <p className="text-foreground/30 text-sm">
                Source:{' '}
                <TrackOutboundLink
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  context="news_source"
                  className="text-foreground/40 hover:text-foreground/60 underline underline-offset-2 transition-colors"
                >
                  {(() => {
                    try {
                      const domain = new URL(article.url).hostname.replace('www.', '');
                      return domain;
                    } catch { return 'Original article'; }
                  })()}
                </TrackOutboundLink>
              </p>
            </div>
          )}
        </article>

        {/* Related Opportunities */}
        {relatedOpps.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold font-heading mb-6">Related Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedOpps.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/#directory`}
                  className="glass-card rounded-[1.5rem] p-5 border border-white/10 hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.2)] transition-all group"
                >
                  <h3 className="font-bold font-heading text-sm group-hover:text-primary transition-colors mb-2 leading-snug">
                    {opp.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {opp.category && (
                      <span className="text-xs text-foreground/50 bg-white/5 px-2 py-0.5 rounded-lg">
                        {opp.category}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="mb-12">
          <NewsletterCTA
            variant="banner"
            heading="Get stories like this in your inbox"
            subtext="Weekly deadline alerts, new opportunities, and industry insights for African filmmakers."
          />
        </section>

        {/* More News */}
        {otherNews.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold font-heading mb-6">More News</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherNews.map((item) => {
                const itemConfig = categoryConfig[item.category] || categoryConfig.industry_news;
                const ItemIcon = itemConfig.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.slug ? `/news/${item.slug}` : '#'}
                    className="glass-card rounded-[1.5rem] p-5 border border-white/10 hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.2)] transition-all group"
                  >
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${itemConfig.bg} ${itemConfig.color} mb-3`}>
                      <ItemIcon size={10} />
                      {itemConfig.label}
                    </span>
                    <h3 className="font-bold font-heading text-sm group-hover:text-primary transition-colors leading-snug">
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
