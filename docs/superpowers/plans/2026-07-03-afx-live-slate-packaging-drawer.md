# Live Slate Packaging Drawer + Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each Live Slate project a producer-facing packaging drawer (identity, stage, ask, packaging, soft-funding applications, NDA-gated documents) plus a pure internal-only de-risking score, mirroring the case-study drawer.

**Architecture:** Reuse the case-study pattern — shared `Project` type, pure logic + score modules, a new drawer component, the parametrized `AfxDocumentUpload`, and the existing `/api/afx/documents/*` routes (one-line category widen). All new confidential project data (`docs`, `exact`, `softFunding`) is isolated at the top level of `Project` and stripped at the funder boundary.

**Tech Stack:** Next.js App Router (RSC + `'use client'`), TypeScript, inline `var(--afx-*)` styling, Supabase (unchanged in this plan), `npx tsx` assertion scripts (no test runner).

## Global Constraints

- **No test runner exists.** Verify with `npx tsc --noEmit -p tsconfig.json`, `npx next build`, and `npx tsx <script>` assertion scripts written at repo root and **deleted after** the task's commit.
- **One NDA only.** Confidential document upload is gated on the existing `draft.ndaSigned` flag. No new NDA, no new gate.
- **No backend route/scope/migration** beyond one line: widening the `case_study`-scope category allow-list in `upload/route.ts`. No new storage scope, no SQL.
- **Confidential isolation is the funder boundary.** `exact`, `docs`, and `softFunding` must never appear in the funder view. They live at the **top level of `Project`** and are removed by `stripExact`.
- **Soft-funding status vocabulary is exactly** `applied | in_review | awarded | declined`.
- **Live stage options are exactly** `development | packaging | financing | pre-production | production` (lowercase, matching existing `ask.stage` seed values).
- **The de-risking score is internal-only** — never rendered in any producer-facing component in this plan.
- **Immutability:** every pure mutation returns a new `Project`; never mutate inputs.
- **Commit** after each task with the exact message shown.

---

## File Structure

- `src/lib/afx/types.ts` — add `SoftFundingStatus`, `SoftFundingApplication`, `Project.softFunding?`; widen `DocumentCategory` union (Task 1)
- `src/lib/afx/documents.ts` — `LIVE_DOCUMENT_CATEGORIES` + labels (Task 1)
- `src/lib/afx/constants.ts` — `LIVE_STAGE_OPTIONS`, `FUNDING_SECURED_BANDS`, `SOFT_FUNDING_STATUS_LABELS` (Task 1)
- `src/lib/afx/liveProject.ts` — **new**, pure: savable + soft-funding/packaging mutations (Task 2)
- `src/lib/afx/derisking.ts` — **new**, pure internal-only score (Task 3)
- `src/lib/afx/funderView.ts` — strip `softFunding` (Task 4)
- `src/app/api/afx/documents/upload/route.ts` — widen `case_study` category allow-list (Task 5)
- `src/components/afx/producer/AfxDocumentUpload.tsx` — parametrize categories + conditional readiness banner (Task 6)
- `src/components/afx/producer/LiveProjectDrawer.tsx` — **new** drawer (Task 7)
- `src/components/afx/producer/LiveSlateZone.tsx` — card → summary + open button (Task 8)
- `src/app/afx/producer/ProducerProfileClient.tsx` — drawer state wiring (Task 8)

---

### Task 1: Types, constants, and live document categories

**Files:**
- Modify: `src/lib/afx/types.ts`
- Modify: `src/lib/afx/documents.ts`
- Modify: `src/lib/afx/constants.ts`
- Test: `assert-live-constants.ts` (repo root, temporary)

**Interfaces:**
- Produces:
  - `type SoftFundingStatus = 'applied' | 'in_review' | 'awarded' | 'declined'`
  - `interface SoftFundingApplication { id: string; body: string; amount?: ExactMoney; status: SoftFundingStatus }`
  - `Project.softFunding?: SoftFundingApplication[]` (top-level)
  - `DocumentCategory` widened with `'talent_deal' | 'script' | 'deck' | 'soft_funding_letter' | 'sales_estimate'`
  - `LIVE_DOCUMENT_CATEGORIES: readonly DocumentCategory[]`, `LIVE_DOCUMENT_CATEGORY_LABELS: Record<...>`
  - `LIVE_STAGE_OPTIONS: readonly string[]`
  - `FUNDING_SECURED_BANDS: readonly string[]`
  - `SOFT_FUNDING_STATUS_LABELS: Record<SoftFundingStatus, string>`

- [ ] **Step 1: Write the failing assertion script**

Create `assert-live-constants.ts` at repo root:

```ts
import { LIVE_DOCUMENT_CATEGORIES, LIVE_DOCUMENT_CATEGORY_LABELS } from './src/lib/afx/documents';
import { LIVE_STAGE_OPTIONS, FUNDING_SECURED_BANDS, SOFT_FUNDING_STATUS_LABELS } from './src/lib/afx/constants';

const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};

// Every live category has a label
for (const c of LIVE_DOCUMENT_CATEGORIES) {
  if (!LIVE_DOCUMENT_CATEGORY_LABELS[c]) throw new Error(`missing label for live category ${c}`);
}
// Exact vocabularies
eq('LIVE_STAGE_OPTIONS', LIVE_STAGE_OPTIONS, ['development', 'packaging', 'financing', 'pre-production', 'production']);
eq('SOFT_FUNDING keys', Object.keys(SOFT_FUNDING_STATUS_LABELS).sort(), ['applied', 'awarded', 'declined', 'in_review']);
if (FUNDING_SECURED_BANDS.length !== 4) throw new Error('expected 4 funding-secured bands');
console.log('OK live constants');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx assert-live-constants.ts`
Expected: FAIL — `Cannot find module` / export not found (constants not yet defined).

- [ ] **Step 3: Widen the `DocumentCategory` union in `types.ts`**

Find the existing union (around line 214) and replace it:

```ts
export type DocumentCategory =
  | 'budget' | 'chain_of_title' | 'waterfall' | 'financing_agreement'
  | 'distribution_agreement' | 'completion_bond' | 'audit' | 'other'
  | 'talent_deal' | 'script' | 'deck' | 'soft_funding_letter' | 'sales_estimate';
```

- [ ] **Step 4: Add soft-funding types + `Project.softFunding` in `types.ts`**

Immediately after the `ExactFigures` interface (around line 308, before `export interface Project`), add:

```ts
/** Producer soft-funding / grant application, captured on a live project.
 *  Confidential (applied-for amounts) — isolated at the top level of Project,
 *  stripped at the funder boundary like `exact`/`docs`. */
export type SoftFundingStatus = 'applied' | 'in_review' | 'awarded' | 'declined';
export interface SoftFundingApplication {
  id: string;            // crypto.randomUUID()
  body: string;          // fund / grant body name, as entered
  amount?: ExactMoney;   // optional applied-for amount
  status: SoftFundingStatus;
}
```

