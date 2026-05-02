/**
 * Rebate calculation engine — pure functions, unit-testable, no side effects.
 *
 * The engine answers three questions in order:
 *   1) Is this project eligible for the selected DTIC programme?
 *   2) If yes, what rebate (base + bonus, capped) does it earn?
 *   3) What's the net exposure after the DTIC layer is applied?
 *
 * Non-DTIC layers (NFVF, City of Cape Town, KZN, Gauteng) are placeholders in
 * v1 — we surface them on the landing page but don't compute against them yet.
 */

import { DTIC_PROGRAMMES } from './rates';
import type {
  CalculatorResult,
  CalculatorTier1Inputs,
  DticProgramme,
  EligibilityFlag,
} from './types';

/**
 * Convert any input currency to ZAR. FX rate is passed in so the calculator
 * can stamp it into the output (SARB mid-rate or a named commercial rate).
 */
export function toZAR(amount: number, currency: 'ZAR' | 'USD', fxZarPerUsd: number): number {
  if (currency === 'ZAR') return amount;
  return amount * fxZarPerUsd;
}

/**
 * Run the eligibility gates for a given programme. Returns a list of flags
 * (ok / warn / block). Any `block` flag means the rebate is zero.
 */
export function evaluateEligibility(
  inputs: CalculatorTier1Inputs,
  programme: DticProgramme,
  qsapeZAR: number,
  totalBudgetZAR: number,
): EligibilityFlag[] {
  const flags: EligibilityFlag[] = [];

  // Format gate
  if (!programme.eligibleFormats.includes(inputs.format)) {
    flags.push({
      severity: 'block',
      code: 'format-ineligible',
      message: `${programme.label} does not support ${inputs.format} productions.`,
    });
  }
  if (inputs.format === 'commercial') {
    flags.push({
      severity: 'block',
      code: 'commercial-ineligible',
      message:
        'Commercial productions are explicitly excluded from every DTIC film incentive programme.',
    });
  }

  // Minimum QSAPE — doc floor used for documentaries
  const minQsape =
    inputs.format === 'documentary' ? programme.minQsapeDocsZAR : programme.minQsapeZAR;
  if (qsapeZAR < minQsape) {
    flags.push({
      severity: 'block',
      code: 'qsape-below-floor',
      message: `QSAPE of R${fmtZAR(qsapeZAR)} is below the R${fmtZAR(minQsape)} floor for ${programme.label}.`,
    });
  }

  // QSAPE / TPE floor
  if (programme.qsapeOverTpeFloor && totalBudgetZAR > 0) {
    const qsapeRatio = qsapeZAR / totalBudgetZAR;
    if (qsapeRatio < programme.qsapeOverTpeFloor) {
      flags.push({
        severity: 'block',
        code: 'qsape-ratio-below',
        message: `QSAPE must be ≥${Math.round(programme.qsapeOverTpeFloor * 100)}% of total budget for ${programme.label} (yours: ${Math.round(qsapeRatio * 100)}%).`,
      });
    }
  }

  // Shoot days — waiverable above the waiver threshold
  const waiverApplies = qsapeZAR >= programme.waiverThresholdZAR;
  if (!waiverApplies && inputs.saShootDays < programme.minShootDaysInSA) {
    flags.push({
      severity: 'block',
      code: 'shoot-days-below',
      message: `${programme.label} requires ≥${programme.minShootDaysInSA} SA shoot days (you have ${inputs.saShootDays}). Waivable if QSAPE ≥R${fmtZAR(programme.waiverThresholdZAR)}.`,
    });
  }

  // B-BBEE eligibility gate (where required)
  if (programme.productionCoBbbeeLevel !== undefined) {
    const level = inputs.bbbeeLevel;
    if (level === 'unsure' || level === 'none') {
      flags.push({
        severity: 'warn',
        code: 'bbbee-unknown',
        message: `${programme.label} requires B-BBEE Level ≤${programme.productionCoBbbeeLevel} for the production company — we can't verify your level. Confirm before applying.`,
      });
    } else if (typeof level === 'number' && level > programme.productionCoBbbeeLevel) {
      flags.push({
        severity: 'block',
        code: 'bbbee-level-insufficient',
        message: `Production company must be B-BBEE Level ≤${programme.productionCoBbbeeLevel} for ${programme.label}. Your level (${level}) is not sufficient.`,
      });
    }
  }

  // Status-level advisory (never blocks, but always surfaces)
  if (programme.status === 'paused') {
    flags.push({
      severity: 'warn',
      code: 'programme-paused',
      message: programme.statusNote,
    });
  } else if (programme.status === 'restricted') {
    flags.push({
      severity: 'warn',
      code: 'programme-restricted',
      message: programme.statusNote,
    });
  }

  return flags;
}

/**
 * Core calculator. Given Tier 1 inputs, returns a fully populated
 * CalculatorResult. Pure function — inputs in, result out, no I/O.
 */
export function calculate(inputs: CalculatorTier1Inputs): CalculatorResult {
  const programme = DTIC_PROGRAMMES[inputs.programmeId];

  const totalBudgetZAR = toZAR(inputs.totalBudget, inputs.currency, inputs.fxRateZarPerUsd);
  const qsapeZAR = totalBudgetZAR * inputs.qsapePercent;

  const flags = evaluateEligibility(inputs, programme, qsapeZAR, totalBudgetZAR);
  const isEligible = !flags.some((f) => f.severity === 'block');

  let dticBaseRebateZAR = 0;
  let dticBonusZAR = 0;

  if (isEligible) {
    dticBaseRebateZAR = qsapeZAR * programme.baseRate;

    // Bonus — only the selected programme's bonus mechanic applies
    if (programme.bonus) {
      const bonus = programme.bonus;
      const qualifies =
        bonus.drivenBy === 'blackHodPercent'
          ? inputs.blackHodPercent >= (bonus.threshold ?? 0)
          : bonus.drivenBy === 'blackOwnedServiceCo'
            ? Boolean(inputs.blackOwnedServiceCo)
            : false;

      if (qualifies) {
        dticBonusZAR = qsapeZAR * bonus.rate;
      }
    }
  }

  const dticRebateGrossZAR = dticBaseRebateZAR + dticBonusZAR;
  const dticRebateZAR = Math.min(dticRebateGrossZAR, programme.capZAR);

  if (isEligible && dticRebateGrossZAR > programme.capZAR) {
    flags.push({
      severity: 'warn',
      code: 'cap-applied',
      message: `Rebate capped at R${fmtZAR(programme.capZAR)} per project. Gross of R${fmtZAR(dticRebateGrossZAR)} has been trimmed.`,
    });
  }

  // v1 only models the DTIC layer; NFVF + sub-national ship as placeholders
  const totalIncentivesZAR = dticRebateZAR;
  const netExposureZAR = Math.max(totalBudgetZAR - totalIncentivesZAR, 0);

  return {
    totalBudgetZAR,
    qsapeZAR,
    dticBaseRebateZAR,
    dticBonusZAR,
    dticRebateGrossZAR,
    dticRebateZAR,
    totalIncentivesZAR,
    netExposureZAR,
    flags,
    programme,
    isEligible,
    generatedAt: new Date().toISOString(),
  };
}

/** Short helper — number with thousands separators, no decimals. */
export function fmtZAR(n: number): string {
  return Math.round(n).toLocaleString('en-ZA');
}

/** Pretty currency display — R 12 345 678 style. */
export function formatRand(n: number): string {
  return `R\u00A0${fmtZAR(n)}`;
}
