import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getCountryBySlug, getCountryOpportunities, getDirectoryListingsByCountry } from '@/app/actions';
import { getCountryFAQs } from '@/lib/countries';
import Breadcrumbs from '@/components/Breadcrumbs';
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

  const hasCommission = !!countryData.film_commission;
  const hasLocations = countryData.filming_locations && countryData.filming_locations.length > 0;

  return {
    title: `Film Opportunities in ${countryData.name} | Film Resource Africa`,
    description: `Comprehensive guide to film festivals, grants, labs, production companies, gear houses, co-production partners, filming locations, and industry services in ${countryData.name}.${hasCommission ? ` Film commission contacts and tax incentives included.` : ''} Updated ${now}.`,
    keywords: [
      `film opportunities ${countryData.name}`,
      `film grants ${countryData.name}`,
      `film festivals ${countryData.name}`,
      `production companies ${countryData.name}`,
      `gear rental ${countryData.name}`,
      `filming locations ${countryData.name}`,
      `co-production ${countryData.name}`,
      `film commission ${countryData.name}`,
      `African filmmakers`,
      `${countryData.name} film industry`,
    ],
    openGraph: {
      title: `Film Opportunities in ${countryData.name}`,
      description: `Find film festivals, funding, production companies, gear houses, and filming locations in ${countryData.name}. Your complete guide to filmmaking opportunities.`,
      siteName: 'Film Resource Africa',
      url: `https://film-resource-africa.com/film-opportunities/${countryData.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Film Opportunities in ${countryData.name}`,
      description: `Your complete guide to filmmaking in ${countryData.name} — grants, studios, gear houses, locations & more.`,
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

  const siteUrl = 'https://film-resource-africa.com';

  // JSON-LD for the country page
  const countryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Film Opportunities in ${countryData.name}`,
    description: `Comprehensive guide to film festivals, grants, production companies, gear houses, filming locations, and industry resources in ${countryData.name}.`,
    url: `${siteUrl}/film-opportunities/${countryData.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Film Resource Africa',
      url: siteUrl,
    },
    about: {
      '@type': 'Country',
      name: countryData.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Film Resource Africa',
      url: siteUrl,
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
          url: `${siteUrl}/film-opportunities/${countryData.slug}#opp-${opp.id}`,
        })),
      }
    : null;

  // ItemList schema for directory listings
  const directoryJsonLd = directoryListings.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Film Industry Directory — ${countryData.name}`,
        description: `Production companies, gear houses, agencies, and services in ${countryData.name}.`,
        numberOfItems: directoryListings.length,
        itemListElement: directoryListings.slice(0, 50).map((listing, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'LocalBusiness',
            name: listing.name,
            description: listing.description,
            address: {
              '@type': 'PostalAddress',
              addressLocality: listing.city || undefined,
              addressCountry: countryData.name,
            },
            ...(listing.website ? { url: listing.website } : {}),
          },
        })),
      }
    : null;

  // GovernmentOrganization schema for film commission
  const commissionJsonLd = countryData.film_commission
    ? {
        '@context': 'https://schema.org',
        '@type': 'GovernmentOrganization',
        name: countryData.film_commission.name,
        ...(countryData.film_commission.website ? { url: countryData.film_commission.website } : {}),
        ...(countryData.film_commission.email ? { email: countryData.film_commission.email } : {}),
        ...(countryData.film_commission.phone ? { telephone: countryData.film_commission.phone } : {}),
        ...(countryData.film_commission.address
          ? { address: { '@type': 'PostalAddress', streetAddress: countryData.film_commission.address, addressCountry: countryData.name } }
          : {}),
        description: `Official film commission of ${countryData.name}. Manages filming permits, industry regulation, and production support.`,
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
      {directoryJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(directoryJsonLd) }}
        />
      )}
      {commissionJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(commissionJsonLd) }}
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
