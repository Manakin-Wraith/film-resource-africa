# AFX Funder Marketplace — Slate (Portfolio) Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a producer's live projects be grouped into a self-reported `Slate` (portfolio), and render that slate as a portfolio-level card nested inside the existing producer row on `/afx/marketplace`, alongside any standalone live projects.

**Architecture:** Extends the existing three-layer split. `types.ts` gains the `RiskTier`/`Slate` shapes and an optional `ProducerProfile.slates` array. The pure mapper `funderMarketplace.ts` partitions each producer's screenable live projects into slate members vs. standalone, emitting a new `FunderMarketSlateRow` per slate alongside the existing `FunderMarketRow.projects`. `FunderMarket.tsx` gains a `SlateRowView` renderer nested inside the existing expanded producer row, reusing `ProjectRowView`, `ProvenanceBadge`, and the existing comp-chip styling. No persistence-layer code changes: `slates` is a plain, non-confidential field that flows through the existing `profile` JSON blob column via the `...profile` spread in `profileToRows`/`rowsToProfile` (verified by reading `src/lib/afx/persistence.ts` — no isolated column, no destructuring change needed).

**Tech Stack:** TypeScript, Next.js App Router (RSC + `'use client'`), inline `var(--afx-*)` styling — matches existing `FunderMarket.tsx` conventions exactly.

## Global Constraints

- Every slate econ field (`totalBudgetBand`, `securedBand`, `askBand`, `targetIRR`, `portfolioROI`) is a **band/range string, never an exact figure** — same rule as `capitalStack` on `ProjectAsk` today. No NDA-gated "exact" unlock for slate economics in this slice.
- Slate econ fields are **producer self-reported**: `totalBudgetBand`, `askBand`, `targetIRR`, `portfolioROI` are `Provenanced<string>` (carry `provenance: 'self'` in fixtures/tests); the platform does not compute or validate them.
- **No numeric slate score** is ever emitted to the funder view. Readiness is the qualitative `stage: 'packaging' | 'financing' | 'ready'` label only. The existing hidden `derisking` score is untouched and continues to drive row/project ordering exactly as it does today — slates do not introduce a new ranking signal.
- `riskTier` (`'low' | 'mid' | 'high-upside'`) only has meaning for a project that is a member of a slate (`slate.riskTiers[projectId]`). A standalone project has no risk tier.
- A slate with **zero screenable member projects renders nothing** (same bar as a `hidden` producer having zero screenable projects) — never show an empty slate card.
- A `projectId` in `slate.projectIds` that isn't `live` or fails `meetsCorePackaging` is silently dropped from that slate's `volume`/`riskSpread`/member list; it does not block the rest of the slate.
- `FunderMarketSlateRow` and its nested `FunderMarketProjectRow`s must never carry `score`, `breakdown`, `exact`, `docs`, `softFunding` — identical funder-safety invariant to today's `FunderMarketRow`.
- No test runner exists in this repo (verified: no `vitest`/`jest` in `package.json`, no config files). Verification is `npx tsc --noEmit -p tsconfig.json`, plus temporary `npx tsx` assertion scripts for pure-module logic (written at repo root, deleted once green), plus `npx next build`. No React component test — the repo has zero existing component tests, so this plan doesn't introduce the first one.
- **Out of scope for this plan** (confirmed in the design spec): a producer-facing cockpit UI to create/edit slates. This slice only adds the data shape and the funder-facing render; slate data for manual verification is constructed directly in test fixtures /`toFunderMarketRows` unit assertions, not through any UI form. Standing up a cockpit editor is a follow-on slice.

