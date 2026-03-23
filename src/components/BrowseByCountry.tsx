import Link from 'next/link';
import { Globe, ArrowRight, MapPin } from 'lucide-react';
import type { Country } from '@/lib/countries';
import { getFlagEmoji, getRegionColor } from '@/lib/countries';

interface CountryWithCount {
  country: Country;
  opportunity_count: number;
}

interface BrowseByCountryProps {
  countries: CountryWithCount[];
}

export default function BrowseByCountry({ countries }: BrowseByCountryProps) {
  if (countries.length === 0) return null;

  // Group by region
  const byRegion = countries.reduce(
    (acc, item) => {
      const region = item.country.region || 'Other';
      if (!acc[region]) acc[region] = [];
      acc[region].push(item);
      return acc;
    },
    {} as Record<string, CountryWithCount[]>
  );

  const regionOrder = ['West Africa', 'East Africa', 'North Africa', 'Southern Africa', 'Central Africa'];
  const sortedRegions = regionOrder.filter((r) => byRegion[r]);

  // Show top countries (those with most opportunities) as featured, rest in compact list
  const sorted = [...countries].sort((a, b) => b.opportunity_count - a.opportunity_count);
  const featured = sorted.slice(0, 8);

  return (
    <section
      id="browse-by-country"
      className="relative rounded-3xl bg-gradient-to-b from-emerald-500/[0.06] to-transparent border border-emerald-500/10 p-6 md:p-8 -mx-4 md:mx-0 overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 pattern-dots pointer-events-none opacity-50"></div>
      <div className="absolute top-0 left-1/3 w-80 h-64 bg-emerald-500/8 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/8 rounded-full blur-[100px] translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
            <Globe size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading">Browse by Country</h2>
            <p className="text-sm text-foreground/50">
              Explore opportunities tailored to filmmakers across Africa
            </p>
          </div>
        </div>
        <Link
          href="/film-opportunities"
          className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all countries <ArrowRight size={14} />
        </Link>
      </div>

      {/* Featured country cards */}
      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {featured.map(({ country, opportunity_count }) => {
          const regionColor = getRegionColor(country.region);
          return (
            <Link
              key={country.slug}
              href={`/film-opportunities/${country.slug}`}
              className="glass-card rounded-2xl p-4 border border-white/10 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.2)] transition-all group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-2xl leading-none">{getFlagEmoji(country.iso_code)}</span>
                <div className="min-w-0">
                  <h3 className="font-bold font-heading text-sm leading-tight group-hover:text-emerald-400 transition-colors truncate">
                    {country.name}
                  </h3>
                  <span className="text-[10px] text-foreground/40 flex items-center gap-1">
                    <MapPin size={8} />
                    {country.region}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">
                  {opportunity_count} {opportunity_count === 1 ? 'opportunity' : 'opportunities'}
                </span>
                <ArrowRight
                  size={12}
                  className="text-foreground/20 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all"
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* "See all countries" bottom link for mobile */}
      {countries.length > 8 && (
        <div className="relative mt-4 text-center">
          <Link
            href="/film-opportunities"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            Explore all {countries.length} countries <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </section>
  );
}
