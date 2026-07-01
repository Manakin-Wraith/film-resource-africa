# AFX FRA Review Surface (S2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give FRA staff an allow-listed review surface at `/afx/staff` to work the vetting queue, view producers' confidential proof documents, promote case-study claims `self→verified` per field (and mark companies verified), and record auditable decisions.

**Architecture:** All staff data access flows through server-only code behind a single `resolveStaff()` guard using the existing service-role client (`afxAdmin`); the producer RLS is untouched. Verification writes into the producer's data (nested `provenance` in `afx_projects.body`; a new isolated `afx_producers.entity_verified_at` column) only while the producer is edit-locked (`under_review`), so there are no write races and nothing can be forged from the producer path.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (no test runner), Supabase (Postgres + RLS + Storage + `@supabase/ssr`), Vercel.

## Global Constraints

- **No test runner.** Verification = `npx tsc --noEmit -p tsconfig.json`, `npx next build`, `npx tsx` assertion scripts (written to the scratchpad, deleted after), and a live supabase-js script (service-role admin + real disposable auth users for RLS, with cleanup). Mirror the prior AFX slices. Do NOT add jest/vitest.
- **MIGRATION REQUIRED, applied by the user via Dashboard** (`https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new`). Tasks 1–6 are code-only and verify via tsc/build/tsx; the live DB gate (Task 7) runs only after the user confirms the migration is applied.
- **Approach A — one staff gate:** every staff route/action and the `/afx/staff` layout calls `resolveStaff()` FIRST; service-role (`afxAdmin`) reads/writes happen only behind it. Never add staff RLS policies or a staff user-JWT path. The old cookie `/admin` gate is NOT reused.
- **No forged verification (load-bearing invariant), DB-ENFORCED:** the S1 RLS lets a producer write any column/content of their own rows, so app-layer isolation is not enough. Two `BEFORE UPDATE` triggers (in the Task 1 migration) block the `authenticated`/`anon` roles from changing `entity_verified_at` or introducing `provenance='verified'` into `afx_projects.body` — service-role (staff actions) + migrations pass through; `verified→self` and re-saving a body that retains an already-verified field are allowed. Belt-and-suspenders: `entity_verified_at` is also an isolated column stripped from the producer blob and never written by `persistProfile`; staff field-flips happen only while `under_review`.
- **Per-field verify:** addressable case-study fields are `budgetBand`, `recoupment`, `bondUsed`, and `distribution:<index>` (array index; the array is stable while `under_review`). Verify writes `provenance='verified'`; revert writes `provenance='self'`.
- **Workflow:** `submitted → under_review` (Start review) → verify fields/notes → decide: Approve (`verified`) or Request changes (`changes_requested`). Both stamp `decided_at` + `reviewed_by`. Entity Approve also sets `entity_verified_at`.
- **Doc access is submission-scoped:** the staff sign route validates the path belongs to the submission's producer + target (`isOwnedDocPath` AND the path's middle segment equals the case-study id, or `entity`).
- **AFX visual system:** inline styles + `var(--afx-*)`; reuse `AfxTopBar`, `ProvenanceBadge`, `SectionCard`, `VETTING_STATUS_META`. Client actions use the guard / try-catch / in-flight-`busy` pattern standardized on the producer side.
- **Provenance values:** `Provenance = 'self' | 'confirmed' | 'verified'`. `ProjectOutcomes` = `{ recoupment: Provenanced<string>; bondUsed: Provenanced<string>; distribution: { name; type; provenance }[]; festivalsAwards: string[] }`. `Project.budgetBand: Provenanced<string>`.

---

### Task 1: Types + persistence isolation for `entityVerifiedAt`/`reviewedBy` + migration SQL

**Files:**
- Modify: `src/lib/afx/types.ts` (ProducerProfile ~147–164; VettingSubmission ~218–226)
- Modify: `src/lib/afx/persistence.ts`
- Create: `supabase/migrations/20260701_afx_staff_review.sql`

**Interfaces:**
- Produces: `ProducerProfile.entityVerifiedAt?: string`; `VettingSubmission.reviewedBy?: string`; `ProducerRow.entity_verified_at: string | null`; `VettingSubmissionRow.reviewed_by: string | null`; `profileToRows` strips `entityVerifiedAt` out of the blob and does NOT return it; `rowsToProfile` re-stitches it from the column; `submissionFromRow` maps `reviewed_by→reviewedBy`.

- [ ] **Step 1: Add the type fields.** In `src/lib/afx/types.ts`, add to `ProducerProfile` (after the `entityDocs?` field, ~line 163):

```ts
  /** FRA entity-verification marker. Isolated: persisted in afx_producers.entity_verified_at,
   *  NEVER inside the profile blob (a producer's client-authoritative persistProfile must not
   *  be able to forge it) — written only by the staff review action. Presence = verified company. */
  entityVerifiedAt?: string;
```

In `VettingSubmission` (after `decidedAt?`, ~line 225), add:

```ts
  /** auth.users id of the staff member who decided (audit). Written by the FRA review slice. */
  reviewedBy?: string;
```

- [ ] **Step 2: Update the persistence mappers.** In `src/lib/afx/persistence.ts`:

