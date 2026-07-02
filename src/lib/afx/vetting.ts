import type { VettingSubmission, VettingStatus } from './types';

export const OPEN_VETTING_STATUSES: readonly VettingStatus[] = ['submitted', 'under_review'] as const;
export function isOpenStatus(s: VettingStatus): boolean {
  return (OPEN_VETTING_STATUSES as readonly string[]).includes(s);
}

function latest(subs: readonly VettingSubmission[]): VettingSubmission | undefined {
  // Most recent by submittedAt (ISO strings sort lexically).
  return subs.length ? [...subs].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : a.submittedAt > b.submittedAt ? -1 : 0))[0] : undefined;
}

export function openCaseSubmission(subs: readonly VettingSubmission[] | undefined, caseStudyId: string): VettingSubmission | undefined {
  return (subs ?? []).find((s) => s.kind === 'case_study' && s.targetId === caseStudyId && isOpenStatus(s.status));
}
export function latestCaseSubmission(subs: readonly VettingSubmission[] | undefined, caseStudyId: string): VettingSubmission | undefined {
  return latest((subs ?? []).filter((s) => s.kind === 'case_study' && s.targetId === caseStudyId));
}
export function openEntitySubmission(subs: readonly VettingSubmission[] | undefined): VettingSubmission | undefined {
  return (subs ?? []).find((s) => s.kind === 'entity' && isOpenStatus(s.status));
}
export function latestEntitySubmission(subs: readonly VettingSubmission[] | undefined): VettingSubmission | undefined {
  return latest((subs ?? []).filter((s) => s.kind === 'entity'));
}

export function openIndividualSubmission(subs: readonly VettingSubmission[] | undefined): VettingSubmission | undefined {
  return (subs ?? []).find((s) => s.kind === 'individual' && isOpenStatus(s.status));
}
export function latestIndividualSubmission(subs: readonly VettingSubmission[] | undefined): VettingSubmission | undefined {
  return latest((subs ?? []).filter((s) => s.kind === 'individual'));
}

/** Case-study ids with an OPEN submission → read-only / undeletable. */
export function lockedCaseStudyIds(subs: readonly VettingSubmission[] | undefined): Set<string> {
  const ids = new Set<string>();
  for (const s of subs ?? []) if (s.kind === 'case_study' && s.targetId !== null && isOpenStatus(s.status)) ids.add(s.targetId);
  return ids;
}
export function isEntityLocked(subs: readonly VettingSubmission[] | undefined): boolean {
  return !!openEntitySubmission(subs);
}

export const VETTING_STATUS_META: Record<VettingStatus, { label: string; ink: string; bg: string; border: string }> = {
  submitted:          { label: 'Submitted',        ink: '#1C4E80', bg: '#EAF1FA', border: '#C4D8EF' },
  under_review:       { label: 'Under review',      ink: '#1C4E80', bg: '#EAF1FA', border: '#C4D8EF' },
  verified:           { label: 'Verified',          ink: '#2E7D46', bg: '#F2FBF4', border: '#CDEAD5' },
  changes_requested:  { label: 'Changes requested', ink: '#9A6B1E', bg: '#FDF8EC', border: '#F0DCA8' },
  withdrawn:          { label: 'Withdrawn',          ink: '#6B6D72', bg: '#F2F0EB', border: '#E4E2DC' },
};
