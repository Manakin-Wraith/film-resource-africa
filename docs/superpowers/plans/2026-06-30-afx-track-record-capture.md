# AFX Track Record Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a producer add, edit, and remove case studies (Track Record) through a side drawer capturing all comprehensive fields plus tagged evidence links.

**Architecture:** A new `CaseStudyDrawer` edits a local buffer (a `structuredClone` of one `Project` with `status:'case_study'`) and commits to `draft.slate` only on Save; the existing debounced autosave persists it. `TrackRecordZone` becomes read-only summary cards + an Add button that open the drawer. Pure logic (factory, validity, evidence/distribution/jurisdiction/exact-budget mutations) lives in a unit-testable `src/lib/afx/caseStudy.ts`. No database migration — evidence and newly-editable fields ride the existing `afx_projects.body` JSONB.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, AFX scoped CSS tokens (inline styles + `var(--afx-*)`). No test runner — verification is `npx tsc --noEmit`, `npx next build`, and `npx tsx` assertions.

## Global Constraints

- **No DB migration.** Evidence + newly-editable fields persist inside `afx_projects.body` (the `profileToRows` mapper routes everything except `exact` there). Do not add a migration.
- **`exact` stays isolated.** The NDA budget lives only in `Project.exact.budget` (→ `afx_projects.exact` column), NEVER serialized into `body`. Do not put evidence or any non-figure data in `exact`.
- **All producer-entered fields are provenance `'self'`.** Editing a `Provenanced` field's value sets its provenance to `'self'`. Promotion to `confirmed`/`verified` is out of scope (S2 vetting). Exception, preserved from the existing live path: setting an exact budget bumps `budgetBand` provenance `self→confirmed`; clearing it reverts `confirmed→self`.
- **IDs via `crypto.randomUUID()`** for new case studies and evidence links (satisfies the server UUID guard; consistent with live projects).
- **Title is the only required field to save.** Save is disabled when `title` is blank; everything else is optional.
- **AFX visuals:** inline styles + `var(--afx-*)` tokens only. Never touch Tailwind `@theme`. Reuse `cockpitUi` primitives (`SectionCard`, `InlineEdit`, `GhostButton`), `ProvenanceBadge`, and `ExactFigureInput`.
- **No test runner.** Verify pure logic with `npx tsx -e "…"` assertions; verify components with `npx tsc --noEmit -p tsconfig.json` (ignore errors only under `.next/dev/types/`; if they appear, `rm -rf .next` and re-run) and `npx next build`.
- **Branch:** `afx-track-record-capture` (already created off `main`; the spec is committed there).

---

### Task 1: Types, constants, and pure case-study helpers

**Files:**
- Modify: `src/lib/afx/types.ts` (add evidence types + `Project.evidence`)
- Modify: `src/lib/afx/constants.ts` (add option constants)
- Create: `src/lib/afx/caseStudy.ts` (pure factory + mutation helpers)

**Interfaces:**
- Consumes: `Project`, `ProjectOutcomes`, `Provenanced`, `ExactMoney`, `ExactFigures` from `./types`; `profileToRows`/`rowsToProfile` from `./persistence` (for the round-trip assertion only).
- Produces:
  - Types: `EvidenceClaim`, `EvidenceLink`; `Project.evidence?: EvidenceLink[]`.
  - Constants: `CASE_STUDY_FORMATS`, `RECOUPMENT_OPTIONS`, `BOND_OPTIONS`, `DISTRIBUTION_TYPES`, `JURISDICTION_OPTIONS`, `EVIDENCE_CLAIM_LABELS`.
  - Functions in `caseStudy.ts`: `newCaseStudy(): Project`; `isCaseStudySavable(s: Project): boolean`; `toggleJurisdiction(s, code): Project`; `setBudgetBand(s, value): Project`; `setOutcome(s, field: 'recoupment'|'bondUsed', value): Project`; `setExactBudget(s, value: ExactMoney|undefined): Project`; `addDistribution(s): Project`; `updateDistribution(s, index, patch): Project`; `removeDistribution(s, index): Project`; `addFestival(s): Project`; `updateFestival(s, index, value): Project`; `removeFestival(s, index): Project`; `addEvidence(s): Project`; `updateEvidence(s, id, patch): Project`; `removeEvidence(s, id): Project`.

- [ ] **Step 1: Add evidence types to `src/lib/afx/types.ts`**

After the `ProjectOutcomes` interface (around line 173), add:

