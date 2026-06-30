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

/** Confidential supporting document attached to a case study. Producer + FRA
 *  only — NEVER funder-visible. The file lives in the private `afx-documents`
 *  bucket; this is just the metadata, persisted in the isolated `docs` column. */
export interface AfxDocument {
  id: string;            // crypto.randomUUID()
  path: string;          // storage key: producerId/caseStudyId/docId.ext
  filename: string;      // original name, for display
  category: DocumentCategory;
  sizeBytes: number;
  contentType: string;
  uploadedAt: string;    // ISO timestamp
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
