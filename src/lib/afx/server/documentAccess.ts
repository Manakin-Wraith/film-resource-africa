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
