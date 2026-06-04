# PRD — PRS /assess · Reconciliation revision (2026-06-03)

> Companion to `prs-public-assess-prd.md` (draft 2026-05-22). It records where the
> build actually landed versus the plan, supersedes the affected sections, and sets
> the next steps. **Authoritative over the draft for the sections it covers:**
> Decision 1 + § 5 (auth), § 4 (pipeline), § 7 (data model), § 8 (routes/files),
> § 12 (build sequence). All other draft sections (1, 2, 3, 5-non-auth, 6, 9-other,
> 10, 11, 13, 14, 15) stand unchanged.
>
> **One-line state:** the public funnel's front half is live — intake → on-demand
> AI score → SSR card → tracked intro request. The matcher/counterparty layer,
> lifecycle automation, and most of the admin/iteration tooling are not built.

---

## 0. Build status & next steps (2026-06-03)

### What shipped vs the § 12 plan

| Sprint | Status | Note |
| :-- | :-- | :-- |
| 0 — Pre-flight | 🔴 not started | Prompt logic exists; **no counterparty data** (see decision below) |
| 1 — Schema + intake + submit | 🟢 / 🔴 | Intake/submit/processing live; **2 tables / 3 migrations**, no magic-link email |
| 2 — Scoring + matcher | 🟢 / 🔴 | Scoring live; **matcher unbuilt** |
| 3 — Card UI | 🟢 | Shipped as `Report.tsx` (+ IntakeForm, ProcessingScreen) |
| 4 — Edit/rescore/gating/admin/dormant | 🟡 ~40% | Session-auth gating + re-score-via-resubmit live; **no step-done, no admin/assess, no crons, no lapse handler** |
| 5 — Soft launch | 🔴 | **1 row in DB**; no scoring calibration run yet |

### Decisions locked this session

- **Auth model → Supabase session** (was magic-link). Corrects Decision 1 + § 5; see below.
- **Counterparty layer → deferred to Phase 2.** As of 2026-06-03 FRA has **zero
  counterparties**, so `counterparty_profiles` / `assessment_matches` are not built
  and the card's counterparty section must **graceful-degrade (hide, not show hollow
  matches)** until a rolodex exists.
- **Token stability → fixed.** `submit/route.ts` now keeps the `/p/<token>` card URL
  stable across re-scores (token hand-off; shipped this session). See § 7 + § 4.

### Next steps (recommended order)

1. **P0 — Scoring calibration (Sprint 5/0).** Run the 6 Phase-0 cases through the live
   scorer; check AI-vs-hand delta (≤±2 pts on ≥5/6 per acceptance criterion #2).
   Nothing downstream matters until the score is trusted. Only 1 row exists today.
2. **P0 — Counterparty UI degrade.** Confirm `Report.tsx` hides the counterparty
   section cleanly when there are zero matches (currently the section assumes data).
3. **P1 — Close the iteration loop (Sprint 4 remainder):** `mark-step-done` (needs a
   per-step status decision — steps live in `diagnosis` jsonb today), `admin/assess`
   console, subscription-lapse handler.
4. **P2 — Lifecycle automation:** card-ready/magic-link email on submit (none sent
   today) + dormant-nudge cron (no `vercel.json` exists).

---

## 7. Data model — Supabase (as shipped)

**Two tables, three incremental migrations** — not the six-table single-migration
plan in the draft. The normalised `projects` / `next_steps` / `magic_links` split
was collapsed into a single denormalised `assessments` row; the matcher layer
(`counterparty_profiles`, `assessment_matches`) and `assessment_feedback` were not
built and are deferred.

Migrations applied (live project `rcgynwcttgvqcnbyfhiz`):

| Version | Name |
| :-- | :-- |
| 20260526070135 | create_prs_assessments_table — `assessments` + `prs_intro_requests` |
| 20260529125627 | add_visibility_to_assessments |
| 20260601100613 | add_project_group_to_assessments |

### assessments (denormalised — folds in `projects`, `magic_links`, `next_steps`)

```sql
create table assessments (
  id            uuid primary key default gen_random_uuid(),
  token         text unique not null,            -- public URL slug /p/<token> (replaces magic_links)
  email         text not null,
  member_id     uuid references members(id) on delete set null,

  -- denormalised project header (replaces the projects table)
  project_title text not null,
  format        text,
  genre         text,
  country       text,

  intake_data   jsonb not null,                  -- raw form payload, source for re-scoring

  status        text not null default 'pending', -- pending | scored | failed
  tier          text,                            -- early | developing | ready
  score         integer,                         -- 0..25
  diagnosis     jsonb,                            -- full Diagnosis object (next_steps live in here)

  visibility    text not null,                   -- added 20260529 (public/members visibility toggle)
  project_group uuid,                             -- added 20260601 — groups re-scores of one project
                                                  -- (replaces projects.id FK + assessments.archived)

  submitted_at  timestamptz not null default now(),
  scored_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index assessments_email_idx  on assessments (lower(email));
create index assessments_member_idx on assessments (member_id);
create index assessments_status_idx on assessments (status);

-- "one free assessment per email" enforced at DB level (members exempt)
create unique index assessments_one_free_per_email
  on assessments (lower(email)) where member_id is null;
```

Design deltas from the draft, and why:

- **No `projects` table.** Project header lives on the `assessments` row. "One
  project, many re-scores" is modelled by `project_group` (shared UUID across the
  re-score rows) rather than a `projects` parent + `assessments.project_id` FK +
  `archived` flag.