**Codebase facts (verified):**
- `ProducerProfile.slate: Project[]` is the existing (confusingly-named) field holding **all** of a producer's projects — unrelated to the new `Slate` portfolio type being added here. `liveProjects(p)` / `caseStudies(p)` filter `p.slate` by `status`. The new field is `ProducerProfile.slates?: Slate[]` (plural, new type) — do not confuse the two.
- `meetsCorePackaging(pr: Project): boolean` (in `src/lib/afx/constants.ts`) requires a named Director + named Writer in `ask.packaging`, plus `ask.capitalStack.gapPct < 100 && ask.fundingSecuredBand.trim() !== ''`.
- `deriveVisibility`, row/project ordering, and the `derisking` score are untouched by this plan.
- `profileToRows` in `src/lib/afx/persistence.ts` does `const { id, slate, entityDocs, entityVerifiedAt, individualDocs, individualVerifiedAt, ...profile } = p;` — any new top-level `ProducerProfile` field not in that destructure list (like `slates`) is automatically included in the `profile` JSON blob with zero code changes. Confirmed by reading the file; no persistence task is needed in this plan.
- `EvidenceLink { id: string; url: string; supports: EvidenceClaim }` and `ProvenanceBadge`/`RiskFlag` primitives already exist and are reused as-is (`src/components/afx/primitives/`).

---

### Task 1: Types + pure module — `Slate`, `RiskTier`, `FunderMarketSlateRow`, slate partitioning in `toFunderMarketRows`

**Files:**
- Modify: `src/lib/afx/types.ts` — add `RiskTier`, `Slate`; extend `ProducerProfile`
- Modify: `src/lib/afx/funderMarketplace.ts` — add `FunderMarketSlateRow`; extend `FunderMarketRow` and `toFunderMarketRows`
- Test (temporary, deleted in final step): `funderMarketplaceSlate.test.mts` at repo root

**Interfaces:**
- Consumes: `Project`, `Provenanced`, `EvidenceLink`, `ProducerProfile` from `./types`; `meetsCorePackaging`, `deriveVisibility` from `./constants`; `liveProjects` from `./aggregates`; `derisking` from `./derisking` (all already imported by `funderMarketplace.ts` today, except the new types).
- Produces:
  - `export type RiskTier = 'low' | 'mid' | 'high-upside';` (in `types.ts`)
  - `export interface Slate { id: string; name: string; genreStrategy: string; stage: 'packaging' | 'financing' | 'ready'; projectIds: string[]; riskTiers: Record<string, RiskTier>; totalBudgetBand: Provenanced<string>; securedBand: string; askBand: Provenanced<string>; targetIRR: Provenanced<string>; portfolioROI: Provenanced<string>; distributionStrategy: string; evidence?: EvidenceLink[]; }` (in `types.ts`)
  - `ProducerProfile.slates?: Slate[]` (in `types.ts`)
  - `export interface FunderMarketSlateRow { id: string; name: string; genreStrategy: string; stage: Slate['stage']; volume: number; totalBudgetBand: string; securedBand: string; askBand: string; targetIRR: string; portfolioROI: string; riskSpread: Record<RiskTier, number>; distributionStrategy: string; evidence: EvidenceLink[]; projects: FunderMarketProjectRow[]; }` (in `funderMarketplace.ts`)
  - `FunderMarketRow` gains `slates: FunderMarketSlateRow[]`
  - `toFunderMarketRows(profiles: ProducerProfile[]): FunderMarketRow[]` — same signature, now also populates `slates` and excludes slated project ids from the row's own `projects`/`screenableCount`.

- [ ] **Step 1: Write the failing test**

Create `funderMarketplaceSlate.test.mts` at the repo root:

