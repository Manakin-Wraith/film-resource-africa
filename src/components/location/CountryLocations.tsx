import { MapPin, Film, Clapperboard } from 'lucide-react';
import type { FilmingLocation } from '@/lib/countries';

interface CountryLocationsProps {
  locations: FilmingLocation[];
  countryName: string;
}

export default function CountryLocations({ locations, countryName }: CountryLocationsProps) {
  if (locations.length === 0) return null;

  return (
    <section id="locations" aria-label={`Filming locations in ${countryName}`} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/20">
          <MapPin size={20} className="text-rose-400" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading">Filming Locations</h2>
          <p className="text-foreground/40 text-sm">
            Popular production destinations across {countryName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((location) => (
          <div
            key={location.name}
            className="rounded-xl p-5 border border-white/[0.08] hover:border-white/[0.16] transition-all group"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold font-heading text-base group-hover:text-rose-400 transition-colors leading-tight">
                {location.name}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-foreground/40 bg-white/5 border border-white/10 whitespace-nowrap">
                <MapPin size={8} />
                {location.region}
              </span>
            </div>

            <p className="text-foreground/50 text-xs leading-relaxed mb-3">
              {location.description}
            </p>

            {location.notable_productions && location.notable_productions.length > 0 && (
              <div>
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground/30 mb-1.5">
                  <Clapperboard size={10} /> Notable Productions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {location.notable_productions.map((prod) => (
                    <span
                      key={prod}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-rose-500/10 border border-rose-500/15 text-rose-300"
                    >
                      <Film size={8} />
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
