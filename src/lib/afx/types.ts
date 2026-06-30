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

export interface FilmographyRow {
  id: string;
  title: string;
  year: number;
  format: string;
  role: string;
  budgetBand: Provenanced<string>;
  recoupmentBand: Provenanced<string>;
}

export interface Relationship {
  id: string;
  name: string;
  role: string;
  provenance: Provenance;
}

export interface ProfileProject {
  id: string; // maps to a DealEntity in afxSeed.projects when present
  title: string;
  format: string;
  stage: string;
  securedPctBand: string;
  prsBand: RatingBand;
  riskFlag?: string;
  provenance: Provenance;
  archived?: boolean;
}

export interface ProducerBands {
  budgetTier: Provenanced<string>;
  amountRaised: Provenanced<string>;
  recoupment: Provenanced<string>;
  completionBond: Provenanced<string>;
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
  ratingBand: RatingBand;
  careerStage: string;
  filmography: FilmographyRow[];
  relationships: Relationship[];
  bands: ProducerBands;
  projects: ProfileProject[];
  entityK2: boolean; // legal entity gate
  consentK4: boolean; // transparency/reporting consent gate
}