`ProducerRow` — add the column field after `entity_docs`:
```ts
  entity_docs: AfxDocument[] | null;
  entity_verified_at: string | null;
```
`VettingSubmissionRow` — add after `decided_at`:
```ts
  decided_at: string | null;
  reviewed_by: string | null;
```
`submissionFromRow` — map it (after the `decided_at` line):
```ts
  if (r.decided_at != null) s.decidedAt = r.decided_at;
  if (r.reviewed_by != null) s.reviewedBy = r.reviewed_by;
  return s;
```
`rowsToProfile` — stitch the marker (after the `entity_docs` stitch):
```ts
  if (producer.entity_docs != null) profile.entityDocs = producer.entity_docs;
  if (producer.entity_verified_at != null) profile.entityVerifiedAt = producer.entity_verified_at;
  return profile;
```
`profileToRows` — strip `entityVerifiedAt` OUT of the blob and DO NOT return it (the producer path never writes it):
```ts
export function profileToRows(p: ProducerProfile): { profile: ProducerRow['profile']; entityDocs: AfxDocument[] | null; projects: ProjectRow[] } {
  const { id: _id, slate, entityDocs, entityVerifiedAt, ...profile } = p;
  void _id; void entityVerifiedAt;
  return { profile, entityDocs: entityDocs ?? null, projects: (slate ?? []).map((pr) => projectToRow(p.id, pr)) };
}
```
(The `ProducerRow['profile']` type is `Omit<ProducerProfile,'id'|'slate'|'entityDocs'>`, which still lists `entityVerifiedAt`. Widen that Omit so the blob type excludes it too: change the `profile` field on `ProducerRow` to `Omit<ProducerProfile, 'id' | 'slate' | 'entityDocs' | 'entityVerifiedAt'>` and update the doc comment to mention both isolated fields.)

- [ ] **Step 3: Write the migration** `supabase/migrations/20260701_afx_staff_review.sql`:

```sql
-- AFX FRA review surface (S2b): staff allowlist + audit + entity verification marker.

create table if not exists public.afx_staff (
  user_id    uuid primary key references auth.users on delete cascade,
  role       text not null default 'reviewer' check (role in ('reviewer','admin')),
  created_at timestamptz not null default now()
);
alter table public.afx_staff enable row level security;
-- No client policies: only the service-role staff guard reads this table.

-- Audit: which staff member decided a submission (decided_at already exists).
alter table public.afx_vetting_submissions add column if not exists reviewed_by uuid references auth.users;

-- Entity verification marker — its OWN column, never inside the profile JSONB blob.
alter table public.afx_producers add column if not exists entity_verified_at timestamptz;

-- Anti-forge triggers: producers can write their own rows via RLS with no column/content
-- restriction, so 'verified' must be blocked at the DB for client roles. Only 'authenticated'/
-- 'anon' are guarded; service-role (staff actions) + migrations pass through.
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

(Do NOT apply it. The user applies it via Dashboard before Task 7.)

- [ ] **Step 4: Assertion script** `scratchpad/t1.ts` (adjust the import path to the repo `src/`), run `npx tsx`, expect `ALL_OK`, delete:

```ts
import { profileToRows, rowsToProfile, submissionFromRow } from '../src/lib/afx/persistence.ts';
let ok = true; const ck = (n: string, p: boolean) => { if (!p) ok = false; console.log(p ? 'PASS' : 'FAIL', n); };
const profile = { id: 'P1', name: 'N', company: 'Co', bio: '', ratingBand: 'C', careerStage: '', relationships: [], slate: [], ndaSigned: true, entityK2: true, consentK4: false, entityVerifiedAt: '2026-07-01T00:00:00Z' } as any;
const rows = profileToRows(profile);
ck('entityVerifiedAt stripped from blob', !('entityVerifiedAt' in rows.profile));
ck('profileToRows does not return entityVerifiedAt (producer never writes it)', !('entityVerifiedAt' in rows));
const back = rowsToProfile({ id: 'P1', user_id: 'U', profile: rows.profile, entity_docs: null, entity_verified_at: '2026-07-01T00:00:00Z' } as any, []);
ck('entityVerifiedAt restitched from column', back.entityVerifiedAt === '2026-07-01T00:00:00Z');
const back2 = rowsToProfile({ id: 'P1', user_id: 'U', profile: rows.profile, entity_docs: null, entity_verified_at: null } as any, []);
ck('no marker when column null', back2.entityVerifiedAt === undefined);
const s = submissionFromRow({ id: 'S', producer_id: 'P1', kind: 'entity', target_id: null, status: 'verified', reviewer_notes: null, submitted_at: '2026-01-01', decided_at: '2026-02-01', reviewed_by: 'staff-1' } as any);
ck('reviewedBy mapped', s.reviewedBy === 'staff-1');
const s2 = submissionFromRow({ id: 'S', producer_id: 'P1', kind: 'entity', target_id: null, status: 'submitted', reviewer_notes: null, submitted_at: '2026-01-01', decided_at: null, reviewed_by: null } as any);
ck('reviewedBy absent when null', !('reviewedBy' in s2));
console.log(ok ? 'ALL_OK' : 'FAILED');
```

- [ ] **Step 5: Typecheck.** `npx tsc --noEmit -p tsconfig.json` → exit 0.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/afx/types.ts src/lib/afx/persistence.ts supabase/migrations/20260701_afx_staff_review.sql
git commit -m "feat(afx): staff-review types + entity_verified_at isolation + migration"
```

---

### Task 2: Staff auth guard + read layer (queue + detail)

**Files:**
- Create: `src/lib/afx/server/staffAccess.ts`
- Create: `src/lib/afx/server/staffReview.ts` (read functions only in this task)

