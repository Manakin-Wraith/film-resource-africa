import { Metadata } from 'next';
import { getAllNews, getActivePlacements } from '@/app/actions';
import NewsPageClient from './NewsPageClient';

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

export default async function NewsPage() {
  const [news, placements] = await Promise.all([
    getAllNews(),
    getActivePlacements(),
  ]);
  // Growth + Headline placements for the news feed
  const newsPlaycements = placements.filter(
    p => p.section === 'Latest News' && (p.partner_bundle === 'growth' || p.partner_bundle === 'headline')
  );
  return <NewsPageClient news={news} placements={newsPlaycements} />;
}
