import type { Slate, RiskTier, EvidenceLink } from './types';

/** A blank slate — all Provenanced econ fields 'self', empty membership, no evidence. */
export function newSlate(): Slate {
  return {
    id: crypto.randomUUID(),
    name: '',
    genreStrategy: '',
    stage: 'packaging',
    projectIds: [],
    riskTiers: {},
    totalBudgetBand: { value: '', provenance: 'self' },
    securedBand: '',
    askBand: { value: '', provenance: 'self' },
    targetIRR: { value: '', provenance: 'self' },
    portfolioROI: { value: '', provenance: 'self' },
    distributionStrategy: '',
    evidence: [],
  };
}

/** Minimum to persist a slate: a non-empty name and at least 2 member projects
 *  — a single-project "portfolio" would undermine the feature's own pitch. */
export function isSlateSavable(s: Slate): boolean {
  return s.name.trim().length > 0 && s.projectIds.length >= 2;
}

/** Toggle a project's membership. Adding it defaults its risk tier to 'mid';
 *  removing it drops both the id and its risk-tier entry. */
export function toggleSlateProject(s: Slate, projectId: string): Slate {
  const has = s.projectIds.includes(projectId);
  if (has) {
    const riskTiers = { ...s.riskTiers };
    delete riskTiers[projectId];
    return { ...s, projectIds: s.projectIds.filter((id) => id !== projectId), riskTiers };
  }
  return { ...s, projectIds: [...s.projectIds, projectId], riskTiers: { ...s.riskTiers, [projectId]: 'mid' } };
}

export function setSlateRiskTier(s: Slate, projectId: string, tier: RiskTier): Slate {
  return { ...s, riskTiers: { ...s.riskTiers, [projectId]: tier } };
}

/** Editing any of the four provenanced econ bands always returns it to self-reported. */
export function setSlateBand(s: Slate, field: 'totalBudgetBand' | 'askBand' | 'targetIRR' | 'portfolioROI', value: string): Slate {
  return { ...s, [field]: { value, provenance: 'self' } };
}

/** securedBand carries no provenance — it's a plain controlled-vocabulary string. */
export function setSlateSecuredBand(s: Slate, value: string): Slate {
  return { ...s, securedBand: value };
}

export function addSlateEvidence(s: Slate): Slate {
  const link: EvidenceLink = { id: crypto.randomUUID(), url: '', supports: 'other' };
  return { ...s, evidence: [...(s.evidence ?? []), link] };
}
export function updateSlateEvidence(s: Slate, id: string, patch: Partial<Omit<EvidenceLink, 'id'>>): Slate {
  return { ...s, evidence: (s.evidence ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}
export function removeSlateEvidence(s: Slate, id: string): Slate {
  return { ...s, evidence: (s.evidence ?? []).filter((e) => e.id !== id) };
}
