# AFX Funder Marketplace (Phase 3, slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the seed `DealEntity` demo at `/afx/marketplace` with a lean, staff-gated funder marketplace rendering real producer live projects through the funder-safe boundary, one row per producer (expandable to screenable projects), ordered by the hidden de-risking score and honoring the funder-visibility model.

**Architecture:** Phase-2 three-layer split — a pure mapper (`funderMarketplace.ts`, `toFunderMarketRows`), a staff-gated service-role reader (`server/funderMarketplace.ts`, `listFunderMarketRows`), and a client component (`FunderMarket.tsx`) behind a rewritten async route. The de-risking score orders rows server-side and is never emitted to the client. The seed `DealEntity` marketplace files are deleted.

**Tech Stack:** Next.js App Router (RSC + `'use client'`), TypeScript, Supabase service-role reads via `afxAdmin`, inline `var(--afx-*)` styling.

## Global Constraints

- Route `/afx/marketplace` MUST be staff-gated: `const staff = await resolveStaff(); if (!staff) redirect('/afx/staff');` before rendering. Server reader returns `[]` for non-staff.
- Show only funder-visible producers: `deriveVisibility(profile)` in `{ 'live', 'one-away' }`; **skip `hidden`**. Within a producer, only `liveProjects(profile).filter(meetsCorePackaging)` (screenable) projects appear.
- Row ordering: `live` producers before `one-away` (visibility rank), then by the producer's hidden best (max) screenable-project de-risking `total` desc, then `producerName`. Projects within a producer: hidden score desc, tie-break `title`.
- Emitted rows carry ONLY funder-safe fields. `FunderMarketRow`/`FunderMarketProjectRow` must NOT carry `score`, `breakdown`, `exact`, `docs`, `softFunding`, or the raw `slate`. The de-risking score is computed for ordering and dropped.
- Server reads `afx_projects` `body` + `docs` (needed by `derisking`) but NOT the NDA-gated `exact` column.
- Delete the seed machinery: `DealDisplayClient.tsx`, `DealTableRow.tsx`, `DrillDownOverlay.tsx`, `CompareOverlay.tsx`, `grid.ts`, and the now-unused constants `ENTITY_TABS`, `SIGNAL_TABS`, `SORT_COLUMNS`, `FILTER_GROUPS` (confirmed imported only by `DealDisplayClient`). Keep the `afxSeed` module and the `DealEntity`/`EntityKind`/`SignalStyle` types (still used by `FunderPreview`/`LiveSlateZone`/`SignalChip`).
- No migration, no new RLS/policy, no `afx_producers` write, no `deriveVisibility`/`funderView`/`derisking` change.
- No test runner; verification is `npx tsc --noEmit -p tsconfig.json` + `npx next build`, plus `npx tsx` assertions for the pure module (deleted after), plus a manual prod browser check.

**Codebase facts (verified):** `deriveVisibility(p)` returns `'hidden'` when `!p.consentK4 || !p.entityK2` or zero screenable; `'one-away'` at exactly 1 screenable; `'live'` at ≥2. `meetsCorePackaging(pr)` requires a named Director + named Writer + `capitalStack.gapPct < 100 && fundingSecuredBand !== ''`. `liveProjects(p)` filters `slate` to `status === 'live'`. `Visibility = 'hidden' | 'one-away' | 'live'`; `RatingBand = 'A'|'B'|'C'|'D'`; `RATING_BAND_LABEL` and `VISIBILITY_META` are `Record`s keyed by those. `ProjectAsk` has `logline, stage, commercialPath, fundingSecuredBand, capitalStack, packaging`. `ProducerProfile` required fields: `id, name, company, bio, ratingBand, careerStage, relationships, slate, ndaSigned, entityK2, consentK4`.

---

### Task 1: Pure module `funderMarketplace.ts` (types + `toFunderMarketRows`)