```ts
/** What a piece of evidence substantiates, for the tagged evidence list. */
export type EvidenceClaim = 'budget' | 'recoupment' | 'bond' | 'distribution' | 'festival' | 'other';

export interface EvidenceLink {
  id: string;   // crypto.randomUUID()
  url: string;  // stored as entered
  supports: EvidenceClaim;
}
```

In the `Project` interface (around line 225), add this field after `exact?: ExactFigures;`:

```ts
  /** Producer-attached supporting links, each tagged to the claim it backs.
   *  Non-exact (shareable proof) — persisted in body, NOT in the NDA `exact` column. */
  evidence?: EvidenceLink[];
```

- [ ] **Step 2: Add option constants to `src/lib/afx/constants.ts`**

At the top of `src/lib/afx/constants.ts`, extend the type import to include `EvidenceClaim`:

```ts
import type { Provenance, RatingBand, Visibility, ProducerProfile, EvidenceClaim } from './types';
```

At the end of the file, append:

```ts
/* ---------- Case-study capture (Track Record) ---------- */

export const CASE_STUDY_FORMATS = ['Feature', 'Documentary', 'Series', 'Short'] as const;
export const RECOUPMENT_OPTIONS = ['Fully recouped', 'Partially recouped', 'Not recouped', 'Under NDA'] as const;
export const BOND_OPTIONS = ['Bonded', 'Not bonded'] as const;
export const DISTRIBUTION_TYPES = ['Theatrical', 'SVOD', 'TVOD', 'AVOD', 'Broadcast', 'Festival'] as const;
export const JURISDICTION_OPTIONS = ['ZA', 'NG', 'KE', 'SN'] as const;

export const EVIDENCE_CLAIM_LABELS: Record<EvidenceClaim, string> = {
  budget: 'Budget',
  recoupment: 'Recoupment',
  bond: 'Bond',
  distribution: 'Distribution',
  festival: 'Festival',
  other: 'Other',
};
```

- [ ] **Step 3: Write the failing assertion for the helpers**

Create `src/lib/afx/caseStudy.ts` does not yet exist, so this command fails on import. Run it to confirm:

```bash
npx tsx -e "import {newCaseStudy} from './src/lib/afx/caseStudy'; console.log(newCaseStudy().status)"
```
Expected: FAIL (Cannot find module './src/lib/afx/caseStudy').

- [ ] **Step 4: Create `src/lib/afx/caseStudy.ts`**

```ts
import type { Project, EvidenceLink, ExactMoney, ExactFigures } from './types';

/** A blank case study — all Provenanced fields 'self', empty outcomes/evidence, no exact. */
export function newCaseStudy(): Project {
  return {
    id: crypto.randomUUID(),
    status: 'case_study',
    title: '',
    format: 'Feature',
    role: 'Producer',
    jurisdiction: [],
    budgetBand: { value: '', provenance: 'self' },
    outcomes: {
      recoupment: { value: '', provenance: 'self' },
      bondUsed: { value: '', provenance: 'self' },
      distribution: [],
      festivalsAwards: [],
    },
    evidence: [],
  };
}

/** Minimum to persist a case study: a non-empty title. */
export function isCaseStudySavable(s: Project): boolean {
  return s.title.trim().length > 0;
}

export function toggleJurisdiction(s: Project, code: string): Project {
  const has = s.jurisdiction.includes(code);
  return { ...s, jurisdiction: has ? s.jurisdiction.filter((j) => j !== code) : [...s.jurisdiction, code] };
}

/** Editing a band/outcome value always returns it to self-reported. */
export function setBudgetBand(s: Project, value: string): Project {
  return { ...s, budgetBand: { value, provenance: 'self' } };
}

export function setOutcome(s: Project, field: 'recoupment' | 'bondUsed', value: string): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, [field]: { value, provenance: 'self' } } };
}

/** Set/clear the NDA exact budget; mirrors the live path's band-provenance bump. */
export function setExactBudget(s: Project, value: ExactMoney | undefined): Project {
  const exact: ExactFigures = { ...s.exact };
  if (value === undefined) delete exact.budget;
  else exact.budget = value;

  let budgetBand = s.budgetBand;
  if (value !== undefined && s.budgetBand.provenance === 'self') budgetBand = { ...s.budgetBand, provenance: 'confirmed' };
  if (value === undefined && s.budgetBand.provenance === 'confirmed') budgetBand = { ...s.budgetBand, provenance: 'self' };

  const cleaned: ExactFigures = {};
  if (exact.budget !== undefined) cleaned.budget = exact.budget;
  if (exact.fundingSecured !== undefined) cleaned.fundingSecured = exact.fundingSecured;
  if (exact.capitalStack) cleaned.capitalStack = exact.capitalStack;

  return { ...s, budgetBand, exact: Object.keys(cleaned).length ? cleaned : undefined };
}

export function addDistribution(s: Project): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, distribution: [...s.outcomes.distribution, { name: '', type: 'Theatrical', provenance: 'self' }] } };
}
export function updateDistribution(s: Project, index: number, patch: Partial<{ name: string; type: string }>): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, distribution: s.outcomes.distribution.map((d, i) => (i === index ? { ...d, ...patch, provenance: 'self' as const } : d)) } };
}
export function removeDistribution(s: Project, index: number): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, distribution: s.outcomes.distribution.filter((_, i) => i !== index) } };
}

export function addFestival(s: Project): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, festivalsAwards: [...s.outcomes.festivalsAwards, ''] } };
}
export function updateFestival(s: Project, index: number, value: string): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, festivalsAwards: s.outcomes.festivalsAwards.map((f, i) => (i === index ? value : f)) } };
}
export function removeFestival(s: Project, index: number): Project {
  if (!s.outcomes) return s;
  return { ...s, outcomes: { ...s.outcomes, festivalsAwards: s.outcomes.festivalsAwards.filter((_, i) => i !== index) } };
}

export function addEvidence(s: Project): Project {
  const link: EvidenceLink = { id: crypto.randomUUID(), url: '', supports: 'other' };
  return { ...s, evidence: [...(s.evidence ?? []), link] };
}
export function updateEvidence(s: Project, id: string, patch: Partial<Omit<EvidenceLink, 'id'>>): Project {
  return { ...s, evidence: (s.evidence ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}
export function removeEvidence(s: Project, id: string): Project {
  return { ...s, evidence: (s.evidence ?? []).filter((e) => e.id !== id) };
}
```

