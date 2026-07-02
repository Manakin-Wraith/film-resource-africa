import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { submissionFromRow, rowsToProfile, type VettingSubmissionRow, type ProducerRow, type ProjectRow } from '@/lib/afx/persistence';
import type { AfxDocument, Project, ProducerProfile, VettingSubmission, Provenance } from '@/lib/afx/types';

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

/** Full read-only projection of one submission for the drill-down.
 *  Staff are authorized to see NDA-gated `exact` figures — the drill-down is
 *  gated behind resolveStaff(), so they ride along for verification against proof docs. */
export async function getSubmissionDetail(id: string): Promise<SubmissionDetail | null> {
  if (!(await resolveStaff())) return null;
  const { data: subRow } = await afxAdmin.from('afx_vetting_submissions').select(SUBMISSION_COLS).eq('id', id).maybeSingle<VettingSubmissionRow>();
  if (!subRow) return null;
  const { data: prod } = await afxAdmin.from('afx_producers').select('id, user_id, profile, entity_docs, entity_verified_at, individual_docs, individual_verified_at').eq('id', subRow.producer_id).maybeSingle<ProducerRow>();
  if (!prod) return null;
  const { data: projRows } = await afxAdmin.from('afx_projects').select('id, producer_id, status, deal_ref, body, exact, docs').eq('producer_id', subRow.producer_id);
  const projects = (projRows ?? []) as ProjectRow[];
  const producer = rowsToProfile(prod, projects);
  const project = subRow.target_id ? (producer.slate.find((p) => p.id === subRow.target_id) ?? null) : null;
  return { submission: submissionFromRow(subRow), producer, project };
}

// ---------------------------------------------------------------------------
// Write layer (Task 3)
// ---------------------------------------------------------------------------

export type VerifyField = 'budgetBand' | 'recoupment' | 'bondUsed' | `distribution:${number}`;
type Result = { ok: boolean; error?: string };

/** Claim a submitted item → under_review (keeps the producer edit-locked). */
export async function startReview(id: string): Promise<Result> {
  if (!(await resolveStaff())) return { ok: false, error: 'Not authorized' };
  const { data } = await afxAdmin.from('afx_vetting_submissions')
    .update({ status: 'under_review', updated_at: new Date().toISOString() })
    .eq('id', id).eq('status', 'submitted').select('id');
  if (!data || data.length === 0) return { ok: false, error: 'Only a submitted item can be started' };
  return { ok: true };
}

/** Set a case-study field's provenance. Only while under_review (producer locked). */
async function setFieldProvenance(id: string, field: VerifyField, prov: Provenance): Promise<Result> {
  if (!(await resolveStaff())) return { ok: false, error: 'Not authorized' };
  const { data: sub } = await afxAdmin.from('afx_vetting_submissions')
    .select('kind, target_id, status').eq('id', id)
    .maybeSingle<{ kind: string; target_id: string | null; status: string }>();
  if (!sub) return { ok: false, error: 'Submission not found' };
  if (sub.kind !== 'case_study' || !sub.target_id) return { ok: false, error: 'Not a case study' };
  if (sub.status !== 'under_review') return { ok: false, error: 'Start review before verifying' };
  const { data: proj } = await afxAdmin.from('afx_projects').select('body').eq('id', sub.target_id).maybeSingle<{ body: Record<string, unknown> }>();
  if (!proj) return { ok: false, error: 'Case study not found' };
  const body = proj.body as {
    budgetBand?: { provenance: Provenance };
    outcomes?: { recoupment?: { provenance: Provenance }; bondUsed?: { provenance: Provenance }; distribution?: { provenance: Provenance }[] };
  };
  if (field === 'budgetBand') { if (!body.budgetBand) return { ok: false, error: 'No budget band' }; body.budgetBand.provenance = prov; }
  else if (field === 'recoupment') { if (!body.outcomes?.recoupment) return { ok: false, error: 'No recoupment' }; body.outcomes.recoupment.provenance = prov; }
  else if (field === 'bondUsed') { if (!body.outcomes?.bondUsed) return { ok: false, error: 'No bond' }; body.outcomes.bondUsed.provenance = prov; }
  else {
    const idx = Number(field.split(':')[1]);
    const row = body.outcomes?.distribution?.[idx];
    if (!row) return { ok: false, error: 'No distribution row' };
    row.provenance = prov;
  }
  const { error } = await afxAdmin.from('afx_projects').update({ body, updated_at: new Date().toISOString() }).eq('id', sub.target_id);
  if (error) return { ok: false, error: 'Could not write provenance' };
  return { ok: true };
}
export const verifyField = (id: string, field: VerifyField) => setFieldProvenance(id, field, 'verified');
export const revertField = (id: string, field: VerifyField) => setFieldProvenance(id, field, 'self');

/** Decide a submission. Approve → verified; request_changes → changes_requested (+notes).
 *  Both stamp decided_at + reviewed_by. Entity approve also sets entity_verified_at. */
export async function decide(id: string, decision: 'approve' | 'request_changes', notes?: string): Promise<Result> {
  const staff = await resolveStaff();
  if (!staff) return { ok: false, error: 'Not authorized' };
  const { data: sub } = await afxAdmin.from('afx_vetting_submissions')
    .select('kind, producer_id, status').eq('id', id)
    .maybeSingle<{ kind: string; producer_id: string; status: string }>();
  if (!sub) return { ok: false, error: 'Submission not found' };
  if (sub.status !== 'submitted' && sub.status !== 'under_review') return { ok: false, error: 'Already decided' };
  const now = new Date().toISOString();
  const patch = decision === 'approve'
    ? { status: 'verified', decided_at: now, reviewed_by: staff.userId, updated_at: now }
    : { status: 'changes_requested', reviewer_notes: notes ?? null, decided_at: now, reviewed_by: staff.userId, updated_at: now };
  const { data: updated, error } = await afxAdmin.from('afx_vetting_submissions')
    .update(patch).eq('id', id).in('status', ['submitted', 'under_review']).select('id');
  if (error) return { ok: false, error: 'Could not record decision' };
  if (!updated || updated.length === 0) return { ok: false, error: 'Already decided' };
  if (decision === 'approve' && (sub.kind === 'entity' || sub.kind === 'individual')) {
    const col = sub.kind === 'individual' ? 'individual_verified_at' : 'entity_verified_at';
    const { error: mErr } = await afxAdmin.from('afx_producers').update({ [col]: now, updated_at: now }).eq('id', sub.producer_id);
    if (mErr) return { ok: false, error: 'Decision saved but marker failed' };
  }
  return { ok: true };
}
