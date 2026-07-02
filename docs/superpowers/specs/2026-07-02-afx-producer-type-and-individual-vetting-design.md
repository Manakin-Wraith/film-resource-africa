# AFX — Producer Type, Region, and Individual Vetting (Design)

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` Operator Identity + the operator-vetting path + visibility/rating logic

## Problem

AFX today assumes every producer is a **company/entity**: Operator Identity has a
"Legal entity" field, the `entityK2` knockout gate means "legal entity in place,"
and the only operator-vetting path is **entity vetting** (company registration /
director ID / tax docs → `entity_verified_at`). `deriveVisibility` **requires
`entityK2`**, so an **individual / freelance** producer with no legal entity is
permanently hidden from funders and has no way to be vetted.

We also only capture a free-text `location` (e.g. "Cape Town"), which is
unstructured and currently the sole driver of currency (`location.endsWith('ZA')
→ ZAR`).

## Goal

Support **individual/freelance** producers alongside **company** producers:
an explicit type toggle, a structured Country field, and a parallel
**individual vetting** path (CV + professional links) that unlocks the same
visibility a verified company gets.

## Decisions (all confirmed)

1. **Producer type** is an explicit toggle in Operator Identity: `producerType:
   'individual' | 'company'`. Stored in the profile blob (client-authoritative,
   no migration). **Defaults to `company`** so all existing producers are
   unchanged.
2. Type drives which identity fields show and which vetting path appears.
3. **Individual verification is the K2-equivalent.** The `entityK2` boolean is
   **reused as a generic "operator standing" gate**; only its label/copy is
   type-aware. `deriveVisibility` is unchanged — a freelancer becomes
   funder-visible once the gate is on + `consentK4` + a screenable project,
   exactly like a company.
4. **Country** is a structured dropdown: the 54 African countries + an
   "Other / International" option, default **South Africa**. It sits alongside
   the existing `location` (relabeled **City / base**). Country replaces the
   `location.endsWith('ZA')` currency check: **South Africa → ZAR, else USD.**
5. **Individual vetting proof:** a **CV/résumé document is required**; **IMDb /
   LinkedIn / portfolio links are optional** supporting evidence.

## Model

### Identity fields by type
- **Company** (unchanged): name (producer/company), **Legal entity**, Country,
  City, bio, relationships.
- **Individual:** name (producer), Country, City, bio, relationships — the
  **Legal entity** field is **hidden**.

### Type-aware gate (reused `entityK2`)
- Company label: "Legal entity / structure."
- Individual label: "Individual / professional standing."
- `deriveVisibility` / rating-cap logic keep reading `entityK2` verbatim — no
  branching, no new column.

### Vetting path (type-aware)
The current "Company / Entity Vetting" card becomes type-aware:
- **Company:** existing entity vetting → `entity_verified_at`.
- **Individual — new "Individual Vetting":**
  - **CV/résumé** upload (required) — a confidential document, isolated exactly
    like `entity_docs` (see migration). Stored in a new `individual_docs` column.
  - **Professional links** (optional): IMDb, LinkedIn, portfolio/website — stored
    in the profile blob (not confidential), each a labelled URL.
  - Verified via a new staff-only marker **`individual_verified_at`**, protected
    by the same anti-forge `BEFORE UPDATE` trigger pattern as
    `entity_verified_at` (blocks `authenticated`/`anon` from setting it; only the
    service-role staff review action writes it).
  - A new **`VettingKind = 'individual'`**; the staff review surface handles it
    like `entity` (start review → verify → approve sets `individual_verified_at`
    / request changes).
  - Reuses the **verified-card collapse** pattern (shipped 2026-07-02): once
    `individual_verified_at` is set, the panel collapses to the read-only
    verified card (CV + links, View only).

### Verified-operator marker (rating/UI)
Introduce a derived `operatorVerifiedAt = entityVerifiedAt ?? individualVerifiedAt`.
Everywhere `entity_verified_at` currently drives rating cap / verified badges,
read the derived value so an individual-verified freelancer gets the same
treatment.

## Data model / migration

Producer-run on prod (MCP cannot reach the prod project — see
`project-afx-prod-and-vetting`): supply SQL, wait for "SQL has run," then run
live gates.

- `alter table public.afx_producers add column if not exists individual_verified_at timestamptz;`
- `alter table public.afx_producers add column if not exists individual_docs jsonb;`
- An anti-forge `BEFORE UPDATE` trigger on `individual_verified_at` mirroring the
  `afx_producers_guard_verified` trigger for `entity_verified_at`.
- No column for `producerType`, `country`, or professional links — they live in
  the profile blob.

The producer persist path must strip `individual_verified_at` (like
`entityVerifiedAt`) and lock `individual_docs` while an individual submission is
open (mirroring the `entity_docs` lock).

## Phasing

Ship as two PRs (mirrors the producer-onboarding A/B split):

- **Phase 1 — Identity & region:** `producerType` toggle, Country dropdown +
  currency-from-country, type-aware identity fields (hide Legal entity for
  individuals), type-aware `entityK2` label. No vetting change. Freelancers
  become usable and funder-visible (self-asserted gate). **No migration.**
- **Phase 2 — Individual vetting:** `individual_docs` + `individual_verified_at`
  (+ trigger) migration, CV upload + links UI, `VettingKind = 'individual'`,
  staff review handling, verified-card reuse, `operatorVerifiedAt` generalization.

## Out of scope

- No rating-ceiling difference between individuals and companies (a verified
  freelancer is treated equal to a verified company).
- No change to case-study vetting, NDA, or the funder-preview projection beyond
  reading `operatorVerifiedAt`.
- No bulk backfill — existing producers stay `company` by default.

## Verification

No test runner (`project-afx-prod-and-vetting`): `npx tsc --noEmit` +
`npx next build`, live supabase-js gates in repo root for the new column/trigger
(Phase 2), then browser checks on prod:
- **Phase 1:** toggle to Individual → Legal entity hidden, gate label changes,
  Country drives ZAR/USD; toggle back to Company → today's layout.
- **Phase 2:** individual CV required to submit; staff approve sets
  `individual_verified_at`; panel collapses to the verified card; freelancer with
  gate on + K4 + screenable project is funder-visible.