Then, inside `export interface Project { ... }`, add the field right after the `docs?` field (around line 328):

```ts
  /** Soft-funding / grant applications (live projects). Confidential like `docs`;
   *  NEVER serialized to the funder view. */
  softFunding?: SoftFundingApplication[];
```

- [ ] **Step 5: Add live document categories in `documents.ts`**

Append to `src/lib/afx/documents.ts` (after the case-study `REQUIRED_DOCUMENT_CATEGORIES` block, before the entity block):

```ts
/** Live-project (forward-looking) document categories. A SEPARATE list from
 *  DOCUMENT_CATEGORIES so the case-study dropdown + required-docs logic are
 *  unchanged. The upload route accepts the union of both for the case_study scope. */
export const LIVE_DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  'budget', 'financing_agreement', 'talent_deal', 'script', 'deck',
  'chain_of_title', 'soft_funding_letter', 'sales_estimate', 'other',
] as const;

export const LIVE_DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  budget: 'Budget / cost report',
  chain_of_title: 'Chain of title',
  waterfall: 'Recoupment waterfall',
  financing_agreement: 'Financing agreement / LOI',
  distribution_agreement: 'Distribution / sales agreement',
  completion_bond: 'Completion bond',
  audit: 'Final audit / cost report',
  talent_deal: 'Talent / packaging deal',
  script: 'Script / treatment',
  deck: 'Deck / lookbook',
  soft_funding_letter: 'Soft-funding award letter',
  sales_estimate: 'Sales estimate',
  other: 'Other',
};
```

Note: `LIVE_DOCUMENT_CATEGORY_LABELS` is a full `Record<DocumentCategory, string>` (covers every union member) so it type-checks; the drawer only renders the `LIVE_DOCUMENT_CATEGORIES` subset. The existing `DOCUMENT_CATEGORY_LABELS` must also still cover every union member — since it is typed `Record<DocumentCategory, string>`, **add the five new keys to it too** or TypeScript will error. Add to `DOCUMENT_CATEGORY_LABELS`:

```ts
  talent_deal: 'Talent / packaging deal',
  script: 'Script / treatment',
  deck: 'Deck / lookbook',
  soft_funding_letter: 'Soft-funding award letter',
  sales_estimate: 'Sales estimate',
```

- [ ] **Step 6: Add live constants in `constants.ts`**

Append near the existing `CASE_STUDY_FORMATS` / `JURISDICTION_OPTIONS` (around line 117) in `src/lib/afx/constants.ts`. Add the import for the type at the top if not present (`SoftFundingStatus` from `./types`):

```ts
import type { SoftFundingStatus } from './types';

export const LIVE_STAGE_OPTIONS = ['development', 'packaging', 'financing', 'pre-production', 'production'] as const;

/** Controlled funding-secured bands (ordinal, low → high). Used by the live
 *  drawer dropdown AND the de-risking score's fundingSecured ordinal. */
export const FUNDING_SECURED_BANDS = ['<40% secured', '40–60% secured', '60–80% secured', '80%+ secured'] as const;

export const SOFT_FUNDING_STATUS_LABELS: Record<SoftFundingStatus, string> = {
  applied: 'Applied',
  in_review: 'In review',
  awarded: 'Awarded',
  declined: 'Declined',
};
```

If `constants.ts` already imports from `./types`, merge `SoftFundingStatus` into that existing import instead of adding a second import line.

- [ ] **Step 7: Run the assertion + typecheck**

Run: `npx tsx assert-live-constants.ts`
Expected: `OK live constants`

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 8: Delete the temp script and commit**

```bash
rm assert-live-constants.ts
git add src/lib/afx/types.ts src/lib/afx/documents.ts src/lib/afx/constants.ts
git commit -m "feat(afx): live-project types, constants, and document categories"
```

---

### Task 2: Pure logic — `liveProject.ts`

**Files:**
- Create: `src/lib/afx/liveProject.ts`
- Test: `assert-live-project.ts` (repo root, temporary)

**Interfaces:**
- Consumes: `Project`, `SoftFundingApplication` (Task 1); `addDocument`/`updateDocument`/`removeDocument` from `./caseStudy` (status-agnostic — they operate on `Project.docs`).
- Produces:
  - `isLiveProjectSavable(p: Project): boolean`
  - `addSoftFunding(p: Project): Project`
  - `updateSoftFunding(p: Project, id: string, patch: Partial<Omit<SoftFundingApplication, 'id'>>): Project`
  - `removeSoftFunding(p: Project, id: string): Project`
  - `addPackaging(p: Project): Project`
  - `updatePackaging(p: Project, index: number, patch: Partial<PackagingAttachment>): Project`
  - `removePackaging(p: Project, index: number): Project`
  - Re-exports `addDocument, updateDocument, removeDocument` from `./caseStudy`

- [ ] **Step 1: Write the failing assertion script**

Create `assert-live-project.ts` at repo root:

```ts
import type { Project } from './src/lib/afx/types';
import {
  isLiveProjectSavable, addSoftFunding, updateSoftFunding, removeSoftFunding,
  addPackaging, updatePackaging, removePackaging,
} from './src/lib/afx/liveProject';

const base = (): Project => ({
  id: 'p1', status: 'live', title: '', format: 'Feature', role: 'Producer', jurisdiction: [],
  budgetBand: { value: '', provenance: 'self' },
  ask: { logline: '', stage: '', commercialPath: '', fundingSecuredBand: '', capitalStack: { equityPct: 0, softPct: 0, debtPct: 0, gapPct: 100 }, packaging: [] },
});
const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };

// savable: title + stage required
assert(!isLiveProjectSavable(base()), 'empty not savable');
assert(!isLiveProjectSavable({ ...base(), title: 'X' }), 'title only not savable (no stage)');
assert(isLiveProjectSavable({ ...base(), title: 'X', ask: { ...base().ask!, stage: 'development' } }), 'title+stage savable');

// soft-funding immutability
const p0 = base();
const p1 = addSoftFunding(p0);
assert(p0.softFunding === undefined, 'original untouched');
assert(p1.softFunding!.length === 1, 'one application added');
const id = p1.softFunding![0].id;
const p2 = updateSoftFunding(p1, id, { body: 'NFVF', status: 'awarded' });
assert(p1.softFunding![0].body === '', 'p1 untouched by update');
assert(p2.softFunding![0].body === 'NFVF' && p2.softFunding![0].status === 'awarded', 'update applied');
const p3 = removeSoftFunding(p2, id);
assert(p3.softFunding!.length === 0, 'removed');

// packaging immutability
const q1 = addPackaging(base());
assert(q1.ask!.packaging.length === 1, 'packaging added');
const q2 = updatePackaging(q1, 0, { name: 'Jane', status: 'signed' });
assert(q1.ask!.packaging[0].name !== 'Jane', 'q1 untouched');
assert(q2.ask!.packaging[0].name === 'Jane' && q2.ask!.packaging[0].status === 'signed', 'packaging updated');
const q3 = removePackaging(q2, 0);
assert(q3.ask!.packaging.length === 0, 'packaging removed');

console.log('OK liveProject');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx assert-live-project.ts`
Expected: FAIL — `Cannot find module './src/lib/afx/liveProject'`.

