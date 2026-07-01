# AFX FRA Review Surface (S2b) — Design Spec

**Date:** 2026-07-01
**Status:** Approved in brainstorm; ready for implementation planning.
**Scope:** The **staff-facing** half of S2 vetting. FRA reviewers work a queue of `afx_vetting_submissions`, claim a submission, inspect the producer's data + confidential proof documents, promote individual case-study claims from `self` → `verified` (or record a verified-company marker for entity submissions), and decide (Approve / Request changes). This gives the shipped producer-side submission records their effect.

---

## 1. Context & where this fits

The producer-side submit-for-vetting slice (PR #21) let a producer submit a vetting-ready case study or their company/entity for FRA review — recording durable `afx_vetting_submissions` rows and rendering the full status lifecycle. But **nothing consumes those records yet**: there is no staff identity, no review queue, and no code path that writes `provenance = 'verified'`. This slice builds that consumer.

```
PRODUCER                                    FRA STAFF (THIS SLICE)
▼ submit case study / entity  ─────────▶   ▼ queue → claim → review → decide
  (afx_vetting_submissions row)             ├─ verify case-study claims (self→verified)
                                            ├─ mark company verified (entity)
                                            └─ Approve / Request changes (+ notes)
```

**Load-bearing context from the shipped slice:**
- `afx_vetting_submissions`: `kind` (case_study|entity), `target_id` (project id or null), `status` (submitted→under_review→verified/changes_requested, +withdrawn), `reviewer_notes`, `submitted_at`, `decided_at`. Only **producer-scoped** RLS exists; there are no staff policies.
- Provenance model: `Provenance = 'self' | 'confirmed' | 'verified'`; `Provenanced<T> = { value; provenance }`. On a case study (`afx_projects.body` JSONB): `budgetBand`, `outcomes.recoupment`, `outcomes.bondUsed`, and each `outcomes.distribution[].provenance`. **No code writes `'verified'` today.**
- The producer is **edit-locked** on a target while its submission is open (`submitted`/`under_review`): `persistProfile` drops edits to a locked case study and pins the vetted entity fields.
- Confidential documents live in the private `afx-documents` bucket; the existing sign route is **producer-scoped** (`isOwnedDocPath` restricts a producer to their own paths) — staff cannot view producer docs yet.
- The service-role client `afxAdmin` exists (used by the confidential-doc routes behind ownership checks).

## 2. Goal & success criteria

**Goal:** an allow-listed FRA reviewer can work the submission queue, view a producer's submitted data + proof documents, verify individual case-study claims (or mark a company verified), and record an auditable decision.

**Done when:**
1. `/afx/staff` is reachable only by users in the `afx_staff` allowlist; everyone else is redirected.
2. The queue lists submissions across all producers (open first; a filter for decided), each with producer/company, kind, status, and dates.
3. A reviewer can **Start review** (`submitted → under_review`), which keeps the producer edit-locked.
4. In a case-study submission, the reviewer can **View** each attached proof document and toggle **Verify / Revert** on each `Provenanced` claim (writes `provenance = 'verified'` / back to `self`), available only while `under_review`.
5. In an entity submission, the reviewer can **View** the company documents; **Approve** sets a persisted verified-company marker.
6. The reviewer records a decision — **Approve** (`status = verified`) or **Request changes** (`status = changes_requested` + `reviewer_notes`) — both stamping `decided_at` + `reviewed_by`.
7. All staff data access is gated by a single `resolveStaff()` guard using the service-role client; producer RLS is unchanged.
8. Neither the verified-company marker nor any field's `verified` provenance can be forged by a producer.

## 3. Architecture

**Approach A — service-role behind a `resolveStaff()` guard.** All staff reads/writes across producers flow through server-only routes/actions that first resolve the caller against `afx_staff`; if staff, they use `afxAdmin` (service-role) to read/write across the producer-scoped RLS. This mirrors the shipped confidential-document access pattern (`resolveDocAccess` + `afxAdmin`), keeps the producer RLS pristine, and gives one auditable staff gate. (Rejected: staff RLS policies on every table — more cross-cutting surface for no benefit here; a read/write hybrid — splits the model for nothing.)

## 4. Data model & migration

Applied via the Supabase Dashboard SQL editor (the connected MCP cannot reach the prod project `rcgynwcttgvqcnbyfhiz`), same as prior slices.

```sql
-- Staff allowlist (populate with FRA reviewers' auth user_ids via Dashboard).
create table if not exists public.afx_staff (
  user_id    uuid primary key references auth.users on delete cascade,
  role       text not null default 'reviewer' check (role in ('reviewer','admin')),
  created_at timestamptz not null default now()
);
alter table public.afx_staff enable row level security;
-- No client policies: only the service-role staff guard reads this table.

-- Audit: which staff member decided a submission (decided_at already exists).
alter table public.afx_vetting_submissions add column if not exists reviewed_by uuid references auth.users;

-- Entity verification marker — its OWN column, never inside the profile JSONB blob (see §8).
alter table public.afx_producers add column if not exists entity_verified_at timestamptz;

-- === Anti-forge triggers (see §8). Producers can write their own rows via RLS with no
-- === column/content restriction, so 'verified' must be blocked at the DB for client roles.
-- === Only 'authenticated'/'anon' are guarded; service-role (staff actions) + migrations pass.

create or replace function public.afx_guard_entity_verified()
returns trigger language plpgsql as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if new.entity_verified_at is distinct from old.entity_verified_at then
    raise exception 'entity_verified_at is FRA-only';
  end if;
  return new;
end $$;
drop trigger if exists afx_producers_guard_verified on public.afx_producers;
create trigger afx_producers_guard_verified
  before update on public.afx_producers for each row
  execute function public.afx_guard_entity_verified();

-- Block a client role from INTRODUCING provenance='verified' into a case study's body.
-- Allows verified→self (producer edits revert) and re-saving a body that retains an
-- already-verified field (so autosave of unrelated fields still works).
create or replace function public.afx_guard_verified_provenance()
returns trigger language plpgsql as $$
declare new_d jsonb; old_d jsonb; i int;
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if (new.body->'budgetBand'->>'provenance') = 'verified'
     and (old.body->'budgetBand'->>'provenance') is distinct from 'verified' then
    raise exception 'verified provenance is FRA-only (budgetBand)'; end if;
  if (new.body->'outcomes'->'recoupment'->>'provenance') = 'verified'
     and (old.body->'outcomes'->'recoupment'->>'provenance') is distinct from 'verified' then
    raise exception 'verified provenance is FRA-only (recoupment)'; end if;
  if (new.body->'outcomes'->'bondUsed'->>'provenance') = 'verified'
     and (old.body->'outcomes'->'bondUsed'->>'provenance') is distinct from 'verified' then
    raise exception 'verified provenance is FRA-only (bondUsed)'; end if;
  new_d := coalesce(new.body->'outcomes'->'distribution', '[]'::jsonb);
  old_d := coalesce(old.body->'outcomes'->'distribution', '[]'::jsonb);
  for i in 0 .. greatest(jsonb_array_length(new_d) - 1, -1) loop
    if (new_d->i->>'provenance') = 'verified'
       and (old_d->i->>'provenance') is distinct from 'verified' then
      raise exception 'verified provenance is FRA-only (distribution)'; end if;
  end loop;
  return new;
end $$;
drop trigger if exists afx_projects_guard_verified on public.afx_projects;
create trigger afx_projects_guard_verified
  before update on public.afx_projects for each row
  execute function public.afx_guard_verified_provenance();
```

**Type/persistence changes:**
- `ProducerProfile` gains `entityVerifiedAt?: string`. `ProducerRow` gains `entity_verified_at: string | null`.
- `profileToRows` destructures `entityVerifiedAt` **out** of the profile blob and does **not** return it for writing (the producer path never writes it). `rowsToProfile` re-stitches it from the column. `loadProducerState`'s producer read includes `entity_verified_at`. `persistProfile`'s `afx_producers` update is unchanged (writes `profile` + `entity_docs` only — never `entity_verified_at`).
- `VettingSubmission`/`VettingSubmissionRow` gain `reviewedBy?`/`reviewed_by` (read side, for audit display).

No change to the producer-scoped RLS policies; staff never use a user-JWT path.

## 5. Staff auth guard

`src/lib/afx/server/staffAccess.ts` (server-only), mirroring `resolveDocAccess`:

```ts
export interface StaffAccess { userId: string; role: 'reviewer' | 'admin'; }
export async function resolveStaff(): Promise<StaffAccess | null>;
```

`getSessionUser()` → look up `afx_staff` by `user_id` via `afxAdmin` → return `{ userId, role }` or `null`. Every staff route/action and the `/afx/staff` layout call it first; non-staff are redirected to `/afx` (or shown an access wall). The old cookie `/admin` gate is **not** reused. Staff are provisioned by inserting into `afx_staff` via the Dashboard — no self-service onboarding in this slice.

## 6. Review data-access layer + provenance promotion

`src/lib/afx/server/staffReview.ts` (server-only), all functions call `resolveStaff()` first and use `afxAdmin`:

- **`listSubmissions(filter: 'open' | 'decided')`** — reads `afx_vetting_submissions` across producers, joined to producer name/company and (case study) target title. `'open'` = `submitted` + `under_review`; `'decided'` = the rest. Sorted by `submitted_at` desc. Feeds the queue.
- **`getSubmissionDetail(id)`** — the submission + producer profile + (case study) the target `Project` with its `Provenanced` fields and `docs`, or (entity) the producer's `entity_docs`. Read-only projection for the drill-down.
- **`startReview(id)`** — `submitted → under_review` (verify `resolveStaff`, ownership of an open submission). Keeps the producer edit-locked while staff work.
- **`verifyField(submissionId, field)` / `revertField(submissionId, field)`** — **case study only, only when `under_review`.** Loads `afx_projects.body`, sets the addressed field's provenance to `'verified'` (or back to `'self'`), writes the blob back. Addressable `field` values: `budgetBand`, `recoupment`, `bondUsed`, and `distribution:<index>` (the distribution row's array index — safe because the array is stable while the producer is edit-locked under `under_review`). Because the producer is locked during `under_review`, there is no concurrent-write race.
- **`decide(id, decision: 'approve' | 'request_changes', notes?)`** — Approve → `status = 'verified'`; Request changes → `status = 'changes_requested'` with `reviewer_notes = notes`. Both set `decided_at = now()` and `reviewed_by = staff.userId`. For an **entity** Approve, also `update afx_producers set entity_verified_at = now()` for that producer.