**Files:**
- Create: `src/lib/afx/funderMarketplace.ts`
- Test (temporary, deleted in Step 6): `funderMarketplace.test.mts` at repo root

**Interfaces:**
- Consumes: `deriveVisibility`, `meetsCorePackaging` from `@/lib/afx/constants`; `liveProjects` from `@/lib/afx/aggregates`; `derisking` from `@/lib/afx/derisking`; types `ProducerProfile`, `Project`, `RatingBand`, `Visibility`, `PackagingAttachment` from `@/lib/afx/types`.
- Produces:
  - `interface FunderMarketProjectRow { id: string; title: string; stage: string; format: string; budgetBand: string; fundingSecuredBand: string; commercialPath: string; packaging: PackagingAttachment[]; }`
  - `interface FunderMarketRow { producerId: string; producerName: string; company: string; ratingBand: RatingBand; careerStage: string; visibility: 'live' | 'one-away'; screenableCount: number; projects: FunderMarketProjectRow[]; }`
  - `function toFunderMarketRows(profiles: ProducerProfile[]): FunderMarketRow[]`

- [ ] **Step 1: Write the failing test**

Create `funderMarketplace.test.mts` at the repo root:

```ts
import assert from 'node:assert/strict';
import type { ProducerProfile, Project, ProjectAsk, AfxDocument } from './src/lib/afx/types';
import { derisking } from './src/lib/afx/derisking';
import { toFunderMarketRows, type FunderMarketRow } from './src/lib/afx/funderMarketplace';

function ask(over: Partial<ProjectAsk> = {}): ProjectAsk {
  return {
    logline: 'l', stage: 'packaging', commercialPath: 'Streamer-first',
    fundingSecuredBand: '<40% secured',
    capitalStack: { equityPct: 20, softPct: 0, debtPct: 0, gapPct: 80 },
    packaging: [
      { role: 'Director', name: 'Dee', status: 'signed' },
      { role: 'Writer', name: 'Wee', status: 'signed' },
    ],
    ...over,
  };
}
function P(over: Partial<Project> & { id: string; title: string }): Project {
  return { status: 'live', format: 'Feature', role: 'Producer', jurisdiction: ['ZA'], budgetBand: { value: '$1-2M', provenance: 'self' }, ask: ask(), ...over } as Project;
}
function prof(over: Partial<ProducerProfile> & { id: string; name: string }): ProducerProfile {
  return { company: 'Co', bio: '', ratingBand: 'C', careerStage: 'Emerging', relationships: [], slate: [], ndaSigned: true, entityK2: true, consentK4: true, ...over } as ProducerProfile;
}

// Screenable projects (named Director + Writer + funding plan). Weak vs strong by packaging/docs.
const aStrong = P({ id: 'a1', title: 'A-Strong' });
const aWeak = P({ id: 'a2', title: 'A-Weak', ask: ask({ packaging: [ { role: 'Director', name: 'Dee', status: 'soft-hold' }, { role: 'Writer', name: 'Wee', status: 'wishlist' } ] }) });
// A non-screenable live project (Writer unnamed) — must never appear.
const aHiddenProj = P({ id: 'a3', title: 'A-NotScreenable', ask: ask({ packaging: [ { role: 'Director', name: 'Dee', status: 'signed' }, { role: 'Writer', name: '', status: 'wishlist' } ] }) });

// Producer B: single screenable project, but boosted to outscore A (docs raise the score).
const bDocs: AfxDocument[] = [
  { id: 'd1', name: 'x.pdf', path: 'p/x', category: 'script', uploadedAt: '2026-01-01' },
  { id: 'd2', name: 'y.pdf', path: 'p/y', category: 'deck', uploadedAt: '2026-01-01' },
] as AfxDocument[];
const bStrong = P({ id: 'b1', title: 'B-Strong', ask: ask({ fundingSecuredBand: '80%+ secured' }), docs: bDocs });

const A = prof({ id: 'pA', name: 'Producer A', slate: [aWeak, aStrong, aHiddenProj] }); // 2 screenable -> 'live'
const B = prof({ id: 'pB', name: 'Producer B', slate: [bStrong] });                     // 1 screenable -> 'one-away'
const C = prof({ id: 'pC', name: 'Producer C', consentK4: false, slate: [aStrong] });    // consent off -> 'hidden'
const D = prof({ id: 'pD', name: 'Producer D', slate: [] });                             // no live -> 'hidden'

// Sanity: B's single project must outscore A's best, so ordering can prove visibility-primacy.
const aBest = Math.max(derisking(aStrong).total, derisking(aWeak).total);
assert.ok(derisking(bStrong).total > aBest, 'fixture sanity: B-Strong must outscore A');

const rows = toFunderMarketRows([B, A, C, D]);

// Hidden producers excluded (C: consent off; D: no live).
assert.equal(rows.length, 2);
assert.ok(!rows.some((r) => r.producerId === 'pC'));
assert.ok(!rows.some((r) => r.producerId === 'pD'));

// Visibility-primary ordering: A ('live') before B ('one-away') DESPITE B's higher score.
assert.equal(rows[0].producerId, 'pA');
assert.equal(rows[0].visibility, 'live');
assert.equal(rows[1].producerId, 'pB');
assert.equal(rows[1].visibility, 'one-away');

const rowA = rows[0];
// Only screenable projects appear (A-NotScreenable excluded); count matches.
assert.equal(rowA.screenableCount, 2);
assert.equal(rowA.projects.length, 2);
assert.ok(!rowA.projects.some((p) => p.id === 'a3'), 'non-screenable project must not appear');
// Projects sorted by hidden score desc: A-Strong (signed x2) before A-Weak.
assert.equal(rowA.projects[0].id, 'a1');
assert.equal(rowA.projects[1].id, 'a2');
// Funder-safe display fields present.
assert.equal(rowA.projects[0].budgetBand, '$1-2M');
assert.equal(rowA.projects[0].fundingSecuredBand, '<40% secured');
assert.equal(rowA.projects[0].stage, 'packaging');
assert.equal(rowA.projects[0].commercialPath, 'Streamer-first');
assert.equal(rowA.projects[0].packaging.length, 2);
assert.equal(rowA.ratingBand, 'C');

// FUNDER-SAFETY INVARIANT: no score/breakdown/exact/docs/softFunding/slate on emitted shapes.
for (const k of ['score', 'breakdown', 'exact', 'docs', 'softFunding', 'slate']) {
  assert.ok(!Object.keys(rowA).includes(k), `FunderMarketRow must not carry ${k}`);
}
for (const k of ['score', 'breakdown', 'exact', 'docs', 'softFunding']) {
  assert.ok(!Object.keys(rowA.projects[0]).includes(k), `FunderMarketProjectRow must not carry ${k}`);
}

console.log('funderMarketplace: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx funderMarketplace.test.mts`
Expected: FAIL — module `./src/lib/afx/funderMarketplace` not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/afx/funderMarketplace.ts`:

```ts
import type { ProducerProfile, Project, RatingBand, PackagingAttachment } from './types';
import { deriveVisibility, meetsCorePackaging } from './constants';
import { liveProjects } from './aggregates';
import { derisking } from './derisking';

