# AFX — NDA Read-and-Sign Design

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` "Confidentiality (NDA)" card + signature audit store
**Builds on:** the existing `ndaSigned` boolean gate (exact-figure entry across case
studies / live slate / aggregates, and entity-doc upload via `resolveDocAccess`).

## Problem

Today the "Confidentiality (NDA)" card (`NdaUpgrade.tsx`) is a **one-click boolean
toggle** — "Sign NDA" flips `ndaSigned` in the profile blob with no document, no
reading, and no record of who agreed to what, when. FRA needs producers to
**read an actual NDA and digitally sign it**, with an auditable trail.

## Goal

Replace the toggle with a **read-and-sign flow**: the card renders the FRA↔producer
NDA (parameterized per producer), the producer types their full name and affirms
they have read it, and signing records an **immutable audit event**. The existing
`ndaSigned` gate keeps working unchanged; withdraw re-gates figures without erasing
history.

## Confirmed decisions

1. **Parties:** bilateral **Producer ↔ FRA**, with **Jarred & Cati** as FRA's named
   signatories (pre-authorized — they do not counter-sign in-app). The tripartite
   NDA is the reusable template; each producer signs their own instance.
2. **Signing method:** **typed-name click-through** — full legal name + an "I have
   read and agree" affirmation. No drawn signature, no external e-sign provider.
3. **Lifecycle:** **auditable append-only log.** Every sign/withdraw is an immutable
   event (signer name, timestamp, doc version, action). Withdraw revokes access
   (re-gates exact figures) but the historical signing is never erased.
4. **UX:** **inline expand within the card** (no modal). The expanded document body
   is its own scroll area so it doesn't push the rest of the page far down. The
   **Sign** button enables only when full name is filled AND the affirmation is
   checked (the affirmation is the read-gate; no scroll tracking).

## Document (REQUIRED INPUT)

The NDA body text is a **hard dependency** for implementation. It lives as a
**versioned constant** in `src/lib/afx/nda.ts`:

- `export const NDA_VERSION = '<yyyy-mm-dd or semver>';`
- `export const NDA_BODY = \`<full NDA markdown/plaintext>\`;` — sourced from the
  tripartite NDA between Gerhard/Jarred/Cati, generalized to FRA↔producer.
- `export function renderNda(p: { producerName: string; company?: string; date: string }): string` —
  interpolates the parameterized fields (producer name/company, effective date,
  FRA + Jarred & Cati as the counterparty) into `NDA_BODY`.

**The plan's content task cannot be completed until the actual NDA text is supplied
(or a drafted mutual-NDA template is approved).** Everything else in this design is
content-agnostic.

## Data model + migration

