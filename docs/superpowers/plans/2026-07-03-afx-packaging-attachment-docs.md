# Packaging Attachment Documents (CV + Contract) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each Live Slate packaging attachment two NDA-gated fixed document slots — CV and Contract — stored confidentially and linked to the attachment.

**Architecture:** Documents live in the confidential `Project.docs[]` (already stripped from the funder view) tagged with a `packagingId` + a packaging-specific category, because `ask.packaging` is funder-visible. Each attachment gets a stable `id`. A lean per-slot uploader reuses the existing `/api/afx/documents/*` routes; row removal and slot-clear hard-delete storage.

**Tech Stack:** Next.js App Router (`'use client'`), TypeScript, inline `var(--afx-*)` styling, Supabase Storage via existing routes, `npx tsx` assertions (no test runner).

## Global Constraints

- **No test runner.** Verify with `npx tsc --noEmit -p tsconfig.json`, `npx next build`, and `npx tsx` assertion scripts written at repo root and **deleted after** the task's commit.
- **Confidential isolation:** per-attachment docs live in `Project.docs[]` linked by `packagingId` — NEVER stored on the `PackagingAttachment` object (packaging is funder-visible). `funderView.ts` is NOT changed (it already strips `Project.docs`).
- **Category keys are exactly** `talent_cv` and `talent_contract` (labels "CV" / "Contract"). They go in `PACKAGING_DOC_CATEGORIES`, and **must NOT be added to `LIVE_DOCUMENT_CATEGORIES`** (which drives the project-level uploader dropdown).
- **Hard-delete** on slot Clear and on packaging-row removal (call `/api/afx/documents/delete` per linked doc, then drop from state).
- **NDA-gated** (`ndaSigned`), **live drawer only** (case studies have no `ask.packaging`).
- **One NDA** — reuse the existing gate; no new NDA/scope/migration.
- **Immutability:** every pure mutation returns a new `Project`; never mutate inputs.
- **Commit** after each task with the exact message shown.

---

## File Structure

- `src/lib/afx/types.ts` — `PackagingAttachment.id?`, `AfxDocument.packagingId?`, widen `DocumentCategory` (Task 1)
- `src/lib/afx/documents.ts` — `talent_cv`/`talent_contract` labels + `PACKAGING_DOC_CATEGORIES` (Task 1)
- `src/app/api/afx/documents/upload/route.ts` — accept packaging categories + echo `packagingId` (Task 2)
- `src/lib/afx/liveProject.ts` — `addPackaging` id, `removePackaging` drops linked docs, `backfillPackagingIds`, `setPackagingDoc`/`clearPackagingDoc` (Task 3)
- `src/components/afx/producer/PackagingDocSlot.tsx` — **new** lean single-slot uploader (Task 4)
- `src/components/afx/producer/LiveProjectDrawer.tsx` — backfill on load, project-level doc filter, per-row slots, async row-remove (Task 5)

---

### Task 1: Types + constants for packaging documents

**Files:**
- Modify: `src/lib/afx/types.ts`
- Modify: `src/lib/afx/documents.ts`
- Test: `assert-packaging-cats.ts` (repo root, temporary)

**Interfaces:**
- Produces:
  - `PackagingAttachment.id?: string`
  - `AfxDocument.packagingId?: string`
  - `DocumentCategory` widened with `'talent_cv' | 'talent_contract'`
  - `PACKAGING_DOC_CATEGORIES: readonly DocumentCategory[]` = `['talent_cv', 'talent_contract']`
  - `DOCUMENT_CATEGORY_LABELS` / `LIVE_DOCUMENT_CATEGORY_LABELS` gain `talent_cv`/`talent_contract` keys

- [ ] **Step 1: Write the failing assertion script**

Create `assert-packaging-cats.ts` at repo root:

