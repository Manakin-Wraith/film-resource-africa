import type { ProducerProfile, Project, AfxDocument } from './types';

/** DB row shapes (subset of columns the mappers read/write). */
export interface ProducerRow {
  id: string;
  user_id: string;
  /** ProducerProfile minus `id` and `slate` — the producer-level fields. */
  profile: Omit<ProducerProfile, 'id' | 'slate'>;
}
export interface ProjectRow {
  id: string;
  producer_id: string;
  status: Project['status'];
  deal_ref: string | null;
  /** Project minus the two isolated lanes (`exact`, `docs`). */
  body: Omit<Project, 'exact' | 'docs'>;
  exact: Project['exact'] | null;
  docs: AfxDocument[] | null;
}

function projectFromRow(row: ProjectRow): Project {
  const p: Project = { ...row.body };
  if (row.exact != null) p.exact = row.exact;
  if (row.docs != null) p.docs = row.docs;
  return p;
}

function projectToRow(producerId: string, p: Project): ProjectRow {
  const { exact, docs, ...body } = p;
  return {
    id: p.id, producer_id: producerId, status: p.status,
    deal_ref: p.dealRef ?? null, body, exact: exact ?? null, docs: docs ?? null,
  };
}

/** Stitch a producer row + its project rows into the cockpit ProducerProfile. */
export function rowsToProfile(producer: ProducerRow, projects: ProjectRow[]): ProducerProfile {
  return { ...producer.profile, id: producer.id, slate: projects.map(projectFromRow) };
}

/** Split a ProducerProfile into the producer-level blob + project rows for upsert. */
export function profileToRows(p: ProducerProfile): { profile: ProducerRow['profile']; projects: ProjectRow[] } {
  const { id: _id, slate, ...profile } = p;
  void _id;
  return { profile, projects: (slate ?? []).map((pr) => projectToRow(p.id, pr)) };
}
