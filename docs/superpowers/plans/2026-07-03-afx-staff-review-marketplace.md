# Staff Review Marketplace (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only, staff-gated page at `/afx/staff/marketplace` that lists every producer with ≥1 live project, one row per producer, ranked by the producer's best (max) live-project de-risking score, expandable to per-project rows — with verification badges and funder-safe bands only.

**Architecture:** Follows the NDA-log split: a **pure** shaping module (`reviewMarketplace.ts`, types + `toReviewRows`), a **service-role server** module (`staffReviewMarketplace.ts`, gated fetch), a **client** component (`StaffMarketplace.tsx`), a **route** (`app/afx/staff/marketplace/page.tsx`), and a **nav link** on the staff index. The internal `derisking(project)` score is computed on read (never persisted). All confidential exacts/filenames/amounts are excluded by construction — the display types simply don't carry them.

**Tech Stack:** Next.js App Router (RSC + `'use client'`), TypeScript, Supabase service-role reads via `afxAdmin`, inline `var(--afx-*)` styling.

## Global Constraints

- New route **`/afx/staff/marketplace`**, gated by `resolveStaff()`; `redirect('/afx/staff')` if not staff. The open `/afx/marketplace` seed demo is untouched.
- **One row per producer**, aggregating their live slate.
- Rank by the producer's **best (max)** live-project de-risking score; show the live-project **count** alongside.
- Lean purpose-built table + pure mapper — **not** a mapping into the seed `DealEntity` shape. No fabricated `budgetUSD`/`fundingPct`/`rebatePct`/`benchmark`/`tags`/`detail`.
- Rows render only funder-safe **bands + counts + the internal score + verification badges**. Never exact figures, document filenames, or soft-funding amounts.
- Verification badges: verified-individual / verified-company per producer, shown only when true (from `individualVerifiedAt` / `entityVerifiedAt`).
- Score rendered as its numeric total to **one decimal** (e.g. `8.5`) plus breakdown chips (completeness / packaging / funding-secured / documents / soft-funding).
- Only producers with ≥1 live project appear; a producer whose live list is empty is skipped entirely.
- Sort producers by `bestScore` desc, tie-break `liveCount` desc, then `producerName`. Sort each producer's projects by `score` desc, tie-break `title`.
- No migration, no new RLS/policy, no `afx_producers` write, no seed-marketplace change, no score persistence, no `DealEntity`/`funderView` change.
- No test runner exists; verification is `npx tsc --noEmit -p tsconfig.json` + `npx next build`, plus `npx tsx` assertions for the pure module (deleted after), plus a manual prod browser check.