```ts
import { PACKAGING_DOC_CATEGORIES, LIVE_DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, LIVE_DOCUMENT_CATEGORY_LABELS } from './src/lib/afx/documents';

const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };

assert(JSON.stringify(PACKAGING_DOC_CATEGORIES) === JSON.stringify(['talent_cv', 'talent_contract']), 'PACKAGING_DOC_CATEGORIES exact');
// packaging categories must NOT pollute the project-level uploader dropdown
for (const c of PACKAGING_DOC_CATEGORIES) {
  assert(!(LIVE_DOCUMENT_CATEGORIES as readonly string[]).includes(c), `${c} must not be in LIVE_DOCUMENT_CATEGORIES`);
}
// both label records cover the new keys
assert(DOCUMENT_CATEGORY_LABELS.talent_cv === 'CV' && DOCUMENT_CATEGORY_LABELS.talent_contract === 'Contract', 'DOCUMENT_CATEGORY_LABELS keys');
assert(LIVE_DOCUMENT_CATEGORY_LABELS.talent_cv === 'CV' && LIVE_DOCUMENT_CATEGORY_LABELS.talent_contract === 'Contract', 'LIVE_DOCUMENT_CATEGORY_LABELS keys');
console.log('OK packaging cats');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx assert-packaging-cats.ts`
Expected: FAIL — `PACKAGING_DOC_CATEGORIES` export not found.

- [ ] **Step 3: Widen types in `types.ts`**

Add `id?` to `PackagingAttachment`:

```ts
export interface PackagingAttachment {
  /** Stable id for linking confidential CV/Contract docs (see AfxDocument.packagingId).
   *  Optional for back-compat; the live drawer backfills missing ids on load. */
  id?: string;
  role: string;
  name: string;
  status: 'signed' | 'soft-hold' | 'wishlist';
}
```

Add `packagingId?` to `AfxDocument` (right after `category`):

```ts
  /** When set, this doc belongs to the packaging attachment with this id
   *  (a talent CV/Contract). Absent = a project-level document. Confidential either way. */
  packagingId?: string;
```

Widen the `DocumentCategory` union — append the two literals:

```ts
export type DocumentCategory =
  | 'budget' | 'chain_of_title' | 'waterfall' | 'financing_agreement'
  | 'distribution_agreement' | 'completion_bond' | 'audit' | 'other'
  | 'talent_deal' | 'script' | 'deck' | 'soft_funding_letter' | 'sales_estimate'
  | 'talent_cv' | 'talent_contract';
```

- [ ] **Step 4: Add labels + `PACKAGING_DOC_CATEGORIES` in `documents.ts`**

Add the two keys to BOTH `DOCUMENT_CATEGORY_LABELS` and `LIVE_DOCUMENT_CATEGORY_LABELS` (both are `Record<DocumentCategory, string>`, so both must cover every union member):

```ts
  talent_cv: 'CV',
  talent_contract: 'Contract',
```

Add the dedicated list (near `LIVE_DOCUMENT_CATEGORIES`):

```ts
/** Per-attachment packaging document categories (CV + Contract). Kept SEPARATE from
 *  LIVE_DOCUMENT_CATEGORIES so they never appear in the project-level uploader dropdown;
 *  the upload route accepts them for the case_study scope (see upload/route.ts). */
export const PACKAGING_DOC_CATEGORIES: readonly DocumentCategory[] = ['talent_cv', 'talent_contract'] as const;
```

- [ ] **Step 5: Run the assertion + typecheck**

Run: `npx tsx assert-packaging-cats.ts`
Expected: `OK packaging cats`

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 6: Delete temp script and commit**

```bash
rm assert-packaging-cats.ts
git add src/lib/afx/types.ts src/lib/afx/documents.ts
git commit -m "feat(afx): packaging-attachment doc types + talent_cv/talent_contract categories"
```

---

### Task 2: Upload route — accept packaging categories + echo `packagingId`

**Files:**
- Modify: `src/app/api/afx/documents/upload/route.ts`