- [ ] **Step 3: Implement `liveProject.ts`**

Create `src/lib/afx/liveProject.ts`:

```ts
import type { Project, SoftFundingApplication, PackagingAttachment } from './types';

// Document mutations are status-agnostic (operate on Project.docs) — reuse, do not duplicate.
export { addDocument, updateDocument, removeDocument } from './caseStudy';

/** Minimum to persist a live project: a non-empty title AND a stage set. */
export function isLiveProjectSavable(p: Project): boolean {
  return p.title.trim().length > 0 && !!p.ask && p.ask.stage.trim().length > 0;
}

export function addSoftFunding(p: Project): Project {
  const app: SoftFundingApplication = { id: crypto.randomUUID(), body: '', status: 'applied' };
  return { ...p, softFunding: [...(p.softFunding ?? []), app] };
}
export function updateSoftFunding(p: Project, id: string, patch: Partial<Omit<SoftFundingApplication, 'id'>>): Project {
  return { ...p, softFunding: (p.softFunding ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a)) };
}
export function removeSoftFunding(p: Project, id: string): Project {
  return { ...p, softFunding: (p.softFunding ?? []).filter((a) => a.id !== id) };
}

/** Packaging lives on the live `ask`. No-op if there is no ask. */
export function addPackaging(p: Project): Project {
  if (!p.ask) return p;
  const row: PackagingAttachment = { role: '', name: '', status: 'wishlist' };
  return { ...p, ask: { ...p.ask, packaging: [...p.ask.packaging, row] } };
}
export function updatePackaging(p: Project, index: number, patch: Partial<PackagingAttachment>): Project {
  if (!p.ask) return p;
  return { ...p, ask: { ...p.ask, packaging: p.ask.packaging.map((a, i) => (i === index ? { ...a, ...patch } : a)) } };
}
export function removePackaging(p: Project, index: number): Project {
  if (!p.ask) return p;
  return { ...p, ask: { ...p.ask, packaging: p.ask.packaging.filter((_, i) => i !== index) } };
}
```

- [ ] **Step 4: Run the assertion + typecheck**

Run: `npx tsx assert-live-project.ts`
Expected: `OK liveProject`

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5: Delete temp script and commit**

```bash
rm assert-live-project.ts
git add src/lib/afx/liveProject.ts
git commit -m "feat(afx): pure live-project logic (savable + soft-funding/packaging mutations)"
```

---

### Task 3: Pure internal-only de-risking score — `derisking.ts`

**Files:**
- Create: `src/lib/afx/derisking.ts`
- Test: `assert-derisking.ts` (repo root, temporary)

**Interfaces:**
- Consumes: `Project` (Task 1); `FUNDING_SECURED_BANDS` (Task 1).
- Produces:
  - `interface DeriskingBreakdown { completeness: number; packaging: number; fundingSecured: number; documents: number; softFunding: number }`
  - `interface DeriskingScore { total: number; breakdown: DeriskingBreakdown }`
  - `derisking(p: Project): DeriskingScore`

**Scoring rubric (fixed, documented in-module):**
- `completeness` — 1 point each for: `ask.stage` non-empty, `ask.logline` non-empty, `genre` non-empty, `ask.commercialPath` non-empty, `ask.capitalStack.gapPct < 100` (a real funding plan). Max 5.
- `packaging` — sum over `ask.packaging`: `signed` = 2, `soft-hold` = 1, `wishlist` = 0.
- `fundingSecured` — `FUNDING_SECURED_BANDS.indexOf(ask.fundingSecuredBand)`, clamped to `>= 0` (unknown/empty → 0). Range 0–3.
- `documents` — count of **distinct** `docs[].category`.
- `softFunding` — sum over `softFunding`: `awarded` = 2, `in_review` = 1, `applied` = 0.5, `declined` = 0.
- `total` = sum of all five. Totality: every field defaults to 0 on missing optional data; never throws.

- [ ] **Step 1: Write the failing assertion script**

Create `assert-derisking.ts` at repo root:

```ts
import type { Project } from './src/lib/afx/types';
import { derisking } from './src/lib/afx/derisking';

const base = (): Project => ({
  id: 'p1', status: 'live', title: 'T', format: 'Feature', role: 'Producer', jurisdiction: [],
  budgetBand: { value: '', provenance: 'self' },
  ask: { logline: '', stage: '', commercialPath: '', fundingSecuredBand: '', capitalStack: { equityPct: 0, softPct: 0, debtPct: 0, gapPct: 100 }, packaging: [] },
});
const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };

// empty project scores 0
const z = derisking(base());
assert(z.total === 0, `empty total 0, got ${z.total}`);

// breakdown sums to total
const sum = (b: typeof z.breakdown) => b.completeness + b.packaging + b.fundingSecured + b.documents + b.softFunding;
assert(sum(z.breakdown) === z.total, 'breakdown sums to total (empty)');

// completeness: filling stage raises total by exactly 1
const withStage = derisking({ ...base(), ask: { ...base().ask!, stage: 'development' } });
assert(withStage.total === 1 && withStage.breakdown.completeness === 1, 'stage +1');

// packaging monotonic: signed(2) > soft-hold(1) > wishlist(0)
const signed = derisking({ ...base(), ask: { ...base().ask!, packaging: [{ role: 'Director', name: 'X', status: 'signed' }] } });
assert(signed.breakdown.packaging === 2, 'signed packaging = 2');

// fundingSecured ordinal
const fs = derisking({ ...base(), ask: { ...base().ask!, fundingSecuredBand: '80%+ secured' } });
assert(fs.breakdown.fundingSecured === 3, `top band = 3, got ${fs.breakdown.fundingSecured}`);
const fsUnknown = derisking({ ...base(), ask: { ...base().ask!, fundingSecuredBand: 'gibberish' } });
assert(fsUnknown.breakdown.fundingSecured === 0, 'unknown band = 0');

// documents: DISTINCT categories
const docs = derisking({ ...base(), docs: [
  { id: 'a', path: 'x', filename: 'f', category: 'budget', sizeBytes: 1, contentType: 'application/pdf', uploadedAt: '' },
  { id: 'b', path: 'y', filename: 'g', category: 'budget', sizeBytes: 1, contentType: 'application/pdf', uploadedAt: '' },
  { id: 'c', path: 'z', filename: 'h', category: 'script', sizeBytes: 1, contentType: 'application/pdf', uploadedAt: '' },
] });
assert(docs.breakdown.documents === 2, `2 distinct categories, got ${docs.breakdown.documents}`);

// softFunding: awarded(2) + applied(0.5)
const sfp = derisking({ ...base(), softFunding: [
  { id: '1', body: 'NFVF', status: 'awarded' },
  { id: '2', body: 'DTI', status: 'applied' },
] });
assert(sfp.breakdown.softFunding === 2.5, `awarded+applied = 2.5, got ${sfp.breakdown.softFunding}`);

// totality: a project with no ask does not throw and scores 0 on ask-derived fields
const noAsk = derisking({ ...base(), ask: undefined });
assert(noAsk.breakdown.completeness === 0 && noAsk.breakdown.packaging === 0 && noAsk.breakdown.fundingSecured === 0, 'no ask → 0s');

console.log('OK derisking');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx assert-derisking.ts`
Expected: FAIL — `Cannot find module './src/lib/afx/derisking'`.