```ts
import assert from 'node:assert/strict';
import type { ProducerProfile, Project, ProjectAsk, Slate } from './src/lib/afx/types';
import { toFunderMarketRows } from './src/lib/afx/funderMarketplace';

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
function slate(over: Partial<Slate> & { id: string; projectIds: string[]; riskTiers: Record<string, Slate['riskTiers'][string]> }): Slate {
  return {
    name: 'Test Slate', genreStrategy: 'Commercial thrillers', stage: 'financing',
    totalBudgetBand: { value: 'R50-100M', provenance: 'self' },
    securedBand: '40-60%',
    askBand: { value: 'R25-50M', provenance: 'self' },
    targetIRR: { value: '20-30%', provenance: 'self' },
    portfolioROI: { value: '2-2.5x', provenance: 'self' },
    distributionStrategy: 'Pre-aligned sales agent',
    ...over,
  };
}

// Producer with 3 screenable live projects: 2 in a slate, 1 standalone.
const s1 = P({ id: 's1', title: 'Slate Film One' });
const s2 = P({ id: 's2', title: 'Slate Film Two' });
const standalone = P({ id: 'x1', title: 'Standalone Film' });
// A slate member that is NOT screenable (unnamed writer) must be dropped from the slate's rollup.
const s3NotScreenable = P({ id: 's3', title: 'Not Screenable', ask: ask({ packaging: [{ role: 'Director', name: 'Dee', status: 'signed' }, { role: 'Writer', name: '', status: 'wishlist' }] }) });

const theSlate = slate({ id: 'sl1', projectIds: ['s1', 's2', 's3'], riskTiers: { s1: 'low', s2: 'mid', s3: 'high-upside' } });
const emptySlate = slate({ id: 'sl2', name: 'Empty Slate', projectIds: ['doesnotexist'], riskTiers: {} });

const A = prof({ id: 'pA', name: 'Producer A', slate: [s1, s2, standalone, s3NotScreenable], slates: [theSlate, emptySlate] });

const rows = toFunderMarketRows([A]);
assert.equal(rows.length, 1);
const row = rows[0];

// Empty slate (no screenable members) must not be emitted.
assert.equal(row.slates.length, 1);
const outSlate = row.slates[0];
assert.equal(outSlate.id, 'sl1');
assert.equal(outSlate.name, 'Test Slate');
assert.equal(outSlate.stage, 'financing');

// Non-screenable member (s3) dropped from volume/members/riskSpread.
assert.equal(outSlate.volume, 2);
assert.equal(outSlate.projects.length, 2);
assert.ok(!outSlate.projects.some((p) => p.id === 's3'));
assert.deepEqual(outSlate.riskSpread, { low: 1, mid: 1, 'high-upside': 0 });

// Banded econ fields pass through as plain strings (bands, not exact).
assert.equal(outSlate.totalBudgetBand, 'R50-100M');
assert.equal(outSlate.askBand, 'R25-50M');
assert.equal(outSlate.targetIRR, '20-30%');
assert.equal(outSlate.portfolioROI, '2-2.5x');
assert.equal(outSlate.distributionStrategy, 'Pre-aligned sales agent');

// Slated projects (s1, s2) must NOT also appear in the row's standalone project list.
// s3 fails meetsCorePackaging entirely (empty writer name), so it must not appear
// anywhere — not in the slate (already asserted above) and not standalone either.
assert.ok(!row.projects.some((p) => p.id === 's1'));
assert.ok(!row.projects.some((p) => p.id === 's2'));
assert.ok(!row.projects.some((p) => p.id === 's3'));
assert.ok(row.projects.some((p) => p.id === 'x1'));
assert.equal(row.projects.length, 1);
assert.equal(row.screenableCount, 3); // s1, s2, x1 — s3 excluded everywhere, matches today's screenable-count semantics

// FUNDER-SAFETY INVARIANT: no score/breakdown/exact/docs/softFunding on the slate row or its members.
for (const k of ['score', 'breakdown', 'exact', 'docs', 'softFunding']) {
  assert.ok(!Object.keys(outSlate).includes(k), `FunderMarketSlateRow must not carry ${k}`);
  assert.ok(!Object.keys(outSlate.projects[0]).includes(k), `slate member project must not carry ${k}`);
}

console.log('funderMarketplaceSlate: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx funderMarketplaceSlate.test.mts`
Expected: FAIL — TypeScript/runtime error, `Slate` is not exported from `./src/lib/afx/types` (or `slates` does not exist on `ProducerProfile`, or `row.slates` is `undefined`).

- [ ] **Step 3: Implement the type additions**

In `src/lib/afx/types.ts`, add after the `EvidenceLink` interface (around line 212, right after the `EvidenceLink` block):

```ts
/** Risk tier a producer assigns a project when adding it to a Slate. Only
 *  meaningful in the context of slate membership — a standalone project has
 *  no risk tier. */
export type RiskTier = 'low' | 'mid' | 'high-upside';

/** A producer-curated portfolio of a subset of their live projects, pitched
 *  to funders as a diversified instrument rather than a single bet. All econ
 *  fields are bands/ranges — never exact figures — and self-reported, same
 *  as ProjectAsk fields today. A live project belongs to at most one Slate. */
export interface Slate {
  id: string;
  name: string;
  genreStrategy: string;
  stage: 'packaging' | 'financing' | 'ready';
  projectIds: string[];
  riskTiers: Record<string, RiskTier>;
  totalBudgetBand: Provenanced<string>;
  securedBand: string;
  askBand: Provenanced<string>;
  targetIRR: Provenanced<string>;
  portfolioROI: Provenanced<string>;
  distributionStrategy: string;
  evidence?: EvidenceLink[];
}
```