**Interfaces:**
- Consumes: `afxAdmin` (from `documentAccess.ts`), `getSessionUser`, `submissionFromRow`/`VettingSubmissionRow`, `rowsToProfile`/`ProducerRow`/`ProjectRow`, `AfxDocument`, `Project`, `ProducerProfile`.
- Produces: `resolveStaff(): Promise<StaffAccess | null>` where `StaffAccess = { userId: string; role: 'reviewer' | 'admin' }`; `listSubmissions(filter: 'open' | 'decided'): Promise<StaffQueueItem[]>`; `getSubmissionDetail(id: string): Promise<SubmissionDetail | null>`.

- [ ] **Step 1: Create `src/lib/afx/server/staffAccess.ts`:**

```ts
import 'server-only';
import { getSessionUser } from '@/lib/supabase/server';
import { afxAdmin } from '@/lib/afx/server/documentAccess';

export interface StaffAccess { userId: string; role: 'reviewer' | 'admin'; }

/** Resolve the calling session to a staff member via the afx_staff allowlist.
 *  Service-role read (afx_staff has RLS on, no client policies). Returns null for
 *  non-staff. This is THE gate — every staff route/action/layout calls it first. */
export async function resolveStaff(): Promise<StaffAccess | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { data } = await afxAdmin
    .from('afx_staff').select('user_id, role').eq('user_id', user.id)
    .maybeSingle<{ user_id: string; role: 'reviewer' | 'admin' }>();
  if (!data) return null;
  return { userId: data.user_id, role: data.role };
}
```

- [ ] **Step 2: Create the read layer in `src/lib/afx/server/staffReview.ts`:**

```ts
import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { submissionFromRow, rowsToProfile, type VettingSubmissionRow, type ProducerRow, type ProjectRow } from '@/lib/afx/persistence';
import type { AfxDocument, Project, ProducerProfile, VettingSubmission } from '@/lib/afx/types';

const SUBMISSION_COLS = 'id, producer_id, kind, target_id, status, reviewer_notes, submitted_at, decided_at, reviewed_by';

export interface StaffQueueItem {
  submission: VettingSubmission;
  producerId: string;
  producerName: string;
  company: string;
  targetTitle: string | null;  // case-study title, or null for entity
}

export interface SubmissionDetail {
  submission: VettingSubmission;
  producer: ProducerProfile;          // full profile (incl. entityDocs, entityVerifiedAt)
  project: Project | null;            // the case study (with docs), or null for entity
}

const OPEN = ['submitted', 'under_review'];

/** Queue across ALL producers. filter 'open' = submitted+under_review; 'decided' = the rest. */
export async function listSubmissions(filter: 'open' | 'decided'): Promise<StaffQueueItem[]> {
  if (!(await resolveStaff())) return [];
  let q = afxAdmin.from('afx_vetting_submissions').select(SUBMISSION_COLS).order('submitted_at', { ascending: false });
  q = filter === 'open' ? q.in('status', OPEN) : q.not('status', 'in', `(${OPEN.join(',')})`);
  const { data: subs } = await q;
  const rows = (subs ?? []) as VettingSubmissionRow[];
  if (rows.length === 0) return [];
  const producerIds = [...new Set(rows.map((r) => r.producer_id))];
  const targetIds = [...new Set(rows.map((r) => r.target_id).filter((x): x is string => !!x))];
  const { data: producers } = await afxAdmin.from('afx_producers').select('id, profile').in('id', producerIds);
  const { data: projects } = targetIds.length
    ? await afxAdmin.from('afx_projects').select('id, body').in('id', targetIds)
    : { data: [] as { id: string; body: { title?: string } }[] };
  const pMap = new Map((producers ?? []).map((p: { id: string; profile: { name?: string; company?: string } }) => [p.id, p.profile]));
  const tMap = new Map((projects ?? []).map((p: { id: string; body: { title?: string } }) => [p.id, p.body?.title ?? null]));
  return rows.map((r) => ({
    submission: submissionFromRow(r),
    producerId: r.producer_id,
    producerName: pMap.get(r.producer_id)?.name ?? '—',
    company: pMap.get(r.producer_id)?.company ?? '—',
    targetTitle: r.target_id ? (tMap.get(r.target_id) ?? null) : null,
  }));
}

/** Full read-only projection of one submission for the drill-down. */
export async function getSubmissionDetail(id: string): Promise<SubmissionDetail | null> {
  if (!(await resolveStaff())) return null;
  const { data: subRow } = await afxAdmin.from('afx_vetting_submissions').select(SUBMISSION_COLS).eq('id', id).maybeSingle<VettingSubmissionRow>();
  if (!subRow) return null;
  const { data: prod } = await afxAdmin.from('afx_producers').select('id, user_id, profile, entity_docs, entity_verified_at').eq('id', subRow.producer_id).maybeSingle<ProducerRow>();
  if (!prod) return null;
  const { data: projRows } = await afxAdmin.from('afx_projects').select('id, producer_id, status, deal_ref, body, exact, docs').eq('producer_id', subRow.producer_id);
  const projects = (projRows ?? []) as ProjectRow[];
  const producer = rowsToProfile(prod, projects);
  const project = subRow.target_id ? (producer.slate.find((p) => p.id === subRow.target_id) ?? null) : null;
  return { submission: submissionFromRow(subRow), producer, project };
}
```

