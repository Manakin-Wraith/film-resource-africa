import { Metadata } from 'next';
import Link from 'next/link';
import { Globe, ArrowRight, MapPin } from 'lucide-react';
import { getCountriesWithOpportunityCounts } from '@/app/actions';
import { getFlagEmoji, getRegionColor } from '@/lib/countries';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterCTA from '@/components/NewsletterCTA';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Film Opportunities by Country | Film Resource Africa',
  description:
    'Browse film grants, festivals, labs, and funding opportunities across Africa. Find opportunities specific to Nigeria, South Africa, Kenya, Ghana, Egypt, Morocco, and more.',
  openGraph: {
    title: 'Film Opportunities by Country | Film Resource Africa',
    description:
      'Browse film grants, festivals, labs, and funding opportunities across Africa by country.',
    siteName: 'Film Resource Africa',
  },
};

export default async function FilmOpportunitiesIndexPage() {
  const countriesWithCounts = await getCountriesWithOpportunityCounts();

  // Group by region
  const byRegion = countriesWithCounts.reduce(
    (acc, item) => {
      const region = item.country.region || 'Other';
      if (!acc[region]) acc[region] = [];
      acc[region].push(item);
      return acc;
    },
    {} as Record<string, typeof countriesWithCounts>
  );

  const regionOrder = ['West Africa', 'East Africa', 'North Africa', 'Southern Africa', 'Central Africa'];
  const sortedRegions = regionOrder.filter((r) => byRegion[r]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-12 space-y-12">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Film Opportunities by Country', href: '/film-opportunities' },
          ]}
        />

        {/* Hero */}
        <header className="relative text-center space-y-6 py-8 -mx-4 px-4 overflow-hidden">
          <div className="absolute inset-0 hero-mesh pointer-events-none"></div>
          <div className="absolute inset-0 pattern-kente pointer-events-none"></div>
          <h1 className="relative text-4xl md:text-6xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Film Opportunities by Country
          </h1>
          <p className="relative text-xl opacity-80 max-w-2xl mx-auto">
            Explore grants, festivals, labs, and funding tailored to filmmakers across Africa.
          </p>
        </header>

        {/* Country grid grouped by region */}
        {sortedRegions.map((region) => {
          const regionColor = getRegionColor(region);
          const items = byRegion[region];

          return (
            <section key={region} className="space-y-4">
              <h2
                className={`text-xl font-bold font-heading flex items-center gap-2 ${regionColor.text}`}
              >
                <Globe size={20} />
                {region}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(({ country, opportunity_count }) => (
                  <Link
                    key={country.slug}
                    href={`/film-opportunities/${country.slug}`}
                    className="glass-card rounded-[1.5rem] p-6 border border-white/10 hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.2)] transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{getFlagEmoji(country.iso_code)}</span>
                      <div>
                        <h3 className="font-bold font-heading group-hover:text-primary transition-colors">
                          {country.name}
                        </h3>
                        <span className="text-xs text-foreground/40 flex items-center gap-1">
                          <MapPin size={10} />
                          {country.region}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/50 line-clamp-2 mb-4 leading-relaxed">
                      {country.intro_text?.slice(0, 120)}
                      {(country.intro_text?.length || 0) > 120 ? '...' : ''}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">
                        {opportunity_count} {opportunity_count === 1 ? 'opportunity' : 'opportunities'}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {countriesWithCounts.length === 0 && (
          <div className="text-center py-20 text-foreground/40">
            <p className="text-xl mb-2">Country pages coming soon.</p>
            <p className="text-sm">Subscribe to be notified when we launch location-specific pages.</p>
          </div>
        )}

        {/* Newsletter CTA */}
        <NewsletterCTA
          variant="banner"
          heading="Get country-specific opportunities"
          subtext="Weekly deadline alerts and new opportunities for African filmmakers — delivered to your inbox."
        />
      </div>
    </main>
  );
}
