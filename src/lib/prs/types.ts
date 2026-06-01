// PRS — Project Readiness Score shared types.
// The Diagnosis shape matches the scoring-prompt output contract (see scoringPrompt.ts)
// and the design prototype's diagnosis-data.jsx.

export type PrsTier = 'early' | 'developing' | 'ready';

export interface SubScore {
  label: string; // Concept · Market · Commercial logic · SA alignment · Execution readiness
  value: number;
  max: number;
}

export interface PathwayScore {
  name: string;
  score: number;
  max: number;
  verdict: string;
}

export interface WorkingPoint {
  free: string;
  member: string;
  evidence: string; // e.g. "Q17, Q20"
}

export interface BlockingPoint {
  free: string;
  member: string;
  fix: string;
}

export interface Move {
  title: string;
  rationale: string;
  deadline: string;
  contact: string;
  program: string;
}

export interface OpportunityMatch {
  program: string;
  org: string;
  deadline: string;
  urgency: 'open' | 'closing';
  bandLabel: string;
  bandColor: 'primary' | 'amber' | 'green';
}

export interface Counterparty {
  name: string;
  role: string;
  region: string;
  fit: string;
  initials: string;
}

export interface FraMove {
  title: string;
  body: string;
}

export interface Diagnosis {
  tier: PrsTier;
  score: number;
  scoreMax: number; // 25
  funderFit: string;
  budgetCoherence: string;
  subScores: SubScore[];
  pathways: PathwayScore[];
  readFree: string;
  readMember: string;
  homeDirection: { free: string };
  working: WorkingPoint[];
  blocking: BlockingPoint[];
  // Member-only sections
  moves: Move[];
  opportunities: OpportunityMatch[];
  counterparties: Counterparty[];
  fraMoves: FraMove[];
}

export type AssessmentStatus = 'pending' | 'scored' | 'failed';

// One row in the `assessments` table.
export interface Assessment {
  id: string;
  token: string;
  email: string;
  member_id: string | null;
  project_title: string;
  format: string | null;
  genre: string | null;
  country: string | null;
  intake_data: Record<string, unknown>;
  status: AssessmentStatus;
  tier: PrsTier | null;
  score: number | null;
  diagnosis: Diagnosis | null;
  visibility: 'private' | 'members' | 'public';
  project_group: string;
  submitted_at: string;
  scored_at: string | null;
  created_at: string;
}

export const TIER_LABELS: Record<PrsTier, string> = {
  early: 'Early Concept',
  developing: 'Developing',
  ready: 'Funding Ready',
};

export const TIER_CLASS: Record<PrsTier, string> = {
  early: 'prs-tier-early',
  developing: 'prs-tier-developing',
  ready: 'prs-tier-ready',
};
