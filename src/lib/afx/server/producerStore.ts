import 'server-only';
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server';
import type { AfxDocument, ProducerProfile, VettingSubmission } from '@/lib/afx/types';
import { rowsToProfile, profileToRows, submissionFromRow, type ProducerRow, type ProjectRow, type VettingSubmissionRow } from '@/lib/afx/persistence';
import { lockedCaseStudyIds, isEntityLocked } from '@/lib/afx/vetting';

/** Activate-or-load. Returns null when the user is authenticated but not invited. */
export async function loadProducerState(): Promise<{ profile: ProducerProfile; submissions: VettingSubmission[] } | null> {
  const supabase = await createSupabaseServerClient();
  // Idempotent: returns existing producer, creates one if invited, or null if not invited.
  const { data: producer, error } = await supabase.rpc('redeem_afx_invite').single<ProducerRow>();
  // Guard against error OR PostgREST surfacing SQL NULL as an all-null-field row (truthy object).
  if (error || !producer || typeof producer.id !== 'string') return null;
  const { data: projects } = await supabase
    .from('afx_projects')
    .select('id, producer_id, status, deal_ref, body, exact, docs')
    .eq('producer_id', producer.id);
  const { data: subs, error: subsErr } = await supabase
    .from('afx_vetting_submissions')
    .select('id, producer_id, kind, target_id, status, reviewer_notes, submitted_at, decided_at')
    .eq('producer_id', producer.id);
  if (subsErr) console.error('[afx-vetting] submissions load failed:', subsErr.message);
  return {
    profile: rowsToProfile(producer, (projects ?? []) as ProjectRow[]),
    submissions: ((subs ?? []) as VettingSubmissionRow[]).map(submissionFromRow),
  };
}

const VETTED_ENTITY_FIELDS = ['name', 'company', 'bio', 'location', 'entityK2'] as const;

/** Full-document upsert of the caller's profile (RLS scopes everything to them). */
export async function persistProfile(profile: ProducerProfile): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error('not authenticated');
  const supabase = await createSupabaseServerClient();

  const { data: producer } = await supabase
    .from('afx_producers').select('id').eq('user_id', user.id).single<{ id: string }>();
  if (!producer) throw new Error('no producer row');

  // Open submissions decide what is locked.
  const { data: openRows } = await supabase
    .from('afx_vetting_submissions').select('kind, target_id, status')
    .eq('producer_id', producer.id).in('status', ['submitted', 'under_review']);
  const subs = (openRows ?? []).map((r) => ({ kind: r.kind, targetId: r.target_id, status: r.status, id: '', submittedAt: '' })) as VettingSubmission[];
  const lockedCases = lockedCaseStudyIds(subs);
  const entityLocked = isEntityLocked(subs);

  const { profile: profileBlob, entityDocs, projects } = profileToRows({ ...profile, id: producer.id });

  // Entity lock: pin the vetted profile subset + entity_docs to their stored values.
  let entityDocsToWrite = entityDocs;
  if (entityLocked) {
    const { data: stored } = await supabase
      .from('afx_producers').select('profile, entity_docs').eq('id', producer.id)
      .single<{ profile: Record<string, unknown>; entity_docs: AfxDocument[] | null }>();
    if (!stored) throw new Error('entity locked but stored profile unavailable');
    for (const f of VETTED_ENTITY_FIELDS) (profileBlob as Record<string, unknown>)[f] = stored.profile?.[f];
    entityDocsToWrite = stored.entity_docs;
  }

  const { error: updateErr } = await supabase.from('afx_producers')
    .update({ profile: profileBlob, entity_docs: entityDocsToWrite, updated_at: new Date().toISOString() })
    .eq('id', producer.id);
  if (updateErr) throw new Error(`producer update failed: ${updateErr.message}`);

  // Case-study lock: never write (or delete) a project with an open submission.
  const writable = projects.filter((p) => !lockedCases.has(p.id));
  if (writable.length > 0) {
    const { error: upsertErr } = await supabase.from('afx_projects').upsert(
      writable.map((p) => ({ ...p, producer_id: producer.id, updated_at: new Date().toISOString() })),
      { onConflict: 'id' },
    );
    if (upsertErr) throw new Error(`projects upsert failed: ${upsertErr.message}`);
  }

  // Keep ids: everything the client still has PLUS every locked case study (don't delete a submitted one).
  const keepIds = Array.from(new Set([...projects.map((p) => p.id), ...lockedCases]));
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (keepIds.some((id) => !UUID_RE.test(id))) throw new Error('invalid project id in slate');
  let del = supabase.from('afx_projects').delete().eq('producer_id', producer.id);
  if (keepIds.length > 0) del = del.not('id', 'in', `(${keepIds.join(',')})`);
  const { error: deleteErr } = await del;
  if (deleteErr) throw new Error(`projects delete failed: ${deleteErr.message}`);
}
