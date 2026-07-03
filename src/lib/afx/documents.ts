import type { AfxDocument, DocumentCategory, EntityDocumentCategory, IndividualDocumentCategory } from './types';

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
  talent_deal: 'Talent / packaging deal',
  script: 'Script / treatment',
  deck: 'Deck / lookbook',
  soft_funding_letter: 'Soft-funding award letter',
  sales_estimate: 'Sales estimate',
  talent_cv: 'CV',
  talent_contract: 'Contract',
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

/** Live-project (forward-looking) document categories. A SEPARATE list from
 *  DOCUMENT_CATEGORIES so the case-study dropdown + required-docs logic are
 *  unchanged. The upload route accepts the union of both for the case_study scope. */
export const LIVE_DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  'budget', 'financing_agreement', 'talent_deal', 'script', 'deck',
  'chain_of_title', 'soft_funding_letter', 'sales_estimate', 'other',
] as const;

export const LIVE_DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  budget: 'Budget / cost report',
  chain_of_title: 'Chain of title',
  waterfall: 'Recoupment waterfall',
  financing_agreement: 'Financing agreement / LOI',
  distribution_agreement: 'Distribution / sales agreement',
  completion_bond: 'Completion bond',
  audit: 'Final audit / cost report',
  talent_deal: 'Talent / packaging deal',
  script: 'Script / treatment',
  deck: 'Deck / lookbook',
  soft_funding_letter: 'Soft-funding award letter',
  sales_estimate: 'Sales estimate',
  other: 'Other',
  talent_cv: 'CV',
  talent_contract: 'Contract',
};

/** Per-attachment packaging document categories (CV + Contract). Kept SEPARATE from
 *  LIVE_DOCUMENT_CATEGORIES so they never appear in the project-level uploader dropdown;
 *  the upload route accepts them for the case_study scope (see upload/route.ts). */
export const PACKAGING_DOC_CATEGORIES: readonly DocumentCategory[] = ['talent_cv', 'talent_contract'] as const;

/** MIME allowlist — authoritative copy; the client mirrors it for pre-flight. */
export const ALLOWED_DOC_TYPES: readonly string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
] as const;

export const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25 MB

export const ENTITY_DOCUMENT_CATEGORIES: readonly EntityDocumentCategory[] = [
  'company_registration', 'director_id', 'tax_registration',
  'bbbee_certificate', 'good_standing', 'other',
] as const;

export const ENTITY_DOCUMENT_CATEGORY_LABELS: Record<EntityDocumentCategory, string> = {
  company_registration: 'Company registration / incorporation',
  director_id: 'Director ID',
  tax_registration: 'Tax / VAT registration',
  bbbee_certificate: 'B-BBEE certificate',
  good_standing: 'Letter of good standing',
  other: 'Other',
};

/** Proof an entity must carry to be vetting-ready. company_registration,
 *  director_id, tax_registration are required; bbbee_certificate + good_standing
 *  are optional supporting evidence. */
export const REQUIRED_ENTITY_DOCUMENT_CATEGORIES: readonly EntityDocumentCategory[] = [
  'company_registration', 'director_id', 'tax_registration',
] as const;

export function missingRequiredEntityDocs(docs: readonly AfxDocument[] | undefined): EntityDocumentCategory[] {
  const present = new Set((docs ?? []).map((d) => d.category));
  return REQUIRED_ENTITY_DOCUMENT_CATEGORIES.filter((c) => !present.has(c));
}

/** An entity is vetting-ready iff K2 (legal entity) is attested AND every
 *  required company document is present. */
export function isEntityVettingReady(p: { entityK2: boolean; entityDocs?: readonly AfxDocument[] }): boolean {
  return p.entityK2 === true && missingRequiredEntityDocs(p.entityDocs).length === 0;
}

export const INDIVIDUAL_DOCUMENT_CATEGORIES: readonly IndividualDocumentCategory[] = ['cv', 'other'] as const;

export const INDIVIDUAL_DOCUMENT_CATEGORY_LABELS: Record<IndividualDocumentCategory, string> = {
  cv: 'CV / résumé',
  other: 'Other',
};

/** A CV is the one required individual proof; 'other' docs are optional supporting evidence. */
export const REQUIRED_INDIVIDUAL_DOCUMENT_CATEGORIES: readonly IndividualDocumentCategory[] = ['cv'] as const;

export function missingRequiredIndividualDocs(docs: readonly AfxDocument[] | undefined): IndividualDocumentCategory[] {
  const present = new Set((docs ?? []).map((d) => d.category));
  return REQUIRED_INDIVIDUAL_DOCUMENT_CATEGORIES.filter((c) => !present.has(c));
}

/** An individual is vetting-ready iff the standing gate (K2, reused) is attested AND a CV is present. */
export function isIndividualVettingReady(p: { entityK2: boolean; individualDocs?: readonly AfxDocument[] }): boolean {
  return p.entityK2 === true && missingRequiredIndividualDocs(p.individualDocs).length === 0;
}
