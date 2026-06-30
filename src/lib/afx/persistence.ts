import type { ProducerProfile, Project } from './types';

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
  /** Project minus `exact`. Retains status/dealRef so the type round-trips;
   *  the status/deal_ref columns mirror these for indexing. */
  body: Omit<Project, 'exact'>;
  exact: Project['exact'] | null;
}

/** A fresh, type-valid empty profile (spec §3 defaults). */
export function emptyProducerProfile(id: string): ProducerProfile {
  return {
    id, name: '', company: '', bio: '', careerStage: '',
    ratingBand: 'D', relationships: [], slate: [],
    entityK2: false, consentK4: false, ndaSigned: false,
  };
}

function projectFromRow(row: ProjectRow): Project {
  return row.exact == null ? { ...row.body } : { ...row.body, exact: row.exact };
}

function projectToRow(producerId: string, p: Project): ProjectRow {
  const { exact, ...body } = p;
  return {
    id: p.id, producer_id: producerId, status: p.status,
    deal_ref: p.dealRef ?? null, body, exact: exact ?? null,
  };
}

/** Stitch a producer row + its project rows into the cockpit ProducerProfile. */
export function rowsToProfile(producer: ProducerRow, projects: ProjectRow[]): ProducerProfile {
  return {
    id: producer.id,
    name: producer.profile.name,
    company: producer.profile.company,
    bio: producer.profile.bio,
    careerStage: producer.profile.careerStage,
    ratingBand: producer.profile.ratingBand,
    relationships: producer.profile.relationships,
    slate: projects.map(projectFromRow),
    entityK2: producer.profile.entityK2,
    consentK4: producer.profile.consentK4,
    ndaSigned: producer.profile.ndaSigned,
  };
}

/** Split a ProducerProfile into the producer-level blob + project rows for upsert. */
export function profileToRows(p: ProducerProfile): { profile: ProducerRow['profile']; projects: ProjectRow[] } {
  const { id: _id, slate, ...profile } = p;
  void _id;
  return { profile, projects: (slate ?? []).map((pr) => projectToRow(p.id, pr)) };
}
