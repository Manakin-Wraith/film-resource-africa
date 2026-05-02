/**
 * Rebate & Net Exposure Calculator — Type definitions
 *
 * Every field here corresponds to a row in the verification dossier:
 *   PI_Brain/projects/Film-Resource-Africa/research/sa-incentive-stack-audit.md
 */

export type ProductionFormat =
  | 'feature'
  | 'documentary'
  | 'series'
  | 'animation'
  | 'commercial'
  | 'tv-movie';

/** DTIC Film and TV Production Incentive programmes (2025/26 Guide). */
export type DticProgrammeId =
  | 'sa-production'
  | 'sa-coproduction'
  | 'foreign-production'
  | 'emerging-black';

/**
 * Live payout status for a programme, rendered as a coloured pill on the
 * Result Card and disclosed in the PDF.
 *
 * live            — programme is approving and paying on schedule
 * restricted      — rates are still published but payouts are delayed /
 *                   backlogged (use for current SA Production/Co-Pro/Black)
 * paused          — no approvals issuing at all (current Foreign status)
 * cycle-closed    — scheme exists but next application window hasn't opened
 * unknown         — authority exists but we haven't verified live status yet
 */
export type ProgrammeStatus =
  | 'live'
  | 'restricted'
  | 'paused'
  | 'cycle-closed'
  | 'unknown';

export type BbbeeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'none' | 'unsure';

export type Currency = 'ZAR' | 'USD';

export interface DticProgramme {
  id: DticProgrammeId;
  label: string;
  authority: 'the dtic';
  status: ProgrammeStatus;
  statusNote: string;
  /** Base rebate rate applied to QSAPE, e.g. 0.35 for 35%. */
  baseRate: number;
  /** Optional HOD-hiring or service-co bonus on top of the base rate. */
  bonus?: {
    rate: number;
    condition: string;
    /** Threshold (%) that must be met for the bonus to apply. */
    threshold?: number;
    /** Which field in Tier 1 inputs drives this (for the form). */
    drivenBy: 'blackHodPercent' | 'blackOwnedServiceCo';
  };
  /** Hard rand cap on the reimbursable grant. */
  capZAR: number;
  /** Minimum QSAPE (ZAR) for non-doc formats. */
  minQsapeZAR: number;
  /** Minimum QSAPE (ZAR) for documentaries. */
  minQsapeDocsZAR: number;
  /** QSAPE / Total Production Expenditure floor, if applicable. */
  qsapeOverTpeFloor?: number;
  /** Minimum % of principal photography in SA. */
  minShootPercentInSA: number;
  /** Minimum shoot days in SA. */
  minShootDaysInSA: number;
  /** Threshold above which the shoot-% and days floors can be waived. */
  waiverThresholdZAR: number;
  /** Accepted production formats. */
  eligibleFormats: ProductionFormat[];
  /** Production company B-BBEE level required (lower number = better). */
  productionCoBbbeeLevel?: number;
  /** SPCV B-BBEE level required (lower number = better). */
  spcvBbbeeLevel?: number;
  /** Effective-from date for this rule version. */
  effectiveFrom: string;
  /** ISO date this row was last verified against primary source. */
  verifiedOn: string;
  /** Primary-source URL or document reference. */
  source: string;
}

export interface CalculatorTier1Inputs {
  totalBudget: number;
  currency: Currency;
  /** QSAPE as a fraction of total budget, e.g. 0.7 for 70%. */
  qsapePercent: number;
  saShootDays: number;
  format: ProductionFormat;
  programmeId: DticProgrammeId;
  bbbeeLevel: BbbeeLevel;
  /** % of HODs who are black SA citizens, e.g. 30 for 30%. Drives +5% bonus. */
  blackHodPercent: number;
  /** Foreign programme only — shooting + post in SA via black-owned service co. */
  blackOwnedServiceCo?: boolean;
  /** FX rate (ZAR per 1 USD) stamped into the calculation. */
  fxRateZarPerUsd: number;
}

export interface EligibilityFlag {
  severity: 'ok' | 'warn' | 'block';
  code: string;
  message: string;
}

export interface CalculatorResult {
  /** ZAR — always normalised to rand regardless of input currency. */
  totalBudgetZAR: number;
  qsapeZAR: number;
  /** DTIC base rebate portion in ZAR (before bonus). */
  dticBaseRebateZAR: number;
  /** DTIC bonus portion in ZAR (0 if not earned). */
  dticBonusZAR: number;
  /** Combined DTIC rebate in ZAR (pre-cap). */
  dticRebateGrossZAR: number;
  /** DTIC rebate in ZAR after the cap is applied. */
  dticRebateZAR: number;
  /** Total of all incentive layers (DTIC + placeholders for NFVF + sub-national). */
  totalIncentivesZAR: number;
  /** Net exposure — money the producer still needs to find. */
  netExposureZAR: number;
  /** Eligibility flags to render as pills. */
  flags: EligibilityFlag[];
  /** Which programme rules applied. */
  programme: DticProgramme;
  /** Whether eligibility gates all passed (otherwise rebate = 0). */
  isEligible: boolean;
  /** Timestamp the result was generated. */
  generatedAt: string;
}