- [ ] **Step 3: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` (exit 0) then `npx next build` (clean). No live DB (Task 7).

- [ ] **Step 4: Commit.**

```bash
git add src/lib/afx/server/staffAccess.ts src/lib/afx/server/staffReview.ts
git commit -m "feat(afx): staff auth guard + review read layer (queue + detail)"
```

---

### Task 3: Staff mutation layer + server actions (claim, per-field verify, decide)

**Files:**
- Modify: `src/lib/afx/server/staffReview.ts` (append the write functions)
- Create: `src/app/afx/staff/actions.ts`

**Interfaces:**
- Consumes: `resolveStaff`, `afxAdmin`, `getSubmissionDetail` types.
- Produces: `startReview(id)`, `verifyField(id, field)`, `revertField(id, field)`, `decide(id, decision, notes?)` — each `Promise<{ ok: boolean; error?: string }>`; the `VerifyField = 'budgetBand' | 'recoupment' | 'bondUsed' | \`distribution:${number}\`` type; server actions `startReviewAction`, `verifyFieldAction`, `revertFieldAction`, `decideAction`.

- [ ] **Step 1: Append the write layer to `src/lib/afx/server/staffReview.ts`:**

```ts
import type { Provenance } from '@/lib/afx/types';

export type VerifyField = 'budgetBand' | 'recoupment' | 'bondUsed' | `distribution:${number}`;
type Result = { ok: boolean; error?: string };

/** Claim a submitted item → under_review (keeps the producer edit-locked). */
export async function startReview(id: string): Promise<Result> {
  if (!(await resolveStaff())) return { ok: false, error: 'Not authorized' };
  const { data } = await afxAdmin.from('afx_vetting_submissions')
    .update({ status: 'under_review', updated_at: new Date().toISOString() })
    .eq('id', id).eq('status', 'submitted').select('id');
  if (!data || data.length === 0) return { ok: false, error: 'Only a submitted item can be started' };
  return { ok: true };
}

/** Set a case-study field's provenance. Only while under_review (producer locked). */
async function setFieldProvenance(id: string, field: VerifyField, prov: Provenance): Promise<Result> {
  if (!(await resolveStaff())) return { ok: false, error: 'Not authorized' };
  const { data: sub } = await afxAdmin.from('afx_vetting_submissions')
    .select('kind, target_id, status').eq('id', id)
    .maybeSingle<{ kind: string; target_id: string | null; status: string }>();
  if (!sub) return { ok: false, error: 'Submission not found' };
  if (sub.kind !== 'case_study' || !sub.target_id) return { ok: false, error: 'Not a case study' };
  if (sub.status !== 'under_review') return { ok: false, error: 'Start review before verifying' };
  const { data: proj } = await afxAdmin.from('afx_projects').select('body').eq('id', sub.target_id).maybeSingle<{ body: Record<string, unknown> }>();
  if (!proj) return { ok: false, error: 'Case study not found' };
  const body = proj.body as {
    budgetBand?: { provenance: Provenance };
    outcomes?: { recoupment?: { provenance: Provenance }; bondUsed?: { provenance: Provenance }; distribution?: { provenance: Provenance }[] };
  };
  if (field === 'budgetBand') { if (!body.budgetBand) return { ok: false, error: 'No budget band' }; body.budgetBand.provenance = prov; }
  else if (field === 'recoupment') { if (!body.outcomes?.recoupment) return { ok: false, error: 'No recoupment' }; body.outcomes.recoupment.provenance = prov; }
  else if (field === 'bondUsed') { if (!body.outcomes?.bondUsed) return { ok: false, error: 'No bond' }; body.outcomes.bondUsed.provenance = prov; }
  else {
    const idx = Number(field.split(':')[1]);
    const row = body.outcomes?.distribution?.[idx];
    if (!row) return { ok: false, error: 'No distribution row' };
    row.provenance = prov;
  }
  const { error } = await afxAdmin.from('afx_projects').update({ body, updated_at: new Date().toISOString() }).eq('id', sub.target_id);
  if (error) return { ok: false, error: 'Could not write provenance' };
  return { ok: true };
}
export const verifyField = (id: string, field: VerifyField) => setFieldProvenance(id, field, 'verified');
export const revertField = (id: string, field: VerifyField) => setFieldProvenance(id, field, 'self');

/** Decide a submission. Approve → verified; request_changes → changes_requested (+notes).
 *  Both stamp decided_at + reviewed_by. Entity approve also sets entity_verified_at. */
export async function decide(id: string, decision: 'approve' | 'request_changes', notes?: string): Promise<Result> {
  const staff = await resolveStaff();
  if (!staff) return { ok: false, error: 'Not authorized' };
  const { data: sub } = await afxAdmin.from('afx_vetting_submissions')
    .select('kind, producer_id, status').eq('id', id)
    .maybeSingle<{ kind: string; producer_id: string; status: string }>();
  if (!sub) return { ok: false, error: 'Submission not found' };
  if (sub.status !== 'submitted' && sub.status !== 'under_review') return { ok: false, error: 'Already decided' };
  const now = new Date().toISOString();
  const patch = decision === 'approve'
    ? { status: 'verified', decided_at: now, reviewed_by: staff.userId, updated_at: now }
    : { status: 'changes_requested', reviewer_notes: notes ?? null, decided_at: now, reviewed_by: staff.userId, updated_at: now };
  const { error } = await afxAdmin.from('afx_vetting_submissions').update(patch).eq('id', id);
  if (error) return { ok: false, error: 'Could not record decision' };
  if (decision === 'approve' && sub.kind === 'entity') {
    const { error: mErr } = await afxAdmin.from('afx_producers').update({ entity_verified_at: now, updated_at: now }).eq('id', sub.producer_id);
    if (mErr) return { ok: false, error: 'Decision saved but marker failed' };
  }
  return { ok: true };
}
```

