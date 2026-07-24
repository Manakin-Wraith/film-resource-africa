# AFX Producer Cockpit — Slate Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a producer create, edit, and delete a `Slate` (portfolio grouping a subset of their live projects) from the cockpit UI at `/afx/producer`, using the exact same draft/autosave/zone/drawer architecture every other cockpit section already uses.

**Architecture:** A new pure-logic module (`src/lib/afx/slate.ts`, mirroring `src/lib/afx/caseStudy.ts`) provides `newSlate()`/`isSlateSavable()`/mutation helpers. A new `SlateDrawer.tsx` (mirroring `LiveProjectDrawer.tsx`) is the edit form. A new `SlatesZone.tsx` (mirroring `LiveSlateZone.tsx`) is the list/summary section. `ProducerProfileClient.tsx` wires them into its existing `draft` state + `useDebouncedAutosave(draft, persistProfileAction)` loop — no new save path, no new server action, no database migration (`slates` already flows through the `afx_producers.profile` jsonb column, shipped in the prior funder-marketplace slice).

**Tech Stack:** TypeScript, Next.js App Router client components (`'use client'`), inline `var(--afx-*)`-based styling — matches existing cockpit conventions exactly.

## Global Constraints

- **No database migration, no new server action.** `ProducerProfile.slates?: Slate[]` already exists and already persists via the existing `persistProfileAction` → `persistProfile` path (confirmed: `slates` is not in the destructured exclusion list in `profileToRows`, so it rides the `...profile` spread automatically).
- **Minimum slate size: 2 projects.** `isSlateSavable` (Task 1) must require `projectIds.length >= 2` — enforced by disabling the drawer's Save button, never server-side.
- **A slate also needs a non-empty `name`** to be savable (same pattern as `isCaseStudySavable` requiring a non-empty title).
- **At-most-one-slate membership is enforced in the drawer UI**: given `otherSlates` (every slate on the producer except the one being edited), a project already present in another slate's `projectIds` renders as a disabled, unchecked checkbox with a "Already in [name]" note — it cannot be checked into two slates at once through this UI.
- **Every econ band edit sets `provenance: 'self'`**, matching `budgetBand`'s existing edit behavior in `LiveProjectDrawer.tsx` and `setBudgetBand` in `caseStudy.ts`. `securedBand` has no provenance (plain string on the `Slate` type) and is edited via a controlled `<select>` over the existing `FUNDING_SECURED_BANDS` constant, not free text.
- **Checking a project into a slate defaults its risk tier to `'mid'`**; unchecking removes both the project id and its risk-tier entry.
- **Deleting a slate never touches `draft.slate`** (the producer's actual project list) — it is purely a `draft.slates` array operation.
- **No test runner exists in this repo** (no vitest/jest, no config files). Verification is `npx tsc --noEmit -p tsconfig.json`, a temporary `npx tsx` assertion script for the pure module (Task 1 only, deleted before the final commit), `npx next build`, and — because this feature, unlike the funder-marketplace render, is reachable end-to-end without seed data (it's the producer's own account) — a manual dev-server walkthrough at the end of Task 3.

**Codebase facts (verified):**
- `Slate`/`RiskTier`/`FunderMarketSlateRow` already exist (`src/lib/afx/types.ts`, `src/lib/afx/funderMarketplace.ts`) from the prior funder-marketplace slice — this plan does not touch either file.
- `ProducerProfileClient.tsx` holds `const [draft, setDraft] = useState<ProducerProfile>(...)`, autosaves via `const saveStatus = useDebouncedAutosave(draft, persistProfileAction);`, and every other editable collection (`draft.slate` for case studies/live projects, `draft.entityDocs`, etc.) follows the same `onAdd`/`onEdit`(open drawer)/`onSave`(patch array, close drawer)/`onRemove` handler shape — see `onAddCaseStudy`/`onEditCaseStudy`/`onSaveCaseStudy`/`onRemoveCaseStudy` (lines 48-64) as the exact template this plan's `onAddSlate`/`onEditSlate`/`onSaveSlate`/`onRemoveSlate` follow.
- `cockpitUi.tsx` exports `SectionCard`, `InlineEdit`, `InlineSelect`, `GhostButton` only. `Field`, `Select`, `RemoveBtn`, and `inputStyle` are **not** exported — every drawer file (`LiveProjectDrawer.tsx`, `CaseStudyDrawer.tsx`) defines its own local copies. `SlateDrawer.tsx` follows the same established duplication, not a shared extraction.
- `liveProjects(p: { slate?: Project[] })` (from `src/lib/afx/aggregates.ts`) returns all `status === 'live'` projects — this is the exact set `LiveSlateZone` already renders and the set `SlateDrawer`'s membership checklist uses (not filtered to funder-screenable projects).
- `FUNDING_SECURED_BANDS` and `EVIDENCE_CLAIM_LABELS` already exist in `src/lib/afx/constants.ts`.

---

### Task 1: Pure module `src/lib/afx/slate.ts` — `newSlate`, `isSlateSavable`, mutation helpers

**Files:**
- Create: `src/lib/afx/slate.ts`
- Test (temporary, deleted in the final step): `slate.test.mts` at repo root

**Interfaces:**
- Consumes: `Slate`, `RiskTier`, `EvidenceLink` from `./types`.
- Produces:
  - `function newSlate(): Slate`
  - `function isSlateSavable(s: Slate): boolean`
  - `function toggleSlateProject(s: Slate, projectId: string): Slate`
  - `function setSlateRiskTier(s: Slate, projectId: string, tier: RiskTier): Slate`
  - `function setSlateBand(s: Slate, field: 'totalBudgetBand' | 'askBand' | 'targetIRR' | 'portfolioROI', value: string): Slate`
  - `function setSlateSecuredBand(s: Slate, value: string): Slate`
  - `function addSlateEvidence(s: Slate): Slate`
  - `function updateSlateEvidence(s: Slate, id: string, patch: Partial<Omit<EvidenceLink, 'id'>>): Slate`
  - `function removeSlateEvidence(s: Slate, id: string): Slate`

- [ ] **Step 1: Write the failing test**

Create `slate.test.mts` at the repo root:

```ts
import assert from 'node:assert/strict';
import {
  newSlate, isSlateSavable, toggleSlateProject, setSlateRiskTier,
  setSlateBand, setSlateSecuredBand, addSlateEvidence, updateSlateEvidence, removeSlateEvidence,
} from './src/lib/afx/slate';

// newSlate: sensible empty defaults, all provenance 'self'.
const fresh = newSlate();
assert.equal(fresh.name, '');
assert.equal(fresh.stage, 'packaging');
assert.deepEqual(fresh.projectIds, []);
assert.deepEqual(fresh.riskTiers, {});
assert.equal(fresh.totalBudgetBand.provenance, 'self');
assert.equal(fresh.askBand.provenance, 'self');
assert.equal(fresh.targetIRR.provenance, 'self');
assert.equal(fresh.portfolioROI.provenance, 'self');
assert.equal(fresh.securedBand, '');
assert.deepEqual(fresh.evidence, []);
assert.ok(fresh.id.length > 0);

// isSlateSavable: needs a name AND >=2 projects.
assert.equal(isSlateSavable(fresh), false);
const named = { ...fresh, name: 'My Slate' };
assert.equal(isSlateSavable(named), false); // still 0 projects
const oneProject = { ...named, projectIds: ['p1'] };
assert.equal(isSlateSavable(oneProject), false); // only 1
const twoProjects = { ...named, projectIds: ['p1', 'p2'] };
assert.equal(isSlateSavable(twoProjects), true);
const unnamed = { ...fresh, projectIds: ['p1', 'p2'] };
assert.equal(isSlateSavable(unnamed), false); // 2 projects but no name

// toggleSlateProject: add sets risk tier to 'mid'; toggling again removes both.
let s = newSlate();
s = toggleSlateProject(s, 'p1');
assert.deepEqual(s.projectIds, ['p1']);
assert.equal(s.riskTiers['p1'], 'mid');
s = toggleSlateProject(s, 'p2');
assert.deepEqual(s.projectIds, ['p1', 'p2']);
s = toggleSlateProject(s, 'p1'); // remove p1
assert.deepEqual(s.projectIds, ['p2']);
assert.equal('p1' in s.riskTiers, false);
assert.equal(s.riskTiers['p2'], 'mid');

// setSlateRiskTier: overrides an existing entry.
s = setSlateRiskTier(s, 'p2', 'high-upside');
assert.equal(s.riskTiers['p2'], 'high-upside');

// setSlateBand: sets value + forces provenance to 'self' on every edit, for all four fields.
let b = newSlate();
b = setSlateBand(b, 'totalBudgetBand', 'R50-100M');
assert.deepEqual(b.totalBudgetBand, { value: 'R50-100M', provenance: 'self' });
b = setSlateBand(b, 'askBand', 'R25-50M');
assert.deepEqual(b.askBand, { value: 'R25-50M', provenance: 'self' });
b = setSlateBand(b, 'targetIRR', '20-30%');
assert.deepEqual(b.targetIRR, { value: '20-30%', provenance: 'self' });
b = setSlateBand(b, 'portfolioROI', '2-2.5x');
assert.deepEqual(b.portfolioROI, { value: '2-2.5x', provenance: 'self' });

// setSlateSecuredBand: plain string, no provenance wrapper.
b = setSlateSecuredBand(b, '40-60% secured');
assert.equal(b.securedBand, '40-60% secured');

// Evidence: add/update/remove.
let e = newSlate();
e = addSlateEvidence(e);
assert.equal(e.evidence?.length, 1);
const evId = e.evidence![0].id;
assert.equal(e.evidence![0].url, '');
assert.equal(e.evidence![0].supports, 'other');
e = updateSlateEvidence(e, evId, { url: 'https://example.com', supports: 'budget' });
assert.equal(e.evidence![0].url, 'https://example.com');
assert.equal(e.evidence![0].supports, 'budget');
e = removeSlateEvidence(e, evId);
assert.equal(e.evidence?.length, 0);

console.log('slate: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx slate.test.mts`
Expected: FAIL — module `./src/lib/afx/slate` not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/afx/slate.ts`:

```ts
import type { Slate, RiskTier, EvidenceLink } from './types';

/** A blank slate — all Provenanced econ fields 'self', empty membership, no evidence. */
export function newSlate(): Slate {
  return {
    id: crypto.randomUUID(),
    name: '',
    genreStrategy: '',
    stage: 'packaging',
    projectIds: [],
    riskTiers: {},
    totalBudgetBand: { value: '', provenance: 'self' },
    securedBand: '',
    askBand: { value: '', provenance: 'self' },
    targetIRR: { value: '', provenance: 'self' },
    portfolioROI: { value: '', provenance: 'self' },
    distributionStrategy: '',
    evidence: [],
  };
}

/** Minimum to persist a slate: a non-empty name and at least 2 member projects
 *  — a single-project "portfolio" would undermine the feature's own pitch. */
export function isSlateSavable(s: Slate): boolean {
  return s.name.trim().length > 0 && s.projectIds.length >= 2;
}

/** Toggle a project's membership. Adding it defaults its risk tier to 'mid';
 *  removing it drops both the id and its risk-tier entry. */
export function toggleSlateProject(s: Slate, projectId: string): Slate {
  const has = s.projectIds.includes(projectId);
  if (has) {
    const riskTiers = { ...s.riskTiers };
    delete riskTiers[projectId];
    return { ...s, projectIds: s.projectIds.filter((id) => id !== projectId), riskTiers };
  }
  return { ...s, projectIds: [...s.projectIds, projectId], riskTiers: { ...s.riskTiers, [projectId]: 'mid' } };
}

export function setSlateRiskTier(s: Slate, projectId: string, tier: RiskTier): Slate {
  return { ...s, riskTiers: { ...s.riskTiers, [projectId]: tier } };
}

/** Editing any of the four provenanced econ bands always returns it to self-reported. */
export function setSlateBand(s: Slate, field: 'totalBudgetBand' | 'askBand' | 'targetIRR' | 'portfolioROI', value: string): Slate {
  return { ...s, [field]: { value, provenance: 'self' } };
}

/** securedBand carries no provenance — it's a plain controlled-vocabulary string. */
export function setSlateSecuredBand(s: Slate, value: string): Slate {
  return { ...s, securedBand: value };
}

export function addSlateEvidence(s: Slate): Slate {
  const link: EvidenceLink = { id: crypto.randomUUID(), url: '', supports: 'other' };
  return { ...s, evidence: [...(s.evidence ?? []), link] };
}
export function updateSlateEvidence(s: Slate, id: string, patch: Partial<Omit<EvidenceLink, 'id'>>): Slate {
  return { ...s, evidence: (s.evidence ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}
export function removeSlateEvidence(s: Slate, id: string): Slate {
  return { ...s, evidence: (s.evidence ?? []).filter((e) => e.id !== id) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx slate.test.mts`
Expected: `slate: all assertions passed` printed, exit code 0.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 6: Delete the temporary test file and commit**

```bash
rm slate.test.mts
git add src/lib/afx/slate.ts
git commit -m "feat(afx): add slate.ts pure helpers for the producer slate editor

newSlate/isSlateSavable/toggleSlateProject/setSlateRiskTier/setSlateBand/
setSlateSecuredBand/evidence helpers, mirroring the existing caseStudy.ts
pattern — pure, no I/O, consumed by the upcoming SlateDrawer component."
```

---

### Task 2: `SlateDrawer.tsx` — the slate edit form

**Files:**
- Create: `src/components/afx/producer/SlateDrawer.tsx`

**Interfaces:**
- Consumes: `Slate`, `RiskTier`, `Project` from `@/lib/afx/types`; `newSlate` is NOT used here (the caller supplies `initial`); `isSlateSavable`, `toggleSlateProject`, `setSlateRiskTier`, `setSlateBand`, `setSlateSecuredBand`, `addSlateEvidence`, `updateSlateEvidence`, `removeSlateEvidence` from `@/lib/afx/slate` (Task 1); `FUNDING_SECURED_BANDS`, `EVIDENCE_CLAIM_LABELS` from `@/lib/afx/constants`; `InlineEdit`, `GhostButton` from `./cockpitUi`; `ProvenanceBadge` from `@/components/afx/primitives/ProvenanceBadge`.
- Produces: `export default function SlateDrawer({ initial, isNew, liveProjects, otherSlates, onSave, onClose, onRemove }: SlateDrawerProps): JSX.Element` where

```ts
interface SlateDrawerProps {
  initial: Slate;
  isNew: boolean;
  liveProjects: Project[];
  otherSlates: Slate[];
  onSave: (slate: Slate) => void;
  onClose: () => void;
  onRemove?: () => void;
}
```

- [ ] **Step 1: Create the file**

Create `src/components/afx/producer/SlateDrawer.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { Slate, RiskTier, Project, EvidenceClaim } from '@/lib/afx/types';
import {
  isSlateSavable, toggleSlateProject, setSlateRiskTier,
  setSlateBand, setSlateSecuredBand,
  addSlateEvidence, updateSlateEvidence, removeSlateEvidence,
} from '@/lib/afx/slate';
import { FUNDING_SECURED_BANDS, EVIDENCE_CLAIM_LABELS } from '@/lib/afx/constants';
import { InlineEdit, GhostButton } from './cockpitUi';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';

const mono = 'var(--afx-mono)';

const SLATE_STAGE_OPTIONS = ['packaging', 'financing', 'ready'] as const;
const RISK_TIER_OPTIONS = ['low', 'mid', 'high-upside'] as const;
const RISK_TIER_LABEL: Record<RiskTier, string> = { low: 'Low risk', mid: 'Mid', 'high-upside': 'High-upside' };

interface SlateDrawerProps {
  initial: Slate;
  isNew: boolean;
  liveProjects: Project[];
  otherSlates: Slate[];
  onSave: (slate: Slate) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export default function SlateDrawer({ initial, isNew, liveProjects, otherSlates, onSave, onClose, onRemove }: SlateDrawerProps) {
  const [slate, setSlate] = useState<Slate>(() => structuredClone(initial));
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const savable = isSlateSavable(slate);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(28,29,33,0.42)' }} />
      <aside role="dialog" aria-modal="true" aria-label={isNew ? 'Add portfolio' : 'Edit portfolio'}
        style={{ position: 'fixed', zIndex: 89, top: 0, right: 0, height: '100vh', width: 'min(560px,94vw)', background: '#FAF9F7', borderLeft: '1px solid #EAE8E3', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>

        <header style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #EAE8E3', background: 'linear-gradient(180deg,#FCFBF9,#fff)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{isNew ? 'Add portfolio' : 'Edit portfolio'}</h2>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', fontSize: 20, lineHeight: 1, color: '#9A9CA3' }}>×</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <InlineEdit label="Name" value={slate.name} placeholder="e.g. 5 Mid-Budget African Thrillers" onChange={(v) => setSlate((s) => ({ ...s, name: v }))} />
          <InlineEdit label="Genre strategy" value={slate.genreStrategy} placeholder="e.g. Commercial thrillers" onChange={(v) => setSlate((s) => ({ ...s, genreStrategy: v }))} />

          <Field label="Stage">
            <Select value={slate.stage} options={SLATE_STAGE_OPTIONS} onChange={(v) => setSlate((s) => ({ ...s, stage: v as Slate['stage'] }))} />
          </Field>

          <Field label="Total budget band">
            <input value={slate.totalBudgetBand.value} placeholder="e.g. R50–100M" onChange={(e) => setSlate((s) => setSlateBand(s, 'totalBudgetBand', e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={slate.totalBudgetBand.provenance} size="sm" /></div>
          </Field>

          <Field label="Secured">
            <Select value={slate.securedBand} options={FUNDING_SECURED_BANDS} placeholder="—" onChange={(v) => setSlate((s) => setSlateSecuredBand(s, v))} />
          </Field>

          <Field label="Investor ask band">
            <input value={slate.askBand.value} placeholder="e.g. R25–50M" onChange={(e) => setSlate((s) => setSlateBand(s, 'askBand', e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={slate.askBand.provenance} size="sm" /></div>
          </Field>

          <Field label="Target IRR">
            <input value={slate.targetIRR.value} placeholder="e.g. 20–30%" onChange={(e) => setSlate((s) => setSlateBand(s, 'targetIRR', e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={slate.targetIRR.provenance} size="sm" /></div>
          </Field>

          <Field label="Portfolio ROI">
            <input value={slate.portfolioROI.value} placeholder="e.g. 2–2.5x" onChange={(e) => setSlate((s) => setSlateBand(s, 'portfolioROI', e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={slate.portfolioROI.provenance} size="sm" /></div>
          </Field>

          <InlineEdit label="Distribution strategy" value={slate.distributionStrategy} placeholder="e.g. Pre-aligned with streamer + sales agent" onChange={(v) => setSlate((s) => ({ ...s, distributionStrategy: v }))} />

          <Field label="Evidence & links">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(slate.evidence ?? []).map((e) => (
                <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={e.url} placeholder="https://…" onChange={(ev) => setSlate((s) => updateSlateEvidence(s, e.id, { url: ev.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <Select value={e.supports} options={Object.keys(EVIDENCE_CLAIM_LABELS) as EvidenceClaim[]} labelFor={(k) => EVIDENCE_CLAIM_LABELS[k as EvidenceClaim]}
                    onChange={(v) => setSlate((s) => updateSlateEvidence(s, e.id, { supports: v as EvidenceClaim }))} />
                  <RemoveBtn onClick={() => setSlate((s) => removeSlateEvidence(s, e.id))} />
                </div>
              ))}
              <GhostButton onClick={() => setSlate((s) => addSlateEvidence(s))} tone="accent">+ Add link</GhostButton>
            </div>
          </Field>

          <Field label="Member projects">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {liveProjects.length === 0 ? (
                <span style={{ fontSize: 12.5, color: '#9A9CA3' }}>No live projects yet — add one in Live Slate first.</span>
              ) : liveProjects.map((p) => {
                const claimedBy = otherSlates.find((s) => s.projectIds.includes(p.id));
                const checked = slate.projectIds.includes(p.id);
                const disabled = !!claimedBy && !checked;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={checked} disabled={disabled}
                      onChange={() => setSlate((s) => toggleSlateProject(s, p.id))} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: checked ? 600 : 400, color: disabled ? '#C9C7C1' : '#1C1D21' }}>{p.title || 'Untitled'}</span>
                    {claimedBy ? <span style={{ fontSize: 10.5, color: '#9A9CA3' }}>Already in {claimedBy.name || 'another slate'}</span> : null}
                    {checked ? (
                      <Select value={slate.riskTiers[p.id] ?? 'mid'} options={RISK_TIER_OPTIONS} labelFor={(t) => RISK_TIER_LABEL[t]}
                        onChange={(v) => setSlate((s) => setSlateRiskTier(s, p.id, v as RiskTier))} />
                    ) : null}
                  </div>
                );
              })}
            </div>
            {slate.projectIds.length < 2 ? (
              <div style={{ fontSize: 11, color: '#9A9CA3', marginTop: 8 }}>Select at least 2 projects to save this portfolio.</div>
            ) : null}
          </Field>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: '1px solid #EAE8E3', background: '#fff' }}>
          {confirmingRemove ? (
            <>
              <span style={{ fontFamily: 'var(--afx-body)', fontSize: 13, color: '#5E6066', flex: 1 }}>Delete this portfolio?</span>
              <button onClick={() => setConfirmingRemove(false)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Cancel</button>
              <button onClick={onRemove} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #7A2E2E', background: '#7A2E2E', color: '#fff' }}>Delete</button>
            </>
          ) : (
            <>
              {onRemove ? (
                <button onClick={() => setConfirmingRemove(true)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E3B6AE', background: '#fff', color: '#7A2E2E' }}>Delete</button>
              ) : null}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Close</button>
                <button onClick={() => onSave(slate)} disabled={!savable}
                  style={{ cursor: savable ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C1D21', background: savable ? '#1C1D21' : '#C9C7C1', color: '#fff', opacity: savable ? 1 : 0.8 }}
                  title={savable ? '' : 'A name and at least 2 projects are required'}>
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

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors. (This component isn't wired into any page yet, so an unused-import/unused-component lint would not fail typecheck — `tsc --noEmit` only checks types, not usage.)

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/SlateDrawer.tsx
git commit -m "feat(afx): add SlateDrawer, the producer slate edit form

Mirrors LiveProjectDrawer/CaseStudyDrawer chrome exactly. Enforces
at-most-one-slate membership (disabled checkbox + 'Already in X' note)
and the 2-project minimum (disabled Save). Not yet wired into the
cockpit — that's Task 3."
```

---

### Task 3: `SlatesZone.tsx` + wire into `ProducerProfileClient.tsx`

**Files:**
- Create: `src/components/afx/producer/SlatesZone.tsx`
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx`

**Interfaces:**
- Consumes: `ProducerProfile`, `Slate` from `@/lib/afx/types`; `newSlate` from `@/lib/afx/slate` (Task 1); `SectionCard`, `GhostButton` from `./cockpitUi`; `SlateDrawer` from `./SlateDrawer` (Task 2); `liveProjects` from `@/lib/afx/aggregates` (already imported in `ProducerProfileClient.tsx`).
- Produces: `export default function SlatesZone({ draft, onAddSlate, onOpenSlate }: Props): JSX.Element` where

```ts
interface Props {
  draft: ProducerProfile;
  onAddSlate: () => void;
  onOpenSlate: (id: string) => void;
}
```

Note: `SlatesZone`/`SlateCard` deliberately has **no** direct delete button. `SlateDrawer` (Task 2) is the only path to deleting a slate, because it already has a confirm step (`confirmingRemove` → "Delete this portfolio?"). A card-level quick-delete with no confirmation would be an inconsistent, needlessly destructive shortcut around that — every other destructive action in this cockpit (archiving a project, removing a case study) goes through a confirm step first.

- [ ] **Step 1: Create `SlatesZone.tsx`**

Create `src/components/afx/producer/SlatesZone.tsx`:

```tsx
'use client';

import type { ProducerProfile, Slate } from '@/lib/afx/types';
import { SectionCard, GhostButton } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onAddSlate: () => void;
  onOpenSlate: (id: string) => void;
}

export default function SlatesZone({ draft, onAddSlate, onOpenSlate }: Props) {
  const slates = draft.slates ?? [];
  return (
    <SectionCard title="Portfolios" hint="group live projects into a diversified pitch" action={<GhostButton onClick={onAddSlate} tone="accent">+ New slate</GhostButton>}>
      {slates.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9A9CA3' }}>
          Group live projects into a portfolio to pitch funders diversification, not a single bet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {slates.map((s) => <SlateCard key={s.id} slate={s} onOpen={() => onOpenSlate(s.id)} />)}
        </div>
      )}
    </SectionCard>
  );
}

function SlateCard({ slate, onOpen }: { slate: Slate; onOpen: () => void }) {
  return (
    <div style={{ border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{slate.name || 'Untitled portfolio'}</div>
      <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3' }}>{[slate.genreStrategy, `${slate.projectIds.length} film${slate.projectIds.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</div>
      <span style={{ alignSelf: 'flex-start', fontFamily: mono, fontSize: 10, fontWeight: 700, color: '#1C1D21', background: '#F6F5F2', border: '1px solid #EAE8E3', borderRadius: 6, padding: '2px 7px' }}>{slate.stage}</span>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <GhostButton onClick={onOpen} tone="accent">Edit</GhostButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `ProducerProfileClient.tsx`**

In `src/app/afx/producer/ProducerProfileClient.tsx`, make the following four changes.

**2a. Imports.** Add `Slate` to the existing type-only import (currently `import type { ProducerProfile, Project, AfxCurrency, VettingSubmission, EntityDocumentCategory, IndividualDocumentCategory, AfxDocument } from '@/lib/afx/types';`):

```ts
import type { ProducerProfile, Project, Slate, AfxCurrency, VettingSubmission, EntityDocumentCategory, IndividualDocumentCategory, AfxDocument } from '@/lib/afx/types';
```

Add two new component imports and one new helper import, alongside the existing ones (e.g. right after `import LiveSlateZone from '@/components/afx/producer/LiveSlateZone';`):

```ts
import SlatesZone from '@/components/afx/producer/SlatesZone';
import SlateDrawer from '@/components/afx/producer/SlateDrawer';
```

And alongside the existing `import { newCaseStudy } from '@/lib/afx/caseStudy';`:

```ts
import { newSlate } from '@/lib/afx/slate';
```

**2b. State.** Add new state right after the existing `const [editingLive, setEditingLive] = useState<Project | null>(null);`:

```ts
const [editingSlate, setEditingSlate] = useState<{ slate: Slate; isNew: boolean } | null>(null);
```

**2c. Handlers.** Add new handlers right after the existing `onSaveLiveProject` function (which ends with `setEditingLive(null); };`):

```ts
const onAddSlate = () => setEditingSlate({ slate: newSlate(), isNew: true });
const onEditSlate = (id: string) => {
  const found = (draft.slates ?? []).find((s) => s.id === id);
  if (found) setEditingSlate({ slate: structuredClone(found), isNew: false });
};
const onSaveSlate = (slate: Slate) => {
  setDraft((d) => {
    const list = d.slates ?? [];
    const exists = list.some((s) => s.id === slate.id);
    return { ...d, slates: exists ? list.map((s) => (s.id === slate.id ? slate : s)) : [...list, slate] };
  });
  setEditingSlate(null);
};
const onRemoveSlate = (id: string) => {
  setDraft((d) => ({ ...d, slates: (d.slates ?? []).filter((s) => s.id !== id) }));
  setEditingSlate(null);
};
```

**2d. Render.** Insert `<SlatesZone ... />` between the existing `<TrackRecordZone .../>` and `<LiveSlateZone .../>` lines:

```tsx
            <TrackRecordZone draft={draft} submissions={submissions} onAdd={onAddCaseStudy} onEdit={onEditCaseStudy} />
            <SlatesZone draft={draft} onAddSlate={onAddSlate} onOpenSlate={onEditSlate} />
            <LiveSlateZone draft={draft} onAddProject={onAddProject} onArchive={onArchive} onOpenProject={onOpenLiveProject} />
```

`onRemoveSlate` is still defined in `ProducerProfileClient.tsx` (step 2c) — it's used only as the drawer's `onRemove` prop (below), not passed to `SlatesZone`.

Add the drawer render right after the existing `{editingLive ? ( <LiveProjectDrawer ... /> ) : null}` block (before the `{actionError ? (...)` block):

```tsx
      {editingSlate ? (
        <SlateDrawer
          initial={editingSlate.slate}
          isNew={editingSlate.isNew}
          liveProjects={liveProjects(draft)}
          otherSlates={(draft.slates ?? []).filter((s) => s.id !== editingSlate.slate.id)}
          onSave={onSaveSlate}
          onClose={() => setEditingSlate(null)}
          onRemove={editingSlate.isNew ? undefined : () => onRemoveSlate(editingSlate.slate.id)}
        />
      ) : null}
```

`liveProjects` is already imported in this file (`import { liveProjects } from '@/lib/afx/aggregates';`) — do not add a second import.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Build**

Run: `npx next build`
Expected: build succeeds with no new errors/warnings attributable to `SlatesZone.tsx`, `SlateDrawer.tsx`, or `ProducerProfileClient.tsx`.

- [ ] **Step 5: Manual dev-server walkthrough**

This feature is reachable end-to-end without seed data (it's the producer's own account), unlike the funder-marketplace render. Run `npm run dev`, sign in as a producer with at least 2 live projects (create them via the existing "+ Add live project" flow in Live Slate if needed), and confirm:
- The new "Portfolios" section appears between Track Record and Live Slate, showing the empty-state copy.
- "+ New slate" opens the drawer; Save is disabled until a name is entered and 2+ projects are checked.
- Checking a project defaults its risk tier to "Mid"; the tier dropdown appears only for checked projects.
- Saving closes the drawer, the new slate card appears in Portfolios, and the autosave toast ("Saving…" → "Saved") fires.
- Creating a second slate and trying to check a project already in the first slate shows it disabled with "Already in [name]".
- Editing a slate and deleting it removes the card; the underlying live projects are unaffected and still appear in Live Slate.
- Reloading the page (triggering a fresh server fetch) shows the same slates — confirming the autosave actually persisted to `afx_producers.profile`.

- [ ] **Step 6: Commit**

```bash
git add src/components/afx/producer/SlatesZone.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): wire the slate editor into the producer cockpit

Adds the Portfolios zone between Track Record and Live Slate, and the
add/edit/save/remove handlers that patch draft.slates through the
existing autosave loop. Manually verified end-to-end in the dev
server: create, edit, delete, cross-slate exclusivity, persistence
across reload."
```
