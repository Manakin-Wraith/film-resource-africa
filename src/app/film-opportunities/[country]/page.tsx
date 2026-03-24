import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getCountryBySlug, getCountryOpportunities, getDirectoryListingsByCountry } from '@/app/actions';
import { getCountryFAQs } from '@/lib/countries';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import CountryHero from '@/components/location/CountryHero';
import CountryStats from '@/components/location/CountryStats';
import CountryFAQ from '@/components/location/CountryFAQ';
import CountryOpportunities from '@/components/location/CountryOpportunities';
import CountryDirectory from '@/components/location/CountryDirectory';
import CountryFilmCommission from '@/components/location/CountryFilmCommission';
import CountryResources from '@/components/location/CountryResources';
import CountryLocations from '@/components/location/CountryLocations';
import CountryPracticalInfo from '@/components/location/CountryPracticalInfo';
import NewsletterCTA from '@/components/NewsletterCTA';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const countryData = await getCountryBySlug(country);

  if (!countryData) {
    return { title: 'Country Not Found | Film Resource Africa' };
  }

  const now = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    title: `Film Opportunities in ${countryData.name} | Film Resource Africa`,
    description: `Comprehensive guide to film festivals, grants, labs, production companies, crew, and industry services in ${countryData.name}. Updated ${now}.`,
    openGraph: {
      title: `Film Opportunities in ${countryData.name}`,
      description: `Find film festivals, funding, and resources in ${countryData.name}. Your guide to filmmaking opportunities.`,
      siteName: 'Film Resource Africa',
      url: `https://film-resource-africa.com/film-opportunities/${countryData.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Film Opportunities in ${countryData.name}`,
      description: `Your guide to filmmaking in ${countryData.name}`,
    },
    alternates: {
      canonical: `https://film-resource-africa.com/film-opportunities/${countryData.slug}`,
    },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const countryData = await getCountryBySlug(slug);

  if (!countryData) notFound();

  const [opportunities, directoryListings] = await Promise.all([
    getCountryOpportunities(countryData.id),
    getDirectoryListingsByCountry(countryData.name),
  ]);
  const faqs = getCountryFAQs(countryData);

  // JSON-LD for the country page
  const countryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Film Opportunities in ${countryData.name}`,
    description: `Comprehensive guide to film festivals, grants, labs, and industry resources in ${countryData.name}.`,
    url: `https://film-resource-africa.com/film-opportunities/${countryData.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Film Resource Africa',
      url: 'https://film-resource-africa.com',
    },
    about: {
      '@type': 'Country',
      name: countryData.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Film Resource Africa',
      url: 'https://film-resource-africa.com',
    },
  };

  // ItemList schema for opportunities
  const itemListJsonLd = opportunities.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Film Opportunities in ${countryData.name}`,
        numberOfItems: opportunities.length,
        itemListElement: opportunities.slice(0, 50).map((opp, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: opp.title,
          url: `https://film-resource-africa.com/film-opportunities/${countryData.slug}#opp-${opp.id}`,
        })),
      }
    : null;

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(countryJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      {/* Breadcrumbs */}
      <div className="relative z-10 container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Film Opportunities', href: '/film-opportunities' },
            { name: countryData.name, href: `/film-opportunities/${countryData.slug}` },
          ]}
        />
      </div>

      {/* Hero */}
      <CountryHero country={countryData} opportunityCount={opportunities.length} />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — opportunities */}
          <div className="lg:col-span-2 space-y-12">
            {/* Film Services Directory */}
            <CountryDirectory
              listings={directoryListings}
              countryName={countryData.name}
            />

            {/* Key Resources & Associations */}
            <CountryResources
              resources={countryData.key_resources || []}
              associations={countryData.industry_associations || []}
              countryName={countryData.name}
            />

            {/* Filming Locations */}
            <CountryLocations
              locations={countryData.filming_locations || []}
              countryName={countryData.name}
            />

            <CountryOpportunities
              opportunities={opportunities}
              countryName={countryData.name}
            />

            {/* CTA to main directory */}
            <div className="glass-card rounded-[2rem] p-8 border border-white/10 text-center">
              <p className="text-foreground/60 mb-4">
                Looking for opportunities beyond {countryData.name}?
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                Browse All African Opportunities
              </Link>
            </div>
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-8">
            {/* Film Commission */}
            <CountryFilmCommission
              commission={countryData.film_commission}
              productionGuideUrl={countryData.production_guide_url}
              countryName={countryData.name}
            />

            <CountryStats country={countryData} />

            {/* Practical Info */}
            <CountryPracticalInfo
              info={countryData.practical_info}
              countryName={countryData.name}
            />

            {/* Newsletter signup */}
            <div className="glass-card rounded-[2rem] p-6 border border-white/10">
              <h3 className="text-lg font-bold font-heading mb-2">
                Get {countryData.name} Updates
              </h3>
              <p className="text-sm text-foreground/50 mb-4">
                Receive deadline alerts and new opportunities for {countryData.name}.
              </p>
              <NewsletterCTA variant="hero" />
            </div>

            {/* Link to other countries */}
            <div className="glass-card rounded-[2rem] p-6 border border-white/10">
              <h3 className="text-lg font-bold font-heading mb-4">Other Countries</h3>
              <Link
                href="/film-opportunities"
                className="text-primary hover:text-blue-400 text-sm font-medium transition-colors"
              >
                Browse all countries →
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <CountryFAQ countryName={countryData.name} faqs={faqs} />
        </div>
      </div>
    </main>
  );
}