- [ ] **Step 5: Run the helper + persistence-isolation assertion**

```bash
npx tsx -e "
import {newCaseStudy, isCaseStudySavable, addEvidence, updateEvidence, removeEvidence, setExactBudget, addDistribution, toggleJurisdiction} from './src/lib/afx/caseStudy';
import {profileToRows, rowsToProfile} from './src/lib/afx/persistence';
let s = newCaseStudy();
console.log('factory status:', s.status, '| savable(blank):', isCaseStudySavable(s));
s = { ...s, title: 'Lagos Nights' };
console.log('savable(titled):', isCaseStudySavable(s));
s = addEvidence(s); const eid = s.evidence[0].id;
s = updateEvidence(s, eid, { url: 'https://imdb.com/x', supports: 'recoupment' });
console.log('evidence:', s.evidence[0].url, s.evidence[0].supports);
s = removeEvidence(s, eid); console.log('evidence after remove:', s.evidence.length);
s = toggleJurisdiction(s, 'ZA'); console.log('juris:', s.jurisdiction.join(','));
s = setExactBudget(s, { amount: 1500000, currency: 'ZAR' });
console.log('exact set → band prov:', s.budgetBand.provenance, '| exact.budget:', s.exact?.budget?.amount);
s = addEvidence({ ...s }); s = updateEvidence(s, s.evidence[0].id, { url: 'https://variety.com/y', supports: 'festival' });
// persistence: evidence rides body, exact stays isolated
const p = { id: 'prod1', name:'', company:'', bio:'', ratingBand:'D', careerStage:'', relationships:[], ndaSigned:false, entityK2:false, consentK4:false, slate: [s] };
const { projects } = profileToRows(p as any);
console.log('body has evidence:', 'evidence' in projects[0].body, '| body has exact:', 'exact' in projects[0].body, '| exact column set:', projects[0].exact != null);
const back = rowsToProfile({ id:'prod1', user_id:'u1', profile: profileToRows(p as any).profile } as any, projects);
console.log('roundtrip evidence preserved:', back.slate[0].evidence?.length === 1);
"
```
Expected output:
```
factory status: case_study | savable(blank): false
savable(titled): true
evidence: https://imdb.com/x recoupment
evidence after remove: 0
juris: ZA
exact set → band prov: confirmed | exact.budget: 1500000
body has evidence: true | body has exact: false | exact column set: true
roundtrip evidence preserved: true
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent (exit 0).

- [ ] **Step 7: Commit**

```bash
git add src/lib/afx/types.ts src/lib/afx/constants.ts src/lib/afx/caseStudy.ts
git commit -m "feat(afx): case-study types, constants & pure helpers (evidence rides body)"
```

---

### Task 2: CaseStudyDrawer component

**Files:**
- Create: `src/components/afx/producer/CaseStudyDrawer.tsx`

**Interfaces:**
- Consumes: all `caseStudy.ts` helpers from Task 1; constants `CASE_STUDY_FORMATS`, `RECOUPMENT_OPTIONS`, `BOND_OPTIONS`, `DISTRIBUTION_TYPES`, `JURISDICTION_OPTIONS`, `EVIDENCE_CLAIM_LABELS`; `InlineEdit`, `GhostButton` from `./cockpitUi`; `ProvenanceBadge`; `ExactFigureInput`; types `Project`, `AfxCurrency`, `EvidenceClaim`.
- Produces: `export default function CaseStudyDrawer(props: CaseStudyDrawerProps)` where
  ```ts
  interface CaseStudyDrawerProps {
    initial: Project;            // blank (add) or a clone (edit)
    isNew: boolean;              // header copy + Remove visibility
    ndaSigned: boolean;
    defaultCurrency: AfxCurrency;
    onSave: (study: Project) => void;   // commit the buffer
    onClose: () => void;                // cancel / backdrop / Esc — discards
    onRemove?: () => void;              // edit mode only
  }
  ```

- [ ] **Step 1: Create `src/components/afx/producer/CaseStudyDrawer.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { Project, AfxCurrency, EvidenceClaim } from '@/lib/afx/types';
import {
  isCaseStudySavable, toggleJurisdiction, setBudgetBand, setOutcome, setExactBudget,
  addDistribution, updateDistribution, removeDistribution,
  addFestival, updateFestival, removeFestival,
  addEvidence, updateEvidence, removeEvidence,
} from '@/lib/afx/caseStudy';
import {
  CASE_STUDY_FORMATS, RECOUPMENT_OPTIONS, BOND_OPTIONS, DISTRIBUTION_TYPES,
  JURISDICTION_OPTIONS, EVIDENCE_CLAIM_LABELS,
} from '@/lib/afx/constants';
import { InlineEdit, GhostButton } from './cockpitUi';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import ExactFigureInput from '@/components/afx/primitives/ExactFigureInput';

