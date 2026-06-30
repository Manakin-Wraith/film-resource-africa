# AFX NDA Exact-Figure Entry (with Local Currency) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a producer who has signed the FRA↔producer NDA enter **exact figures** behind their financial bands — privately, in their own currency (USD or ZAR per figure) — so AFX can vet case studies and de-risk live projects truthfully, while funders still see only bands.

**Architecture:** Extend the unified `Project` with a private `exact?: ExactFigures` bag, where every figure is an `ExactMoney = { amount, currency }`, never serialised to the funder view. An NDA-gated inline expander (`ExactFigureInput`) — each with a USD/ZAR toggle — sits under each money field in the cockpit; committing a budget exact raises that band's provenance `self → confirmed` (and clearing it lowers `confirmed → self`). Live projects additionally capture exact capital-stack legs and funding-secured as private supporting figures. This is the deferred Group 5 work from the parent branch (`afx-producer-profile-data-model`, spec §5), plus per-figure local-currency support for the SA-first user base.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, AFX scoped styling (`.afx-root`, inline styles). No persistence (in-session CRUD). No test runner.

## Global Constraints

- **AFX styling only:** inline styles + `.afx-root` CSS vars (`--afx-mono`, `--afx-accent`, `--afx-prov-*`, etc.). NO FRA tokens (`--color-*`, `--font-fraunces`), NO Tailwind `@theme` additions, NO Tailwind utility classes. Match the existing cockpit components' visual idiom.
- **No test runner exists in this repo.** Do NOT add one and do NOT write framework tests. Verification is exactly what the parent branch used: `npx tsc --noEmit -p tsconfig.json` (must be silent), `npx next build` (the three `/afx` routes must prerender, no `error`), a dev-server curl on port 3210 for route health, plus a documented manual walkthrough for the interactive bits. Treat "missing tests" as NOT a defect.
- **Exact figures are PRIVATE — a hard invariant.** `Project.exact` must NEVER be read by `FunderPreview.tsx` or any `src/components/afx/marketplace/*` file, and no exact amount (in any currency) may appear in funder-facing output. Funders see only bands. Verify by grep (`\.exact\b` count = 0 outside the cockpit edit surface).
- **NDA gates entry.** The exact-figure affordance only renders when `draft.ndaSigned === true`. When unsigned, no exact input is shown anywhere.
- **Local currency (per figure).** Every exact figure carries its own currency — USD (`$`) or ZAR (`R `) — chosen via a per-figure toggle on the input. Stored exactly as entered with **NO FX conversion** and no USD equivalent (funders never see exacts, so there is nothing to normalise). New, empty inputs default to the producer's local currency derived from `location`: ends with `ZA` → `'ZAR'`, otherwise `'USD'`.
- **Provenance bump (budget only).** Committing a budget exact: if `budgetBand.provenance === 'self'` → set `'confirmed'`. Clearing it: if `budgetBand.provenance === 'confirmed'` → set `'self'`. Never downgrade `'verified'`; never raise above `'confirmed'` from an exact. The bump keys off the **presence** of a budget figure, independent of its currency. This is a prototype simplification (it cannot distinguish an exact-driven confirmation from an independent one) — document it, don't over-engineer.
- **Field scope:** case studies → exact **budget**. Live projects → exact **budget**, exact **capital-stack legs** (equity/soft/debt/gap), exact **funding secured**. Recoupment stays categorical (already provenance-tracked; not a single money figure). Only the budget exact bumps provenance; the live-only figures are private supporting data (their fields carry no provenance).
- **In-session only:** state lives on the cockpit `draft` (`structuredClone` of the seed); refresh resets. No seed changes that pre-populate exacts — the producer enters them live in the demo.
- **Commit trailer** on every commit body: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Branch:** create and work on `afx-nda-exact-figures` off the merged parent (or off `main` once PR #15 lands). Do NOT work on `main`. This plan builds directly on the parent branch's `Project`/cockpit, so land it after PR #15 merges.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/lib/afx/types.ts` | Adds `AfxCurrency`, `ExactMoney`, `ExactFigures`; `Project.exact?`; removes dead `exactBudget?`. | Modify |
| `src/lib/afx/format.ts` | `CURRENCY_SYMBOL`, `parseMoney` (string → number), `formatExact` (`ExactMoney` → `R 1,450,000`). | Modify |
| `src/components/afx/primitives/ExactFigureInput.tsx` | NDA-gated inline expander with a USD/ZAR toggle: "+ Add exact figure (NDA)" → currency + number → formatted value + state hint. Presentational. | Create |
| `src/app/afx/producer/ProducerProfileClient.tsx` | `onExact(projectId, field, value)` handler (writes `exact`, applies budget provenance bump); derives the producer's `localCurrency`; passes `onExact` + `ndaSigned` + `defaultCurrency` into the two zones. | Modify |
| `src/components/afx/producer/TrackRecordZone.tsx` | Budget `ExactFigureInput` under each case study (gated). | Modify |
| `src/components/afx/producer/LiveSlateZone.tsx` | Budget + capital-stack + funding-secured `ExactFigureInput`s per live project (gated). | Modify |
| `src/components/afx/producer/FunderPreview.tsx` | Add the explicit "never read `.exact`" guard comment; no behavioural change. | Modify |
| `src/components/afx/producer/NdaUpgrade.tsx` | Refresh signed-state copy now that entry is live. | Modify |

---

## Task 1: Data model — `AfxCurrency`, `ExactMoney`, `ExactFigures`

**Files:**
- Modify: `src/lib/afx/types.ts`

**Interfaces:**
- Consumes: existing `Project`, `Provenanced`.
- Produces: `AfxCurrency` (`'USD' | 'ZAR'`), `ExactMoney` (`{ amount: number; currency: AfxCurrency }`), `ExactFigures`; `Project.exact?: ExactFigures`; `exactBudget` removed.

- [ ] **Step 1: Replace the dead `exactBudget` field with the structured private bag**

In `src/lib/afx/types.ts`, find in `interface Project`:

```ts
  budgetBand: Provenanced<string>;
  /** NDA-gated exact figure. Private — never serialised to the funder view. */
  exactBudget?: number;
```

Replace those three lines with:

```ts
  budgetBand: Provenanced<string>;
  /** NDA-gated exact figures. Private — NEVER serialised to the funder view.
   *  Keys map to the band/financial fields they substantiate. */
  exact?: ExactFigures;
```

- [ ] **Step 2: Add the currency + exact-figure types**

Immediately above `export interface Project {` in the same file, add:

```ts
/** Currencies a producer may enter exact figures in. SA-first. */
export type AfxCurrency = 'USD' | 'ZAR';

/** One private exact figure: the amount exactly as entered, in its own
 *  currency. No FX normalisation — stored as typed. */
export interface ExactMoney {
  amount: number;
  currency: AfxCurrency;
}

/** Private exact figures unlocked by the FRA↔producer NDA. Held confidentially:
 *  funders still see only bands. A budget exact raises `budgetBand` provenance
 *  self→confirmed; the live-only figures are private supporting data. */
export interface ExactFigures {
  /** case_study + live — exact total budget. */
  budget?: ExactMoney;
  /** live — exact amount of financing secured to date. */
  fundingSecured?: ExactMoney;
  /** live — exact capital-stack legs, substantiating the % bands. */
  capitalStack?: { equity?: ExactMoney; soft?: ExactMoney; debt?: ExactMoney; gap?: ExactMoney };
}
```

- [ ] **Step 3: Typecheck (confirms nothing read the old field)**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent. (The parent-branch review confirmed `exactBudget` was declared-but-never-read, so removing it breaks nothing. If tsc names `exactBudget`, fix that reference.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/types.ts
git commit -m "feat(afx): ExactMoney + ExactFigures model (NDA exact figures, USD/ZAR)"
```

---

## Task 2: Money parse/format helpers (currency-aware)

**Files:**
- Modify: `src/lib/afx/format.ts`

**Interfaces:**
- Consumes: `ExactMoney` from `./types`.
- Produces: `CURRENCY_SYMBOL: Record<AfxCurrency, string>`, `parseMoney(input: string): number | undefined`, `formatExact(m: ExactMoney | undefined): string`.

`fmtUSD` (compact, e.g. `$6.8M`) already exists and is for the marketplace. These new helpers are for **exact** entry/display: lenient amount parsing and full grouped figures in the figure's own currency.

- [ ] **Step 1: Extend the types import at the top of `src/lib/afx/format.ts`**

Change:
```ts
import type { RatingBand, Confidence } from './types';
```
to:
```ts
import type { RatingBand, Confidence, AfxCurrency, ExactMoney } from './types';
```

- [ ] **Step 2: Append the helpers to `src/lib/afx/format.ts`**

Add at the end of the file:

```ts
/** Currency symbols for exact-figure display. USD compact, ZAR with a space. */
export const CURRENCY_SYMBOL: Record<AfxCurrency, string> = { USD: '$', ZAR: 'R ' };

/** Full grouped money in its own currency, e.g. {1450000,'ZAR'} → "R 1,450,000".
 *  Empty/invalid → "". */
export function formatExact(m: ExactMoney | undefined): string {
  if (!m || !Number.isFinite(m.amount)) return '';
  return CURRENCY_SYMBOL[m.currency] + Math.round(m.amount).toLocaleString('en-US');
}

/** Lenient parse of a typed amount into a number (the currency is chosen by the
 *  input's toggle, NOT parsed here). Accepts "1,450,000", "1.45m", "850k",
 *  "$1,200,000", "R 1 450 000". Returns undefined for blank/unparseable input. */
export function parseMoney(input: string): number | undefined {
  const s = input.trim().toLowerCase().replace(/^[r$]/, '').replace(/[$,\s]/g, '');
  if (s === '') return undefined;
  const match = s.match(/^(\d*\.?\d+)\s*([km])?$/);
  if (!match) return undefined;
  let n = parseFloat(match[1]);
  if (!Number.isFinite(n)) return undefined;
  if (match[2] === 'k') n *= 1e3;
  if (match[2] === 'm') n *= 1e6;
  if (n < 0) return undefined;
  return n;
}
```

- [ ] **Step 3: Typecheck + eyeball the parse/format table**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent.

Sanity-check without a test runner — run this one-liner and confirm the printed values match exactly:

```bash
npx tsx -e "import {parseMoney,formatExact} from './src/lib/afx/format'; for (const s of ['1,450,000','1.45m','850k','\$1,200,000','R 1 450 000','','abc','-5']) console.log(JSON.stringify(s),'→',parseMoney(s)); console.log('fmt:',formatExact({amount:1450000,currency:'ZAR'}),'|',formatExact({amount:1200000,currency:'USD'}));"
```

Expected output (exact):
```
"1,450,000" → 1450000
"1.45m" → 1450000
"850k" → 850000
"$1,200,000" → 1200000
"R 1 450 000" → 1450000
"" → undefined
"abc" → undefined
"-5" → undefined
fmt: R 1,450,000 | $1,200,000
```

If `npx tsx` is unavailable, add a temporary `console.log` block, run `npx next build` once and read the values from build output, then remove it — do not commit throwaway code.

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/format.ts
git commit -m "feat(afx): parseMoney + currency-aware formatExact + CURRENCY_SYMBOL"
```

---

## Task 3: `ExactFigureInput` primitive (NDA-gated expander with USD/ZAR toggle)

**Files:**
- Create: `src/components/afx/primitives/ExactFigureInput.tsx`

**Interfaces:**
- Consumes: `parseMoney`, `formatExact` from `@/lib/afx/format`; `ExactMoney`, `AfxCurrency` from `@/lib/afx/types`.
- Produces: `export default function ExactFigureInput(props: ExactFigureInputProps)` where

```ts
interface ExactFigureInputProps {
  value: ExactMoney | undefined;          // current committed exact, or none
  onCommit: (value: ExactMoney | undefined) => void; // commit/clear; parent owns state
  gated: boolean;                          // false → render nothing (NDA unsigned)
  label: string;                           // e.g. "budget"
  defaultCurrency: AfxCurrency;            // currency for a fresh, empty input
  confirmHint?: string;                    // optional, e.g. "→ confirmed"
}
```

Purely presentational + local open/typing/currency state. Parent owns the committed `value` and the provenance side-effects.

- [ ] **Step 1: Create the component**

Create `src/components/afx/primitives/ExactFigureInput.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { parseMoney, formatExact } from '@/lib/afx/format';
import type { ExactMoney, AfxCurrency } from '@/lib/afx/types';

const mono = 'var(--afx-mono)';
const accent = 'var(--afx-accent)';

interface ExactFigureInputProps {
  value: ExactMoney | undefined;
  onCommit: (value: ExactMoney | undefined) => void;
  gated: boolean;
  label: string;
  defaultCurrency: AfxCurrency;
  confirmHint?: string;
}

/** NDA-gated inline expander for entering one private exact figure with its own
 *  currency. Renders nothing when `gated` is false (NDA unsigned). */
export default function ExactFigureInput({ value, onCommit, gated, label, defaultCurrency, confirmHint }: ExactFigureInputProps) {
  const hasValue = value != null;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [currency, setCurrency] = useState<AfxCurrency>(value?.currency ?? defaultCurrency);

  if (!gated) return null;

  // Collapsed: committed value (with edit/clear) or the add affordance.
  if (!open) {
    if (hasValue) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: mono, fontSize: 11.5, fontWeight: 600 }}>{formatExact(value)}</span>
          {confirmHint ? (
            <span style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--afx-prov-confirmed)' }}>{confirmHint}</span>
          ) : null}
          <button
            onClick={() => { setText(String(value!.amount)); setCurrency(value!.currency); setOpen(true); }}
            style={linkBtn}
          >
            Edit
          </button>
          <button onClick={() => onCommit(undefined)} style={linkBtn}>Clear</button>
        </div>
      );
    }
    return (
      <button onClick={() => { setText(''); setCurrency(defaultCurrency); setOpen(true); }} style={{ ...linkBtn, color: accent, marginTop: 5 }}>
        + Add exact {label} (NDA)
      </button>
    );
  }

  // Open: currency toggle + amount entry. Commit on Save/Enter; unparseable input
  // keeps the field open so the producer can correct it.
  const commit = () => {
    if (text.trim() === '') { onCommit(undefined); setOpen(false); return; }
    const n = parseMoney(text);
    if (n == null) return; // unparseable — stay open
    onCommit({ amount: n, currency });
    setOpen(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
      <div style={{ display: 'inline-flex', border: '1px solid #E4E2DC', borderRadius: 7, overflow: 'hidden' }}>
        {(['ZAR', 'USD'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            style={{
              cursor: 'pointer', fontFamily: mono, fontSize: 10.5, fontWeight: 600, padding: '5px 9px', border: 'none',
              background: currency === c ? '#1C1D21' : '#fff', color: currency === c ? '#fff' : '#9A9CA3',
            }}
          >
            {c === 'ZAR' ? 'R' : '$'}
          </button>
        ))}
      </div>
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setOpen(false); }}
        placeholder={`exact ${label}`}
        style={{
          flex: 1, minWidth: 110, fontFamily: mono, fontSize: 12, border: '1px solid #E4E2DC', borderRadius: 7,
          padding: '5px 9px', background: '#fff', outline: 'none',
        }}
      />
      <button onClick={commit} style={solidBtn}>Save</button>
      <button onClick={() => setOpen(false)} style={linkBtn}>Cancel</button>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  cursor: 'pointer', background: 'none', border: 'none', padding: 0,
  fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#9A9CA3', letterSpacing: '0.02em',
};

const solidBtn: React.CSSProperties = {
  cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 11.5, fontWeight: 600,
  padding: '5px 11px', borderRadius: 7, border: '1px solid #1C1D21', background: '#1C1D21', color: '#fff',
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent. (Not rendered anywhere yet, so no build needed this task.)

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/primitives/ExactFigureInput.tsx
git commit -m "feat(afx): ExactFigureInput — NDA-gated exact entry with USD/ZAR toggle"
```

---

## Task 4: `onExact` handler + provenance bump + local-currency derivation

**Files:**
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx`

**Interfaces:**
- Consumes: `Project`, `ExactFigures`, `ExactMoney`, `AfxCurrency` from `@/lib/afx/types`.
- Produces: `onExact(projectId: string, field: ExactKey, value: ExactMoney | undefined)` and a derived `localCurrency`, both passed to `TrackRecordZone` (budget only) and `LiveSlateZone` (all keys), plus `ndaSigned`. Type:
  `type ExactKey = 'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap';`

- [ ] **Step 1: Extend the types import**

Change the existing types import line to include the new types:
```ts
import type { ProducerProfile, Provenance, Project, ExactFigures, ExactMoney, AfxCurrency } from '@/lib/afx/types';
```

- [ ] **Step 2: Add the `ExactKey` type just below the existing `isDowngrade` line near the top of the file**

```ts
type ExactKey = 'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap';
```

- [ ] **Step 3: Derive the producer's local currency + add the `onExact` handler**

Inside the component, add next to the existing `onOutcomeField` handler:

```ts
  const localCurrency: AfxCurrency = (draft.location ?? '').trim().endsWith('ZA') ? 'ZAR' : 'USD';

  const onExact = (projectId: string, field: ExactKey, value: ExactMoney | undefined) => {
    setDraft((d) => ({
      ...d,
      slate: (d.slate ?? []).map((p): Project => {
        if (p.id !== projectId) return p;
        const exact: ExactFigures = { ...p.exact };

        if (field === 'budget' || field === 'fundingSecured') {
          if (value === undefined) delete exact[field];
          else exact[field] = value;
        } else {
          // capital-stack leg
          const cs = { ...exact.capitalStack };
          if (value === undefined) delete cs[field];
          else cs[field] = value;
          exact.capitalStack = Object.keys(cs).length ? cs : undefined;
        }

        // Budget exact raises/lowers the band provenance (Global Constraints).
        let budgetBand = p.budgetBand;
        if (field === 'budget') {
          if (value !== undefined && p.budgetBand.provenance === 'self') budgetBand = { ...p.budgetBand, provenance: 'confirmed' };
          if (value === undefined && p.budgetBand.provenance === 'confirmed') budgetBand = { ...p.budgetBand, provenance: 'self' };
        }

        const cleaned: ExactFigures = {};
        if (exact.budget !== undefined) cleaned.budget = exact.budget;
        if (exact.fundingSecured !== undefined) cleaned.fundingSecured = exact.fundingSecured;
        if (exact.capitalStack) cleaned.capitalStack = exact.capitalStack;

        return { ...p, budgetBand, exact: Object.keys(cleaned).length ? cleaned : undefined };
      }),
    }));
  };
```

- [ ] **Step 4: Pass the new props into the two zones**

In the `data` branch JSX, update the two zone usages:
```tsx
            <TrackRecordZone draft={draft} onOutcomeField={onOutcomeField} reverted={reverted} onExact={onExact} ndaSigned={!!draft.ndaSigned} defaultCurrency={localCurrency} />
            <LiveSlateZone draft={draft} onAddProject={onAddProject} onArchive={onArchive} onExact={onExact} ndaSigned={!!draft.ndaSigned} defaultCurrency={localCurrency} />
```

- [ ] **Step 5: Add the props to both child signatures as a compiles-green stub**

So this task typechecks on its own (the wiring that USES them lands in Tasks 5–6):

In `src/components/afx/producer/TrackRecordZone.tsx`, add to `import type { … }` from `@/lib/afx/types`: `ExactMoney, AfxCurrency`, then extend `interface Props`:
```ts
  onExact: (projectId: string, field: 'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap', value: ExactMoney | undefined) => void;
  ndaSigned: boolean;
  defaultCurrency: AfxCurrency;
```
In `src/components/afx/producer/LiveSlateZone.tsx`, add the same two types to its `@/lib/afx/types` import and extend `interface Props` identically.

Destructure the three new props in each component's signature (`{ draft, …, onExact, ndaSigned, defaultCurrency }`) and add `void onExact; void ndaSigned; void defaultCurrency;` at the top of each function body to satisfy no-unused rules without behaviour. (Tasks 5–6 remove the `void` lines when they wire the props in.)

- [ ] **Step 6: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`  → silent.
Run: `npx next build 2>&1 | grep -E '/afx/producer|error'`  → `/afx/producer` present, no `error`.

- [ ] **Step 7: Commit**

```bash
git add src/app/afx/producer/ProducerProfileClient.tsx src/components/afx/producer/TrackRecordZone.tsx src/components/afx/producer/LiveSlateZone.tsx
git commit -m "feat(afx): onExact handler, budget provenance bump, local-currency derivation"
```

---

## Task 5: Wire exact-budget entry into Track Record (case studies)

**Files:**
- Modify: `src/components/afx/producer/TrackRecordZone.tsx`

**Interfaces:**
- Consumes: `onExact`, `ndaSigned`, `defaultCurrency` (added to `Props` in Task 4); `ExactFigureInput`; the `Project.exact` field.
- Produces: a budget `ExactFigureInput` rendered under each case study's budget row when `ndaSigned`.

- [ ] **Step 1: Import the input; remove the Task-4 stub; thread props to `CaseStudyCard`**

At the top of `src/components/afx/producer/TrackRecordZone.tsx`, add:
```ts
import ExactFigureInput from '@/components/afx/primitives/ExactFigureInput';
```

Remove the `void onExact; void ndaSigned; void defaultCurrency;` stub line added in Task 4.

Change the `CaseStudyCard` call site (currently passes `study`, `onField`, `reverted`):
```tsx
            <CaseStudyCard key={s.id} study={s} onField={(f, v) => onOutcomeField(s.id, f, v)} reverted={reverted}
              onExactBudget={(v) => onExact(s.id, 'budget', v)} ndaSigned={ndaSigned} defaultCurrency={defaultCurrency} />
```

- [ ] **Step 2: Render the budget exact input inside `CaseStudyCard`**

Replace `CaseStudyCard`'s signature:
```tsx
function CaseStudyCard({ study, onField, reverted }: { study: Project; onField: (f: 'recoupment' | 'bondUsed' | 'budget', v: string) => void; reverted: Record<string, Provenance> }) {
```
with:
```tsx
function CaseStudyCard({ study, onField, reverted, onExactBudget, ndaSigned, defaultCurrency }: { study: Project; onField: (f: 'recoupment' | 'bondUsed' | 'budget', v: string) => void; reverted: Record<string, Provenance>; onExactBudget: (v: ExactMoney | undefined) => void; ndaSigned: boolean; defaultCurrency: AfxCurrency }) {
```

Find the budget `OutcomeRow`:
```tsx
      <OutcomeRow label="Budget" value={study.budgetBand.value} provenance={study.budgetBand.provenance} revertedFrom={reverted[`${study.id}:budget`]} onChange={(v) => onField('budget', v)} />
```
and immediately AFTER it, add:
```tsx
      <ExactFigureInput value={study.exact?.budget} onCommit={onExactBudget} gated={ndaSigned} label="budget" defaultCurrency={defaultCurrency}
        confirmHint={study.budgetBand.provenance === 'confirmed' ? '→ confirmed' : undefined} />
```

- [ ] **Step 3: Typecheck + build + manual walkthrough**

Run: `npx tsc --noEmit -p tsconfig.json`  → silent.
Run: `npx next build 2>&1 | grep -E '/afx/producer|error'`  → `/afx/producer` present, no `error`.

Dev-server route health (single-line minified HTML — count distinct strings, never `grep -c`):
```bash
PORT=3210 npm run dev &   # background; poll until 200
curl -s http://localhost:3210/afx/producer | grep -oE 'Track Record' | sort -u | wc -l   # want 1
# kill the dev server when done
```
Manual (curl cannot reach): NDA unsigned → case-study cards show no "+ Add exact budget". Sign NDA → the affordance appears; the currency toggle defaults to **R** (producer location is Cape Town, ZA). On a `self`-budget study enter `1450000` → shows `R 1,450,000` and the budget badge flips to **confirmed**; switch the toggle to `$` before saving → shows `$1,450,000`; Clear → reverts to self. On the `verified` study (cs1 Silverton Siege) entering an exact does NOT change the verified badge.

- [ ] **Step 4: Commit**

```bash
git add src/components/afx/producer/TrackRecordZone.tsx
git commit -m "feat(afx): exact-budget entry on case studies (NDA-gated, USD/ZAR, bumps provenance)"
```

---

## Task 6: Wire exact figures into the Live Slate (budget + capital stack + funding)

**Files:**
- Modify: `src/components/afx/producer/LiveSlateZone.tsx`

**Interfaces:**
- Consumes: `onExact`, `ndaSigned`, `defaultCurrency` (added in Task 4); `ExactFigureInput`; `Project.exact`.
- Produces: per live project — a budget exact (bumps provenance), a funding-secured exact, and four capital-stack-leg exacts, all NDA-gated, each with its own currency.

- [ ] **Step 1: Import the input; remove the Task-4 stub; thread props to `LiveProjectCard`**

At the top of `src/components/afx/producer/LiveSlateZone.tsx`, add:
```ts
import ExactFigureInput from '@/components/afx/primitives/ExactFigureInput';
```

Remove the `void onExact; void ndaSigned; void defaultCurrency;` stub line added in Task 4.

Update the `LiveProjectCard` call site (currently passes `project`, `onArchive`, `lastScreenable`):
```tsx
              <LiveProjectCard key={p.id} project={p} onArchive={() => onArchive(p.id)}
                lastScreenable={screenable.length <= 1 && meetsCorePackaging(p)}
                onExact={(field, v) => onExact(p.id, field, v)} ndaSigned={ndaSigned} defaultCurrency={defaultCurrency} />
```

- [ ] **Step 2: Extend `LiveProjectCard` and render the exact inputs**

Replace the `LiveProjectCard` signature:
```tsx
function LiveProjectCard({ project, onArchive, lastScreenable }: { project: Project; onArchive: () => void; lastScreenable: boolean }) {
```
with:
```tsx
type LiveExactField = 'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap';
function LiveProjectCard({ project, onArchive, lastScreenable, onExact, ndaSigned, defaultCurrency }: { project: Project; onArchive: () => void; lastScreenable: boolean; onExact: (field: LiveExactField, v: ExactMoney | undefined) => void; ndaSigned: boolean; defaultCurrency: AfxCurrency }) {
```

(Add `ExactMoney, AfxCurrency` to the file's `@/lib/afx/types` import if Task 4's stub edit did not already — they must be imported.)

Find the budget `ProvenanceBadge` row near the end of the card:
```tsx
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2 }}>
        <ProvenanceBadge provenance={project.budgetBand.provenance} size="sm" />
        <GhostButton onClick={onArchive} tone={lastScreenable ? 'danger' : 'neutral'}>Archive</GhostButton>
      </div>
```
and insert, immediately BEFORE that `<div>`, the NDA-gated exact block:
```tsx
      {ndaSigned ? (
        <div style={{ borderTop: '1px dashed #ECEAE4', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-accent)' }}>Exact figures (NDA)</span>
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Budget</span>
            <ExactFigureInput value={project.exact?.budget} onCommit={(v) => onExact('budget', v)} gated={ndaSigned} label="budget" defaultCurrency={defaultCurrency}
              confirmHint={project.budgetBand.provenance === 'confirmed' ? '→ confirmed' : undefined} />
          </div>
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Funding secured</span>
            <ExactFigureInput value={project.exact?.fundingSecured} onCommit={(v) => onExact('fundingSecured', v)} gated={ndaSigned} label="funding" defaultCurrency={defaultCurrency} />
          </div>
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Capital stack</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 14px', marginTop: 2 }}>
              {(['equity', 'soft', 'debt', 'gap'] as const).map((leg) => (
                <div key={leg}>
                  <span style={{ fontSize: 11, color: '#9A9CA3', textTransform: 'capitalize' }}>{leg}</span>
                  <ExactFigureInput value={project.exact?.capitalStack?.[leg]} onCommit={(v) => onExact(leg, v)} gated={ndaSigned} label={leg} defaultCurrency={defaultCurrency} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
```

- [ ] **Step 3: Typecheck + build + manual walkthrough**

Run: `npx tsc --noEmit -p tsconfig.json`  → silent.
Run: `npx next build 2>&1 | grep -E '/afx/producer|error'`  → `/afx/producer` present, no `error`.

Manual: NDA unsigned → live cards show no "Exact figures (NDA)" block. Sign NDA → the block appears on every live card with Budget / Funding secured / Capital stack (equity, soft, debt, gap), each defaulting to **R**. Enter an exact budget on **Mokete** (seed budget is `self`) → badge flips to **confirmed**. Enter capital-stack legs in mixed currencies → each persists with its own symbol. None of these alter the funder-facing bands.

- [ ] **Step 4: Commit**

```bash
git add src/components/afx/producer/LiveSlateZone.tsx
git commit -m "feat(afx): exact budget + capital stack + funding entry on live projects (USD/ZAR)"
```

---

## Task 7: Funder-view isolation guard + NDA copy + full verification

**Files:**
- Modify: `src/components/afx/producer/FunderPreview.tsx`
- Modify: `src/components/afx/producer/NdaUpgrade.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: an explicit code guard/comment that `FunderPreview` never reads `.exact`; refreshed NDA copy; the branch-level isolation verification.

- [ ] **Step 1: Add the never-leak guard comment in `FunderPreview.tsx`**

In `src/components/afx/producer/FunderPreview.tsx`, immediately above the `const live = liveProjects(draft)…` line, add:
```tsx
  // ⚠️ HARD INVARIANT: never read project.exact here. NDA-gated exact figures
  // (any currency) are private and must never reach the funder view — bands only.
```

- [ ] **Step 2: Tighten the NDA panel copy now that entry is live**

In `src/components/afx/producer/NdaUpgrade.tsx`, replace the signed-state status line:
```tsx
            {signed ? '✓ NDA signed — exact-figure entry unlocked' : 'Not signed — bands only'}
```
with:
```tsx
            {signed ? '✓ NDA signed — exact-figure entry unlocked (USD or ZAR) on every budget, capital-stack and funding field' : 'Not signed — bands only'}
```

- [ ] **Step 3: Isolation grep — the Critical invariant**

Run:
```bash
grep -rn '\.exact\b' src/components/afx/marketplace/ src/components/afx/producer/FunderPreview.tsx src/app/afx/marketplace/ 2>/dev/null | grep -v '// ' || echo "CLEAN: no .exact reads in funder/marketplace surfaces"
```
Expected: `CLEAN: …`. If any real (non-comment) `.exact` read appears in those files, it is a leak — fix it before continuing.

Confirm only the intended cockpit edit surfaces read `.exact`:
```bash
grep -rln '\.exact' src/ | sort
```
Expected files: `src/lib/afx/types.ts` (definition), `src/app/afx/producer/ProducerProfileClient.tsx` (handler), `src/components/afx/producer/TrackRecordZone.tsx`, `src/components/afx/producer/LiveSlateZone.tsx`. No marketplace file; `FunderPreview.tsx` only via the excluded comment.

- [ ] **Step 4: Full build + route + isolation health**

Run: `npx tsc --noEmit -p tsconfig.json`  → silent.
Run: `npx next build 2>&1 | grep -E '/afx|error'`  → `/afx`, `/afx/marketplace`, `/afx/producer` present, no `error`.

Dev server (background, port 3210; poll until 200, then):
```bash
curl -s -o /dev/null -w "producer %{http_code}\n" http://localhost:3210/afx/producer        # 200
curl -s -o /dev/null -w "marketplace %{http_code}\n" http://localhost:3210/afx/marketplace    # 200
curl -s http://localhost:3210/afx/producer | grep -c 'afx-root'    # 1  (AFX scoped)
curl -s http://localhost:3210/afx/producer | grep -c 'film-grain'  # 0  (no FRA chrome)
curl -s http://localhost:3210/ | grep -c 'film-grain'              # 1  (FRA intact)
# kill the dev server
```

- [ ] **Step 5: Manual leak walkthrough (the part curl cannot reach)**

On `/afx/producer`: sign NDA → enter a memorable exact budget on Mokete, e.g. `R 1234567`. Switch the header toggle to **Funder Preview**. Confirm the strings `1,234,567`, `1234567`, and `R 1,234,567` appear **nowhere** in the funder view (the slate row still shows the marketplace band/`$6.8M`-style figure and the funding band, not your exact). This is the human confirmation of the Critical invariant.

- [ ] **Step 6: Commit**

```bash
git add src/components/afx/producer/FunderPreview.tsx src/components/afx/producer/NdaUpgrade.tsx
git commit -m "feat(afx): funder-view exact-figure leak guard + NDA copy; verify isolation"
```

---

## Self-Review

**Spec coverage (spec §5 "NDA upgrade") + this round's decisions:**
- "e-signs the NDA → unlocks entering exact figures on any band field" → Tasks 3–6 (gated `ExactFigureInput` on budget across both tracks + capital stack/funding on live). ✔
- "Exact numbers held confidentially — funders still see only bands" → Global Constraints + Task 7 guard/grep/manual leak check. ✔
- "bump provenance self → confirmed" → Task 4 budget bump rule (+ Task 5/6 `confirmHint`). ✔ (Budget bands only; live-only figures carry no provenance — documented.)
- **Local currency (this round):** per-figure USD/ZAR toggle, stored as entered, NO FX → Tasks 1 (`ExactMoney`), 2 (`formatExact`/`CURRENCY_SYMBOL`), 3 (toggle), 4 (location-derived default). ✔
- "precondition for formal verification" → out of scope (verification workflow is a separate spec, §8). Noted, not a gap.

**Placeholder scan:** none — every code step contains the full code; verification steps give exact commands + expected output. The `void onExact;` stubs in Task 4 are a deliberate compiles-green bridge, explicitly removed in Tasks 5–6, not a placeholder.

**Type consistency:** `ExactMoney`/`ExactFigures` shapes (Task 1) are read identically in the handler (Task 4) and components (Tasks 5–6). The `ExactKey`/`LiveExactField` union (`'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap'`) is identical in the client handler, the `TrackRecordZone`/`LiveSlateZone` `Props`, and `LiveProjectCard`. `parseMoney`/`formatExact`/`CURRENCY_SYMBOL` signatures (Task 2) match their uses in `ExactFigureInput` (Task 3). `ExactFigureInput` props (incl. `defaultCurrency`) match every call site. `AfxCurrency` is imported wherever referenced.

**Ordering / independence:** Task 4 is self-contained (adds props + `void` stubs so it builds green); Tasks 5 and 6 each remove their stub and wire one zone, independently reviewable. Task 7 is the isolation gate and must run last.

## Execution Handoff

Chosen: **Subagent-Driven** — fresh subagent per task, spec+quality review between tasks, final whole-branch review. Same harness used for the parent `afx-producer-profile-data-model` branch. Execute only after PR #15 merges (this builds on that branch's `Project`/cockpit).