- [ ] **Step 3: Implement `derisking.ts`**

Create `src/lib/afx/derisking.ts`:

```ts
import type { Project } from './types';
import { FUNDING_SECURED_BANDS } from './constants';

/** Internal-only. NEVER rendered producer-side. Pure, total (never throws). */
export interface DeriskingBreakdown {
  completeness: number;   // fields filled: stage, logline, genre, commercialPath, real capital plan
  packaging: number;      // signed 2 / soft-hold 1 / wishlist 0, summed
  fundingSecured: number; // FUNDING_SECURED_BANDS ordinal (0–3)
  documents: number;      // count of DISTINCT document categories
  softFunding: number;    // awarded 2 / in_review 1 / applied 0.5 / declined 0, summed
}
export interface DeriskingScore { total: number; breakdown: DeriskingBreakdown; }

const nonEmpty = (s: string | undefined): boolean => !!s && s.trim().length > 0;

export function derisking(p: Project): DeriskingScore {
  const ask = p.ask;

  let completeness = 0;
  if (ask) {
    if (nonEmpty(ask.stage)) completeness += 1;
    if (nonEmpty(ask.logline)) completeness += 1;
    if (nonEmpty(ask.commercialPath)) completeness += 1;
    if (ask.capitalStack.gapPct < 100) completeness += 1;
  }
  if (nonEmpty(p.genre)) completeness += 1;

  let packaging = 0;
  for (const a of ask?.packaging ?? []) {
    packaging += a.status === 'signed' ? 2 : a.status === 'soft-hold' ? 1 : 0;
  }

  const fundingSecured = ask ? Math.max(0, FUNDING_SECURED_BANDS.indexOf(ask.fundingSecuredBand as typeof FUNDING_SECURED_BANDS[number])) : 0;

  const documents = new Set((p.docs ?? []).map((d) => d.category)).size;

  let softFunding = 0;
  for (const s of p.softFunding ?? []) {
    softFunding += s.status === 'awarded' ? 2 : s.status === 'in_review' ? 1 : s.status === 'applied' ? 0.5 : 0;
  }

  const breakdown: DeriskingBreakdown = { completeness, packaging, fundingSecured, documents, softFunding };
  const total = completeness + packaging + fundingSecured + documents + softFunding;
  return { total, breakdown };
}
```

- [ ] **Step 4: Run the assertion + typecheck**

Run: `npx tsx assert-derisking.ts`
Expected: `OK derisking`

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5: Delete temp script and commit**

```bash
rm assert-derisking.ts
git add src/lib/afx/derisking.ts
git commit -m "feat(afx): pure internal-only de-risking score for live projects"
```

---

### Task 4: Funder-view isolation — strip `softFunding`

**Files:**
- Modify: `src/lib/afx/funderView.ts`
- Test: `assert-funder-strip.ts` (repo root, temporary)

**Interfaces:**
- Consumes: `Project.softFunding` (Task 1).
- Produces: `FunderProject = Omit<Project, 'exact' | 'docs' | 'softFunding'>`; `stripExact` also deletes `softFunding`.

- [ ] **Step 1: Write the failing assertion script**

Create `assert-funder-strip.ts` at repo root:

```ts
import type { ProducerProfile } from './src/lib/afx/types';
import { toFunderView } from './src/lib/afx/funderView';

const p = {
  name: 'Test', slate: [{
    id: 'p1', status: 'live', title: 'T', format: 'Feature', role: 'Producer', jurisdiction: [],
    budgetBand: { value: '', provenance: 'self' },
    exact: { budget: { amount: 100, currency: 'USD' } },
    docs: [{ id: 'd', path: 'x', filename: 'f', category: 'budget', sizeBytes: 1, contentType: 'application/pdf', uploadedAt: '' }],
    softFunding: [{ id: 's', body: 'NFVF', status: 'awarded' }],
  }],
} as unknown as ProducerProfile;

const fv = toFunderView(p);
const proj = fv.slate[0] as Record<string, unknown>;
if ('exact' in proj) throw new Error('exact leaked');
if ('docs' in proj) throw new Error('docs leaked');
if ('softFunding' in proj) throw new Error('softFunding leaked');
console.log('OK funder strip');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx assert-funder-strip.ts`
Expected: FAIL — `softFunding leaked` (current `stripExact` deletes only `exact`/`docs`).

- [ ] **Step 3: Update `funderView.ts`**

Replace the type alias and `stripExact` body:

```ts
export type FunderProject = Omit<Project, 'exact' | 'docs' | 'softFunding'>;
```

```ts
/** Remove NDA-gated exact figures, confidential docs, AND soft-funding from a single project (runtime + type). Shallow by design. */
export function stripExact(pr: Project): FunderProject {
  const clone = { ...pr };
  delete (clone as Partial<Project>).exact;
  delete (clone as Partial<Project>).docs;
  delete (clone as Partial<Project>).softFunding;
  return clone as FunderProject;
}
```

Also update the doc comment on `toFunderView` to mention `softFunding` alongside exact/docs (one word — keep the existing sentence structure).

- [ ] **Step 4: Run the assertion + typecheck**

Run: `npx tsx assert-funder-strip.ts`
Expected: `OK funder strip`

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5: Delete temp script and commit**

```bash
rm assert-funder-strip.ts
git add src/lib/afx/funderView.ts
git commit -m "feat(afx): strip soft-funding from the funder view (confidential isolation)"
```

---

### Task 5: Backend — widen `case_study` category allow-list

**Files:**
- Modify: `src/app/api/afx/documents/upload/route.ts:19-21`

**Interfaces:**
- Consumes: `LIVE_DOCUMENT_CATEGORIES` (Task 1).
- Produces: no exported symbol; the `case_study` scope now accepts live categories.