const mono = 'var(--afx-mono)';

interface CaseStudyDrawerProps {
  initial: Project;
  isNew: boolean;
  ndaSigned: boolean;
  defaultCurrency: AfxCurrency;
  onSave: (study: Project) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export default function CaseStudyDrawer({ initial, isNew, ndaSigned, defaultCurrency, onSave, onClose, onRemove }: CaseStudyDrawerProps) {
  const [study, setStudy] = useState<Project>(() => structuredClone(initial));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const o = study.outcomes;
  const savable = isCaseStudySavable(study);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(28,29,33,0.42)' }} />
      <aside role="dialog" aria-modal="true" aria-label={isNew ? 'Add case study' : 'Edit case study'}
        style={{ position: 'fixed', zIndex: 89, top: 0, right: 0, height: '100vh', width: 'min(560px,94vw)', background: '#FAF9F7', borderLeft: '1px solid #EAE8E3', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>

        <header style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #EAE8E3', background: 'linear-gradient(180deg,#FCFBF9,#fff)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{isNew ? 'Add case study' : 'Edit case study'}</h2>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', fontSize: 20, lineHeight: 1, color: '#9A9CA3' }}>×</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Identity */}
          <InlineEdit label="Title" value={study.title} placeholder="Project title" onChange={(v) => setStudy((s) => ({ ...s, title: v }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Format">
              <Select value={study.format} options={CASE_STUDY_FORMATS} onChange={(v) => setStudy((s) => ({ ...s, format: v }))} />
            </Field>
            <InlineEdit label="Year" value={study.year != null ? String(study.year) : ''} placeholder="e.g. 2021"
              onChange={(v) => setStudy((s) => ({ ...s, year: v.trim() === '' ? undefined : Number(v.replace(/[^0-9]/g, '')) || undefined }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InlineEdit label="Your role" value={study.role} placeholder="e.g. Producer" onChange={(v) => setStudy((s) => ({ ...s, role: v }))} />
            <InlineEdit label="Genre" value={study.genre ?? ''} placeholder="e.g. Drama" onChange={(v) => setStudy((s) => ({ ...s, genre: v.trim() === '' ? undefined : v }))} />
          </div>
          <Field label="Jurisdiction">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {JURISDICTION_OPTIONS.map((code) => {
                const on = study.jurisdiction.includes(code);
                return (
                  <button key={code} onClick={() => setStudy((s) => toggleJurisdiction(s, code))}
                    style={{ cursor: 'pointer', fontFamily: mono, fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 999, border: `1px solid ${on ? '#1C1D21' : '#E4E2DC'}`, background: on ? '#1C1D21' : '#fff', color: on ? '#fff' : '#9A9CA3' }}>
                    {code}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Budget */}
          <Field label="Budget band">
            <input value={study.budgetBand.value} placeholder="e.g. $1–2M" onChange={(e) => setStudy((s) => setBudgetBand(s, e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={study.budgetBand.provenance} size="sm" /></div>
            <ExactFigureInput value={study.exact?.budget} onCommit={(v) => setStudy((s) => setExactBudget(s, v))} gated={ndaSigned} label="budget" defaultCurrency={defaultCurrency}
              confirmHint={study.budgetBand.provenance === 'confirmed' ? '→ confirmed' : undefined} />
          </Field>

          {/* Outcomes */}
          <Field label="Recoupment">
            <Select value={o?.recoupment.value ?? ''} options={RECOUPMENT_OPTIONS} placeholder="—" onChange={(v) => setStudy((s) => setOutcome(s, 'recoupment', v))} />
          </Field>
          <Field label="Completion bond">
            <Select value={o?.bondUsed.value ?? ''} options={BOND_OPTIONS} placeholder="—" onChange={(v) => setStudy((s) => setOutcome(s, 'bondUsed', v))} />
          </Field>

          {/* Distribution rows */}
          <Field label="Distribution">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(o?.distribution ?? []).map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={d.name} placeholder="Partner / platform" onChange={(e) => setStudy((s) => updateDistribution(s, i, { name: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <Select value={d.type} options={DISTRIBUTION_TYPES} onChange={(v) => setStudy((s) => updateDistribution(s, i, { type: v }))} />
                  <RemoveBtn onClick={() => setStudy((s) => removeDistribution(s, i))} />
                </div>
              ))}
              <GhostButton onClick={() => setStudy((s) => addDistribution(s))} tone="accent">+ Add distribution</GhostButton>
            </div>
          </Field>

          {/* Festivals / awards */}
          <Field label="Festivals / awards">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(o?.festivalsAwards ?? []).map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={f} placeholder="e.g. Toronto 2021 — Official Selection" onChange={(e) => setStudy((s) => updateFestival(s, i, e.target.value))} style={{ ...inputStyle, flex: 1 }} />
                  <RemoveBtn onClick={() => setStudy((s) => removeFestival(s, i))} />
                </div>
              ))}
              <GhostButton onClick={() => setStudy((s) => addFestival(s))} tone="accent">+ Add festival / award</GhostButton>
            </div>
          </Field>

          {/* Tagged evidence */}
          <Field label="Evidence & links">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(study.evidence ?? []).map((e) => (
                <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={e.url} placeholder="https://…" onChange={(ev) => setStudy((s) => updateEvidence(s, e.id, { url: ev.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <Select value={e.supports} options={Object.keys(EVIDENCE_CLAIM_LABELS) as EvidenceClaim[]} labelFor={(k) => EVIDENCE_CLAIM_LABELS[k as EvidenceClaim]}
                    onChange={(v) => setStudy((s) => updateEvidence(s, e.id, { supports: v as EvidenceClaim }))} />
                  <RemoveBtn onClick={() => setStudy((s) => removeEvidence(s, e.id))} />
                </div>
              ))}
              <GhostButton onClick={() => setStudy((s) => addEvidence(s))} tone="accent">+ Add link</GhostButton>
            </div>
          </Field>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: '1px solid #EAE8E3', background: '#fff' }}>
          {!isNew && onRemove ? (
            <button onClick={onRemove} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E3B6AE', background: '#fff', color: '#7A2E2E' }}>Remove</button>
          ) : null}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Cancel</button>
            <button onClick={() => onSave(study)} disabled={!savable}
              style={{ cursor: savable ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C1D21', background: savable ? '#1C1D21' : '#C9C7C1', color: '#fff', opacity: savable ? 1 : 0.8 }}>
              {isNew ? 'Add case study' : 'Save'}
            </button>
          </div>
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

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent (exit 0). If errors appear only under `.next/dev/types/`, `rm -rf .next` and re-run.

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/CaseStudyDrawer.tsx
git commit -m "feat(afx): CaseStudyDrawer — buffer-edited comprehensive case-study form"
```

---

### Task 3: TrackRecordZone rewrite + wire the drawer into ProducerProfileClient

This task changes two files that share one contract (TrackRecordZone's new props and the call site that supplies them), so they land together and the tree is green at task end.

**Files:**
- Modify: `src/components/afx/producer/TrackRecordZone.tsx` (full rewrite of the component)
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx` (drawer state + handlers, retire inline-edit machinery)

**Interfaces:**
- Consumes: `ProducerProfile`, `Project` from `@/lib/afx/types`; `caseStudies` from `@/lib/afx/aggregates`; `SectionCard`, `GhostButton` from `./cockpitUi`; `ProvenanceBadge`; `newCaseStudy` from `@/lib/afx/caseStudy`; `CaseStudyDrawer` from Task 2.
- Produces: TrackRecordZone prop shape `{ draft, onAdd, onEdit }` (old props `onOutcomeField`/`reverted`/`onExact`/`ndaSigned`/`defaultCurrency` REMOVED — the drawer owns editing); a fully wired Track Record where Add/Edit opens the drawer, Save upserts into `draft.slate`, Remove drops from it.

- [ ] **Step 1: Replace `src/components/afx/producer/TrackRecordZone.tsx` entirely**

```tsx
'use client';

import type { ProducerProfile, Project } from '@/lib/afx/types';
import { caseStudies } from '@/lib/afx/aggregates';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { SectionCard, GhostButton } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export default function TrackRecordZone({ draft, onAdd, onEdit }: Props) {
  const studies = caseStudies(draft);
  return (
    <SectionCard title="Track Record" hint="case studies — your proof, judged for experience"
      action={<GhostButton onClick={onAdd} tone="accent">+ Add case study</GhostButton>}>
      {studies.length === 0 ? (
        <Empty onAdd={onAdd} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
          {studies.map((s) => <SummaryCard key={s.id} study={s} onEdit={() => onEdit(s.id)} />)}
        </div>
      )}
    </SectionCard>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed #DAD7D0', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 13.5, color: '#5E6066' }}>Add your past projects — these are the case studies funders use to judge your experience.</div>
      <GhostButton onClick={onAdd} tone="accent">+ Add your first case study</GhostButton>
    </div>
  );
}

function SummaryCard({ study, onEdit }: { study: Project; onEdit: () => void }) {
  const o = study.outcomes;
  const distCount = o?.distribution.length ?? 0;
  const festCount = o?.festivalsAwards.filter((f) => f.trim() !== '').length ?? 0;
  const evCount = study.evidence?.length ?? 0;
  return (
    <button onClick={onEdit}
      style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{study.title || 'Untitled case study'}</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>
          {[study.year, study.format, study.role].filter(Boolean).join(' · ')}
        </div>
      </div>

      <Row label="Budget" value={study.budgetBand.value || '—'} badge={<ProvenanceBadge provenance={study.budgetBand.provenance} size="sm" />} />
      {o ? <Row label="Recoupment" value={o.recoupment.value || '—'} badge={<ProvenanceBadge provenance={o.recoupment.provenance} size="sm" />} /> : null}
      {o ? <Row label="Bond" value={o.bondUsed.value || '—'} /> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
        {distCount > 0 ? <Chip>{distCount} distribution</Chip> : null}
        {festCount > 0 ? <Chip>{festCount} festival{festCount > 1 ? 's' : ''}</Chip> : null}
        {evCount > 0 ? <Chip>{evCount} link{evCount > 1 ? 's' : ''}</Chip> : null}
      </div>

      <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-accent)', marginTop: 2 }}>Edit →</span>
    </button>
  );
}

function Row({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div>
      <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
        <span style={{ fontSize: 12.5, color: '#5E6066' }}>{value}</span>
        {badge}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.04em', color: '#5E6066', background: '#F2F0EB', border: '1px solid #EAE8E3', borderRadius: 999, padding: '2px 8px' }}>{children}</span>;
}
```

(The component file itself is error-free, but `tsc` will not be green until the steps below update the call site in the same task.)

- [ ] **Step 2: Add imports to `ProducerProfileClient.tsx`**

In `src/app/afx/producer/ProducerProfileClient.tsx`, add near the other imports (after line 18):

```ts
import CaseStudyDrawer from '@/components/afx/producer/CaseStudyDrawer';
import { newCaseStudy } from '@/lib/afx/caseStudy';
```

- [ ] **Step 3: Add drawer state and handlers**

After the existing state declarations (after line 30, the `const [counter, setCounter] = useState(0);` line), add:

```ts
  const [editing, setEditing] = useState<{ study: Project; isNew: boolean } | null>(null);

  const onAddCaseStudy = () => setEditing({ study: newCaseStudy(), isNew: true });
  const onEditCaseStudy = (id: string) => {
    const found = (draft.slate ?? []).find((p) => p.id === id);
    if (found) setEditing({ study: structuredClone(found), isNew: false });
  };
  const onSaveCaseStudy = (study: Project) => {
    setDraft((d) => {
      const list = d.slate ?? [];
      const exists = list.some((p) => p.id === study.id);
      return { ...d, slate: exists ? list.map((p) => (p.id === study.id ? study : p)) : [...list, study] };
    });
    setEditing(null);
  };
  const onRemoveCaseStudy = (id: string) => {
    setDraft((d) => ({ ...d, slate: (d.slate ?? []).filter((p) => p.id !== id) }));
    setEditing(null);
  };
```

- [ ] **Step 4: Remove the retired inline-edit machinery**

Delete the now-unused `onOutcomeField` function (lines ~38-52), the `flagRevert` function (line ~32), the `reverted` state (line ~29), and the `isDowngrade` const (line ~21). These were only consumed by the old TrackRecordZone inline editing.

Verify nothing else references them first:
```bash
grep -nE 'onOutcomeField|flagRevert|reverted|isDowngrade' src/app/afx/producer/ProducerProfileClient.tsx
```
After deletion, the only remaining matches must be inside the code you are deleting. `onExact`, `liveProjects`, `meetsCorePackaging` stay (LiveSlateZone still uses `onExact`).

- [ ] **Step 5: Update the TrackRecordZone call site**

Replace the existing `<TrackRecordZone … />` line (line ~145) with:

```tsx
            <TrackRecordZone draft={draft} onAdd={onAddCaseStudy} onEdit={onEditCaseStudy} />
```

- [ ] **Step 6: Render the drawer**

Immediately before the `{saveStatus !== 'idle' && (` block (around line 162), add:

```tsx
      {editing ? (
        <CaseStudyDrawer
          initial={editing.study}
          isNew={editing.isNew}
          ndaSigned={!!draft.ndaSigned}
          defaultCurrency={localCurrency}
          onSave={onSaveCaseStudy}
          onClose={() => setEditing(null)}
          onRemove={editing.isNew ? undefined : () => onRemoveCaseStudy(editing.study.id)}
        />
      ) : null}
```

- [ ] **Step 7: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent (exit 0). If errors only under `.next/dev/types/`, `rm -rf .next` and re-run.

Run: `npx next build 2>&1 | grep -E '/afx/producer|error'`
Expected: `/afx/producer` present, no line containing `error`.

- [ ] **Step 8: Live end-to-end persistence check**

Confirm a case study with evidence round-trips through the real persist path under RLS (no UI). This reuses the service-role admin + a per-user JWT, mirroring the S1 verification, and cleans up after itself.

```bash
cat > .tr_verify.mjs <<'EOF'
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false, autoRefreshToken:false} });
const EMAIL='afx-tr-test@example.com', PWD='Afx-Tr-Test-7741!';
async function findUser(email){let p=1;for(;;){const{data}=await admin.auth.admin.listUsers({page:p,perPage:200});const u=data.users.find(x=>(x.email||'').toLowerCase()===email.toLowerCase());if(u)return u;if(data.users.length<200)return null;p++;}}
async function cleanup(){const u=await findUser(EMAIL);if(u){await admin.from('afx_producers').delete().eq('user_id',u.id);await admin.auth.admin.deleteUser(u.id);}await admin.from('afx_invites').delete().ilike('email',EMAIL);}
let ok=false;
try{
  await cleanup();
  await admin.from('afx_invites').insert({email:EMAIL});
  await admin.auth.admin.createUser({email:EMAIL,password:PWD,email_confirm:true});
  const c=createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  await c.auth.signInWithPassword({email:EMAIL,password:PWD});
  const {data:prod}=await c.rpc('redeem_afx_invite').single();
  const projId=crypto.randomUUID(), evId=crypto.randomUUID();
  await c.from('afx_projects').insert({ id:projId, producer_id:prod.id, status:'case_study', deal_ref:null,
    body:{ id:projId, status:'case_study', title:'Lagos Nights', format:'Feature', role:'Producer', jurisdiction:['ZA'],
      budgetBand:{value:'$1–2M',provenance:'self'},
      outcomes:{recoupment:{value:'Fully recouped',provenance:'self'},bondUsed:{value:'Bonded',provenance:'self'},distribution:[{name:'Netflix',type:'SVOD',provenance:'self'}],festivalsAwards:['TIFF 2021']},
      evidence:[{id:evId,url:'https://imdb.com/x',supports:'recoupment'}] },
    exact:{ budget:{ amount:1500000, currency:'ZAR' } } });
  const {data:row}=await c.from('afx_projects').select('body, exact').eq('id',projId).single();
  const bodyHasExact='exact' in row.body;
  const ev=row.body?.evidence?.[0];
  console.log('case study persisted    :', row.body?.title==='Lagos Nights');
  console.log('evidence in body        :', ev?.url==='https://imdb.com/x' && ev?.supports==='recoupment');
  console.log('exact isolated (col set):', row.exact?.budget?.amount===1500000, '| body has exact:', bodyHasExact);
  ok = row.body?.title==='Lagos Nights' && ev?.supports==='recoupment' && row.exact?.budget?.amount===1500000 && !bodyHasExact;
}catch(e){console.error('ERROR:',e.message);}
finally{ try{await cleanup();console.log('cleanup done');}catch(e){console.error('cleanup err',e.message);} }
console.log(ok?'\n===== Track Record persist VERIFIED =====':'\n===== CHECK FAILED =====');
process.exit(ok?0:1);
EOF
node .tr_verify.mjs ; rm -f .tr_verify.mjs
```
Expected:
```
case study persisted    : true
evidence in body        : true
exact isolated (col set): true | body has exact: false
cleanup done

===== Track Record persist VERIFIED =====
```

- [ ] **Step 9: Commit (both files — they share the prop contract)**

```bash
git add src/components/afx/producer/TrackRecordZone.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): Track Record drawer wiring — add/edit/remove case studies persist via autosave"
```

---

## Self-Review

**Spec coverage:**
- §2.1 "+ Add case study" action + empty CTA → Task 3 (`action` slot + `Empty` CTA). ✔
- §2.2 right-side drawer, list visible behind → Task 2 (`CaseStudyDrawer` fixed right panel, backdrop) + Task 3 (render). ✔
- §2.3 buffer; Save commits + autosaves, Cancel discards → Task 2 (internal `study` buffer, `onSave(study)`/`onClose`) + Task 3 (`onSaveCaseStudy` upsert). ✔
- §2.4 all comprehensive fields + tagged evidence → Task 1 (types/helpers) + Task 2 (drawer fields). ✔
- §2.5 remove → Task 2 (`Remove` button) + Task 3 (`onRemoveCaseStudy`). NOTE: spec §5 says "reuse the ConfirmArchive-style confirm"; this plan removes directly from the drawer's explicit Remove button (a deliberate destructive action already inside an editing context). If a separate confirm modal is wanted, it is a small addition — flagged for the reviewer, not silently dropped.
- §2.6 persists across reload + aggregates + Funder Preview → Task 3 (autosave via existing path; `caseStudies`/`computeAggregates`/`toFunderView` already read `draft.slate`). ✔
- §2.7 exact isolation unchanged; evidence non-exact in body → Task 1 (`setExactBudget` keeps exact isolated; evidence in body) + Task 1 Step 5 + Task 3 Step 8 assertions. ✔
- §3 no migration; types only → Task 1. ✔
- §6 title-only required; provenance self; URLs as-entered → Task 1 (`isCaseStudySavable`, `setBudgetBand`/`setOutcome` force self) + Task 2 (Save disabled when blank). ✔

**Placeholder scan:** none — every step has complete code or exact commands with expected output.

**Type consistency:** `Project.evidence?: EvidenceLink[]` defined in Task 1, consumed in Tasks 2-3. `newCaseStudy`/`isCaseStudySavable`/`setExactBudget`/evidence+distribution+festival helpers defined in Task 1, consumed in Tasks 2-3. `TrackRecordZone` props change to `{ draft, onAdd, onEdit }` and its call site are both updated in Task 3 (same task → tree stays green). `CaseStudyDrawer` props (`initial`, `isNew`, `ndaSigned`, `defaultCurrency`, `onSave`, `onClose`, `onRemove?`) defined in Task 2, supplied in Task 3. The retired `onOutcomeField`/`reverted`/`flagRevert`/`isDowngrade` are removed in Task 3 Step 4 — `onExact` is deliberately retained for `LiveSlateZone`.

**Deliberate cross-task tsc break:** Task 3 leaves `tsc` failing at the ProducerProfileClient call site (old props); Task 4 fixes it. This is called out in Task 3 Step 2 so a reviewer doesn't treat it as a regression. Tasks 3 and 4 must land together to reach a green tree.