Server actions wrap these in `src/app/afx/staff/actions.ts` (`'use server'`), returning `{ ok, error? }` results (never throwing to the client).

**Staff document viewing** — `POST /api/afx/staff/documents/sign`: `resolveStaff()` → load the submission → derive `producerId` (+ case-study `target_id`) → require the requested `path` to belong to that submission (`isOwnedDocPath(path, producerId)` **and** the path's middle segment equals the submission's target: the case-study id for a case_study, or the literal `entity` for an entity submission) → sign via `afxAdmin` (60s URL). Scoped so staff can view only the docs tied to the submission under review.

**Decoupling:** submission `status = 'verified'` means "FRA reviewed & closed." A field's `verified` provenance means "FRA substantiated this specific claim." A study can honestly close as reviewed with only some claims verified.

## 7. Staff surface UX

- **`/afx/staff/layout.tsx`** (server, `resolveStaff()`-gated; redirect non-staff) + **`/afx/staff/page.tsx`** queue: submissions list — producer/company, kind (case-study title or "Entity"), status badge (`VETTING_STATUS_META`), submitted/decided dates; open items first, a filter toggle for decided. Reuses `AfxTopBar` and the AFX visual system.
- **Submission drill-down** (`/afx/staff/[id]` or an overlay): read-only producer/company identity; then—
  - *Case study*: each `Provenanced` field with its `ProvenanceBadge` + a **Verify / Revert** control (enabled only when `under_review`); attached proof documents with **View** (staff sign route).
  - *Entity*: the company documents with **View**; the verified-company marker state.
  - A **reviewer-notes** textarea; an action bar: **Start review** (when `submitted`), **Approve**, **Request changes**.