**Interfaces:**
- Consumes: `PACKAGING_DOC_CATEGORIES` (Task 1).
- Produces: the `case_study` scope now validates packaging categories; the returned `AfxDocument` carries `packagingId` when the form supplied it.

- [ ] **Step 1: Add the import**

The existing import from `@/lib/afx/documents` pulls `ALLOWED_DOC_TYPES, MAX_DOC_BYTES, DOCUMENT_CATEGORIES, ENTITY_DOCUMENT_CATEGORIES, INDIVIDUAL_DOCUMENT_CATEGORIES, LIVE_DOCUMENT_CATEGORIES`. Add `PACKAGING_DOC_CATEGORIES` to that list.

- [ ] **Step 2: Widen the `case_study` allow-list**

The `allowedCats` assignment currently ends its `case_study` (else) branch with `[...DOCUMENT_CATEGORIES, ...LIVE_DOCUMENT_CATEGORIES]`. Change that branch to:

```ts
    : [...DOCUMENT_CATEGORIES, ...LIVE_DOCUMENT_CATEGORIES, ...PACKAGING_DOC_CATEGORIES];
```

The `entity` and `individual` branches remain unchanged.

- [ ] **Step 3: Read + echo `packagingId`**

Near the other `form.get(...)` reads at the top of the handler, add:

```ts
  const packagingId = form.get('packagingId') as string | null;
```

Where the response `doc` object is built (the `const doc: AfxDocument = { ... }`), add the `packagingId` field only when present, so project-level docs stay clean:

```ts
  const doc: AfxDocument = {
    id: docId, path, filename: file.name, category: category as DocumentCategory | EntityDocumentCategory | IndividualDocumentCategory,
    sizeBytes: file.size, contentType: file.type, uploadedAt: new Date().toISOString(),
    ...(packagingId ? { packagingId } : {}),
  };
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/afx/documents/upload/route.ts
git commit -m "feat(afx): upload route accepts packaging doc categories + echoes packagingId"
```

---

### Task 3: Pure logic — attachment ids + linked-doc lifecycle

**Files:**
- Modify: `src/lib/afx/liveProject.ts`
- Test: `assert-packaging-logic.ts` (repo root, temporary)

**Interfaces:**
- Consumes: `Project`, `AfxDocument`, `DocumentCategory` (types); existing `addDocument` re-export.
- Produces:
  - `addPackaging(p)` now sets `id`
  - `removePackaging(p, index)` now also drops `Project.docs` linked to the removed row
  - `backfillPackagingIds(p: Project): Project`
  - `setPackagingDoc(p: Project, packagingId: string, category: DocumentCategory, doc: AfxDocument): Project`
  - `clearPackagingDoc(p: Project, packagingId: string, category: DocumentCategory): Project`

- [ ] **Step 1: Write the failing assertion script**

Create `assert-packaging-logic.ts` at repo root:

