import type { Project, ProducerType } from './types';
import { derisking, type DeriskingBreakdown } from './derisking';
import { producerTypeOf } from './constants';

/** One producer's raw input for the staff review surface. `slate` is the
 *  producer's projects (server reconstructs it from afx_projects). */
export interface ReviewProducerInput {
  id: string;
  name: string;
  company: string;
  producerType?: ProducerType;
  individualVerifiedAt?: string;
  entityVerifiedAt?: string;
  slate: Project[];
}

/** Funder-safe projection of one live project — bands + score only, never
 *  exact figures / filenames / amounts. */
export interface ReviewProjectRow {
  id: string;
  title: string;
  stage: string;
  format: string;
  budgetBand: string;
  fundingSecuredBand: string;
  score: number;
  breakdown: DeriskingBreakdown;
}

/** One producer row on the staff review surface. */
export interface ReviewRow {
  producerId: string;
  producerName: string;
  company: string;
  producerType: ProducerType;
  verifiedIndividual: boolean;
  verifiedCompany: boolean;
  liveCount: number;
  bestScore: number;
  bestProjectTitle: string | null;
  projects: ReviewProjectRow[];
}

/** Shape producer inputs into ranked review rows. Pure, no I/O. Only producers
 *  with >=1 live project appear. The de-risking score is internal — safe here
 *  because the consuming route is staff-gated. */
export function toReviewRows(inputs: ReviewProducerInput[]): ReviewRow[] {
  const rows: ReviewRow[] = [];
  for (const input of inputs) {
    const live = input.slate.filter((p) => p.status === 'live');
    if (live.length === 0) continue;

    const projects: ReviewProjectRow[] = live.map((p) => {
      const { total, breakdown } = derisking(p);
      return {
        id: p.id,
        title: p.title,
        stage: p.ask?.stage ?? '',
        format: p.format,
        budgetBand: p.budgetBand.value,
        fundingSecuredBand: p.ask?.fundingSecuredBand ?? '',
        score: total,
        breakdown,
      };
    });
    projects.sort((a, b) => (b.score - a.score) || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));

    const best = projects[0];
    rows.push({
      producerId: input.id,
      producerName: input.name,
      company: input.company,
      producerType: producerTypeOf(input),
      verifiedIndividual: !!input.individualVerifiedAt,
      verifiedCompany: !!input.entityVerifiedAt,
      liveCount: live.length,
      bestScore: best.score,
      bestProjectTitle: best.title,
      projects,
    });
  }

  rows.sort((a, b) =>
    (b.bestScore - a.bestScore) ||
    (b.liveCount - a.liveCount) ||
    (a.producerName < b.producerName ? -1 : a.producerName > b.producerName ? 1 : 0),
  );
  return rows;
}
