import type { Project, SoftFundingApplication, PackagingAttachment, AfxDocument, DocumentCategory } from './types';

// Document mutations are status-agnostic (operate on Project.docs) — reuse, do not duplicate.
export { addDocument, updateDocument, removeDocument } from './caseStudy';

/** Minimum to persist a live project: a non-empty title AND a stage set. */
export function isLiveProjectSavable(p: Project): boolean {
  return p.title.trim().length > 0 && !!p.ask && p.ask.stage.trim().length > 0;
}

export function addSoftFunding(p: Project): Project {
  const app: SoftFundingApplication = { id: crypto.randomUUID(), body: '', status: 'applied' };
  return { ...p, softFunding: [...(p.softFunding ?? []), app] };
}
export function updateSoftFunding(p: Project, id: string, patch: Partial<Omit<SoftFundingApplication, 'id'>>): Project {
  return { ...p, softFunding: (p.softFunding ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a)) };
}
export function removeSoftFunding(p: Project, id: string): Project {
  return { ...p, softFunding: (p.softFunding ?? []).filter((a) => a.id !== id) };
}

/** Packaging lives on the live `ask`. No-op if there is no ask. */
export function addPackaging(p: Project): Project {
  if (!p.ask) return p;
  const row: PackagingAttachment = { id: crypto.randomUUID(), role: '', name: '', status: 'wishlist' };
  return { ...p, ask: { ...p.ask, packaging: [...p.ask.packaging, row] } };
}
export function updatePackaging(p: Project, index: number, patch: Partial<PackagingAttachment>): Project {
  if (!p.ask) return p;
  return { ...p, ask: { ...p.ask, packaging: p.ask.packaging.map((a, i) => (i === index ? { ...a, ...patch } : a)) } };
}
export function removePackaging(p: Project, index: number): Project {
  if (!p.ask) return p;
  const removed = p.ask.packaging[index];
  const packaging = p.ask.packaging.filter((_, i) => i !== index);
  let next: Project = { ...p, ask: { ...p.ask, packaging } };
  if (removed?.id && p.docs) {
    next = { ...next, docs: p.docs.filter((d) => d.packagingId !== removed.id) };
  }
  return next;
}

/** Assign a stable id to any packaging row lacking one (back-compat for legacy rows).
 *  Returns the same object when nothing needed changing. */
export function backfillPackagingIds(p: Project): Project {
  if (!p.ask) return p;
  let changed = false;
  const packaging = p.ask.packaging.map((a) => {
    if (a.id) return a;
    changed = true;
    return { ...a, id: crypto.randomUUID() };
  });
  return changed ? { ...p, ask: { ...p.ask, packaging } } : p;
}

/** Attach/replace the single doc in a packaging slot (one doc per packagingId+category). */
export function setPackagingDoc(p: Project, packagingId: string, category: DocumentCategory, doc: AfxDocument): Project {
  const others = (p.docs ?? []).filter((d) => !(d.packagingId === packagingId && d.category === category));
  return { ...p, docs: [...others, doc] };
}

/** Remove the doc in a packaging slot (state only; the caller hard-deletes storage). */
export function clearPackagingDoc(p: Project, packagingId: string, category: DocumentCategory): Project {
  return { ...p, docs: (p.docs ?? []).filter((d) => !(d.packagingId === packagingId && d.category === category)) };
}
