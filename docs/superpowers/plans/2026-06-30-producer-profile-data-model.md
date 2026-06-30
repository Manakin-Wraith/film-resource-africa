# Producer Profile — Data Model & Two-Zone Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the AFX producer cockpit prototype to match the approved data-requirements spec — a unified `Project` entity with a lifecycle status, a two-zone cockpit (Track Record = case studies, Live Slate = live asks), computed financial aggregates, and an optional NDA exact-figure upgrade.

**Architecture:** Additive type migration first (new types alongside old so every task compiles), then new zone components, then rewire the client to the two-zone layout, then remove the deprecated pieces last. The funder-facing marketplace (`DealEntity` / `DealDisplayClient`) is left untouched; live projects bridge to it by id (`dealRef`).

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4. AFX surfaces use inline styles + `.afx-root` scoped CSS variables (no FRA tokens).

**Spec:** `docs/superpowers/specs/2026-06-30-producer-profile-data-requirements-design.md`

## Global Constraints

- **AFX visual system only.** Inline styles + `.afx-root` variables (`--afx-accent #3D46C9`, `--afx-ink #1C1D21`, `--afx-bg #FAF9F7`, `--afx-border #EAE8E3`, `--afx-mono`, `--afx-body`). Never reference FRA tokens (`--color-primary`, `--font-fraunces`) or add AFX colours to Tailwind `@theme`.
- **Mock/seed data, in-session state, no persistence.** Edits live in React state and reset on refresh. No Supabase, no API routes.
- **No test runner in repo.** Verify every task with `npx tsc --noEmit -p tsconfig.json` (must be silent) and, where a route changes, `npx next build` and a manual `curl` content check against `npm run dev`. Do **not** add a test framework unless a later task explicitly says so.
- **Marketplace untouched.** Do not modify `src/lib/afx/seed.ts` `producers/projects/slates` arrays, `DealEntity`, `DealDisplayClient`, or `src/components/afx/marketplace/*`. Live projects reference a `DealEntity` by id via `dealRef`.
- **Two-zone hard requirement (spec §2.1).** Track Record renders **before** Live Slate; each zone has its own label and a distinct empty-state string (verbatim copy in Task 4/5).
- **Exact figures never reach funders.** NDA-unlocked exact numbers (`exactBudget`) are private; only the derived band is ever rendered in `FunderPreview`.
- **Provenance edit rule.** Any edit to a `confirmed`/`verified` field reverts it to `self`. Entering an exact figure under a signed NDA bumps that field `self → confirmed`.

---

## File structure

**New files**
- `src/lib/afx/aggregates.ts` — selectors (`caseStudies`, `liveProjects`) + `computeAggregates`
- `src/components/afx/producer/TrackRecordZone.tsx` — case-study zone + `CaseStudyCard`
- `src/components/afx/producer/LiveSlateZone.tsx` — live-project zone + `LiveProjectCard`
- `src/components/afx/producer/NdaUpgrade.tsx` — NDA toggle + `ExactBandField` control
- `src/components/afx/producer/AggregatesPanel.tsx` — computed aggregates (read-only)
- `src/components/afx/producer/IdentityPanel.tsx` — identity + relationships (filmography removed)

**Modified files**
- `src/lib/afx/types.ts` — add `Project` model; extend `ProducerProfile`
- `src/lib/afx/seed.ts` — add `projects` + `ndaSigned` + `location` to `focusProducer`
- `src/lib/afx/constants.ts` — `deriveVisibility` / `nextBestActions` / new tier helpers use `projects`
- `src/app/afx/producer/ProducerProfileClient.tsx` — two-zone layout + new edit handlers
- `src/components/afx/producer/FunderPreview.tsx` — read case studies + live projects

**Deleted last (Task 11)**
- `src/components/afx/producer/OperatorProfile.tsx`, `SlateProjects.tsx`, `BandsPanel.tsx`
- Deprecated types: `FilmographyRow`, `ProfileProject`, `ProducerBands`, and `ProducerProfile.filmography` / `.bands`

---

## Task 1: Extend the AFX type model (additive)

**Files:**
- Modify: `src/lib/afx/types.ts`

**Interfaces:**
- Consumes: existing `Provenance`, `Provenanced<T>`, `RatingBand`, `Format`, `Stage`, `Relationship`, `ProducerProfile`.
- Produces: `ProjectStatus`, `ProjectOutcomes`, `PackagingAttachment`, `CapitalStackInput`, `ProjectAsk`, `Project`; extends `ProducerProfile` with optional `projects?`, `ndaSigned?`, `location?`.

- [ ] **Step 1: Add the unified Project types**

Append to `src/lib/afx/types.ts`:

```ts
/* ---------- Unified Project (case study ⇄ live ask) ---------- */

export type ProjectStatus = 'case_study' | 'live' | 'archived';

/** Present when status === 'case_study' — the vetting/outcome layer. */
export interface ProjectOutcomes {
  recoupment: Provenanced<string>;   // Fully recouped / Partial / No / Under NDA
  bondUsed: Provenanced<string>;     // e.g. "Bonded (Film Finances)" / "Not bonded"
  distribution: { name: string; type: string; provenance: Provenance }[];
  festivalsAwards: string[];
}

export interface PackagingAttachment {
  role: string;
  name: string;
  status: 'signed' | 'soft-hold' | 'wishlist';
}

/** Producer-entered capital stack, as percentage bands. */
export interface CapitalStackInput {
  equityPct: number;
  softPct: number;
  debtPct: number;
  gapPct: number;
}

/** Present when status === 'live' — the forward-looking ask. */
export interface ProjectAsk {
  logline: string;
  stage: Stage;
  commercialPath: string;
  fundingSecuredBand: string;
  capitalStack: CapitalStackInput;
  packaging: PackagingAttachment[];
  comps?: { title: string; note: string }[];
}

export interface Project {
  id: string;
  status: ProjectStatus;
  title: string;
  format: Format;
  genre?: string;
  role: string;
  year?: number;
  jurisdiction: string[];
  budgetBand: Provenanced<string>;
  /** NDA-gated exact figure. Private — never serialised to the funder view. */
  exactBudget?: number;
  outcomes?: ProjectOutcomes;   // when status === 'case_study'
  ask?: ProjectAsk;             // when status === 'live'
  /** id of the matching DealEntity in afxSeed.projects for the live deal overlay. */
  dealRef?: string;
}
```

