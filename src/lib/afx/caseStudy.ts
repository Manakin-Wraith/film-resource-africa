import type { Project, EvidenceLink, ExactMoney, ExactFigures } from './types';

/** A blank case study — all Provenanced fields 'self', empty outcomes/evidence, no exact. */
export function newCaseStudy(): Project {
  return {
    id: crypto.randomUUID(),
    status: 'case_study',
    title: '',
    format: 'Feature',
    role: 'Producer',
    jurisdiction: [],
    budgetBand: { value: '', provenance: 'self' },
    outcomes: {
      recoupment: { value: '', provenance: 'self' },
      bondUsed: { value: '', provenance: 'self' },
      distribution: [],
      festivalsAwards: [],
    },
    evidence: [],
  };
}

/** Minimum to persist a case study: a non-empty title. */
export function isCaseStudySavable(s: Project): boolean {
  return s.title.trim().length > 0;
}

export function toggleJurisdiction(s: Project, code: string): Project {
  const has = s.jurisdiction.includes(code);
  return { ...s, jurisdiction: has ? s.jurisdiction.filter((j) => j !== code) : [...s.jurisdiction, code] };
}

/** Editing a band/outcome value always returns it to self-reported. */
export function setBudgetBand(s: Project, value: string): Project {
  return { ...s, budgetBand: { value, provenance: 'self' } };
}

export function setOutcome(s: Project, field: 'recoupment' | 'bondUsed', value: string): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, [field]: { value, provenance: 'self' } } };
}

/** Set/clear the NDA exact budget; mirrors the live path's band-provenance bump. */
export function setExactBudget(s: Project, value: ExactMoney | undefined): Project {
  const exact: ExactFigures = { ...s.exact };
  if (value === undefined) delete exact.budget;
  else exact.budget = value;

  let budgetBand = s.budgetBand;
  if (value !== undefined && s.budgetBand.provenance === 'self') budgetBand = { ...s.budgetBand, provenance: 'confirmed' };
  if (value === undefined && s.budgetBand.provenance === 'confirmed') budgetBand = { ...s.budgetBand, provenance: 'self' };

  const cleaned: ExactFigures = {};
  if (exact.budget !== undefined) cleaned.budget = exact.budget;
  if (exact.fundingSecured !== undefined) cleaned.fundingSecured = exact.fundingSecured;
  if (exact.capitalStack) cleaned.capitalStack = exact.capitalStack;

  return { ...s, budgetBand, exact: Object.keys(cleaned).length ? cleaned : undefined };
}

export function addDistribution(s: Project): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, distribution: [...s.outcomes.distribution, { name: '', type: 'Theatrical', provenance: 'self' }] } };
}
export function updateDistribution(s: Project, index: number, patch: Partial<{ name: string; type: string }>): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, distribution: s.outcomes.distribution.map((d, i) => (i === index ? { ...d, ...patch, provenance: 'self' as const } : d)) } };
}
export function removeDistribution(s: Project, index: number): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, distribution: s.outcomes.distribution.filter((_, i) => i !== index) } };
}

export function addFestival(s: Project): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, festivalsAwards: [...s.outcomes.festivalsAwards, ''] } };
}
export function updateFestival(s: Project, index: number, value: string): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, festivalsAwards: s.outcomes.festivalsAwards.map((f, i) => (i === index ? value : f)) } };
}
export function removeFestival(s: Project, index: number): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, festivalsAwards: s.outcomes.festivalsAwards.filter((_, i) => i !== index) } };
}

export function addEvidence(s: Project): Project {
  const link: EvidenceLink = { id: crypto.randomUUID(), url: '', supports: 'other' };
  return { ...s, evidence: [...(s.evidence ?? []), link] };
}
export function updateEvidence(s: Project, id: string, patch: Partial<Omit<EvidenceLink, 'id'>>): Project {
  return { ...s, evidence: (s.evidence ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}
export function removeEvidence(s: Project, id: string): Project {
  return { ...s, evidence: (s.evidence ?? []).filter((e) => e.id !== id) };
}
