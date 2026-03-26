'use client';

/**
 * Geographic scope indicator for opportunities and news.
 *
 * Renders:
 *   - Country flag emoji for country-specific items
 *   - 🌍 Africa globe for pan-African items
 *   - 🌐 Globe for international items
 *
 * Supports three visual variants:
 *   - "pill"     → standalone badge (cards, headers)
 *   - "inline"   → inline text next to titles
 *   - "overlay"  → small floating badge (over images)
 */

export type GeoScope = 'country_specific' | 'pan_african' | 'international';

interface GeoIndicatorProps {
  geoScope?: GeoScope | string | null;
  countryIso?: string | null;
  countryName?: string | null;
  variant?: 'pill' | 'inline' | 'overlay';
  className?: string;
}

function isoToFlag(iso: string): string {
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

const GEO_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  country_specific: { emoji: '', label: '', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  pan_african: { emoji: '🌍', label: 'Africa', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  international: { emoji: '🌐', label: 'International', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
};

export default function GeoIndicator({ geoScope, countryIso, countryName, variant = 'pill', className = '' }: GeoIndicatorProps) {
  if (!geoScope) return null;

  const config = GEO_CONFIG[geoScope] || GEO_CONFIG.pan_african;
  const emoji = geoScope === 'country_specific' && countryIso
    ? isoToFlag(countryIso)
    : config.emoji;
  const label = geoScope === 'country_specific' && countryName
    ? countryName
    : config.label;

  if (!emoji) return null;

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`} title={label}>
        <span className="text-sm leading-none">{emoji}</span>
      </span>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className={`flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-lg px-2 py-1.5 border border-white/10 ${className}`} title={label}>
        <span className="text-sm leading-none">{emoji}</span>
      </div>
    );
  }

  // pill variant (default)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide border ${config.bg} ${config.border} ${config.color} ${className}`}
      title={label}
    >
      <span className="text-sm leading-none">{emoji}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export { isoToFlag, GEO_CONFIG };
