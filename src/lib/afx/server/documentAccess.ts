import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';

export const AFX_DOCS_BUCKET = 'afx-documents';

/** Service-role client — bypasses RLS; used ONLY behind explicit ownership checks. */
export const afxAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export interface DocAccess {
  producerId: string;
  ndaSigned: boolean;
}

/** Resolve the calling session's producer. The producerId comes from the
 *  authenticated session — never from client input — so it is the storage
 *  namespace boundary. Returns null when unauthenticated or not a producer. */
export async function resolveDocAccess(): Promise<DocAccess | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { data: producer } = await afxAdmin
    .from('afx_producers')
    .select('id, profile')
    .eq('user_id', user.id)
    .maybeSingle<{ id: string; profile: { ndaSigned?: boolean } }>();
  if (!producer) return null;
  return { producerId: producer.id, ndaSigned: !!producer.profile?.ndaSigned };
}

/** UUID v4-ish shape (matches crypto.randomUUID output and afx ids). */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A document storage key is owned + well-formed iff it is exactly
 *  `${producerId}/<caseStudyUuid|entity>/<docUuid>.<ext>` with no traversal. */
export function isOwnedDocPath(path: string, producerId: string): boolean {
  if (path.includes('..')) return false;
  // Self-guard: producerId is interpolated into the RegExp below, so it must be a bare UUID (no regex metachars) — keeps the ownership guarantee local.
  if (!UUID_RE.test(producerId)) return false;
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  const re = new RegExp(`^${producerId}/(?:entity|${uuid})/${uuid}\\.[a-z0-9]+$`, 'i');
  return re.test(path);
}

/** True iff the producer has an OPEN (submitted/under_review) submission for the
 *  given target. `targetId` is the case-study id, or null for the entity. */
export async function hasOpenSubmission(producerId: string, kind: 'case_study' | 'entity', targetId: string | null): Promise<boolean> {
  let q = afxAdmin
    .from('afx_vetting_submissions')
    .select('id')
    .eq('producer_id', producerId)
    .eq('kind', kind)
    .in('status', ['submitted', 'under_review'])
    .limit(1);
  q = targetId !== null ? q.eq('target_id', targetId) : q.is('target_id', null);
  const { data } = await q;
  return !!(data && data.length > 0);
}