/** Funder-safe projection of one screenable live project — bands + packaging only.
 *  NEVER the de-risking score, exact figures, docs, or soft-funding. */
export interface FunderMarketProjectRow {
  id: string;
  title: string;
  stage: string;
  format: string;
  budgetBand: string;
  fundingSecuredBand: string;
  commercialPath: string;
  packaging: PackagingAttachment[];
}

/** One producer row on the funder marketplace. Carries no score field —
 *  the de-risking score orders rows server-side and is dropped here. */
export interface FunderMarketRow {
  producerId: string;
  producerName: string;
  company: string;
  ratingBand: RatingBand;
  careerStage: string;
  visibility: 'live' | 'one-away';
  screenableCount: number;
  projects: FunderMarketProjectRow[];
}

const VIS_RANK: Record<'live' | 'one-away', number> = { live: 0, 'one-away': 1 };

/** Project funder-visible producers into ranked, funder-safe marketplace rows. Pure,
 *  no I/O. `hidden` producers are skipped; only `meetsCorePackaging` live projects
 *  appear. The de-risking score is computed for ordering only and never emitted. */
export function toFunderMarketRows(profiles: ProducerProfile[]): FunderMarketRow[] {
  const scored: { row: FunderMarketRow; best: number }[] = [];

  for (const p of profiles) {
    const visibility = deriveVisibility(p);
    if (visibility === 'hidden') continue;

    const screenable = liveProjects(p).filter(meetsCorePackaging);
    // deriveVisibility !== 'hidden' guarantees screenable.length >= 1.
    const ranked = screenable
      .map((proj) => ({ proj, score: derisking(proj).total }))
      .sort((a, b) => (b.score - a.score) || (a.proj.title < b.proj.title ? -1 : a.proj.title > b.proj.title ? 1 : 0));

    const projects: FunderMarketProjectRow[] = ranked.map(({ proj }) => ({
      id: proj.id,
      title: proj.title,
      stage: proj.ask?.stage ?? '',
      format: proj.format,
      budgetBand: proj.budgetBand.value,
      fundingSecuredBand: proj.ask?.fundingSecuredBand ?? '',
      commercialPath: proj.ask?.commercialPath ?? '',
      packaging: proj.ask?.packaging ?? [],
    }));

    scored.push({
      best: ranked[0].score,
      row: {
        producerId: p.id,
        producerName: p.name,
        company: p.company,
        ratingBand: p.ratingBand,
        careerStage: p.careerStage,
        visibility,
        screenableCount: screenable.length,
        projects,
      },
    });
  }

  scored.sort((a, b) =>
    (VIS_RANK[a.row.visibility] - VIS_RANK[b.row.visibility]) ||
    (b.best - a.best) ||
    (a.row.producerName < b.row.producerName ? -1 : a.row.producerName > b.row.producerName ? 1 : 0),
  );
  return scored.map((s) => s.row);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx funderMarketplace.test.mts`
Expected: PASS — prints `funderMarketplace: all assertions passed`.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors.

- [ ] **Step 6: Delete the temp test and commit**

```bash
rm funderMarketplace.test.mts
git add src/lib/afx/funderMarketplace.ts
git commit -m "feat(afx): pure funderMarketplace module — toFunderMarketRows + types"
```

---

### Task 2: Server module `server/funderMarketplace.ts` (`listFunderMarketRows`)

**Files:**
- Create: `src/lib/afx/server/funderMarketplace.ts`

**Interfaces:**
- Consumes: `resolveStaff` from `@/lib/afx/server/staffAccess`; `afxAdmin` from `@/lib/afx/server/documentAccess`; `rowsToProfile`, types `ProducerRow`, `ProjectRow` from `@/lib/afx/persistence`; `toFunderMarketRows`, `FunderMarketRow` from `@/lib/afx/funderMarketplace` (Task 1).
- Produces: `function listFunderMarketRows(): Promise<FunderMarketRow[]>`.

- [ ] **Step 1: Write the implementation**

Create `src/lib/afx/server/funderMarketplace.ts`:

```ts
import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { rowsToProfile, type ProducerRow, type ProjectRow } from '@/lib/afx/persistence';
import { toFunderMarketRows, type FunderMarketRow } from '@/lib/afx/funderMarketplace';

const PRODUCER_COLS = 'id, user_id, profile, entity_docs, entity_verified_at, individual_docs, individual_verified_at';
// Omits the NDA-gated `exact` column — derisking/visibility never read it, and it
// is stripped before the client regardless (defense-in-depth).
const PROJECT_COLS = 'id, producer_id, status, body, docs';

/** Funder marketplace: every funder-visible producer (live/one-away) with their
 *  screenable projects, ordered by hidden de-risking. Staff-gated for now; [] for
 *  anyone else. Projects live in afx_projects (not the profile blob), so we stitch
 *  each producer's live projects back via rowsToProfile. */
export async function listFunderMarketRows(): Promise<FunderMarketRow[]> {
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

  const profiles = producers.map((row) => rowsToProfile(row, byProducer.get(row.id) ?? []));
  return toFunderMarketRows(profiles);
}
```

Note: `deriveVisibility` also reads `consentK4`/`entityK2`, which live in the `profile` blob and are restored by `rowsToProfile` — no extra columns needed.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors.

- [ ] **Step 3: Production build**

Run: `npx next build`
Expected: build succeeds, no ESLint errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/server/funderMarketplace.ts
git commit -m "feat(afx): funderMarketplace server reader — listFunderMarketRows"
```

---

### Task 3: UI — `FunderMarket` component + route rewrite + seed removal

**Files:**
- Create: `src/components/afx/marketplace/FunderMarket.tsx`
- Rewrite: `src/app/afx/marketplace/page.tsx`
- Delete: `src/app/afx/marketplace/DealDisplayClient.tsx`, `src/components/afx/marketplace/DealTableRow.tsx`, `src/components/afx/marketplace/DrillDownOverlay.tsx`, `src/components/afx/marketplace/CompareOverlay.tsx`, `src/components/afx/marketplace/grid.ts`
- Modify: `src/lib/afx/constants.ts` (remove the four unused constants)

**Interfaces:**
- Consumes: `FunderMarketRow`, `FunderMarketProjectRow` from `@/lib/afx/funderMarketplace` (Task 1); `listFunderMarketRows` from `@/lib/afx/server/funderMarketplace` (Task 2); `resolveStaff` from `@/lib/afx/server/staffAccess`; `RATING_BAND_LABEL`, `VISIBILITY_META` from `@/lib/afx/constants`; `AfxTopBar` default export from `@/components/afx/AfxTopBar`.
- Produces: default-export `FunderMarket` component and the rewritten route page.

- [ ] **Step 1: Create the client component**

Create `src/components/afx/marketplace/FunderMarket.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { FunderMarketRow, FunderMarketProjectRow } from '@/lib/afx/funderMarketplace';
import { RATING_BAND_LABEL, VISIBILITY_META } from '@/lib/afx/constants';

const mono = 'var(--afx-mono)';

const STATUS_LABEL: Record<FunderMarketProjectRow['packaging'][number]['status'], string> = {
  signed: 'Signed', 'soft-hold': 'Soft-hold', wishlist: 'Wishlist',
};

function VisibilityChip({ visibility }: { visibility: FunderMarketRow['visibility'] }) {
  const m = VISIBILITY_META[visibility];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 10, fontWeight: 700, color: m.tone }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.tone }} />
      {m.label}
    </span>
  );
}

function ProjectRowView({ p }: { p: FunderMarketProjectRow }) {
  const meta = [p.stage, p.format, p.budgetBand, p.fundingSecuredBand, p.commercialPath].filter(Boolean).join(' · ');
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--afx-border)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--afx-ink)' }}>{p.title || 'Untitled'}</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginTop: 3 }}>{meta || '—'}</div>
      {p.packaging.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
          {p.packaging.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 70, flex: 'none', color: 'var(--afx-faint)' }}>{a.role}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{a.name || '—'}</span>
              <span style={{ fontSize: 10.5, color: 'var(--afx-muted)' }}>{STATUS_LABEL[a.status]}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function FunderMarket({ rows }: { rows: FunderMarketRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--afx-ink)', margin: 0 }}>Marketplace</h1>
        <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', marginTop: 4 }}>Live to funders — bands only, ranked by screening signal.</div>
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--afx-faint)', padding: '20px 0' }}>No producers are live to funders yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const isOpen = !!open[r.producerId];
            return (
              <div key={r.producerId} style={{ border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)' }}>
                      {r.producerName}{r.company ? <span style={{ color: 'var(--afx-faint)', fontWeight: 400 }}> · {r.company}</span> : null}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: 'var(--afx-ink)', background: '#F6F5F2', border: '1px solid var(--afx-border)', borderRadius: 6, padding: '2px 7px' }}>{r.ratingBand} · {RATING_BAND_LABEL[r.ratingBand]}</span>
                      <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)' }}>{r.careerStage}</span>
                      <VisibilityChip visibility={r.visibility} />
                    </div>
                  </div>
                  <button onClick={() => setOpen((o) => ({ ...o, [r.producerId]: !o[r.producerId] }))}
                    style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--afx-border)', borderRadius: 7, padding: '5px 10px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: 'var(--afx-muted)' }}>
                    {isOpen ? '▾' : '▸'} {r.screenableCount} project{r.screenableCount === 1 ? '' : 's'}
                  </button>
                </div>
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

- [ ] **Step 2: Rewrite the route**

Replace the entire contents of `src/app/afx/marketplace/page.tsx` with:

```tsx
import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listFunderMarketRows } from '@/lib/afx/server/funderMarketplace';
import FunderMarket from '@/components/afx/marketplace/FunderMarket';

