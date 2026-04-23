import { Globe, Film, Users, Calendar } from 'lucide-react';
import type { Country } from '@/lib/countries';
import { getFlagEmoji, getIndustrySizeLabel, getRegionColor } from '@/lib/countries';

interface CountryHeroProps {
  country: Country;
  opportunityCount: number;
}

export default function CountryHero({ country, opportunityCount }: CountryHeroProps) {
  const regionColor = getRegionColor(country.region);
  const flag = getFlagEmoji(country.iso_code);

  return (
    <div className="container mx-auto px-4 pt-6 pb-10">
      <div className="max-w-3xl">
        {/* Editorial section anatomy */}
        <div className="section-rule section-rule-muted" />
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl leading-none">{flag}</span>
          <span className="section-rubric" style={{ marginBottom: 0 }}>Film Opportunities</span>
        </div>

        <h1 className="text-[32px] md:text-[52px] font-extrabold font-heading leading-[1.05] tracking-tight text-foreground mb-4">
          {country.name}
        </h1>

        {country.intro_text && (
          <p className="text-[16px] md:text-[18px] leading-relaxed mb-6" style={{ color: 'var(--foreground-secondary)' }}>
            {country.intro_text}
          </p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border ${regionColor.bg} ${regionColor.border} ${regionColor.text}`}>
            <Globe size={12} />
            {country.region}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-white/[0.1] text-foreground/50" style={{ background: 'var(--surface)' }}>
            <Film size={12} />
            {getIndustrySizeLabel(country.film_industry_size)}
          </span>
          {country.annual_productions > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-white/[0.1] text-foreground/50" style={{ background: 'var(--surface)' }}>
              <Calendar size={12} />
              ~{country.annual_productions} productions/year
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary">
            <Users size={12} />
            {opportunityCount} {opportunityCount === 1 ? 'opportunity' : 'opportunities'}
          </span>
        </div>

        {/* Quick-nav anchors */}
        <div className="flex flex-wrap gap-2">
          {[
            { href: '#opportunities', label: 'Opportunities', primary: true },
            { href: '#resources', label: 'Industry Stats' },
            { href: '#resources-links', label: 'Key Resources' },
            { href: '#locations', label: 'Filming Locations' },
            { href: '#faq', label: 'FAQ' },
          ].map(({ href, label, primary }) => (
            <a
              key={href}
              href={href}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${
                primary
                  ? 'bg-primary border-primary text-white hover:bg-blue-600'
                  : 'border-white/[0.1] hover:border-white/[0.2] hover:text-foreground'
              }`}
              style={primary ? undefined : { background: 'var(--surface)', color: 'var(--foreground-secondary)' }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
