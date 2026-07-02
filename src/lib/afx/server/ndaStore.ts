import 'server-only';
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server';
import { NDA_VERSION } from '@/lib/afx/nda';
import type { NdaSignature } from '@/lib/afx/types';

async function resolveProducerId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('afx_producers').select('id').eq('user_id', user.id).single<{ id: string }>();
  return data?.id ?? null;
}

/** Log a 'signed' event (append-only) and return the signature to store on the profile. */
export async function signNda(input: { name: string }): Promise<{ ok: boolean; signature?: NdaSignature; error?: string }> {
  const name = (input.name ?? '').trim();
  if (!name) return { ok: false, error: 'Full name is required' };
  const producerId = await resolveProducerId();
  if (!producerId) return { ok: false, error: 'Not authenticated' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('afx_nda_signatures')
    .insert({ producer_id: producerId, action: 'signed', signer_name: name, doc_version: NDA_VERSION });
  if (error) return { ok: false, error: 'Could not record signature' };
  return { ok: true, signature: { name, signedAt: new Date().toISOString(), version: NDA_VERSION } };
}

/** Log a 'withdrawn' event (append-only). The prior signature record is preserved. */
export async function withdrawNda(input: { lastSignerName?: string }): Promise<{ ok: boolean; error?: string }> {
  const producerId = await resolveProducerId();
  if (!producerId) return { ok: false, error: 'Not authenticated' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('afx_nda_signatures')
    .insert({ producer_id: producerId, action: 'withdrawn', signer_name: (input.lastSignerName ?? '').trim() || 'unknown', doc_version: NDA_VERSION });
  if (error) return { ok: false, error: 'Could not record withdrawal' };
  return { ok: true };
}