```ts
import type { Project, AfxDocument } from './src/lib/afx/types';
import { addPackaging, removePackaging, backfillPackagingIds, setPackagingDoc, clearPackagingDoc } from './src/lib/afx/liveProject';

const base = (): Project => ({
  id: 'p1', status: 'live', title: 'T', format: 'Feature', role: 'Producer', jurisdiction: [],
  budgetBand: { value: '', provenance: 'self' },
  ask: { logline: '', stage: 'development', commercialPath: '', fundingSecuredBand: '', capitalStack: { equityPct: 0, softPct: 0, debtPct: 0, gapPct: 100 }, packaging: [] },
});
const doc = (id: string, packagingId: string | undefined, category: AfxDocument['category']): AfxDocument =>
  ({ id, path: `x/${id}`, filename: `${id}.pdf`, category, sizeBytes: 1, contentType: 'application/pdf', uploadedAt: '', ...(packagingId ? { packagingId } : {}) });
const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };

// addPackaging sets a non-empty id
const a1 = addPackaging(base());
assert(!!a1.ask!.packaging[0].id, 'addPackaging sets id');

// backfillPackagingIds: assigns to id-less rows, leaves existing untouched
const withRows: Project = { ...base(), ask: { ...base().ask!, packaging: [{ role: 'D', name: 'X', status: 'wishlist' }, { id: 'keep', role: 'W', name: 'Y', status: 'wishlist' }] } };
const filled = backfillPackagingIds(withRows);
assert(!!filled.ask!.packaging[0].id && filled.ask!.packaging[0].id !== 'keep', 'backfill assigns id-less');
assert(filled.ask!.packaging[1].id === 'keep', 'backfill leaves existing id');
assert(withRows.ask!.packaging[0].id === undefined, 'backfill immutable (original untouched)');

// setPackagingDoc: replaces same (packagingId, category), keeps others
let p: Project = { ...base(), ask: { ...base().ask!, packaging: [{ id: 'row1', role: 'D', name: 'X', status: 'wishlist' }] },
  docs: [doc('proj', undefined, 'budget'), doc('oldcv', 'row1', 'talent_cv')] };
p = setPackagingDoc(p, 'row1', 'talent_cv', doc('newcv', 'row1', 'talent_cv'));
assert(p.docs!.some((d) => d.id === 'newcv') && !p.docs!.some((d) => d.id === 'oldcv'), 'setPackagingDoc replaces same slot');
assert(p.docs!.some((d) => d.id === 'proj'), 'setPackagingDoc keeps project-level doc');

// clearPackagingDoc: removes only that (packagingId, category)
p = setPackagingDoc(p, 'row1', 'talent_contract', doc('con', 'row1', 'talent_contract'));
p = clearPackagingDoc(p, 'row1', 'talent_cv');
assert(!p.docs!.some((d) => d.id === 'newcv'), 'clearPackagingDoc removes cv');
assert(p.docs!.some((d) => d.id === 'con'), 'clearPackagingDoc keeps contract');

// removePackaging drops linked docs, keeps unrelated + project-level
const q0: Project = { ...base(), ask: { ...base().ask!, packaging: [{ id: 'row1', role: 'D', name: 'X', status: 'wishlist' }, { id: 'row2', role: 'W', name: 'Y', status: 'wishlist' }] },
  docs: [doc('proj', undefined, 'budget'), doc('cv1', 'row1', 'talent_cv'), doc('cv2', 'row2', 'talent_cv')] };
const q1 = removePackaging(q0, 0);
assert(q1.ask!.packaging.length === 1 && q1.ask!.packaging[0].id === 'row2', 'removePackaging removes the row');
assert(!q1.docs!.some((d) => d.id === 'cv1'), 'removePackaging drops linked doc');
assert(q1.docs!.some((d) => d.id === 'cv2') && q1.docs!.some((d) => d.id === 'proj'), 'removePackaging keeps others');
assert(q0.docs!.length === 3, 'removePackaging immutable (original docs intact)');

console.log('OK packaging logic');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx assert-packaging-logic.ts`
Expected: FAIL — `backfillPackagingIds` (etc.) not exported.

- [ ] **Step 3: Update `liveProject.ts`**

Add imports at the top (the file already imports from `./types`): ensure `AfxDocument` and `DocumentCategory` are imported.

```ts
import type { Project, SoftFundingApplication, PackagingAttachment, AfxDocument, DocumentCategory } from './types';
```

Change `addPackaging` so new rows get an id:

```ts
export function addPackaging(p: Project): Project {
  if (!p.ask) return p;
  const row: PackagingAttachment = { id: crypto.randomUUID(), role: '', name: '', status: 'wishlist' };
  return { ...p, ask: { ...p.ask, packaging: [...p.ask.packaging, row] } };
}
```

Replace `removePackaging` so it also drops linked docs:

