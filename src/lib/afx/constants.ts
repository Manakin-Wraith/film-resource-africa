import type { Provenance, RatingBand, Visibility, ProducerProfile } from './types';
import { liveProjects, caseStudies } from './aggregates';
import type { Project } from './types';

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

/** A live project is screenable when it has core deal facts + packaging
 *  (≥ director and writer attached, and a funding plan). Spec §4. */
export function meetsCorePackaging(pr: Project): boolean {
  const ask = pr.ask;
  if (!ask) return false;
  const hasDirector = ask.packaging.some((a) => /director/i.test(a.role) && a.name.trim() !== '' && a.name !== '—');
  const hasWriter = ask.packaging.some((a) => /writer/i.test(a.role) && a.name.trim() !== '' && a.name !== '—');
  const hasFundingPlan = ask.capitalStack.gapPct < 100 && ask.fundingSecuredBand.trim() !== '';
  return hasDirector && hasWriter && hasFundingPlan;
}

export function meetsGoLive(p: ProducerProfile): boolean {
  return p.entityK2 && p.consentK4 && liveProjects(p).some(meetsCorePackaging);
}

export function deriveVisibility(p: ProducerProfile): Visibility {
  const screenable = liveProjects(p).filter(meetsCorePackaging);
  if (!p.consentK4 || !p.entityK2) return 'hidden';
  if (screenable.length === 0) return 'hidden';
  if (screenable.length === 1) return 'one-away';
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
  const live = liveProjects(p);
  const screenable = live.filter(meetsCorePackaging);
  if (screenable.length < 2) out.push('Add another live project to diversify your slate and climb the default sort.');
  const selfStudies = caseStudies(p).filter((s) => s.outcomes?.recoupment.provenance === 'self' || s.budgetBand.provenance === 'self').length;
  if (selfStudies > 0) out.push(`Confirm ${selfStudies} self-reported case stud${selfStudies > 1 ? 'ies' : 'y'} to lift your rating.`);
  if (!p.ndaSigned) out.push('Sign the FRA NDA to add exact figures and raise verification confidence.');
  if (!p.entityK2) out.push('Complete your legal entity (K2) to remove the rating cap.');
  if (!p.consentK4) out.push('Grant transparency consent (K4) to become visible to funders.');
  out.push('Attach a sales agent to your strongest project to raise packaging strength.');
  return out.slice(0, 3);
}
