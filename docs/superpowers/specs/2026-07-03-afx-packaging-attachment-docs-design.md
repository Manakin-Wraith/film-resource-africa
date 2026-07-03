# AFX — Packaging Attachment Documents (CV + Contract) Design

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` — the Live Slate packaging drawer's Packaging section gains per-attachment CV + Contract document slots
**Builds on:** the Live Slate packaging drawer (`LiveProjectDrawer`), the confidential `Project.docs[]` array + `/api/afx/documents/*` routes, and the single FRA↔producer NDA (`ndaSigned`).

## Problem

A packaging attachment (a person attached to a live project — e.g. "Director ·
Gerhard Mostert · signed") currently captures only role / name / status. Producers
need to back each attachment with that person's **CV** and their **contract** (deal),
to strengthen the project's credibility. There is no way to attach documents to a
specific packaging person today.

## Goal

Give each packaging attachment two fixed, NDA-gated document slots — **CV** and
**Contract** — in the `LiveProjectDrawer` Packaging section. One document per slot
(re-upload replaces). The documents are **confidential** (producer + FRA only, behind
the NDA) and must never reach the funder view.

## Key constraint (drives the whole design)

Packaging attachments live in `ProjectAsk.packaging`, and `ask` is **funder-visible**:
`funderView.stripExact` removes only `exact` / `docs` / `softFunding`, not `ask`.
Therefore per-attachment documents **cannot** be stored on the attachment object
(that would leak filenames/metadata to funders). They live in the confidential,
already-stripped `Project.docs[]` array, **linked** to the attachment by id.

## Confirmed decisions

1. **Two fixed slots per attachment:** CV + Contract. One document each; re-upload
   replaces the existing one in that slot.
2. **Storage model:** documents live in `Project.docs[]` (confidential, already
   stripped from the funder view), each tagged with a `packagingId` (the attachment's
   id) and a category. Rejected: storing on the attachment (funder leak) or a separate
   `packagingDocs` structure (duplicates the doc concept).
3. **Category keys:** `talent_cv` / `talent_contract` (unambiguous vs. the existing
   individual-vetting `cv`), labels "CV" / "Contract".
4. **Row removal hard-deletes** the attachment's linked documents from storage (calls
   the delete route per linked doc), not just drops metadata. Slot "Clear" likewise
   hard-deletes (consistent with the existing uploader).
5. **NDA-gated**, live drawer only (case studies have no `ask.packaging`). No migration.

## Architecture

### Data model — `src/lib/afx/types.ts`
- `PackagingAttachment` gains **`id?: string`** (optional for back-compat; the drawer
  backfills any missing ids on load; `addPackaging` sets one). Stable id also fixes
  the earlier index-key observation.
- `AfxDocument` gains **`packagingId?: string`** — links a doc to a packaging
  attachment. Absent = a project-level document (today's behaviour).
- `DocumentCategory` widened with **`'talent_cv' | 'talent_contract'`**.

### Constants — `src/lib/afx/documents.ts`
- Add `talent_cv` / `talent_contract` to `DOCUMENT_CATEGORY_LABELS`
  (`Record<DocumentCategory, string>`) — labels "CV" / "Contract". (The existing
  `LIVE_DOCUMENT_CATEGORY_LABELS` is also `Record<DocumentCategory, string>` and must
  gain the two keys too, or `tsc` errors on the incomplete record.)
- New `PACKAGING_DOC_CATEGORIES: readonly DocumentCategory[] = ['talent_cv', 'talent_contract']`.
  **Not** added to `LIVE_DOCUMENT_CATEGORIES`, so the packaging categories never appear
  in the project-level "Supporting documents" dropdown.

### Backend — `src/app/api/afx/documents/upload/route.ts`
Two small changes:
- Widen the `case_study`-scope allow-list to include the packaging categories:
  `[...DOCUMENT_CATEGORIES, ...LIVE_DOCUMENT_CATEGORIES, ...PACKAGING_DOC_CATEGORIES]`.
- Read an optional `packagingId` form field and, when present, include it on the
  returned `AfxDocument`. (The delete + sign routes are unchanged — they key on
  `path`, which is unaffected.)

### Pure logic — `src/lib/afx/liveProject.ts`
- `addPackaging(p)` — new rows get `id: crypto.randomUUID()`.
- `removePackaging(p, index)` — additionally drop every `Project.docs` entry whose
  `packagingId` equals the removed row's `id` (state cleanup; the drawer performs the
  storage hard-delete around this, see below).
- `backfillPackagingIds(p): Project` — return `p` with an `id` assigned to any
  packaging row lacking one (pure; used by the drawer on load).
- Per-slot doc mutations reuse the existing status-agnostic `Project.docs` helpers
  (`addDocument` / `removeDocument`); "replace" = remove any existing doc matching
  `(packagingId, category)` then add the new one.

### Component — `src/components/afx/producer/PackagingDocSlot.tsx` (new)
A lean single-slot uploader (one per CV / Contract), NDA-gated, mirroring the
upload / sign-to-view / delete fetch logic already in `AfxDocumentUpload`:
- Props: `{ projectId: string; packagingId: string; category: 'talent_cv' | 'talent_contract'; label: string; doc?: AfxDocument; onReplace: (doc: AfxDocument) => void; onClear: () => void }`.
- Empty: a "↑ {label}" upload button. Uploads via `POST /api/afx/documents/upload`
  with `scope=case_study`, `caseStudyId=projectId`, `category`, and `packagingId`;
  on success calls `onReplace(returnedDoc)`.
- Filled: `{label}: filename · View · Clear`. **View** posts to `.../sign` and opens
  the signed URL. **Clear** posts to `.../delete` (hard-delete from storage) then
  calls `onClear()`.
- Same type/size validation + inline error surface as `AfxDocumentUpload`.

### Drawer wiring — `src/components/afx/producer/LiveProjectDrawer.tsx`
- On load: run `backfillPackagingIds` on the cloned draft so every packaging row has
  a stable id.
- **Project-level** `AfxDocumentUpload` now receives `docs={(proj.docs ?? []).filter(d => !d.packagingId)}`
  so per-attachment docs don't double-list there. Its `onAdd`/`onRemove` still operate
  on `proj.docs` via the existing helpers (project-level docs carry no `packagingId`).
- Each packaging row renders two `PackagingDocSlot`s (CV, Contract) when `ndaSigned`,
  else the shared "sign the FRA NDA…" hint. Each slot's `doc` is looked up from
  `proj.docs` by `(packagingId === row.id, category)`; `onReplace` removes any existing
  matching doc then adds the new one; `onClear` removes it from `proj.docs`.
- **Row removal** becomes async: gather the row's linked docs, `await` a delete call
  per linked doc (hard-delete storage), then `setProj(p => removePackaging(p, index))`.
  On a delete failure, surface the error and leave the row (do not partially remove).

### Funder view — no change
`Project.docs` is already stripped by `stripExact`; `packagingId` on a stripped doc is
irrelevant, and `packaging.id` is harmless to funders. `funderView.ts` is untouched.

## Data flow

1. Producer adds a packaging row (gets an `id`); with the NDA signed, two slots appear.
2. Upload CV/Contract → `POST /upload` (immediate) → returned `AfxDocument` (carrying
   `packagingId` + category) appended to `proj.docs`, replacing any prior same-slot doc.
3. Save merges `proj` into `draft.slate` → existing `persistProfileAction`.
4. Re-open: slot lookups by `(packagingId, category)` rehydrate the filenames.
5. Clear a slot or remove a row → hard-delete via `/delete` → drop from `proj.docs`.

## Error handling

- Upload/type/size/lock errors: inline per slot (same as `AfxDocumentUpload`).
- A live project has no open submission, so the edit-lock never blocks these; if a
  future submission exists the routes return 409 and the slot shows it.
- Row-remove delete failure: surfaced; the row and its docs are left intact.

## Testing

No test runner. Verify with:
- `npx tsc --noEmit -p tsconfig.json` + `npx next build`.
- **Pure-logic assertions** (`npx tsx`, deleted after): `addPackaging` sets a non-empty
  `id`; `removePackaging` drops docs whose `packagingId` matches the removed row (and
  keeps unrelated docs, incl. project-level docs with no `packagingId`);
  `backfillPackagingIds` assigns ids only to id-less rows and leaves existing ids
  untouched; immutability throughout.
- **Browser on prod** (Gerhard): open a live project's drawer → a packaging row shows
  CV + Contract slots (NDA signed); upload a CV and a contract, re-open to confirm both
  persist and the filenames rehydrate; confirm they do NOT appear in the project-level
  "Supporting documents" list; Clear one slot (confirm it disappears); remove the row
  (confirm both linked docs are gone); toggle Funder preview and confirm no doc metadata
  leaks.

No migration, no new RLS/policy, no funder-view change.

## YAGNI (explicitly not building)

- No third slot / arbitrary per-attachment document list (two fixed slots only).
- No packaging docs on the case-study drawer (no `ask.packaging` there).
- No new upload scope or storage path (reuses `scope=case_study`).
- No `funderView` change, no migration.
- No staff-review surfacing of these docs (that is the phase-2/3 marketplace track).
