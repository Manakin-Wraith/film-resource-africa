import 'server-only';
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server';
import type { ProducerProfile, VettingSubmission } from '@/lib/afx/types';
import { rowsToProfile, profileToRows, submissionFromRow, type ProducerRow, type ProjectRow, type VettingSubmissionRow } from '@/lib/afx/persistence';

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
  const { data: subs } = await supabase
    .from('afx_vetting_submissions')
    .select('id, producer_id, kind, target_id, status, reviewer_notes, submitted_at, decided_at')
    .eq('producer_id', producer.id);
  return {
    profile: rowsToProfile(producer, (projects ?? []) as ProjectRow[]),
    submissions: ((subs ?? []) as VettingSubmissionRow[]).map(submissionFromRow),
  };
}

/** Full-document upsert of the caller's profile (RLS scopes everything to them). */
export async function persistProfile(profile: ProducerProfile): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error('not authenticated');
  const supabase = await createSupabaseServerClient();

  const { data: producer } = await supabase
    .from('afx_producers').select('id').eq('user_id', user.id).single<{ id: string }>();
  if (!producer) throw new Error('no producer row'); // must be activated first

  const { profile: profileBlob, projects } = profileToRows({ ...profile, id: producer.id });

  const { error: updateErr } = await supabase.from('afx_producers')
    .update({ profile: profileBlob, updated_at: new Date().toISOString() })
    .eq('id', producer.id);
  if (updateErr) throw new Error(`producer update failed: ${updateErr.message}`);

  if (projects.length > 0) {
    const { error: upsertErr } = await supabase.from('afx_projects').upsert(
      projects.map((p) => ({ ...p, producer_id: producer.id, updated_at: new Date().toISOString() })),
      { onConflict: 'id' },
    );
    if (upsertErr) throw new Error(`projects upsert failed: ${upsertErr.message}`);
  }
  // delete rows the producer removed this session
  const keepIds = projects.map((p) => p.id);
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (keepIds.some((id) => !UUID_RE.test(id))) throw new Error('invalid project id in slate');
  let del = supabase.from('afx_projects').delete().eq('producer_id', producer.id);
  if (keepIds.length > 0) del = del.not('id', 'in', `(${keepIds.join(',')})`);
  const { error: deleteErr } = await del;
  if (deleteErr) throw new Error(`projects delete failed: ${deleteErr.message}`);
}
