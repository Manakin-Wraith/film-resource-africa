import type { ProducerProfile, Project } from './types';

/** A project as a funder may see it — the private `exact` bag is removed at the
 *  type level, so funder-facing code cannot even reference it. */
export type FunderProject = Omit<Project, 'exact'>;

/** The producer profile projected to the funder boundary: identical to
 *  `ProducerProfile` except every slate project is exact-stripped. */
export type FunderView = Omit<ProducerProfile, 'slate'> & { slate: FunderProject[] };

/** Remove the NDA-gated `exact` figures from a single project (runtime + type).
 *  Shallow by design: nested `budgetBand`/`ask`/`outcomes` are shared by
 *  reference — safe because `exact` is dropped wholesale and the funder view
 *  only reads the rest. Do NOT assume this is a deep defensive copy. */
export function stripExact(pr: Project): FunderProject {
  const clone: FunderProject = { ...pr };
  // `exact` is optional; delete the runtime key so it can never serialise to a funder.
  delete (clone as Partial<Project>).exact;
  return clone;
}

/** Project a producer's cockpit `draft` into the funder-safe view. Returns a
 *  fresh object; never mutates `p`. This is THE funder boundary — exact figures
 *  do not exist past this function. */
export function toFunderView(p: ProducerProfile): FunderView {
  return { ...p, slate: p.slate.map(stripExact) };
}
