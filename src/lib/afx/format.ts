import type { RatingBand, Confidence } from './types';

/** Compact USD formatter matching the mockup's fmtUSD(). */
export function fmtUSD(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e6) {
    const v = n / 1e6;
    return '$' + (v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, '') + 'M';
  }
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + n;
}

/** Band label, contextual to the entity kind (mockup bandLabelFor()). */
export function bandLabel(entity: 'producers' | 'projects' | 'slates', b: RatingBand): string {
  if (entity === 'projects') {
    return { A: 'Investment-ready', B: 'Conditional', C: 'Early-stage', D: 'Not-ready' }[b];
  }
  if (entity === 'slates') {
    return { A: 'Anchor slate', B: 'Solid slate', C: 'Speculative', D: 'Thin' }[b];
  }
  return { A: 'Anchor', B: 'Roster', C: 'Watchlist', D: 'Not-yet' }[b];
}

export const RATING_RANK: Record<RatingBand, number> = { A: 4, B: 3, C: 2, D: 1 };

/** Confidence → marker style (mockup confMarker()). Returns an inline style. */
export function confMarkerStyle(conf: Confidence | null | undefined, size = 9): React.CSSProperties {
  const base: React.CSSProperties = { width: size, height: size, borderRadius: 2, flex: 'none' };
  if (conf === 'Confirmed') return { ...base, background: '#1C1D21', border: '1px solid #1C1D21' };
  if (conf === 'Likely') return { ...base, background: 'linear-gradient(135deg,#1C1D21 0 50%,#fff 50% 100%)', border: '1px solid #C9C6BE' };
  return { ...base, background: '#fff', border: '1px dashed #B0ADA5' }; // Aspirational / missing
}
