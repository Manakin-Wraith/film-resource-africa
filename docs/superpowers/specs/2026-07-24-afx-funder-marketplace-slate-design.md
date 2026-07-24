# AFX Funder Marketplace — Slate (Portfolio) Cards Design

**Date:** 2026-07-24
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/marketplace` — funder-facing marketplace card, nested inside the existing producer row
**Builds on:** the funder-safe boundary (`funderMarketplace.ts` / `toFunderMarketRows`), the funder-visibility model (`deriveVisibility` / `meetsCorePackaging`), the existing producer row and its `trackRecord` / `caseStudies` rollups, and the existing banded/no-exact-figures convention.

## Problem

Today the funder marketplace sells a **single project**: each producer row expands to a flat list of individual live projects (`FunderMarket.tsx` → `ProjectRowView`), each pitched on its own merits ("will this one project succeed?"). For producers running multiple films at once, this misses the pitch investors actually respond to: diversification, structured returns, and repeatability — "does this portfolio reliably return capital?"

## Goal

Let a producer bundle a subset of their live projects into a **Slate** — a named portfolio with its own economics, risk spread, and distribution strategy — and surface it on the funder marketplace as a portfolio-level card nested inside their existing producer row. Projects not assigned to a slate keep behaving exactly as they do today.

## Confirmed decisions

1. **Slate is a new, deliberate entity**, not an automatic grouping of "all of a producer's live projects." A producer explicitly names a slate and chooses which live projects belong to it. A producer may have zero, one, or multiple slates; a live project may belong to at most one slate. Projects not in any slate render exactly as they do today (unchanged `ProjectRowView`).
2. **Slates nest inside the existing producer row**, they do not become a new top-level marketplace card type. Inside a producer row, slated projects are grouped under their slate's portfolio summary; any remaining standalone live projects still list individually below/alongside, as today.
3. **All slate econ fields are banded, never exact figures** — same rule as every other funder-facing number in this system. Total budget, secured %, investor ask, target IRR, and portfolio ROI are all bands/ranges (e.g. "R50–100M", "20–30%", "2–2.5x"), not point figures. This is consistent with the existing `capitalStack` comment ("Percentage bands only — no dollar figures are funder-visible") — extending it to slates rather than special-casing them. There is **no** NDA-gated "exact" unlock for slate economics in this slice (unlike per-project `exact`); if precise slate financials are ever needed post-NDA, that is a later slice, not part of this design.
4. **Slate econ fields are producer self-reported**, tagged with `provenance: 'self'` and optional `evidence` links (reusing the existing `EvidenceLink` / `ProvenanceBadge` primitives) — same pattern as project asks today. The platform does not compute, validate, or audit the IRR/ROI math.
5. **No numeric slate score is shown to funders.** The existing internal `derisking` score stays hidden per producer/project as it does today; slate "readiness" is surfaced only as a qualitative stage label — `Packaging` / `Financing` / `Ready` — never a number. This preserves the existing "score never leaves the server" policy without reopening it.
6. **Risk tier is self-tagged per project**, not derived. When a producer adds a project to a slate, they pick a `riskTier` from a fixed enum: `low` | `mid` | `high-upside`. The slate card rolls these up into a count-based risk-spread signal (e.g. "2 low / 2 mid / 1 high-upside"). `riskTier` only exists in the context of slate membership — a project not in any slate has no risk tier.
7. **Credibility layer reuses existing data.** Production-company track record, past revenue, and films-delivered signals already live on the producer row (`trackRecord`, `caseStudies`) and are not duplicated onto the slate. The slate card sits above/near that existing block rather than re-fetching or re-deriving it.
8. **Distribution strategy is a free-text field on the slate** (e.g. "Pre-aligned with streamer + sales agent"), self-reported, no enum — mirrors how `commercialPath` is handled at the project level today.

## Out of scope (explicitly deferred)

- Multi-producer pooled slates (a slate spanning more than one producer's projects).
- System-computed or validated IRR/ROI (no calculation engine, no sanity-checking against `budgetBand`/`capitalStack`/case-study recoupment).
- A visible numeric slate readiness score.
- An NDA-gated exact-figures layer for slate economics (parallel to the existing per-project `exact`).
- Any change to marketplace ranking/sort order — slates do not introduce a new ranking signal in this slice; producer-row ordering keeps using the existing hidden de-risking rollup.

## Data model

New type in `src/lib/afx/types.ts`, alongside `Project`:

```ts
export type RiskTier = 'low' | 'mid' | 'high-upside';

