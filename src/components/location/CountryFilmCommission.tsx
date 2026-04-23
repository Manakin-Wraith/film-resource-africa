import { Landmark, Globe, Mail, Phone, MapPin, ExternalLink, FileText } from 'lucide-react';
import type { FilmCommission } from '@/lib/countries';

interface CountryFilmCommissionProps {
  commission: FilmCommission | null;
  productionGuideUrl: string | null;
  countryName: string;
}

export default function CountryFilmCommission({ commission, productionGuideUrl, countryName }: CountryFilmCommissionProps) {
  if (!commission) return null;

  return (
    <section aria-label={`${countryName} film commission`} className="rounded-xl p-6 border border-white/[0.08]" style={{ background: 'var(--surface)' }}>
      <h3 className="flex items-center gap-2 text-lg font-bold font-heading mb-4">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
          <Landmark size={16} className="text-emerald-400" />
        </div>
        Film Commission
      </h3>

      <div className="space-y-3">
        <p className="font-semibold text-sm">{commission.name}</p>

        {commission.website && (
          <a
            href={commission.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:text-blue-400 transition-colors"
          >
            <Globe size={14} className="flex-shrink-0" />
            <span className="truncate">{commission.website.replace(/^https?:\/\//, '')}</span>
            <ExternalLink size={12} className="flex-shrink-0 opacity-50" />
          </a>
        )}

        {commission.email && (
          <a
            href={`mailto:${commission.email}`}
            className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <Mail size={14} className="flex-shrink-0" />
            {commission.email}
          </a>
        )}

        {commission.phone && (
          <a
            href={`tel:${commission.phone}`}
            className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <Phone size={14} className="flex-shrink-0" />
            {commission.phone}
          </a>
        )}

        {commission.address && (
          <p className="flex items-start gap-2 text-sm text-foreground/40">
            <MapPin size={14} className="flex-shrink-0 mt-0.5" />
            {commission.address}
          </p>
        )}
      </div>

      {productionGuideUrl && (
        <a
          href={productionGuideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 w-full justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-emerald-500/20 transition-all"
        >
          <FileText size={14} />
          {countryName} Production Guide
          <ExternalLink size={12} className="opacity-50" />
        </a>
      )}
    </section>
  );
}
