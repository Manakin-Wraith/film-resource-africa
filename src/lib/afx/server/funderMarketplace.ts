import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { rowsToProfile, type ProducerRow, type ProjectRow } from '@/lib/afx/persistence';
import { toFunderMarketRows, type FunderMarketRow } from '@/lib/afx/funderMarketplace';

const PRODUCER_COLS = 'id, user_id, profile, entity_docs, entity_verified_at, individual_docs, individual_verified_at';
// Omits the NDA-gated `exact` column — derisking/visibility never read it, and it
// is stripped before the client regardless (defense-in-depth).
const PROJECT_COLS = 'id, producer_id, status, body, docs';

/** Funder marketplace: every funder-visible producer (live/one-away) with their
 *  screenable projects, ordered by hidden de-risking. Staff-gated for now; [] for
 *  anyone else. Projects live in afx_projects (not the profile blob), so we stitch
 *  each producer's live projects back via rowsToProfile. */
export async function listFunderMarketRows(): Promise<FunderMarketRow[]> {
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

  const profiles = producers.map((row) => rowsToProfile(row, byProducer.get(row.id) ?? []));
  return toFunderMarketRows(profiles);
}
