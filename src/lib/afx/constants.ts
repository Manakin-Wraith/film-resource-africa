import type { Provenance, RatingBand, Visibility, ProducerProfile } from './types';

/* ---------- Deal Display ---------- */

export const ENTITY_TABS: { key: 'producers' | 'slates' | 'projects'; label: string }[] = [
  { key: 'producers', label: 'Producers' },
  { key: 'slates', label: 'Slates' },
  { key: 'projects', label: 'Projects' },
];

export const SIGNAL_TABS: { key: 'band' | 'ring' | 'bar'; label: string }[] = [
  { key: 'band', label: 'Band' },
  { key: 'ring', label: 'Ring' },
  { key: 'bar', label: 'Bar' },
];

/** Sortable columns after the implicit name column. */
export const SORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'name', label: 'Producer / project' },
  { key: 'score', label: 'Deal signal' },
  { key: 'budget', label: 'Budget' },
  { key: 'funding', label: 'Funding / gap' },
  { key: 'rebate', label: 'Rebate' },
  { key: 'rating', label: 'Rating' },
  { key: 'stage', label: 'Stage / region' },
];

export const FILTER_GROUPS: { label: string; key: 'band' | 'conf' | 'juris'; options: { l: string; v: string }[] }[] = [
  { label: 'Rating', key: 'band', options: [{ l: 'All', v: 'All' }, { l: 'A', v: 'A' }, { l: 'B', v: 'B' }, { l: 'C', v: 'C' }, { l: 'D', v: 'D' }] },
  { label: 'Rebate confidence', key: 'conf', options: [{ l: 'All', v: 'All' }, { l: 'Confirmed', v: 'Confirmed' }, { l: 'Likely', v: 'Likely' }, { l: 'Aspirational', v: 'Aspirational' }, { l: 'Missing', v: 'Missing' }] },
  { label: 'Jurisdiction', key: 'juris', options: [{ l: 'All', v: 'All' }, { l: 'ZA', v: 'ZA' }, { l: 'NG', v: 'NG' }, { l: 'KE', v: 'KE' }, { l: 'SN', v: 'SN' }] },
];

export const RATING_BAND_LABEL: Record<RatingBand, string> = {
  A: 'Anchor', B: 'Roster', C: 'Watchlist', D: 'Not-yet',
};

/* ---------- Provenance ---------- */

export const PROVENANCE_META: Record<Provenance, { label: string; varName: string; bg: string }> = {
  self: { label: 'Self-reported', varName: 'var(--afx-prov-self)', bg: '#fbf3d9' },
  confirmed: { label: 'Confirmed', varName: 'var(--afx-prov-confirmed)', bg: '#e7efff' },
  verified: { label: 'Verified', varName: 'var(--afx-prov-verified)', bg: '#e4f5ea' },
};

/* ---------- Cockpit visibility ---------- */

/** Derive funder visibility from active project count + consent gate. */
export function deriveVisibility(p: ProducerProfile): Visibility {
  const active = p.projects.filter((pr) => !pr.archived);
  if (!p.consentK4) return 'hidden';
  if (active.length === 0) return 'hidden';
  if (active.length === 1) return 'one-away';
  return 'live';
}

export const VISIBILITY_META: Record<Visibility, { label: string; tone: string }> = {
  live: { label: 'Live to funders', tone: '#16a34a' },
  'one-away': { label: '1 project from going live', tone: '#b8860b' },
  hidden: { label: 'Hidden from funders', tone: '#9a9ca3' },
};

/** Top next-best actions for the cockpit status header. */
export function nextBestActions(p: ProducerProfile): string[] {
  const out: string[] = [];
  const active = p.projects.filter((pr) => !pr.archived);
  if (active.length < 2) out.push('Add a second project to diversify your slate and climb the default sort.');
  const selfBands = Object.values(p.bands).filter((b) => b.provenance === 'self').length;
  if (selfBands > 0) out.push(`Request verification on ${selfBands} self-reported band${selfBands > 1 ? 's' : ''} to lift your rating.`);
  const selfCredits = p.filmography.filter((f) => f.recoupmentBand.provenance === 'self' || f.budgetBand.provenance === 'self').length;
  if (selfCredits > 0) out.push(`Confirm ${selfCredits} unverified credit${selfCredits > 1 ? 's' : ''} in your filmography.`);
  if (!p.entityK2) out.push('Complete your legal entity (K2) to remove the rating cap.');
  if (!p.consentK4) out.push('Grant transparency consent (K4) to become visible to funders.');
  out.push('Attach a sales agent to your strongest project to raise packaging strength.');
  return out.slice(0, 3);
}
