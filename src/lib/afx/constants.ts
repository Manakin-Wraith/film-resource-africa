import type { Provenance, RatingBand, Visibility, ProducerProfile, EvidenceClaim, ProducerType, SoftFundingStatus } from './types';
import { liveProjects, caseStudies } from './aggregates';
import type { Project } from './types';

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

export function producerTypeOf(p: { producerType?: ProducerType }): ProducerType {
  return p.producerType ?? 'company';
}

export function isIndividual(p: { producerType?: ProducerType }): boolean {
  return producerTypeOf(p) === 'individual';
}

/** Type-aware copy for the reused K2 "operator standing" gate. */
export function operatorGateLabel(type: ProducerType): { title: string; note: string } {
  return type === 'individual'
    ? { title: 'Individual / professional standing', note: 'Your standing as an individual producer. Required to complete vetting.' }
    : { title: 'Legal entity / structure', note: 'An operating entity must be in place. Required to complete vetting.' };
}

export function meetsGoLive(p: ProducerProfile): boolean {
  return p.entityK2 && p.consentK4 && liveProjects(p).some(meetsCorePackaging);
}

// band-only: this param widens a FunderView back to ProducerProfile, so never
// read `.exact` here — it would compile but defeat the funder-boundary invariant.
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

/** Vetting is staff-adjudicated (entityVerifiedAt/individualVerifiedAt are
 *  staff-write-only). Entity vetting is gated on individual verification
 *  first, so a company producer can't be "fully vetted" without both. */
export type VettingStatus = 'not_started' | 'individual_verified' | 'fully_vetted';

export function deriveVettingStatus(p: ProducerProfile): VettingStatus {
  if (!p.individualVerifiedAt) return 'not_started';
  if (isIndividual(p)) return 'fully_vetted';
  return p.entityVerifiedAt ? 'fully_vetted' : 'individual_verified';
}

export const VETTING_STATUS_META: Record<VettingStatus, { label: string; tone: string }> = {
  not_started: { label: 'Not yet vetted', tone: '#9a9ca3' },
  individual_verified: { label: 'Individual verified', tone: '#b8860b' },
  fully_vetted: { label: 'Fully vetted', tone: '#16a34a' },
};

/** Top next-best actions for the cockpit status header. */
export function nextBestActions(p: ProducerProfile): string[] {
  const out: string[] = [];
  const live = liveProjects(p);
  const screenable = live.filter(meetsCorePackaging);
  if (screenable.length < 2) out.push('Add another live project — funders need at least two to consider your slate.');
  const selfStudies = caseStudies(p).filter((s) => s.outcomes?.recoupment.provenance === 'self' || s.budgetBand.provenance === 'self').length;
  if (selfStudies > 0) out.push(`Confirm ${selfStudies} self-reported case stud${selfStudies > 1 ? 'ies' : 'y'} to complete verification.`);
  if (!p.ndaSigned) out.push('Sign the FRA NDA to add exact figures and raise verification confidence.');
  if (!p.entityK2) out.push(isIndividual(p) ? 'Confirm your individual / professional standing (K2) to complete vetting.' : 'Complete your legal entity (K2) to complete vetting.');
  if (!p.consentK4) out.push('Grant transparency consent (K4) to become visible to funders.');
  out.push('Attach a sales agent to your strongest project to strengthen its packaging.');
  return out.slice(0, 3);
}

/* ---------- Case-study capture (Track Record) ---------- */

export const CASE_STUDY_FORMATS = ['Feature', 'Documentary', 'Series', 'Short'] as const;
export const RECOUPMENT_OPTIONS = ['Fully recouped', 'Partially recouped', 'Not recouped', 'Under NDA'] as const;
export const BOND_OPTIONS = ['Bonded', 'Not bonded'] as const;
export const DISTRIBUTION_TYPES = ['Theatrical', 'SVOD', 'TVOD', 'AVOD', 'Broadcast', 'Festival'] as const;
export const JURISDICTION_OPTIONS = ['ZA', 'NG', 'KE', 'SN'] as const;

export const EVIDENCE_CLAIM_LABELS: Record<EvidenceClaim, string> = {
  budget: 'Budget',
  recoupment: 'Recoupment',
  bond: 'Bond',
  distribution: 'Distribution',
  festival: 'Festival',
  other: 'Other',
};

export const LIVE_STAGE_OPTIONS = ['development', 'packaging', 'financing', 'pre-production', 'production'] as const;

/** Controlled funding-secured bands (ordinal, low → high). Used by the live
 *  drawer dropdown AND the de-risking score's fundingSecured ordinal. */
export const FUNDING_SECURED_BANDS = ['<40% secured', '40–60% secured', '60–80% secured', '80%+ secured'] as const;

export const SOFT_FUNDING_STATUS_LABELS: Record<SoftFundingStatus, string> = {
  applied: 'Applied',
  in_review: 'In review',
  awarded: 'Awarded',
  declined: 'Declined',
};