- **No `magic_links` table.** `assessments.token` (unique) is the public-read URL
  slug / project identifier. Write auth is the Supabase session (see auth section
  below), not the token — so a separate `magic_links` table added nothing.
- **No `next_steps` table.** The three ranked moves live inside `diagnosis` jsonb.
  Trade-off: cannot mark a single step done at the row level (the draft's
  per-step `status` / `marked_done_at` is not available without a schema change).
- **`one_free_per_email` partial unique index** enforces the free-tier limit at the
  DB; not in the original draft but consistent with Decision 8.

### prs_intro_requests (shipped; not in the original § 7)

Tracks "Request intro" (counterparty) and "Discuss with FRA" (move) clicks —
tracked rather than mailto, per the brief. This is the only surviving piece of the
counterparty loop; there is no `counterparty_profiles` table behind it (the subject
is a free-text name).

```sql
create table prs_intro_requests (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id) on delete cascade,
  member_id     uuid references members(id) on delete set null,
  kind          text not null,   -- 'counterparty' | 'fra_move'
  subject       text not null,   -- counterparty name or move title
  note          text,
  created_at    timestamptz not null default now()
);

create index prs_intro_requests_assessment_idx on prs_intro_requests (assessment_id);
```

### Deferred (was specced in the draft § 7, not built)

- **`counterparty_profiles`** — the curated rolodex. **FRA has zero counterparties
  as of 2026-06-03**, so this table is not built and the matcher (§ 4) has no
  counterparty source. The card's counterparty section must graceful-degrade (hide)
  rather than render hollow role/region cards. Revisit when a rolodex exists.
- **`assessment_matches`** — opportunity + counterparty match rows. Opportunity
  matches are computed at render time against `opportunities`, not persisted.
- **`assessment_feedback`** — 30-day post-diagnostic feedback (already Phase 2).
- **`next_steps`** as a table — folded into `diagnosis` jsonb (see above).

### RLS

- All tables RLS-enabled; no public reads. `/p/[token]` resolves token → assessment
  server-side via service role.

---

## Cross-cutting: auth model is session-based (corrects Decision 1 + § 5)

The draft's Decision 1 ("magic-link only, token is the auth, no passwords") is
superseded. **Authoritative model: Supabase session auth.**

**Decision 1 (corrected) — Auth model at Phase 1: Supabase session.** A signed-in
user whose email matches an `active` row in `members` gets write access (edit /
re-score / intro). The `/p/<token>` URL is a server-resolved **public-read slug**,
not a write credential. No magic-link tokens, no PRS-managed passwords (Supabase
auth owns the session). There is no `magic_links` table and no magic-link email.

**§ 5 "Card access + auth" (corrected):**

| Pattern | Decision |
| :-- | :-- |
| Auth model | Supabase session. Token in URL = public-read slug only. |
| Read card | Anyone with the token (SSR resolves token → assessment via service role). |
| Write (edit / re-score / intro) | Requires a signed-in session **and** an `active` member row matching the session email. Non-members → 401/403. |
| Token format | `genToken()` slug at `/p/<token>`. |
| Token lifetime | **Stable per project** — on re-score the new version takes over the token (hand-off in `submit/route.ts`); prior versions are re-tokened and retained as history. |

---

## 4. Scoring pipeline (as shipped)

On-demand and synchronous — **not** the queued/cron model in the draft. No
`projects`/`next_steps`/`magic_links`/`assessment_matches` writes, no Resend email,
no prospect upsert.

