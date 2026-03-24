import { Metadata } from 'next';
import { getAllNews, getActivePlacements } from '@/app/actions';
import NewsPageClient from './NewsPageClient';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ItemListJsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'News & Insights | Film Resource Africa',
  description: 'Latest industry news, deadline alerts, and insights for African filmmakers and creators.',
  openGraph: {
    title: 'News & Insights | Film Resource Africa',
    description: 'Latest industry news, deadline alerts, and insights for African filmmakers and creators.',
    siteName: 'Film Resource Africa',
  },
  twitter: {
    card: 'summary',
    title: 'News & Insights | Film Resource Africa',
    description: 'Latest industry news, deadline alerts, and insights for African filmmakers and creators.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/news',
  },
};

export default async function NewsPage() {
  const [news, placements] = await Promise.all([
    getAllNews(),
    getActivePlacements(),
  ]);
  // Growth + Headline placements for the news feed
  const newsPlaycements = placements.filter(
    p => p.section === 'Latest News' && (p.partner_bundle === 'growth' || p.partner_bundle === 'headline')
  );

  const newsListItems = news
    .filter((n) => n.slug)
    .map((n) => ({ name: n.title, url: `/news/${n.slug}` }));

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'News & Insights', href: '/news' }]} />
      </div>
      <ItemListJsonLd name="African Film News & Insights" description="Latest industry news, deadline alerts, and insights for African filmmakers and creators." items={newsListItems} />
      <NewsPageClient news={news} placements={newsPlaycements} />
    </>
  );
}