- New components under `src/components/afx/staff/` (queue table, submission detail, per-field verify row), styled in the AFX system, reusing `ProvenanceBadge`, `SectionCard`, `VETTING_STATUS_META`. Client actions use the same `resolveStaff`-backed server actions and the standardized guard / try-catch / in-flight-busy pattern from the producer side.

## 8. Security & audit

- **One gate:** every staff route/action and the `/afx/staff` layout call `resolveStaff()` first; service-role writes happen only behind it.
- **No forged verification (the load-bearing invariant), enforced at the DATABASE:** the S1 RLS policies (`afx_projects_upd`, `afx_producers_upd`) let a producer update any column/content of their own rows, and the anon key + a session JWT are enough to bypass the cockpit — so app-layer isolation alone does **not** stop a producer from writing `provenance='verified'` or `entity_verified_at` directly. Two `BEFORE UPDATE` triggers close this (migration §4): `afx_producers_guard_verified` rejects any `authenticated`/`anon` change to `entity_verified_at`; `afx_projects_guard_verified` rejects any `authenticated`/`anon` write that **introduces** `provenance='verified'` into `body` (budgetBand / recoupment / bondUsed / each distribution row). Both let service-role (staff actions) and migrations through. `verified→self` is allowed (producer edits legitimately revert) and re-saving a body that keeps an already-verified field is allowed (autosave of unrelated fields still works). Belt-and-suspenders on top: the entity marker is also an isolated column stripped from the producer-written blob and never written by `persistProfile`, and staff field-flips happen only while the producer is edit-locked (`under_review`).
- **Scoped doc access:** the staff sign route validates the requested path against the specific submission's producer + target, so staff cannot fish arbitrary producer files by path.
- **Audit trail:** `reviewed_by` + `decided_at` record who decided and when.
- **No shared secret:** the cookie `/admin` model is not reused; every reviewer is an identified auth user in `afx_staff`.

