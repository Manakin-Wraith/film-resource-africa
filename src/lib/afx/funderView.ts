import type { ProducerProfile, Project } from './types';

export type FunderProject = Omit<Project, 'exact' | 'docs'>;

/** Funder view: slate exact-/docs-stripped AND the producer-level `entityDocs`
 *  lane removed at the type level. */
export type FunderView = Omit<ProducerProfile, 'slate' | 'entityDocs'> & { slate: FunderProject[] };

/** Remove the NDA-gated exact figures AND confidential docs from a single project (runtime + type). Shallow by design. */
export function stripExact(pr: Project): FunderProject {
  const clone = { ...pr };
  delete (clone as Partial<Project>).exact;
  delete (clone as Partial<Project>).docs;
  return clone as FunderProject;
}

/** Project a producer's cockpit profile into the funder-safe view. THE funder boundary — NDA-gated exact figures, confidential case-study docs, and confidential entity_docs do not exist past this function. Returns a fresh object; never mutates p. */
export function toFunderView(p: ProducerProfile): FunderView {
  const { entityDocs: _entityDocs, ...rest } = p;
  void _entityDocs;
  return { ...rest, slate: p.slate.map(stripExact) };
}