export interface Slate {
  id: string;
  name: string;                          // "5 Mid-Budget African Thrillers"
  genreStrategy: string;                 // "Commercial thrillers"
  stage: 'packaging' | 'financing' | 'ready';
  projectIds: string[];                  // subset of this producer's live project ids
  riskTiers: Record<string, RiskTier>;   // projectId -> tier, only for ids in projectIds
  totalBudgetBand: Provenanced<string>;  // "R50-100M"
  securedBand: string;                   // "40-60%"
  askBand: Provenanced<string>;          // "R25-50M"
  targetIRR: Provenanced<string>;        // "20-30%"
  portfolioROI: Provenanced<string>;     // "2-2.5x"
  distributionStrategy: string;
  evidence?: EvidenceLink[];
}
```

`ProducerProfile` gains an optional `slates?: Slate[]`.

## Funder-safe projection

`src/lib/afx/funderMarketplace.ts` gains:

```ts
export interface FunderMarketSlateRow {
  id: string;
  name: string;
  genreStrategy: string;
  stage: Slate['stage'];
  volume: number;                        // projectIds.length
  totalBudgetBand: string;
  securedBand: string;
  askBand: string;
  targetIRR: string;
  portfolioROI: string;
  riskSpread: Record<RiskTier, number>;  // rolled-up counts
  distributionStrategy: string;
  evidence: EvidenceLink[];
  projects: FunderMarketProjectRow[];    // the slate's member projects, same shape as today
}
```

`FunderMarketRow` gains `slates: FunderMarketSlateRow[]`. `toFunderMarketRows` computes, per producer:
- screenable live projects as today (`liveProjects(p).filter(meetsCorePackaging)`);
- partition screenable projects into those referenced by a `slate.projectIds` vs. standalone;
- for each slate that has at least one screenable member project, emit a `FunderMarketSlateRow` (a slate with zero screenable members is dropped entirely — same "must clear core packaging" bar as standalone projects);
- standalone screenable projects populate `FunderMarketRow.projects` exactly as today (unchanged);
- the hidden `derisking` ranking rollup is unaffected — it continues to score all screenable projects (slated or not) the same way it does today, since slates don't change what "screenable" means.

No `exact`, `docs`, `softFunding`, or score fields are ever included on `FunderMarketSlateRow`, matching the existing funder-safe boundary.

## UI

`FunderMarket.tsx` gains a `SlateRowView` component, rendered inside the expanded producer row above any standalone `ProjectRowView`s:

```
▸ Slate: "5 Mid-Budget African Thrillers"          Stage: Financing
  Commercial thrillers · 5 films

  Budget R50–100M · Secured 40–60% · Ask R25–50M
  Target IRR 20–30% · Portfolio ROI 2–2.5x
  Risk: 2 low / 2 mid / 1 high-upside
  Distribution: Pre-aligned sales agent + streamer talks
  [evidence links, if any]

  ▸ 5 projects (expandable, reuses ProjectRowView per member project)
```

Visual language reuses existing primitives: `ProvenanceBadge` for self-reported econ fields, the same mono-label/value row pattern as `CaseStudyRowView`, and the existing comp-chip styling for risk-spread counts. No new color/token system introduced.

## Error handling / edge cases

- A slate with no screenable member projects is not shown (same rule as producers with zero screenable projects being `hidden` entirely).
- A project referenced in `slate.projectIds` that is not `live` or doesn't pass `meetsCorePackaging` is silently excluded from that slate's `volume`/`riskSpread` rollup and from its member-project list — it does not block the rest of the slate from rendering.
- Empty/missing econ band fields render as `—`, consistent with existing patterns (`TrackRecordLine`, `CaseStudyRowView`).

## Testing

- Pure-function unit tests on the `toFunderMarketRows` slate-partitioning logic: a producer with no slates behaves identically to today (regression guard); a slate with all members screenable; a slate with a mix of screenable/non-screenable members; a slate with zero screenable members (dropped); risk-spread roll-up counts.
- No new I/O paths — slate data flows through the same `ProducerProfile` → funder-safe projection path as everything else, so no new server-reader tests beyond extending existing fixtures with `slates`.