- [ ] **Step 2: Create `src/app/afx/staff/actions.ts`:**

```ts
'use server';

import { startReview, verifyField, revertField, decide, type VerifyField } from '@/lib/afx/server/staffReview';

export async function startReviewAction(id: string) { return startReview(id); }
export async function verifyFieldAction(id: string, field: VerifyField) { return verifyField(id, field); }
export async function revertFieldAction(id: string, field: VerifyField) { return revertField(id, field); }
export async function decideAction(id: string, decision: 'approve' | 'request_changes', notes?: string) { return decide(id, decision, notes); }
```

- [ ] **Step 3: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` (exit 0) then `npx next build` (clean).

- [ ] **Step 4: Commit.**

```bash
git add src/lib/afx/server/staffReview.ts src/app/afx/staff/actions.ts
git commit -m "feat(afx): staff mutation layer — claim, per-field verify, decide (+entity marker)"
```

---

### Task 4: Staff document sign route (submission-scoped)

**Files:**
- Create: `src/app/api/afx/staff/documents/sign/route.ts`

**Interfaces:**
- Consumes: `resolveStaff`, `afxAdmin`, `AFX_DOCS_BUCKET`, `isOwnedDocPath`.

- [ ] **Step 1: Create the route** `src/app/api/afx/staff/documents/sign/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, isOwnedDocPath } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';

