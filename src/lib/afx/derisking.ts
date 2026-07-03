import type { Project } from './types';
import { FUNDING_SECURED_BANDS } from './constants';

/** Internal-only. NEVER rendered producer-side. Pure, total (never throws). */
export interface DeriskingBreakdown {
  completeness: number;   // fields filled: stage, logline, genre, commercialPath, real capital plan
  packaging: number;      // signed 2 / soft-hold 1 / wishlist 0, summed
  fundingSecured: number; // FUNDING_SECURED_BANDS ordinal (0–3)
  documents: number;      // count of DISTINCT document categories
  softFunding: number;    // awarded 2 / in_review 1 / applied 0.5 / declined 0, summed
}
export interface DeriskingScore { total: number; breakdown: DeriskingBreakdown; }

const nonEmpty = (s: string | undefined): boolean => !!s && s.trim().length > 0;

export function derisking(p: Project): DeriskingScore {
  const ask = p.ask;

  let completeness = 0;
  if (ask) {
    if (nonEmpty(ask.stage)) completeness += 1;
    if (nonEmpty(ask.logline)) completeness += 1;
    if (nonEmpty(ask.commercialPath)) completeness += 1;
    if (ask.capitalStack.gapPct < 100) completeness += 1;
  }
  if (nonEmpty(p.genre)) completeness += 1;

  let packaging = 0;
  for (const a of ask?.packaging ?? []) {
    packaging += a.status === 'signed' ? 2 : a.status === 'soft-hold' ? 1 : 0;
  }

  const fundingSecured = ask ? Math.max(0, FUNDING_SECURED_BANDS.indexOf(ask.fundingSecuredBand as typeof FUNDING_SECURED_BANDS[number])) : 0;

  const documents = new Set((p.docs ?? []).map((d) => d.category)).size;

  let softFunding = 0;
  for (const s of p.softFunding ?? []) {
    softFunding += s.status === 'awarded' ? 2 : s.status === 'in_review' ? 1 : s.status === 'applied' ? 0.5 : 0;
  }

  const breakdown: DeriskingBreakdown = { completeness, packaging, fundingSecured, documents, softFunding };
  const total = completeness + packaging + fundingSecured + documents + softFunding;
  return { total, breakdown };
}