**Codebase reality (important — the spec's data-access sketch is corrected here):** a producer's `slate` is **not** stored in the `afx_producers.profile` blob (`ProducerRow.profile` is `Omit<ProducerProfile, 'id' | 'slate' | …>`). Projects live in the separate **`afx_projects`** table and are stitched back via the exported `rowsToProfile(producerRow, projectRows)` helper (see `getSubmissionDetail` in `src/lib/afx/server/staffReview.ts` for the exact pattern). `rowsToProfile` also populates `producerType`, `name`, `company`, and the `entityVerifiedAt` / `individualVerifiedAt` markers on the returned `ProducerProfile`.

---

### Task 1: Pure shaping module `reviewMarketplace.ts` (types + `toReviewRows`)

**Files:**
- Create: `src/lib/afx/reviewMarketplace.ts`
- Test (temporary, deleted in Step 6): `reviewMarketplace.test.mts` at repo root

**Interfaces:**
- Consumes: `derisking(p: Project): { total: number; breakdown: DeriskingBreakdown }` from `@/lib/afx/derisking`; `producerTypeOf(p: { producerType?: ProducerType }): ProducerType` from `@/lib/afx/constants`; types `Project`, `ProducerType` from `@/lib/afx/types`; `DeriskingBreakdown` from `@/lib/afx/derisking`.
- Produces (later tasks rely on these exact names/shapes):
  - `interface ReviewProducerInput { id: string; name: string; company: string; producerType?: ProducerType; individualVerifiedAt?: string; entityVerifiedAt?: string; slate: Project[]; }`
  - `interface ReviewProjectRow { id: string; title: string; stage: string; format: string; budgetBand: string; fundingSecuredBand: string; score: number; breakdown: DeriskingBreakdown; }`
  - `interface ReviewRow { producerId: string; producerName: string; company: string; producerType: ProducerType; verifiedIndividual: boolean; verifiedCompany: boolean; liveCount: number; bestScore: number; bestProjectTitle: string | null; projects: ReviewProjectRow[]; }`
  - `function toReviewRows(inputs: ReviewProducerInput[]): ReviewRow[]`

- [ ] **Step 1: Write the failing test**

Create `reviewMarketplace.test.mts` at the repo root:

```ts
import assert from 'node:assert/strict';
import type { Project, ProjectAsk } from './src/lib/afx/types';
import { derisking } from './src/lib/afx/derisking';
import { toReviewRows, type ReviewProducerInput } from './src/lib/afx/reviewMarketplace';

function ask(over: Partial<ProjectAsk> = {}): ProjectAsk {
  return {
    logline: 'l', stage: 'packaging', commercialPath: 'c',
    fundingSecuredBand: '<40% secured',
    capitalStack: { equityPct: 20, softPct: 0, debtPct: 0, gapPct: 80 },
    packaging: [],
    ...over,
  };
}
function P(over: Partial<Project> & { id: string; title: string; status: Project['status'] }): Project {
  return { format: 'Feature', role: 'Producer', jurisdiction: [], budgetBand: { value: '$1-2M', provenance: 'self' }, ...over } as Project;
}

// Strong live project (signed packaging + 80%+ secured) outscores the weak one.
const strong = P({ id: 'a1', title: 'Alpha', status: 'live', genre: 'Drama',
  ask: ask({ fundingSecuredBand: '80%+ secured', packaging: [{ role: 'Director', name: 'X', status: 'signed' }] }) });
const weak = P({ id: 'a2', title: 'Beta', status: 'live', ask: ask({ packaging: [{ role: 'Writer', name: 'Y', status: 'wishlist' }] }) });
const cs = P({ id: 'a3', title: 'OldDoc', status: 'case_study' });

const strongScore = derisking(strong).total;
const weakScore = derisking(weak).total;
assert.ok(strongScore > weakScore, 'fixture sanity: strong must outscore weak');

const inputs: ReviewProducerInput[] = [
  { id: 'p1', name: 'Producer One', company: 'One Co', producerType: 'company',
    individualVerifiedAt: '2026-07-02T00:00:00Z', entityVerifiedAt: undefined,
    slate: [weak, strong, cs] },
  { id: 'p2', name: 'Producer Two', company: 'Two Co',
    slate: [weak] }, // one live project, lower best score
  { id: 'p3', name: 'Producer Three', company: 'Three Co', slate: [cs] }, // no live → omitted
];

const rows = toReviewRows(inputs);

// Only producers with >=1 live project appear (p3 omitted).
assert.equal(rows.length, 2, 'p3 (no live) must be omitted');
assert.ok(!rows.some((r) => r.producerId === 'p3'), 'p3 must not appear');

// Row sort: p1 (bestScore = strong) before p2 (bestScore = weak).
assert.equal(rows[0].producerId, 'p1');
assert.equal(rows[1].producerId, 'p2');

const r1 = rows[0];
// best(max) rollup selects the strongest project's score + title.
assert.equal(r1.bestScore, strongScore);
assert.equal(r1.bestProjectTitle, 'Alpha');
// liveCount counts only live (weak + strong = 2; case study excluded).
assert.equal(r1.liveCount, 2);
// per-project sort: strongest first.
assert.equal(r1.projects[0].id, 'a1');
assert.equal(r1.projects[1].id, 'a2');
assert.equal(r1.projects[0].score, strongScore);
// verified flags derive from the two markers.
assert.equal(r1.verifiedIndividual, true);
assert.equal(r1.verifiedCompany, false);
// producerType passes through.
assert.equal(r1.producerType, 'company');
// p2 defaults producerType to 'company' when absent.
assert.equal(rows[1].producerType, 'company');

// Funder-safe: no confidential fields leak onto the row or project shapes.
const projKeys = Object.keys(r1.projects[0]);
for (const k of ['exact', 'docs', 'softFunding', 'evidence']) {
  assert.ok(!projKeys.includes(k), `ReviewProjectRow must not carry ${k}`);
}
const rowKeys = Object.keys(r1);
assert.ok(!rowKeys.includes('slate'), 'ReviewRow must not carry the raw slate');

// Funder-safe display fields are present and correct.
assert.equal(r1.projects[0].budgetBand, '$1-2M');
assert.equal(r1.projects[0].fundingSecuredBand, '80%+ secured');
assert.equal(r1.projects[0].stage, 'packaging');
assert.equal(r1.projects[0].format, 'Feature');

console.log('reviewMarketplace: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx reviewMarketplace.test.mts`
Expected: FAIL — module `./src/lib/afx/reviewMarketplace` not found (file not created yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/afx/reviewMarketplace.ts`:

```ts
import type { Project, ProducerType } from './types';
import { derisking, type DeriskingBreakdown } from './derisking';
import { producerTypeOf } from './constants';

/** One producer's raw input for the staff review surface. `slate` is the
 *  producer's projects (server reconstructs it from afx_projects). */
export interface ReviewProducerInput {
  id: string;
  name: string;
  company: string;
  producerType?: ProducerType;
  individualVerifiedAt?: string;
  entityVerifiedAt?: string;
  slate: Project[];
}

/** Funder-safe projection of one live project — bands + score only, never
 *  exact figures / filenames / amounts. */
export interface ReviewProjectRow {
  id: string;
  title: string;
  stage: string;
  format: string;
  budgetBand: string;
  fundingSecuredBand: string;
  score: number;
  breakdown: DeriskingBreakdown;
}

/** One producer row on the staff review surface. */
export interface ReviewRow {
  producerId: string;
  producerName: string;
  company: string;
  producerType: ProducerType;
  verifiedIndividual: boolean;
  verifiedCompany: boolean;
  liveCount: number;
  bestScore: number;
  bestProjectTitle: string | null;
  projects: ReviewProjectRow[];
}

/** Shape producer inputs into ranked review rows. Pure, no I/O. Only producers
 *  with >=1 live project appear. The de-risking score is internal — safe here
 *  because the consuming route is staff-gated. */
export function toReviewRows(inputs: ReviewProducerInput[]): ReviewRow[] {
  const rows: ReviewRow[] = [];
  for (const input of inputs) {
    const live = input.slate.filter((p) => p.status === 'live');
    if (live.length === 0) continue;

    const projects: ReviewProjectRow[] = live.map((p) => {
      const { total, breakdown } = derisking(p);
      return {
        id: p.id,
        title: p.title,
        stage: p.ask?.stage ?? '',
        format: p.format,
        budgetBand: p.budgetBand.value,
        fundingSecuredBand: p.ask?.fundingSecuredBand ?? '',
        score: total,
        breakdown,
      };
    });
    projects.sort((a, b) => (b.score - a.score) || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));

    const best = projects[0];
    rows.push({
      producerId: input.id,
      producerName: input.name,
      company: input.company,
      producerType: producerTypeOf(input),
      verifiedIndividual: !!input.individualVerifiedAt,
      verifiedCompany: !!input.entityVerifiedAt,
      liveCount: live.length,
      bestScore: best.score,
      bestProjectTitle: best.title,
      projects,
    });
  }

  rows.sort((a, b) =>
    (b.bestScore - a.bestScore) ||
    (b.liveCount - a.liveCount) ||
    (a.producerName < b.producerName ? -1 : a.producerName > b.producerName ? 1 : 0),
  );
  return rows;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx reviewMarketplace.test.mts`
Expected: PASS — prints `reviewMarketplace: all assertions passed`.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors.

- [ ] **Step 6: Delete the temp test and commit**

```bash
rm reviewMarketplace.test.mts
git add src/lib/afx/reviewMarketplace.ts
git commit -m "feat(afx): pure reviewMarketplace module — toReviewRows + types"
```

---

### Task 2: Server module `staffReviewMarketplace.ts` (`listReviewRows`)

**Files:**
- Create: `src/lib/afx/server/staffReviewMarketplace.ts`

**Interfaces:**
- Consumes: `resolveStaff()` from `@/lib/afx/server/staffAccess`; `afxAdmin` from `@/lib/afx/server/documentAccess`; `rowsToProfile(producer: ProducerRow, projects: ProjectRow[]): ProducerProfile`, and types `ProducerRow`, `ProjectRow` from `@/lib/afx/persistence`; `toReviewRows`, `ReviewProducerInput`, `ReviewRow` from `@/lib/afx/reviewMarketplace` (Task 1).
- Produces: `function listReviewRows(): Promise<ReviewRow[]>` (consumed by the route in Task 3).

- [ ] **Step 1: Write the implementation**

Create `src/lib/afx/server/staffReviewMarketplace.ts`:

```ts
import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { rowsToProfile, type ProducerRow, type ProjectRow } from '@/lib/afx/persistence';
import { toReviewRows, type ReviewProducerInput, type ReviewRow } from '@/lib/afx/reviewMarketplace';

const PRODUCER_COLS = 'id, user_id, profile, entity_docs, entity_verified_at, individual_docs, individual_verified_at';
const PROJECT_COLS = 'id, producer_id, status, deal_ref, body, exact, docs';

/** Staff review surface: every producer with >=1 live project, ranked by best
 *  de-risking score. Any staff; [] for anyone else. The score is computed on
 *  read (never persisted). Projects live in afx_projects (not the profile blob),
 *  so we stitch each producer's live projects back via rowsToProfile. */
export async function listReviewRows(): Promise<ReviewRow[]> {
  if (!(await resolveStaff())) return [];

  const { data: prodData } = await afxAdmin.from('afx_producers').select(PRODUCER_COLS);
  const producers = (prodData ?? []) as ProducerRow[];
  if (producers.length === 0) return [];

  const { data: projData } = await afxAdmin.from('afx_projects').select(PROJECT_COLS).eq('status', 'live');
  const liveProjectRows = (projData ?? []) as ProjectRow[];

  const byProducer = new Map<string, ProjectRow[]>();
  for (const r of liveProjectRows) {
    const list = byProducer.get(r.producer_id);
    if (list) list.push(r);
    else byProducer.set(r.producer_id, [r]);
  }

  const inputs: ReviewProducerInput[] = producers.map((row) => {
    const profile = rowsToProfile(row, byProducer.get(row.id) ?? []);
    return {
      id: profile.id,
      name: profile.name,
      company: profile.company,
      producerType: profile.producerType,
      individualVerifiedAt: profile.individualVerifiedAt,
      entityVerifiedAt: profile.entityVerifiedAt,
      slate: profile.slate,
    };
  });

  return toReviewRows(inputs);
}
```

Notes for the implementer:
- We fetch only `status = 'live'` projects, so each stitched `profile.slate` already contains only live projects; `toReviewRows` re-filters by `status === 'live'` defensively (idempotent). Do not fetch case studies — they are not needed and would be discarded.
- `ProducerProfile.individualVerifiedAt` / `entityVerifiedAt` are populated by `rowsToProfile` from the isolated `individual_verified_at` / `entity_verified_at` columns; read them off the returned profile (do not re-read the raw row).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors. (`ProducerRow` / `ProjectRow` / `rowsToProfile` are exported from `persistence.ts`; the `.select(...)` string columns match `getSubmissionDetail`'s pattern.)

- [ ] **Step 3: Production build**

Run: `npx next build`
Expected: build succeeds, no ESLint errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/server/staffReviewMarketplace.ts
git commit -m "feat(afx): staffReviewMarketplace server reader — listReviewRows"
```

---

### Task 3: UI — `StaffMarketplace` component + route + nav link

**Files:**
- Create: `src/components/afx/staff/StaffMarketplace.tsx`
- Create: `src/app/afx/staff/marketplace/page.tsx`
- Modify: `src/app/afx/staff/page.tsx` (add the nav link)

**Interfaces:**
- Consumes: `ReviewRow`, `ReviewProjectRow` from `@/lib/afx/reviewMarketplace` (Task 1); `DeriskingBreakdown` from `@/lib/afx/derisking`; `listReviewRows()` from `@/lib/afx/server/staffReviewMarketplace` (Task 2); `resolveStaff()` from `@/lib/afx/server/staffAccess`; `AfxTopBar` default export from `@/components/afx/AfxTopBar`.
- Produces: default-export React components `StaffMarketplace` and the route page; a new nav `<Link>` on `/afx/staff`.

- [ ] **Step 1: Create the client component**

Create `src/components/afx/staff/StaffMarketplace.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ReviewRow, ReviewProjectRow } from '@/lib/afx/reviewMarketplace';
import type { DeriskingBreakdown } from '@/lib/afx/derisking';

const mono = 'var(--afx-mono)';

const BREAKDOWN: { key: keyof DeriskingBreakdown; label: string }[] = [
  { key: 'completeness', label: 'cmp' },
  { key: 'packaging', label: 'pkg' },
  { key: 'fundingSecured', label: 'fund' },
  { key: 'documents', label: 'docs' },
  { key: 'softFunding', label: 'soft' },
];

function VerifiedBadge({ label }: { label: string }) {
  return <span style={{ fontFamily: mono, fontSize: 9.5, fontWeight: 700, color: '#2E7D46', background: '#F2FBF4', border: '1px solid #CDEAD5', borderRadius: 999, padding: '2px 8px' }}>{label}</span>;
}

function BreakdownChips({ b }: { b: DeriskingBreakdown }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {BREAKDOWN.map((c) => (
        <span key={c.key} style={{ fontFamily: mono, fontSize: 9.5, color: 'var(--afx-muted)', background: '#F6F5F2', border: '1px solid var(--afx-border)', borderRadius: 6, padding: '2px 7px' }}>
          {c.label} {b[c.key]}
        </span>
      ))}
    </div>
  );
}

function ScoreTag({ score }: { score: number }) {
  return <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: 'var(--afx-ink)' }}>{score.toFixed(1)}</span>;
}

function ProjectRowView({ p }: { p: ReviewProjectRow }) {
  const meta = [p.stage, p.format, p.budgetBand, p.fundingSecuredBand].filter(Boolean).join(' · ');
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--afx-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--afx-ink)' }}>{p.title || 'Untitled'}</span>
        <ScoreTag score={p.score} />
      </div>
      <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginTop: 3 }}>{meta || '—'}</div>
      <BreakdownChips b={p.breakdown} />
    </div>
  );
}

export default function StaffMarketplace({ rows }: { rows: ReviewRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--afx-ink)', margin: 0 }}>Marketplace review</h1>
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--afx-faint)', padding: '20px 0' }}>No producers with live projects yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const isOpen = !!open[r.producerId];
            const best = r.projects[0];
            return (
              <div key={r.producerId} style={{ border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)' }}>
                      {r.producerName}{r.company ? <span style={{ color: 'var(--afx-faint)', fontWeight: 400 }}> · {r.company}</span> : null}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                      {r.verifiedIndividual ? <VerifiedBadge label="verified individual" /> : null}
                      {r.verifiedCompany ? <VerifiedBadge label="verified company" /> : null}
                      <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)' }}>{r.liveCount} live</span>
                      {r.bestProjectTitle ? <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)' }}>· strongest: {r.bestProjectTitle}</span> : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faint)' }}>de-risking</div>
                    <ScoreTag score={r.bestScore} />
                  </div>
                  <button onClick={() => setOpen((o) => ({ ...o, [r.producerId]: !o[r.producerId] }))}
                    style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--afx-border)', borderRadius: 7, padding: '5px 10px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: 'var(--afx-muted)' }}>
                    {isOpen ? '▾' : '▸'} {r.liveCount} project{r.liveCount === 1 ? '' : 's'}
                  </button>
                </div>
                {best ? <BreakdownChips b={best.breakdown} /> : null}
                {isOpen ? (
                  <div style={{ marginTop: 8 }}>
                    {r.projects.map((p) => <ProjectRowView key={p.id} p={p} />)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the route**

Create `src/app/afx/staff/marketplace/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listReviewRows } from '@/lib/afx/server/staffReviewMarketplace';
import StaffMarketplace from '@/components/afx/staff/StaffMarketplace';

export default async function AfxStaffMarketplacePage() {
  const staff = await resolveStaff();
  if (!staff) redirect('/afx/staff');
  const rows = await listReviewRows();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffMarketplace rows={rows} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Add the nav link on the staff index**

In `src/app/afx/staff/page.tsx`, replace this exact line:

```tsx
          <Link href="/afx/staff/nda" style={navLink}>NDA log →</Link>
```

with:

```tsx
          <Link href="/afx/staff/nda" style={navLink}>NDA log →</Link>
          <Link href="/afx/staff/marketplace" style={navLink}>Marketplace review →</Link>
```

(All staff — not admin-gated; it sits beside Invites / NDA log, before the admin-only "Manage team" link.)

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors.

- [ ] **Step 5: Production build**

Run: `npx next build`
Expected: build succeeds; the new route `/afx/staff/marketplace` appears in the route list; no ESLint errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/afx/staff/StaffMarketplace.tsx src/app/afx/staff/marketplace/page.tsx src/app/afx/staff/page.tsx
git commit -m "feat(afx): staff marketplace review page + nav link"
```

## Manual verification (post-merge, on prod by Gerhard, a staff admin)

Not automatable (staff-gated route against live Supabase). After deploy:

1. Visit `/afx/staff` → a "Marketplace review →" link sits beside Invites / NDA log.
2. Click it → `/afx/staff/marketplace` renders "Marketplace review" with a `← Queue` back link on the left.
3. Gerhard's producer entry appears (he has live projects "New project 1" / "Uhuru") with a best de-risking score (one decimal), verification badges (verified individual / verified company), "N live", and breakdown chips.
4. Expand the "▸ N projects" toggle → per-project rows show stage / format / budget band / funding-secured band / per-project score + chips, sorted strongest-first.
5. Confirm **no** exact figures, document filenames, or soft-funding amounts appear anywhere.
6. Sign out (or use a non-staff account) and hit `/afx/staff/marketplace` directly → redirected to `/afx/staff`.

No migration, no new RLS/policy, no `afx_producers` write, no seed-marketplace change.