```ts
export function removePackaging(p: Project, index: number): Project {
  if (!p.ask) return p;
  const removed = p.ask.packaging[index];
  const packaging = p.ask.packaging.filter((_, i) => i !== index);
  let next: Project = { ...p, ask: { ...p.ask, packaging } };
  if (removed?.id && p.docs) {
    next = { ...next, docs: p.docs.filter((d) => d.packagingId !== removed.id) };
  }
  return next;
}
```

Append the new helpers:

```ts
/** Assign a stable id to any packaging row lacking one (back-compat for legacy rows).
 *  Returns the same object when nothing needed changing. */
export function backfillPackagingIds(p: Project): Project {
  if (!p.ask) return p;
  let changed = false;
  const packaging = p.ask.packaging.map((a) => {
    if (a.id) return a;
    changed = true;
    return { ...a, id: crypto.randomUUID() };
  });
  return changed ? { ...p, ask: { ...p.ask, packaging } } : p;
}

/** Attach/replace the single doc in a packaging slot (one doc per packagingId+category). */
export function setPackagingDoc(p: Project, packagingId: string, category: DocumentCategory, doc: AfxDocument): Project {
  const others = (p.docs ?? []).filter((d) => !(d.packagingId === packagingId && d.category === category));
  return { ...p, docs: [...others, doc] };
}

/** Remove the doc in a packaging slot (state only; the caller hard-deletes storage). */
export function clearPackagingDoc(p: Project, packagingId: string, category: DocumentCategory): Project {
  return { ...p, docs: (p.docs ?? []).filter((d) => !(d.packagingId === packagingId && d.category === category)) };
}
```

- [ ] **Step 4: Run the assertion + typecheck**

Run: `npx tsx assert-packaging-logic.ts`
Expected: `OK packaging logic`

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5: Delete temp script and commit**

```bash
rm assert-packaging-logic.ts
git add src/lib/afx/liveProject.ts
git commit -m "feat(afx): packaging attachment ids + linked-doc set/clear/backfill logic"
```

---

### Task 4: `PackagingDocSlot` component

**Files:**
- Create: `src/components/afx/producer/PackagingDocSlot.tsx`

**Interfaces:**
- Consumes: `AfxDocument`, `DocumentCategory` (types); `ALLOWED_DOC_TYPES`, `MAX_DOC_BYTES` (documents).
- Produces:
  - `interface PackagingDocSlotProps { projectId: string; packagingId: string; category: 'talent_cv' | 'talent_contract'; label: string; doc?: AfxDocument; onReplace: (doc: AfxDocument) => void; onClear: () => void }`
  - `export default function PackagingDocSlot(props): JSX.Element`

Mirrors the upload / sign-to-view / delete fetch logic already in `AfxDocumentUpload.tsx`. The parent renders it only when the NDA is signed.

- [ ] **Step 1: Create the component**

Create `src/components/afx/producer/PackagingDocSlot.tsx`:

