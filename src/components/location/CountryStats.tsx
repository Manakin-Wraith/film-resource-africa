import { Building2, Users, Clapperboard, Award, Handshake, Banknote } from 'lucide-react';
import type { Country } from '@/lib/countries';

interface CountryStatsProps {
  country: Country;
}

export default function CountryStats({ country }: CountryStatsProps) {
  return (
    <section id="resources" className="rounded-xl p-6 border border-white/[0.08]" style={{ background: 'var(--surface)' }}>
      <h2 className="text-2xl font-bold font-heading mb-6">Industry at a Glance</h2>

      <div className="space-y-6">
        {/* Major Studios */}
        {country.major_studios && country.major_studios.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/50 mb-3">
              <Building2 size={14} /> Major Studios & Companies
            </h3>
            <div className="flex flex-wrap gap-2">
              {country.major_studios.map((studio) => (
                <span
                  key={studio}
                  className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-lg"
                >
                  {studio}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notable Filmmakers */}
        {country.notable_filmmakers && country.notable_filmmakers.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/50 mb-3">
              <Award size={14} /> Notable Filmmakers
            </h3>
            <div className="flex flex-wrap gap-2">
              {country.notable_filmmakers.map((name) => (
                <span
                  key={name}
                  className="px-3 py-1.5 text-xs font-medium bg-primary/10 border border-primary/20 rounded-lg text-primary"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filming Permits */}
        {country.filming_permit_info && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/50 mb-3">
              <Clapperboard size={14} /> Filming Permits
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {country.filming_permit_info}
            </p>
          </div>
        )}

        {/* Tax Incentives */}
        {country.tax_incentives && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/50 mb-3">
              <Banknote size={14} /> Tax Incentives
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {country.tax_incentives}
            </p>
          </div>
        )}

        {/* Co-Production Treaties */}
        {country.co_production_treaties && country.co_production_treaties.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/50 mb-3">
              <Handshake size={14} /> Co-Production Treaties
            </h3>
            <div className="space-y-2">
              {country.co_production_treaties.map((treaty) => (
                <div
                  key={treaty.country}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold">{treaty.country}</span>
                    <span className="text-[10px] text-foreground/30">{treaty.year}</span>
                  </div>
                  <p className="text-[11px] text-foreground/40 leading-snug">
                    {treaty.treaty_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
