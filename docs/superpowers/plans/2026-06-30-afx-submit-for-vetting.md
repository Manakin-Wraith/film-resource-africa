# AFX Submit-for-Vetting (Producer Side) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a producer submit a vetting-ready case study, or their company/entity, for FRA review — gated server-side, locked to a stable snapshot while pending, reversible via Withdraw — recording durable submission rows the future FRA review surface will consume.

**Architecture:** A dedicated `afx_vetting_submissions` table (one row per submission, `kind` ∈ case_study/entity) plus an isolated `afx_producers.entity_docs` column reusing the private `afx-documents` bucket. Two Next server actions (`submit`/`withdraw`) re-check the readiness gate server-side; `persistProfile` enforces the edit-lock (drops writes to locked case studies, pins the vetted entity subset). The cockpit renders the full status lifecycle; this slice wires only the producer transitions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (no test runner), Supabase (Postgres + RLS + Storage + `@supabase/ssr`), Vercel.

## Global Constraints

- **No test runner.** Verification = `npx tsc --noEmit -p tsconfig.json`, `npx next build`, `npx tsx` assertion scripts (written to the scratchpad, deleted after), and a live supabase-js script (service-role admin + per-user JWT, with cleanup). Mirror the prior AFX slices exactly. Do NOT add jest/vitest.
- **MIGRATION REQUIRED, applied by the user via Dashboard** (`https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new`) — the connected MCP cannot reach the prod project. Tasks 1–7 are code-only and verify via tsc/build/tsx; the live DB gate (Task 8) runs only after the user confirms the migration is applied.
- **`entity_docs` is a confidential isolated lane:** it lives in its own `afx_producers` column, NEVER inside the profile JSONB blob, and is stripped from the funder view — exactly as `afx_projects.docs` is handled.
- **Producers may reach only `submitted` / `withdrawn`.** RLS `WITH CHECK` enforces this; a producer can never write `verified`/`under_review`/`changes_requested`. No FRA/staff capability exists in this slice.
- **Open (locked) statuses = `submitted`, `under_review`.** Unlocked = `withdrawn`, `verified`, `changes_requested`, or no row.
- **The submit gate is re-checked server-side**, never trusting the client: `isVettingReady(project.docs)` for case studies; `isEntityVettingReady({entityK2, entityDocs})` for entity.
- **Storage paths:** case study `${producerId}/${caseStudyId}/${docId}.${ext}`; entity `${producerId}/entity/${docId}.${ext}`. `isOwnedDocPath` accepts both, rejects `..`, foreign prefixes, and non-UUID `producerId`.
- **Required entity doc categories:** `company_registration`, `director_id`, `tax_registration`. Optional: `bbbee_certificate`, `good_standing`, `other`. (B-BBEE stays optional.)
- **AFX visual system:** inline styles + `var(--afx-*)` tokens; never the dark members styling. Match existing `AfxDocumentUpload` / `AccountVisibility` look.
- **Provenance is untouched** by submitting — only FRA verification (next slice) changes `self`/`confirmed`/`verified`.

---

### Task 1: Types + entity-doc helpers + vetting helpers (pure lib)

**Files:**
- Modify: `src/lib/afx/types.ts` (DocumentCategory block ~184–199; ProducerProfile ~147–161; add vetting types after AfxDocument)
- Modify: `src/lib/afx/documents.ts` (append entity helpers)
- Create: `src/lib/afx/vetting.ts`

**Interfaces:**
- Produces: `EntityDocumentCategory`; `AfxDocument.category: DocumentCategory | EntityDocumentCategory`; `ProducerProfile.entityDocs?: AfxDocument[]`; `VettingKind`, `VettingStatus`, `VettingSubmission`; `ENTITY_DOCUMENT_CATEGORIES`, `ENTITY_DOCUMENT_CATEGORY_LABELS`, `REQUIRED_ENTITY_DOCUMENT_CATEGORIES`, `missingRequiredEntityDocs(docs)`, `isEntityVettingReady({entityK2, entityDocs})`; `OPEN_VETTING_STATUSES`, `isOpenStatus(s)`, `openCaseSubmission(subs, id)`, `latestCaseSubmission(subs, id)`, `openEntitySubmission(subs)`, `latestEntitySubmission(subs)`, `lockedCaseStudyIds(subs)`, `isEntityLocked(subs)`, `VETTING_STATUS_META`.

- [ ] **Step 1: Add entity category + vetting types to `types.ts`.**

Replace the `DocumentCategory` block (currently lines ~184–199) so `AfxDocument.category` widens and the new enum is added:

```ts
export type DocumentCategory =
  | 'budget' | 'chain_of_title' | 'waterfall' | 'financing_agreement'
  | 'distribution_agreement' | 'completion_bond' | 'audit' | 'other';

/** Producer/company-level confidential document categories (entity vetting). */
export type EntityDocumentCategory =
  | 'company_registration' | 'director_id' | 'tax_registration'
  | 'bbbee_certificate' | 'good_standing' | 'other';

/** Confidential supporting document. Producer + FRA only — NEVER funder-visible.
 *  Lives in the private `afx-documents` bucket; this is just the metadata,
 *  persisted in an isolated column (`afx_projects.docs` or `afx_producers.entity_docs`). */
export interface AfxDocument {
  id: string;            // crypto.randomUUID()
  path: string;          // storage key: producerId/<caseStudyId|entity>/docId.ext
  filename: string;      // original name, for display
  category: DocumentCategory | EntityDocumentCategory;
  sizeBytes: number;
  contentType: string;
  uploadedAt: string;    // ISO timestamp
}
```

Then add, immediately after the `AfxDocument` interface:

```ts
/* ---------- Vetting submissions (S2 producer side) ---------- */

export type VettingKind = 'case_study' | 'entity';
export type VettingStatus =
  | 'submitted' | 'under_review' | 'verified' | 'changes_requested' | 'withdrawn';

/** A producer's request for FRA to vet a case study or their entity.
 *  `targetId` is the case-study project id, or null for an entity submission.
 *  `reviewerNotes`/`decidedAt` are written by the FRA slice; rendered here. */
export interface VettingSubmission {
  id: string;
  kind: VettingKind;
  targetId: string | null;
  status: VettingStatus;
  reviewerNotes?: string;
  submittedAt: string;
  decidedAt?: string;
}
```

Add `entityDocs` to `ProducerProfile` (after `consentK4`, line ~160):

```ts
  consentK4: boolean; // transparency/reporting consent gate
  /** Producer-level confidential company documents (entity vetting). Isolated:
   *  persisted in afx_producers.entity_docs, never in the profile blob, never funder-visible. */
  entityDocs?: AfxDocument[];
```

- [ ] **Step 2: Append entity-doc helpers to `documents.ts`.**

The file already imports `AfxDocument, DocumentCategory`. Add `EntityDocumentCategory` to that import, then append:

```ts
export const ENTITY_DOCUMENT_CATEGORIES: readonly EntityDocumentCategory[] = [
  'company_registration', 'director_id', 'tax_registration',
  'bbbee_certificate', 'good_standing', 'other',
] as const;

export const ENTITY_DOCUMENT_CATEGORY_LABELS: Record<EntityDocumentCategory, string> = {
  company_registration: 'Company registration / incorporation',
  director_id: 'Director ID',
  tax_registration: 'Tax / VAT registration',
  bbbee_certificate: 'B-BBEE certificate',
  good_standing: 'Letter of good standing',
  other: 'Other',
};

/** Proof an entity must carry to be vetting-ready. company_registration,
 *  director_id, tax_registration are required; bbbee_certificate + good_standing
 *  are optional supporting evidence. */
export const REQUIRED_ENTITY_DOCUMENT_CATEGORIES: readonly EntityDocumentCategory[] = [
  'company_registration', 'director_id', 'tax_registration',
] as const;

export function missingRequiredEntityDocs(docs: readonly AfxDocument[] | undefined): EntityDocumentCategory[] {
  const present = new Set((docs ?? []).map((d) => d.category));
  return REQUIRED_ENTITY_DOCUMENT_CATEGORIES.filter((c) => !present.has(c));
}

/** An entity is vetting-ready iff K2 (legal entity) is attested AND every
 *  required company document is present. */
export function isEntityVettingReady(p: { entityK2: boolean; entityDocs?: readonly AfxDocument[] }): boolean {
  return p.entityK2 === true && missingRequiredEntityDocs(p.entityDocs).length === 0;
}
```