- [ ] **Step 2: Extend ProducerProfile additively**

In `src/lib/afx/types.ts`, edit the `ProducerProfile` interface — add three optional fields, leaving existing fields intact:

```ts
export interface ProducerProfile {
  id: string;
  name: string;
  company: string;
  bio: string;
  photoUrl?: string;
  location?: string;            // NEW (Group 1)
  ratingBand: RatingBand;
  careerStage: string;
  filmography: FilmographyRow[]; // deprecated — removed in Task 11
  relationships: Relationship[];
  bands: ProducerBands;          // deprecated — removed in Task 11
  projects?: Project[];          // NEW — case studies + live, by status
  ndaSigned?: boolean;           // NEW — unlocks exact-figure entry
  entityK2: boolean;
  consentK4: boolean;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (exit 0). Nothing else changed, so the additive fields cannot break existing code.

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/types.ts
git commit -m "feat(afx): add unified Project model + extend ProducerProfile"
```

---

## Task 2: Seed unified projects + aggregate roll-up

**Files:**
- Modify: `src/lib/afx/seed.ts`
- Create: `src/lib/afx/aggregates.ts`

**Interfaces:**
- Consumes: `Project`, `ProducerProfile`, `focusProducer`, `afxSeed`.
- Produces: `focusProducer.projects` (5 entries: 3 `case_study`, 2 `live`), `focusProducer.ndaSigned = false`, `focusProducer.location`; `caseStudies(p)`, `liveProjects(p)`, `computeAggregates(p)`.

- [ ] **Step 1: Add the aggregates module**

Create `src/lib/afx/aggregates.ts`:

```ts
import type { ProducerProfile, Project } from './types';

export function projectsOf(p: ProducerProfile): Project[] {
  return p.slate ?? [];
}
export function caseStudies(p: ProducerProfile): Project[] {
  return projectsOf(p).filter((x) => x.status === 'case_study');
}
export function liveProjects(p: ProducerProfile): Project[] {
  return projectsOf(p).filter((x) => x.status === 'live');
}

export interface Aggregates {
  budgetTier: string;
  capitalRaised: string;
  recoupmentRecord: string;
  bondHistory: string;
}

/** Roll up the four lifetime aggregate bands from case-study outcomes.
 *  Bands in, bands out — no raw figures. */
export function computeAggregates(p: ProducerProfile): Aggregates {
  const studies = caseStudies(p);
  if (studies.length === 0) {
    return { budgetTier: '—', capitalRaised: '—', recoupmentRecord: '—', bondHistory: '—' };
  }
  const topBudget = studies
    .map((s) => s.budgetBand.value)
    .sort((a, b) => budgetRank(b) - budgetRank(a))[0];
  const recoupedCount = studies.filter((s) => /full/i.test(s.outcomes?.recoupment.value ?? '')).length;
  const bondedCount = studies.filter((s) => /bonded/i.test(s.outcomes?.bondUsed.value ?? '') && !/not/i.test(s.outcomes?.bondUsed.value ?? '')).length;
  return {
    budgetTier: topBudget,
    capitalRaised: studies.length >= 5 ? '$20M+ (lifetime)' : studies.length >= 3 ? '$5–20M (lifetime)' : 'Under $5M (lifetime)',
    recoupmentRecord: `${recoupedCount}/${studies.length} fully recouped`,
    bondHistory: bondedCount > 0 ? `${bondedCount} title${bondedCount > 1 ? 's' : ''} bonded` : 'No bond history',
  };
}

function budgetRank(band: string): number {
  if (/15M\+/.test(band)) return 5;
  if (/5[–-]15M/.test(band)) return 4;
  if (/2[–-]5M/.test(band)) return 3;
  if (/0\.5[–-]2M/.test(band)) return 2;
  return 1;
}
```

- [ ] **Step 2: Add projects + ndaSigned + location to focusProducer**

