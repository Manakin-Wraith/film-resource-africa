import { Building2, Users, Clapperboard, Award } from 'lucide-react';
import type { Country } from '@/lib/countries';

interface CountryStatsProps {
  country: Country;
}

export default function CountryStats({ country }: CountryStatsProps) {
  return (
    <section id="resources" className="glass-card rounded-[2rem] p-8 border border-white/10">
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
              <Users size={14} /> Tax Incentives
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {country.tax_incentives}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
