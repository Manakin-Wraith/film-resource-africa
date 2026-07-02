import 'server-only';
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server';
import { isVettingReady, isEntityVettingReady, isIndividualVettingReady } from '@/lib/afx/documents';
import { submissionFromRow, type VettingSubmissionRow } from '@/lib/afx/persistence';
import type { AfxDocument, VettingKind, VettingSubmission } from '@/lib/afx/types';

export type SubmitResult = { ok: true; submission: VettingSubmission } | { ok: false; error: string };

async function resolveProducerId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('afx_producers').select('id').eq('user_id', user.id).single<{ id: string }>();
  return data?.id ?? null;
}

export async function submitForVetting(input: { kind: VettingKind; targetId?: string }): Promise<SubmitResult> {
  const producerId = await resolveProducerId();
  if (!producerId) return { ok: false, error: 'Not authenticated' };
  const supabase = await createSupabaseServerClient();

  // Re-check the gate server-side.
  if (input.kind === 'case_study') {
    if (!input.targetId) return { ok: false, error: 'Missing case study' };
    const { data: proj } = await supabase
      .from('afx_projects').select('id, docs').eq('id', input.targetId).eq('producer_id', producerId)
      .single<{ id: string; docs: AfxDocument[] | null }>();
    if (!proj) return { ok: false, error: 'Case study not found' };
    if (!isVettingReady(proj.docs ?? undefined)) return { ok: false, error: 'Required proof documents are missing' };
  } else if (input.kind === 'entity') {
    const { data: prod } = await supabase
      .from('afx_producers').select('profile, entity_docs').eq('id', producerId)
      .single<{ profile: { entityK2?: boolean }; entity_docs: AfxDocument[] | null }>();
    if (!prod) return { ok: false, error: 'Producer not found' };
    if (!isEntityVettingReady({ entityK2: !!prod.profile?.entityK2, entityDocs: prod.entity_docs ?? undefined })) {
      return { ok: false, error: 'Entity is not vetting-ready (K2 + required company documents)' };
    }
  } else {
    const { data: prod } = await supabase
      .from('afx_producers').select('profile, individual_docs').eq('id', producerId)
      .single<{ profile: { entityK2?: boolean }; individual_docs: AfxDocument[] | null }>();
    if (!prod) return { ok: false, error: 'Producer not found' };
    if (!isIndividualVettingReady({ entityK2: !!prod.profile?.entityK2, individualDocs: prod.individual_docs ?? undefined })) {
      return { ok: false, error: 'Not vetting-ready (professional standing gate + a CV)' };
    }
  }

  const { data, error } = await supabase
    .from('afx_vetting_submissions')
    .insert({ producer_id: producerId, kind: input.kind, target_id: input.kind === 'case_study' ? input.targetId : null, status: 'submitted' })
    .select('id, producer_id, kind, target_id, status, reviewer_notes, submitted_at, decided_at')
    .single<VettingSubmissionRow>();
  if (error) {
    // 23505 = unique_violation → an open submission already exists.
    if ((error as { code?: string }).code === '23505') return { ok: false, error: 'Already submitted for vetting' };
    return { ok: false, error: 'Could not submit for vetting' };
  }
  if (!data) return { ok: false, error: 'Could not retrieve submission after insert' };
  return { ok: true, submission: submissionFromRow(data) };
}

export async function withdrawVetting(input: { submissionId: string }): Promise<{ ok: boolean; error?: string }> {
  const producerId = await resolveProducerId();
  if (!producerId) return { ok: false, error: 'Not authenticated' };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('afx_vetting_submissions')
    .update({ status: 'withdrawn', decided_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', input.submissionId).eq('producer_id', producerId).in('status', ['submitted', 'under_review'])
    .select('id');
  if (error) return { ok: false, error: 'Could not withdraw' };
  if (!data || data.length === 0) return { ok: false, error: 'No open submission to withdraw' };
  return { ok: true };
}
