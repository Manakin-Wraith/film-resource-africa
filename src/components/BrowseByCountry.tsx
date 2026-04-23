import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Country } from '@/lib/countries';
import { getFlagEmoji } from '@/lib/countries';

interface CountryWithCount {
  country: Country;
  opportunity_count: number;
}

interface BrowseByCountryProps {
  countries: CountryWithCount[];
}

export default function BrowseByCountry({ countries }: BrowseByCountryProps) {
  if (countries.length === 0) return null;

  const sorted = [...countries].sort((a, b) => b.opportunity_count - a.opportunity_count);
  const featured = sorted.slice(0, 8);

  return (
    <section id="browse-by-country" className="mt-14 md:mt-20">
      <div className="section-rule section-rule-success" />
      <span className="section-rubric">Browse by Country</span>
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <h2 className="text-[26px] md:text-[34px] font-bold font-heading leading-tight text-foreground">
          Opportunities by Region
        </h2>
        <Link
          href="/film-opportunities"
          className="text-sm font-semibold text-primary hover:text-blue-400 transition-colors flex items-center gap-1 ml-4 flex-shrink-0"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {featured.map(({ country, opportunity_count }) => (
          <Link
            key={country.slug}
            href={`/film-opportunities/${country.slug}`}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] hover:border-white/[0.16] hover:-translate-y-0.5 transition-all group"
            style={{ background: 'var(--surface)' }}
          >
            <span className="text-2xl leading-none flex-shrink-0">
              {getFlagEmoji(country.iso_code)}
            </span>
            <div className="min-w-0">
              <h3 className="text-[13px] font-bold font-heading text-foreground group-hover:text-primary transition-colors truncate leading-snug">
                {country.name}
              </h3>
              <span className="text-[11px]" style={{ color: 'var(--foreground-tertiary)' }}>
                {opportunity_count} {opportunity_count === 1 ? 'opp' : 'opps'}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {countries.length > 8 && (
        <div className="mt-5 text-center">
          <Link
            href="/film-opportunities"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-blue-400 transition-colors"
          >
            Explore all {countries.length} countries <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </section>
  );
}
