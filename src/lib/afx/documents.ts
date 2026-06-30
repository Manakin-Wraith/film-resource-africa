import type { AfxDocument, DocumentCategory } from './types';

export const DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  'budget', 'chain_of_title', 'waterfall', 'financing_agreement',
  'distribution_agreement', 'completion_bond', 'audit', 'other',
] as const;

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  budget: 'Budget / cost report',
  chain_of_title: 'Chain of title',
  waterfall: 'Recoupment waterfall',
  financing_agreement: 'Financing agreement',
  distribution_agreement: 'Distribution / sales agreement',
  completion_bond: 'Completion bond',
  audit: 'Final audit / cost report',
  other: 'Other',
};

/** Proof a case study must carry to be vetting-ready (provable to FRA).
 *  These are the universal legitimacy documents a completed project can
 *  produce; the rest (completion bond, other) are optional supporting
 *  evidence. The S2 submit-for-vetting gate calls `isVettingReady`. */
export const REQUIRED_DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  'budget', 'chain_of_title', 'waterfall',
  'financing_agreement', 'distribution_agreement', 'audit',
] as const;

/** Required categories with no attached document yet, in REQUIRED order. */
export function missingRequiredDocs(docs: readonly AfxDocument[] | undefined): DocumentCategory[] {
  const present = new Set((docs ?? []).map((d) => d.category));
  return REQUIRED_DOCUMENT_CATEGORIES.filter((c) => !present.has(c));
}

/** A case study is vetting-ready iff every required proof category is present. */
export function isVettingReady(docs: readonly AfxDocument[] | undefined): boolean {
  return missingRequiredDocs(docs).length === 0;
}

/** MIME allowlist — authoritative copy; the client mirrors it for pre-flight. */
export const ALLOWED_DOC_TYPES: readonly string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
] as const;

export const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25 MB
