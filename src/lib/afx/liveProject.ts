import type { Project, SoftFundingApplication, PackagingAttachment } from './types';

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
  const row: PackagingAttachment = { role: '', name: '', status: 'wishlist' };
  return { ...p, ask: { ...p.ask, packaging: [...p.ask.packaging, row] } };
}
export function updatePackaging(p: Project, index: number, patch: Partial<PackagingAttachment>): Project {
  if (!p.ask) return p;
  return { ...p, ask: { ...p.ask, packaging: p.ask.packaging.map((a, i) => (i === index ? { ...a, ...patch } : a)) } };
}
export function removePackaging(p: Project, index: number): Project {
  if (!p.ask) return p;
  return { ...p, ask: { ...p.ask, packaging: p.ask.packaging.filter((_, i) => i !== index) } };
}
