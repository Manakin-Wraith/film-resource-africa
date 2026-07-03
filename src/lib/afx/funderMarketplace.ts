import type { ProducerProfile, Project, RatingBand, PackagingAttachment } from './types';
import { deriveVisibility, meetsCorePackaging } from './constants';
import { liveProjects } from './aggregates';
import { derisking } from './derisking';

/** Funder-safe projection of one screenable live project — bands + packaging only.
 *  NEVER the de-risking score, exact figures, docs, or soft-funding. */
export interface FunderMarketProjectRow {
  id: string;
  title: string;
  stage: string;
  format: string;
  budgetBand: string;
  fundingSecuredBand: string;
  commercialPath: string;
  packaging: PackagingAttachment[];
}

/** One producer row on the funder marketplace. Carries no score field —
 *  the de-risking score orders rows server-side and is dropped here. */
export interface FunderMarketRow {
  producerId: string;
  producerName: string;
  company: string;
  ratingBand: RatingBand;
  careerStage: string;
  visibility: 'live' | 'one-away';
  screenableCount: number;
  projects: FunderMarketProjectRow[];
}

const VIS_RANK: Record<'live' | 'one-away', number> = { live: 0, 'one-away': 1 };

/** Project funder-visible producers into ranked, funder-safe marketplace rows. Pure,
 *  no I/O. `hidden` producers are skipped; only `meetsCorePackaging` live projects
 *  appear. The de-risking score is computed for ordering only and never emitted. */
export function toFunderMarketRows(profiles: ProducerProfile[]): FunderMarketRow[] {
  const scored: { row: FunderMarketRow; best: number }[] = [];

  for (const p of profiles) {
    const visibility = deriveVisibility(p);
    if (visibility === 'hidden') continue;

    const screenable = liveProjects(p).filter(meetsCorePackaging);
    // deriveVisibility !== 'hidden' guarantees screenable.length >= 1.
    const ranked = screenable
      .map((proj) => ({ proj, score: derisking(proj).total }))
      .sort((a, b) => (b.score - a.score) || (a.proj.title < b.proj.title ? -1 : a.proj.title > b.proj.title ? 1 : 0));

    const projects: FunderMarketProjectRow[] = ranked.map(({ proj }) => ({
      id: proj.id,
      title: proj.title,
      stage: proj.ask?.stage ?? '',
      format: proj.format,
      budgetBand: proj.budgetBand.value,
      fundingSecuredBand: proj.ask?.fundingSecuredBand ?? '',
      commercialPath: proj.ask?.commercialPath ?? '',
      packaging: proj.ask?.packaging ?? [],
    }));

    scored.push({
      best: ranked[0].score,
      row: {
        producerId: p.id,
        producerName: p.name,
        company: p.company,
        ratingBand: p.ratingBand,
        careerStage: p.careerStage,
        visibility,
        screenableCount: screenable.length,
        projects,
      },
    });
  }

  scored.sort((a, b) =>
    (VIS_RANK[a.row.visibility] - VIS_RANK[b.row.visibility]) ||
    (b.best - a.best) ||
    (a.row.producerName < b.row.producerName ? -1 : a.row.producerName > b.row.producerName ? 1 : 0),
  );
  return scored.map((s) => s.row);
}
