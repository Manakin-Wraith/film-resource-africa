import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { toNdaEntries, type RawNdaSignature, type NdaProducerEntry, type NdaProducerInput } from '@/lib/afx/ndaLog';

/** The NDA signature log for the staff view. Any staff; [] for anyone else. */
export async function listNdaSignatures(): Promise<NdaProducerEntry[]> {
  if (!(await resolveStaff())) return [];
  const { data: sigs } = await afxAdmin
    .from('afx_nda_signatures')
    .select('id, producer_id, action, signer_name, doc_version, created_at');
  const { data: producers } = await afxAdmin.from('afx_producers').select('id, profile');
  const producerInputs: NdaProducerInput[] = ((producers ?? []) as { id: string; profile: { name?: string; company?: string; ndaSigned?: boolean } }[])
    .map((p) => ({ id: p.id, name: p.profile?.name ?? '—', company: p.profile?.company ?? '', ndaSigned: !!p.profile?.ndaSigned }));
  return toNdaEntries((sigs ?? []) as RawNdaSignature[], producerInputs);
}