- [ ] **Step 3: Create `src/lib/afx/vetting.ts`** (pure submission selectors + status display meta):

```ts
import type { VettingSubmission, VettingStatus } from './types';

export const OPEN_VETTING_STATUSES: readonly VettingStatus[] = ['submitted', 'under_review'] as const;
export function isOpenStatus(s: VettingStatus): boolean {
  return (OPEN_VETTING_STATUSES as readonly string[]).includes(s);
}

function latest(subs: readonly VettingSubmission[]): VettingSubmission | undefined {
  // Most recent by submittedAt (ISO strings sort lexically).
  return subs.length ? [...subs].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0] : undefined;
}

export function openCaseSubmission(subs: readonly VettingSubmission[] | undefined, caseStudyId: string): VettingSubmission | undefined {
  return (subs ?? []).find((s) => s.kind === 'case_study' && s.targetId === caseStudyId && isOpenStatus(s.status));
}
export function latestCaseSubmission(subs: readonly VettingSubmission[] | undefined, caseStudyId: string): VettingSubmission | undefined {
  return latest((subs ?? []).filter((s) => s.kind === 'case_study' && s.targetId === caseStudyId));
}
export function openEntitySubmission(subs: readonly VettingSubmission[] | undefined): VettingSubmission | undefined {
  return (subs ?? []).find((s) => s.kind === 'entity' && isOpenStatus(s.status));
}
export function latestEntitySubmission(subs: readonly VettingSubmission[] | undefined): VettingSubmission | undefined {
  return latest((subs ?? []).filter((s) => s.kind === 'entity'));
}

/** Case-study ids with an OPEN submission → read-only / undeletable. */
export function lockedCaseStudyIds(subs: readonly VettingSubmission[] | undefined): Set<string> {
  const ids = new Set<string>();
  for (const s of subs ?? []) if (s.kind === 'case_study' && s.targetId && isOpenStatus(s.status)) ids.add(s.targetId);
  return ids;
}
export function isEntityLocked(subs: readonly VettingSubmission[] | undefined): boolean {
  return !!openEntitySubmission(subs);
}

export const VETTING_STATUS_META: Record<VettingStatus, { label: string; ink: string; bg: string; border: string }> = {
  submitted:          { label: 'Submitted',        ink: '#1C4E80', bg: '#EAF1FA', border: '#C4D8EF' },
  under_review:       { label: 'Under review',      ink: '#1C4E80', bg: '#EAF1FA', border: '#C4D8EF' },
  verified:           { label: 'Verified',          ink: '#2E7D46', bg: '#F2FBF4', border: '#CDEAD5' },
  changes_requested:  { label: 'Changes requested', ink: '#9A6B1E', bg: '#FDF8EC', border: '#F0DCA8' },
  withdrawn:          { label: 'Withdrawn',          ink: '#6B6D72', bg: '#F2F0EB', border: '#E4E2DC' },
};
```

- [ ] **Step 4: Write + run the assertion script.** Create `scratchpad/t1.ts` (in the session scratchpad dir), run with `npx tsx <path>`, expect `ALL_OK`, then delete it:

```ts
import { missingRequiredEntityDocs, isEntityVettingReady } from '../src/lib/afx/documents.ts';
import { openCaseSubmission, lockedCaseStudyIds, isEntityLocked, latestEntitySubmission, isOpenStatus } from '../src/lib/afx/vetting.ts';
const doc = (category: string) => ({ id: 'x', path: 'p', filename: 'f', category, sizeBytes: 1, contentType: 'application/pdf', uploadedAt: '2026-01-01' } as any);
const sub = (kind: string, targetId: string | null, status: string, at: string) => ({ id: at, kind, targetId, status, submittedAt: at } as any);
let ok = true; const ck = (n: string, p: boolean) => { if (!p) ok = false; console.log(p ? 'PASS' : 'FAIL', n); };
ck('entity missing 3 when empty', missingRequiredEntityDocs([]).length === 3);
ck('entity not ready without K2', !isEntityVettingReady({ entityK2: false, entityDocs: ['company_registration','director_id','tax_registration'].map(doc) }));
ck('entity ready with K2 + 3 docs', isEntityVettingReady({ entityK2: true, entityDocs: ['company_registration','director_id','tax_registration','other'].map(doc) }));
ck('entity not ready missing tax', !isEntityVettingReady({ entityK2: true, entityDocs: ['company_registration','director_id'].map(doc) }));
const subs = [sub('case_study','C1','submitted','2026-01-01'), sub('case_study','C2','withdrawn','2026-01-02'), sub('entity',null,'verified','2026-01-03')];
ck('open case C1', !!openCaseSubmission(subs, 'C1'));
ck('no open case C2', !openCaseSubmission(subs, 'C2'));
ck('locked set has C1 only', lockedCaseStudyIds(subs).has('C1') && lockedCaseStudyIds(subs).size === 1);
ck('entity not locked (verified)', !isEntityLocked(subs));
ck('latest entity = verified', latestEntitySubmission(subs)?.status === 'verified');
ck('isOpenStatus', isOpenStatus('submitted') && isOpenStatus('under_review') && !isOpenStatus('verified'));
console.log(ok ? 'ALL_OK' : 'FAILED');
```

Run: `npx tsx <scratchpad>/t1.ts` → Expected: all `PASS` then `ALL_OK`.

- [ ] **Step 5: Typecheck.** Run: `npx tsc --noEmit -p tsconfig.json` → Expected: exit 0, no output.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/afx/types.ts src/lib/afx/documents.ts src/lib/afx/vetting.ts
git commit -m "feat(afx): vetting + entity-doc types and pure helpers"
```

---

### Task 2: Persistence + funder boundary for entity_docs + submission row mappers

**Files:**
- Modify: `src/lib/afx/persistence.ts`
- Modify: `src/lib/afx/funderView.ts`

**Interfaces:**
- Consumes: `ProducerProfile.entityDocs`, `AfxDocument`, `VettingSubmission`, `VettingKind`, `VettingStatus` (Task 1).
- Produces: `ProducerRow.entity_docs: AfxDocument[] | null`; `profileToRows(p)` now returns `{ profile, entityDocs: AfxDocument[] | null, projects }`; `rowsToProfile` re-stitches `entityDocs`; `VettingSubmissionRow` interface + `submissionFromRow(row): VettingSubmission`; `FunderView` excludes `entityDocs`; `toFunderView` deletes it.

- [ ] **Step 1: Update `persistence.ts`.** Replace the file's body with (changes: import vetting types; `ProducerRow` gains `entity_docs` and `profile` Omits `entityDocs`; mappers split/stitch `entityDocs`; add `VettingSubmissionRow` + `submissionFromRow`):

```ts
import type { ProducerProfile, Project, AfxDocument, VettingSubmission, VettingKind, VettingStatus } from './types';

export interface ProducerRow {
  id: string;
  user_id: string;
  /** ProducerProfile minus `id`, `slate`, and the isolated `entityDocs` lane. */
  profile: Omit<ProducerProfile, 'id' | 'slate' | 'entityDocs'>;
  entity_docs: AfxDocument[] | null;
}
export interface ProjectRow {
  id: string;
  producer_id: string;
  status: Project['status'];
  deal_ref: string | null;
  body: Omit<Project, 'exact' | 'docs'>;
  exact: Project['exact'] | null;
  docs: AfxDocument[] | null;
}
export interface VettingSubmissionRow {
  id: string;
  producer_id: string;
  kind: VettingKind;
  target_id: string | null;
  status: VettingStatus;
  reviewer_notes: string | null;
  submitted_at: string;
  decided_at: string | null;
}

function projectFromRow(row: ProjectRow): Project {
  const p: Project = { ...row.body };
  if (row.exact != null) p.exact = row.exact;
  if (row.docs != null) p.docs = row.docs;
  return p;
}

function projectToRow(producerId: string, p: Project): ProjectRow {
  const { exact, docs, ...body } = p;
  return {
    id: p.id, producer_id: producerId, status: p.status,
    deal_ref: p.dealRef ?? null, body, exact: exact ?? null, docs: docs ?? null,
  };
}

