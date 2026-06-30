# AFX Funder-View Hardening (`toFunderView`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "exact figures never reach funders" invariant **enforced by construction** — `FunderPreview` receives a typed `FunderView` projection with every `Project.exact` stripped at runtime, so a future careless `JSON.stringify(draft)`, spread, analytics call, or `.exact` read in the funder surface cannot leak private NDA figures.

**Architecture:** Add a `toFunderView(draft)` projection (new `src/lib/afx/funderView.ts`) returning a `FunderView` whose `slate` is `FunderProject[]` (`Omit<Project, 'exact'>`), with `exact` deleted from each project at runtime. Genericize the three slate selectors in `aggregates.ts` so they preserve the element type (a `FunderView` in yields `FunderProject` out — no `exact` even via the selectors). Rewire `FunderPreview` to consume a `FunderView` instead of the raw `ProducerProfile`; the cockpit passes `toFunderView(draft)`. This replaces the current comment-guard with a compiler-enforced boundary.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, AFX scoped styling. No persistence. No test runner.

## Global Constraints

- **No behavioural change to the funder UI.** `FunderPreview` must render byte-for-byte the same output it does today — bands, provenance, deal rows, aggregates. This is a pure type/data-flow hardening, not a redesign.
- **The hard invariant (now construction-enforced):** no funder-facing code may read `Project.exact`. After this change `FunderPreview`'s prop is `FunderView` (whose projects are `Omit<Project,'exact'>`), so a direct `.exact` read is a compile error; the runtime projection deletes the `exact` key so serialising the whole object cannot leak it either. Verify by grep (`\.exact\b` count = 0 outside the cockpit edit surface) AND by a runtime assertion that `JSON.stringify(toFunderView(draftWithExact))` contains no exact amount.
- **Backward-compatible selectors.** Genericizing `projectsOf`/`caseStudies`/`liveProjects` must not change any existing call site's inferred result. A `ProducerProfile` in still yields `Project[]` out. Every current caller (`FunderPreview`, `TrackRecordZone`, `LiveSlateZone`, `ProducerProfileClient`, `constants.ts` `deriveVisibility`/`meetsGoLive`/`nextBestActions`) must keep compiling unchanged.
- **AFX styling only:** inline styles + `.afx-root` vars; no FRA tokens; no Tailwind `@theme`. (No styling changes expected in this plan.)
- **No test runner exists.** Do NOT add one. Verify via `npx tsc --noEmit -p tsconfig.json` (silent), `npx next build` (all three `/afx` routes prerender, no `error`), a dev-server curl for route/isolation health, an `npx tsx` runtime assertion for the projection, and the `.exact` isolation grep. "Missing tests" is NOT a defect.
- **In-session only:** the projection is computed from the live `draft`; no persistence. `toFunderView` returns a fresh object and never mutates `draft`.
- **Commit trailer** on every commit body: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Branch:** `afx-funder-view-hardening`. This builds on the NDA exact-figure work (PR #16, branch `afx-nda-exact-figures`). Stack it on that branch (or branch off `main` once #16 merges). Do NOT work on `main`.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/lib/afx/funderView.ts` | `FunderProject`, `FunderView` types + `stripExact` + `toFunderView` projection. The funder boundary. | Create |
| `src/lib/afx/aggregates.ts` | Genericize `projectsOf`/`caseStudies`/`liveProjects` to preserve the slate element type. | Modify |
| `src/components/afx/producer/FunderPreview.tsx` | Consume `view: FunderView` instead of `draft: ProducerProfile`; rename internal refs; update the guard comment. | Modify |
| `src/app/afx/producer/ProducerProfileClient.tsx` | Pass `<FunderPreview view={toFunderView(draft)} />`. | Modify |

---

## Task 1: `funderView.ts` — the projection + types

**Files:**
- Create: `src/lib/afx/funderView.ts`

**Interfaces:**
- Consumes: `ProducerProfile`, `Project` from `./types`.
- Produces: `FunderProject = Omit<Project, 'exact'>`; `FunderView = Omit<ProducerProfile, 'slate'> & { slate: FunderProject[] }`; `stripExact(pr: Project): FunderProject`; `toFunderView(p: ProducerProfile): FunderView`.

- [ ] **Step 1: Create `src/lib/afx/funderView.ts`**

```ts
import type { ProducerProfile, Project } from './types';

/** A project as a funder may see it — the private `exact` bag is removed at the
 *  type level, so funder-facing code cannot even reference it. */
export type FunderProject = Omit<Project, 'exact'>;

/** The producer profile projected to the funder boundary: identical to
 *  `ProducerProfile` except every slate project is exact-stripped. */
export type FunderView = Omit<ProducerProfile, 'slate'> & { slate: FunderProject[] };

/** Remove the NDA-gated `exact` figures from a single project (runtime + type). */
export function stripExact(pr: Project): FunderProject {
  const clone: FunderProject = { ...pr };
  // `exact` is optional; delete the runtime key so it can never serialise to a funder.
  delete (clone as Partial<Project>).exact;
  return clone;
}

/** Project a producer's cockpit `draft` into the funder-safe view. Returns a
 *  fresh object; never mutates `p`. This is THE funder boundary — exact figures
 *  do not exist past this function. */
export function toFunderView(p: ProducerProfile): FunderView {
  return { ...p, slate: p.slate.map(stripExact) };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent. (If errors appear only under `.next/dev/types/`, run `rm -rf .next` and re-run — only source errors count.)

- [ ] **Step 3: Runtime proof — the projection truly drops `exact`**

Run this one-liner and confirm BOTH lines print `false`:

```bash
npx tsx -e "import {toFunderView} from './src/lib/afx/funderView'; const d={id:'x',name:'n',company:'c',bio:'',ratingBand:'A',careerStage:'',relationships:[],ndaSigned:true,entityK2:true,consentK4:true,slate:[{id:'p',status:'live',title:'t',format:'feature',role:'Producer',jurisdiction:['ZA'],budgetBand:{value:'\$1-2M',provenance:'self'},exact:{budget:{amount:1234567,currency:'ZAR'}}}]}; const v=toFunderView(d); console.log('has exact key:', 'exact' in v.slate[0]); console.log('amount leaks in JSON:', JSON.stringify(v).includes('1234567'));"
```

Expected output:
```
has exact key: false
amount leaks in JSON: false
```

If `npx tsx` is unavailable, note it in the report and verify by a temporary `console.log` removed before commit (do not commit throwaway code).

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/funderView.ts
git commit -m "feat(afx): toFunderView projection — strip exact figures at the funder boundary"
```

---

## Task 2: Genericize the slate selectors (preserve element type)

**Files:**
- Modify: `src/lib/afx/aggregates.ts`

**Interfaces:**
- Consumes: `Project` from `./types`.
- Produces: `projectsOf<T extends Project>(p: { slate?: T[] }): T[]`; `caseStudies<T extends Project>(p: { slate?: T[] }): T[]`; `liveProjects<T extends Project>(p: { slate?: T[] }): T[]`. `computeAggregates` and `Aggregates` are unchanged.

Today these take `ProducerProfile` and return `Project[]`. Genericizing over the element type means a `FunderView` (slate `FunderProject[]`) yields `FunderProject[]` out, so even `liveProjects(view)[i].exact` is a compile error — while `ProducerProfile` callers still infer `Project[]` exactly as before.

- [ ] **Step 1: Replace the three selector signatures in `src/lib/afx/aggregates.ts`**

Find:
```ts
export function projectsOf(p: ProducerProfile): Project[] {
  return p.slate ?? [];
}
export function caseStudies(p: ProducerProfile): Project[] {
  return projectsOf(p).filter((x) => x.status === 'case_study');
}
export function liveProjects(p: ProducerProfile): Project[] {
  return projectsOf(p).filter((x) => x.status === 'live');
}
```
Replace with:
```ts
export function projectsOf<T extends Project>(p: { slate?: T[] }): T[] {
  return p.slate ?? [];
}
export function caseStudies<T extends Project>(p: { slate?: T[] }): T[] {
  return projectsOf(p).filter((x) => x.status === 'case_study');
}
export function liveProjects<T extends Project>(p: { slate?: T[] }): T[] {
  return projectsOf(p).filter((x) => x.status === 'live');
}
```

The top import line `import type { ProducerProfile, Project } from './types';` stays as-is — `ProducerProfile` is still used by `computeAggregates`.

- [ ] **Step 2: Typecheck — confirms every existing caller still infers `Project[]`**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent. This is the real gate: it proves `FunderPreview`, `TrackRecordZone`, `LiveSlateZone`, `ProducerProfileClient`, and `constants.ts` (`deriveVisibility`/`meetsGoLive`/`nextBestActions`) all still compile — they pass a `ProducerProfile` (slate `Project[]`), so `T` infers `Project` and the return stays `Project[]`. If tsc reports a selector-related error, fix that call site only if it is a genuine type change (there should be none).

- [ ] **Step 3: Build**

Run: `npx next build 2>&1 | grep -E '/afx|error'`
Expected: `/afx`, `/afx/marketplace`, `/afx/producer` present, no `error`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/aggregates.ts
git commit -m "refactor(afx): genericize slate selectors to preserve element type"
```

---

## Task 3: Rewire `FunderPreview` to the `FunderView` boundary

**Files:**
- Modify: `src/components/afx/producer/FunderPreview.tsx`
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx`

**Interfaces:**
- Consumes: `FunderView`, `toFunderView` from `@/lib/afx/funderView`; the genericized selectors.
- Produces: `FunderPreview({ view }: { view: FunderView })`; the cockpit renders `<FunderPreview view={toFunderView(draft)} />`.

- [ ] **Step 1: Change `FunderPreview`'s prop to `FunderView` and rename internal refs**

In `src/components/afx/producer/FunderPreview.tsx`:

1. Replace the type import line:
```ts
import type { ProducerProfile } from '@/lib/afx/types';
```
with:
```ts
import type { FunderView } from '@/lib/afx/funderView';
```

2. Replace the component signature + guard comment:
```ts
export default function FunderPreview({ draft }: { draft: ProducerProfile }) {
  const visibility = deriveVisibility(draft);
  const vMeta = VISIBILITY_META[visibility];
  // ⚠️ HARD INVARIANT: never read project.exact here. NDA-gated exact figures
  // (any currency) are private and must never reach the funder view — bands only.
  const live = liveProjects(draft).filter(meetsCorePackaging);
  const agg = computeAggregates(draft);
  const marketEntity = afxSeed.producers.find((e) => e.id === draft.id);
```
with:
```ts
export default function FunderPreview({ view }: { view: FunderView }) {
  // `view` is a FunderView: every project is Omit<Project,'exact'>, so the
  // exact-figure invariant is enforced by the compiler here — `.exact` cannot
  // be referenced, and the projection deleted it at runtime too.
  const visibility = deriveVisibility(view);
  const vMeta = VISIBILITY_META[visibility];
  const live = liveProjects(view).filter(meetsCorePackaging);
  const agg = computeAggregates(view);
  const marketEntity = afxSeed.producers.find((e) => e.id === view.id);
```

3. In the JSX, replace every remaining `draft.` with `view.` — the four reads are: `draft.ratingBand` (×2: the `chipStyle(draft.ratingBand, true)` and the `{draft.ratingBand} · ...` line), `draft.name`, and `draft.careerStage`. After this step, `grep -n 'draft' src/components/afx/producer/FunderPreview.tsx` must return nothing.

`deriveVisibility`, `liveProjects`, `computeAggregates` all accept `view` because `FunderView` is structurally assignable to `ProducerProfile` (its `slate: FunderProject[]` is assignable to `Project[]` since `exact` is optional). `meetsCorePackaging` accepts a `FunderProject` for the same reason.

- [ ] **Step 2: Pass the projection from the cockpit**

In `src/app/afx/producer/ProducerProfileClient.tsx`:

1. Add the import (next to the existing aggregates/types imports):
```ts
import { toFunderView } from '@/lib/afx/funderView';
```

2. Replace the funder-branch render:
```tsx
        {previewMode === 'funder' ? (
          <FunderPreview draft={draft} />
        ) : (
```
with:
```tsx
        {previewMode === 'funder' ? (
          <FunderPreview view={toFunderView(draft)} />
        ) : (
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` → silent.
Run: `npx next build 2>&1 | grep -E '/afx/producer|error'` → `/afx/producer` present, no `error`.

- [ ] **Step 4: Isolation grep — the construction-enforced invariant**

```bash
# No real .exact read in any funder/marketplace surface (only comments allowed):
grep -rn '\.exact\b' src/components/afx/marketplace/ src/components/afx/producer/FunderPreview.tsx src/app/afx/marketplace/ 2>/dev/null | grep -v '//' || echo "CLEAN: no .exact reads in funder/marketplace"
# FunderPreview now consumes the typed boundary, not the raw profile:
grep -n 'FunderView' src/components/afx/producer/FunderPreview.tsx   # expect the import + the prop type
grep -n 'draft' src/components/afx/producer/FunderPreview.tsx        # expect NOTHING
```
Expected: `CLEAN: …`; `FunderView` appears (import + `{ view }: { view: FunderView }`); no `draft` references remain in `FunderPreview.tsx`.

- [ ] **Step 5: Build + route + isolation health (dev server)**

Dev server (background, port 3210; poll until 200, then):
```bash
curl -s -o /dev/null -w "producer %{http_code}\n" http://localhost:3210/afx/producer        # 200
curl -s -o /dev/null -w "marketplace %{http_code}\n" http://localhost:3210/afx/marketplace    # 200
curl -s http://localhost:3210/afx/producer | grep -c 'afx-root'    # 1
curl -s http://localhost:3210/afx/producer | grep -c 'film-grain'  # 0
curl -s http://localhost:3210/ | grep -c 'film-grain'              # 1
# kill the dev server
```

- [ ] **Step 6: Manual no-regression + leak walkthrough (curl can't reach the toggle)**

On `/afx/producer`: confirm the **Funder Preview** toggle renders identically to before this change (producer header, four band tiles, slate deal rows, ranking footnote). Then sign NDA → enter a memorable exact budget on Mokete, e.g. `R 1234567` → switch to Funder Preview → confirm `1,234,567` / `1234567` / `R 1,234,567` appear nowhere. (Now guaranteed structurally, but verify the UX is unchanged.)

- [ ] **Step 7: Commit**

```bash
git add src/components/afx/producer/FunderPreview.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): FunderPreview consumes FunderView — exact-figure boundary enforced by construction"
```

---

## Self-Review

**Goal coverage:**
- Construction-enforced no-leak → Task 1 (`FunderView`/`toFunderView`), Task 2 (selectors preserve `FunderProject`), Task 3 (`FunderPreview` prop is `FunderView`; cockpit passes the projection). A direct `.exact` read in the funder surface is now a compile error; serialising the projected object cannot leak (runtime key deleted). ✔
- No behavioural change → Task 3 keeps all rendering; Global Constraints + Step 6 manual no-regression check. ✔
- Backward-compatible selectors → Task 2 Step 2 tsc gate proves every existing caller still infers `Project[]`. ✔

**Placeholder scan:** none — every code step is complete; verification gives exact commands + expected output, including the runtime projection proof (Task 1 Step 3) and the construction-enforcement greps (Task 3 Step 4).

**Type consistency:** `FunderView`/`FunderProject` (Task 1) are consumed unchanged in Tasks 2–3. The genericized selector signature `<T extends Project>(p: { slate?: T[] }): T[]` (Task 2) is what lets `liveProjects(view)` yield `FunderProject[]` in Task 3. `FunderPreview`'s prop `{ view: FunderView }` matches the cockpit call `view={toFunderView(draft)}`. `toFunderView(p: ProducerProfile): FunderView` matches its single call site.

**Dependency / independence:** Task 1 (new file) and Task 2 (selector generics) are independent and can be implemented/reviewed in parallel. Task 3 depends on both and must run last; it is the only behavioural wiring and carries the build + dev-curl + manual checks.

**Scope honesty:** This fully closes the whole-branch reviewer's recommendation from the NDA exact-figure branch (`toFunderView` enforced-by-construction). It does not touch the marketplace route, which already reads `afxSeed` (never the in-session `draft`) and so was never a leak path.

## Execution Handoff

Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, spec+quality review between tasks, final whole-branch review. Tasks 1–2 parallelizable; Task 3 sequential/last.
2. **Inline Execution** — batch in this session with checkpoints.

Execute after PR #16 (`afx-nda-exact-figures`) merges, since this builds on that branch's `Project.exact` model and `FunderPreview`. Stack on `afx-nda-exact-figures` if you want it reviewable before #16 lands.
