/* ============================================================
   AFX shared model — one source of truth for both surfaces:
   the Producer Cockpit (edit) and the Deal Display (read).
   ============================================================ */

export type Provenance = 'self' | 'confirmed' | 'verified';
export type RatingBand = 'A' | 'B' | 'C' | 'D';
export type Confidence = 'Confirmed' | 'Likely' | 'Aspirational';
export type Visibility = 'live' | 'one-away' | 'hidden';
export type SignalStyle = 'ring' | 'band' | 'bar';
export type EntityKind = 'producers' | 'projects' | 'slates';

/** Packaging / incentive line status as shown in the drill-down. */
export type LiveStatus = 'Active' | 'Provisional' | 'Under review' | 'Frozen';
/** Attachment provenance used in the Packaging block. */
export type AttachmentProv = 'signed' | 'soft-hold' | 'wishlist';

export interface IncentiveLine {
  country: string;
  pct: number;
  scheme: string;
  status: LiveStatus;
  as: string; // ISO date
}

export interface Incentive {
  blended: number | null; // null = no scheme on file (missing-data signal)
  valueUSD?: number;
  confidence?: Confidence;
  confNote?: string;
  payout?: string;
  payoutNote?: string;
  qsape?: string;
  asOf?: string;
  lines?: IncentiveLine[];
}

export interface StackSegment {
  label: 'Equity' | 'Soft' | 'Debt' | 'Gap';
  pct: number;
  usd: number;
}

export interface SubScore {
  label: string;
  v: number; // 0–100
}

export interface ProducerConfidenceDetail {
  completed: number;
  raisedUSD: number;
  bond: string;
  distribution: string[];
  subscores: SubScore[];
}

export interface PackagingItem {
  role: string;
  name: string;
  prov: AttachmentProv;
}

export interface MarketComp {
  title: string;
  note: string;
}

export interface MarketDetail {
  path: string;
  tags: string[];
  comps: MarketComp[];
}

export interface RiskDetail {
  execution: number;
  market: number;
  gap: number;
  timing: number;
}

export interface DealDetail {
  incentive: Incentive;
  stack: StackSegment[];
  confidence?: ProducerConfidenceDetail;
  packaging?: PackagingItem[];
  packagingScore?: number;
  market?: MarketDetail;
  risk?: RiskDetail;
}

/**
 * A single screenable entity in the Deal Display — a producer, a project, or a
 * slate. This shape matches the supplied Claude Design mockup so the table /
 * drill-down render almost verbatim.
 */
export interface DealEntity {
  id: string;
  name: string;
  sub: string;
  formatLabel: string;
  commercialPath: string;
  band: RatingBand;
  score: number;
  benchmark: number;
  budgetUSD: number;
  budgetLocal: string;
  fundingPct: number;
  gapUSD: number;
  rebatePct: number | null; // null = not provided (distinct from 0)
  rebateConf: Confidence | null;
  payoutShort: string;
  ratingBand: RatingBand;
  careerStage: string;
  stage: string;
  juris: string[];
  asOf: string;
  stale: boolean;
  tags: { label: string; why: string }[];
  detail: DealDetail;
}

export interface AfxSeed {
  producers: DealEntity[];
  projects: DealEntity[];
  slates: DealEntity[];
}

/* ---------- Producer Cockpit (edit surface) ---------- */

export interface Provenanced<T> {
  value: T;
  provenance: Provenance;
}

export interface Relationship {
  id: string;
  name: string;
  role: string;
  provenance: Provenance;
}

/**
 * The cockpit subject — a working copy is cloned into component state and
 * edited in-session. Its marketplace identity is the matching DealEntity in
 * afxSeed.producers (same id), which keeps the Funder Preview consistent.
 */
export interface ProducerProfile {
  id: string; // === afxSeed.producers[n].id
  name: string;
  company: string;
  bio: string;
  photoUrl?: string;
  location?: string;
  ratingBand: RatingBand;
  careerStage: string;
  relationships: Relationship[];
  slate: Project[];
  ndaSigned: boolean;
  entityK2: boolean; // legal entity gate
  consentK4: boolean; // transparency/reporting consent gate
  /** Producer-level confidential company documents (entity vetting). Isolated:
   *  persisted in afx_producers.entity_docs, never in the profile blob, never funder-visible. */
  entityDocs?: AfxDocument[];
  /** FRA entity-verification marker. Isolated: persisted in afx_producers.entity_verified_at,
   *  NEVER inside the profile blob (a producer's client-authoritative persistProfile must not
   *  be able to forge it) — written only by the staff review action. Presence = verified company. */
  entityVerifiedAt?: string;
}

/* ---------- Unified Project (case study ⇄ live ask) ---------- */

export type ProjectStatus = 'case_study' | 'live' | 'archived';

/** Present when status === 'case_study' — the vetting/outcome layer. */
export interface ProjectOutcomes {
  recoupment: Provenanced<string>;   // Fully recouped / Partial / No / Under NDA
  bondUsed: Provenanced<string>;     // e.g. "Bonded (Film Finances)" / "Not bonded"
  distribution: { name: string; type: string; provenance: Provenance }[];
  festivalsAwards: string[];
}

