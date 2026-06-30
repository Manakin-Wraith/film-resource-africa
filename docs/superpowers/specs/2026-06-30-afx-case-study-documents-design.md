# AFX Case-Study Documents — Design Spec

**Date:** 2026-06-30
**Status:** Approved in brainstorm; ready for implementation planning.
**Scope:** Let a producer upload **confidential supporting documents** (budget, chain of title, financing/distribution agreements, completion bond, audit) to a case study, tagged by category, stored privately and visible only to the producer and FRA. Builds on the Track Record capture slice.

---

## 1. Context & where this fits

The Track Record slice (PR #19) lets a producer build case studies and attach **public evidence links** (IMDB, trade reviews). It explicitly deferred **file uploads** (spec §7: "links only, no asset storage"). This slice adds that: confidential **document uploads** as a parallel capability to the public links.

These documents — budget/cost reports, chain of title, financing and distribution agreements, completion bond certificates, audits — are **confidential vetting evidence**. They belong to the same privacy class as the NDA-gated exact figures: producer + FRA only, **never funder-visible**. They are the proof FRA's producer-vetting gate (S2) will examine.

**Decisions locked in brainstorm:**
- **Visibility:** producer + FRA only. Never shown to funders.
- **Categories:** a curated, tagged set (fixed dropdown), so FRA gets structured, recognizable document types.
- **NDA gate:** uploading requires the producer to have signed the FRA NDA (same gate as exact figures) — the NDA governs FRA's handling of these materials.

## 2. Goal & success criteria

**Goal:** an NDA-signed producer can attach categorized confidential documents to a case study, view/remove them, and they persist privately — never reaching a funder.

**Done when:**
1. A new **Documents** section appears in the case-study drawer **only when the producer has signed the FRA NDA** (otherwise a hint to sign it).
2. The producer can **upload** a document, pick its **category**, see filename + size, **View** it (opens a short-lived signed URL), and **Remove** it.
3. Documents are stored in a **private** Storage bucket; no public URL exists; access is server-mediated with ownership checks.
4. Document metadata persists in an **isolated column** (`afx_projects.docs`), never in the funder-visible `body`.
5. The funder view (`toFunderView`) cannot expose documents at the type level or at runtime.
6. The upload route enforces ownership **and** the NDA gate server-side (defense in depth).

## 3. Privacy architecture (the spine)

Files live in a new **private** Supabase Storage bucket **`afx-documents`** (`public = false`) — unlike the existing public `member-images` bucket. No client touches storage directly; all access is mediated server-side with the service-role key, mirroring `/api/members/upload-image` but with ownership checks instead of public URLs.

- **Upload** — `POST /api/afx/documents/upload` (multipart: `file`, `caseStudyId`, `category`). Server: `getSessionUser()` → resolve the caller's `afx_producers` row → verify the `caseStudyId` is one of that producer's `afx_projects` → verify `producer.profile.ndaSigned === true`. Validate type + size. Write to `afx-documents/${producerId}/${caseStudyId}/${docId}.${ext}`. Return metadata (no URL).
- **View/download** — `POST /api/afx/documents/sign` (body: `caseStudyId`, `path`). Ownership check → `createSignedUrl(path, 60)` → return the short-lived URL. The file is never publicly reachable.
- **Delete** — `POST /api/afx/documents/delete` (body: `caseStudyId`, `path`). Ownership check → `storage.remove([path])`. The client drops the metadata from the buffer.
- **FRA vetting (S2)** reads via service-role; never the producer-facing path.

**Load-bearing invariant:** document metadata lives in the isolated `docs` lane, parallel to the NDA `exact` column, and is **never serialized to the funder view** — budget/legal filenames and paths stay off the funder boundary entirely.

## 4. Data model + migration

New types in `src/lib/afx/types.ts`:

```ts
export type DocumentCategory =
  | 'budget' | 'chain_of_title' | 'financing_agreement'
  | 'distribution_agreement' | 'completion_bond' | 'audit' | 'other';

export interface AfxDocument {
  id: string;            // crypto.randomUUID()
  path: string;          // storage key: producerId/caseStudyId/docId.ext
  filename: string;      // original name, for display
  category: DocumentCategory;
  sizeBytes: number;
  contentType: string;
  uploadedAt: string;    // ISO timestamp
}
```

Add `docs?: AfxDocument[]` to `Project`.

**Migration** (`supabase/migrations/<date>_afx_documents.sql`) — confidential, so `docs` gets its own isolated column (it can NOT ride the funder-visible `body`):

```sql
alter table public.afx_projects add column docs jsonb;

insert into storage.buckets (id, name, public)
values ('afx-documents', 'afx-documents', false)
on conflict (id) do nothing;
-- No client storage policies: all access is service-role-mediated via the API routes.
```

Applied via the Supabase Dashboard SQL editor (the connected MCP cannot reach the prod project), same as the S1 migrations.

**Persistence mappers** (`src/lib/afx/persistence.ts`): `projectToRow` splits `docs` into the new `docs` column (alongside `exact`), never into `body`; `projectFromRow` re-stitches it. `ProjectRow` gains `docs: AfxDocument[] | null`. The `loadProducerState` select adds the `docs` column.

## 5. Funder boundary

`src/lib/afx/funderView.ts`: `FunderProject = Omit<Project, 'exact' | 'docs'>`; the strip function deletes both `exact` and `docs` at runtime. Documents cannot reach a funder view at the type level or at runtime. (`computeAggregates`/`deriveVisibility` never read `docs`.)

## 6. Drawer UX

A new **Documents** section in `CaseStudyDrawer`, rendered **only when `ndaSigned`** (same gate as the exact-budget field). When the NDA is unsigned, the section shows a short hint: "Sign the FRA NDA to attach confidential documents."

- Each document row: filename · **category** dropdown (the curated set) · size · **View** (fetches a 60-second signed URL and opens it) · **Remove** (calls the delete route, then drops the row).
- An **"+ Upload document"** button opens the file picker and uploads immediately (mirroring the members `ImageUpload` flow: client posts multipart to the upload route, shows uploading/error state, appends the returned metadata to the drawer buffer).
- A new client component **`AfxDocumentUpload`** (`src/components/afx/producer/AfxDocumentUpload.tsx`) handles file selection, the upload POST, progress/error UI, and the View/Remove signed-URL calls — styled in the AFX system (inline styles + `var(--afx-*)`), not the dark members styling.

Categories surface via a label map (e.g. `DOCUMENT_CATEGORY_LABELS`) in `constants.ts`, consistent with `EVIDENCE_CLAIM_LABELS`.

## 7. Validation

- **Allowed types:** PDF, PNG, JPG/JPEG, and (optionally) DOCX/XLSX. Enforced both client-side (pre-flight) and server-side (authoritative).
- **Max size:** ~25 MB (legal/financial PDFs run large). Defined once server-side; mirrored in the client constant.
- **NDA gate:** enforced in the upload route, not just the UI.
- Filenames stored for display as-provided; the storage path uses the generated `docId` + extension (never the raw filename) to avoid path/charset issues.

## 8. Orphan handling

Files upload immediately, so a Cancel (or upload-then-never-save) can leave an unreferenced file in the bucket. MVP approach:
- An explicit **Remove** deletes the file immediately.
- **Orphans-on-cancel are accepted** for MVP and swept later by a reconcile job (any `afx-documents` path not referenced by any case study's `docs` is deletable). This reconcile is **out of scope** for this slice; it is recorded as a tracked risk.

## 9. Out of scope (later slices)

- **Virus/malware scanning** of uploads.
- **In-browser preview / thumbnails** — View opens the signed URL in a new tab; no embedded viewer.
- **Document versioning / replace-in-place** — re-upload adds a new row; Remove deletes.
- **The FRA vetting/admin view** of these documents → S2.
- **Funder visibility** of documents — permanently excluded by the privacy model.
- **The orphan-reconcile job** (see §8).

## 10. Risks & decisions

- **First AFX private bucket.** Get the server-mediated access right: no public URL, no client storage policy, every route checks ownership + (for upload) the NDA. Verify a non-owner cannot obtain a signed URL for another producer's path.
- **Migration required** (unlike Track Record): a new `docs` column + the private bucket. Additive; touches no existing column.
- **`docs` isolation must never regress:** keep `docs` out of `body` and out of the funder view, exactly as `exact` is handled — so the S2 funder/publish work inherits the boundary for free.
- **Immediate-upload orphans:** accepted for MVP (see §8); the explicit-Remove path keeps the common case clean.

## 11. Open questions

- None blocking. Future: whether DOCX/XLSX should be allowed at launch or PDF-and-images only (decided at planning per FRA's document norms); whether to move to deferred-upload-on-Save if orphan volume becomes a problem.
