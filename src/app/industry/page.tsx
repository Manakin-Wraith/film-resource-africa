import { getDirectoryListings } from '@/app/actions';
import IndustryDirectoryClient from '@/components/IndustryDirectoryClient';
import NewsletterCTA from '@/components/NewsletterCTA';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ItemListJsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Industry Directory — Film Resource Africa',
  description: 'Find African production companies, crew, services, and training programs. The comprehensive directory for the African film industry.',
  openGraph: {
    title: 'Industry Directory — Film Resource Africa',
    description: 'Find African production companies, crew, services, and training programs. The comprehensive directory for the African film industry.',
    siteName: 'Film Resource Africa',
  },
  twitter: {
    card: 'summary',
    title: 'Industry Directory — Film Resource Africa',
    description: 'Find African production companies, crew, services, and training programs.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/industry',
  },
};

export default async function IndustryDirectoryPage() {
  const listings = await getDirectoryListings();

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-12 space-y-12 pt-32 md:pt-28">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Industry Directory', href: '/industry' }]} />
        <ItemListJsonLd
          name="African Film Industry Directory"
          description="Production companies, crew, services, and training programs across Africa and the diaspora."
          items={listings.slice(0, 50).map((l) => ({ name: l.name, url: `/industry#listing-${l.id}` }))}
        />
        {/* Hero */}
        <header className="relative text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Industry Directory
          </h1>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Production companies, crew, services, and training programs across Africa and the diaspora.
          </p>
        </header>

        {/* Directory */}
        <IndustryDirectoryClient initialData={listings} />

        {/* Newsletter CTA */}
        <NewsletterCTA
          variant="banner"
          heading="Get listed, get discovered"
          subtext="Join our newsletter to stay updated on new directory features and industry opportunities."
        />
      </div>
    </main>
  );
}