export async function POST(req: NextRequest) {
  const { submissionId, path } = await req.json().catch(() => ({} as { submissionId?: string; path?: string }));
  if (typeof submissionId !== 'string' || typeof path !== 'string' || path === '') {
    return NextResponse.json({ error: 'Missing submissionId or path' }, { status: 400 });
  }
  if (!(await resolveStaff())) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { data: sub } = await afxAdmin.from('afx_vetting_submissions')
    .select('kind, producer_id, target_id').eq('id', submissionId)
    .maybeSingle<{ kind: string; producer_id: string; target_id: string | null }>();
  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  // The path must belong to THIS submission's producer + target.
  const expectedSegment = sub.kind === 'entity' ? 'entity' : sub.target_id;
  if (!expectedSegment || !isOwnedDocPath(path, sub.producer_id) || path.split('/')[1] !== expectedSegment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data, error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).createSignedUrl(path, 60);
  if (error) {
    console.error('[afx-staff-docs] storage error:', error.message);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
```

- [ ] **Step 2: Path-scope assertion** `scratchpad/t4.ts` (copy the `isOwnedDocPath` logic standalone + the segment check, since importing the module inits a Supabase client), run `npx tsx`, expect `ALL_OK`, delete:

```ts
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_RE = new RegExp(`^${UUID}$`, 'i');
function isOwnedDocPath(path: string, producerId: string): boolean {
  if (path.includes('..')) return false;
  if (!UUID_RE.test(producerId)) return false;
  return new RegExp(`^${producerId}/(?:entity|${UUID})/${UUID}\\.[a-z0-9]+$`, 'i').test(path);
}
function staffAllowed(path: string, producerId: string, kind: string, targetId: string | null): boolean {
  const expected = kind === 'entity' ? 'entity' : targetId;
  return !!expected && isOwnedDocPath(path, producerId) && path.split('/')[1] === expected;
}
const P = '11111111-1111-1111-1111-111111111111';
const C = '22222222-2222-2222-2222-222222222222';
const OTHER = '44444444-4444-4444-4444-444444444444';
const D = '33333333-3333-3333-3333-333333333333';
let ok = true; const ck = (n: string, got: boolean, exp: boolean) => { if (got !== exp) ok = false; console.log(got === exp ? 'PASS' : 'FAIL', n); };
ck('entity submission → entity doc', staffAllowed(`${P}/entity/${D}.pdf`, P, 'entity', null), true);
ck('case submission → its case doc', staffAllowed(`${P}/${C}/${D}.pdf`, P, 'case_study', C), true);
ck('case submission cannot reach a DIFFERENT case study', staffAllowed(`${P}/${OTHER}/${D}.pdf`, P, 'case_study', C), false);
ck('case submission cannot reach entity docs', staffAllowed(`${P}/entity/${D}.pdf`, P, 'case_study', C), false);
ck('entity submission cannot reach a case doc', staffAllowed(`${P}/${C}/${D}.pdf`, P, 'entity', null), false);
ck('foreign producer prefix rejected', staffAllowed(`${OTHER}/entity/${D}.pdf`, P, 'entity', null), false);
ck('traversal rejected', staffAllowed(`${P}/../x/${D}.pdf`, P, 'case_study', C), false);
console.log(ok ? 'ALL_OK' : 'FAILED');
```

- [ ] **Step 3: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` (exit 0) then `npx next build` (clean; `/api/afx/staff/documents/sign` route present).

- [ ] **Step 4: Commit.**

```bash
git add src/app/api/afx/staff/documents/sign/route.ts
git commit -m "feat(afx): submission-scoped staff document sign route"
```

---

### Task 5: Staff shell — layout gate + queue

**Files:**
- Create: `src/app/afx/staff/layout.tsx`
- Create: `src/app/afx/staff/page.tsx`
- Create: `src/components/afx/staff/StaffQueue.tsx`

**Interfaces:**
- Consumes: `resolveStaff`, `listSubmissions`/`StaffQueueItem`, `VETTING_STATUS_META`, `AfxTopBar`.
- Produces: the `/afx/staff` route (staff-gated) rendering the queue; rows link to `/afx/staff/<id>`.

- [ ] **Step 1: Layout gate** `src/app/afx/staff/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { resolveStaff } from '@/lib/afx/server/staffAccess';

export default async function AfxStaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/afx/staff');
  const staff = await resolveStaff();
  if (!staff) redirect('/afx');
  return <>{children}</>;
}
```

- [ ] **Step 2: Queue page** `src/app/afx/staff/page.tsx`:

```tsx
import AfxTopBar from '@/components/afx/AfxTopBar';
import { listSubmissions } from '@/lib/afx/server/staffReview';
import StaffQueue from '@/components/afx/staff/StaffQueue';

export default async function AfxStaffPage() {
  const open = await listSubmissions('open');
  const decided = await listSubmissions('decided');
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffQueue open={open} decided={decided} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Queue component** `src/components/afx/staff/StaffQueue.tsx` (client; tab between open/decided; rows are links). Read `src/components/afx/AfxTopBar.tsx` and an existing cockpit panel first to match styling, then:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { StaffQueueItem } from '@/lib/afx/server/staffReview';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';

const mono = 'var(--afx-mono)';

export default function StaffQueue({ open, decided }: { open: StaffQueueItem[]; decided: StaffQueueItem[] }) {
  const [tab, setTab] = useState<'open' | 'decided'>('open');
  const rows = tab === 'open' ? open : decided;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['open', 'decided'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ cursor: 'pointer', fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '7px 13px', borderRadius: 8, border: '1px solid var(--afx-border)',
              background: tab === t ? 'var(--afx-ink)' : '#fff', color: tab === t ? '#fff' : 'var(--afx-muted)' }}>
            {t} ({t === 'open' ? open.length : decided.length})
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--afx-faint)', padding: '20px 0' }}>Nothing here.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const m = VETTING_STATUS_META[r.submission.status];
            return (
              <Link key={r.submission.id} href={`/afx/staff/${r.submission.id}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)' }}>
                    {r.submission.kind === 'entity' ? `${r.company} — company vetting` : (r.targetTitle || 'Untitled case study')}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)', marginTop: 3 }}>
                    {r.producerName} · {r.company} · submitted {r.submission.submittedAt.slice(0, 10)}
                  </div>
                </div>
                <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: m.ink, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 999, padding: '3px 10px' }}>{m.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` (exit 0) then `npx next build` (clean; `/afx/staff` route present).

- [ ] **Step 5: Commit.**

```bash
git add src/app/afx/staff/layout.tsx src/app/afx/staff/page.tsx src/components/afx/staff/StaffQueue.tsx
git commit -m "feat(afx): staff shell — gated layout + submission queue"
```

---

### Task 6: Staff submission drill-down (per-field verify + decide)

**Files:**
- Create: `src/app/afx/staff/[id]/page.tsx`
- Create: `src/components/afx/staff/StaffSubmissionDetail.tsx`

**Interfaces:**
- Consumes: `getSubmissionDetail`/`SubmissionDetail`, the four server actions from Task 3 (`startReviewAction`, `verifyFieldAction`, `revertFieldAction`, `decideAction`), `ProvenanceBadge`, `VETTING_STATUS_META`, `SectionCard`, `VerifyField`.

- [ ] **Step 1: Detail page** `src/app/afx/staff/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { getSubmissionDetail } from '@/lib/afx/server/staffReview';
import StaffSubmissionDetail from '@/components/afx/staff/StaffSubmissionDetail';

export default async function AfxStaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getSubmissionDetail(id);
  if (!detail) notFound();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffSubmissionDetail detail={detail} />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Detail component** `src/components/afx/staff/StaffSubmissionDetail.tsx` (client). Read `ProvenanceBadge.tsx`, `cockpitUi.tsx` (`SectionCard`), and `AfxDocumentUpload.tsx` (for the doc-row View pattern) first, then implement. It must: show identity + status; when `under_review`, render each case-study `Provenanced` field with a `ProvenanceBadge` + Verify/Revert button (calls `verifyFieldAction`/`revertFieldAction`, then `router.refresh()`); list docs with a **View** button (POST to `/api/afx/staff/documents/sign` with `{ submissionId, path }`, open the returned url); a notes textarea; and an action bar (Start review / Approve / Request changes) using an in-flight `busy` guard + a local error string. Use `router.refresh()` after each successful mutation so the server-rendered detail reflects the new state.

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SubmissionDetail } from '@/lib/afx/server/staffReview';
import type { VerifyField } from '@/lib/afx/server/staffReview';
import type { Provenance } from '@/lib/afx/types';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
import { startReviewAction, verifyFieldAction, revertFieldAction, decideAction } from '@/app/afx/staff/actions';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';

const mono = 'var(--afx-mono)';

