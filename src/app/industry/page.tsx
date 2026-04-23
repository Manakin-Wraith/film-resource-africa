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
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Industry Directory', href: '/industry' }]} />
        <ItemListJsonLd
          name="African Film Industry Directory"
          description="Production companies, crew, services, and training programs across Africa and the diaspora."
          items={listings.slice(0, 50).map((l) => ({ name: l.name, url: `/industry#listing-${l.id}` }))}
        />
        {/* Editorial header */}
        <header>
          <div className="section-rule section-rule-muted" />
          <span className="section-rubric">Industry</span>
          <div className="flex items-baseline justify-between">
            <h1 className="text-[26px] md:text-[38px] font-bold font-heading leading-tight text-foreground">
              Industry Directory
            </h1>
            <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
              {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--foreground-secondary)' }}>
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
