# AFX — Live Slate Packaging Drawer + Documents Design

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` — Live Slate zone gains an editable packaging drawer with NDA-gated document upload
**Builds on:** the case-study drawer pattern (`CaseStudyDrawer`, `AfxDocumentUpload`, `/api/afx/documents/*`), the single FRA↔producer NDA (`ndaSigned`), and the shared `Project` type (already carries `docs?` and `exact?`).

## Problem

A Live Slate project (a proposed project the producer is raising for) is currently
edited **inline** on its card — title plus NDA-gated exact figures only. There is no
way to capture the producer's raising process (stage, soft-funding applications,
packaging) or to attach the supporting documents that de-risk the project. Producers
need to package a proposed project — capturing all relevant info and accompanying
documents "where possible, to strengthen the project's de-risking viability" —
mirroring the depth of the case-study input drawer.

## Goal

Give each Live Slate project a right-side **packaging drawer** (the Live Slate
equivalent of `CaseStudyDrawer`) where the producer captures identity, current stage,
the financing ask, packaging attachments, **soft-funding applications**, and
**NDA-gated supporting documents**. Additionally, define a **pure internal-only
de-risking score** over that packaging data whose inputs are exactly the drawer
fields, ready for phase 2 to consume.

## Scope & phasing

This spec is **phase 1 of three**. The larger idea — real producer projects visible
on `/afx/marketplace`, gated for internal review before going public at scale — was
decomposed with the user:

1. **Phase 1 (this spec):** producer-side packaging drawer + optional documents +
   the pure de-risking score function (logic only, no UI). Self-contained; produces
   the real data the later phases need.
2. **Phase 2 (later spec):** wire real producer projects into `/afx/marketplace`
   (today the marketplace reads only `afxSeed` fixtures), surface the de-risking
   score to internal staff, and use it for **Marketplace display order**.
3. **Phase 3 (later spec):** gate the marketplace to internal reviewers while the
   flow is tested, before public launch.

**Out of scope for phase 1:** any marketplace change, any staff-facing score UI, any
producer-visible score, an automated "funding vehicle" flag (manual/internal for
now), and any submit-for-vetting/review flow for live projects.

## Confirmed decisions

1. **UI:** a right-side drawer mirroring `CaseStudyDrawer`. **All** live-project
   editing consolidates into the drawer; the Live Slate card becomes a read-only
   summary plus a "Package / Edit" open button. Today's inline exact-figure inputs
   move into the drawer.
2. **Documents:** reuse `AfxDocumentUpload` **parametrized** (see Component note) —
   **NDA-gated on the existing `ndaSigned` flag**, one NDA covers all confidential
   document exchange, no second NDA. **All documents optional** — the required-docs
   "vetting-ready" banner is case-study-specific and is **hidden** for live projects.
3. **Soft-funding applications:** a repeatable list; status vocabulary is exactly
   `applied | in_review | awarded | declined`.
4. **Funding vehicle:** **not** a field. Determined manually/internally for now.
5. **De-risking score:** **internal-staff-only**, never shown to the producer. Phase 1
   defines it as a pure function; phase 2 surfaces it and uses it for marketplace
   display order.

## Architecture

Follows the case-study split: shared `Project` type + a **pure logic module** for
field mutations/savability + a **pure score module** + a **drawer component** reusing
the existing `AfxDocumentUpload` + existing upload/sign/delete routes (no backend
change) + client wiring in `ProducerProfileClient`.

### Data model — `src/lib/afx/types.ts`

New types + one new field on the live-project layer. `Project.docs?` and
`Project.exact?` already exist and are reused as-is.

```ts
/** Producer soft-funding / grant application, captured on a live project. */
export type SoftFundingStatus = 'applied' | 'in_review' | 'awarded' | 'declined';
export interface SoftFundingApplication {
  id: string;                 // crypto.randomUUID()
  body: string;               // fund / grant body name, as entered
  amount?: ExactMoney;        // optional applied-for amount
  status: SoftFundingStatus;
}
```

`ProjectAsk` gains soft-funding (it belongs to the live/forward-looking layer, like
the rest of `ask`):

```ts
export interface ProjectAsk {
  // ...existing fields unchanged...
  softFunding?: SoftFundingApplication[];
}
```

`Stage` is already `type Stage = string`; the drawer offers a controlled option list
(see constants) but the field type is unchanged.

### Constants — `src/lib/afx/constants.ts`

- `LIVE_STAGE_OPTIONS` — controlled stage list for the drawer's Stage select, e.g.
  `['development', 'packaging', 'financing', 'pre-production', 'production']`.
- `SOFT_FUNDING_STATUS_LABELS: Record<SoftFundingStatus, string>` — display labels
  (`applied` → "Applied", `in_review` → "In review", `awarded` → "Awarded",
  `declined` → "Declined").
- `LIVE_DOCUMENT_CATEGORIES` + `LIVE_DOCUMENT_CATEGORY_LABELS` — a **separate**
  live-appropriate category list: `budget`, `financing_agreement`, `talent_deal`,
  `script`, `deck`, `chain_of_title`, `soft_funding_letter`, `sales_estimate`,
  `other`. Some already exist in `DocumentCategory` (`budget`, `financing_agreement`,
  `chain_of_title`, `other`); the new literals (`talent_deal`, `script`, `deck`,
  `soft_funding_letter`, `sales_estimate`) are **added to the `DocumentCategory`
  union only** — **not** to `DOCUMENT_CATEGORIES` (the case-study set stays exactly
  as-is so the case-study dropdown and its required-docs logic are unchanged). The
  drawer renders `LIVE_DOCUMENT_CATEGORIES`; the route accepts the union (see
  Backend).

### Pure logic — `src/lib/afx/liveProject.ts` (new)

Mirrors `caseStudy.ts`. Pure, no I/O, unit-testable. Functions:

- `isLiveProjectSavable(p: Project): boolean` — minimum to save (non-empty title;
  stage set). Deliberately lenient — packaging is incremental.
- Soft-funding mutations (return a new `Project`, never mutate):
  `addSoftFunding(p)`, `updateSoftFunding(p, id, patch: Partial<Omit<SoftFundingApplication,'id'>>)`,
  `removeSoftFunding(p, id)`.
- Packaging mutations reuse existing helpers where present; if the current inline
  editing does packaging mutation ad hoc in the client, lift those into named
  helpers here (`addPackaging`, `updatePackaging`, `removePackaging`) so the drawer
  and any caller share one implementation. (DRY — do not duplicate the client's
  inline logic into the drawer.)
- Document mutations reuse the case-study ones (`addDocument`/`updateDocument`/
  `removeDocument` in `caseStudy.ts`) since they operate on `Project.docs` and are
  status-agnostic. If they are not status-agnostic, generalize them; do not copy.

### Pure score — `src/lib/afx/derisking.ts` (new)

Internal-only. Pure function over a single project; no UI, no persistence in phase 1.

```ts
export interface DeriskingBreakdown {
  completeness: number;   // fields filled: stage, logline, genre, commercialPath, capital stack
  packaging: number;      // signed(2) > soft-hold(1) > wishlist(0), summed across attachments
  fundingSecured: number; // mapped from ask.fundingSecuredBand ordinal
  documents: number;      // count of DISTINCT document categories attached
  softFunding: number;    // awarded(2) / in_review(1) / applied(0.5) / declined(0), summed
}
export interface DeriskingScore { total: number; breakdown: DeriskingBreakdown; }
export function derisking(p: Project): DeriskingScore;
```

Weighting is fixed and documented in the module; the plan specifies exact point
values and the band mapping. The function is total (never throws on missing
optional data — absent fields score 0).

### Component — `src/components/afx/producer/LiveProjectDrawer.tsx` (new)

Structurally a sibling of `CaseStudyDrawer`: fixed overlay + right `aside`, Escape to
close, scrollable body, footer with Save / Close / Remove(→archive). Sections:

- **Identity** — title, genre, format (`CASE_STUDY_FORMATS` or a live equivalent),
  jurisdiction chips (reuse `JURISDICTION_OPTIONS`).
- **Stage** — select from `LIVE_STAGE_OPTIONS`.
- **The ask** — logline, budget band + provenance, funding-secured band, commercial
  path, capital-stack % legs. (Lift the current inline exact-figure inputs here,
  still NDA-gated via `ndaSigned`.)
- **Packaging** — attachment rows (role / name / status), add/remove.
- **Soft-funding applications** — repeatable rows: body, optional amount
  (`ExactFigureInput`, NDA-gated), status select. Add/remove.
- **Supporting documents** — `AfxDocumentUpload` when `ndaSigned`, else the same
  "sign the NDA to attach confidential documents" prompt used by the case-study
  drawer. Passes `categories={LIVE_DOCUMENT_CATEGORIES}` and no required-set, so the
  dropdown shows live categories and the **vetting-ready banner is hidden**.

The drawer does **not** display the de-risking score (internal-only).

### Shared component — `src/components/afx/producer/AfxDocumentUpload.tsx`

Parametrize the existing component (targeted, backward-compatible change) so both
drawers share it:

- Add a `categories: readonly DocumentCategory[]` prop (defaults to
  `DOCUMENT_CATEGORIES` so the case-study call site is unchanged). The category
  `<select>` renders `categories` instead of the hard-coded `DOCUMENT_CATEGORIES`.
- Make the required-docs readiness banner **conditional**: only render it when a
  `requiredCategories` prop (or `showReadiness`) is supplied. The case-study drawer
  passes its required set (existing behaviour preserved); the live drawer omits it,
  hiding the banner. `missingRequiredDocs`/`REQUIRED_DOCUMENT_CATEGORIES` are used
  only in the case-study path.
- The live project's id is passed via the existing `caseStudyId` prop (the value is
  a project UUID either way; it becomes the `caseStudyId` form field the route
  already reads). Optionally rename the prop `projectId` for clarity — a mechanical
  rename across two call sites, not required.
- The upload `fetch` continues to POST `scope` (default `case_study`) — unchanged for
  both drawers.

### Card → summary — `src/components/afx/producer/LiveSlateZone.tsx`

`LiveProjectCard` becomes a read-only summary (title, format/stage, ask summary,
packaging, exact figures if NDA + present, provenance badge) plus a **"Package / Edit"**
button that opens the drawer, and the existing Archive control. Inline editing is
removed from the card (moved into the drawer). `onExact` inline handlers are removed
from the card; the drawer owns exact-figure editing.

### Client wiring — `src/app/afx/producer/ProducerProfileClient.tsx`

Add live-drawer state mirroring the case-study drawer wiring: which live project id is
open, open/close handlers, an `onSaveLiveProject(project)` that merges the edited
project back into `draft.slate` and calls the existing `persistProfileAction` (which
already persists drawer doc uploads before any gate). `onAddProject` may open the
drawer on the freshly-created project so the producer lands in packaging immediately.

### Backend — one-line category-validation widen, no new route/scope

- The sign/delete routes are reused **unchanged**. Live-project documents use
  `scope=case_study` keyed by the project UUID (the route already accepts any slate
  UUID and enforces the per-project edit-lock via `hasOpenSubmission(..., 'case_study', id)`;
  a live project has no open submission, so it is editable). No new scope, no new
  storage path convention, no migration.
- **One change to `upload/route.ts`:** the `case_study`-scope `allowedCats` currently
  equals `DOCUMENT_CATEGORIES`. Widen it to the union
  `[...DOCUMENT_CATEGORIES, ...LIVE_DOCUMENT_CATEGORIES]` so a live category
  validates. The `entity`/`individual` scopes keep validating against their own
  `ENTITY_/INDIVIDUAL_DOCUMENT_CATEGORIES` sets — **unaffected**. This is the only
  backend edit.

### Funder-view isolation — `src/lib/afx/funderView.ts`

**Constraint (must verify):** live-project `docs` and `softFunding` (and `exact`)
must never reach the funder view. Confirm the existing per-project strip removes
`docs`/`exact` for **all** slate projects regardless of `status` (not only
`case_study`), and extend the strip to drop `softFunding` from the funder-facing
project shape. Soft-funding *status* is producer packaging, but applied-for *amounts*
are confidential; the simplest safe rule for phase 1 is to strip the whole
`softFunding` array from the funder view (funders are not consuming live projects
until phase 2 anyway).

## Data flow

1. Producer opens a Live Slate project → `LiveProjectDrawer` with a `structuredClone`
   of the project as local draft state.
2. Producer edits fields / packaging / soft-funding; uploads documents (each upload
   POSTs to `/api/afx/documents/upload` immediately and appends the returned
   `AfxDocument` to the draft's `docs`).
3. Save → merge draft project into `draft.slate` → `persistProfileAction(draft)`.
4. `derisking(project)` is computable at any time from the persisted project;
   phase 2 reads it. No score is shown in phase 1.

## Error handling

- Upload errors: surfaced inline by `AfxDocumentUpload` (existing behaviour — type,
  size, 401/403/409 lock, storage 500).
- Edit-lock: a live project has no open submission, so uploads are not locked; if a
  future submission exists the route returns 409 and the component shows it (existing
  behaviour). No new handling needed.
- Save is lenient (`isLiveProjectSavable`); partial packaging is valid.

## Testing

No test runner in this repo. Verify with:

- `npx tsc --noEmit -p tsconfig.json` + `npx next build`.
- **Pure-logic assertions** (`npx tsx` script at repo root, deleted after):
  - `liveProject.ts`: add/update/remove soft-funding immutability + savability
    (title+stage required; lenient otherwise).
  - `derisking.ts`: score monotonicity (adding a signed attachment, a document
    category, or an awarded soft-funding raises the total; empty project scores 0;
    breakdown fields sum consistently; totality on missing optional data).
  - `funderView.ts`: a live project with `docs`, `exact`, and `softFunding` emerges
    from the funder view with all three stripped.
- **Browser on prod** (Gerhard's producer account): open a Live Slate project → the
  packaging drawer opens; set stage, add a soft-funding row, add a packaging
  attachment; with NDA signed, upload a document and re-open to confirm it persisted;
  archive still works; card shows the summary. No score visible anywhere producer-side.

No migration, no new RLS/policy, no new route.

## YAGNI (explicitly not building)

- No marketplace change, no staff score surface, no producer score display.
- No automated funding-vehicle derivation.
- No required-docs gate / vetting-ready banner / submit-for-vetting for live projects.
- No new document-storage scope (`case_study` scope is reused).
- No score persistence column (the score is a pure derivation; phase 2 decides
  whether to precompute/store it).
