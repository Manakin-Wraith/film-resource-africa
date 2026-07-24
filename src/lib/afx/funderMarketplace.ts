import type { ProducerProfile, Project, RatingBand, PackagingAttachment, CapitalStackInput, Provenance, Relationship, EvidenceLink, Slate, RiskTier } from './types';
import { deriveVisibility, meetsCorePackaging } from './constants';
import { liveProjects, caseStudies, computeAggregates, type Aggregates } from './aggregates';
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
  logline: string;
  /** Percentage bands only — no dollar figures are funder-visible. */
  capitalStack: CapitalStackInput;
  comps: { title: string; note: string }[];
  evidence: EvidenceLink[];
}

/** Funder-safe projection of a producer-curated slate. Banded econ fields
 *  only, self-reported, no NDA-gated exact layer in this slice. */
export interface FunderMarketSlateRow {
  id: string;
  name: string;
  genreStrategy: string;
  stage: Slate['stage'];
  volume: number;
  totalBudgetBand: { value: string; provenance: Provenance };
  securedBand: string;
  askBand: { value: string; provenance: Provenance };
  targetIRR: { value: string; provenance: Provenance };
  portfolioROI: { value: string; provenance: Provenance };
  riskSpread: Record<RiskTier, number>;
  distributionStrategy: string;
  evidence: EvidenceLink[];
  projects: FunderMarketProjectRow[];
}

/** One past project (case study) as evidence behind a producer's track record. */
export interface FunderMarketCaseStudyRow {
  id: string;
  title: string;
  format: string;
  budgetBand: string;
  recoupment: { value: string; provenance: Provenance };
  bondUsed: { value: string; provenance: Provenance };
  distribution: { name: string; type: string; provenance: Provenance }[];
  festivalsAwards: string[];
  evidence: EvidenceLink[];
}

/** One producer row on the funder marketplace. Carries no score field —
 *  the de-risking score orders rows server-side and is dropped here. */
export interface FunderMarketRow {
  producerId: string;
  producerName: string;
  company: string;
  bio: string;
  location?: string;
  ratingBand: RatingBand;
  careerStage: string;
  visibility: 'live' | 'one-away';
  screenableCount: number;
  relationships: Relationship[];
  slates: FunderMarketSlateRow[];
  projects: FunderMarketProjectRow[];
  /** Lifetime track-record bands, rolled up from case studies. '—' fields mean no case studies yet. */
  trackRecord: Aggregates;
  caseStudies: FunderMarketCaseStudyRow[];
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

    const toProjectRow = (proj: Project): FunderMarketProjectRow => ({
      id: proj.id,
      title: proj.title,
      stage: proj.ask?.stage ?? '',
      format: proj.format,
      budgetBand: proj.budgetBand.value,
      fundingSecuredBand: proj.ask?.fundingSecuredBand ?? '',
      commercialPath: proj.ask?.commercialPath ?? '',
      packaging: proj.ask?.packaging ?? [],
      logline: proj.ask?.logline ?? '',
      capitalStack: proj.ask?.capitalStack ?? { equityPct: 0, softPct: 0, debtPct: 0, gapPct: 0 },
      comps: proj.ask?.comps ?? [],
      evidence: proj.evidence ?? [],
    });

    const screenableIds = new Set(screenable.map((proj) => proj.id));
    const slatedIds = new Set<string>();
    const slateRows: FunderMarketSlateRow[] = [];

    for (const s of p.slates ?? []) {
      const memberIds = s.projectIds.filter((id) => screenableIds.has(id));
      if (memberIds.length === 0) continue; // no screenable members — drop the slate entirely

      const riskSpread: Record<RiskTier, number> = { low: 0, mid: 0, 'high-upside': 0 };
      for (const id of memberIds) {
        const tier = s.riskTiers[id];
        if (tier) riskSpread[tier] += 1;
        slatedIds.add(id);
      }

      const memberRanked = ranked.filter((r) => memberIds.includes(r.proj.id));
      slateRows.push({
        id: s.id,
        name: s.name,
        genreStrategy: s.genreStrategy,
        stage: s.stage,
        volume: memberIds.length,
        totalBudgetBand: s.totalBudgetBand,
        securedBand: s.securedBand,
        askBand: s.askBand,
        targetIRR: s.targetIRR,
        portfolioROI: s.portfolioROI,
        riskSpread,
        distributionStrategy: s.distributionStrategy,
        evidence: s.evidence ?? [],
        projects: memberRanked.map(({ proj }) => toProjectRow(proj)),
      });
    }

    const standaloneRanked = ranked.filter((r) => !slatedIds.has(r.proj.id));
    const projects: FunderMarketProjectRow[] = standaloneRanked.map(({ proj }) => toProjectRow(proj));

    const studyRows: FunderMarketCaseStudyRow[] = caseStudies(p).map((s) => ({
      id: s.id,
      title: s.title,
      format: s.format,
      budgetBand: s.budgetBand.value,
      recoupment: s.outcomes?.recoupment ?? { value: '—', provenance: 'self' },
      bondUsed: s.outcomes?.bondUsed ?? { value: '—', provenance: 'self' },
      distribution: s.outcomes?.distribution ?? [],
      festivalsAwards: s.outcomes?.festivalsAwards ?? [],
      evidence: s.evidence ?? [],
    }));

    scored.push({
      best: ranked[0].score,
      row: {
        producerId: p.id,
        producerName: p.name,
        company: p.company,
        bio: p.bio,
        location: p.location,
        ratingBand: p.ratingBand,
        careerStage: p.careerStage,
        visibility,
        screenableCount: screenable.length,
        relationships: p.relationships,
        slates: slateRows,
        projects,
        trackRecord: computeAggregates(p),
        caseStudies: studyRows,
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
