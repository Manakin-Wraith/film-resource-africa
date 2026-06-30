import type { RatingBand, Confidence, AfxCurrency, ExactMoney } from './types';

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

/** Currency symbols for exact-figure display. USD compact, ZAR with a space. */
export const CURRENCY_SYMBOL: Record<AfxCurrency, string> = { USD: '$', ZAR: 'R ' };

/** Full grouped money in its own currency, e.g. {1450000,'ZAR'} → "R 1,450,000".
 *  Empty/invalid → "". */
export function formatExact(m: ExactMoney | undefined): string {
  if (!m || !Number.isFinite(m.amount)) return '';
  return CURRENCY_SYMBOL[m.currency] + Math.round(m.amount).toLocaleString('en-US');
}

/** Lenient parse of a typed amount into a number (the currency is chosen by the
 *  input's toggle, NOT parsed here). Accepts "1,450,000", "1.45m", "850k",
 *  "$1,200,000", "R 1 450 000". Returns undefined for blank/unparseable input. */
export function parseMoney(input: string): number | undefined {
  const s = input.trim().toLowerCase().replace(/^[r$]/, '').replace(/[$,\s]/g, '');
  if (s === '') return undefined;
  const match = s.match(/^(\d*\.?\d+)\s*([km])?$/);
  if (!match) return undefined;
  let n = parseFloat(match[1]);
  if (!Number.isFinite(n)) return undefined;
  if (match[2] === 'k') n *= 1e3;
  if (match[2] === 'm') n *= 1e6;
  if (n < 0) return undefined;
  return n;
}