/** What a piece of evidence substantiates, for the tagged evidence list. */
export type EvidenceClaim = 'budget' | 'recoupment' | 'bond' | 'distribution' | 'festival' | 'other';

export interface EvidenceLink {
  id: string;   // crypto.randomUUID()
  url: string;  // stored as entered
  supports: EvidenceClaim;
}

export type DocumentCategory =
  | 'budget' | 'chain_of_title' | 'waterfall' | 'financing_agreement'
  | 'distribution_agreement' | 'completion_bond' | 'audit' | 'other';

/** Producer/company-level confidential document categories (entity vetting). */
export type EntityDocumentCategory =
  | 'company_registration' | 'director_id' | 'tax_registration'
  | 'bbbee_certificate' | 'good_standing' | 'other';

/** Confidential supporting document. Producer + FRA only — NEVER funder-visible.
 *  Lives in the private `afx-documents` bucket; this is just the metadata,
 *  persisted in an isolated column (`afx_projects.docs` or `afx_producers.entity_docs`). */
export interface AfxDocument {
  id: string;            // crypto.randomUUID()
  path: string;          // storage key: producerId/<caseStudyId|entity>/docId.ext
  filename: string;      // original name, for display
  category: DocumentCategory | EntityDocumentCategory;
  sizeBytes: number;
  contentType: string;
  uploadedAt: string;    // ISO timestamp
}

/* ---------- Vetting submissions (S2 producer side) ---------- */

export type VettingKind = 'case_study' | 'entity';
export type VettingStatus =
  | 'submitted' | 'under_review' | 'verified' | 'changes_requested' | 'withdrawn';

/** A producer's request for FRA to vet a case study or their entity.
 *  `targetId` is the case-study project id, or null for an entity submission.
 *  `reviewerNotes`/`decidedAt` are written by the FRA slice; rendered here. */
export interface VettingSubmission {
  id: string;
  kind: VettingKind;
  targetId: string | null;
  status: VettingStatus;
  reviewerNotes?: string;
  submittedAt: string;
  decidedAt?: string;
  /** auth.users id of the staff member who decided (audit). Written by the FRA review slice. */
  reviewedBy?: string;
}

export interface PackagingAttachment {
  role: string;
  name: string;
  status: 'signed' | 'soft-hold' | 'wishlist';
}

/** Producer-entered capital stack, as percentage bands. */
export interface CapitalStackInput {
  equityPct: number;
  softPct: number;
  debtPct: number;
  gapPct: number;
}

export type Stage = string;
export type Format = string;

/** Present when status === 'live' — the forward-looking ask. */
export interface ProjectAsk {
  logline: string;
  stage: Stage;
  commercialPath: string;
  fundingSecuredBand: string;
  capitalStack: CapitalStackInput;
  packaging: PackagingAttachment[];
  comps?: { title: string; note: string }[];
}

/** Currencies a producer may enter exact figures in. SA-first. */
export type AfxCurrency = 'USD' | 'ZAR';

/** One private exact figure: the amount exactly as entered, in its own
 *  currency. No FX normalisation — stored as typed. */
export interface ExactMoney {
  amount: number;
  currency: AfxCurrency;
}

/** Private exact figures unlocked by the FRA↔producer NDA. Held confidentially:
 *  funders still see only bands. A budget exact raises `budgetBand` provenance
 *  self→confirmed; the live-only figures are private supporting data. */
export interface ExactFigures {
  /** case_study + live — exact total budget. */
  budget?: ExactMoney;
  /** live — exact amount of financing secured to date. */
  fundingSecured?: ExactMoney;
  /** live — exact capital-stack legs, substantiating the % bands. */
  capitalStack?: { equity?: ExactMoney; soft?: ExactMoney; debt?: ExactMoney; gap?: ExactMoney };
}

export interface Project {
  id: string;
  status: ProjectStatus;
  title: string;
  format: Format;
  genre?: string;
  role: string;
  year?: number;
  jurisdiction: string[];
  budgetBand: Provenanced<string>;
  /** NDA-gated exact figures. Private — NEVER serialised to the funder view.
   *  Keys map to the band/financial fields they substantiate. */
  exact?: ExactFigures;
  /** Producer-attached supporting links, each tagged to the claim it backs.
   *  Non-exact (shareable proof) — persisted in body, NOT in the NDA `exact` column. */
  evidence?: EvidenceLink[];
  /** Confidential documents — isolated like `exact`; persisted in the `docs`
   *  column, NEVER in `body`, NEVER serialized to the funder view. */
  docs?: AfxDocument[];
  outcomes?: ProjectOutcomes;   // when status === 'case_study'
  ask?: ProjectAsk;             // when status === 'live'
  /** id of the matching DealEntity in afxSeed.projects for the live deal overlay. */
  dealRef?: string;
}