export function submissionFromRow(r: VettingSubmissionRow): VettingSubmission {
  const s: VettingSubmission = { id: r.id, kind: r.kind, targetId: r.target_id, status: r.status, submittedAt: r.submitted_at };
  if (r.reviewer_notes != null) s.reviewerNotes = r.reviewer_notes;
  if (r.decided_at != null) s.decidedAt = r.decided_at;
  return s;
}

/** Stitch a producer row + its project rows into the cockpit ProducerProfile. */
export function rowsToProfile(producer: ProducerRow, projects: ProjectRow[]): ProducerProfile {
  const profile: ProducerProfile = { ...producer.profile, id: producer.id, slate: projects.map(projectFromRow) };
  if (producer.entity_docs != null) profile.entityDocs = producer.entity_docs;
  return profile;
}

/** Split a ProducerProfile into the producer-level blob + isolated entity docs + project rows. */
export function profileToRows(p: ProducerProfile): { profile: ProducerRow['profile']; entityDocs: AfxDocument[] | null; projects: ProjectRow[] } {
  const { id: _id, slate, entityDocs, ...profile } = p;
  void _id;
  return { profile, entityDocs: entityDocs ?? null, projects: (slate ?? []).map((pr) => projectToRow(p.id, pr)) };
}
```

- [ ] **Step 2: Update `funderView.ts`** so `entityDocs` cannot reach a funder:

```ts
import type { ProducerProfile, Project } from './types';

export type FunderProject = Omit<Project, 'exact' | 'docs'>;

/** Funder view: slate exact-/docs-stripped AND the producer-level `entityDocs`
 *  lane removed at the type level. */
export type FunderView = Omit<ProducerProfile, 'slate' | 'entityDocs'> & { slate: FunderProject[] };

export function stripExact(pr: Project): FunderProject {
  const clone = { ...pr };
  delete (clone as Partial<Project>).exact;
  delete (clone as Partial<Project>).docs;
  return clone as FunderProject;
}

export function toFunderView(p: ProducerProfile): FunderView {
  const { entityDocs: _entityDocs, ...rest } = p;
  void _entityDocs;
  return { ...rest, slate: p.slate.map(stripExact) };
}
```

- [ ] **Step 3: Assertion script** `scratchpad/t2.ts` → run with tsx → expect `ALL_OK` → delete:

```ts
import { profileToRows, rowsToProfile, submissionFromRow } from '../src/lib/afx/persistence.ts';
import { toFunderView } from '../src/lib/afx/funderView.ts';
const doc = { id: 'd1', path: 'p1/entity/d1.pdf', filename: 'reg.pdf', category: 'company_registration', sizeBytes: 1, contentType: 'application/pdf', uploadedAt: '2026-01-01' } as any;
const profile = { id: 'P1', name: 'N', company: 'Co', bio: '', ratingBand: 'C', careerStage: '', relationships: [], slate: [], ndaSigned: true, entityK2: true, consentK4: false, entityDocs: [doc] } as any;
let ok = true; const ck = (n: string, p: boolean) => { if (!p) ok = false; console.log(p ? 'PASS' : 'FAIL', n); };
const rows = profileToRows(profile);
ck('entityDocs split out of blob', !('entityDocs' in rows.profile) && rows.entityDocs!.length === 1);
const back = rowsToProfile({ id: 'P1', user_id: 'U', profile: rows.profile, entity_docs: rows.entityDocs } as any, []);
ck('entityDocs restitched', back.entityDocs?.[0].id === 'd1');
const fv = toFunderView(profile) as any;
ck('funder view has no entityDocs', !('entityDocs' in fv));
const s = submissionFromRow({ id: 'S1', producer_id: 'P1', kind: 'entity', target_id: null, status: 'changes_requested', reviewer_notes: 'fix tax doc', submitted_at: '2026-01-01', decided_at: '2026-01-02' });
ck('submission maps notes', s.reviewerNotes === 'fix tax doc' && s.targetId === null && s.decidedAt === '2026-01-02');
console.log(ok ? 'ALL_OK' : 'FAILED');
```

- [ ] **Step 4: Typecheck.** Run: `npx tsc --noEmit -p tsconfig.json` → Expected: exit 0.

- [ ] **Step 5: Commit.**

```bash
git add src/lib/afx/persistence.ts src/lib/afx/funderView.ts
git commit -m "feat(afx): persist isolated entity_docs lane + vetting submission mappers"
```

---

### Task 3: Migration SQL + load wiring

**Files:**
- Create: `supabase/migrations/20260630_afx_vetting.sql`
- Modify: `src/lib/afx/server/producerStore.ts` (loadProducerState)
- Modify: `src/app/afx/producer/page.tsx` (pass submissions to the client)
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx` (accept `initialSubmissions` prop — minimal; full wiring in Tasks 6–7)

**Interfaces:**
- Consumes: `rowsToProfile`, `submissionFromRow`, `VettingSubmissionRow`, `ProducerRow`, `ProjectRow` (Task 2).
- Produces: `loadProducerState(): Promise<{ profile: ProducerProfile; submissions: VettingSubmission[] } | null>`; `ProducerProfileClient` accepts `{ initial: ProducerProfile; initialSubmissions: VettingSubmission[] }`.

- [ ] **Step 1: Write the migration** `supabase/migrations/20260630_afx_vetting.sql`:

```sql
-- AFX submit-for-vetting (producer side): submissions table + isolated entity docs column.

create table if not exists public.afx_vetting_submissions (
  id             uuid primary key default gen_random_uuid(),
  producer_id    uuid not null references public.afx_producers on delete cascade,
  kind           text not null check (kind in ('case_study','entity')),
  target_id      uuid references public.afx_projects on delete cascade,
  status         text not null default 'submitted'
                 check (status in ('submitted','under_review','verified','changes_requested','withdrawn')),
  reviewer_notes text,
  submitted_at   timestamptz not null default now(),
  decided_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists afx_vs_producer_idx on public.afx_vetting_submissions (producer_id);
create unique index if not exists afx_vs_one_open_case on public.afx_vetting_submissions (target_id)
  where kind = 'case_study' and status in ('submitted','under_review');
create unique index if not exists afx_vs_one_open_entity on public.afx_vetting_submissions (producer_id)
  where kind = 'entity' and status in ('submitted','under_review');

alter table public.afx_vetting_submissions enable row level security;

create policy afx_vs_select_own on public.afx_vetting_submissions
  for select using (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
  );
create policy afx_vs_insert_own on public.afx_vetting_submissions
  for insert with check (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
    and status = 'submitted'
  );
create policy afx_vs_update_own on public.afx_vetting_submissions
  for update using (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
  ) with check (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
    and status = 'withdrawn'
  );

alter table public.afx_producers add column if not exists entity_docs jsonb;
```

(No bucket statement — the private `afx-documents` bucket from the documents slice is reused.)

- [ ] **Step 2: Update `loadProducerState` in `producerStore.ts`.** Add `entity_docs` to the `ProducerRow` cast surface (the RPC returns the full `afx_producers` row, so `entity_docs` is present once the column exists), load submissions, and widen the return:

```ts
import 'server-only';
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server';
import type { ProducerProfile, VettingSubmission } from '@/lib/afx/types';
import { rowsToProfile, profileToRows, submissionFromRow, type ProducerRow, type ProjectRow, type VettingSubmissionRow } from '@/lib/afx/persistence';

export async function loadProducerState(): Promise<{ profile: ProducerProfile; submissions: VettingSubmission[] } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: producer, error } = await supabase.rpc('redeem_afx_invite').single<ProducerRow>();
  if (error || !producer || typeof producer.id !== 'string') return null;
  const { data: projects } = await supabase
    .from('afx_projects')
    .select('id, producer_id, status, deal_ref, body, exact, docs')
    .eq('producer_id', producer.id);
  const { data: subs } = await supabase
    .from('afx_vetting_submissions')
    .select('id, producer_id, kind, target_id, status, reviewer_notes, submitted_at, decided_at')
    .eq('producer_id', producer.id);
  return {
    profile: rowsToProfile(producer, (projects ?? []) as ProjectRow[]),
    submissions: ((subs ?? []) as VettingSubmissionRow[]).map(submissionFromRow),
  };
}
```

(The `persistProfile` function below `loadProducerState` stays exactly as-is in this task — Task 5 adds the lock enforcement and the `@/lib/afx/vetting` import. Do NOT import `vetting` helpers here; this task only adds the `submissions` load.)