```tsx
'use client';

import { useRef, useState } from 'react';
import type { AfxDocument } from '@/lib/afx/types';
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';

interface PackagingDocSlotProps {
  projectId: string;
  packagingId: string;
  category: 'talent_cv' | 'talent_contract';
  label: string;
  doc?: AfxDocument;
  onReplace: (doc: AfxDocument) => void;
  onClear: () => void;
}

function prettySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PackagingDocSlot({ projectId, packagingId, category, label, doc, onReplace, onClear }: PackagingDocSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setError('');
    if (!ALLOWED_DOC_TYPES.includes(file.type)) { setError('Unsupported type (PDF, PNG, JPEG, DOCX, XLSX)'); return; }
    if (file.size > MAX_DOC_BYTES) { setError(`File is ${prettySize(file.size)} — max 25 MB`); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caseStudyId', projectId);
      fd.append('category', category);
      fd.append('packagingId', packagingId);
      const res = await fetch('/api/afx/documents/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? `Upload failed (${res.status})`);
      else onReplace(json.doc as AfxDocument);
    } catch (e) {
      setError(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — check your connection');
    } finally {
      setBusy(false);
    }
  }

  async function view() {
    if (!doc) return;
    setError('');
    try {
      const res = await fetch('/api/afx/documents/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  async function clear() {
    if (!doc) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/afx/documents/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }),
      });
      if (res.ok) onClear();
      else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Could not remove document');
      }
    } catch { setError('Could not remove document'); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A7A99F' }}>{label}</span>
      {doc ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</span>
          <button onClick={view} style={linkBtn}>View</button>
          <button onClick={clear} disabled={busy} aria-label={`Clear ${label}`} style={{ cursor: busy ? 'wait' : 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 6, width: 26, height: 26, color: '#9A9CA3', fontSize: 14, lineHeight: 1 }}>×</button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          style={{ alignSelf: 'flex-start', cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 11.5, fontWeight: 600, padding: '5px 10px', borderRadius: 7, border: '1px solid #D6D8F5', background: '#fff', color: 'var(--afx-accent)' }}>
          {busy ? 'Uploading…' : `↑ ${label}`}
        </button>
      )}
      {error ? <span style={{ fontSize: 10.5, color: '#c0392b' }}>{error}</span> : null}
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 6,
  padding: '5px 9px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: '#5E6066',
};
```

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/PackagingDocSlot.tsx
git commit -m "feat(afx): PackagingDocSlot — single NDA-gated CV/Contract upload slot"
```

---

### Task 5: Wire CV + Contract slots into `LiveProjectDrawer`

**Files:**
- Modify: `src/components/afx/producer/LiveProjectDrawer.tsx`

**Interfaces:**
- Consumes: `backfillPackagingIds`, `setPackagingDoc`, `clearPackagingDoc`, `removePackaging` (Task 3); `PackagingDocSlot` (Task 4).

- [ ] **Step 1: Imports + backfill ids on load**

Add to the existing `@/lib/afx/liveProject` import: `backfillPackagingIds`, `setPackagingDoc`, `clearPackagingDoc` (alongside the current `removePackaging`, etc.). Add a component import:

```ts
import PackagingDocSlot from './PackagingDocSlot';
```

Change the initial state so any legacy id-less packaging rows get ids:

```ts
  const [proj, setProj] = useState<Project>(() => backfillPackagingIds(structuredClone(initial)));
```

Add a doc-error state near the other `useState`s (used by the async row-remove):

```ts
  const [docError, setDocError] = useState('');
```

- [ ] **Step 2: Add the async row-remove handler**

Add near the other handlers inside the component (after `setExact` / before the `return`):

```ts
  const removeAttachment = async (index: number) => {
    setDocError('');
    const row = proj.ask?.packaging[index];
    const linked = row?.id ? (proj.docs ?? []).filter((d) => d.packagingId === row.id) : [];
    for (const d of linked) {
      try {
        const res = await fetch('/api/afx/documents/delete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: d.path }),
        });
        if (!res.ok) { const j = await res.json().catch(() => ({})); setDocError(j.error ?? 'Could not remove attachment documents'); return; }
      } catch { setDocError('Could not remove attachment documents — check your connection'); return; }
    }
    setProj((p) => removePackaging(p, index));
  };