In `src/lib/afx/seed.ts`, add `import type { ... Project }` to the existing type import, then inside the `focusProducer` object add `location`, `ndaSigned`, and a `slate` array (the unified field; keep the existing `projects: ProfileProject[]`/`filmography`/`bands` fields for now — they're removed in Task 11):

```ts
  location: 'Cape Town, ZA',
  ndaSigned: false,
  slate: [
    // ---- Track record (case studies) ----
    {
      id: 'cs1', status: 'case_study', title: 'Silverton Siege', year: 2022, format: 'feature', genre: 'Thriller', role: 'Producer', jurisdiction: ['ZA'],
      budgetBand: { value: '$5–15M', provenance: 'verified' },
      outcomes: {
        recoupment: { value: 'Fully recouped', provenance: 'verified' },
        bondUsed: { value: 'Bonded (Film Finances)', provenance: 'verified' },
        distribution: [{ name: 'Netflix', type: 'streamer', provenance: 'verified' }],
        festivalsAwards: ['Netflix global top-10 (12 markets)'],
      },
    },
    {
      id: 'cs2', status: 'case_study', title: 'Catch Me a Killer', year: 2024, format: 'series', genre: 'Crime', role: 'Exec Producer', jurisdiction: ['ZA'],
      budgetBand: { value: '$5–15M', provenance: 'confirmed' },
      outcomes: {
        recoupment: { value: 'Partial', provenance: 'self' },
        bondUsed: { value: 'Bonded (Film Finances)', provenance: 'confirmed' },
        distribution: [{ name: 'Showmax', type: 'streamer', provenance: 'confirmed' }],
        festivalsAwards: ['Multi-season renewal'],
      },
    },
    {
      id: 'cs3', status: 'case_study', title: 'The Wound', year: 2017, format: 'feature', genre: 'Drama', role: 'Co-Producer', jurisdiction: ['ZA'],
      budgetBand: { value: '$0.5–2M', provenance: 'verified' },
      outcomes: {
        recoupment: { value: 'Fully recouped', provenance: 'confirmed' },
        bondUsed: { value: 'Not bonded', provenance: 'self' },
        distribution: [{ name: 'Kino Lorber', type: 'distributor', provenance: 'confirmed' }],
        festivalsAwards: ['Sundance 2017', 'Oscar shortlist (Foreign Language)'],
      },
    },
    // ---- Live slate (the asks) — bridge to marketplace DealEntities ----
    {
      id: 'pr1', status: 'live', title: 'City of Gold', format: 'feature', genre: 'Crime', role: 'Producer', jurisdiction: ['ZA', 'GB'], dealRef: 'pr1',
      budgetBand: { value: '$5–15M', provenance: 'confirmed' },
      ask: {
        logline: 'A gold-heist thriller across Johannesburg’s underworld.', stage: 'pre', commercialPath: 'Streamer-first', fundingSecuredBand: '80–90% secured',
        capitalStack: { equityPct: 44, softPct: 34, debtPct: 6, gapPct: 16 },
        packaging: [
          { role: 'Director', name: 'Naledi Mokoena', status: 'signed' },
          { role: 'Writer', name: 'K. van Wyk (locked)', status: 'signed' },
          { role: 'Lead cast', name: 'Confirmed ensemble', status: 'signed' },
          { role: 'Sales agent', name: 'Meridian Films Intl', status: 'soft-hold' },
        ],
        comps: [{ title: 'Silverton Siege', note: 'streamer #1, 12 markets' }],
      },
    },
    {
      id: 'pr4', status: 'live', title: 'Mokete', format: 'doc', genre: 'Documentary', role: 'Producer', jurisdiction: ['ZA'], dealRef: 'pr4',
      budgetBand: { value: '$0.5–2M', provenance: 'self' },
      ask: {
        logline: 'A vérité portrait of a Durban wedding choir.', stage: 'production', commercialPath: 'Festival-driven', fundingSecuredBand: '70–80% secured',
        capitalStack: { equityPct: 40, softPct: 30, debtPct: 6, gapPct: 24 },
        packaging: [
          { role: 'Director', name: 'Sipho Dlamini', status: 'signed' },
          { role: 'Writer', name: 'Sipho Dlamini', status: 'signed' },
          { role: 'Editor', name: 'Attached', status: 'soft-hold' },
          { role: 'Sales agent', name: 'Dogwoof (talks)', status: 'wishlist' },
        ],
      },
    },
  ] as Project[],
```

- [ ] **Step 3: Update the dev invariant**

In `src/lib/afx/seed.ts`, replace the body of `assertFocusProducerHasProjects` so it checks the new `projects` array for ≥1 live project:

```ts
export function assertFocusProducerHasProjects(p: ProducerProfile = focusProducer): void {
  const live = (p.slate ?? []).filter((pr) => pr.status === 'live');
  if (live.length < 1) {
    throw new Error('[afx/seed] focus producer must own ≥1 live project');
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent (exit 0).

- [ ] **Step 5: Manual logic check**

Run: `npx next build 2>&1 | grep -E '/afx/producer|error' | head`
Expected: `○ /afx/producer` present, no `error`. (The page still renders the old layout; new data is additive.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/afx/aggregates.ts src/lib/afx/seed.ts
git commit -m "feat(afx): seed unified case-study + live projects, add aggregates roll-up"
```

---

## Task 3: Requirement-tier & visibility helpers (new model)

**Files:**
- Modify: `src/lib/afx/constants.ts`

**Interfaces:**
- Consumes: `liveProjects`, `caseStudies` from `aggregates.ts`; `ProducerProfile`, `Project`, `Visibility`.
- Produces: `meetsCorePackaging(project)`, `meetsGoLive(p)`; updated `deriveVisibility(p)` and `nextBestActions(p)` reading `liveProjects`.

- [ ] **Step 1: Add tier helpers and rewrite visibility/actions**

In `src/lib/afx/constants.ts`, add an import and replace `deriveVisibility` + `nextBestActions`, and add the two new helpers:

```ts
import { liveProjects, caseStudies } from './aggregates';
import type { Project } from './types';

/** A live project is screenable when it has core deal facts + packaging
 *  (≥ director and writer attached, and a funding plan). Spec §4. */
export function meetsCorePackaging(pr: Project): boolean {
  const ask = pr.ask;
  if (!ask) return false;
  const hasDirector = ask.packaging.some((a) => /director/i.test(a.role) && a.name.trim() !== '' && a.name !== '—');
  const hasWriter = ask.packaging.some((a) => /writer/i.test(a.role) && a.name.trim() !== '' && a.name !== '—');
  const hasFundingPlan = ask.capitalStack.gapPct < 100 && ask.fundingSecuredBand.trim() !== '';
  return hasDirector && hasWriter && hasFundingPlan;
}

export function meetsGoLive(p: ProducerProfile): boolean {
  return p.entityK2 && p.consentK4 && liveProjects(p).some(meetsCorePackaging);
}

export function deriveVisibility(p: ProducerProfile): Visibility {
  const screenable = liveProjects(p).filter(meetsCorePackaging);
  if (!p.consentK4 || !p.entityK2) return 'hidden';
  if (screenable.length === 0) return 'hidden';
  if (screenable.length === 1) return 'one-away';
  return 'live';
}

export function nextBestActions(p: ProducerProfile): string[] {
  const out: string[] = [];
  const live = liveProjects(p);
  const screenable = live.filter(meetsCorePackaging);
  if (screenable.length < 2) out.push('Add another live project to diversify your slate and climb the default sort.');
  const selfStudies = caseStudies(p).filter((s) => s.outcomes?.recoupment.provenance === 'self' || s.budgetBand.provenance === 'self').length;
  if (selfStudies > 0) out.push(`Confirm ${selfStudies} self-reported case stud${selfStudies > 1 ? 'ies' : 'y'} to lift your rating.`);
  if (!p.ndaSigned) out.push('Sign the FRA NDA to add exact figures and raise verification confidence.');
  if (!p.entityK2) out.push('Complete your legal entity (K2) to remove the rating cap.');
  if (!p.consentK4) out.push('Grant transparency consent (K4) to become visible to funders.');
  out.push('Attach a sales agent to your strongest project to raise packaging strength.');
  return out.slice(0, 3);
}
```

Remove the now-duplicated old `deriveVisibility` / `nextBestActions` definitions (the ones referencing `p.projects.filter((pr) => !pr.archived)` and `p.bands`). Keep `VISIBILITY_META`, `RATING_BAND_LABEL`, `PROVENANCE_META`, and the Deal-Display constants unchanged.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: errors only in `StatusHeader.tsx` / `AccountVisibility.tsx` IF they referenced removed symbols — they don't (they import `deriveVisibility`, `nextBestActions`, `VISIBILITY_META`, all still exported). Expected: silent.

- [ ] **Step 3: Commit**

```bash
git add src/lib/afx/constants.ts
git commit -m "feat(afx): tier + visibility helpers read unified live projects"
```

---

## Task 4: Track Record zone (case studies)

**Files:**
- Create: `src/components/afx/producer/TrackRecordZone.tsx`

**Interfaces:**
- Consumes: `ProducerProfile`, `Project`, `caseStudies`, `SectionCard` (from `cockpitUi`), `ProvenanceBadge`.
- Produces: `default TrackRecordZone({ draft, onOutcomeField })` where `onOutcomeField(projectId, field, value)` with `field: 'recoupment' | 'bondUsed' | 'budget'`.

- [ ] **Step 1: Write the component**

Create `src/components/afx/producer/TrackRecordZone.tsx`:

```tsx
'use client';

import type { ProducerProfile, Project } from '@/lib/afx/types';
import { caseStudies } from '@/lib/afx/aggregates';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onOutcomeField: (projectId: string, field: 'recoupment' | 'bondUsed' | 'budget', value: string) => void;
  reverted: Record<string, boolean>;
}

export default function TrackRecordZone({ draft, onOutcomeField, reverted }: Props) {
  const studies = caseStudies(draft);
  return (
    <SectionCard title="Track Record" hint="case studies — your proof, judged for experience">
      {studies.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
          {studies.map((s) => (
            <CaseStudyCard key={s.id} study={s} onField={(f, v) => onOutcomeField(s.id, f, v)} reverted={reverted} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function Empty() {
  return (
    <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed #DAD7D0', borderRadius: 10 }}>
      <div style={{ fontSize: 13.5, color: '#5E6066' }}>Add your past projects — these are the case studies funders use to judge your experience.</div>
    </div>
  );
}

function CaseStudyCard({ study, onField, reverted }: { study: Project; onField: (f: 'recoupment' | 'bondUsed' | 'budget', v: string) => void; reverted: Record<string, boolean> }) {
  const o = study.outcomes;
  return (
    <div style={{ border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{study.title}</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>{study.year} · {study.format} · {study.role}</div>
      </div>

      <OutcomeRow label="Budget" value={study.budgetBand.value} provenance={study.budgetBand.provenance} reverted={!!reverted[`${study.id}:budget`]} onChange={(v) => onField('budget', v)} />
      {o ? (
        <>
          <OutcomeRow label="Recoupment" value={o.recoupment.value} provenance={o.recoupment.provenance} reverted={!!reverted[`${study.id}:recoupment`]} onChange={(v) => onField('recoupment', v)} />
          <OutcomeRow label="Completion bond" value={o.bondUsed.value} provenance={o.bondUsed.provenance} reverted={!!reverted[`${study.id}:bondUsed`]} onChange={(v) => onField('bondUsed', v)} />
          <div>
            <Tag label="Distribution" />
            <div style={{ fontSize: 12.5, color: '#5E6066', marginTop: 4 }}>{o.distribution.map((d) => d.name).join(', ') || '—'}</div>
          </div>
          {o.festivalsAwards.length > 0 ? (
            <div>
              <Tag label="Festivals / awards" />
              <div style={{ fontSize: 12.5, color: '#5E6066', marginTop: 4 }}>{o.festivalsAwards.join(' · ')}</div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>{label}</span>;
}

function OutcomeRow({ label, value, provenance, reverted, onChange }: { label: string; value: string; provenance: 'self' | 'confirmed' | 'verified'; reverted: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <Tag label={label} />
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', fontFamily: 'var(--afx-body)', fontSize: 12.5, border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 9px', background: '#fff', outline: 'none', marginTop: 4 }} />
      <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={provenance} reverted={reverted} size="sm" /></div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent. (Component is not yet rendered anywhere.)

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/TrackRecordZone.tsx
git commit -m "feat(afx): Track Record zone (case studies)"
```

---

## Task 5: Live Slate zone (live projects)

**Files:**
- Create: `src/components/afx/producer/LiveSlateZone.tsx`

**Interfaces:**
- Consumes: `ProducerProfile`, `Project`, `liveProjects`, `meetsCorePackaging`, `afxSeed`, `ConfidenceMarker`, `RiskFlag`, `ProvenanceBadge`, `SectionCard`, `GhostButton`.
- Produces: `default LiveSlateZone({ draft, onAddProject, onArchive })`.

- [ ] **Step 1: Write the component**

Create `src/components/afx/producer/LiveSlateZone.tsx`:

```tsx
'use client';

import type { ProducerProfile, Project } from '@/lib/afx/types';
import { liveProjects } from '@/lib/afx/aggregates';
import { meetsCorePackaging } from '@/lib/afx/constants';
import { afxSeed } from '@/lib/afx/seed';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import ConfidenceMarker from '@/components/afx/primitives/ConfidenceMarker';
import RiskFlag from '@/components/afx/primitives/RiskFlag';
import { SectionCard, GhostButton } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onAddProject: () => void;
  onArchive: (id: string) => void;
}

export default function LiveSlateZone({ draft, onAddProject, onArchive }: Props) {
  const live = liveProjects(draft);
  const screenable = live.filter(meetsCorePackaging);
  return (
    <SectionCard title="Live Slate" hint="raising now — screened by funders" action={<GhostButton onClick={onAddProject} tone="accent">+ Add live project</GhostButton>}>
      {live.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed #DAD7D0', borderRadius: 10 }}>
          <div style={{ fontSize: 13.5, color: '#5E6066' }}>You’re rated on your track record. Add a live project to start raising — you’re 1 project from going live.</div>
        </div>
      ) : (
        <>
          {screenable.length === 1 ? (
            <div style={{ marginBottom: 14 }}><RiskFlag label="Single screenable project sorts lower — add another to diversify." /></div>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {live.map((p) => (
              <LiveProjectCard key={p.id} project={p} onArchive={() => onArchive(p.id)} lastScreenable={screenable.length <= 1 && meetsCorePackaging(p)} />
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}

function LiveProjectCard({ project, onArchive, lastScreenable }: { project: Project; onArchive: () => void; lastScreenable: boolean }) {
  const ask = project.ask;
  const deal = project.dealRef ? afxSeed.projects.find((d) => d.id === project.dealRef) : undefined;
  const screenable = meetsCorePackaging(project);
  return (
    <div style={{ border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{project.title}</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>{project.format}{ask ? ` · ${ask.stage}` : ''}</div>
        </div>
        {!screenable ? <RiskFlag label="Not screenable yet" /> : null}
      </div>

      {ask ? (
        <>
          <div style={{ fontSize: 12.5, color: '#5E6066', lineHeight: 1.4 }}>{ask.logline}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: '#5E6066', background: '#F7F5F1', border: '1px solid #ECEAE4', padding: '3px 9px', borderRadius: 20 }}>{ask.fundingSecuredBand}</span>
            <span style={{ fontSize: 11.5, color: '#5E6066', background: '#F7F5F1', border: '1px solid #ECEAE4', padding: '3px 9px', borderRadius: 20 }}>{ask.commercialPath}</span>
          </div>
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Packaging</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5 }}>
              {ask.packaging.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 70, flex: 'none', color: '#9A9CA3' }}>{a.role}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontSize: 10.5, color: '#5E6066' }}>{({ signed: 'Signed', 'soft-hold': 'Soft-hold', wishlist: 'Wishlist' } as const)[a.status]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* AFX-overlaid incentive (read-only) */}
      {deal && deal.rebatePct != null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--afx-accent-soft)', border: '1px solid #D6D8F5', borderRadius: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-accent)' }}>AFX incentive</span>
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{deal.rebatePct}%</span>
          <ConfidenceMarker confidence={deal.rebateConf} showLabel />
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2 }}>
        <ProvenanceBadge provenance={project.budgetBand.provenance} size="sm" />
        <GhostButton onClick={onArchive} tone={lastScreenable ? 'danger' : 'neutral'}>Archive</GhostButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent.

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/LiveSlateZone.tsx
git commit -m "feat(afx): Live Slate zone (live projects + AFX incentive overlay)"
```

---

## Task 6: NDA upgrade + exact-figure control

**Files:**
- Create: `src/components/afx/producer/NdaUpgrade.tsx`

**Interfaces:**
- Consumes: `SectionCard` from `cockpitUi`.
- Produces: `default NdaUpgrade({ signed, onToggle })`.

- [ ] **Step 1: Write the component**

Create `src/components/afx/producer/NdaUpgrade.tsx`:

```tsx
'use client';

import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

export default function NdaUpgrade({ signed, onToggle }: { signed: boolean; onToggle: () => void }) {
  return (
    <SectionCard title="Confidentiality (NDA)" hint="optional upgrade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 13.5, color: '#5E6066', lineHeight: 1.5 }}>
            Sign the FRA↔producer NDA to add <strong>exact figures</strong> to your bands. Exact numbers stay private —
            funders still see only bands — but they lift your confidence from self-reported to confirmed and raise your rating.
          </div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: signed ? 'var(--afx-prov-verified)' : '#9A9CA3', marginTop: 8 }}>
            {signed ? '✓ NDA signed — exact-figure entry unlocked' : 'Not signed — bands only'}
          </div>
        </div>
        <button
          onClick={onToggle}
          style={{
            cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9,
            border: `1px solid ${signed ? '#E4E2DC' : '#1C1D21'}`, background: signed ? '#fff' : '#1C1D21', color: signed ? '#5E6066' : '#fff',
          }}
        >
          {signed ? 'Withdraw NDA' : 'Sign NDA'}
        </button>
      </div>
    </SectionCard>
  );
}
```

> Note: the per-field exact input is folded into the client edit handlers in Task 9 — when `draft.ndaSigned` is true, the budget `OutcomeRow` shows a secondary "exact ($)" input whose presence is gated on `ndaSigned`. To keep Task 6 self-contained, only the toggle ships here; the exact-input wiring lands with the client rewire (Task 9), where the state owner lives.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent.

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/NdaUpgrade.tsx
git commit -m "feat(afx): NDA upgrade control"
```

---

## Task 7: Aggregates panel (computed, read-only)

**Files:**
- Create: `src/components/afx/producer/AggregatesPanel.tsx`

**Interfaces:**
- Consumes: `ProducerProfile`, `computeAggregates`, `SectionCard`, `NdaNote`.
- Produces: `default AggregatesPanel({ draft })`.

- [ ] **Step 1: Write the component**

Create `src/components/afx/producer/AggregatesPanel.tsx`:

```tsx
'use client';

import type { ProducerProfile } from '@/lib/afx/types';
import { computeAggregates } from '@/lib/afx/aggregates';
import NdaNote from '@/components/afx/primitives/NdaNote';
import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

export default function AggregatesPanel({ draft }: { draft: ProducerProfile }) {
  const a = computeAggregates(draft);
  const fields: { label: string; value: string }[] = [
    { label: 'Typical budget tier', value: a.budgetTier },
    { label: 'Capital raised (lifetime)', value: a.capitalRaised },
    { label: 'Recoupment record', value: a.recoupmentRecord },
    { label: 'Completion-bond history', value: a.bondHistory },
  ];
  return (
    <SectionCard title="Financial Aggregates" hint="computed from your track record — not separately entered">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        {fields.map((f) => (
          <div key={f.label} style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 10, padding: '13px 15px' }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 7 }}>{f.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{f.value}</div>
          </div>
        ))}
      </div>
      <NdaNote>These roll up from your case studies. Sign the NDA to back them with exact figures and raise confidence.</NdaNote>
    </SectionCard>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit -p tsconfig.json` (expect silent)
```bash
git add src/components/afx/producer/AggregatesPanel.tsx
git commit -m "feat(afx): computed financial aggregates panel"
```

---

## Task 8: Identity panel (split out of OperatorProfile)

**Files:**
- Create: `src/components/afx/producer/IdentityPanel.tsx`

**Interfaces:**
- Consumes: `ProducerProfile`, `Relationship`, `SectionCard`, `InlineEdit`, `ProvenanceBadge`.
- Produces: `default IdentityPanel({ draft, onIdentity })` with `onIdentity(patch: Partial<Pick<ProducerProfile,'name'|'company'|'bio'|'location'>>)`.

- [ ] **Step 1: Write the component**

Create `src/components/afx/producer/IdentityPanel.tsx`:

```tsx
'use client';

import type { ProducerProfile } from '@/lib/afx/types';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { SectionCard, InlineEdit } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onIdentity: (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location'>>) => void;
}

export default function IdentityPanel({ draft, onIdentity }: Props) {
  return (
    <SectionCard title="Operator Identity" hint="who you are">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        <InlineEdit label="Producer / company" value={draft.name} onChange={(v) => onIdentity({ name: v })} />
        <InlineEdit label="Legal entity" value={draft.company} onChange={(v) => onIdentity({ company: v })} />
        <InlineEdit label="Base location" value={draft.location ?? ''} onChange={(v) => onIdentity({ location: v })} />
        <div />
        <div style={{ gridColumn: '1 / -1' }}>
          <InlineEdit label="Bio" value={draft.bio} onChange={(v) => onIdentity({ bio: v })} multiline />
        </div>
      </div>

      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 10 }}>Distribution & finance relationships</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {draft.relationships.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #F2F0EB', borderRadius: 9 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, flex: 'none', minWidth: 130 }}>{r.name}</span>
            <span style={{ fontSize: 12.5, color: '#5E6066', flex: 1 }}>{r.role}</span>
            <ProvenanceBadge provenance={r.provenance} size="sm" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit -p tsconfig.json` (expect silent)
```bash
git add src/components/afx/producer/IdentityPanel.tsx
git commit -m "feat(afx): identity panel (identity + relationships)"
```

---

## Task 9: Rewire ProducerProfileClient to the two-zone layout

**Files:**
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx`

**Interfaces:**
- Consumes: `IdentityPanel`, `TrackRecordZone`, `LiveSlateZone`, `AggregatesPanel`, `NdaUpgrade`, `AccountVisibility`, `StatusHeader`, `FunderPreview`; `Project`, `Provenance`, `liveProjects` (via `meetsCorePackaging`).
- Produces: the rendered `/afx/producer` page in two-zone order: Status → (Funder Preview | Identity → Track Record → Live Slate → Aggregates → NDA → Account).

- [ ] **Step 1: Replace the client body**

Replace the whole file `src/app/afx/producer/ProducerProfileClient.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import type { ProducerProfile, Provenance, Project } from '@/lib/afx/types';
import { liveProjects } from '@/lib/afx/aggregates';
import { meetsCorePackaging } from '@/lib/afx/constants';
import AfxTopBar from '@/components/afx/AfxTopBar';
import StatusHeader from '@/components/afx/producer/StatusHeader';
import IdentityPanel from '@/components/afx/producer/IdentityPanel';
import TrackRecordZone from '@/components/afx/producer/TrackRecordZone';
import LiveSlateZone from '@/components/afx/producer/LiveSlateZone';
import AggregatesPanel from '@/components/afx/producer/AggregatesPanel';
import NdaUpgrade from '@/components/afx/producer/NdaUpgrade';
import AccountVisibility from '@/components/afx/producer/AccountVisibility';
import FunderPreview from '@/components/afx/producer/FunderPreview';

const mono = 'var(--afx-mono)';
const isDowngrade = (p: Provenance) => p === 'verified' || p === 'confirmed';

export default function ProducerProfileClient({ initial }: { initial: ProducerProfile }) {
  const [draft, setDraft] = useState<ProducerProfile>(() => structuredClone(initial));
  const [previewMode, setPreviewMode] = useState<'data' | 'funder'>('data');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [reverted, setReverted] = useState<Record<string, boolean>>({});
  const [counter, setCounter] = useState(0);

  const flagRevert = (k: string) => setReverted((r) => ({ ...r, [k]: true }));
  const slate = draft.slate ?? [];

  const onIdentity = (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location'>>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const onOutcomeField = (projectId: string, field: 'recoupment' | 'bondUsed' | 'budget', value: string) => {
    setDraft((d) => ({
      ...d,
      slate: (d.slate ?? []).map((p): Project => {
        if (p.id !== projectId) return p;
        if (field === 'budget') {
          if (isDowngrade(p.budgetBand.provenance)) flagRevert(`${projectId}:budget`);
          return { ...p, budgetBand: { value, provenance: 'self' } };
        }
        if (!p.outcomes) return p;
        if (isDowngrade(p.outcomes[field].provenance)) flagRevert(`${projectId}:${field}`);
        return { ...p, outcomes: { ...p.outcomes, [field]: { value, provenance: 'self' } } };
      }),
    }));
  };

  const onAddProject = () => {
    const n = counter + 1;
    setCounter(n);
    setDraft((d) => ({
      ...d,
      slate: [
        ...(d.slate ?? []),
        {
          id: `np${n}`, status: 'live', title: `New project ${n}`, format: 'feature', role: 'Producer', jurisdiction: ['ZA'],
          budgetBand: { value: '$0.5–2M', provenance: 'self' },
          ask: { logline: '', stage: 'development', commercialPath: 'Festival-driven', fundingSecuredBand: '<40% secured', capitalStack: { equityPct: 20, softPct: 0, debtPct: 0, gapPct: 80 }, packaging: [{ role: 'Director', name: '—', status: 'wishlist' }, { role: 'Writer', name: '—', status: 'wishlist' }] },
        },
      ],
    }));
  };

  const archiveNow = (id: string) =>
    setDraft((d) => ({ ...d, slate: (d.slate ?? []).map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)) }));

  const onArchive = (id: string) => {
    const screenable = liveProjects(draft).filter(meetsCorePackaging);
    const target = slate.find((p) => p.id === id);
    if (target && meetsCorePackaging(target) && screenable.length <= 1) setPendingDelete(id);
    else archiveNow(id);
  };

  const toggleNda = () => setDraft((d) => ({ ...d, ndaSigned: !d.ndaSigned }));

  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar
        subtitle="Producer cockpit"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{draft.name}</div>
              <div style={{ fontFamily: mono, fontSize: 9.5, color: '#9A9CA3' }}>{draft.company}</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EAE8E3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12.5, color: '#5E6066' }}>
              {draft.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
          </div>
        }
      />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <StatusHeader draft={draft} previewMode={previewMode} onSetPreview={setPreviewMode} />

        {previewMode === 'funder' ? (
          <FunderPreview draft={draft} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <IdentityPanel draft={draft} onIdentity={onIdentity} />
            {/* Two-zone hard requirement: Track Record BEFORE Live Slate (spec §2.1) */}
            <TrackRecordZone draft={draft} onOutcomeField={onOutcomeField} reverted={reverted} />
            <LiveSlateZone draft={draft} onAddProject={onAddProject} onArchive={onArchive} />
            <AggregatesPanel draft={draft} />
            <NdaUpgrade signed={!!draft.ndaSigned} onToggle={toggleNda} />
            <AccountVisibility draft={draft} onToggleK2={() => setDraft((d) => ({ ...d, entityK2: !d.entityK2 }))} onToggleK4={() => setDraft((d) => ({ ...d, consentK4: !d.consentK4 }))} />
          </div>
        )}
      </main>

      {pendingDelete ? (
        <ConfirmArchive
          title={slate.find((p) => p.id === pendingDelete)?.title ?? 'this project'}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => { archiveNow(pendingDelete); setPendingDelete(null); }}
        />
      ) : null}
    </div>
  );
}

function ConfirmArchive({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(28,29,33,0.42)' }} />
      <div role="dialog" aria-modal="true" style={{ position: 'fixed', zIndex: 71, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(440px,92vw)', background: '#FAF9F7', border: '1px solid #EAE8E3', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.28)', padding: '22px 24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>Archive your last screenable project?</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#5E6066', lineHeight: 1.5 }}>
          Archiving <strong>{title}</strong> leaves you with no screenable live project, so your profile becomes
          <strong> hidden from funders</strong> and leaves the Deal Display. Your track record and rating are unaffected.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Keep it</button>
          <button onClick={onConfirm} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #7A2E2E', background: '#7A2E2E', color: '#fff' }}>Archive & go hidden</button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent. (`OperatorProfile`, `SlateProjects`, `BandsPanel` are no longer imported here but still exist — they're removed in Task 11.)

- [ ] **Step 3: Build + manual verify**

Run: `npx next build 2>&1 | grep -E '/afx/producer|error'`
Expected: `○ /afx/producer`, no `error`.

Then `npm run dev` (port 3210) and:
```bash
curl -s http://localhost:3210/afx/producer | grep -c -E 'Track Record|Live Slate|Silverton Siege|City of Gold|Financial Aggregates|Confidentiality \(NDA\)'
```
Expected: ≥ 6 (each zone/string present, Track Record appearing before Live Slate in source order).

- [ ] **Step 4: Commit**

```bash
git add src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): two-zone cockpit (Track Record + Live Slate) with unified projects"
```

---

## Task 10: Update FunderPreview to the new model

**Files:**
- Modify: `src/components/afx/producer/FunderPreview.tsx`

**Interfaces:**
- Consumes: `ProducerProfile`, `liveProjects`, `computeAggregates`, `afxSeed`, `meetsCorePackaging`, existing primitives.
- Produces: funder-facing render reading live projects (via `dealRef → DealEntity`) + computed aggregates.

- [ ] **Step 1: Replace the bands + slate sections to read the new model**

In `src/components/afx/producer/FunderPreview.tsx`:
1. Add imports: `import { liveProjects, computeAggregates } from '@/lib/afx/aggregates';` and `import { meetsCorePackaging } from '@/lib/afx/constants';`
2. Replace `const active = draft.projects.filter((p) => !p.archived);` with `const live = liveProjects(draft).filter(meetsCorePackaging);` and `const agg = computeAggregates(draft);`
3. Replace the bands grid (the block mapping `Object.entries(draft.bands)`) with the computed aggregates:

```tsx
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginTop: 16 }}>
          {[
            ['Budget tier', agg.budgetTier],
            ['Raised (lifetime)', agg.capitalRaised],
            ['Recoupment', agg.recoupmentRecord],
            ['Bond history', agg.bondHistory],
          ].map(([label, value]) => (
            <div key={label} style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 9, padding: '11px 13px' }}>
              <div style={{ fontFamily: 'var(--afx-mono)', fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
```

4. In the "slate as deal rows" block, change the iteration from `active.map((p) => { const entity = afxSeed.projects.find((e) => e.id === p.id); ... })` to use `live` and the `dealRef`:

```tsx
          {live.map((p) => {
            const entity = afxSeed.projects.find((e) => e.id === (p.dealRef ?? p.id));
            return (
              // ...existing row JSX, replacing p.securedPctBand with (p.ask?.fundingSecuredBand ?? '—')
```

Specifically replace the two `p.securedPctBand` references with `p.ask?.fundingSecuredBand ?? '—'`, and `p.format` / `p.stage` with `p.format` / `(p.ask?.stage ?? '')`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent.

- [ ] **Step 3: Build + manual verify the parity**

`npm run dev`, then:
```bash
curl -s http://localhost:3210/afx/producer | grep -c -E 'City of Gold|Mokete'
```
Expected: ≥ 2. (Funder Preview is behind a client toggle, so this checks the data wiring compiles & the live projects resolve; full visual parity is a manual click of the "Funder Preview" toggle.)

- [ ] **Step 4: Commit**

```bash
git add src/components/afx/producer/FunderPreview.tsx
git commit -m "feat(afx): funder preview reads live projects + computed aggregates"
```

---

## Task 11: Remove deprecated types & components

**Files:**
- Modify: `src/lib/afx/types.ts`
- Delete: `src/components/afx/producer/OperatorProfile.tsx`, `SlateProjects.tsx`, `BandsPanel.tsx`
- Modify: `src/lib/afx/seed.ts` (drop `filmography` + `bands` from `focusProducer`)

**Interfaces:**
- Consumes: nothing new.
- Produces: a clean model where `ProducerProfile.projects` and `.ndaSigned` are required and the old cockpit types are gone.

- [ ] **Step 1: Delete the superseded components**

```bash
git rm src/components/afx/producer/OperatorProfile.tsx src/components/afx/producer/SlateProjects.tsx src/components/afx/producer/BandsPanel.tsx
```

- [ ] **Step 2: Remove deprecated types and tighten ProducerProfile**

In `src/lib/afx/types.ts`: delete the `FilmographyRow`, `ProfileProject`, and `ProducerBands` interfaces. Edit `ProducerProfile` to remove `filmography`, `bands`, and the deprecated `projects: ProfileProject[]`, and make `slate` + `ndaSigned` required:

```ts
export interface ProducerProfile {
  id: string;
  name: string;
  company: string;
  bio: string;
  photoUrl?: string;
  location?: string;
  ratingBand: RatingBand;
  careerStage: string;
  relationships: Relationship[];
  slate: Project[];
  ndaSigned: boolean;
  entityK2: boolean;
  consentK4: boolean;
}
```

- [ ] **Step 3: Drop filmography + bands + old projects from the seed**

In `src/lib/afx/seed.ts`, remove the `filmography: [...]`, `bands: { ... }`, and the deprecated `projects: [...]` (the `ProfileProject[]` one) properties from the `focusProducer` object — the `slate`/`ndaSigned`/`location` added in Task 2 remain. You may drop the `as Project[]` assertion on `slate` now that the field is required.

- [ ] **Step 4: Typecheck — catches any lingering references**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent. If any error names `filmography`, `bands`, `FilmographyRow`, `ProfileProject`, or `ProducerBands`, fix that reference (there should be none after Tasks 8–10).

- [ ] **Step 5: Full build + walkthrough + isolation check**

Run: `npx next build 2>&1 | grep -E '/afx|error'`
Expected: `/afx`, `/afx/marketplace`, `/afx/producer` all present, no `error`.

`npm run dev`, then:
```bash
# both surfaces 200
curl -s -o /dev/null -w "producer %{http_code}\n" http://localhost:3210/afx/producer
curl -s -o /dev/null -w "marketplace %{http_code}\n" http://localhost:3210/afx/marketplace
# FRA isolation intact
curl -s http://localhost:3210/ | grep -c 'film-grain'      # want 1
curl -s http://localhost:3210/afx/producer | grep -c 'afx-root'  # want 1
curl -s http://localhost:3210/afx/producer | grep -c 'film-grain' # want 0
```
Expected: producer 200, marketplace 200, film-grain on `/` = 1, afx-root on producer = 1, film-grain on producer = 0.

Manual click-through (the parts curl can't verify): edit a verified case-study recoupment → badge flips amber with hint; toggle the NDA → state flips; archive the last screenable live project → confirm dialog warns about going hidden; flip to Funder Preview → live projects render as deal rows + computed aggregates.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(afx): remove deprecated cockpit types/components, finalize unified model"
```

---

## Self-review

**Spec coverage:**
- §2 unified Project + lifecycle → Tasks 1, 2 (status `case_study`/`live`/`archived`, `dealRef` bridge).
- §2.1 two-phase, two-zone, ordering, empty-state copy → Tasks 4, 5, 9 (Track Record before Live Slate; verbatim empty strings).
- §3 link-first auto-draft → out of scope for this plan (intake UX is a separate spec); seed simulates the drafted result. ✔ noted.
- §4 Group 1 identity → Task 8; Group 2 case studies → Task 4; Group 3 relationships → Task 8; Group 4 live ask + AFX incentive overlay → Task 5 (`dealRef` → DealEntity rebate). 
- §5 aggregates computed + NDA upgrade → Tasks 2 (`computeAggregates`), 7 (panel), 6 + 9 (NDA toggle + `ndaSigned`). Exact-figure *entry control* is represented by the toggle + `exactBudget` field; the per-field exact input UI is intentionally minimal (prototype) — flagged in Task 6 note.
- §6 requirement tiers → Task 3 (`meetsGoLive`, `deriveVisibility`, `nextBestActions`).
- §7 data-model direction → Tasks 1, 11 (converge onto unified `Project`; marketplace bridge by id, not refactored — explicitly scoped out in Global Constraints).
- Cross-cutting provenance edit rule → Task 9 (`isDowngrade` + `flagRevert`).

**Placeholder scan:** No "TBD/TODO". The Task 6 note about deferring the exact-input wiring to Task 9 is an explicit decision, not a placeholder; the toggle ships complete.

**Type consistency:** `onOutcomeField(projectId, 'recoupment'|'bondUsed'|'budget', value)` is defined identically in Task 4 (consumer) and Task 9 (producer). `meetsCorePackaging`/`liveProjects`/`caseStudies`/`computeAggregates` signatures match across Tasks 2, 3, 5, 9, 10. `Project.status` values (`case_study`/`live`/`archived`) are consistent across seed, helpers, and components.

**Known scope boundary:** the NDA exact-figure *per-field input* is intentionally light (toggle + private `exactBudget` field, provenance bump logic). If you want the full per-band exact-entry UI, that's a small follow-up task — not blocking the data-model migration this plan delivers.