```
form submit
   ↓
[/api/assess/submit]  validate · consent (Q25) required · session member-lookup
                      · free-tier guard (one row per email where member_id is null
                        → 409 'free_used' + existing token)
                      · re-assess: if reassessToken, inherit project_group + visibility
   ↓
insert ONE assessments row (status='pending') · return { token }
   ↓
[client redirects to /assess/processing, polls /api/assess/status?token=…]
   ↓
[/api/assess/score]  POST { token } — on-demand, synchronous (no cron queue)
                     fetch intake_data → Anthropic score (src/lib/prs/scoring.ts)
   ↓
update assessments { status='scored', diagnosis, tier, score, scored_at }
   (diagnosis jsonb carries scores + gaps + next moves; no separate rows)
   on error → status='failed'
   ↓
[/p/[token]] SSR-renders the card from the assessments row
```

Deltas from the draft:

- **No queue / no 5-min budget / no `assess-score` cron.** `/api/assess/score` is
  triggered on demand and runs synchronously. There is no `vercel.json` and no cron
  job of any kind (the three draft crons — score, reengage, fresh-match — are unbuilt).
- **No matcher persistence.** No `counterparty_profiles` source; counterparty
  matches are not backed by a table. Opportunity matches (if shown) are computed at
  render, not written to `assessment_matches`.
- **No `next_steps` insert + stage-derivation step.** Stage/tier/moves all land
  inside `diagnosis` jsonb in the single score update.
- **No magic-link email at submit.** Submit returns the token to the client; no
  Resend send, no `PrsCardReady` email.
- **Re-score = re-submit.** A new score is produced by POSTing to
  `/api/assess/submit` with `reassessToken` (creates a fresh row sharing the
  original `project_group`), not via a dedicated `/api/assess/rescore` endpoint.

---

## 8. Routes & files (as shipped)

```
src/app/
  assess/
    page.tsx                  — public landing + intake form          ✓
    processing/page.tsx       — polling screen post-submit            ✓
  p/
    [token]/page.tsx          — the card (SSR)                        ✓  (no edit/, no not-found.tsx)
  api/assess/
    submit/route.ts           — validate, free-tier guard, insert, re-assess via reassessToken  ✓
    status/route.ts           — GET poll by token                     ✓
    score/route.ts            — POST { token }: score on demand, write diagnosis  ✓ (not a cron)
    load/route.ts             — GET (session member + ownership): intake_data for edit  ★ NEW, not in draft
    intro/route.ts            — POST (session member): record prs_intro_requests row    = draft's intro-request

src/components/prs/
  IntakeForm.tsx · ProcessingScreen.tsx · Report.tsx                  — 3 components (draft specced 7)

src/lib/prs/
  questions.ts · scoring.ts · types.ts                                — 3 modules (draft specced 7)

supabase/migrations/
  20260526070135_create_prs_assessments_table.sql
  20260529125627_add_visibility_to_assessments.sql
  20260601100613_add_project_group_to_assessments.sql
                                                                      — 3 incremental (not 2026_06_prs_assess.sql)
```

Not built (specced in draft § 8): `api/assess/rescore`, `step-done`, `reengage`,
`api/link/request`, `p/[token]/edit/page.tsx`, `admin/assess/page.tsx`, the
`src/emails/Prs*` templates, and the standalone lib modules `rubric.ts`,
`prompts.ts`, `matcher.ts`, `validation.ts`, `stage.ts`, `access-tier.ts`,
`access.ts` (their logic, where present, is consolidated into `scoring.ts` /
`questions.ts`). The 7 draft card components collapsed into `Report.tsx`.

### Cron jobs

**None shipped.** No `vercel.json`, no `assess-score` / `assess-reengage` /
`assess-fresh-match` jobs. Scoring is on-demand (see § 4); dormant nudges and weekly
fresh-match are unbuilt.

---

## 12. Build sequence — status against what shipped