## 9. Out of scope (later slices)

- **Rating-band derivation** from verification — `ratingBand` stays a stored field; a future slice may derive credibility from verified counts.
- **Funder-facing badges** — "verified company" and verified-field badges in the marketplace/funder preview. The marker + field provenance persist now; the funder UI is a later slice.
- **Staff role management UI / self-onboarding** — staff are added via the Dashboard.
- **Producer notifications** on decision (email/push).
- **Re-vetting automation** — editing a verified field reverts *that field* to `self` (existing `caseStudy.ts` behavior); the producer re-submits. Not automated here.
- **Bulk actions, SLA timers, reviewer analytics.**

## 10. Risks & decisions

- **Entity marker isolation is a real security boundary** (not cosmetic): if `entityVerifiedAt` rode the profile JSONB blob, the producer's client-authoritative `persistProfile` could self-set it. It must be a column the producer path never writes — same discipline as `entity_docs`. Verified in the plan's tests.
- **Per-field verification granularity** was chosen over whole-study approve: richer, more honest funder signal, at the cost of a per-field reviewer control. The required-docs gate ensures the proof exists to substantiate against.
- **Provenance writes into a JSONB blob** (`afx_projects.body`): staff mutate nested `Provenanced.provenance` in place via service-role. Safe from races because the producer is locked during `under_review` — so the claim step is not optional; field verification is gated on `under_review`.
- **Migration required** (new `afx_staff` table + two columns). Additive; producer RLS untouched. Applied via Dashboard.
- **First non-producer AFX surface.** Get the `resolveStaff` gate right — it is the single thing standing between a normal user and every producer's confidential financials. Its live behavior is a required verification.

## 11. Open questions

- None blocking. Future: whether Approve should require all required-doc-backed fields to be verified first (a completeness check) or leave partial verification entirely to reviewer judgment (current: judgment); whether `changes_requested` should auto-revert any already-`verified` fields (current: leaves them, reviewer controls each).
