import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { submissionFromRow, rowsToProfile, type VettingSubmissionRow, type ProducerRow, type ProjectRow } from '@/lib/afx/persistence';
import type { AfxDocument, Project, ProducerProfile, VettingSubmission } from '@/lib/afx/types';

const SUBMISSION_COLS = 'id, producer_id, kind, target_id, status, reviewer_notes, submitted_at, decided_at, reviewed_by';

export interface StaffQueueItem {
  submission: VettingSubmission;
  producerId: string;
  producerName: string;
  company: string;
  targetTitle: string | null;  // case-study title, or null for entity
}

export interface SubmissionDetail {
  submission: VettingSubmission;
  producer: ProducerProfile;          // full profile (incl. entityDocs, entityVerifiedAt)
  project: Project | null;            // the case study (with docs), or null for entity
}

const OPEN = ['submitted', 'under_review'];

/** Queue across ALL producers. filter 'open' = submitted+under_review; 'decided' = the rest. */
export async function listSubmissions(filter: 'open' | 'decided'): Promise<StaffQueueItem[]> {
  if (!(await resolveStaff())) return [];
  let q = afxAdmin.from('afx_vetting_submissions').select(SUBMISSION_COLS).order('submitted_at', { ascending: false });
  q = filter === 'open' ? q.in('status', OPEN) : q.not('status', 'in', `(${OPEN.join(',')})`);
  const { data: subs } = await q;
  const rows = (subs ?? []) as VettingSubmissionRow[];
  if (rows.length === 0) return [];
  const producerIds = [...new Set(rows.map((r) => r.producer_id))];
  const targetIds = [...new Set(rows.map((r) => r.target_id).filter((x): x is string => !!x))];
  const { data: producers } = await afxAdmin.from('afx_producers').select('id, profile').in('id', producerIds);
  const { data: projects } = targetIds.length
    ? await afxAdmin.from('afx_projects').select('id, body').in('id', targetIds)
    : { data: [] as { id: string; body: { title?: string } }[] };
  const pMap = new Map((producers ?? []).map((p: { id: string; profile: { name?: string; company?: string } }) => [p.id, p.profile]));
  const tMap = new Map((projects ?? []).map((p: { id: string; body: { title?: string } }) => [p.id, p.body?.title ?? null]));
  return rows.map((r) => ({
    submission: submissionFromRow(r),
    producerId: r.producer_id,
    producerName: pMap.get(r.producer_id)?.name ?? '—',
    company: pMap.get(r.producer_id)?.company ?? '—',
    targetTitle: r.target_id ? (tMap.get(r.target_id) ?? null) : null,
  }));
}

/** Full read-only projection of one submission for the drill-down. */
export async function getSubmissionDetail(id: string): Promise<SubmissionDetail | null> {
  if (!(await resolveStaff())) return null;
  const { data: subRow } = await afxAdmin.from('afx_vetting_submissions').select(SUBMISSION_COLS).eq('id', id).maybeSingle<VettingSubmissionRow>();
  if (!subRow) return null;
  const { data: prod } = await afxAdmin.from('afx_producers').select('id, user_id, profile, entity_docs, entity_verified_at').eq('id', subRow.producer_id).maybeSingle<ProducerRow>();
  if (!prod) return null;
  const { data: projRows } = await afxAdmin.from('afx_projects').select('id, producer_id, status, deal_ref, body, exact, docs').eq('producer_id', subRow.producer_id);
  const projects = (projRows ?? []) as ProjectRow[];
  const producer = rowsToProfile(prod, projects);
  const project = subRow.target_id ? (producer.slate.find((p) => p.id === subRow.target_id) ?? null) : null;
  return { submission: submissionFromRow(subRow), producer, project };
}