Then add the field to `ProducerProfile` (after `individualLinks` on the line before the closing `}` of the interface, currently line 191):

```ts
  /** Producer-curated portfolios grouping a subset of live projects. Profile
   *  blob field — not confidential, flows through `profile` like `bio`/`company`. */
  slates?: Slate[];
```

- [ ] **Step 4: Implement the pure-module partitioning logic**

In `src/lib/afx/funderMarketplace.ts`, update the import line to add `Slate` and `RiskTier`:

```ts
import type { ProducerProfile, Project, RatingBand, PackagingAttachment, CapitalStackInput, Provenance, Relationship, EvidenceLink, Slate, RiskTier } from './types';
```

Add the new row type right after `FunderMarketProjectRow`'s closing brace:

```ts
/** Funder-safe projection of a producer-curated slate. Banded econ fields
 *  only, self-reported, no NDA-gated exact layer in this slice. */
export interface FunderMarketSlateRow {
  id: string;
  name: string;
  genreStrategy: string;
  stage: Slate['stage'];
  volume: number;
  totalBudgetBand: string;
  securedBand: string;
  askBand: string;
  targetIRR: string;
  portfolioROI: string;
  riskSpread: Record<RiskTier, number>;
  distributionStrategy: string;
  evidence: EvidenceLink[];
  projects: FunderMarketProjectRow[];
}
```

Add `slates: FunderMarketSlateRow[];` to the `FunderMarketRow` interface, right after `projects: FunderMarketProjectRow[];`.

Now rework the body of `toFunderMarketRows`. Replace the whole function with:

```ts
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

    const toProjectRow = (proj: Project): FunderMarketProjectRow => ({
      id: proj.id,
      title: proj.title,
      stage: proj.ask?.stage ?? '',
      format: proj.format,
      budgetBand: proj.budgetBand.value,
      fundingSecuredBand: proj.ask?.fundingSecuredBand ?? '',
      commercialPath: proj.ask?.commercialPath ?? '',
      packaging: proj.ask?.packaging ?? [],
      logline: proj.ask?.logline ?? '',
      capitalStack: proj.ask?.capitalStack ?? { equityPct: 0, softPct: 0, debtPct: 0, gapPct: 0 },
      comps: proj.ask?.comps ?? [],
      evidence: proj.evidence ?? [],
    });

    const screenableIds = new Set(screenable.map((proj) => proj.id));
    const slatedIds = new Set<string>();
    const slateRows: FunderMarketSlateRow[] = [];

    for (const s of p.slates ?? []) {
      const memberIds = s.projectIds.filter((id) => screenableIds.has(id));
      if (memberIds.length === 0) continue; // no screenable members — drop the slate entirely

      const riskSpread: Record<RiskTier, number> = { low: 0, mid: 0, 'high-upside': 0 };
      for (const id of memberIds) {
        const tier = s.riskTiers[id];
        if (tier) riskSpread[tier] += 1;
        slatedIds.add(id);
      }

      const memberRanked = ranked.filter((r) => memberIds.includes(r.proj.id));
      slateRows.push({
        id: s.id,
        name: s.name,
        genreStrategy: s.genreStrategy,
        stage: s.stage,
        volume: memberIds.length,
        totalBudgetBand: s.totalBudgetBand.value,
        securedBand: s.securedBand,
        askBand: s.askBand.value,
        targetIRR: s.targetIRR.value,
        portfolioROI: s.portfolioROI.value,
        riskSpread,
        distributionStrategy: s.distributionStrategy,
        evidence: s.evidence ?? [],
        projects: memberRanked.map(({ proj }) => toProjectRow(proj)),
      });
    }

    const standaloneRanked = ranked.filter((r) => !slatedIds.has(r.proj.id));
    const projects: FunderMarketProjectRow[] = standaloneRanked.map(({ proj }) => toProjectRow(proj));

    const studyRows: FunderMarketCaseStudyRow[] = caseStudies(p).map((s) => ({
      id: s.id,
      title: s.title,
      format: s.format,
      budgetBand: s.budgetBand.value,
      recoupment: s.outcomes?.recoupment ?? { value: '—', provenance: 'self' },
      bondUsed: s.outcomes?.bondUsed ?? { value: '—', provenance: 'self' },
      distribution: s.outcomes?.distribution ?? [],
      festivalsAwards: s.outcomes?.festivalsAwards ?? [],
      evidence: s.evidence ?? [],
    }));

    scored.push({
      best: ranked[0].score,
      row: {
        producerId: p.id,
        producerName: p.name,
        company: p.company,
        bio: p.bio,
        location: p.location,
        ratingBand: p.ratingBand,
        careerStage: p.careerStage,
        visibility,
        screenableCount: screenable.length,
        relationships: p.relationships,
        slates: slateRows,
        projects,
        trackRecord: computeAggregates(p),
        caseStudies: studyRows,
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

Note: `screenableCount` keeps its existing meaning (total screenable projects for the producer, slated + standalone) — unchanged from today's behavior, so nothing downstream that reads `screenableCount` (e.g. the expand-toggle button label in `FunderMarket.tsx`) needs to change.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx funderMarketplaceSlate.test.mts`
Expected: `funderMarketplaceSlate: all assertions passed` printed, exit code 0.

