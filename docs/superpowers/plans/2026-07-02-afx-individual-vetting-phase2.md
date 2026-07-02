# AFX Individual Vetting (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an individual (freelance) vetting path — CV + professional links — that mirrors entity vetting end-to-end, gated behind a new staff-only `individual_verified_at` marker.

**Architecture:** Parallels entity vetting exactly: same `afx_vetting_submissions` table (new `kind='individual'`), same document pipeline (`scope='individual'`), same staff queue/drill-down, a new `IndividualVettingPanel` mirroring `EntityVettingPanel`, and a new isolated column pair (`individual_docs`, `individual_verified_at`) with the existing anti-forge trigger extended to guard the new marker.

**Tech Stack:** Next.js App Router (client + server), TypeScript, Supabase (service-role admin), inline `var(--afx-*)` styling.

## Global Constraints

- CV is **NOT** NDA-gated (only individual scope skips the NDA check; entity + case_study still require it).
- Professional links are a fixed set — `imdb`, `linkedin`, `portfolio` — stored in the profile blob.
- Staff verify **whole-submission**: Approve sets `individual_verified_at`; no per-item provenance.
- Readiness `isIndividualVettingReady` = `entityK2 === true` AND a `cv` document present.
- `individual_verified_at` is staff-only, forgery-blocked by the DB trigger; `individual_docs` is isolated like `entity_docs` (stripped from the profile blob, locked while a submission is open).
- No test runner — verify with `npx tsc --noEmit -p tsconfig.json` + `npx next build`; Task 1 adds a temp `npx tsx` assertion (deleted, not committed); Task 6 is a live gate run after the USER applies the migration on prod.
- The migration is applied by the USER via the Supabase Dashboard (MCP can't reach the prod project). Code compiles/builds without it; it's only needed for the live gate + runtime.

---

### Task 1: Migration file + type & lib foundations

**Files:**
- Create: `supabase/migrations/20260702_afx_individual_vetting.sql`
- Modify: `src/lib/afx/types.ts`, `src/lib/afx/documents.ts`, `src/lib/afx/vetting.ts`

**Interfaces:**
- Produces: `IndividualDocumentCategory`; `VettingKind` incl `'individual'`; `ProducerProfile.individualDocs/individualVerifiedAt/individualLinks`; `INDIVIDUAL_DOCUMENT_CATEGORIES`, `INDIVIDUAL_DOCUMENT_CATEGORY_LABELS`, `REQUIRED_INDIVIDUAL_DOCUMENT_CATEGORIES`, `missingRequiredIndividualDocs`, `isIndividualVettingReady`; `openIndividualSubmission`, `latestIndividualSubmission`.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260702_afx_individual_vetting.sql`:

```sql
-- AFX individual vetting (Phase 2): CV/links verification for freelance producers.

-- Isolated columns (never inside the profile JSONB blob), parallel to the entity lanes.
alter table public.afx_producers add column if not exists individual_docs jsonb;
alter table public.afx_producers add column if not exists individual_verified_at timestamptz;

-- Extend the existing anti-forge guard to ALSO block client roles from setting
-- individual_verified_at. The trigger afx_producers_guard_verified is already bound to
-- this function (S2b migration), so replacing the function is sufficient. Service-role
-- (staff actions) + migrations pass through; 'authenticated'/'anon' are blocked.
create or replace function public.afx_guard_entity_verified()
returns trigger language plpgsql as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if new.entity_verified_at is distinct from old.entity_verified_at then
    raise exception 'entity_verified_at is FRA-only';
  end if;
  if new.individual_verified_at is distinct from old.individual_verified_at then
    raise exception 'individual_verified_at is FRA-only';
  end if;
  return new;
end $$;
```

- [ ] **Step 2: Extend `types.ts`**

In `src/lib/afx/types.ts`:

(a) Change `VettingKind`:

```ts
export type VettingKind = 'case_study' | 'entity' | 'individual';
```

(b) Below the existing `EntityDocumentCategory` type, add:

```ts
/** Individual (freelance) confidential document categories. */
export type IndividualDocumentCategory = 'cv' | 'other';
```

(c) Change `AfxDocument.category` to include the new union member:

```ts
  category: DocumentCategory | EntityDocumentCategory | IndividualDocumentCategory;
```

(d) In `ProducerProfile`, immediately below the `entityVerifiedAt?: string;` field, add:

```ts
  /** Individual (freelance) confidential docs — the CV (+ optional supporting). Isolated
   *  column afx_producers.individual_docs, never in the profile blob, never funder-visible. */
  individualDocs?: AfxDocument[];
  /** FRA individual-verification marker. Isolated column afx_producers.individual_verified_at;
   *  staff-only (anti-forge trigger). Presence = verified individual. */
  individualVerifiedAt?: string;
  /** Optional public professional links (profile blob, not confidential). */
  individualLinks?: { imdb?: string; linkedin?: string; portfolio?: string };
```

- [ ] **Step 3: Extend `documents.ts`**

In `src/lib/afx/documents.ts`, add `IndividualDocumentCategory` to the existing type import from `./types`. Then append:

```ts
export const INDIVIDUAL_DOCUMENT_CATEGORIES: readonly IndividualDocumentCategory[] = ['cv', 'other'] as const;

export const INDIVIDUAL_DOCUMENT_CATEGORY_LABELS: Record<IndividualDocumentCategory, string> = {
  cv: 'CV / résumé',
  other: 'Other',
};

/** A CV is the one required individual proof; 'other' docs are optional supporting evidence. */
export const REQUIRED_INDIVIDUAL_DOCUMENT_CATEGORIES: readonly IndividualDocumentCategory[] = ['cv'] as const;

export function missingRequiredIndividualDocs(docs: readonly AfxDocument[] | undefined): IndividualDocumentCategory[] {
  const present = new Set((docs ?? []).map((d) => d.category));
  return REQUIRED_INDIVIDUAL_DOCUMENT_CATEGORIES.filter((c) => !present.has(c));
}

/** An individual is vetting-ready iff the standing gate (K2, reused) is attested AND a CV is present. */
export function isIndividualVettingReady(p: { entityK2: boolean; individualDocs?: readonly AfxDocument[] }): boolean {
  return p.entityK2 === true && missingRequiredIndividualDocs(p.individualDocs).length === 0;
}
```

- [ ] **Step 4: Extend `vetting.ts`**

In `src/lib/afx/vetting.ts`, below the existing `latestEntitySubmission` function, add:

```ts
export function openIndividualSubmission(subs: readonly VettingSubmission[] | undefined): VettingSubmission | undefined {
  return (subs ?? []).find((s) => s.kind === 'individual' && isOpenStatus(s.status));
}
export function latestIndividualSubmission(subs: readonly VettingSubmission[] | undefined): VettingSubmission | undefined {
  return latest((subs ?? []).filter((s) => s.kind === 'individual'));
}
```

- [ ] **Step 5: Type-check + temp assertion (delete, do NOT commit)**

Run: `npx tsc --noEmit -p tsconfig.json` (expect clean).

Create `test_phase2_lib.mts` in the repo ROOT:

```ts
import assert from 'node:assert';
import { isIndividualVettingReady, missingRequiredIndividualDocs, INDIVIDUAL_DOCUMENT_CATEGORY_LABELS } from './src/lib/afx/documents';

const cv = { id: 'x', path: 'p', filename: 'cv.pdf', category: 'cv', sizeBytes: 1, contentType: 'application/pdf', uploadedAt: 'now' } as const;
assert.deepEqual(missingRequiredIndividualDocs([]), ['cv']);
assert.deepEqual(missingRequiredIndividualDocs([cv]), []);
assert.equal(isIndividualVettingReady({ entityK2: false, individualDocs: [cv] }), false);
assert.equal(isIndividualVettingReady({ entityK2: true, individualDocs: [] }), false);
assert.equal(isIndividualVettingReady({ entityK2: true, individualDocs: [cv] }), true);
assert.equal(INDIVIDUAL_DOCUMENT_CATEGORY_LABELS.cv, 'CV / résumé');
console.log('PHASE2_LIB_OK');
```

Run: `npx tsx test_phase2_lib.mts` (expect `PHASE2_LIB_OK`). Then `rm test_phase2_lib.mts`.

- [ ] **Step 6: Commit (source + migration only)**

```bash
git add supabase/migrations/20260702_afx_individual_vetting.sql src/lib/afx/types.ts src/lib/afx/documents.ts src/lib/afx/vetting.ts
git commit -m "feat(afx): individual-vetting schema + type/lib foundations (phase 2)"
```

Confirm `test_phase2_lib.mts` is gone; do not stage unrelated dirty files (`scan_opportunities.mjs`, newsletter `.mjs`/`.html`, `supabase/.gitignore`, `supabase/config.toml`).

---

### Task 2: Persistence & producerStore (isolate + lock the individual lane)

**Files:**
- Modify: `src/lib/afx/persistence.ts`, `src/lib/afx/server/producerStore.ts`

**Interfaces:**
- Consumes: Task 1 types.
- Produces: `ProducerRow` with `individual_docs`/`individual_verified_at`; `profileToRows` now returns `individualDocs`.

- [ ] **Step 1: `persistence.ts` — row type + hydrate + split**

In `src/lib/afx/persistence.ts`:

(a) Replace the `ProducerRow` interface with:

```ts
export interface ProducerRow {
  id: string;
  user_id: string;
  /** ProducerProfile minus id, slate, and the isolated entity + individual lanes. */
  profile: Omit<ProducerProfile, 'id' | 'slate' | 'entityDocs' | 'entityVerifiedAt' | 'individualDocs' | 'individualVerifiedAt'>;
  entity_docs: AfxDocument[] | null;
  entity_verified_at: string | null;
  individual_docs: AfxDocument[] | null;
  individual_verified_at: string | null;
}
```

(b) In `rowsToProfile`, below the `entity_verified_at` hydrate line, add:

```ts
  if (producer.individual_docs != null) profile.individualDocs = producer.individual_docs;
  if (producer.individual_verified_at != null) profile.individualVerifiedAt = producer.individual_verified_at;
```

(c) Replace `profileToRows` with:

```ts
export function profileToRows(p: ProducerProfile): { profile: ProducerRow['profile']; entityDocs: AfxDocument[] | null; individualDocs: AfxDocument[] | null; projects: ProjectRow[] } {
  const { id: _id, slate, entityDocs, entityVerifiedAt, individualDocs, individualVerifiedAt, ...profile } = p;
  void _id; void entityVerifiedAt; void individualVerifiedAt;
  return { profile, entityDocs: entityDocs ?? null, individualDocs: individualDocs ?? null, projects: (slate ?? []).map((pr) => projectToRow(p.id, pr)) };
}
```

- [ ] **Step 2: `producerStore.ts` — write + lock individual_docs**

In `src/lib/afx/server/producerStore.ts`, replace the block from `const { profile: profileBlob, entityDocs, projects } = profileToRows(...)` through the `afx_producers ... .update({ ... })` call (the entity-lock + update block, currently ~lines 49-65) with:

```ts
  const { profile: profileBlob, entityDocs, individualDocs, projects } = profileToRows({ ...profile, id: producer.id });

  const entityLocked = isEntityLocked(subs);
  const individualLocked = subs.some((s) => s.kind === 'individual');

  // While a submission is open, pin its vetted data to the stored values.
  let entityDocsToWrite = entityDocs;
  let individualDocsToWrite = individualDocs;
  if (entityLocked || individualLocked) {
    const { data: stored } = await supabase
      .from('afx_producers').select('profile, entity_docs, individual_docs').eq('id', producer.id)
      .single<{ profile: Record<string, unknown>; entity_docs: AfxDocument[] | null; individual_docs: AfxDocument[] | null }>();
    if (!stored) throw new Error('locked but stored profile unavailable');
    if (entityLocked) {
      for (const f of VETTED_ENTITY_FIELDS) (profileBlob as Record<string, unknown>)[f] = stored.profile?.[f];
      entityDocsToWrite = stored.entity_docs;
    }
    if (individualLocked) individualDocsToWrite = stored.individual_docs;
  }

  const { error: updateErr } = await supabase.from('afx_producers')
    .update({ profile: profileBlob, entity_docs: entityDocsToWrite, individual_docs: individualDocsToWrite, updated_at: new Date().toISOString() })
    .eq('id', producer.id);
  if (updateErr) throw new Error(`producer update failed: ${updateErr.message}`);
```

(`subs`, `VETTED_ENTITY_FIELDS`, and `isEntityLocked` already exist in this file; `entityK2` remains pinned via `VETTED_ENTITY_FIELDS` during entity lock — individuals don't pin extra profile fields, only their docs.)

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit -p tsconfig.json` (clean) then `npx next build` (succeeds).

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/persistence.ts src/lib/afx/server/producerStore.ts
git commit -m "feat(afx): persist + lock the individual_docs lane (phase 2)"
```

---

### Task 3: Document pipeline + submit

**Files:**
- Modify: `src/lib/afx/server/documentAccess.ts`, `src/app/api/afx/documents/upload/route.ts`, `src/lib/afx/server/vettingStore.ts`

**Interfaces:**
- Consumes: Task 1 (`isIndividualVettingReady`, `INDIVIDUAL_DOCUMENT_CATEGORIES`).

- [ ] **Step 1: `documentAccess.ts`**

(a) In `isOwnedDocPath`, change the segment alternation to include `individual`:

```ts
  const re = new RegExp(`^${producerId}/(?:entity|individual|${uuid})/${uuid}\\.[a-z0-9]+$`, 'i');
```

(b) Change `hasOpenSubmission`'s `kind` parameter type:

```ts
export async function hasOpenSubmission(producerId: string, kind: 'case_study' | 'entity' | 'individual', targetId: string | null): Promise<boolean> {
```

- [ ] **Step 2: `upload/route.ts`**

(a) Add `INDIVIDUAL_DOCUMENT_CATEGORIES` to the import from `@/lib/afx/documents` and `IndividualDocumentCategory` to the type import from `@/lib/afx/types`.

(b) Replace the scope-validation + allowedCats block:

```ts
  if (scope !== 'case_study' && scope !== 'entity' && scope !== 'individual') {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }
  const allowedCats = scope === 'entity' ? ENTITY_DOCUMENT_CATEGORIES
    : scope === 'individual' ? INDIVIDUAL_DOCUMENT_CATEGORIES
    : DOCUMENT_CATEGORIES;
```

(c) Replace the NDA guard line so individual scope is exempt:

```ts
  if (scope !== 'individual' && !access.ndaSigned) return NextResponse.json({ error: 'NDA must be signed to upload documents' }, { status: 403 });
```

(d) In the segment/lock resolver, add an `individual` branch between the `entity` and `else` branches:

```ts
  } else if (scope === 'individual') {
    if (await hasOpenSubmission(access.producerId, 'individual', null)) {
      return NextResponse.json({ error: 'Individual profile is locked for review — withdraw to edit' }, { status: 409 });
    }
    segment = 'individual';
  } else {
```

(e) Change the `doc.category` cast to include the new type:

```ts
    id: docId, path, filename: file.name, category: category as DocumentCategory | EntityDocumentCategory | IndividualDocumentCategory,
```

- [ ] **Step 3: `vettingStore.ts` — submit branch**

(a) Add `isIndividualVettingReady` to the import from `@/lib/afx/documents`.

(b) Replace the `else { ... }` entity block in `submitForVetting` (the block that checks `isEntityVettingReady`) with two explicit branches:

```ts
  } else if (input.kind === 'entity') {
    const { data: prod } = await supabase
      .from('afx_producers').select('profile, entity_docs').eq('id', producerId)
      .single<{ profile: { entityK2?: boolean }; entity_docs: AfxDocument[] | null }>();
    if (!prod) return { ok: false, error: 'Producer not found' };
    if (!isEntityVettingReady({ entityK2: !!prod.profile?.entityK2, entityDocs: prod.entity_docs ?? undefined })) {
      return { ok: false, error: 'Entity is not vetting-ready (K2 + required company documents)' };
    }
  } else {
    const { data: prod } = await supabase
      .from('afx_producers').select('profile, individual_docs').eq('id', producerId)
      .single<{ profile: { entityK2?: boolean }; individual_docs: AfxDocument[] | null }>();
    if (!prod) return { ok: false, error: 'Producer not found' };
    if (!isIndividualVettingReady({ entityK2: !!prod.profile?.entityK2, individualDocs: prod.individual_docs ?? undefined })) {
      return { ok: false, error: 'Not vetting-ready (professional standing gate + a CV)' };
    }
  }
```

(The existing insert line already sets `target_id` to null for any non-`case_study` kind, so `individual` inserts `target_id=null` unchanged.)

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit -p tsconfig.json` (clean) then `npx next build` (succeeds).

- [ ] **Step 5: Commit**

```bash
git add src/lib/afx/server/documentAccess.ts src/app/api/afx/documents/upload/route.ts src/lib/afx/server/vettingStore.ts
git commit -m "feat(afx): individual doc upload (no NDA) + submit gate (phase 2)"
```

---

### Task 4: Staff review — decide, detail, sign, render

**Files:**
- Modify: `src/lib/afx/server/staffReview.ts`, `src/app/api/afx/staff/documents/sign/route.ts`, `src/components/afx/staff/StaffSubmissionDetail.tsx`

**Interfaces:**
- Consumes: Task 1/2 (`individualDocs`, `individualVerifiedAt`, `individualLinks` on the producer profile).

- [ ] **Step 1: `staffReview.ts`**

(a) In `getSubmissionDetail`, extend the producer select to include the individual columns:

```ts
  const { data: prod } = await afxAdmin.from('afx_producers').select('id, user_id, profile, entity_docs, entity_verified_at, individual_docs, individual_verified_at').eq('id', subRow.producer_id).maybeSingle<ProducerRow>();
```

(b) In `decide`, replace the entity-marker block with one that sets the correct marker for both kinds:

```ts
  if (decision === 'approve' && (sub.kind === 'entity' || sub.kind === 'individual')) {
    const col = sub.kind === 'individual' ? 'individual_verified_at' : 'entity_verified_at';
    const { error: mErr } = await afxAdmin.from('afx_producers').update({ [col]: now, updated_at: now }).eq('id', sub.producer_id);
    if (mErr) return { ok: false, error: 'Decision saved but marker failed' };
  }
```

- [ ] **Step 2: `staff/documents/sign/route.ts` — allow individual segment**

Replace the `expectedSegment` line:

```ts
  const expectedSegment = sub.kind === 'entity' ? 'entity' : sub.kind === 'individual' ? 'individual' : sub.target_id;
```

(`isOwnedDocPath` already accepts the `individual` segment from Task 3.)

- [ ] **Step 3: `StaffSubmissionDetail.tsx` — title, badge, docs, links**

(a) Replace the title `<div>` (currently `submission.kind === 'entity' ? ... : (project?.title || 'Case study')`):

```tsx
            <div style={{ fontSize: 17, fontWeight: 700 }}>{submission.kind === 'entity' ? `${producer.company} — company vetting` : submission.kind === 'individual' ? `${producer.name} — individual vetting` : (project?.title || 'Case study')}</div>
```

(b) Replace the sub-line so the verified badge is type-aware:

```tsx
            <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', marginTop: 3 }}>{producer.name} · {producer.company}{producer.entityVerifiedAt ? ' · ✓ verified company' : ''}{producer.individualVerifiedAt ? ' · ✓ verified individual' : ''}</div>
```

(c) Replace the `docs` line so individual submissions read the CV lane:

```tsx
  const docs = project ? (project.docs ?? []) : (submission.kind === 'individual' ? (producer.individualDocs ?? []) : (producer.entityDocs ?? []));
```

(d) Directly after the Proof-documents card's closing `</div>` (the card that maps `docs`), add a links card for individual submissions:

```tsx
      {submission.kind === 'individual' && producer.individualLinks && (producer.individualLinks.imdb || producer.individualLinks.linkedin || producer.individualLinks.portfolio) ? (
        <div style={cardStyle}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Professional links</div>
          {(['imdb', 'linkedin', 'portfolio'] as const).map((k) => {
            const url = producer.individualLinks?.[k];
            return url ? (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: '0 0 90px', fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize' }}>{k}</div>
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, fontFamily: mono, fontSize: 12, color: '#1C4E80', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</a>
              </div>
            ) : null;
          })}
        </div>
      ) : null}
```

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit -p tsconfig.json` (clean) then `npx next build` (succeeds).

- [ ] **Step 5: Commit**

```bash
git add src/lib/afx/server/staffReview.ts src/app/api/afx/staff/documents/sign/route.ts src/components/afx/staff/StaffSubmissionDetail.tsx
git commit -m "feat(afx): staff review of individual submissions (phase 2)"
```

---

### Task 5: Producer UI — Individual Vetting panel + verified card + wiring

**Files:**
- Create: `src/components/afx/producer/AfxIndividualDocumentUpload.tsx`, `src/components/afx/producer/IndividualVerifiedCard.tsx`, `src/components/afx/producer/IndividualVettingPanel.tsx`
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx`

**Interfaces:**
- Consumes: Task 1 types + `isIndividualVettingReady`, `INDIVIDUAL_DOCUMENT_CATEGORIES`, `INDIVIDUAL_DOCUMENT_CATEGORY_LABELS`; `openIndividualSubmission`, `latestIndividualSubmission`; `producerTypeOf`.

- [ ] **Step 1: Create `AfxIndividualDocumentUpload.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import type { AfxDocument, IndividualDocumentCategory } from '@/lib/afx/types';
import { INDIVIDUAL_DOCUMENT_CATEGORIES, INDIVIDUAL_DOCUMENT_CATEGORY_LABELS, missingRequiredIndividualDocs, ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';
const linkBtn: React.CSSProperties = { cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 10px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066' };

interface Props {
  docs: AfxDocument[];
  locked: boolean;
  onAdd: (doc: AfxDocument) => void;
  onUpdate: (id: string, patch: { category: IndividualDocumentCategory }) => void;
  onRemove: (id: string) => void;
}

function prettySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AfxIndividualDocumentUpload({ docs, locked, onAdd, onUpdate, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hasCv = docs.some((d) => d.category === 'cv');

  async function upload(file: File) {
    setError('');
    if (!ALLOWED_DOC_TYPES.includes(file.type)) { setError('Unsupported type (PDF, PNG, JPEG, DOCX, XLSX only)'); return; }
    if (file.size > MAX_DOC_BYTES) { setError(`File is ${prettySize(file.size)} — max is 25 MB`); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('scope', 'individual');
      fd.append('category', hasCv ? 'other' : 'cv');
      const res = await fetch('/api/afx/documents/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? `Upload failed (${res.status})`);
      else onAdd(json.doc as AfxDocument);
    } catch (e) {
      setError(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — check your connection');
    } finally { setBusy(false); }
  }

  async function view(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  async function remove(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }) });
      if (res.ok) onRemove(doc.id);
      else { const json = await res.json().catch(() => ({})); setError(json.error ?? 'Could not remove document'); }
    } catch { setError('Could not remove document'); }
  }

  const ready = missingRequiredIndividualDocs(docs).length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1 }}>
      <div style={{ border: `1px solid ${ready ? '#CDEAD5' : '#F0DCA8'}`, background: ready ? '#F2FBF4' : '#FDF8EC', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: ready ? '#2E7D46' : '#9A6B1E' }}>{ready ? '✓ CV attached' : 'A CV / résumé is required'}</div>
      </div>
      {docs.map((d) => (
        <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>{prettySize(d.sizeBytes)}</div>
          </div>
          <select value={d.category} onChange={(e) => onUpdate(d.id, { category: e.target.value as IndividualDocumentCategory })} style={{ fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', cursor: 'pointer', minWidth: 120 }}>
            {INDIVIDUAL_DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{INDIVIDUAL_DOCUMENT_CATEGORY_LABELS[c]}</option>)}
          </select>
          <button onClick={() => view(d)} style={linkBtn}>View</button>
          <button onClick={() => remove(d)} aria-label="Remove document" style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, width: 30, height: 30, color: '#9A9CA3', fontSize: 15, lineHeight: 1 }}>×</button>
        </div>
      ))}
      <button onClick={() => inputRef.current?.click()} disabled={busy} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8, border: '1px solid #D6D8F5', background: '#fff', color: 'var(--afx-accent)' }}>
        {busy ? 'Uploading…' : hasCv ? '+ Add supporting document' : '+ Upload CV'}
      </button>
      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}
```

- [ ] **Step 2: Create `IndividualVerifiedCard.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { AfxDocument, IndividualDocumentCategory, ProducerProfile } from '@/lib/afx/types';
import { INDIVIDUAL_DOCUMENT_CATEGORY_LABELS } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';
type Links = NonNullable<ProducerProfile['individualLinks']>;

/** Read-only confirmation once FRA has verified the individual. CV + links, View only. */
export default function IndividualVerifiedCard({ verifiedAt, docs, links }: { verifiedAt: string; docs: AfxDocument[]; links: Links }) {
  const [error, setError] = useState('');

  async function view(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  const linkEntries = (['imdb', 'linkedin', 'portfolio'] as const).map((k) => [k, links[k]] as const).filter((e): e is readonly [typeof e[0], string] => !!e[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#F2FBF4', border: '1px solid #CDEAD5' }}>
        <span aria-hidden style={{ fontSize: 15, color: '#2E7D46' }}>✓</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#2E7D46' }}>Individual verified</span>
        <span style={{ fontFamily: mono, fontSize: 10.5, color: '#5E9A6E', marginLeft: 'auto' }}>verified {verifiedAt.slice(0, 10)}</span>
      </div>

      {docs.length === 0 ? (
        <div style={{ fontSize: 12.5, color: '#9A9CA3' }}>No documents on file.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((d) => (
            <div key={d.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px', border: '1px solid #F2F0EB', borderRadius: 9 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>{INDIVIDUAL_DOCUMENT_CATEGORY_LABELS[d.category as IndividualDocumentCategory] ?? d.category}</div>
              </div>
              <button onClick={() => view(d)} style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 12px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066' }}>View</button>
            </div>
          ))}
        </div>
      )}

      {linkEntries.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {linkEntries.map(([k, v]) => (
            <a key={k} href={v} target="_blank" rel="noopener noreferrer" style={{ fontFamily: mono, fontSize: 11, color: '#1C4E80', textDecoration: 'none', border: '1px solid #C4D8EF', borderRadius: 999, padding: '4px 11px', textTransform: 'capitalize' }}>{k}</a>
          ))}
        </div>
      ) : null}

      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}
    </div>
  );
}
```

- [ ] **Step 3: Create `IndividualVettingPanel.tsx`**

```tsx
'use client';

import type { AfxDocument, IndividualDocumentCategory, ProducerProfile, VettingSubmission } from '@/lib/afx/types';
import { isIndividualVettingReady } from '@/lib/afx/documents';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
import { SectionCard } from './cockpitUi';
import AfxIndividualDocumentUpload from './AfxIndividualDocumentUpload';
import IndividualVerifiedCard from './IndividualVerifiedCard';

const mono = 'var(--afx-mono)';
type Links = NonNullable<ProducerProfile['individualLinks']>;

interface Props {
  draft: ProducerProfile;
  submission?: VettingSubmission;
  locked: boolean;
  busy?: boolean;
  onAddDoc: (doc: AfxDocument) => void;
  onUpdateDoc: (id: string, patch: { category: IndividualDocumentCategory }) => void;
  onRemoveDoc: (id: string) => void;
  onLinks: (patch: Partial<Links>) => void;
  onSubmit: () => void;
  onWithdraw: () => void;
}

export default function IndividualVettingPanel({ draft, submission, locked, busy, onAddDoc, onUpdateDoc, onRemoveDoc, onLinks, onSubmit, onWithdraw }: Props) {
  const verifiedAt = draft.individualVerifiedAt;
  const docs = draft.individualDocs ?? [];
  const links = draft.individualLinks ?? {};
  const ready = isIndividualVettingReady({ entityK2: draft.entityK2, individualDocs: docs });
  const showBadge = submission && submission.status !== 'withdrawn';

  return (
    <SectionCard title="Individual Vetting" hint={verifiedAt ? 'verified · read-only' : 'producer + FRA only'}>
      {verifiedAt ? (
        <IndividualVerifiedCard verifiedAt={verifiedAt} docs={docs} links={links} />
      ) : (
        <>
          {showBadge ? (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: VETTING_STATUS_META[submission!.status].bg, border: `1px solid ${VETTING_STATUS_META[submission!.status].border}`, color: VETTING_STATUS_META[submission!.status].ink, fontSize: 12.5 }}>
              <strong style={{ fontWeight: 700 }}>{VETTING_STATUS_META[submission!.status].label}</strong>
              {locked ? ' — read-only while FRA reviews. Withdraw to edit.' : ''}
              {submission!.status === 'changes_requested' && submission!.reviewerNotes ? <div style={{ marginTop: 4 }}>{submission!.reviewerNotes}</div> : null}
            </div>
          ) : null}

          {!draft.entityK2 ? (
            <div style={{ marginBottom: 10, fontFamily: mono, fontSize: 11, color: '#9A6B1E' }}>
              Turn on the <strong>K2 — Individual / professional standing</strong> gate (Account &amp; Visibility) to make your profile vetting-ready.
            </div>
          ) : null}

          <AfxIndividualDocumentUpload docs={docs} locked={locked} onAdd={onAddDoc} onUpdate={onUpdateDoc} onRemove={onRemoveDoc} />

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, pointerEvents: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1 }}>
            <LinkField label="IMDb" value={links.imdb ?? ''} onChange={(v) => onLinks({ imdb: v })} />
            <LinkField label="LinkedIn" value={links.linkedin ?? ''} onChange={(v) => onLinks({ linkedin: v })} />
            <LinkField label="Portfolio / site" value={links.portfolio ?? ''} onChange={(v) => onLinks({ portfolio: v })} />
          </div>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            {locked ? (
              <button onClick={onWithdraw} disabled={busy} style={{ cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 8, border: '1px solid #9A6B1E', background: '#fff', color: '#9A6B1E', opacity: busy ? 0.6 : 1 }}>Withdraw submission</button>
            ) : (
              <button onClick={onSubmit} disabled={!ready || busy} title={ready ? '' : 'Standing gate on + a CV'} style={{ cursor: busy ? 'wait' : ready ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 8, border: '1px solid #1C4E80', background: ready ? '#1C4E80' : '#A8B6C8', color: '#fff' }}>Submit for vetting</button>
            )}
          </div>
        </>
      )}
    </SectionCard>
  );
}

function LinkField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{label}</span>
      <input value={value} placeholder="https://" onChange={(e) => onChange(e.target.value)} style={{ width: '100%', fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none' }} />
    </label>
  );
}
```

- [ ] **Step 4: Wire `ProducerProfileClient.tsx`**

(a) Imports — extend the vetting import and add two:

```tsx
import { openCaseSubmission, openEntitySubmission, latestEntitySubmission, openIndividualSubmission, latestIndividualSubmission } from '@/lib/afx/vetting';
```

```tsx
import { meetsCorePackaging, producerTypeOf } from '@/lib/afx/constants';
import IndividualVettingPanel from '@/components/afx/producer/IndividualVettingPanel';
```

And add `IndividualDocumentCategory` to the existing `@/lib/afx/types` type import.

(b) After the entity doc handlers (`onAddEntityDoc`/`onUpdateEntityDoc`/`onRemoveEntityDoc`/`onSubmitEntity`), add the individual handlers:

```tsx
  const onAddIndividualDoc = (doc: AfxDocument) => setDraft((d) => ({ ...d, individualDocs: [...(d.individualDocs ?? []), doc] }));
  const onUpdateIndividualDoc = (id: string, patch: { category: IndividualDocumentCategory }) =>
    setDraft((d) => ({ ...d, individualDocs: (d.individualDocs ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const onRemoveIndividualDoc = (id: string) => setDraft((d) => ({ ...d, individualDocs: (d.individualDocs ?? []).filter((x) => x.id !== id) }));
  const onIndividualLinks = (patch: Partial<NonNullable<ProducerProfile['individualLinks']>>) =>
    setDraft((d) => ({ ...d, individualLinks: { ...(d.individualLinks ?? {}), ...patch } }));

  const onSubmitIndividual = async () => {
    if (vettingBusy) return;
    setVettingBusy(true);
    setActionError(null);
    try {
      await persistProfileAction(draft);
      const res = await submitForVettingAction({ kind: 'individual' });
      if (res.ok) setSubmissions((s) => [...s, res.submission]);
      else setActionError(res.error ?? 'Submit failed');
    } catch {
      setActionError('Could not submit for vetting — please try again');
    } finally {
      setVettingBusy(false);
    }
  };
```

(c) Replace the entity-panel IIFE in the render (the `{(() => { const open = openEntitySubmission(submissions); return (<EntityVettingPanel ... />); })()}` block) with a type branch that renders the individual panel for individuals and the existing entity panel otherwise:

```tsx
            {producerTypeOf(draft) === 'individual' ? (() => {
              const open = openIndividualSubmission(submissions);
              return (
                <IndividualVettingPanel
                  draft={draft}
                  submission={latestIndividualSubmission(submissions)}
                  locked={!!open}
                  busy={vettingBusy}
                  onAddDoc={onAddIndividualDoc}
                  onUpdateDoc={onUpdateIndividualDoc}
                  onRemoveDoc={onRemoveIndividualDoc}
                  onLinks={onIndividualLinks}
                  onSubmit={onSubmitIndividual}
                  onWithdraw={open ? () => onWithdrawSubmission(open.id) : () => {}}
                />
              );
            })() : (() => {
              const open = openEntitySubmission(submissions);
              return (
                <EntityVettingPanel
                  draft={draft}
                  submission={latestEntitySubmission(submissions)}
                  locked={!!open}
                  ndaSigned={!!draft.ndaSigned}
                  busy={vettingBusy}
                  onAddDoc={onAddEntityDoc}
                  onUpdateDoc={onUpdateEntityDoc}
                  onRemoveDoc={onRemoveEntityDoc}
                  onSubmit={onSubmitEntity}
                  onWithdraw={open ? () => onWithdrawSubmission(open.id) : () => {}}
                />
              );
            })()}
```

- [ ] **Step 5: Type-check + build**

Run: `npx tsc --noEmit -p tsconfig.json` (clean) then `npx next build` (succeeds).

- [ ] **Step 6: Commit**

```bash
git add src/components/afx/producer/AfxIndividualDocumentUpload.tsx src/components/afx/producer/IndividualVerifiedCard.tsx src/components/afx/producer/IndividualVettingPanel.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): individual vetting panel + verified card + wiring (phase 2)"
```

---

### Task 6: Prod migration + live gate

**Precondition (controller):** Hand the SQL from `supabase/migrations/20260702_afx_individual_vetting.sql` to the USER to run in the Supabase Dashboard SQL editor (`https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new`). Wait for "SQL has run" before proceeding.

**Files:**
- Create: `live_gate_individual_vetting.mts` (repo root, temporary — deleted at the end)

- [ ] **Step 1: Write the live gate**

Create `live_gate_individual_vetting.mts` (repo root):

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const stamp = process.argv[2] ?? 'x';
const email = `afx-indiv-${stamp}@example.com`;
const password = `Pw!${stamp}aA9zz`;
let uid = '';
let producerId = '';

try {
  // Disposable auth user + producer row (service role).
  const u = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ok(!u.error, `createUser: ${u.error?.message}`);
  uid = u.data.user!.id;
  const ins = await admin.from('afx_producers').insert({ user_id: uid, profile: { name: 'Indiv Gate', company: '', entityK2: true } }).select('id').single<{ id: string }>();
  assert.ok(!ins.error && ins.data, `insert producer: ${ins.error?.message}`);
  producerId = ins.data!.id;

  // (1) New columns exist + selectable.
  const sel = await admin.from('afx_producers').select('individual_docs, individual_verified_at').eq('id', producerId).single();
  assert.ok(!sel.error, `select new cols: ${sel.error?.message}`);

  // (2) Service role CAN set individual_verified_at (staff path passes the trigger).
  const now = new Date().toISOString();
  const svc = await admin.from('afx_producers').update({ individual_verified_at: now }).eq('id', producerId).select('individual_verified_at');
  assert.ok(!svc.error && (svc.data ?? []).length === 1, `service set marker: ${svc.error?.message}`);

  // (3) The producer's OWN authenticated session must NOT be able to change it (anti-forge trigger).
  const asUser = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = await asUser.auth.signInWithPassword({ email, password });
  assert.ok(!signIn.error, `signIn: ${signIn.error?.message}`);
  const forge = await asUser.from('afx_producers').update({ individual_verified_at: null }).eq('id', producerId).select('id');
  // Expect the trigger to reject (error) OR RLS/trigger to update 0 rows — either way the marker must survive.
  const after = await admin.from('afx_producers').select('individual_verified_at').eq('id', producerId).single<{ individual_verified_at: string | null }>();
  assert.ok(after.data?.individual_verified_at != null, `anti-forge FAILED: producer cleared the marker (forge err was: ${forge.error?.message ?? 'none'})`);

  console.log('LIVE_OK');
} finally {
  if (producerId) await admin.from('afx_producers').delete().eq('id', producerId);
  if (uid) await admin.auth.admin.deleteUser(uid);
}
```

- [ ] **Step 2: Run the live gate**

Run: `npx tsx live_gate_individual_vetting.mts run-$(date +%s)`
Expected: prints `LIVE_OK`. On an assertion error: STOP, do NOT delete the script, report BLOCKED with the failing assertion (most likely the migration wasn't applied, or the trigger doesn't guard the new marker).

- [ ] **Step 3: Remove the temp script + confirm clean tree + type-check**

```bash
rm live_gate_individual_vetting.mts
git status --porcelain && npx tsc --noEmit -p tsconfig.json
```

Expected: no stray `.mts`; tsc clean. (No commit — the script was never committed. This task produces no code commit; it is the prod verification gate.)

---

## Post-implementation manual verification (controller, after deploy)

On prod `/afx/producer` as an **individual** producer: CV upload works without signing the NDA; the standing gate (K2) + a CV enable Submit; submit locks the CV. In staff `/afx/staff`: the individual submission appears; the drill-down shows the CV (View) + links; Approve sets `individual_verified_at` and the producer panel collapses to the verified card. Toggle a producer to Company → the entity panel still renders unchanged.

## Self-Review

- **Spec coverage:** migration (columns + trigger) → Task 1/6; types + doc lib + readiness → Task 1; persistence isolation + lock → Task 2; upload no-NDA + submit gate → Task 3; staff decide/detail/sign/render → Task 4; producer panel + verified card + links + wiring → Task 5; live gate → Task 6. All spec sections mapped; no rating/`operatorVerifiedAt` change (per spec's scoped-coupling finding).
- **Placeholder scan:** none — full code for every step incl. all three new components and the migration.
- **Type consistency:** `IndividualDocumentCategory` defined in Task 1, consumed in Tasks 3/5; `isIndividualVettingReady({ entityK2, individualDocs })` signature consistent across documents.ts (Task 1), vettingStore (Task 3), and IndividualVettingPanel (Task 5); `individualLinks` shape `{ imdb?, linkedin?, portfolio? }` identical across types (Task 1), staff render (Task 4), panel + card (Task 5); `profileToRows` return type extended with `individualDocs` (Task 2) and consumed by producerStore (Task 2); `openIndividualSubmission`/`latestIndividualSubmission` defined Task 1, used Task 5.