- [ ] **Step 3: Pass submissions through the page.** In `src/app/afx/producer/page.tsx`, the server component calls `loadProducerState()` and renders `<ProducerProfileClient initial={state.profile} />`. Update it to also pass submissions. Read the file first; change the render to:

```tsx
<ProducerProfileClient initial={state.profile} initialSubmissions={state.submissions} />
```

(Keep the existing null/redirect handling exactly as-is.)

- [ ] **Step 4: Accept the prop in `ProducerProfileClient.tsx`.** Change the signature + add state (handlers come in Tasks 6–7):

```tsx
import type { ProducerProfile, Project, ExactFigures, ExactMoney, AfxCurrency, VettingSubmission } from '@/lib/afx/types';
// ...
export default function ProducerProfileClient({ initial, initialSubmissions }: { initial: ProducerProfile; initialSubmissions: VettingSubmission[] }) {
  const [draft, setDraft] = useState<ProducerProfile>(() => structuredClone(initial));
  const [submissions, setSubmissions] = useState<VettingSubmission[]>(() => structuredClone(initialSubmissions));
  // ...rest unchanged for this task
```

- [ ] **Step 5: Typecheck + build.** Run: `npx tsc --noEmit -p tsconfig.json` then `npx next build` → Expected: exit 0; build compiles; `/afx/producer` route present. (Runtime DB use of the new column/table is exercised in Task 8 after the migration is applied.)

- [ ] **Step 6: Commit.**

```bash
git add supabase/migrations/20260630_afx_vetting.sql src/lib/afx/server/producerStore.ts src/app/afx/producer/page.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): vetting migration + load submissions into cockpit"
```

---

### Task 4: Entity document store — scope-aware doc routes + path validation + lock checks

**Files:**
- Modify: `src/lib/afx/server/documentAccess.ts` (extend `isOwnedDocPath`; add `hasOpenSubmission`)
- Modify: `src/app/api/afx/documents/upload/route.ts` (scope handling, entity categories, lock check)
- Modify: `src/app/api/afx/documents/delete/route.ts` (lock check; infer scope from path)
- (No change to `sign/route.ts` — viewing is allowed even when locked; `isOwnedDocPath` already accepts entity paths.)

**Interfaces:**
- Consumes: `ENTITY_DOCUMENT_CATEGORIES` (Task 1), `afxAdmin`, `resolveDocAccess`, `UUID_RE`.
- Produces: `isOwnedDocPath` accepts `${producerId}/entity/${uuid}.${ext}`; `hasOpenSubmission(producerId, kind, targetId): Promise<boolean>`.

- [ ] **Step 1: Extend `isOwnedDocPath` + add `hasOpenSubmission` in `documentAccess.ts`.** Replace the `isOwnedDocPath` body and append the helper:

```ts
/** A document storage key is owned + well-formed iff it is exactly
 *  `${producerId}/<caseStudyUuid|entity>/<docUuid>.<ext>` with no traversal. */
export function isOwnedDocPath(path: string, producerId: string): boolean {
  if (path.includes('..')) return false;
  if (!UUID_RE.test(producerId)) return false;
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  const re = new RegExp(`^${producerId}/(?:entity|${uuid})/${uuid}\\.[a-z0-9]+$`, 'i');
  return re.test(path);
}

/** True iff the producer has an OPEN (submitted/under_review) submission for the
 *  given target. `targetId` is the case-study id, or null for the entity. */
export async function hasOpenSubmission(producerId: string, kind: 'case_study' | 'entity', targetId: string | null): Promise<boolean> {
  let q = afxAdmin
    .from('afx_vetting_submissions')
    .select('id')
    .eq('producer_id', producerId)
    .eq('kind', kind)
    .in('status', ['submitted', 'under_review'])
    .limit(1);
  q = targetId ? q.eq('target_id', targetId) : q.is('target_id', null);
  const { data } = await q;
  return !!(data && data.length > 0);
}
```

- [ ] **Step 2: Rewrite `upload/route.ts`** to handle both scopes:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess, UUID_RE, hasOpenSubmission } from '@/lib/afx/server/documentAccess';
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES, DOCUMENT_CATEGORIES, ENTITY_DOCUMENT_CATEGORIES } from '@/lib/afx/documents';
import type { AfxDocument, DocumentCategory, EntityDocumentCategory } from '@/lib/afx/types';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const scope = (form.get('scope') as string | null) ?? 'case_study';
  const caseStudyId = form.get('caseStudyId') as string | null;
  const category = form.get('category') as string | null;

  if (!file || !category) {
    return NextResponse.json({ error: 'Missing file or category' }, { status: 400 });
  }
  if (scope !== 'case_study' && scope !== 'entity') {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }
  const allowedCats = scope === 'entity' ? ENTITY_DOCUMENT_CATEGORIES : DOCUMENT_CATEGORIES;
  if (!(allowedCats as readonly string[]).includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!access.ndaSigned) return NextResponse.json({ error: 'NDA must be signed to upload documents' }, { status: 403 });

  // Resolve the path segment + enforce the edit-lock for this target.
  let segment: string;
  if (scope === 'entity') {
    if (await hasOpenSubmission(access.producerId, 'entity', null)) {
      return NextResponse.json({ error: 'Entity is locked for review — withdraw to edit' }, { status: 409 });
    }
    segment = 'entity';
  } else {
    if (!caseStudyId || !UUID_RE.test(caseStudyId)) {
      return NextResponse.json({ error: 'Invalid caseStudyId' }, { status: 400 });
    }
    if (await hasOpenSubmission(access.producerId, 'case_study', caseStudyId)) {
      return NextResponse.json({ error: 'Case study is locked for review — withdraw to edit' }, { status: 409 });
    }
    segment = caseStudyId;
  }

  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type (PDF, PNG, JPEG, DOCX, XLSX only)' }, { status: 400 });
  }
  if (file.size > MAX_DOC_BYTES) {
    return NextResponse.json({ error: 'File must be under 25 MB' }, { status: 400 });
  }

  const docId = crypto.randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${access.producerId}/${segment}/${docId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    console.error('[afx-docs] storage error:', error.message);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }

  const doc: AfxDocument = {
    id: docId, path, filename: file.name, category: category as DocumentCategory | EntityDocumentCategory,
    sizeBytes: file.size, contentType: file.type, uploadedAt: new Date().toISOString(),
  };
  return NextResponse.json({ doc });
}
```

- [ ] **Step 3: Add a lock check to `delete/route.ts`.** Infer scope/target from the path and reject deletes of locked targets:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess, isOwnedDocPath, hasOpenSubmission } from '@/lib/afx/server/documentAccess';

export async function POST(req: NextRequest) {
  const { path } = await req.json().catch(() => ({} as { path?: string }));
  if (typeof path !== 'string' || path === '') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!isOwnedDocPath(path, access.producerId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // path = producerId/<segment>/docId.ext — segment is 'entity' or a case-study uuid.
  const segment = path.split('/')[1];
  const locked = segment === 'entity'
    ? await hasOpenSubmission(access.producerId, 'entity', null)
    : await hasOpenSubmission(access.producerId, 'case_study', segment);
  if (locked) {
    return NextResponse.json({ error: 'Locked for review — withdraw to edit' }, { status: 409 });
  }
  const { error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).remove([path]);
  if (error) {
    console.error('[afx-docs] storage error:', error.message);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Assertion script** `scratchpad/t4.ts` for `isOwnedDocPath` (logic copy, since importing the module triggers `createClient`; mirror Task structure used in the docs slice). Validate: entity path accepted, case path accepted, traversal rejected, foreign prefix rejected, regex-meta producerId rejected:

```ts
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_RE = new RegExp(`^${UUID}$`, 'i');
function isOwnedDocPath(path: string, producerId: string): boolean {
  if (path.includes('..')) return false;
  if (!UUID_RE.test(producerId)) return false;
  return new RegExp(`^${producerId}/(?:entity|${UUID})/${UUID}\\.[a-z0-9]+$`, 'i').test(path);
}
const P = '11111111-1111-1111-1111-111111111111';
const C = '22222222-2222-2222-2222-222222222222';
const D = '33333333-3333-3333-3333-333333333333';
let ok = true; const ck = (n: string, got: boolean, exp: boolean) => { if (got !== exp) ok = false; console.log(got === exp ? 'PASS' : 'FAIL', n); };
ck('entity path', isOwnedDocPath(`${P}/entity/${D}.pdf`, P), true);
ck('case path', isOwnedDocPath(`${P}/${C}/${D}.pdf`, P), true);
ck('traversal', isOwnedDocPath(`${P}/../x/${D}.pdf`, P), false);
ck('foreign prefix', isOwnedDocPath(`${P}/entity/${D}.pdf`, '99999999-9999-9999-9999-999999999999'), false);
ck('regex-meta producerId', isOwnedDocPath(`${P}/entity/${D}.pdf`, '.*'), false);
ck('non-uuid segment', isOwnedDocPath(`${P}/notentity/${D}.pdf`, P), false);
console.log(ok ? 'ALL_OK' : 'FAILED');
```

- [ ] **Step 5: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` then `npx next build` → Expected: exit 0; the three `/api/afx/documents/*` routes present.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/afx/server/documentAccess.ts src/app/api/afx/documents/upload/route.ts src/app/api/afx/documents/delete/route.ts
git commit -m "feat(afx): entity-scope doc uploads + path validation + edit-lock on doc routes"
```

---

### Task 5: Vetting store + server actions + persistProfile lock enforcement

**Files:**
- Create: `src/lib/afx/server/vettingStore.ts`
- Modify: `src/app/afx/producer/actions.ts`
- Modify: `src/lib/afx/server/producerStore.ts` (persistProfile)

**Interfaces:**
- Consumes: `isVettingReady` (documents.ts, existing), `isEntityVettingReady` (Task 1), `submissionFromRow`/`VettingSubmissionRow` (Task 2), `lockedCaseStudyIds`/`isEntityLocked` are NOT needed here (server reads rows directly).
- Produces: `submitForVetting(input): Promise<SubmitResult>`, `withdrawVetting(input): Promise<{ ok: boolean; error?: string }>`; server actions `submitForVettingAction`, `withdrawVettingAction`. `SubmitResult = { ok: true; submission: VettingSubmission } | { ok: false; error: string }`.

- [ ] **Step 1: Create `src/lib/afx/server/vettingStore.ts`:**

```ts
import 'server-only';
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server';
import { isVettingReady, isEntityVettingReady } from '@/lib/afx/documents';
import { submissionFromRow, type VettingSubmissionRow } from '@/lib/afx/persistence';
import type { AfxDocument, VettingKind, VettingSubmission } from '@/lib/afx/types';

