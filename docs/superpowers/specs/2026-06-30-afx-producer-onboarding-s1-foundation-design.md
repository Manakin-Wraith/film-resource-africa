# AFX Producer Onboarding — S1 Foundation (Design Spec)

**Date:** 2026-06-30
**Status:** Approved in brainstorm; ready for implementation planning.
**Scope:** The first shippable slice of the AFX producer journey: an **invited producer can sign in and build & save a real, persisted, private profile** in the existing cockpit. Moves AFX from in-session mock to per-producer Supabase data. No vetting, no funder publishing, no payment, no auto-draft (those are later slices).

---

## 1. Context: the producer journey & where S1 fits

AFX is the producer-only finance layer behind FRA. The full producer journey (established in brainstorm) is an **invite-only, concierge, manual-first** flow with two decoupled vetting gates:

```
PRODUCER                                   FRA OPERATOR
[Invite] → Activate (Supabase auth)
   │
   ▼ Build Track Record (identity + case studies + evidence links)
   ├── submit for producer vetting ──▶  Vet producer/company + case studies
   ◀── vetted ✓ (rated) / changes ─────┘
   │
   ▼ Add a Live Project (ask + packaging + evidence links)
   ├── submit project for vetting ───▶  Vet that project
   ◀── live ✓ (published) / changes ───┘
   │
   ▼ Project live to funders (existing marketplace)   ↺ repeat per project
(LATER: auto-draft "magic fill-in" pre-populates the build steps)
```

**Decomposition** (the journey is multi-plan):
- **S1 — Foundation (this spec):** invite + activate + real persistence; the cockpit reads/writes per-producer data.
- **S2 — Producer vetting gate:** submit track record → FRA vets producer/company + case studies → vetted/rated (introduces the `verified` tier + an FRA admin surface).
- **S3 — Project vetting gate:** submit a live project → FRA vets → published to the marketplace (funder-facing reads, the `toFunderView` DB boundary goes live).
- **S4 — (later) auto-draft.**

S1 is the hard dependency for S2 and S3 and is independently shippable on its own.

## 2. Goal & success criteria

**Goal:** an invited producer logs in, builds an AFX profile from empty states, and their edits persist across sessions and devices.

**Done when:**
1. FRA can invite a producer (insert an email into the allowlist).
2. An invited producer signs in (existing Supabase auth) and, on first authenticated visit to `/afx`, gets an empty AFX profile created and is dropped into the cockpit.
3. A non-invited user hitting `/afx` sees an invite-only access wall.
4. The cockpit (identity, Track Record, Live Slate, NDA exact-figure entry, **local** funder preview) loads the signed-in producer's own data and **autosaves** edits.
5. Refreshing or signing in elsewhere shows the saved profile — nothing is lost.
6. Row-Level Security guarantees a producer can read/write only their own profile and projects.

## 3. Entry: invite → activate

- **Reuse existing Supabase auth** (`src/lib/supabase/server.ts`, `src/middleware.ts`, `/auth/callback`). No new auth system.
- **Allowlist** is an `afx_invites` table (email + redeemed_at). FRA invites a producer by inserting their email (manual SQL / admin for S1) and sends them the `/afx` link (or a Supabase magic-link).
- **Activation = first authenticated visit**, not a separate wizard:
  - User authenticates → loader checks for an `afx_producers` row for `auth.uid()`.
  - **Has a profile** → load it → cockpit.
  - **No profile, but their email matches an unredeemed `afx_invites` row** → create an empty `afx_producers` row, stamp the invite `redeemed_at` → cockpit (empty states). The empty `profile` is seeded with type-valid defaults: `name`/`company`/`bio`/`location`/`careerStage` = `''`, `ratingBand` = `'D'` (Not-yet — until rated in S2), `relationships` = `[]`, `entityK2`/`consentK4`/`ndaSigned` = `false`, and zero `afx_projects` rows.
  - **No profile, no invite** → invite-only access wall (a simple "AFX is in invite-only beta — request access" page).
- The "build" surface **is** the existing cockpit; there is no separate onboarding wizard in S1.

## 4. Data model (Supabase)

Promoted-rows + JSONB hybrid. The existing TS `ProducerProfile`/`Project` types in `src/lib/afx/types.ts` remain the contract; the DB persists them with just enough structure for S2/S3 to query.

```sql
-- invite allowlist (FRA-managed)
afx_invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users
)

-- one profile per auth user
afx_producers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users,
  profile     jsonb not null,   -- ProducerProfile MINUS slate
                                 -- (name, company, bio, location, careerStage,
                                 --  ratingBand, relationships, entityK2,
                                 --  consentK4, ndaSigned)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
)

-- one row per project (case study or live)
afx_projects (
  id          uuid primary key,          -- client-generated (crypto.randomUUID)
  producer_id uuid not null references afx_producers on delete cascade,
  status      text not null,             -- 'case_study' | 'live' | 'archived'  (promoted)
  deal_ref    text,                      -- marketplace bridge (promoted)
  body        jsonb not null,            -- the Project MINUS exact
  exact       jsonb,                     -- NDA exact figures — ISOLATED, private
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
)
```

