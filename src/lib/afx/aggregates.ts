import type { ProducerProfile, Project } from './types';

export function projectsOf(p: ProducerProfile): Project[] {
  return p.slate ?? [];
}
export function caseStudies(p: ProducerProfile): Project[] {
  return projectsOf(p).filter((x) => x.status === 'case_study');
}
export function liveProjects(p: ProducerProfile): Project[] {
  return projectsOf(p).filter((x) => x.status === 'live');
}

export interface Aggregates {
  budgetTier: string;
  capitalRaised: string;
  recoupmentRecord: string;
  bondHistory: string;
}

/** Roll up the four lifetime aggregate bands from case-study outcomes.
 *  Bands in, bands out — no raw figures. */
export function computeAggregates(p: ProducerProfile): Aggregates {
  const studies = caseStudies(p);
  if (studies.length === 0) {
    return { budgetTier: '—', capitalRaised: '—', recoupmentRecord: '—', bondHistory: '—' };
  }
  const topBudget = studies
    .map((s) => s.budgetBand.value)
    .sort((a, b) => budgetRank(b) - budgetRank(a))[0];
  const recoupedCount = studies.filter((s) => /full/i.test(s.outcomes?.recoupment.value ?? '')).length;
  const bondedCount = studies.filter((s) => /bonded/i.test(s.outcomes?.bondUsed.value ?? '') && !/not/i.test(s.outcomes?.bondUsed.value ?? '')).length;
  return {
    budgetTier: topBudget,
    capitalRaised: studies.length >= 5 ? '$20M+ (lifetime)' : studies.length >= 3 ? '$5–20M (lifetime)' : 'Under $5M (lifetime)',
    recoupmentRecord: `${recoupedCount}/${studies.length} fully recouped`,
    bondHistory: bondedCount > 0 ? `${bondedCount} title${bondedCount > 1 ? 's' : ''} bonded` : 'No bond history',
  };
}

function budgetRank(band: string): number {
  if (/15M\+/.test(band)) return 5;
  if (/5[–-]15M/.test(band)) return 4;
  if (/2[–-]5M/.test(band)) return 3;
  if (/0\.5[–-]2M/.test(band)) return 2;
  return 1;
}
