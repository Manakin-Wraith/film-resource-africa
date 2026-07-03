# AFX — Staff Review Marketplace (Phase 2) Design

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/staff` — new staff-gated internal review surface listing real producers' live projects, ranked by the de-risking score
**Builds on:** the Live Slate packaging drawer + the pure internal-only `derisking(project)` score (phase 1, `src/lib/afx/derisking.ts`), and the existing staff read-only surfaces (Invites, Team, NDA log) with their `resolveStaff()` gate + `afxAdmin` service-role read pattern.

## Problem

Phase 1 let producers package live (raising) projects and defined a pure,
internal-only **de-risking score** over that packaging — but nothing consumes it.
The public `/afx/marketplace` renders only `afxSeed` mock fixtures; real producer
projects appear nowhere. FRA needs an **internal** surface to review real producers'
live projects, ranked by that score, to test the flow before opening a public/funder
marketplace at scale.

## Goal

Add a read-only, **staff-gated** page at `/afx/staff/marketplace` that lists every
producer with ≥1 live project, **one row per producer**, ranked by the producer's
**best (max)** live-project de-risking score, expandable to the individual live
projects. The internal score is visible here (staff-only). No public/funder view, no
access-model change, no writes.

## Scope & phasing

This is **phase 2 of 3** in the Live Slate → marketplace arc:

1. **Phase 1 (shipped):** producer packaging drawer + documents + pure internal-only
   de-risking score (logic only, no UI).
2. **Phase 2 (this spec):** internal staff review surface — real producers' live
   projects ranked by the score. New route, staff-gated, read-only.
3. **Phase 3 (later spec):** public/funder-facing marketplace + the access model for
   opening it at scale.

**Out of scope for phase 2:** any change to the seed `/afx/marketplace` or the
`DealEntity` type; any public/funder view or access-model change; rendering
confidential exacts / document filenames / soft-funding amounts; persisting or
writing the score; filters / search / pagination; reuse of the seed table's
compare / drill-down overlay.

## Confirmed decisions

1. **Location & access:** a NEW route `/afx/staff/marketplace`, gated by
   `resolveStaff()` (same level as Invites / NDA log; the `/afx/staff/*` layout also
   redirects non-staff). The existing open `/afx/marketplace` seed demo is untouched.
2. **Granularity:** one row per **producer**, aggregating their live slate.
3. **Score rollup:** rank by the producer's **best (max)** live-project de-risking
   score; show the live-project **count** alongside.
4. **Rendering approach:** a lean purpose-built table + pure mapper — NOT a mapping
   into the seed `DealEntity` shape (that would fabricate `budgetUSD`/`fundingPct`/
   `rebatePct`/`benchmark`/`tags`/`detail`). Honest, minimal, no fabricated fields.
5. **Confidentiality:** rows render only funder-safe **bands + counts + the internal
   score + verification badges**. Never exact figures, document filenames, or
   soft-funding amounts. The score is safe here because the route is staff-only.
6. **Verification badges:** show verified-individual / verified-company badges per
   producer (from the `individualVerifiedAt` / `entityVerifiedAt` markers).

## Architecture

Follows the NDA-log split: a **pure** shaping module + a **service-role server**
module (gated fetch) + a **client** component + a **route** + a **nav link**.

### Pure module — `src/lib/afx/reviewMarketplace.ts`
Types + pure transform (no I/O), unit-shaped like `ndaLog.ts`. Consumes full
`Project`s server-side (needed by `derisking`) but emits only safe display fields.

- `ReviewProducerInput = { id: string; name: string; company: string; producerType?: ProducerType; individualVerifiedAt?: string; entityVerifiedAt?: string; slate: Project[] }`
- `ReviewProjectRow = { id: string; title: string; stage: string; format: string; budgetBand: string; fundingSecuredBand: string; score: number; breakdown: DeriskingBreakdown }`
- `ReviewRow = { producerId: string; producerName: string; company: string; producerType: ProducerType; verifiedIndividual: boolean; verifiedCompany: boolean; liveCount: number; bestScore: number; bestProjectTitle: string | null; projects: ReviewProjectRow[] }`
- `toReviewRows(inputs: ReviewProducerInput[]): ReviewRow[]`
  - for each producer, take `slate.filter(p => p.status === 'live')`; **skip the
    producer entirely if that list is empty** (only producers with live projects
    appear);
  - per live project compute `derisking(project)` → `{ total, breakdown }`; build a
    `ReviewProjectRow` using funder-safe fields only (`budgetBand.value`,
    `ask?.fundingSecuredBand ?? ''`, `ask?.stage ?? ''`);
  - `bestScore` = max project `score` (0 if — cannot happen since ≥1 live);
    `bestProjectTitle` = title of the max-score project;
  - `liveCount` = number of live projects;
  - `verifiedIndividual = !!individualVerifiedAt`, `verifiedCompany = !!entityVerifiedAt`;
  - `producerType` = `producerType ?? 'company'` (back-compat, matches `producerTypeOf`);
  - **sort `projects`** by `score` desc, tie-break by `title`;
  - **sort `ReviewRow`s** by `bestScore` desc, tie-break by `liveCount` desc, then
    `producerName`.

### Server module — `src/lib/afx/server/staffReviewMarketplace.ts`
- `listReviewRows(): Promise<ReviewRow[]>`
  - `if (!(await resolveStaff())) return [];`
  - `afxAdmin.from('afx_producers').select('id, profile, individual_verified_at, entity_verified_at')`
    (service-role — the authorized staff read path; the verified markers live in
    isolated columns, not the profile blob, so they are selected explicitly);
  - map each row to a `ReviewProducerInput`: `name`/`company`/`producerType`/`slate`
    from `profile`, and the two verified timestamps from their isolated columns;
  - `return toReviewRows(inputs);`

### Route — `src/app/afx/staff/marketplace/page.tsx`
Mirror `nda/page.tsx`: `resolveStaff()` → `redirect('/afx/staff')` if not staff;
`const rows = await listReviewRows()`; render `<AfxTopBar subtitle="FRA review" />` +
`<main>` + `<StaffMarketplace rows={rows} />`.

### Component — `src/components/afx/staff/StaffMarketplace.tsx` (`'use client'`)
Read-only list. Header "Marketplace review" with a **`← Queue` back link on the left**
(matching the corrected staff-header layout). Each producer row:
- **producer name / company** · **verification badges** (verified individual /
  verified company, shown only when true) · **live-project count** ("N live") ·
  **best de-risking score** with a compact breakdown chip row (completeness /
  packaging / funding-secured / documents / soft-funding) · strongest project title;
- a "▸ {liveCount} project(s)" toggle (per-row `useState`) that expands the
  per-project rows — each: title · stage · format · **budget band** · **funding-secured
  band** · that project's score (+ same compact breakdown).
- Empty state: "No producers with live projects yet."

The score is rendered as its numeric total (one decimal, e.g. `8.5`) plus the
breakdown chips. No exact figures / filenames / amounts anywhere.

### Nav link — `src/app/afx/staff/page.tsx`
Add `<Link href="/afx/staff/marketplace" style={navLink}>Marketplace review →</Link>`
beside the existing Invites / NDA log links (all staff; not admin-gated).

## Data flow

Server page (staff-gated) → `listReviewRows()` (`afxAdmin` reads all producer
profiles + verified markers) → `toReviewRows()` (pure; runs `derisking` per live
project) → `StaffMarketplace` (client, read-only render). The score is computed on
read; nothing is persisted.

## Error handling

- Non-staff hitting the route: `redirect('/afx/staff')` (and the `/afx/staff/*`
  layout already redirects unauthenticated users).
- A producer with a malformed/empty `slate`: `toReviewRows` filters to
  `status === 'live'`; an empty result skips the producer (no row, no throw).
- `derisking` is total (never throws on missing optional data), so a partially
  packaged project scores what it has.

## Testing

No test runner. Verify with:

- `npx tsc --noEmit -p tsconfig.json` + `npx next build`.
- **Pure-logic assertions** (`npx tsx` at repo root, deleted after): `toReviewRows`
  covering — best(max) rollup selects the strongest project's score;
  `bestProjectTitle` matches it; `liveCount` counts only live; a producer with zero
  live projects is omitted; a case_study/archived-only producer is omitted; row sort
  (bestScore desc, then liveCount desc, then name); per-project sort (score desc);
  verified flags from the two markers; `producerType` defaults to `'company'`; NO
  exact/doc/soft-funding-amount fields appear on `ReviewProjectRow`/`ReviewRow`
  (type-level — the interfaces simply don't carry them).
- **Browser on prod** (Gerhard, a staff admin): open `/afx/staff/marketplace` → the
  page renders "Marketplace review" with `← Queue`; Gerhard's producer entry appears
  (he has live projects "New project 1/2") with a best score, verification badges,
  "N live", and an expandable project list showing stage / format / budget band /
  funding-secured band / per-project score. Confirm the nav link is on `/afx/staff`.
  Confirm no exact figures / filenames / amounts are shown.

No migration, no new RLS/policy, no `afx_producers` write, no seed-marketplace change.

## YAGNI (explicitly not building)

- No change to `/afx/marketplace`, the `DealEntity` type, or the seed data.
- No public/funder view, no access-model change (phase 3).
- No filters, search, sort controls, or pagination (rank is fixed: best score desc).
- No confidential-exact / filename / amount rendering.
- No score persistence (pure derivation on read).
- No compare / drill-down-overlay reuse from the seed table.
