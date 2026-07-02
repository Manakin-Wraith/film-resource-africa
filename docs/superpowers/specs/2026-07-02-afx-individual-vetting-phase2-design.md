# AFX — Individual Vetting (Phase 2) Design

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` individual-vetting path + staff review + verification marker
**Builds on:** Phase 1 (`producer-type`, shipped `b35f30d`) and the combined spec
`2026-07-02-afx-producer-type-and-individual-vetting-design.md` (this doc is the
detailed Phase 2 design and supersedes that doc's Phase-2 stub).

## Problem

Phase 1 lets a producer declare `producerType = 'individual'` and become
funder-visible via the reused `entityK2` gate, but freelancers still have **no way
to be vetted** — the only vetting path is entity vetting (company docs). Individual
producers need a parallel path: prove themselves with a **CV + professional links**.

## Goal

Add an **individual vetting** path that mirrors entity vetting end-to-end: a
producer-side panel (CV + links), a submit/readiness gate, staff review through the
existing queue, and a staff-only `individual_verified_at` marker — reusing the
verified-card collapse.

## Confirmed decisions

1. **CV is not NDA-gated.** A CV is the freelancer's own professional document;
   they can upload + submit without signing the FRA NDA. (The NDA still gates
   exact-figure entry on projects.) Entity docs remain NDA-gated.
2. **Professional links are a fixed set:** IMDb, LinkedIn, Portfolio/site — three
   optional labelled URL fields. Stored in the profile blob (not confidential).
3. **Staff verify whole-submission:** review CV + links together, then Approve
   (→ `individual_verified_at`) or Request changes. No per-item provenance.
4. **Readiness = gate ON + CV present.** `isIndividualVettingReady` requires the
   reused `entityK2` gate on AND a CV document — mirrors `isEntityVettingReady`.
   Links are optional.

## Data model + migration

Producer-run on prod (MCP can't reach the prod project — see
`project-afx-prod-and-vetting`): supply SQL, wait for "SQL has run," then run live
gates.

- `alter table public.afx_producers add column if not exists individual_docs jsonb;`
- `alter table public.afx_producers add column if not exists individual_verified_at timestamptz;`
- An anti-forge `BEFORE UPDATE` trigger blocking `authenticated`/`anon` from
  changing `individual_verified_at`, mirroring the existing
  `afx_producers_guard_verified` trigger for `entity_verified_at` (service-role +
  migrations pass through; producer path cannot forge it).

Types (`src/lib/afx/types.ts`):
- `export type IndividualDocumentCategory = 'cv' | 'other';`
- `VettingKind` gains `'individual'` → `'case_study' | 'entity' | 'individual'`.
- `ProducerProfile` gains: `individualDocs?: AfxDocument[]` (isolated column, like
  `entityDocs`), `individualVerifiedAt?: string` (staff-only marker, like
  `entityVerifiedAt`), and `individualLinks?: { imdb?: string; linkedin?: string;
  portfolio?: string }` (profile blob).

Documents (`src/lib/afx/documents.ts`):
- `INDIVIDUAL_DOCUMENT_CATEGORIES = ['cv', 'other']`, labels (`cv` → "CV /
  résumé", `other` → "Other"), `REQUIRED_INDIVIDUAL_DOCUMENT_CATEGORIES = ['cv']`,
  `missingRequiredIndividualDocs`, and `isIndividualVettingReady({ entityK2,
  individualDocs })` = `entityK2 === true && no missing required docs`.

Persistence (`src/lib/afx/persistence.ts`):
- `rowsToProfile` hydrates `individualDocs` + `individualVerifiedAt` from the new
  columns (like the entity lanes); `individualLinks` rides in the profile blob.
- `profileToRows` strips `individualDocs` + `individualVerifiedAt` (anti-forge /
  isolation), exactly like `entityDocs`/`entityVerifiedAt`. `ProducerRow` type +
  every select that reads entity lanes also reads the individual lanes.
- `producerStore.persistProfile` locks `individual_docs` to stored values while an
  individual submission is open (mirrors the entity-doc lock), and never writes
  `individual_verified_at`.

## Producer UI

New `IndividualVettingPanel` (parallel to `EntityVettingPanel`). The producer page
renders **one** based on `producerTypeOf(draft)`:
- `company` → `EntityVettingPanel` (unchanged), section "Company / Entity Vetting".
- `individual` → `IndividualVettingPanel`, section "Individual Vetting".

`IndividualVettingPanel`:
- CV upload (no NDA gate) via the existing document component/pipeline, category
  `cv` (required) + optional `other` supporting docs.
- Three optional link fields (IMDb / LinkedIn / Portfolio), patched into
  `individualLinks`.
- A readiness hint + Submit button enabled when `isIndividualVettingReady` (gate on
  + CV). Submit/withdraw mirror the entity panel.
- When `individualVerifiedAt` is set → collapses to a read-only verified card (CV +
  links, View only), reusing the verified-card pattern (a small
  `IndividualVerifiedCard`, sibling to `EntityVerifiedCard`).

## Submit + document pipeline

- Upload route: add `scope === 'individual'` (allowed categories =
  individual categories; segment `individual`; `hasOpenSubmission(..., 'individual',
  null)` block while open). Path: `producerId/individual/<docUuid>.<ext>`.
- `isOwnedDocPath`: add `individual` to the allowed path segment alternation
  (`(?:entity|individual|<uuid>)`).
- `hasOpenSubmission` `kind` param gains `'individual'`.
- `submitForVetting({ kind: 'individual' })`: checks `isIndividualVettingReady`,
  inserts `kind='individual', target_id=null, status='submitted'`. Withdraw + lock
  behave as entity.

## Staff review

Reuses the existing queue + drill-down:
- `listSubmissions` already handles `target_id=null` (targetTitle null) — individual
  rows appear in the queue with no code change.
- `getSubmissionDetail` selects `individual_docs, individual_verified_at` too and
  returns them on the profile.
- `StaffSubmissionDetail` renders the CV + links (read-only, View) for
  `kind==='individual'`, similar to how it renders entity docs; the "✓ verified
  company" badge (line 76) becomes type-aware ("✓ verified individual" when the
  producer is individual / has `individualVerifiedAt`).
- `decide('approve')`: the existing `sub.kind === 'entity'` branch gains
  `|| sub.kind === 'individual'` → sets `individual_verified_at` (else
  `entity_verified_at`). Request-changes path is shared, unchanged.

## Verified-marker coupling (scoped)

`entity_verified_at`'s only consumers today are the producer-side collapse and one
staff badge (`StaffSubmissionDetail:76`) — there is **no rating-cap coupling**. So
Phase 2 does NOT introduce a broad `operatorVerifiedAt`: it wires
`individualVerifiedAt` into the individual collapse and makes the staff badge
type-aware. Nothing in rating/visibility logic changes.

## Out of scope

- No per-item (CV/link) provenance.
- No NDA requirement for the CV.
- No change to entity vetting, case-study vetting, or `deriveVisibility`.
- No funder-view rendering of links (future).

## Verification

No test runner: `npx tsc --noEmit` + `npx next build`; a live supabase-js gate in
repo root for the new columns + anti-forge trigger (insert as producer role must be
blocked from setting `individual_verified_at`; service-role sets it) + the
pending-only lock, deleted after. Then browser checks on prod:
- Individual producer: CV upload (no NDA), links, Submit enabled only when gate on +
  CV present; submit locks the CV.
- Staff: individual submission in queue → drill-down shows CV + links → Approve sets
  `individual_verified_at` → producer panel collapses to the verified card.
- Anti-forge: producer cannot set `individual_verified_at` from their own persist.