Producer-run on prod (MCP can't reach the AFX project — supply SQL, wait for "SQL
has run", then run the live gate).

New append-only table:

```sql
create table public.afx_nda_signatures (
  id           uuid primary key default gen_random_uuid(),
  producer_id  uuid not null references public.afx_producers on delete cascade,
  action       text not null check (action in ('signed','withdrawn')),
  signer_name  text not null,
  doc_version  text not null,
  created_at   timestamptz not null default now()
);
create index afx_nda_sig_producer_idx on public.afx_nda_signatures (producer_id, created_at desc);
alter table public.afx_nda_signatures enable row level security;
-- Append-only for client roles: SELECT own + INSERT own; NO update/delete policy
-- (so authenticated/anon cannot mutate history). Service-role (server actions)
-- and the on-delete cascade from afx_producers bypass RLS.
create policy afx_nda_sig_sel on public.afx_nda_signatures for select
  using (producer_id in (select id from public.afx_producers where user_id = auth.uid()));
create policy afx_nda_sig_ins on public.afx_nda_signatures for insert
  with check (producer_id in (select id from public.afx_producers where user_id = auth.uid()));
```

**Immutability is enforced by RLS** (no UPDATE/DELETE policy → denied for
`authenticated`/`anon`). We deliberately do NOT add an UPDATE/DELETE trigger — a
delete-blocking trigger would break the `on delete cascade` when a producer is
removed. The app never updates/deletes these rows; it only inserts.

Types (`src/lib/afx/types.ts`):
- `export interface NdaSignature { name: string; signedAt: string; version: string; }`
- `ProducerProfile` keeps `ndaSigned: boolean` (unchanged — the effective gate) and
  gains `ndaSignature?: NdaSignature | null` (denormalized current signature for
  display). Both ride in the profile blob; the append-only table is the audit
  source of truth.

## Server actions

Two `'use server'` actions (service-role via `afxAdmin`, producer resolved from the
session like `resolveProducerId`), each atomic over log + profile:

- `signNda({ name }): Promise<{ ok: boolean; signature?: NdaSignature; error?: string }>`
  — rejects empty/whitespace name; inserts an `afx_nda_signatures` row
  `{ action:'signed', signer_name:name, doc_version:NDA_VERSION }`; sets the
  producer's `profile.ndaSigned = true` and `profile.ndaSignature = { name, signedAt:now, version:NDA_VERSION }` (read-modify-write of the profile row); returns the signature.
- `withdrawNda(): Promise<{ ok: boolean; error?: string }>` — inserts
  `{ action:'withdrawn', signer_name:<last signer or ''>, doc_version:NDA_VERSION }`;
  sets `profile.ndaSigned = false`, `profile.ndaSignature = null`.

These are the ONLY way `ndaSigned` changes going forward (the raw client toggle is
removed). The client updates its local `draft` from the returned state so autosave
preserves it. (Trust level is unchanged from today — the NDA is the producer's own
self-asserted gate; the new value is the immutable audit trail.)

## Producer UI (`NdaUpgrade.tsx` rewrite)

Three states inside the existing `SectionCard title="Confidentiality (NDA)"`:

- **Not signed, collapsed:** current explainer copy + a **"Review & sign NDA"**
  button that expands the card.
- **Not signed, expanded:** the rendered NDA (`renderNda(...)`) inside a scrollable
  `maxHeight` box, then a **Full name** text input, an **"I have read and agree"**
  checkbox, a **Sign agreement** button (disabled until name non-empty && checked),
  and a Cancel/collapse control.
- **Signed:** a read-only confirmation — **"✓ Signed by {name} on {signedAt} · NDA
  v{version}"** — plus **View agreement** (re-expands the doc read-only) and
  **Withdraw** (calls `withdrawNda`, re-gates figures). The existing green
  "exact-figure entry unlocked" hint is preserved.

`NdaUpgrade` props change from `{ signed, onToggle }` to carry the signature +
producer identity for rendering and the two action callbacks (`onSign(name)`,
`onWithdraw`) + a `busy` flag; exact prop shape finalized in the plan.
`ProducerProfileClient` wires `onSign`/`onWithdraw` to the server actions and
updates `draft.ndaSigned`/`draft.ndaSignature` from the results.

## Unchanged / out of scope

- **No change to any gate consumer** — exact-figure entry (`CaseStudyDrawer`,
  `LiveSlateZone`, aggregates) and entity-doc upload (`resolveDocAccess`) still read
  `ndaSigned`. `deriveVisibility` untouched.
- Out of scope (YAGNI): downloadable/emailed signed PDF, enforcing the typed name
  matches the producer name, scroll-position tracking, Jarred/Cati counter-signing
  in-app, and any staff-side view of the signature log (the audit table exists; a UI
  for it is a later phase).

## Verification

No test runner: `npx tsc --noEmit -p tsconfig.json` + `npx next build`; a live
supabase-js gate in repo root (deleted after) proving: the table exists; a producer
can INSERT + SELECT own rows but an UPDATE and a DELETE by an authenticated producer
are both denied by RLS (append-only); `signNda`/`withdrawNda` write both the log row
and the profile flag. Then browser on prod (Gerhard = test producer):
- Not-signed → Review & sign → doc renders parameterized with his name → Sign
  disabled until name + checkbox → Sign → figures unlock, card shows "Signed by … ·
  NDA v…".
- Withdraw → figures re-gate → a `withdrawn` row is appended (prior `signed` row
  still present).