export default function StaffSubmissionDetail({ detail }: { detail: SubmissionDetail }) {
  const router = useRouter();
  const { submission, producer, project } = detail;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const m = VETTING_STATUS_META[submission.status];
  const underReview = submission.status === 'under_review';
  const open = submission.status === 'submitted' || submission.status === 'under_review';

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    if (busy) return;
    setBusy(true); setError(null);
    try { const res = await fn(); if (res.ok) router.refresh(); else setError(res.error ?? 'Action failed'); }
    catch { setError('Action failed — please try again'); }
    finally { setBusy(false); }
  }

  async function view(path: string) {
    setError(null);
    try {
      const res = await fetch('/api/afx/staff/documents/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: submission.id, path }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  const fields: { field: VerifyField; label: string; value: string; provenance: Provenance }[] = [];
  if (project) {
    fields.push({ field: 'budgetBand', label: 'Budget band', value: project.budgetBand.value, provenance: project.budgetBand.provenance });
    const o = project.outcomes;
    if (o) {
      fields.push({ field: 'recoupment', label: 'Recoupment', value: o.recoupment.value, provenance: o.recoupment.provenance });
      fields.push({ field: 'bondUsed', label: 'Completion bond', value: o.bondUsed.value, provenance: o.bondUsed.provenance });
      o.distribution.forEach((d, i) => fields.push({ field: `distribution:${i}` as VerifyField, label: `Distribution — ${d.name || d.type}`, value: `${d.name} (${d.type})`, provenance: d.provenance }));
    }
  }
  const docs = project ? (project.docs ?? []) : (producer.entityDocs ?? []);

  const cardStyle: React.CSSProperties = { border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
  const btn = (bg: string, bd: string, fg: string): React.CSSProperties => ({ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 15px', borderRadius: 8, border: `1px solid ${bd}`, background: bg, color: fg });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{submission.kind === 'entity' ? `${producer.company} — company vetting` : (project?.title || 'Case study')}</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', marginTop: 3 }}>{producer.name} · {producer.company}{producer.entityVerifiedAt ? ' · ✓ verified company' : ''}</div>
          </div>
          <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: m.ink, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 999, padding: '3px 10px' }}>{m.label}</span>
        </div>
        {submission.reviewerNotes ? <div style={{ fontSize: 12.5, color: 'var(--afx-muted)' }}>Notes: {submission.reviewerNotes}</div> : null}
      </div>

      {project ? (
        <div style={cardStyle}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Claims</div>
          {fields.map((f) => (
            <div key={f.field} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: 'var(--afx-muted)' }}>{f.value || '—'}</div>
              </div>
              <ProvenanceBadge provenance={f.provenance} size="sm" />
              {underReview ? (
                f.provenance === 'verified'
                  ? <button disabled={busy} onClick={() => run(() => revertFieldAction(submission.id, f.field))} style={btn('#fff', 'var(--afx-border)', 'var(--afx-muted)')}>Revert</button>
                  : <button disabled={busy} onClick={() => run(() => verifyFieldAction(submission.id, f.field))} style={btn('#F2FBF4', '#CDEAD5', '#2E7D46')}>Verify</button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Proof documents</div>
        {docs.length === 0 ? <div style={{ fontSize: 12.5, color: 'var(--afx-faint)' }}>None attached.</div> : docs.map((d) => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename} <span style={{ color: 'var(--afx-faint)' }}>· {d.category}</span></div>
            <button disabled={busy} onClick={() => view(d.path)} style={btn('#fff', 'var(--afx-border)', 'var(--afx-muted)')}>View</button>
          </div>
        ))}
      </div>

      {open ? (
        <div style={cardStyle}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer notes (shown to the producer when requesting changes)"
            style={{ fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid var(--afx-border)', borderRadius: 8, padding: '9px 11px', minHeight: 70, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {submission.status === 'submitted' ? <button disabled={busy} onClick={() => run(() => startReviewAction(submission.id))} style={btn('var(--afx-ink)', 'var(--afx-ink)', '#fff')}>Start review</button> : null}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button disabled={busy} onClick={() => run(() => decideAction(submission.id, 'request_changes', notes))} style={btn('#fff', '#E3B6AE', '#7A2E2E')}>Request changes</button>
              <button disabled={busy} onClick={() => run(() => decideAction(submission.id, 'approve'))} style={btn('#1C4E80', '#1C4E80', '#fff')}>Approve</button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <div style={{ fontSize: 12, color: '#c0392b' }}>{error}</div> : null}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` (exit 0) then `npx next build` (clean; `/afx/staff/[id]` route present).

- [ ] **Step 4: Commit.**

```bash
git add src/app/afx/staff/[id]/page.tsx src/components/afx/staff/StaffSubmissionDetail.tsx
git commit -m "feat(afx): staff submission drill-down — per-field verify + decide + doc view"
```

---

### Task 7: Live verification gate (after the user applies the migration)

**Files:**
- Create (temporary, repo root): `_staff_live.mjs` (deleted after)

**Precondition:** the controller pauses and asks the user to apply `supabase/migrations/20260701_afx_staff_review.sql` via the Dashboard, and to note the `afx_staff` allowlist is empty (the live script inserts a disposable staff row itself). Proceed only after the user confirms. Probe first: `select 1 from afx_staff limit 0`, `select reviewed_by from afx_vetting_submissions limit 0`, `select entity_verified_at from afx_producers limit 0` — if any errors "does not exist", STOP and re-request.

- [ ] **Step 1: Probe the schema** via a short service-role `mjs` (in repo root so `node_modules` resolves; delete after). Confirm the table + two columns exist. If any fails, STOP.

- [ ] **Step 2: Live gate script** `_staff_live.mjs` (repo root; service-role admin + real disposable auth users for genuine RLS; clean up in `finally`). Model the setup/cleanup on the prior slice's live script (create auth users via `admin.auth.admin.createUser`, sign in with the anon key for a user-scoped client, delete users at the end). Assert:
  1. **Staff gate:** insert a disposable producer P (with a case study whose `body` has `budgetBand.provenance='self'`, `outcomes.recoupment/bondUsed.provenance='self'`, one distribution row `provenance='self'`) and a submitted case-study submission. Create a disposable auth user S, insert S into `afx_staff`. Confirm a NON-staff user-JWT cannot `select` from `afx_staff` (RLS: no client policy → empty/denied), proving the allowlist isn't client-readable.
  2. **Provenance write (simulating the staff action via service role, which is what the guarded action uses):** set submission `under_review`; flip `body.budgetBand.provenance='verified'`; re-read the project and assert `budgetBand.provenance==='verified'` while `recoupment` stays `'self'` (per-field, not whole-study).
  3. **Decide (case study):** update submission → `status='verified', decided_at, reviewed_by=S`; assert the row reflects all three.
  4. **Entity marker + DB-enforced no-forge (trigger `afx_producers_guard_verified`):** insert an entity submission for P; simulate entity approve via SERVICE ROLE = `update afx_producers set entity_verified_at=now()`; assert the column is set (service-role bypasses the trigger's role guard). Then, as producer P's OWN user-JWT, run a direct `update afx_producers set entity_verified_at=<some other ts> where id=P` — assert it THROWS (`entity_verified_at is FRA-only`) OR, if the client swallows the error, re-read as service role and assert the value is UNCHANGED from the service-role write. Finally assert a benign producer write still works: as P's user-JWT, `update afx_producers set profile=<updated blob> where id=P` succeeds AND leaves `entity_verified_at` unchanged (proves the trigger only blocks the guarded column, not normal autosave).
  5. **Provenance no-forge (trigger `afx_projects_guard_verified`):** as producer P's OWN user-JWT, attempt `update afx_projects set body=jsonb_set(body,'{budgetBand,provenance}','"verified"') where id=<P's case study>` — assert it THROWS (`verified provenance is FRA-only (budgetBand)`) or, on swallowed error, re-read as service role and assert `budgetBand.provenance` is still `'self'`. Then assert two ALLOWED producer writes: (a) a `verified→self` downgrade of a service-role-verified field succeeds (producer edits revert their own field); (b) re-saving a body that RETAINS an already-`verified` field (changing only an unrelated field) succeeds (autosave of unrelated fields is not blocked). Also assert the SERVICE ROLE can still introduce `provenance='verified'` (staff action path).
  6. **Doc sign scope (logic):** re-run the Task 4 `staffAllowed` assertions inline (already covered), and additionally confirm `getSubmissionDetail`-style joins return the producer name/title (optional if time-boxed).
  Print `LIVE_OK` only if every assertion holds; always clean up (delete submissions, projects, producers, `afx_staff` row, and the auth users).

- [ ] **Step 3: Run it.** `node _staff_live.mjs` → Expected: `LIVE_OK`, no leftover rows. Then `rm -f _staff_live.mjs`.

- [ ] **Step 4: Final typecheck + build.** `npx tsc --noEmit -p tsconfig.json` (exit 0) then `npx next build` (clean; `/afx/staff`, `/afx/staff/[id]`, `/api/afx/staff/documents/sign` all present).

- [ ] **Step 5: Commit** (empty if no tracked files changed during verification; the live script is not committed):

```bash
git commit --allow-empty -m "test(afx): live gate — staff guard, per-field verify, decide, entity marker isolation"
```

---

## Notes for the executor

- **Migration timing:** Tasks 1–6 are code-only (tsc/build/tsx). The `afx_staff` table + two columns don't exist in prod until the user applies the migration; do not block Tasks 1–6 on it. Task 7 is the only task needing the live DB and gates on user confirmation.
- **Staff provisioning:** there is no UI to add staff. The live gate inserts a disposable staff row; real staff are added by the user via Dashboard (`insert into afx_staff (user_id) values ('<auth-user-uuid>')`). Surface this to the user when the surface ships.
- **The single security boundary is `resolveStaff()`** — it stands between a normal user and every producer's confidential financials. Every staff route/action/layout calls it first; the final review must confirm no staff read/write path skips it.
- **The anti-forge invariant is DB-ENFORCED, not just app-layer.** S1 RLS lets a producer write any column/content of their own `afx_producers`/`afx_projects` rows, so app-layer isolation (stripping `entity_verified_at` from the blob, never writing `verified` in `caseStudy.ts`) is necessary but NOT sufficient — the anon key + a session JWT bypass the server actions entirely. Two `BEFORE UPDATE` triggers (Task 1 migration) are the real gate: `afx_producers_guard_verified` blocks `authenticated`/`anon` from changing `entity_verified_at`; `afx_projects_guard_verified` blocks them from INTRODUCING `provenance='verified'` into `body`. Service-role (staff actions) + migrations pass through; `verified→self` and retaining-already-verified are allowed so producer edits/autosave still work. Task 1's assertions cover the app layer; Task 7 points 4–5 cover the DB triggers with real producer user-JWTs.
