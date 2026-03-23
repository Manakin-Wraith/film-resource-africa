import { Globe, Film, Users, Calendar } from 'lucide-react';
import type { Country } from '@/lib/countries';
import { getFlagEmoji, getIndustrySizeLabel, getRegionColor } from '@/lib/countries';
import NewsletterCTA from '@/components/NewsletterCTA';

interface CountryHeroProps {
  country: Country;
  opportunityCount: number;
}

export default function CountryHero({ country, opportunityCount }: CountryHeroProps) {
  const regionColor = getRegionColor(country.region);
  const flag = getFlagEmoji(country.iso_code);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 hero-mesh pointer-events-none"></div>
      <div className="absolute inset-0 pattern-kente pointer-events-none opacity-30"></div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="text-6xl mb-2">{flag}</div>

          <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Film Opportunities in {country.name}
          </h1>

          <p className="text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            {country.intro_text}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${regionColor.bg} ${regionColor.border} ${regionColor.text}`}>
              <Globe size={14} />
              {country.region}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-white/5 border-white/10 text-foreground/60">
              <Film size={14} />
              {getIndustrySizeLabel(country.film_industry_size)}
            </span>
            {country.annual_productions > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-white/5 border-white/10 text-foreground/60">
                <Calendar size={14} />
                ~{country.annual_productions} productions/year
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-primary/10 border-primary/20 text-primary">
              <Users size={14} />
              {opportunityCount} {opportunityCount === 1 ? 'opportunity' : 'opportunities'}
            </span>
          </div>

          {/* Quick-nav anchors */}
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <a href="#opportunities" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
              Browse Opportunities
            </a>
            <a href="#resources" className="px-5 py-2.5 bg-white/10 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
              Industry Resources
            </a>
            <a href="#faq" className="px-5 py-2.5 bg-white/10 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
              FAQ
            </a>
          </div>

          {/* Newsletter */}
          <div className="pt-4 max-w-md mx-auto">
            <NewsletterCTA variant="hero" />
          </div>
        </div>
      </div>
    </div>
  );
}
