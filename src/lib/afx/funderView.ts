import type { ProducerProfile, Project } from './types';

export type FunderProject = Omit<Project, 'exact' | 'docs'>;

/** Funder view: slate exact-/docs-stripped AND the producer-level `entityDocs`
 *  lane removed at the type level. */
export type FunderView = Omit<ProducerProfile, 'slate' | 'entityDocs'> & { slate: FunderProject[] };

export function stripExact(pr: Project): FunderProject {
  const clone = { ...pr };
  delete (clone as Partial<Project>).exact;
  delete (clone as Partial<Project>).docs;
  return clone as FunderProject;
}

export function toFunderView(p: ProducerProfile): FunderView {
  const { entityDocs: _entityDocs, ...rest } = p;
  void _entityDocs;
  return { ...rest, slate: p.slate.map(stripExact) };
}