export default async function AfxMarketplacePage() {
  const staff = await resolveStaff();
  if (!staff) redirect('/afx/staff');
  const rows = await listFunderMarketRows();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="Deal screening" />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <FunderMarket rows={rows} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Delete the seed marketplace files**

```bash
git rm src/app/afx/marketplace/DealDisplayClient.tsx \
       src/components/afx/marketplace/DealTableRow.tsx \
       src/components/afx/marketplace/DrillDownOverlay.tsx \
       src/components/afx/marketplace/CompareOverlay.tsx \
       src/components/afx/marketplace/grid.ts
```

- [ ] **Step 4: Remove the four now-unused constants**

In `src/lib/afx/constants.ts`, delete the export blocks for `ENTITY_TABS`, `SIGNAL_TABS`, `SORT_COLUMNS`, and `FILTER_GROUPS` (they were imported only by the deleted `DealDisplayClient`). Delete each `export const <NAME> = ...;` block in full. Do not touch any other export. If removing them leaves a top-of-file `import type { ... }` symbol unused (e.g. a type only those constants referenced), remove that unused symbol from the import too — `next build` in Step 6 will flag any that remains.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors (no dangling imports to the deleted files/constants).

- [ ] **Step 6: Production build**

Run: `npx next build`
Expected: build succeeds; `/afx/marketplace` appears in the route list as a dynamic (server-rendered) route; no ESLint unused-symbol errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/afx/marketplace/FunderMarket.tsx src/app/afx/marketplace/page.tsx src/lib/afx/constants.ts
git commit -m "feat(afx): replace seed marketplace with staff-gated funder surface"
```

## Manual verification (post-merge, on prod by Gerhard, staff)

Not automatable (staff-gated route against live Supabase). After deploy:

1. Visit `/afx/marketplace` → the lean "Marketplace" surface renders (no `DealEntity` table, filters, or compare).
2. Gerhard appears as **1 project from going live** (`one-away`) showing **Uhuru** (Director + Writer signed + funding plan) on expand, but **not** "New project 1" (Writer wishlist / unnamed → not screenable).
3. Confirm the row shows rating band + career stage + visibility chip; the expanded project shows stage / format / budget band / funding-secured band / commercial path / packaging rows.
4. Confirm **no** de-risking score, exact figures, filenames, or amounts anywhere.
5. Sign out (or a non-staff account) and hit `/afx/marketplace` directly → redirected to `/afx/staff`.

No migration, no new RLS/policy, no `afx_producers` write.
