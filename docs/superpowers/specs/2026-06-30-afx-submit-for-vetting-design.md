# AFX Submit-for-Vetting (Producer Side) — Design Spec

**Date:** 2026-06-30
**Status:** Approved in brainstorm; ready for implementation planning.
**Scope:** The **producer-facing** half of S2 vetting. Let a producer **submit** a vetting-ready case study, or their **company/entity**, for FRA review — gated server-side by required-proof readiness, locked to a stable snapshot while pending, and reversible via **Withdraw**. Submissions persist as durable records that the future FRA review surface will consume.

---

## 1. Context & where this fits

AFX so far: S1 Foundation (#18) gave an invited producer a persisted private profile; Track Record capture (#19) let them build case studies + tagged evidence; the Documents slice (#20) added confidential, NDA-gated proof documents plus **required-proof readiness** (`isVettingReady`) — case studies now show "vetting-ready" vs "Unproven — N required doc(s) missing."

This slice adds the **submit action** that readiness was built for. In the producer journey:

```
PRODUCER
▼ Build Track Record + attach required proof           (shipped: #19, #20)
▼ Submit case study / entity for vetting   ← THIS SLICE (producer side)
└── FRA reviews queue → approve / request changes → promote self→verified   (NEXT SLICE: FRA review surface)
```

**This slice is the producer side only.** It is fully testable on its own: a submission lands in the database with the right status, gate, and lock semantics, even before any FRA UI exists. The FRA staff identity/role model, the review queue, the approve/request-changes UI, and the `self→verified` **provenance promotion** are a separate following slice. This slice defines the *complete* status lifecycle and *renders* every state, so the FRA slice only needs to **write** statuses.

**Two submission tracks** (decided in brainstorm — "both levels"):
- **Case-study track** — gated by the existing `isVettingReady(caseStudy.docs)` (all required proof documents attached). Reuses everything from #20.
- **Entity track** — the producer/company. Gated by **company proof documents** (a new producer-level confidential document store) plus the `entityK2` legal-entity attestation.

## 2. Goal & success criteria

**Goal:** a producer can submit a vetting-ready case study or their entity for FRA review; the submission is recorded, the item locks to a stable snapshot, and the producer can withdraw to edit and re-submit.

**Done when:**
1. A vetting-ready, **draft** case study shows a **"Submit for vetting"** action; submitting records a `submitted` submission and **locks** the case study (read-only) with a **"Pending FRA review · Withdraw"** state.
2. A new **Entity Vetting** panel lets a producer attach company documents, see required-entity readiness, and (when `entityK2` is on and required entity docs are present) **submit the entity**; the same lock/withdraw applies to the vetted entity fields + entity docs.
3. The submit **gate is enforced server-side**, not just in the UI — a not-ready submit is rejected.
4. Each track shows its **vetting status** (Draft / Submitted / Under review / Verified / Changes requested), including `reviewer_notes` when changes are requested (rendered now; written by the FRA slice).
5. **Withdraw** returns an open submission to editable draft.
6. Submissions persist in a dedicated **`afx_vetting_submissions`** table with RLS so a producer reaches only `submitted` / `withdrawn`, can never self-verify, and can never read or act on another producer's submissions.
7. Producer-level **`entity_docs`** persist in an isolated column, never in the profile blob and never funder-visible.

## 3. Data model & migration

Applied via the Supabase Dashboard SQL editor (the connected MCP cannot reach the prod project `rcgynwcttgvqcnbyfhiz`), same as prior slices.

### 3.1 New table `afx_vetting_submissions`

```sql
create table public.afx_vetting_submissions (
  id             uuid primary key default gen_random_uuid(),
  producer_id    uuid not null references public.afx_producers on delete cascade,
  kind           text not null check (kind in ('case_study','entity')),
  target_id      uuid references public.afx_projects on delete cascade,  -- project id; null for entity
  status         text not null default 'submitted'
                 check (status in ('submitted','under_review','verified','changes_requested','withdrawn')),
  reviewer_notes text,            -- written by the FRA slice; rendered now
  submitted_at   timestamptz not null default now(),
  decided_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index afx_vs_producer_idx on public.afx_vetting_submissions (producer_id);

-- At most one OPEN submission per target:
create unique index afx_vs_one_open_case on public.afx_vetting_submissions (target_id)
  where kind = 'case_study' and status in ('submitted','under_review');
create unique index afx_vs_one_open_entity on public.afx_vetting_submissions (producer_id)
  where kind = 'entity' and status in ('submitted','under_review');

alter table public.afx_vetting_submissions enable row level security;

-- Producer reads only their own submissions.
create policy afx_vs_select_own on public.afx_vetting_submissions
  for select using (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
  );

-- Producer inserts only their own rows, and only as 'submitted'.
create policy afx_vs_insert_own on public.afx_vetting_submissions
  for insert with check (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
    and status = 'submitted'
  );

-- Producer updates only their own rows, and only to 'withdrawn' (cannot self-verify).
create policy afx_vs_update_own on public.afx_vetting_submissions
  for update using (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
  ) with check (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
    and status = 'withdrawn'
  );
```

FRA-staff read/write policies are intentionally **omitted** — they arrive with the FRA review slice (which introduces the staff identity model).

### 3.2 Entity documents column

```sql
alter table public.afx_producers add column if not exists entity_docs jsonb;
```

Isolated confidential column for producer-level company documents (`AfxDocument[]`), parallel to `afx_projects.docs`. **Never** serialized into the profile blob; **never** funder-visible. The private `afx-documents` bucket from #20 is reused (no new bucket).

## 4. Status lifecycle & lock semantics

```
draft (no open row) ──submit──▶ submitted ──FRA──▶ under_review ──FRA──▶ verified
        ▲                          │                    │
        └────────withdraw──────────┴────────────────────┘
        ▲                                                └─▶ changes_requested ──┐
        └──────────── edit + re-submit (back to draft, then submit again) ◀──────┘
```

- **Open / locked statuses:** `submitted`, `under_review`. **Terminal-for-producer / unlocked:** `withdrawn`, `verified`, `changes_requested`, and "no row" (draft).
- **Locked** = the target has a submission in an open status → the item is read-only in the cockpit.
- **Server-side lock enforcement** (defense in depth, in `persistProfile`):
  - **Case study:** if a case study has an open submission, `persistProfile` keeps the stored row — it drops incoming content changes for that project, and refuses to archive or delete it. The stored row *is* the reviewed snapshot.
  - **Entity:** if an open entity submission exists, `persistProfile` pins the **vetted profile fields** — `name`, `company`, `bio`, `location`, `entityK2` — to their stored values (incoming changes to those fields are dropped), while **non-vetted** fields (`ndaSigned`, `consentK4`, relationships, slate) persist normally. `entity_docs` writes are blocked at the document API routes while locked.
  - No snapshot column is needed: because writes to locked content are rejected, the stored row remains exactly what was submitted.
- **This slice wires producer transitions only:** `submit` (→ `submitted`) and `withdraw` (→ `withdrawn`). `under_review`, `verified`, and `changes_requested` are written by the FRA slice; the cockpit renders all of them now. `changes_requested` surfaces `reviewer_notes` and invites edit + re-submit. `verified` shows a verified badge.

## 5. Producer-level (entity) document store

Mirrors the case-study document store from #20, reusing the private `afx-documents` bucket.

- **Storage path:** `${producerId}/entity/${docId}.${ext}`. Case-study paths remain `${producerId}/${caseStudyId}/${docId}.${ext}`.
- **`isOwnedDocPath` extension:** accept **either** shape — a UUID case-study segment **or** the literal `entity` segment — still rejecting `..`, foreign prefixes, and non-UUID `producerId` (the self-guard added in #20). Concretely the validator matches `^${producerId}/(entity|<uuid>)/<uuid>\.[a-z0-9]+$`.
- **Metadata:** `AfxDocument[]` stored in `afx_producers.entity_docs`.
- **API routes:** the existing `/api/afx/documents/{upload,sign,delete}` routes gain an **`entity` scope** (a discriminator field in the request body/form; absent ⇒ case-study scope as today). Entity scope ⇒ entity path + `entity_docs` metadata, same service-role + ownership + **NDA gate** (`ndaSigned` required) discipline. While an open entity submission exists, `upload` and `delete` in entity scope are rejected (lock).
- **Category enum:** a separate `EntityDocumentCategory`:
  - **Required:** `company_registration` (incorporation / CIPC), `director_id`, `tax_registration` (SARS / VAT).
  - **Optional supporting:** `bbbee_certificate`, `good_standing`, `other`.
- **Type note:** `AfxDocument.category` widens to `DocumentCategory | EntityDocumentCategory`; each scope validates against its own allowed list (case-study routes accept only `DocumentCategory`; entity routes only `EntityDocumentCategory`). The DB stores it as a JSONB string regardless.
- **Helpers** (in `documents.ts`): `REQUIRED_ENTITY_DOCUMENT_CATEGORIES`, `missingRequiredEntityDocs(docs)`, `isEntityVettingReady(profile)` — the entity is vetting-ready when `entityK2 === true` **and** `missingRequiredEntityDocs(entity_docs).length === 0`.

## 6. Server actions & security

Two Next server actions, using the session-scoped Supabase server client (cookies) so the new RLS policies apply — consistent with existing AFX DB writes (`persistProfile`). The readiness gate is **re-checked server-side** and never trusts the client.

- **`submitForVettingAction({ kind, targetId? })`**
  1. Resolve the session producer (no session / not a producer ⇒ reject).
  2. Verify ownership of the target (`kind:'case_study'` ⇒ the project belongs to this producer; `kind:'entity'` ⇒ self).
  3. Re-check the gate: `isVettingReady(project.docs)` for a case study; `isEntityVettingReady(profile)` for entity. Not ready ⇒ reject (400-style result).
  4. Insert a `submitted` row. A double-submit hits the partial-unique index ⇒ surfaced as "already submitted for vetting."
  5. Return the new submission.
- **`withdrawVettingAction({ submissionId })`** — verify ownership and that the row is in an open status; set `status='withdrawn'`, `decided_at = now()`. The item unlocks.

Producers can only reach `submitted` / `withdrawn`; the RLS `WITH CHECK` clauses enforce this even against a tampered client. No FRA/staff capability exists in this slice.

## 7. Cockpit wiring & UX

- **Loading:** `loadProducerState` additionally loads (a) the producer's `afx_vetting_submissions` rows and (b) `afx_producers.entity_docs`, so the cockpit can derive lock state + status badges. A small client-side index maps `target_id → open submission` and tracks the entity submission.
- **Case-study track** (`TrackRecordZone` card + `CaseStudyDrawer`):
  - A **vetting-status badge** (Draft / Submitted / Under review / Verified / Changes requested) on the card and in the drawer header.
  - **Draft + vetting-ready** ⇒ a **"Submit for vetting"** action in the drawer footer (alongside Save). The existing "Unproven — N required doc(s) missing" badge already explains why it is unavailable when not ready.
  - **Locked** (`submitted`/`under_review`) ⇒ the drawer renders read-only; footer shows **"Pending FRA review · Withdraw."**
  - **Changes requested** ⇒ show `reviewer_notes`, allow editing, offer **re-submit**.
- **Entity track** — a new **`EntityVettingPanel`** (placed near `AccountVisibility`):
  - The producer-level **entity document upload** (a new `AfxEntityDocumentUpload`, reusing the readiness-panel pattern from `AfxDocumentUpload`) with the required-entity checklist.
  - The `entityK2` requirement surfaced (with a link to the K2 toggle if off).
  - The entity **vetting-status badge** + **Submit / Withdraw**.
- **State:** new cockpit state holds the submissions index + `entity_docs`; submit/withdraw call the server actions and update local state on success. Autosave is unaffected for non-vetted fields.

## 8. Funder boundary

- `entity_docs` is stripped from every funder serialization — same discipline as `exact`/`docs` (`Omit` at the type level + runtime delete). Entity company documents are producer + FRA only.
- `afx_vetting_submissions` is producer + FRA only; never part of any funder view in this slice. (A future "verified producer" funder badge would derive from promoted `verified` **provenance**, not from raw submission rows.)

## 9. Out of scope (later slices)

- **FRA staff identity / role model**, the **review queue**, the **approve / request-changes** UI, and the **`self → verified` provenance promotion** — the FRA review slice. This slice only *renders* `under_review` / `verified` / `changes_requested`.
- **Email / push notification to FRA on submit** — the FRA queue will surface new submissions; recorded as an optional fast-follow, not built here.
- **Virus / malware scanning** of entity documents (inherited from #20's out-of-scope).
- **In-browser document preview** (View opens a signed URL, as in #20).

## 10. Verification

No test runner in this project → `tsc --noEmit` + `next build`, plus `tsx` assertions and a live supabase-js gate.

- **Pure helpers** (`tsx`): `missingRequiredEntityDocs` (empty / partial / full / duplicate-category) and `isEntityVettingReady` (K2 off blocks even with all docs; K2 on + all docs ⇒ ready).
- **Live gate** (service-role admin + per-user JWT, with cleanup):
  1. `submitForVettingAction` on a ready case study creates a `submitted` row; on a **not-ready** case study it is **rejected** server-side.
  2. `withdrawVettingAction` flips the row to `withdrawn` and unlocks.
  3. `persistProfile` **drops** an edit to a `submitted` case study (stored content unchanged) and refuses to archive/delete it.
  4. `entity_docs` round-trips in its own column and is **absent** from the profile blob and from the funder view.
  5. RLS: producer B cannot SELECT or UPDATE producer A's submission; a producer cannot INSERT a non-`submitted` row or UPDATE to `verified`.
  6. The partial-unique index blocks a second open submission for the same target.
- `tsc` + `next build` clean.

## 11. Risks & decisions

- **Bigger slice ("both levels"):** the entity track adds a net-new producer-level document store on top of the submission mechanics. Accepted; the plan decomposes it into clear tasks (helpers/types → migration/persistence → entity doc routes+store → submissions table+actions → cockpit UX → live gate).
- **Entity lock is field-level** (the profile is one JSONB blob mixing vetted + non-vetted fields). Resolved by pinning the vetted subset to stored values on persist while an entity submission is open — no snapshot column, no broad profile freeze.
- **Migration required** (new table + `entity_docs` column). Additive; touches no existing column. Applied via Dashboard.
- **Forward-compatibility:** the full status enum + `reviewer_notes`/`decided_at` are defined now, so the FRA slice adds staff policies and writes statuses without another migration.
- **Provenance promotion stays in the FRA slice:** submitting does **not** change any field's `self`/`confirmed`/`verified` provenance — only FRA verification does, later.

## 12. Open questions

- None blocking. Future (FRA slice): whether `verified` should hard-lock a case study against silent edits (auto-revert to `self` on material change) or just flag for re-review; whether the entity required-doc set should add B-BBEE as required for the SA market at launch.
