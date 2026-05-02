/**
 * incentive_rules — versioned rate card.
 *
 * Source of truth: a Guide to the dtic Incentive Schemes 2025/26 (PDF, parsed
 * 2026-04-20). Every number in this file must trace back to a page in that
 * guide or the SA Incentive Stack Audit dossier:
 *
 *   PI_Brain/projects/Film-Resource-Africa/research/sa-incentive-stack-audit.md
 *
 * When a rule changes, add a NEW row — never edit in place. The calculator
 * stamps the active rule version into every PDF output so historical runs stay
 * auditable. For v1 this module is the data source; v1.1 migrates it to a
 * versioned Supabase table with the same shape.
 */

import type { DticProgramme, DticProgrammeId } from './types';

export const RATES_VERSION = '2025-26.v1';
export const RATES_VERIFIED_ON = '2026-04-20';

export const DTIC_PROGRAMMES: Record<DticProgrammeId, DticProgramme> = {
  'sa-production': {
    id: 'sa-production',
    label: 'SA Film and TV Production Incentive',
    authority: 'the dtic',
    status: 'restricted',
    statusNote:
      'Rates published, payouts delayed. R473M+ backlog of approved claims unpaid as of Feb 2026.',
    baseRate: 0.35,
    bonus: {
      rate: 0.05,
      condition: '≥30% of HODs are black South African citizens',
      threshold: 30,
      drivenBy: 'blackHodPercent',
    },
    capZAR: 25_000_000,
    minQsapeZAR: 1_500_000,
    minQsapeDocsZAR: 500_000,
    qsapeOverTpeFloor: 0.75,
    minShootPercentInSA: 60,
    minShootDaysInSA: 14,
    waiverThresholdZAR: 50_000_000,
    eligibleFormats: ['feature', 'documentary', 'series', 'animation', 'tv-movie'],
    productionCoBbbeeLevel: 3,
    spcvBbbeeLevel: 4,
    effectiveFrom: '2023-09-01',
    verifiedOn: '2026-04-20',
    source: 'dtic Incentive Schemes Guide 2025/26 · p.69–73',
  },
  'sa-coproduction': {
    id: 'sa-coproduction',
    label: 'SA Film and TV Co-Production',
    authority: 'the dtic',
    status: 'restricted',
    statusNote:
      'Rates published, payouts delayed. Co-productions must be certified by competent authority; advance ruling required.',
    baseRate: 0.35,
    bonus: {
      rate: 0.05,
      condition: '≥20% of HODs are black South African citizens',
      threshold: 20,
      drivenBy: 'blackHodPercent',
    },
    capZAR: 25_000_000,
    minQsapeZAR: 2_500_000,
    minQsapeDocsZAR: 500_000,
    minShootPercentInSA: 50,
    minShootDaysInSA: 14,
    waiverThresholdZAR: 50_000_000,
    eligibleFormats: ['feature', 'documentary', 'series', 'animation', 'tv-movie'],
    productionCoBbbeeLevel: 3,
    spcvBbbeeLevel: 4,
    effectiveFrom: '2023-09-01',
    verifiedOn: '2026-04-20',
    source: 'dtic Incentive Schemes Guide 2025/26 · p.65–67',
  },
  'foreign-production': {
    id: 'foreign-production',
    label: 'Foreign Film and TV Production',
    authority: 'the dtic',
    status: 'paused',
    statusNote:
      'Foreign incentive under administrative freeze since late 2023. Adjudication panel last met March 2024. No approvals issued in FY2024/25 or FY2025/26. Productions migrating to Mauritius, Colombia, Malta, Portugal.',
    baseRate: 0.25,
    bonus: {
      rate: 0.05,
      condition: 'Shooting + post-production in SA via black-owned service company',
      drivenBy: 'blackOwnedServiceCo',
    },
    capZAR: 25_000_000,
    minQsapeZAR: 15_000_000,
    minQsapeDocsZAR: 15_000_000,
    minShootPercentInSA: 50,
    minShootDaysInSA: 21,
    waiverThresholdZAR: 100_000_000,
    eligibleFormats: ['feature', 'documentary', 'series', 'tv-movie'],
    productionCoBbbeeLevel: 3,
    spcvBbbeeLevel: 4,
    effectiveFrom: '2023-09-01',
    verifiedOn: '2026-04-20',
    source: 'dtic Incentive Schemes Guide 2025/26 · p.59–63',
  },
  'emerging-black': {
    id: 'emerging-black',
    label: 'SA Emerging Black Filmmakers Incentive',
    authority: 'the dtic',
    status: 'restricted',
    statusNote:
      'Rates published, payouts subject to the same backlog affecting all DTIC film incentives. Requires ≥75% black-SA-citizen ownership, black director + producer + line producer.',
    baseRate: 0.5,
    capZAR: 25_000_000,
    minQsapeZAR: 500_000,
    minQsapeDocsZAR: 500_000,
    minShootPercentInSA: 80,
    minShootDaysInSA: 14,
    waiverThresholdZAR: 50_000_000,
    eligibleFormats: ['feature', 'documentary', 'series', 'tv-movie'],
    effectiveFrom: '2023-09-01',
    verifiedOn: '2026-04-20',
    source: 'dtic Incentive Schemes Guide 2025/26 · p.55–58',
  },
};

export const PROGRAMME_ORDER: DticProgrammeId[] = [
  'sa-production',
  'sa-coproduction',
  'foreign-production',
  'emerging-black',
];

/**
 * Sub-national and NFVF layers — shipped as placeholders in v1 because tier /
 * cap detail still needs primary-source verification (see dossier §2, §3, §4).
 * Rendered on the landing page as "coming soon + lead capture".
 */
export const NON_DTIC_LAYERS = [
  {
    id: 'nfvf',
    label: 'NFVF — National Film and Video Foundation',
    status: 'live' as const,
    note:
      'Tier 1/2/3 grant system. Verified 2026 Micro-Budget caps: R6M (Tier 1 & 2), R4.5M (Tier 2 & 3). Other-fund ceilings under verification.',
    href: 'https://www.nfvf.co.za/',
  },
  {
    id: 'city-of-cape-town',
    label: 'City of Cape Town Film Fund',
    status: 'cycle-closed' as const,
    note:
      '2025/26 cycle closed 20 June 2025 — five projects awarded. Next call expected April–June 2026.',
    href: 'https://filmcapetown.com/announcements/film-fund-2025/',
  },
  {
    id: 'kzn-tfa',
    label: 'KwaZulu-Natal Tourism and Film Authority',
    status: 'live' as const,
    note:
      'Production grants require ≥70% of production budget spent in KZN (or ≥25% under Commission discretion). Max caps under verification.',
    href: 'https://visitkzn-sa.com/film/funding/',
  },
  {
    id: 'gfc',
    label: 'Gauteng Film Commission',
    status: 'unknown' as const,
    note: 'Production funding category exists; rand caps not public — verification in progress.',
    href: 'https://gautengfilm.org.za/industry-development/funding-categories/',
  },
];
