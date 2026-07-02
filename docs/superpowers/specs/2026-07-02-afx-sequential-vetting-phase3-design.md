# AFX — Sequential Vetting (Phase 3) Design

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` vetting flow + submit guard
**Builds on:** Phase 1 (`producer-type`, `b35f30d`) and Phase 2 (`individual-vetting`, `8a8bc5a`, on prod). This supersedes the Phase-2 model where the producer page rendered EXACTLY ONE vetting panel XOR'd by `producerType`.

## Problem

Phase 2 made individual and entity vetting **mutually exclusive** by type:
`producerType==='individual'` → Individual Vetting; `'company'` → Entity Vetting.
That means a company producer is never vetted as a *person*, and the two
verifications can never both be earned. FRA's actual criterion is that a
company-affiliated producer is vetted as **both** the individual operator
**and** their entity.

## Goal

Make vetting **sequential and additive**: every producer is vetted as an
individual first; company producers then unlock entity vetting. Full
verification = the individual marker (freelancer) or **both** markers
(company). This is a UI restructure plus one server-side gate — **no schema
change** (all columns/markers exist from Phase 2).

## Confirmed decisions

1. **Who:** Every producer does individual vetting first. Company producers
   (`producerType==='company'`) then also do entity vetting. Freelancers
   (`producerType==='individual'`) stop after individual (no entity to vet).
2. **Sequencing:** **Hard gate.** Entity vetting is locked until
   `individual_verified_at` is set — enforced in the UI (locked placeholder,
   no controls) AND server-side (submit rejected, entity-doc upload rejected).
3. **Fully vetted:** individual verified (freelancer) or both markers
   (company). **Display-only** this phase — NO change to `deriveVisibility`,
   rating bands, or caps.
4. **Legacy:** a company producer already `entity_verified_at` but never
   individually vetted keeps the earned entity verified-card (never stripped).
   They simply also see the (unverified) individual section prompting a CV.
   The hard gate applies only to **new** entity submissions; a legacy entity is
   already verified and never re-submits, so it is never blocked.
5. **Status display:** the existing per-section verified cards ARE the status.
   NO new global "fully vetted" pill.

## Architecture

Replace the single XOR vetting slot with **two conditionally-stacked
sections** in `ProducerProfileClient.tsx`, in this order (fits the existing
reorder): Operator Identity → Confidentiality (NDA) → Account & Visibility →
**Individual Vetting → [Company / Entity Vetting]** → Track Record → Live
Slate → Financial Aggregates.

### Individual Vetting section — ALWAYS rendered (all producers)
Unchanged from Phase 2: `IndividualVettingPanel` branches on
`individualVerifiedAt` → `IndividualVerifiedCard` (read-only) else the working
panel (CV upload + links + submit/withdraw). No behavior change; it simply is
no longer hidden for company producers.

### Company / Entity Vetting section — rendered ONLY when `producerTypeOf(draft)==='company'`
Three states, selected in this priority:
1. `draft.entityVerifiedAt` truthy → `EntityVerifiedCard` (existing). Shown
   regardless of individual status — an earned marker is never hidden
   (legacy-safe).
2. else `!draft.individualVerifiedAt` → **NEW `EntityVettingLockedCard`**: a
   compact disabled placeholder (sibling to `EntityVerifiedCard`), hint
   "Complete individual vetting first to unlock company vetting." No upload,
   submit, or withdraw controls.
3. else (individual verified, entity not yet) → existing working
   `EntityVettingPanel` (unchanged: entity-doc upload NDA-gated, submit/withdraw).

Freelancers (`producerType==='individual'`) never render this section.

### Server-side hard gate (defense-in-depth — the UI gate is not the only gate)
- `submitForVetting({ kind:'entity' })` (`vettingStore.ts`): reject when the
  producer's `individual_verified_at` is null, with an error consistent with
  the existing readiness failures. The existing `isEntityVettingReady`
  (entityK2 + entity docs) check remains; this adds the individual-verified
  precondition.
- Entity-scope document upload (`api/afx/documents/upload/route.ts`): reject
  `scope==='entity'` when `individual_verified_at` is null (mirrors the submit
  gate so entity docs cannot be staged before the gate opens). NDA-gating on
  entity scope is unchanged and still applies on top.
- Individual-scope and case-study paths are untouched.

## Data model

**No migration.** `individual_docs`, `individual_verified_at`, `entity_docs`,
`entity_verified_at`, the anti-forge trigger, the widened `kind` CHECK, and
both unique open-submission indexes all already exist (Phases 1–2). This phase
adds no columns, constraints, or triggers.

## Type-toggle edge case (accepted, documented)

If a producer switches `producerType` company→individual while an entity
submission/docs exist, the entity section simply stops rendering; the
underlying entity submission/docs are not deleted (staff may still see them).
Preventing the toggle mid-entity-review is out of scope (consistent with the
Phase-1 deferral of `producerType` from `VETTED_ENTITY_FIELDS`). Switching
back to company re-reveals the section in its correct state.

## Copy

- Individual Vetting section retains its label; for company producers its
  intent is "vet the operator behind the company" — a one-line type-aware hint
  is acceptable but not required.
- Locked entity card hint: "Complete individual vetting first to unlock
  company vetting."

## Out of scope

- Any `deriveVisibility` / rating / cap change (Phase 3 is display + gate only).
- A global "fully vetted" status pill (per decision 5).
- The staff-queue "Untitled case study" null-target label (a separate,
  pre-existing bug affecting both individual and entity rows — recommended as a
  small companion fix but NOT part of this plan).
- Preventing the producerType toggle during an open entity review.

## Verification

No test runner: `npx tsc --noEmit -p tsconfig.json` + `npx next build`, plus
tsx/live assertion scripts in repo root (deleted after) for the server gate.
Then browser checks on prod (Gerhard's account is currently individual-type
with an approved individual submission + a legacy `entity_verified_at`, making
it a useful legacy test case once switched back to company):
- **Company producer, not yet individually verified:** entity section shows the
  locked card (no controls); individual section shows the working panel.
- **Server gate:** a direct `submitForVetting({kind:'entity'})` with individual
  not verified is rejected; an entity-scope upload is rejected.
- **After individual approval:** entity section unlocks to the working panel;
  entity submit → staff approve → `entity_verified_at` set → both verified
  cards show (fully vetted).
- **Legacy:** a company producer with `entity_verified_at` set but no
  `individual_verified_at` shows the entity verified-card AND the working
  individual panel; nothing is stripped.
- **Freelancer:** only the individual section renders; no entity section.
