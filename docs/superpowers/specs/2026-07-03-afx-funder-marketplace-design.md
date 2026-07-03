# AFX Funder Marketplace (Phase 3, slice 1) Design

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/marketplace` — replace the seed `DealEntity` demo with a real, staff-gated funder marketplace
**Builds on:** the funder-safe boundary (`funderView.ts`/`toFunderView`), the funder-visibility model (`deriveVisibility` / `meetsCorePackaging` / `VISIBILITY_META`), the internal-only de-risking score (`derisking.ts`), and the Phase 2 server-reader + `rowsToProfile` persistence pattern.

## Problem

The public `/afx/marketplace` renders only `afxSeed` mock fixtures via the rich
`DealEntity` model (score / budgetUSD / fundingPct / rebatePct / benchmark / tags /
compare / drill-down). Real producer live projects appear nowhere on a funder-facing
surface. Real funder-safe data (`FunderView`) has none of the `DealEntity` fabricated
fields — only bands, provenance, packaging, aggregates — so it cannot honestly feed
that screen.

## Goal

Replace the seed marketplace at `/afx/marketplace` with a lean, honest, **staff-gated**
funder marketplace that renders **real** producer live projects through the funder-safe
boundary, one row per producer (expandable to screenable projects), ranked by the
**hidden** internal de-risking score, honoring the existing funder-visibility model.
This is a faithful internal preview of the funder experience before real funder accounts
exist.

## Scope & phasing

Phase 3 of the Live Slate → marketplace arc splits into slices:
- **Slice 1 (this spec):** real data on the marketplace surface, staff-gated, seed removed.
- **Later slice (deferred):** the funder identity/access model — funder accounts, invites,
  gating — that opens this surface to real external funders.

## Confirmed decisions

1. **Replace, don't parallel.** `/afx/marketplace` becomes the real surface; the seed
   `DealEntity` demo is removed (not kept at a `/demo` path).
2. **Lean rebuild.** An honest table of funder-safe fields only, ranked by the hidden
   de-risking score, with an expand/drill-down. No filters / sort controls / compare
   for now (they were `DealEntity`-specific).
3. **Staff-only gate for now.** Reuse `resolveStaff()` — identical to the Phase 2 review
   surface. Funder accounts are a later slice. The difference from the Phase 2 staff
   surface: this one **hides** the de-risking score (order only) and renders strictly
   funder-safe fields.
4. **One row per producer,** expandable to their screenable live projects; de-risking
   best-project rollup drives order.
5. **Honor the visibility model.** Show only funder-visible producers: `live` and
   `one-away` appear (`one-away` sorts lower, per the model), `hidden` producers are
   excluded entirely; within a producer, only `meetsCorePackaging` (screenable) live
   projects show.
6. **Score never leaves the server.** The de-risking score is used for ordering
   server-side and is **not** emitted onto any funder row — future-proofing for when the
   gate opens to real funders.

## Architecture

Mirrors the Phase 2 three-layer split: pure mapper + service-role server reader + client
component + route.

### Pure module — `src/lib/afx/funderMarketplace.ts`
Types + a pure transform (no I/O). Consumes full `ProducerProfile`s server-side (needed by
`deriveVisibility` and `derisking`, which read confidential `docs`/`softFunding`), emits
only funder-safe display fields.

- `FunderMarketProjectRow = { id: string; title: string; stage: string; format: string; budgetBand: string; fundingSecuredBand: string; commercialPath: string; packaging: { role: string; name: string; status: 'signed' | 'soft-hold' | 'wishlist' }[] }`
  — **no** score, breakdown, exact, docs, or softFunding.
- `FunderMarketRow = { producerId: string; producerName: string; company: string; ratingBand: RatingBand; careerStage: string; visibility: 'live' | 'one-away'; screenableCount: number; projects: FunderMarketProjectRow[] }`
  — **no** score field.
- `toFunderMarketRows(profiles: ProducerProfile[]): FunderMarketRow[]`
  - for each profile: `const v = deriveVisibility(profile)`; **skip if `v === 'hidden'`**;
  - `const screenable = liveProjects(profile).filter(meetsCorePackaging)` (guaranteed
    ≥1 because non-hidden ⇒ ≥1 screenable);
  - per screenable project compute `derisking(project).total` for **ordering only**; build
    a `FunderMarketProjectRow` with funder-safe fields (`ask.stage`, `budgetBand.value`,
    `ask.fundingSecuredBand`, `ask.commercialPath`, `ask.packaging`);
  - sort a producer's projects by hidden score desc, tie-break `title`;
  - `screenableCount = screenable.length`;
  - emit the `FunderMarketRow` (dropping the score);
  - **sort rows:** `live` before `one-away` (visibility rank), then by the producer's
    hidden best (max) screenable-project score desc, then `producerName`.

### Server module — `src/lib/afx/server/funderMarketplace.ts`
- `listFunderMarketRows(): Promise<FunderMarketRow[]>`
  - `if (!(await resolveStaff())) return [];`
  - read `afx_producers` (full producer columns, as `getSubmissionDetail`) + `afx_projects`
    where `status = 'live'` selecting `id, producer_id, status, body, docs` (**not** the
    NDA-gated `exact` column — `derisking`/visibility never read it);
  - group live project rows by `producer_id`, stitch each producer via `rowsToProfile`;
  - `return toFunderMarketRows(profiles);`

### Component — `src/components/afx/marketplace/FunderMarket.tsx` (`'use client'`)
Lean read-only list. Header "Marketplace". Each producer row: name / company ·
rating band · career stage · a visibility chip (`Live to funders` / `1 project from
going live`, from `VISIBILITY_META`) · "N screenable". A "▸ N project(s)" toggle (per-row
`useState`) expands the screenable projects — each: title · stage · format · budget band ·
funding-secured band · commercial path · a compact packaging summary (e.g. `Director ·
Name · signed` rows, or `N attached · M signed`). No score, no exact figures, no
fabricated columns anywhere. Empty state: "No producers are live to funders yet."

### Route — `src/app/afx/marketplace/page.tsx`
Becomes an async server component (replacing the current one-line client re-export):
`const staff = await resolveStaff(); if (!staff) redirect('/afx/staff');`
`const rows = await listFunderMarketRows();` render `<AfxTopBar subtitle="Deal screening" />`
+ `<main>` + `<FunderMarket rows={rows} />`.

### Removals
Delete the seed `DealEntity` marketplace machinery, now unused:
- `src/app/afx/marketplace/DealDisplayClient.tsx`
- `src/components/afx/marketplace/DealTableRow.tsx`
- `src/components/afx/marketplace/DrillDownOverlay.tsx`
- `src/components/afx/marketplace/CompareOverlay.tsx`
- `src/components/afx/marketplace/grid.ts`
- the `DealEntity`-only constants in `constants.ts` that become unused after the delete
  (`ENTITY_TABS`, `SIGNAL_TABS`, `SORT_COLUMNS`, `FILTER_GROUPS`) — remove only those
  confirmed to have no remaining importer.

**Kept:** the `afxSeed` module and the `DealEntity` type — still used by `FunderPreview`
and `LiveSlateZone` for the AFX-incentive rebate overlay (out of scope). Any constant
still imported elsewhere stays.

## Data flow

Staff request → route `resolveStaff()` gate → `listFunderMarketRows()` (`afxAdmin` reads
all producers + live projects, stitches via `rowsToProfile`) → `toFunderMarketRows()`
(pure; runs `deriveVisibility` + `meetsCorePackaging` + `derisking` for order) →
pre-sorted funder-safe `FunderMarketRow[]` → `FunderMarket` (client render). The score is
computed on read and dropped; nothing is persisted.

## Error handling

- Non-staff hitting the route: `redirect('/afx/staff')`; the server function also returns
  `[]`.
- A `hidden` producer (no `consentK4`/`entityK2`, or zero screenable projects) is silently
  excluded — no row, no throw.
- `deriveVisibility`, `meetsCorePackaging`, and `derisking` are total (never throw on
  missing optional data).
- Empty result → the empty-state message.

## Testing

No test runner. Verify with:

- `npx tsc --noEmit -p tsconfig.json` + `npx next build` (confirm `/afx/marketplace` still
  builds and the deleted components leave no dangling imports).
- **Pure-logic assertions** (`npx tsx` at repo root, deleted after) for `toFunderMarketRows`:
  a `hidden` producer is excluded; a `one-away` producer sorts below a `live` producer;
  only `meetsCorePackaging` projects appear on a row; a producer's projects sort by hidden
  score desc; **no `score` / `exact` / `docs` / `softFunding` / `breakdown` key appears on
  any emitted `FunderMarketRow` or `FunderMarketProjectRow`** (object-level assertion — the
  funder-safety invariant); `screenableCount` counts only screenable live projects.
- **Browser on prod** (Gerhard, staff): `/afx/marketplace` renders the lean surface;
  Gerhard appears as `one-away` (single screenable project) showing **Uhuru** (Director +
  Writer signed + funding plan) but **not** "New project 1" (wishlist-only, not screenable);
  a visibility chip shows "1 project from going live"; no de-risking score, exact figures,
  filenames, or amounts anywhere; expand shows the screenable project's bands + packaging;
  a non-staff session (or signed-out) is redirected to `/afx/staff`.

No migration, no new RLS/policy, no `afx_producers` write, no `deriveVisibility`/`funderView`
change.

## YAGNI (explicitly not building)

- No funder accounts / auth / invites (that is the deferred later slice).
- No filters, sort controls, compare, or per-project view toggle.
- No AFX-incentive rebate on rows (it is seed/mock data).
- No `deriveVisibility` / `funderView` / `derisking` change.
- No migration, no new RLS/policy, no score persistence, no score on the wire to the client.
- No change to `FunderPreview` or `LiveSlateZone` (they keep their `afxSeed` incentive lookup).