- [ ] **Step 6: Typecheck and run the existing marketplace test to confirm no regression**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

If `funderMarketplace.test.mts` (the original, non-slate test from the earlier funder-marketplace slice) still exists at the repo root, run it too: `npx tsx funderMarketplace.test.mts` — expected: still passes unchanged (producers with no `slates` field behave identically to before).

- [ ] **Step 7: Delete the temporary test file and commit**

```bash
rm funderMarketplaceSlate.test.mts
git add src/lib/afx/types.ts src/lib/afx/funderMarketplace.ts
git commit -m "feat(afx): add Slate type and funder-marketplace slate partitioning

Producers can curate a subset of live projects into a self-reported,
banded-econ Slate; toFunderMarketRows now emits FunderMarketSlateRow
alongside standalone projects, excluding slated projects from the
row's own project list."
```

---

### Task 2: UI — `SlateRowView` nested in the producer row

**Files:**
- Modify: `src/components/afx/marketplace/FunderMarket.tsx`

**Interfaces:**
- Consumes: `FunderMarketSlateRow` from `@/lib/afx/funderMarketplace` (produced by Task 1); existing `ProvenanceBadge`, `mono` constant, and the existing `EvidenceLinks` helper already defined in this file.
- Produces: `SlateRowView({ s }: { s: FunderMarketSlateRow })` — a component rendered inside the expanded producer row, above any standalone `ProjectRowView`s.

- [ ] **Step 1: Add the `SlateRowView` component**

In `src/components/afx/marketplace/FunderMarket.tsx`, update the type-only import to include `FunderMarketSlateRow`:

```ts
import type { FunderMarketRow, FunderMarketProjectRow, FunderMarketCaseStudyRow, FunderMarketSlateRow } from '@/lib/afx/funderMarketplace';
```

The file already has `import type { EvidenceLink } from '@/lib/afx/types';` (line 5) — extend that existing line to also bring in `RiskTier` for the label map (do not add a second, duplicate import statement for `@/lib/afx/types`):

```ts
import type { EvidenceLink, RiskTier } from '@/lib/afx/types';
```

Add a risk-tier label map near the top, alongside `STATUS_LABEL`:

```ts
const RISK_TIER_LABEL: Record<RiskTier, string> = {
  low: 'low-risk', mid: 'mid', 'high-upside': 'high-upside',
};
```

Add a helper that renders the risk-spread rollup as a chip string, then the `SlateRowView` component itself, placed right before `ProjectRowView`:

