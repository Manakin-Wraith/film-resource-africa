import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { rowsToProfile, type ProducerRow, type ProjectRow } from '@/lib/afx/persistence';
import { toReviewRows, type ReviewProducerInput, type ReviewRow } from '@/lib/afx/reviewMarketplace';

const PRODUCER_COLS = 'id, user_id, profile, entity_docs, entity_verified_at, individual_docs, individual_verified_at';
// Deliberately omits the NDA-gated `exact` column (never read by derisking and
// stripped before the client) — defense-in-depth: don't pull the highest-
// sensitivity data into this reader at all. `deal_ref` is unused (dealRef lives in body).
const PROJECT_COLS = 'id, producer_id, status, body, docs';

/** Staff review surface: every producer with >=1 live project, ranked by best
 *  de-risking score. Any staff; [] for anyone else. The score is computed on
 *  read (never persisted). Projects live in afx_projects (not the profile blob),
 *  so we stitch each producer's live projects back via rowsToProfile. */
export async function listReviewRows(): Promise<ReviewRow[]> {
  if (!(await resolveStaff())) return [];

  const { data: prodData } = await afxAdmin.from('afx_producers').select(PRODUCER_COLS);
  const producers = (prodData ?? []) as ProducerRow[];
  if (producers.length === 0) return [];

  const { data: projData } = await afxAdmin.from('afx_projects').select(PROJECT_COLS).eq('status', 'live');
  const liveProjectRows = (projData ?? []) as ProjectRow[];

  const byProducer = new Map<string, ProjectRow[]>();
  for (const r of liveProjectRows) {
    const list = byProducer.get(r.producer_id);
    if (list) list.push(r);
    else byProducer.set(r.producer_id, [r]);
  }

  const inputs: ReviewProducerInput[] = producers.map((row) => {
    const profile = rowsToProfile(row, byProducer.get(row.id) ?? []);
    return {
      id: profile.id,
      name: profile.name,
      company: profile.company,
      producerType: profile.producerType,
      individualVerifiedAt: profile.individualVerifiedAt,
      entityVerifiedAt: profile.entityVerifiedAt,
      slate: profile.slate,
    };
  });

  return toReviewRows(inputs);
}