export type SubmitResult = { ok: true; submission: VettingSubmission } | { ok: false; error: string };

async function resolveProducerId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('afx_producers').select('id').eq('user_id', user.id).single<{ id: string }>();
  return data?.id ?? null;
}

export async function submitForVetting(input: { kind: VettingKind; targetId?: string }): Promise<SubmitResult> {
  const producerId = await resolveProducerId();
  if (!producerId) return { ok: false, error: 'Not authenticated' };
  const supabase = await createSupabaseServerClient();

  // Re-check the gate server-side.
  if (input.kind === 'case_study') {
    if (!input.targetId) return { ok: false, error: 'Missing case study' };
    const { data: proj } = await supabase
      .from('afx_projects').select('id, docs').eq('id', input.targetId).eq('producer_id', producerId)
      .single<{ id: string; docs: AfxDocument[] | null }>();
    if (!proj) return { ok: false, error: 'Case study not found' };
    if (!isVettingReady(proj.docs ?? undefined)) return { ok: false, error: 'Required proof documents are missing' };
  } else {
    const { data: prod } = await supabase
      .from('afx_producers').select('profile, entity_docs').eq('id', producerId)
      .single<{ profile: { entityK2?: boolean }; entity_docs: AfxDocument[] | null }>();
    if (!prod) return { ok: false, error: 'Producer not found' };
    if (!isEntityVettingReady({ entityK2: !!prod.profile?.entityK2, entityDocs: prod.entity_docs ?? undefined })) {
      return { ok: false, error: 'Entity is not vetting-ready (K2 + required company documents)' };
    }
  }

  const { data, error } = await supabase
    .from('afx_vetting_submissions')
    .insert({ producer_id: producerId, kind: input.kind, target_id: input.kind === 'case_study' ? input.targetId : null, status: 'submitted' })
    .select('id, producer_id, kind, target_id, status, reviewer_notes, submitted_at, decided_at')
    .single<VettingSubmissionRow>();
  if (error) {
    // 23505 = unique_violation → an open submission already exists.
    if ((error as { code?: string }).code === '23505') return { ok: false, error: 'Already submitted for vetting' };
    return { ok: false, error: 'Could not submit for vetting' };
  }
  return { ok: true, submission: submissionFromRow(data) };
}

