# AFX — Collapse Entity Vetting to a Verified Card (Design)

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` — Company / Entity Vetting section

## Problem

Today the **Company / Entity Vetting** panel on `/afx/producer` renders the same
working UI regardless of whether the entity has already been verified by FRA.
Even after verification a producer still sees:

- editable document uploads (add / replace category / remove),
- an active **Submit entity for vetting** button.

Once FRA has verified the entity, the verified entity is the source of truth.
The working UI is clutter and invites needless churn (re-uploading, re-submitting
over an already-verified entity).

## Goal

When a producer's entity is verified, replace the working vetting panel with a
small, read-only confirmation card. Verified is terminal from the producer's
side — no self-serve re-open, no re-submit.

## Trigger — the source of truth

The collapse is driven **solely** by `draft.entityVerifiedAt` (the producer
profile field hydrated from `afx_producers.entity_verified_at`).

- `entityVerifiedAt` is written **only** by the staff review Approve action and is
  DB-trigger-protected against forgery from the `authenticated`/`anon` roles;
  `persistProfile` strips it on write. It is the durable, staff-authoritative
  marker — a stronger signal than the submission status.
- It is available on the producer client: `loadProducerState` obtains the full
  `afx_producers` row via `redeem_afx_invite()` (`returns public.afx_producers`),
  and `rowsToProfile` sets `profile.entityVerifiedAt` when the column is non-null.
  **No data-path, RPC, or migration change is required.**

Behavior by state:

| State | Panel |
|-------|-------|
| `entityVerifiedAt` set (verified) | **Compact verified card** (new) |
| no submission / `submitted` / `under_review` / `changes_requested` / `withdrawn` | Existing working panel, **unchanged** |

Because the trigger is only `entityVerifiedAt`, if FRA ever clears the marker
(out-of-band re-verification), the full working panel returns automatically. The
producer gets no re-open button.

## The compact verified card

Rendered inside the existing `Company / Entity Vetting` `SectionCard`, in its
current page position (section #4, directly under Account & Visibility).

Contents:

1. A green confirmation line: **✓ Company verified** · *verified {date}*, where
   the date is formatted from `entityVerifiedAt` (e.g. `2026-06-30`).
2. A read-only list of the on-file entity documents. Each row shows the document
   **category label** (via `ENTITY_DOCUMENT_CATEGORY_LABELS`) and **filename**,
   plus a working **View** button that opens a signed URL through the existing
   `/api/afx/documents/sign` → `window.open` pattern.

The card has **no** upload button, **no** category selector, **no** remove (×),
and **no** submit / withdraw footer. View is the only action.

## Components

- **New:** `src/components/afx/producer/EntityVerifiedCard.tsx`
  - Props: `{ verifiedAt: string; docs: AfxDocument[] }`.
  - `'use client'`; owns the `View` handler (fetch `/api/afx/documents/sign`,
    open the returned URL in a new tab; surface an inline error on failure).
  - Read-only; renders the confirmation line + doc list described above.
- **Modified:** `src/components/afx/producer/EntityVettingPanel.tsx`
  - At the top of the render, branch: if `draft.entityVerifiedAt` is truthy,
    return `<EntityVerifiedCard verifiedAt={draft.entityVerifiedAt} docs={draft.entityDocs ?? []} />`
    inside the same `SectionCard`. Otherwise render the current working body
    unchanged.
  - No prop signature change to `EntityVettingPanel`; the parent
    (`ProducerProfileClient`) keeps passing the same props. The submit/withdraw
    handlers remain wired for the non-verified branch.

## Out of scope

- No change to the staff review flow, `entity_verified_at` writes, or triggers.
- No producer-facing re-open / re-submit / doc-replace after verification.
- No change to NDA, Account & Visibility, or any other producer section.
- No new data model, migration, RPC, or server action.

## Verification

Project has no test runner (per `project-afx-prod-and-vetting`): verify with
`npx tsc --noEmit -p tsconfig.json`, `npx next build`, and a browser check on
prod. Gerhard Mostert's entity is verified in prod, so the verified card renders
live for that account; a non-verified producer (or one with an open/withdrawn
submission) must still show the unchanged working panel.
