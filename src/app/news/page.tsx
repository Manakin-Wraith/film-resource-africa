import { Metadata } from 'next';
import { getAllNews } from '@/app/actions';
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
  const news = await getAllNews();
  return <NewsPageClient news={news} />;
}