```

- [ ] **Step 3: Replace the Packaging Field with per-row slots + async remove**

Replace the entire `<Field label="Packaging"> … </Field>` block (currently the `ask.packaging.map` row list) with:

```tsx
              <Field label="Packaging">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ask.packaging.map((a, i) => (
                    <div key={a.id ?? i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input value={a.role} placeholder="Role" onChange={(e) => setProj((p) => updatePackaging(p, i, { role: e.target.value }))} style={{ ...inputStyle, width: 90 }} />
                        <input value={a.name} placeholder="Name" onChange={(e) => setProj((p) => updatePackaging(p, i, { name: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                        <Select value={a.status} options={['signed', 'soft-hold', 'wishlist'] as const} onChange={(v) => setProj((p) => updatePackaging(p, i, { status: v as 'signed' | 'soft-hold' | 'wishlist' }))} />
                        <RemoveBtn onClick={() => removeAttachment(i)} />
                      </div>
                      {ndaSigned && a.id ? (
                        <div style={{ display: 'flex', gap: 12, paddingLeft: 4 }}>
                          <PackagingDocSlot projectId={proj.id} packagingId={a.id} category="talent_cv" label="CV"
                            doc={(proj.docs ?? []).find((d) => d.packagingId === a.id && d.category === 'talent_cv')}
                            onReplace={(doc) => setProj((p) => setPackagingDoc(p, a.id!, 'talent_cv', doc))}
                            onClear={() => setProj((p) => clearPackagingDoc(p, a.id!, 'talent_cv'))} />
                          <PackagingDocSlot projectId={proj.id} packagingId={a.id} category="talent_contract" label="Contract"
                            doc={(proj.docs ?? []).find((d) => d.packagingId === a.id && d.category === 'talent_contract')}
                            onReplace={(doc) => setProj((p) => setPackagingDoc(p, a.id!, 'talent_contract', doc))}
                            onClear={() => setProj((p) => clearPackagingDoc(p, a.id!, 'talent_contract'))} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                  <GhostButton onClick={() => setProj((p) => addPackaging(p))} tone="accent">+ Add attachment</GhostButton>
                  {docError ? <span style={{ fontSize: 11, color: '#c0392b' }}>{docError}</span> : null}
                </div>
              </Field>
```

- [ ] **Step 4: Filter project-level docs so per-attachment docs don't double-list**

In the "Supporting documents" `<AfxDocumentUpload .../>` call, change the `docs` prop to exclude packaging-linked docs:

```tsx
                docs={(proj.docs ?? []).filter((d) => !d.packagingId)}
```

Leave `onAdd`/`onUpdate`/`onRemove` as they are (project-level docs carry no `packagingId`; `removeDocument`/`updateDocument` operate by id and are unaffected).

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean (note `a.id!` non-null assertions are guarded by the `a.id ?` render condition).

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/afx/producer/LiveProjectDrawer.tsx
git commit -m "feat(afx): wire CV + Contract slots into packaging rows (async hard-delete on remove)"
```

---

## Manual verification (after all tasks, on prod post-deploy)

On Gerhard's producer account at `/afx/producer` (NDA signed), open a live project's drawer:
1. A packaging row shows **CV** and **Contract** slots beneath role/name/status.
2. Upload a PDF to CV and another to Contract → filenames show with View · ×.
3. Close & re-open the drawer → both filenames rehydrate (persisted).
4. Confirm neither appears in the project-level **Supporting documents** list.
5. **Clear** the CV slot → it returns to the "↑ CV" button (storage hard-deleted).
6. **Remove** the whole packaging row → the row disappears and its Contract doc is gone (hard-deleted).
7. Toggle **Funder preview** → no document metadata is visible.

---

## Self-Review notes (author)

- **Spec coverage:** two fixed slots (Task 4/5), confidential storage via `Project.docs` + `packagingId` (Tasks 1,3,5), attachment `id` + backfill (Tasks 1,3,5), categories `talent_cv`/`talent_contract` kept out of `LIVE_DOCUMENT_CATEGORIES` (Task 1), route accepts them + echoes `packagingId` (Task 2), hard-delete on clear (Task 4) and on row-remove (Task 5), project-level uploader filters packaging docs (Task 5), no `funderView` change, live drawer only. ✔
- **Type consistency:** `packagingId`, `talent_cv`/`talent_contract`, `PACKAGING_DOC_CATEGORIES`, `backfillPackagingIds`/`setPackagingDoc`/`clearPackagingDoc`, `PackagingDocSlot` props used consistently across tasks.
- **Confidentiality:** docs never stored on `PackagingAttachment`; `Project.docs` is already funder-stripped; `packaging.id` is non-sensitive.