| Sprint | Draft scope | Shipped status |
| :-- | :-- | :-- |
| 0 — Pre-flight | Lock prompt; seed `counterparty_profiles` ≥10 | Prompt logic in `scoring.ts`; **counterparty table never created** — seeding N/A |
| 1 — Schema + intake + submit + magic link | 1 migration (6 tables); validation; stage/access-tier; form; submit; processing; **magic-link email** | Shipped as **3 incremental migrations (2 tables)**; form + submit + processing live. **No magic-link email**, no `link/request` |
| 2 — Scoring + matcher + next-steps | prompts/rubric/matcher; score route; status route | Scoring + status shipped (`scoring.ts`). **Matcher unbuilt** (no counterparty table, no `assessment_matches`). next_steps live in `diagnosis` jsonb |
| 3 — Card UI (7 components) | StageBadge … MembershipCTA | Shipped as a single `Report.tsx` (+ `IntakeForm`, `ProcessingScreen`) |
| 4 — Edit + rescore + gating + admin + dormant | rescore/step-done endpoints, `access.ts`, member detection, edit page, admin, lapse handler, dormant cron | **Partial.** Member gating via **session auth** (not magic-link) on `intro` + `load`. Edit reads via `load`. **Re-score = re-submit with `reassessToken`** (no `/rescore`). **No `step-done`, no `admin/assess`, no dormant cron, no lapse handler** |
| 5 — Soft launch | Re-invite Phase 0 cohort; AI-vs-hand calibration | `assessments` holds **1 row** — effectively pre-/at-launch |

Net: the **public intake → on-demand AI score → SSR card → tracked intro request**
path is live. The **iteration loop** (dedicated re-score endpoint, mark-step-done,
edit page, admin console), the **lifecycle automation** (dormant + fresh-match
emails/crons), and the entire **counterparty/matcher layer** are not built. Member
gating exists, via session auth (the authoritative model — see above).

---

## Best practice: how to model re-score history

> **Status: Option A shipped (2026-06-03).** `submit/route.ts` now hands the stable
> token to the newest re-score version, so the card URL no longer changes. The
> analysis below is retained as the rationale and the trigger for Option B.

**The problem (now fixed).** `/api/assess/submit` previously called `genToken()` on
every submission, including re-scores — so each re-score created a **new row with a
new `/p/<token>` URL**, joined to its predecessors only by a shared `project_group`.
Consequences that drove the fix:

- A member's card URL **changes every time they re-score.** Any bookmark, shared
  link, or email pointing at the previous card is now stale. This directly breaks
  the PRD's "persistent return access" goal.
- The project header (`project_title/format/genre/country`) is **copied onto every
  version**, so it can drift across the group.
- Other rows attach to a *snapshot*, not the project: `prs_intro_requests.assessment_id`
  points at one version, so "all intros for this project" requires a join through
  `project_group`.
- "Latest score" is an implicit `max(created_at) where project_group = …` query
  with no canonical pointer.

**Best practice: separate identity from version** — the standard *mutable
current-state entity + append-only history* pattern. The thing with stable
identity (the project, and its URL) should not be regenerated when you add a new
version (a score). Two ways to get there, cheapest first:

### Option A — Minimal: make the token stable per project ✅ shipped

Stayed on the single denormalized table; stopped minting a new token on re-score.

- On re-assess, the new version **takes over the source row's `token`**; the prior
  version is re-tokened (token hand-off) and retained as history. A compensating
  rollback hands the token back if the new insert fails, so the URL is never orphaned.
- Because every route resolves a card strictly by `token`, the stable token always
  points at the newest version — **no changes needed elsewhere**.
- One change in `submit/route.ts`, **no migration**. Killed the changing-URL bug.

Caveat: the hand-off is two sequential statements with a compensating rollback, not
a true transaction. Safe for a single user re-scoring their own project; a genuinely
concurrent double re-score is the only theoretical race and self-heals to a
consistent state. Make it atomic (a Postgres function) only if that race matters —
which is effectively the trigger to do Option B anyway.

### Option B — Correct: introduce a canonical `projects` row

Graduate to the PRD's original split *only when something needs to attach to project
identity at scale* — a member dashboard, multiple projects per member, or the
matcher persisting results.

- `projects` holds the stable `token`, the editable header, `member_id`,
  `latest_assessment_id`, `readiness_stage`.
- `assessments` becomes pure append-only snapshots referencing `project_id`
  (drop the duplicated header columns; `project_group` becomes `project_id`).
- `prs_intro_requests.assessment_id` → add/repoint to `project_id`.
- Requires a migration + a one-row backfill (trivial at current volume).

### Recommendation

Do **Option A now** (kill the changing-URL bug with no migration), and treat
**Option B** as the trigger-based follow-up the first time you build a member
dashboard or the matcher. Don't build the full 6-table normalization speculatively —
`project_group` + a stable token covers today's needs; normalize when a second
entity genuinely needs to hang off project identity. Update Decision 8 / the § 5
token-lifetime row to say **"token is stable per project, not per score."**