- [ ] **Step 1: Add the import**

At the top of `route.ts`, the existing import from `@/lib/afx/documents` pulls `ALLOWED_DOC_TYPES, MAX_DOC_BYTES, DOCUMENT_CATEGORIES, ENTITY_DOCUMENT_CATEGORIES, INDIVIDUAL_DOCUMENT_CATEGORIES`. Add `LIVE_DOCUMENT_CATEGORIES` to that same import list.

- [ ] **Step 2: Widen the `case_study` branch of `allowedCats`**

Replace lines 19–21:

```ts
  const allowedCats = scope === 'entity' ? ENTITY_DOCUMENT_CATEGORIES
    : scope === 'individual' ? INDIVIDUAL_DOCUMENT_CATEGORIES
    : [...DOCUMENT_CATEGORIES, ...LIVE_DOCUMENT_CATEGORIES];
```

The `entity` and `individual` scopes are unchanged — they keep validating against their own category sets.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx next build`
Expected: build succeeds (route compiles).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/afx/documents/upload/route.ts
git commit -m "feat(afx): accept live-project document categories on the case_study upload scope"
```

---

### Task 6: Parametrize `AfxDocumentUpload`

**Files:**
- Modify: `src/components/afx/producer/AfxDocumentUpload.tsx`

**Interfaces:**
- Produces (new props, backward-compatible):
  - `categories?: readonly DocumentCategory[]` (default `DOCUMENT_CATEGORIES`)
  - `requiredCategories?: readonly DocumentCategory[]` — when omitted, the readiness banner is **not** rendered.
- Consumes: existing `missingRequiredDocs`, `REQUIRED_DOCUMENT_CATEGORIES`, `DOCUMENT_CATEGORY_LABELS`.

The case-study call site must keep its current behaviour (categories = `DOCUMENT_CATEGORIES`, readiness banner shown against `REQUIRED_DOCUMENT_CATEGORIES`).

- [ ] **Step 1: Extend the `Props` interface**

In `AfxDocumentUpload.tsx`, update `Props`:

```ts
interface Props {
  caseStudyId: string;
  docs: AfxDocument[];
  onAdd: (doc: AfxDocument) => void;
  onUpdate: (id: string, patch: { category: DocumentCategory }) => void;
  onRemove: (id: string) => void;
  /** Categories offered in the per-doc dropdown. Defaults to the case-study set. */
  categories?: readonly DocumentCategory[];
  /** When provided, render the required-docs readiness banner against this set.
   *  Omit (live projects) to hide the banner entirely. */
  requiredCategories?: readonly DocumentCategory[];
}
```

- [ ] **Step 2: Use the props in the component body**

Change the function signature to destructure the new props with defaults, and gate the readiness banner. Replace the `export default function AfxDocumentUpload({ caseStudyId, docs, onAdd, onUpdate, onRemove }: Props) {` line and the `missing`/`ready` derivation:

```ts
export default function AfxDocumentUpload({
  caseStudyId, docs, onAdd, onUpdate, onRemove,
  categories = DOCUMENT_CATEGORIES,
  requiredCategories,
}: Props) {
```

Replace the current:

```ts
  const missing = missingRequiredDocs(docs);
  const ready = missing.length === 0;
```

with a version scoped to the passed required set (falls back to none):

```ts
  const missing = requiredCategories ? requiredCategories.filter((c) => !new Set(docs.map((d) => d.category)).has(c)) : [];
  const ready = missing.length === 0;
  const showReadiness = !!requiredCategories;
```

- [ ] **Step 3: Make the readiness banner conditional and the dropdown use `categories`**

Wrap the readiness `<div>` block (the one starting `{/* Required-proof readiness ... */}` through its closing `</div>`) in `{showReadiness ? ( ... ) : null}`. Inside it, replace `REQUIRED_DOCUMENT_CATEGORIES.map(...)` with `requiredCategories!.map(...)`.

In the per-document row, replace `DOCUMENT_CATEGORIES.map((c) => ...)` in the `<select>` with `categories.map((c) => ...)`.

`missingRequiredDocs` and `REQUIRED_DOCUMENT_CATEGORIES` imports may now be unused — remove them from the import from `@/lib/afx/documents` if `tsc`/lint flags them; keep `DOCUMENT_CATEGORIES`, `DOCUMENT_CATEGORY_LABELS`, `ALLOWED_DOC_TYPES`, `MAX_DOC_BYTES`.

- [ ] **Step 4: Update the case-study call site to preserve behaviour**

In `src/components/afx/producer/CaseStudyDrawer.tsx`, the `<AfxDocumentUpload ... />` call must now pass the required set explicitly so its banner still shows. Add the prop:

```tsx
<AfxDocumentUpload
  caseStudyId={study.id}
  docs={study.docs ?? []}
  requiredCategories={REQUIRED_DOCUMENT_CATEGORIES}
  onAdd={(doc) => setStudy((s) => addDocument(s, doc))}
  onUpdate={(id, patch) => setStudy((s) => updateDocument(s, id, patch))}
  onRemove={(id) => setStudy((s) => removeDocument(s, id))}
/>
```

Add `REQUIRED_DOCUMENT_CATEGORIES` to the existing `@/lib/afx/documents` import in `CaseStudyDrawer.tsx` (it currently imports `isVettingReady`). `categories` is omitted (defaults to `DOCUMENT_CATEGORIES`), preserving the current dropdown.

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/afx/producer/AfxDocumentUpload.tsx src/components/afx/producer/CaseStudyDrawer.tsx
git commit -m "refactor(afx): parametrize AfxDocumentUpload (categories + conditional readiness)"
```

---

### Task 7: `LiveProjectDrawer` component

**Files:**
- Create: `src/components/afx/producer/LiveProjectDrawer.tsx`

**Interfaces:**
- Consumes: `liveProject.ts` mutations + `isLiveProjectSavable` + doc mutations (Task 2); `AfxDocumentUpload` (Task 6); `LIVE_DOCUMENT_CATEGORIES` (Task 1); `LIVE_STAGE_OPTIONS`, `FUNDING_SECURED_BANDS`, `SOFT_FUNDING_STATUS_LABELS`, `CASE_STUDY_FORMATS`, `JURISDICTION_OPTIONS` (constants); `ExactFigureInput`, `ProvenanceBadge`, `GhostButton`, `InlineEdit` (existing primitives/cockpitUi).
- Produces:
  - `interface LiveProjectDrawerProps { initial: Project; ndaSigned: boolean; defaultCurrency: AfxCurrency; onSave: (project: Project) => void; onClose: () => void; onRemove?: () => void }`
  - `export default function LiveProjectDrawer(props): JSX.Element`

**Design:** Structural sibling of `CaseStudyDrawer` (overlay + right `aside`, Escape closes, scroll body, footer). **No** vetting/submission/lock props (live projects have no submission flow in this plan). **No** score display. Exact figures NDA-gated via `ExactFigureInput`'s own `gated` prop.

- [ ] **Step 1: Create the component**

Create `src/components/afx/producer/LiveProjectDrawer.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { Project, AfxCurrency, SoftFundingStatus, ExactMoney } from '@/lib/afx/types';
import {
  isLiveProjectSavable,
  addSoftFunding, updateSoftFunding, removeSoftFunding,
  addPackaging, updatePackaging, removePackaging,
  addDocument, updateDocument, removeDocument,
} from '@/lib/afx/liveProject';
import { LIVE_DOCUMENT_CATEGORIES } from '@/lib/afx/documents';
import { LIVE_STAGE_OPTIONS, FUNDING_SECURED_BANDS, SOFT_FUNDING_STATUS_LABELS, CASE_STUDY_FORMATS, JURISDICTION_OPTIONS } from '@/lib/afx/constants';
import AfxDocumentUpload from './AfxDocumentUpload';
import { InlineEdit, GhostButton } from './cockpitUi';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import ExactFigureInput from '@/components/afx/primitives/ExactFigureInput';