export async function withdrawVetting(input: { submissionId: string }): Promise<{ ok: boolean; error?: string }> {
  const producerId = await resolveProducerId();
  if (!producerId) return { ok: false, error: 'Not authenticated' };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('afx_vetting_submissions')
    .update({ status: 'withdrawn', decided_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', input.submissionId).eq('producer_id', producerId).in('status', ['submitted', 'under_review'])
    .select('id');
  if (error) return { ok: false, error: 'Could not withdraw' };
  if (!data || data.length === 0) return { ok: false, error: 'No open submission to withdraw' };
  return { ok: true };
}
```

- [ ] **Step 2: Add the server actions to `actions.ts`:**

```ts
'use server';

import type { ProducerProfile, VettingKind } from '@/lib/afx/types';
import { persistProfile } from '@/lib/afx/server/producerStore';
import { submitForVetting, withdrawVetting, type SubmitResult } from '@/lib/afx/server/vettingStore';

export async function persistProfileAction(profile: ProducerProfile): Promise<void> {
  await persistProfile(profile);
}

export async function submitForVettingAction(input: { kind: VettingKind; targetId?: string }): Promise<SubmitResult> {
  return submitForVetting(input);
}

export async function withdrawVettingAction(input: { submissionId: string }): Promise<{ ok: boolean; error?: string }> {
  return withdrawVetting(input);
}
```

- [ ] **Step 3: Enforce the lock in `persistProfile`** (`producerStore.ts`). Add the `vetting`/`AfxDocument` imports and rework the write so locked case studies and the vetted entity subset cannot be mutated by autosave. Replace the `persistProfile` function with:

```ts
import type { AfxDocument } from '@/lib/afx/types';
// (top-of-file imports also need:) import { lockedCaseStudyIds, isEntityLocked } from '@/lib/afx/vetting';

const VETTED_ENTITY_FIELDS = ['name', 'company', 'bio', 'location', 'entityK2'] as const;

export async function persistProfile(profile: ProducerProfile): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error('not authenticated');
  const supabase = await createSupabaseServerClient();

  const { data: producer } = await supabase
    .from('afx_producers').select('id').eq('user_id', user.id).single<{ id: string }>();
  if (!producer) throw new Error('no producer row');

  // Open submissions decide what is locked.
  const { data: openRows } = await supabase
    .from('afx_vetting_submissions').select('kind, target_id, status')
    .eq('producer_id', producer.id).in('status', ['submitted', 'under_review']);
  const subs = (openRows ?? []).map((r) => ({ kind: r.kind, targetId: r.target_id, status: r.status, id: '', submittedAt: '' })) as VettingSubmission[];
  const lockedCases = lockedCaseStudyIds(subs);
  const entityLocked = isEntityLocked(subs);

  const { profile: profileBlob, entityDocs, projects } = profileToRows({ ...profile, id: producer.id });

  // Entity lock: pin the vetted profile subset + entity_docs to their stored values.
  let entityDocsToWrite = entityDocs;
  if (entityLocked) {
    const { data: stored } = await supabase
      .from('afx_producers').select('profile, entity_docs').eq('id', producer.id)
      .single<{ profile: Record<string, unknown>; entity_docs: AfxDocument[] | null }>();
    if (stored) {
      for (const f of VETTED_ENTITY_FIELDS) (profileBlob as Record<string, unknown>)[f] = stored.profile?.[f];
      entityDocsToWrite = stored.entity_docs;
    }
  }

  const { error: updateErr } = await supabase.from('afx_producers')
    .update({ profile: profileBlob, entity_docs: entityDocsToWrite, updated_at: new Date().toISOString() })
    .eq('id', producer.id);
  if (updateErr) throw new Error(`producer update failed: ${updateErr.message}`);

  // Case-study lock: never write (or delete) a project with an open submission.
  const writable = projects.filter((p) => !lockedCases.has(p.id));
  if (writable.length > 0) {
    const { error: upsertErr } = await supabase.from('afx_projects').upsert(
      writable.map((p) => ({ ...p, producer_id: producer.id, updated_at: new Date().toISOString() })),
      { onConflict: 'id' },
    );
    if (upsertErr) throw new Error(`projects upsert failed: ${upsertErr.message}`);
  }

  // Keep ids: everything the client still has PLUS every locked case study (don't delete a submitted one).
  const keepIds = Array.from(new Set([...projects.map((p) => p.id), ...lockedCases]));
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (keepIds.some((id) => !UUID_RE.test(id))) throw new Error('invalid project id in slate');
  let del = supabase.from('afx_projects').delete().eq('producer_id', producer.id);
  if (keepIds.length > 0) del = del.not('id', 'in', `(${keepIds.join(',')})`);
  const { error: deleteErr } = await del;
  if (deleteErr) throw new Error(`projects delete failed: ${deleteErr.message}`);
}
```

Also add `VettingSubmission` to the `types` import at the top of `producerStore.ts`.

- [ ] **Step 4: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` then `npx next build` → Expected: exit 0.

- [ ] **Step 5: Commit.**

```bash
git add src/lib/afx/server/vettingStore.ts src/app/afx/producer/actions.ts src/lib/afx/server/producerStore.ts
git commit -m "feat(afx): submit/withdraw server actions + server-side edit-lock enforcement"
```

---

### Task 6: Case-study track cockpit UX (badge + submit/withdraw + read-only lock)

**Files:**
- Modify: `src/components/afx/producer/TrackRecordZone.tsx` (status badge per card)
- Modify: `src/components/afx/producer/CaseStudyDrawer.tsx` (status banner, submit/withdraw footer, read-only when locked)
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx` (submissions state already added; add submit/withdraw handlers + pass to TrackRecordZone/drawer)

**Interfaces:**
- Consumes: `VETTING_STATUS_META`, `openCaseSubmission`, `latestCaseSubmission` (vetting.ts); `isVettingReady` (documents.ts); `submitForVettingAction`, `withdrawVettingAction`, `persistProfileAction` (actions.ts); `VettingSubmission` type.
- Produces: drawer props `submission?: VettingSubmission`, `locked: boolean`, `onSubmit?: () => void`, `onWithdraw?: () => void`; TrackRecordZone prop `submissions: VettingSubmission[]`.

- [ ] **Step 1: Status badge on the Track Record card.** In `TrackRecordZone.tsx`, thread `submissions` down to `SummaryCard` and render a status badge using `latestCaseSubmission`. Add to imports:

```tsx
import type { ProducerProfile, Project, VettingSubmission } from '@/lib/afx/types';
import { latestCaseSubmission } from '@/lib/afx/vetting';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
```

Change the zone signature to accept `submissions` and pass it to each card:

```tsx
// In the component props: add `submissions: VettingSubmission[]`
{studies.map((s) => <SummaryCard key={s.id} study={s} submission={latestCaseSubmission(submissions, s.id)} onEdit={() => onEdit(s.id)} />)}
```

In `SummaryCard({ study, submission, onEdit })`, in the chip row (next to the existing "Proof attached"/"Unproven" `StatusChip`), add:

```tsx
{submission && submission.status !== 'withdrawn'
  ? <StatusChip ink={VETTING_STATUS_META[submission.status].ink} bg={VETTING_STATUS_META[submission.status].bg} border={VETTING_STATUS_META[submission.status].border}>{VETTING_STATUS_META[submission.status].label}</StatusChip>
  : null}
```

- [ ] **Step 2: Drawer — accept lock/submission props + render read-only banner + submit/withdraw footer.** In `CaseStudyDrawer.tsx`:

Add to props:

```tsx
import type { Project, AfxCurrency, EvidenceClaim, VettingSubmission } from '@/lib/afx/types';
import { isVettingReady } from '@/lib/afx/documents';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
// ...
interface CaseStudyDrawerProps {
  initial: Project; isNew: boolean; ndaSigned: boolean; defaultCurrency: AfxCurrency;
  submission?: VettingSubmission; locked: boolean;
  onSave: (study: Project) => void; onClose: () => void; onRemove?: () => void;
  onSubmit?: () => void; onWithdraw?: () => void;
}
export default function CaseStudyDrawer({ initial, isNew, ndaSigned, defaultCurrency, submission, locked, onSave, onClose, onRemove, onSubmit, onWithdraw }: CaseStudyDrawerProps) {
```

Right after the drawer header (above the scroll container that holds the `<Field>`s), add a status banner when a submission exists:

```tsx
{submission && submission.status !== 'withdrawn' ? (
  <div style={{ margin: '0 22px 4px', padding: '10px 12px', borderRadius: 10,
    background: VETTING_STATUS_META[submission.status].bg, border: `1px solid ${VETTING_STATUS_META[submission.status].border}`,
    color: VETTING_STATUS_META[submission.status].ink, fontSize: 12.5 }}>
    <strong style={{ fontWeight: 700 }}>{VETTING_STATUS_META[submission.status].label}</strong>
    {locked ? ' — read-only while FRA reviews. Withdraw to edit.' : ''}
    {submission.status === 'changes_requested' && submission.reviewerNotes ? <div style={{ marginTop: 4 }}>{submission.reviewerNotes}</div> : null}
  </div>
) : null}
```

Wrap the scroll container so locked content is non-interactive (find the `<div>` that contains the `<Field>` list — the one closing at line ~159 — and add the style):

```tsx
<div style={{ /* existing styles */ pointerEvents: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1 }}>
```

Replace the footer's action group (lines ~168–181, the non-`confirmingRemove` branch) so a locked study shows Withdraw and a ready study shows Submit:

```tsx
<>
  {!isNew && onRemove && !locked ? (
    <button onClick={() => setConfirmingRemove(true)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E3B6AE', background: '#fff', color: '#7A2E2E' }}>Remove</button>
  ) : null}
  <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
    <button onClick={onClose} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Close</button>
    {locked ? (
      <button onClick={onWithdraw} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #9A6B1E', background: '#fff', color: '#9A6B1E' }}>Withdraw</button>
    ) : (
      <>
        <button onClick={() => onSave(study)} disabled={!savable}
          style={{ cursor: savable ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C1D21', background: savable ? '#1C1D21' : '#C9C7C1', color: '#fff', opacity: savable ? 1 : 0.8 }}>
          {isNew ? 'Add case study' : 'Save'}
        </button>
        {!isNew && onSubmit ? (
          <button onClick={onSubmit} disabled={!isVettingReady(study.docs)} title={isVettingReady(study.docs) ? '' : 'Attach all required proof documents first'}
            style={{ cursor: isVettingReady(study.docs) ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C4E80', background: isVettingReady(study.docs) ? '#1C4E80' : '#A8B6C8', color: '#fff' }}>
            Submit for vetting
          </button>
        ) : null}
      </>
    )}
  </div>
</>
```

- [ ] **Step 3: Wire handlers in `ProducerProfileClient.tsx`.** Add imports + handlers; pass props to TrackRecordZone and the drawer. The submit handler flushes a synchronous persist first (so the just-edited study exists server-side), then calls the action:

```tsx
import { submitForVettingAction, withdrawVettingAction, persistProfileAction } from './actions';
import { openCaseSubmission } from '@/lib/afx/vetting';
// ...
// Add near the other useState hooks:
const [actionError, setActionError] = useState<string | null>(null);

const onSubmitCaseStudy = async (id: string) => {
  setActionError(null);
  await persistProfileAction(draft);                 // flush latest (incl. docs) before server gate
  const res = await submitForVettingAction({ kind: 'case_study', targetId: id });
  if (res.ok) { setSubmissions((s) => [...s, res.submission]); setEditing(null); }
  else setActionError(res.error);
};
const onWithdrawSubmission = async (submissionId: string) => {
  setActionError(null);
  const res = await withdrawVettingAction({ submissionId });
  if (res.ok) setSubmissions((s) => s.map((x) => (x.id === submissionId ? { ...x, status: 'withdrawn' } : x)));
  else setActionError(res.error);
};
```

Render `actionError` as a dismissable fixed bottom-left toast, mirroring the autosave toast (lines ~176–188) but on the left and in the error palette (`#fdecea` / `#c0392b`); clear it on click. (`setActionError` is also used by the entity submit handler in Task 7.)

Pass `submissions` to `TrackRecordZone`:

```tsx
<TrackRecordZone draft={draft} submissions={submissions} onAdd={onAddCaseStudy} onEdit={onEditCaseStudy} />
```

In the drawer render block, compute the open submission + lock and pass the new props:

```tsx
{editing ? (() => {
  const open = openCaseSubmission(submissions, editing.study.id);
  return (
    <CaseStudyDrawer
      initial={editing.study}
      isNew={editing.isNew}
      ndaSigned={!!draft.ndaSigned}
      defaultCurrency={localCurrency}
      submission={open}
      locked={!!open}
      onSave={onSaveCaseStudy}
      onClose={() => setEditing(null)}
      onRemove={editing.isNew ? undefined : () => onRemoveCaseStudy(editing.study.id)}
      onSubmit={() => onSubmitCaseStudy(editing.study.id)}
      onWithdraw={open ? () => onWithdrawSubmission(open.id) : undefined}
    />
  );
})() : null}
```

(`alert()` is the existing lightweight error surface convention used nowhere else; if the codebase has no `alert`, use the existing autosave-style toast pattern instead — check `ProducerProfileClient` for a toast helper before adding `alert`. Prefer a small inline error state if one exists.)

> Implementer note: the codebase does not use `alert()` elsewhere. Instead add a transient `actionError` state (`const [actionError, setActionError] = useState<string | null>(null)`) rendered as a fixed bottom-left toast mirroring the autosave toast styling (lines 176–188), and set it instead of calling `alert`.

- [ ] **Step 4: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` then `npx next build` → Expected: exit 0; `/afx/producer` present.

- [ ] **Step 5: Commit.**

```bash
git add src/components/afx/producer/TrackRecordZone.tsx src/components/afx/producer/CaseStudyDrawer.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): case-study submit/withdraw + vetting status badges + read-only lock"
```

---

### Task 7: Entity track cockpit UX (entity doc upload + vetting panel)

**Files:**
- Create: `src/components/afx/producer/AfxEntityDocumentUpload.tsx`
- Create: `src/components/afx/producer/EntityVettingPanel.tsx`
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx` (entityDocs handlers + render panel)

**Interfaces:**
- Consumes: `ENTITY_DOCUMENT_CATEGORIES`, `ENTITY_DOCUMENT_CATEGORY_LABELS`, `REQUIRED_ENTITY_DOCUMENT_CATEGORIES`, `missingRequiredEntityDocs`, `isEntityVettingReady` (Task 1); `openEntitySubmission`, `latestEntitySubmission`, `VETTING_STATUS_META` (vetting.ts); the submit/withdraw handlers from Task 6.
- Produces: `AfxEntityDocumentUpload` (entity-scope uploader); `EntityVettingPanel`.

- [ ] **Step 1: Create `AfxEntityDocumentUpload.tsx`** — the entity-scope counterpart of `AfxDocumentUpload`. It posts `scope='entity'` (no `caseStudyId`), uses the entity category set + required-entity checklist, and disables interaction when `locked`. (Shares the visual pattern of `AfxDocumentUpload`; a shared extraction is deliberately deferred — only two callers, YAGNI.)

```tsx
'use client';

import { useRef, useState } from 'react';
import type { AfxDocument, EntityDocumentCategory } from '@/lib/afx/types';
import {
  ENTITY_DOCUMENT_CATEGORIES, ENTITY_DOCUMENT_CATEGORY_LABELS,
  REQUIRED_ENTITY_DOCUMENT_CATEGORIES, missingRequiredEntityDocs,
  ALLOWED_DOC_TYPES, MAX_DOC_BYTES,
} from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';
const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--afx-body)', fontSize: 13, color: '#1C1D21',
  border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none',
};

interface Props {
  docs: AfxDocument[];
  locked: boolean;
  onAdd: (doc: AfxDocument) => void;
  onUpdate: (id: string, patch: { category: EntityDocumentCategory }) => void;
  onRemove: (id: string) => void;
}

function prettySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AfxEntityDocumentUpload({ docs, locked, onAdd, onUpdate, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setError('');
    if (!ALLOWED_DOC_TYPES.includes(file.type)) { setError('Unsupported type (PDF, PNG, JPEG, DOCX, XLSX only)'); return; }
    if (file.size > MAX_DOC_BYTES) { setError(`File is ${prettySize(file.size)} — max is 25 MB`); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('scope', 'entity');
      fd.append('category', 'other');
      const res = await fetch('/api/afx/documents/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? `Upload failed (${res.status})`);
      else onAdd(json.doc as AfxDocument);
    } catch (e) {
      setError(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — check your connection');
    } finally { setBusy(false); }
  }

  async function view(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  async function remove(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }) });
      if (res.ok) onRemove(doc.id);
      else { const json = await res.json().catch(() => ({})); setError(json.error ?? 'Could not remove document'); }
    } catch { setError('Could not remove document'); }
  }

  const missing = missingRequiredEntityDocs(docs);
  const ready = missing.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1 }}>
      <div style={{ border: `1px solid ${ready ? '#CDEAD5' : '#F0DCA8'}`, background: ready ? '#F2FBF4' : '#FDF8EC', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.02em', color: ready ? '#2E7D46' : '#9A6B1E' }}>
          {ready ? '✓ All required company documents attached' : `${missing.length} required company document${missing.length > 1 ? 's' : ''} missing`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {REQUIRED_ENTITY_DOCUMENT_CATEGORIES.map((c) => {
            const have = !missing.includes(c);
            return (
              <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: mono, fontSize: 10, color: have ? '#2E7D46' : '#8A8C82', background: '#fff', border: `1px solid ${have ? '#CDEAD5' : '#E4E2DC'}`, borderRadius: 999, padding: '3px 9px' }}>
                <span aria-hidden>{have ? '✓' : '○'}</span>{ENTITY_DOCUMENT_CATEGORY_LABELS[c]}
              </span>
            );
          })}
        </div>
      </div>

      {docs.map((d) => (
        <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>{prettySize(d.sizeBytes)}</div>
          </div>
          <select value={d.category} onChange={(e) => onUpdate(d.id, { category: e.target.value as EntityDocumentCategory })} style={{ ...inputStyle, cursor: 'pointer', minWidth: 150 }}>
            {ENTITY_DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{ENTITY_DOCUMENT_CATEGORY_LABELS[c]}</option>)}
          </select>
          <button onClick={() => view(d)} style={linkBtn}>View</button>
          <button onClick={() => remove(d)} aria-label="Remove document" style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, width: 30, height: 30, color: '#9A9CA3', fontSize: 15, lineHeight: 1 }}>×</button>
        </div>
      ))}

      <button onClick={() => inputRef.current?.click()} disabled={busy}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8, border: '1px solid #D6D8F5', background: '#fff', color: 'var(--afx-accent)' }}>
        {busy ? 'Uploading…' : '+ Upload company document'}
      </button>
      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}

      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7,
  padding: '6px 10px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066',
};
```

- [ ] **Step 2: Create `EntityVettingPanel.tsx`** — wraps the uploader with the K2 requirement, the status badge, and Submit/Withdraw:

```tsx
'use client';

import type { AfxDocument, EntityDocumentCategory, ProducerProfile, VettingSubmission } from '@/lib/afx/types';
import { isEntityVettingReady } from '@/lib/afx/documents';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
import { SectionCard } from './cockpitUi';
import AfxEntityDocumentUpload from './AfxEntityDocumentUpload';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  submission?: VettingSubmission;   // latest entity submission (for badge)
  locked: boolean;                  // open entity submission exists
  ndaSigned: boolean;
  onAddDoc: (doc: AfxDocument) => void;
  onUpdateDoc: (id: string, patch: { category: EntityDocumentCategory }) => void;
  onRemoveDoc: (id: string) => void;
  onSubmit: () => void;
  onWithdraw: () => void;
}

export default function EntityVettingPanel({ draft, submission, locked, ndaSigned, onAddDoc, onUpdateDoc, onRemoveDoc, onSubmit, onWithdraw }: Props) {
  const docs = draft.entityDocs ?? [];
  const ready = isEntityVettingReady({ entityK2: draft.entityK2, entityDocs: docs });
  const showBadge = submission && submission.status !== 'withdrawn';

  return (
    <SectionCard title="Company / Entity Vetting" hint="producer + FRA only">
      {showBadge ? (
        <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10,
          background: VETTING_STATUS_META[submission!.status].bg, border: `1px solid ${VETTING_STATUS_META[submission!.status].border}`,
          color: VETTING_STATUS_META[submission!.status].ink, fontSize: 12.5 }}>
          <strong style={{ fontWeight: 700 }}>{VETTING_STATUS_META[submission!.status].label}</strong>
          {locked ? ' — read-only while FRA reviews. Withdraw to edit.' : ''}
          {submission!.status === 'changes_requested' && submission!.reviewerNotes ? <div style={{ marginTop: 4 }}>{submission!.reviewerNotes}</div> : null}
        </div>
      ) : null}

      {!ndaSigned ? (
        <div style={{ fontSize: 12.5, color: '#9A9CA3', border: '1px dashed #DAD7D0', borderRadius: 8, padding: '12px 14px' }}>
          Sign the FRA NDA to attach confidential company documents (registration, director ID, tax registration).
        </div>
      ) : (
        <>
          {!draft.entityK2 ? (
            <div style={{ marginBottom: 10, fontFamily: mono, fontSize: 11, color: '#9A6B1E' }}>
              Turn on the <strong>K2 — Legal entity</strong> gate (Account &amp; Visibility) to make the entity vetting-ready.
            </div>
          ) : null}
          <AfxEntityDocumentUpload docs={docs} locked={locked} onAdd={onAddDoc} onUpdate={onUpdateDoc} onRemove={onRemoveDoc} />
        </>
      )}

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
        {locked ? (
          <button onClick={onWithdraw} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 8, border: '1px solid #9A6B1E', background: '#fff', color: '#9A6B1E' }}>Withdraw entity submission</button>
        ) : (
          <button onClick={onSubmit} disabled={!ready} title={ready ? '' : 'K2 on + all required company documents'}
            style={{ cursor: ready ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 8, border: '1px solid #1C4E80', background: ready ? '#1C4E80' : '#A8B6C8', color: '#fff' }}>
            Submit entity for vetting
          </button>
        )}
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 3: Wire the entity panel into `ProducerProfileClient.tsx`.** Add entityDocs handlers + the entity submit/withdraw + render the panel after `AccountVisibility`:

```tsx
import EntityVettingPanel from '@/components/afx/producer/EntityVettingPanel';
import { openEntitySubmission, latestEntitySubmission } from '@/lib/afx/vetting';
import type { EntityDocumentCategory, AfxDocument } from '@/lib/afx/types';
// ...
const onAddEntityDoc = (doc: AfxDocument) => setDraft((d) => ({ ...d, entityDocs: [...(d.entityDocs ?? []), doc] }));
const onUpdateEntityDoc = (id: string, patch: { category: EntityDocumentCategory }) =>
  setDraft((d) => ({ ...d, entityDocs: (d.entityDocs ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
const onRemoveEntityDoc = (id: string) => setDraft((d) => ({ ...d, entityDocs: (d.entityDocs ?? []).filter((x) => x.id !== id) }));

const onSubmitEntity = async () => {
  await persistProfileAction(draft);                 // flush entityDocs + K2 before server gate
  const res = await submitForVettingAction({ kind: 'entity' });
  if (res.ok) setSubmissions((s) => [...s, res.submission]);
  else setActionError(res.error);
};
```

Render after `<AccountVisibility ... />` inside the data-mode column:

```tsx
{(() => {
  const open = openEntitySubmission(submissions);
  return (
    <EntityVettingPanel
      draft={draft}
      submission={latestEntitySubmission(submissions)}
      locked={!!open}
      ndaSigned={!!draft.ndaSigned}
      onAddDoc={onAddEntityDoc}
      onUpdateDoc={onUpdateEntityDoc}
      onRemoveDoc={onRemoveEntityDoc}
      onSubmit={onSubmitEntity}
      onWithdraw={open ? () => onWithdrawSubmission(open.id) : () => {}}
    />
  );
})()}
```

- [ ] **Step 4: Typecheck + build.** `npx tsc --noEmit -p tsconfig.json` then `npx next build` → Expected: exit 0; `/afx/producer` present.

- [ ] **Step 5: Commit.**

```bash
git add src/components/afx/producer/AfxEntityDocumentUpload.tsx src/components/afx/producer/EntityVettingPanel.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): entity vetting panel + company-document upload + submit/withdraw"
```

---

### Task 8: Live verification gate (after the user applies the migration)

**Files:**
- Create (temporary, in scratchpad): `scratchpad/vetting-live.mjs`

**Precondition:** the controller pauses and asks the user to apply `supabase/migrations/20260630_afx_vetting.sql` via the Dashboard. Proceed only after the user confirms. Verify presence first via a service-role probe (select from `afx_vetting_submissions` limit 0; select `entity_docs` from `afx_producers` limit 0) — if either errors with "does not exist", STOP and re-request.

- [ ] **Step 1: Probe the schema.** A short `mjs` script using `@supabase/supabase-js` with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (read from `.env.local`): `select id from afx_vetting_submissions limit 1` and `select entity_docs from afx_producers limit 1`. Expected: no "relation/column does not exist" error. If either fails, STOP.

- [ ] **Step 2: Live gate script** `scratchpad/vetting-live.mjs` — run with `node`. Use the service-role admin client to set up a disposable producer (insert into `afx_producers` with a random `user_id`, a profile with `entityK2:true`, and a case study project), then assert (cleaning up all created rows in a `finally`):
  1. **Gate rejects when not ready:** insert a case-study project with `docs: null`; calling the gate logic (`isVettingReady`) returns false; a direct submission insert is the only path — assert that the *action's* gate would block (replicate `isVettingReady(null) === false`). Then set `docs` to the 6 required categories and assert `isVettingReady` true.
  2. **Submit inserts a row:** insert a `submitted` row for the ready case study; assert it exists with status `submitted`.
  3. **Partial-unique blocks double-open:** insert a second `submitted` row for the same `target_id`; assert it FAILS with code `23505`.
  4. **Withdraw unlocks:** update the row to `withdrawn`; assert a new `submitted` row for the same target now succeeds (no open row remains).
  5. **entity_docs isolation:** update the producer with `entity_docs = [oneDoc]`; re-select `profile` and assert the blob has no `entityDocs` key; assert `entity_docs` column round-trips.
  6. **RLS (per-user JWT):** mint a JWT for a *different* `user_id` (or use a second disposable producer) and a user-scoped client; assert it CANNOT select the first producer's submission rows (empty result), and an attempted insert with `status:'verified'` for its own producer FAILS the `WITH CHECK`.
  7. Print `LIVE_OK` only if every assertion holds; always clean up (delete submissions, projects, producers created).

  (Model the JWT-mint + per-user-client + cleanup harness on the S1 live RLS script referenced in the project's prior slices.)

- [ ] **Step 3: Run it.** `node <scratchpad>/vetting-live.mjs` → Expected: `LIVE_OK`, and the cleanup leaves no `vetting-live`-created rows.

- [ ] **Step 4: Final typecheck + build.** `npx tsc --noEmit -p tsconfig.json` then `npx next build` → Expected: exit 0; all `/afx` + `/api/afx/documents/*` routes present.

- [ ] **Step 5: Delete the scratchpad scripts** (`t1.ts`, `t2.ts`, `t4.ts`, `vetting-live.mjs`, `probe`) — they are throwaway verification, not committed.

- [ ] **Step 6: Commit** (only if any tracked file changed during verification; the live script is not committed):

```bash
git commit --allow-empty -m "test(afx): live gate verified — submit/withdraw, lock, entity_docs isolation, RLS"
```

---

## Notes for the executor

- **Migration timing:** Tasks 1–7 are code-only (tsc/build/tsx). The runtime DB columns/table do not exist in prod until the user applies the migration; do not block Tasks 1–7 on it. Task 8 is the only task that needs the live DB and explicitly gates on user confirmation.
- **Race-free submit:** both submit handlers call `persistProfileAction(draft)` *before* `submitForVettingAction`, so the server gate reads the just-saved docs/K2 — never a stale snapshot.
- **DRY note (entity uploader):** `AfxEntityDocumentUpload` intentionally parallels `AfxDocumentUpload` rather than sharing an abstraction — two callers with divergent category sets and scopes; extraction is deferred (YAGNI). Flag for the final review to confirm this call.
