import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
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
  twitter: {
    card: 'summary',
    title: 'Film Opportunities by Country | Film Resource Africa',
    description: 'Browse film grants, festivals, labs, and funding opportunities across Africa by country.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/film-opportunities',
  },
};

export default async function FilmOpportunitiesIndexPage() {
  const countriesWithCounts = await getCountriesWithOpportunityCounts();

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

  const totalCountries = countriesWithCounts.length;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 space-y-14">

        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Film Opportunities by Country', href: '/film-opportunities' },
          ]}
        />

        {/* Editorial header */}
        <header>
          <div className="section-rule section-rule-success" />
          <span className="section-rubric">Browse by Country</span>
          <div className="flex items-baseline justify-between">
            <h1 className="text-[26px] md:text-[38px] font-bold font-heading leading-tight text-foreground">
              Film Opportunities Across Africa
            </h1>
            <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
              {totalCountries} countries
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--foreground-secondary)' }}>
            Grants, festivals, labs, and funding tailored to filmmakers across the continent.
          </p>
        </header>

        {/* Country grid grouped by region */}
        {sortedRegions.map((region) => {
          const regionColor = getRegionColor(region);
          const items = byRegion[region];
          const withOpps = items.filter(i => i.opportunity_count > 0).length;

          return (
            <section key={region}>
              {/* Region header — editorial anatomy */}
              <div className="h-px mb-4" style={{ background: 'var(--border)' }} />
              <div className="flex items-baseline justify-between mb-5">
                <h2 className={`text-[13px] font-bold uppercase tracking-widest ${regionColor.text}`}>
                  {region}
                </h2>
                {withOpps > 0 && (
                  <span className="text-[11px] font-medium" style={{ color: 'var(--foreground-tertiary)' }}>
                    {withOpps} with opportunities
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map(({ country, opportunity_count }) => (
                  <Link
                    key={country.slug}
                    href={`/film-opportunities/${country.slug}`}
                    className="rounded-xl p-4 border border-white/[0.08] hover:border-white/[0.16] transition-all group flex flex-col"
                    style={{ background: 'var(--surface)' }}
                  >
                    {/* Flag + name */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-2xl leading-none flex-shrink-0">{getFlagEmoji(country.iso_code)}</span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[14px] font-heading text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                          {country.name}
                        </h3>
                        <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--foreground-tertiary)' }}>
                          <MapPin size={9} />
                          {country.region}
                        </span>
                      </div>
                    </div>

                    {/* Intro snippet — only if present and interesting */}
                    {country.intro_text && opportunity_count > 0 && (
                      <p className="text-[12px] leading-relaxed line-clamp-2 mb-3 flex-grow" style={{ color: 'var(--foreground-secondary)' }}>
                        {country.intro_text.slice(0, 110)}
                        {(country.intro_text.length) > 110 ? '…' : ''}
                      </p>
                    )}

                    {/* Footer row */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className={`text-[12px] font-bold ${opportunity_count > 0 ? 'text-primary' : ''}`} style={opportunity_count === 0 ? { color: 'var(--foreground-tertiary)' } : undefined}>
                        {opportunity_count} {opportunity_count === 1 ? 'opportunity' : 'opportunities'}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {countriesWithCounts.length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--foreground-tertiary)' }}>
            <p className="mb-2">Country pages coming soon.</p>
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
