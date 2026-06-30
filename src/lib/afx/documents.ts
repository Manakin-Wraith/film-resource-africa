import type { DocumentCategory } from './types';

export const DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  'budget', 'chain_of_title', 'financing_agreement',
  'distribution_agreement', 'completion_bond', 'audit', 'other',
] as const;

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  budget: 'Budget / cost report',
  chain_of_title: 'Chain of title',
  financing_agreement: 'Financing agreement',
  distribution_agreement: 'Distribution / sales agreement',
  completion_bond: 'Completion bond',
  audit: 'Audit',
  other: 'Other',
};

/** MIME allowlist — authoritative copy; the client mirrors it for pre-flight. */
export const ALLOWED_DOC_TYPES: readonly string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
] as const;

export const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25 MB