```ts
function RiskSpreadLine({ riskSpread }: { riskSpread: FunderMarketSlateRow['riskSpread'] }) {
  const parts = (['low', 'mid', 'high-upside'] as const)
    .filter((tier) => riskSpread[tier] > 0)
    .map((tier) => `${riskSpread[tier]} ${RISK_TIER_LABEL[tier]}`);
  if (parts.length === 0) return null;
  return <span style={{ fontSize: 12, color: 'var(--afx-muted)' }}>{parts.join(' / ')}</span>;
}

function SlateEconRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
      <span style={{ width: 110, flex: 'none', color: 'var(--afx-faint)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--afx-ink)' }}>{value || '—'}</span>
    </div>
  );
}

function SlateRowView({ s }: { s: FunderMarketSlateRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--afx-border)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--afx-faint)' }}>Slate</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)', marginTop: 2 }}>{s.name}</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginTop: 2 }}>{[s.genreStrategy, `${s.volume} film${s.volume === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</div>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: 'var(--afx-ink)', background: '#F6F5F2', border: '1px solid var(--afx-border)', borderRadius: 6, padding: '2px 7px' }}>{s.stage}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        <SlateEconRow label="Budget" value={s.totalBudgetBand} />
        <SlateEconRow label="Secured" value={s.securedBand} />
        <SlateEconRow label="Ask" value={s.askBand} />
        <SlateEconRow label="Target IRR" value={s.targetIRR} />
        <SlateEconRow label="Portfolio ROI" value={s.portfolioROI} />
      </div>
      <div style={{ marginTop: 6 }}>
        <RiskSpreadLine riskSpread={s.riskSpread} />
      </div>
      {s.distributionStrategy ? (
        <div style={{ fontSize: 12, color: 'var(--afx-muted)', marginTop: 6 }}>{s.distributionStrategy}</div>
      ) : null}
      <EvidenceLinks evidence={s.evidence} />
      <button onClick={() => setOpen((o) => !o)}
        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginTop: 8, fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: 'var(--afx-muted)' }}>
        {open ? '▾' : '▸'} {s.volume} project{s.volume === 1 ? '' : 's'}
      </button>
      {open ? (
        <div>
          {s.projects.map((p) => <ProjectRowView key={p.id} p={p} />)}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Wire `SlateRowView` into the expanded producer row**

In the `FunderMarket` default export, inside the `isOpen` block, add slate rendering right before the `"Live slate"` heading + `r.projects.map(...)`:

```tsx
                    {r.slates.length > 0 ? (
                      <div style={{ marginBottom: 10 }}>
                        {r.slates.map((s) => <SlateRowView key={s.id} s={s} />)}
                      </div>
                    ) : null}
                    <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--afx-faint)', marginTop: 6 }}>Live slate</div>
                    {r.projects.map((p) => <ProjectRowView key={p.id} p={p} />)}
```

This replaces the existing two lines (`<div>...Live slate</div>` + `{r.projects.map(...)}`) — keep them exactly as they are today, just add the new slate block immediately above.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Build**

Run: `npx next build`
Expected: build succeeds with no new errors or warnings attributable to `FunderMarket.tsx` or `funderMarketplace.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/components/afx/marketplace/FunderMarket.tsx
git commit -m "feat(afx): render slate portfolio cards on the funder marketplace

Adds SlateRowView, nested inside each producer row above any
standalone live projects — shows banded portfolio econ, risk-spread
rollup, distribution strategy, and an expandable member-project list."
```

---

## Manual verification (best-effort, no seed data)

There is no local seed/fixture data for `/afx/marketplace` (it reads live Supabase data, staff-gated) and this plan intentionally does not add a cockpit UI to create a `Slate` (see Global Constraints). Full end-to-end browser verification therefore requires either:
- a staff account with an existing producer that has `slates` manually inserted into `afx_producers.profile` via the Supabase dashboard, or
- a follow-on slice that adds the cockpit editor.

Compile-time correctness (`tsc --noEmit`, `next build`) plus the Task 1 unit assertions are the verification bar for this plan. If you have DB access and want a real browser check, insert a `slates: [...]` array (matching the `Slate` shape from Task 1) into an existing producer's `profile` JSON blob for a producer with ≥2 screenable live projects, reload `/afx/marketplace` as staff, expand that producer's row, and confirm the slate card renders above their standalone projects with no console errors.
