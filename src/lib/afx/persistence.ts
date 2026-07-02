import type { ProducerProfile, Project, AfxDocument, VettingSubmission, VettingKind, VettingStatus } from './types';

export interface ProducerRow {
  id: string;
  user_id: string;
  /** ProducerProfile minus id, slate, and the isolated entity + individual lanes. */
  profile: Omit<ProducerProfile, 'id' | 'slate' | 'entityDocs' | 'entityVerifiedAt' | 'individualDocs' | 'individualVerifiedAt'>;
  entity_docs: AfxDocument[] | null;
  entity_verified_at: string | null;
  individual_docs: AfxDocument[] | null;
  individual_verified_at: string | null;
}
export interface ProjectRow {
  id: string;
  producer_id: string;
  status: Project['status'];
  deal_ref: string | null;
  /** Project minus the two isolated lanes (exact, docs). */
  body: Omit<Project, 'exact' | 'docs'>;
  exact: Project['exact'] | null;
  docs: AfxDocument[] | null;
}
export interface VettingSubmissionRow {
  id: string;
  producer_id: string;
  kind: VettingKind;
  target_id: string | null;
  status: VettingStatus;
  reviewer_notes: string | null;
  submitted_at: string;
  decided_at: string | null;
  reviewed_by: string | null;
}

function projectFromRow(row: ProjectRow): Project {
  const p: Project = { ...row.body };
  if (row.exact != null) p.exact = row.exact;
  if (row.docs != null) p.docs = row.docs;
  return p;
}

function projectToRow(producerId: string, p: Project): ProjectRow {
  const { exact, docs, ...body } = p;
  return {
    id: p.id, producer_id: producerId, status: p.status,
    deal_ref: p.dealRef ?? null, body, exact: exact ?? null, docs: docs ?? null,
  };
}

export function submissionFromRow(r: VettingSubmissionRow): VettingSubmission {
  const s: VettingSubmission = { id: r.id, kind: r.kind, targetId: r.target_id, status: r.status, submittedAt: r.submitted_at };
  if (r.reviewer_notes != null) s.reviewerNotes = r.reviewer_notes;
  if (r.decided_at != null) s.decidedAt = r.decided_at;
  if (r.reviewed_by != null) s.reviewedBy = r.reviewed_by;
  return s;
}

/** Stitch a producer row + its project rows into the cockpit ProducerProfile. */
export function rowsToProfile(producer: ProducerRow, projects: ProjectRow[]): ProducerProfile {
  const profile: ProducerProfile = { ...producer.profile, id: producer.id, slate: projects.map(projectFromRow) };
  if (producer.entity_docs != null) profile.entityDocs = producer.entity_docs;
  if (producer.entity_verified_at != null) profile.entityVerifiedAt = producer.entity_verified_at;
  if (producer.individual_docs != null) profile.individualDocs = producer.individual_docs;
  if (producer.individual_verified_at != null) profile.individualVerifiedAt = producer.individual_verified_at;
  return profile;
}

/** Split a ProducerProfile into the producer-level blob + isolated entity docs + project rows. */
export function profileToRows(p: ProducerProfile): { profile: ProducerRow['profile']; entityDocs: AfxDocument[] | null; individualDocs: AfxDocument[] | null; projects: ProjectRow[] } {
  const { id: _id, slate, entityDocs, entityVerifiedAt, individualDocs, individualVerifiedAt, ...profile } = p;
  void _id; void entityVerifiedAt; void individualVerifiedAt;
  return { profile, entityDocs: entityDocs ?? null, individualDocs: individualDocs ?? null, projects: (slate ?? []).map((pr) => projectToRow(p.id, pr)) };
}