**Why this shape:**
- `status` / `producer_id` / `deal_ref` are **promoted columns** because S2 (per-project vetting) and S3 (funder publish) must query projects by producer and status — projects are *rows*, not buried in one blob.
- The deeply nested `ask`/`outcomes`/`packaging`/`capitalStack` stay as JSONB (`body`) — no value in fully normalizing them at MVP.
- **`exact` is its own column**, never inlined in `body`. This is the `toFunderView` privacy boundary pushed down to the database: when S3 adds funder-facing reads, they select `body` and never `exact`.

**RLS (enforced in S1):**
- `afx_producers`: a row is readable/writable only when `auth.uid() = user_id`.
- `afx_projects`: readable/writable only when `producer_id` belongs to the caller's `afx_producers` row.
- `afx_invites`: not client-readable; checked server-side (service role / security-definer function) during activation.
- FRA's service-role key bypasses RLS for vetting later (S2/S3); not used by the producer-facing cockpit.

**IDs:** new projects are assigned `crypto.randomUUID()` **client-side** so client state and DB rows share the same id (no temp-id reconciliation). Existing seed ids (`'cs1'`, `'pr1'`…) belong only to `afxSeed` and are not used for real producers.

## 5. Cockpit goes real (load + save)

- **Loader** — `src/app/afx/producer/page.tsx` (server component): authenticate via the Supabase server client; read the `afx_producers` row + the producer's `afx_projects`; a new mapper `rowsToProfile(producerRow, projectRows)` stitches them into a `ProducerProfile`; pass it as `initial` to `ProducerProfileClient`. Handle the activation/wall branches from §3.
- **Client** — `ProducerProfileClient` keeps its optimistic local `draft` state (instant edits; the `toFunderView` funder preview is unchanged and stays local). Two changes only:
  1. `initial` now comes from the DB loader instead of `afxSeed.focusProducer`.
  2. Each edit handler additionally fires a **debounced full-document autosave**: `persistProfile(profile)` — a server action that upserts the `afx_producers.profile` and upserts/deletes the producer's `afx_projects` rows (via `profileToRows(profile)`), all under the caller's RLS session.
- **New module** — `src/lib/afx/persistence.ts`: pure mappers `rowsToProfile()` / `profileToRows()` between the DB rows and the `ProducerProfile`/`Project` types (the single source of mapping truth).
- **Server action** — `persistProfile(profile)` in a server module using `src/lib/supabase/server.ts`. Coarse full-document save keeps S1 correctness-first over per-field action sprawl; debounce (~800ms) bounds write volume.
- **Migration** — one Supabase migration adds the three tables + RLS policies + indexes (`afx_projects(producer_id)`, `afx_projects(producer_id, status)`).

## 6. Out of scope (later slices)

- **FRA vetting**, the `verified` provenance tier, and any FRA admin surface → S2/S3.
- **Going live / publishing to funders**; the marketplace and the AFX **incentive overlay** stay mock (`dealRef → afxSeed.projects`) in S1. The funder preview remains a *local* preview — nothing is published.
- **Payment / billing** — the beta is free; monetization is later.
- **Auto-draft** ("magic fill-in") — producers enter everything manually in S1; the existing cockpit empty states are the starting point.
- **Evidence-link attachment per claim** — the journey calls for producers to attach links as vetting evidence, but that is consumed by S2 (vetting). S1 does **not** add evidence links or their UX; the `body` JSONB can carry them later without a schema change. (Deferred to keep S1 to persistence.)

## 7. Risks & decisions

- **First AFX Supabase schema.** S1 introduces the AFX tables; get RLS right (ownership + the `exact` isolation) now, because S2/S3 build on them. Verify RLS with both an owner and a non-owner session.
- **Full-document autosave** can clobber concurrent edits from two open tabs (last-write-wins). Acceptable for a single-producer beta; note it, revisit if it bites.
- **`exact` privacy** must never regress: even though S1 has no funder reads, keep `exact` in its own column and never serialize it into `body`, so the S3 funder view is a simple column omission.
- **Seed split:** `afxSeed` stays for the marketplace demo + incentive overlay only; a real producer's profile must come exclusively from Supabase. A dev guard should ensure the cockpit never falls back to `afxSeed.focusProducer` for an authenticated producer.

## 8. Open questions

- None blocking. Future (S2): whether producer vetting re-runs automatically when track record materially changes, or is manually re-triggered.
