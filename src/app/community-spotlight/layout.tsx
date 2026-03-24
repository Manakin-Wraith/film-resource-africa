import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Community Spotlight — Film Resource Africa',
  description: 'Share your African film success story — awards, festival selections, funding wins, and career milestones.',
  openGraph: {
    title: 'Community Spotlight — Film Resource Africa',
    description: 'Share your African film success story — awards, festival selections, funding wins, and career milestones.',
    siteName: 'Film Resource Africa',
  },
  twitter: {
    card: 'summary',
    title: 'Community Spotlight — Film Resource Africa',
    description: 'Celebrating African filmmaker achievements — awards, selections, funding wins, and milestones.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/community-spotlight',
  },
};

export default function CommunitySpotlightLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Community Spotlight', href: '/community-spotlight' }]} />
      </div>
      {children}
    </>
  );
}
