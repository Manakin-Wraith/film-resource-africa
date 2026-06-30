import type { ProducerProfile, Project } from './types';

/** A project as a funder may see it — the private `exact` and `docs` lanes are
 *  removed at the type level, so funder-facing code cannot even reference them. */
export type FunderProject = Omit<Project, 'exact' | 'docs'>;

/** The producer profile projected to the funder boundary: identical to
 *  `ProducerProfile` except every slate project is exact-/docs-stripped. */
export type FunderView = Omit<ProducerProfile, 'slate'> & { slate: FunderProject[] };

/** Remove the NDA-gated `exact` figures AND confidential `docs` from a single
 *  project (runtime + type). Shallow by design. */
export function stripExact(pr: Project): FunderProject {
  const clone = { ...pr };
  delete (clone as Partial<Project>).exact;
  delete (clone as Partial<Project>).docs;
  return clone as FunderProject;
}

/** Project a producer's cockpit `draft` into the funder-safe view. Returns a
 *  fresh object; never mutates `p`. This is THE funder boundary — exact figures
 *  and confidential documents do not exist past this function. */
export function toFunderView(p: ProducerProfile): FunderView {
  return { ...p, slate: p.slate.map(stripExact) };
}