const mono = 'var(--afx-mono)';

interface LiveProjectDrawerProps {
  initial: Project;
  ndaSigned: boolean;
  defaultCurrency: AfxCurrency;
  onSave: (project: Project) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export default function LiveProjectDrawer({ initial, ndaSigned, defaultCurrency, onSave, onClose, onRemove }: LiveProjectDrawerProps) {
  const [proj, setProj] = useState<Project>(() => structuredClone(initial));
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ask = proj.ask;
  const savable = isLiveProjectSavable(proj);
  const setAsk = (patch: Partial<NonNullable<Project['ask']>>) =>
    setProj((p) => (p.ask ? { ...p, ask: { ...p.ask, ...patch } } : p));
  const setLeg = (leg: 'equityPct' | 'softPct' | 'debtPct' | 'gapPct', v: number) =>
    setProj((p) => (p.ask ? { ...p, ask: { ...p.ask, capitalStack: { ...p.ask.capitalStack, [leg]: v } } } : p));
  const setExactBudget = (v: ExactMoney | undefined) =>
    setProj((p) => {
      const exact = { ...p.exact };
      if (v === undefined) delete exact.budget; else exact.budget = v;
      let budgetBand = p.budgetBand;
      if (v !== undefined && p.budgetBand.provenance === 'self') budgetBand = { ...p.budgetBand, provenance: 'confirmed' };
      if (v === undefined && p.budgetBand.provenance === 'confirmed') budgetBand = { ...p.budgetBand, provenance: 'self' };
      const hasExact = exact.budget || exact.fundingSecured || exact.capitalStack;
      return { ...p, budgetBand, exact: hasExact ? exact : undefined };
    });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(28,29,33,0.42)' }} />
      <aside role="dialog" aria-modal="true" aria-label="Package live project"
        style={{ position: 'fixed', zIndex: 89, top: 0, right: 0, height: '100vh', width: 'min(560px,94vw)', background: '#FAF9F7', borderLeft: '1px solid #EAE8E3', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>

        <header style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #EAE8E3', background: 'linear-gradient(180deg,#FCFBF9,#fff)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Package project</h2>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', fontSize: 20, lineHeight: 1, color: '#9A9CA3' }}>×</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Identity */}
          <InlineEdit label="Title" value={proj.title} placeholder="Project title" onChange={(v) => setProj((p) => ({ ...p, title: v }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Format">
              <Select value={proj.format} options={CASE_STUDY_FORMATS} onChange={(v) => setProj((p) => ({ ...p, format: v }))} />
            </Field>
            <InlineEdit label="Genre" value={proj.genre ?? ''} placeholder="e.g. Drama" onChange={(v) => setProj((p) => ({ ...p, genre: v.trim() === '' ? undefined : v }))} />
          </div>
          <Field label="Jurisdiction">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {JURISDICTION_OPTIONS.map((code) => {
                const on = proj.jurisdiction.includes(code);
                return (
                  <button key={code} onClick={() => setProj((p) => ({ ...p, jurisdiction: on ? p.jurisdiction.filter((j) => j !== code) : [...p.jurisdiction, code] }))}
                    style={{ cursor: 'pointer', fontFamily: mono, fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 999, border: `1px solid ${on ? '#1C1D21' : '#E4E2DC'}`, background: on ? '#1C1D21' : '#fff', color: on ? '#fff' : '#9A9CA3' }}>
                    {code}
                  </button>
                );
              })}
            </div>
          </Field>

          {ask ? (
            <>
              {/* Stage */}
              <Field label="Current stage">
                <Select value={ask.stage} options={LIVE_STAGE_OPTIONS} placeholder="—" onChange={(v) => setAsk({ stage: v })} />
              </Field>

              {/* The ask */}
              <Field label="Logline">
                <textarea value={ask.logline} placeholder="One-line pitch" onChange={(e) => setAsk({ logline: e.target.value })}
                  style={{ ...inputStyle, width: '100%', minHeight: 60, resize: 'vertical' }} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InlineEdit label="Commercial path" value={ask.commercialPath} placeholder="e.g. Streamer-first" onChange={(v) => setAsk({ commercialPath: v })} />
                <Field label="Funding secured">
                  <Select value={ask.fundingSecuredBand} options={FUNDING_SECURED_BANDS} placeholder="—" onChange={(v) => setAsk({ fundingSecuredBand: v })} />
                </Field>
              </div>

              {/* Budget band + NDA exact */}
              <Field label="Budget band">
                <input value={proj.budgetBand.value} placeholder="e.g. $1–2M" onChange={(e) => setProj((p) => ({ ...p, budgetBand: { value: e.target.value, provenance: 'self' } }))} style={inputStyle} />
                <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={proj.budgetBand.provenance} size="sm" /></div>
                <ExactFigureInput value={proj.exact?.budget} onCommit={setExactBudget} gated={ndaSigned} label="budget" defaultCurrency={defaultCurrency}
                  confirmHint={proj.budgetBand.provenance === 'confirmed' ? '→ confirmed' : undefined} />
              </Field>

              {/* Capital stack % */}
              <Field label="Capital stack %">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                  {(['equityPct', 'softPct', 'debtPct', 'gapPct'] as const).map((leg) => (
                    <div key={leg}>
                      <span style={{ fontSize: 11, color: '#9A9CA3' }}>{leg.replace('Pct', '')}</span>
                      <input type="number" min={0} max={100} value={ask.capitalStack[leg]} onChange={(e) => setLeg(leg, Number(e.target.value) || 0)} style={{ ...inputStyle, width: '100%' }} />
                    </div>
                  ))}
                </div>
              </Field>

              {/* Packaging */}
              <Field label="Packaging">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ask.packaging.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input value={a.role} placeholder="Role" onChange={(e) => setProj((p) => updatePackaging(p, i, { role: e.target.value }))} style={{ ...inputStyle, width: 90 }} />
                      <input value={a.name} placeholder="Name" onChange={(e) => setProj((p) => updatePackaging(p, i, { name: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                      <Select value={a.status} options={['signed', 'soft-hold', 'wishlist'] as const} onChange={(v) => setProj((p) => updatePackaging(p, i, { status: v as 'signed' | 'soft-hold' | 'wishlist' }))} />
                      <RemoveBtn onClick={() => setProj((p) => removePackaging(p, i))} />
                    </div>
                  ))}
                  <GhostButton onClick={() => setProj((p) => addPackaging(p))} tone="accent">+ Add attachment</GhostButton>
                </div>
              </Field>

              {/* Soft-funding applications */}
              <Field label="Soft-funding & grant applications">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(proj.softFunding ?? []).map((s) => (
                    <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input value={s.body} placeholder="Fund / body" onChange={(e) => setProj((p) => updateSoftFunding(p, s.id, { body: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                      <div style={{ width: 150 }}>
                        <ExactFigureInput value={s.amount} onCommit={(v) => setProj((p) => updateSoftFunding(p, s.id, { amount: v }))} gated={ndaSigned} label="amount" defaultCurrency={defaultCurrency} />
                      </div>
                      <Select value={s.status} options={Object.keys(SOFT_FUNDING_STATUS_LABELS) as SoftFundingStatus[]} labelFor={(k) => SOFT_FUNDING_STATUS_LABELS[k as SoftFundingStatus]}
                        onChange={(v) => setProj((p) => updateSoftFunding(p, s.id, { status: v as SoftFundingStatus }))} />
                      <RemoveBtn onClick={() => setProj((p) => removeSoftFunding(p, s.id))} />
                    </div>
                  ))}
                  <GhostButton onClick={() => setProj((p) => addSoftFunding(p))} tone="accent">+ Add application</GhostButton>
                </div>
              </Field>
            </>
          ) : null}

          {/* Supporting documents — NDA-gated, all optional, no readiness banner */}
          <Field label="Supporting documents">
            {ndaSigned ? (
              <AfxDocumentUpload
                caseStudyId={proj.id}
                docs={proj.docs ?? []}
                categories={LIVE_DOCUMENT_CATEGORIES}
                onAdd={(doc) => setProj((p) => addDocument(p, doc))}
                onUpdate={(id, patch) => setProj((p) => updateDocument(p, id, patch))}
                onRemove={(id) => setProj((p) => removeDocument(p, id))}
              />
            ) : (
              <div style={{ fontSize: 12.5, color: '#9A9CA3', border: '1px dashed #DAD7D0', borderRadius: 8, padding: '12px 14px' }}>
                Sign the FRA NDA to attach confidential documents (budget, financing agreements, talent deals, script, deck) that strengthen this project&rsquo;s viability.
              </div>
            )}
          </Field>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: '1px solid #EAE8E3', background: '#fff' }}>
          {confirmingRemove ? (
            <>
              <span style={{ fontFamily: 'var(--afx-body)', fontSize: 13, color: '#5E6066', flex: 1 }}>Archive this project?</span>
              <button onClick={() => setConfirmingRemove(false)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Cancel</button>
              <button onClick={onRemove} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #7A2E2E', background: '#7A2E2E', color: '#fff' }}>Archive</button>
            </>
          ) : (
            <>
              {onRemove ? (
                <button onClick={() => setConfirmingRemove(true)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E3B6AE', background: '#fff', color: '#7A2E2E' }}>Archive</button>
              ) : null}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Close</button>
                <button onClick={() => onSave(proj)} disabled={!savable}
                  style={{ cursor: savable ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C1D21', background: savable ? '#1C1D21' : '#C9C7C1', color: '#fff', opacity: savable ? 1 : 0.8 }}
                  title={savable ? '' : 'A title and current stage are required'}>
                  Save
                </button>
              </div>
            </>
          )}
        </footer>
      </aside>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--afx-body)', fontSize: 13, color: '#1C1D21',
  border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Select<T extends string>({ value, options, onChange, placeholder, labelFor }: { value: string; options: readonly T[]; onChange: (v: string) => void; placeholder?: string; labelFor?: (v: T) => string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', minWidth: 120 }}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((opt) => <option key={opt} value={opt}>{labelFor ? labelFor(opt) : opt}</option>)}
    </select>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} aria-label="Remove" style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, width: 30, height: 30, color: '#9A9CA3', fontSize: 15, lineHeight: 1 }}>×</button>;
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/LiveProjectDrawer.tsx
git commit -m "feat(afx): LiveProjectDrawer — package a live project with NDA-gated documents"
```

---

### Task 8: Wire the drawer — card summary + client state

**Files:**
- Modify: `src/components/afx/producer/LiveSlateZone.tsx`
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx`

**Interfaces:**
- Consumes: `LiveProjectDrawer` (Task 7).
- `LiveSlateZone` Props change: **remove** `onExact`; **add** `onOpenProject: (id: string) => void`. The card becomes a read-only summary (keep the existing NDA exact-figure *display* removed — editing moves to the drawer) plus a "Package / Edit" button that calls `onOpenProject(p.id)`.

- [ ] **Step 1: Update `LiveSlateZone.tsx` — props + card summary**

Change the `Props` interface: remove the `onExact` line, add `onOpenProject: (id: string) => void`. Update the component signature and the `LiveProjectCard` usage accordingly. The card:
- Drops the entire `{ndaSigned ? (<div>… Exact figures …</div>) : null}` editing block and the `onExact` prop.
- Adds a footer button next to Archive: a `GhostButton` labelled `Package / edit` that calls `onOpenProject(project.id)`.

The card no longer edits exact figures, so `ndaSigned` and `defaultCurrency` are no
longer needed by this component — **remove them** from `Props`. Replace the `Props`
interface:

```ts
interface Props {
  draft: ProducerProfile;
  onAddProject: () => void;
  onArchive: (id: string) => void;
  onOpenProject: (id: string) => void;
}
```

Update the default export signature and the `.map`:

```tsx
export default function LiveSlateZone({ draft, onAddProject, onArchive, onOpenProject }: Props) {
```

Also delete now-unused imports at the top of `LiveSlateZone.tsx`: `ExactFigureInput`,
and the `AfxCurrency` / `ExactMoney` type imports (they were only used by the removed
exact-figure editing). Keep `Project`, `ProducerProfile`, and the rest.

```tsx
            {live.map((p) => (
              <LiveProjectCard key={p.id} project={p} onArchive={() => onArchive(p.id)}
                lastScreenable={screenable.length <= 1 && meetsCorePackaging(p)}
                onOpen={() => onOpenProject(p.id)} />
            ))}
```

Replace the `LiveProjectCard` signature and delete the exact-figures block, wiring the open button. New card signature + footer:

```tsx
function LiveProjectCard({ project, onArchive, lastScreenable, onOpen }: { project: Project; onArchive: () => void; lastScreenable: boolean; onOpen: () => void }) {
```

Delete the whole `{ndaSigned ? ( ... Exact figures (NDA) ... ) : null}` block inside the card. Replace the card footer row:

```tsx
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2 }}>
        <ProvenanceBadge provenance={project.budgetBand.provenance} size="sm" />
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostButton onClick={onOpen} tone="accent">Package / edit</GhostButton>
          <GhostButton onClick={onArchive} tone={lastScreenable ? 'danger' : 'neutral'}>Archive</GhostButton>
        </div>
      </div>
```

(Imports and Props were already cleaned up above — `ExactFigureInput`, `AfxCurrency`, `ExactMoney`, `ndaSigned`, and `defaultCurrency` are all removed from this file.)

- [ ] **Step 2: Update `ProducerProfileClient.tsx` — import, state, handlers**

Add the import near the other producer-component imports:

```ts
import LiveProjectDrawer from '@/components/afx/producer/LiveProjectDrawer';
```

(The drawer enforces savability itself, so the client does not import `isLiveProjectSavable`.)

Add drawer state near the `editing` state (line ~37):

```ts
  const [editingLive, setEditingLive] = useState<Project | null>(null);
```

Add handlers (near `onSaveCaseStudy`, around line ~52). The save merges the edited live project back into the slate and lets the existing autosave persist it:

```ts
  const onOpenLiveProject = (id: string) => {
    const found = (draft.slate ?? []).find((p) => p.id === id);
    if (found) setEditingLive(structuredClone(found));
  };
  const onSaveLiveProject = (project: Project) => {
    setDraft((d) => ({ ...d, slate: (d.slate ?? []).map((p) => (p.id === project.id ? project : p)) }));
    setEditingLive(null);
  };
```

- [ ] **Step 3: Open the drawer on add, and drop the old inline `onExact` wiring**

Change `onAddProject` so a freshly created live project opens the drawer immediately. After the `setDraft(...)` that appends the new project, capture its id and open it. Replace the current `onAddProject` body's tail so it builds the project object once, appends it, and opens it:

```ts
  const onAddProject = () => {
    const n = counter + 1;
    setCounter(n);
    const project: Project = {
      id: crypto.randomUUID(), status: 'live', title: `New project ${n}`, format: 'feature', role: 'Producer', jurisdiction: ['ZA'],
      budgetBand: { value: '$0.5–2M', provenance: 'self' },
      ask: { logline: '', stage: 'development', commercialPath: 'Festival-driven', fundingSecuredBand: '<40% secured', capitalStack: { equityPct: 20, softPct: 0, debtPct: 0, gapPct: 80 }, packaging: [{ role: 'Director', name: '—', status: 'wishlist' }, { role: 'Writer', name: '—', status: 'wishlist' }] },
    };
    setDraft((d) => ({ ...d, slate: [...(d.slate ?? []), project] }));
    setEditingLive(structuredClone(project));
  };
```

The `onExact` function (lines ~149-182) and the `ExactKey` type alias / `ExactFigures`/`ExactMoney` imports it uses become unused once `LiveSlateZone` no longer takes `onExact`. **Delete the `onExact` function.** Then check whether `ExactKey`, `ExactFigures`, and `ExactMoney` are still referenced anywhere else in the file (grep the file); delete each that is now unused to keep `next build`'s lint clean. Update the `<LiveSlateZone .../>` call (line ~327):

```tsx
<LiveSlateZone draft={draft} onAddProject={onAddProject} onArchive={onArchive} onOpenProject={onOpenLiveProject} ndaSigned={!!draft.ndaSigned} defaultCurrency={localCurrency} />
```

- [ ] **Step 4: Render the drawer**

After the `{editing ? (() => { ... CaseStudyDrawer ... })() : null}` block (around line 359), add:

```tsx
      {editingLive ? (
        <LiveProjectDrawer
          initial={editingLive}
          ndaSigned={!!draft.ndaSigned}
          defaultCurrency={localCurrency}
          onSave={onSaveLiveProject}
          onClose={() => setEditingLive(null)}
          onRemove={() => { onArchive(editingLive.id); setEditingLive(null); }}
        />
      ) : null}
```

Note: `onArchive` already handles the last-screenable confirm-guard; archiving from the drawer reuses it. `isLiveProjectSavable` is imported for parity/possible future use in the client — if `tsc` flags it unused, remove that import (the drawer enforces savability itself). Prefer removing the unused import to keep the build clean.

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean (resolve any unused-symbol errors by deleting the dead `onExact` function / unused imports as noted).

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/afx/producer/LiveSlateZone.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): wire the Live Slate packaging drawer (card summary + client state)"
```

---

## Manual verification (after all tasks, on prod post-deploy)

On Gerhard's producer account at `/afx/producer`:
1. Click **+ Add live project** → the packaging drawer opens on the new project.
2. Set a **stage**, edit the **logline**, add a **packaging attachment** (set to `signed`), add a **soft-funding application** (body + status `awarded`). Save → card shows the summary with a **Package / edit** button.
3. Re-open → all entered data persisted.
4. With the **NDA signed**, the Supporting documents area is active: upload a PDF, re-open to confirm it persisted; without NDA, the "sign the FRA NDA…" prompt shows instead.
5. **Archive** from the drawer works (and the last-screenable confirm still fires).
6. Confirm **no score** is visible anywhere producer-side.
7. Toggle the profile's **Funder preview** — the live project shows no exact figures, no documents, no soft-funding.

---

## Self-Review notes (author)

- **Spec coverage:** drawer + fields (Task 7/8), soft-funding (Tasks 1,2,7), NDA-gated docs reusing one NDA (Tasks 5,6,7), all-optional/no-readiness-banner (Task 6), live categories (Task 1), pure de-risking score internal-only (Task 3), funder-view isolation incl. softFunding (Task 4), one-line backend widen (Task 5). Deferred phases 2/3 untouched. ✔
- **Deviation from spec (intentional):** `softFunding` placed at `Project` top level (not on `ProjectAsk`) so the existing shallow `stripExact` covers it; documented in Global Constraints + Task 1/4.
- **Type consistency:** `SoftFundingStatus`/`SoftFundingApplication`/`softFunding`, `LIVE_DOCUMENT_CATEGORIES`, `LIVE_STAGE_OPTIONS`, `FUNDING_SECURED_BANDS`, `SOFT_FUNDING_STATUS_LABELS`, `derisking`/`DeriskingScore`, `isLiveProjectSavable`, `onOpenProject` used consistently across tasks.
