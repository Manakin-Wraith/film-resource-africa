# AFX Entity Verified-Card Collapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a producer's entity is verified, replace the working Company/Entity Vetting panel on `/afx/producer` with a compact read-only "verified" card.

**Architecture:** Pure client-side presentational change. A new read-only component `EntityVerifiedCard` renders the confirmation + on-file docs (with View). `EntityVettingPanel` keeps its `SectionCard` wrapper and branches its body on `draft.entityVerifiedAt`. No data model, RPC, server action, or migration change — `entityVerifiedAt` is already hydrated onto the producer profile via `rowsToProfile`.

**Tech Stack:** Next.js App Router client components, TypeScript, inline `var(--afx-*)` styling under `.afx-root`.

## Global Constraints

- Styling: inline styles using `var(--afx-*)` tokens and the `mono = 'var(--afx-mono)'` convention already used in sibling components.
- Trigger the collapse **solely** on `draft.entityVerifiedAt` being truthy. Do NOT key off submission status.
- Verified is terminal from the producer side: the verified card has NO upload, NO category selector, NO remove, NO submit/withdraw. **View is the only action.**
- Every non-verified state (no submission / `submitted` / `under_review` / `changes_requested` / `withdrawn`) must render the existing working panel **unchanged**.
- No test runner in this project — verify with `npx tsc --noEmit -p tsconfig.json` and `npx next build`.
- Do not modify NDA, Account & Visibility, staff review, `entity_verified_at` writes, or triggers.

---

### Task 1: EntityVerifiedCard component

**Files:**
- Create: `src/components/afx/producer/EntityVerifiedCard.tsx`

**Interfaces:**
- Consumes: `AfxDocument`, `EntityDocumentCategory` from `@/lib/afx/types`; `ENTITY_DOCUMENT_CATEGORY_LABELS` from `@/lib/afx/documents`; the existing `POST /api/afx/documents/sign` endpoint (`{ path } → { url }`).
- Produces: `export default function EntityVerifiedCard({ verifiedAt, docs }: { verifiedAt: string; docs: AfxDocument[] })`.

- [ ] **Step 1: Create the component**

Create `src/components/afx/producer/EntityVerifiedCard.tsx` with exactly:

```tsx
'use client';

import { useState } from 'react';
import type { AfxDocument, EntityDocumentCategory } from '@/lib/afx/types';
import { ENTITY_DOCUMENT_CATEGORY_LABELS } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';

/** Read-only confirmation shown once FRA has verified the entity. No upload,
 *  no submit — the verified entity is the truth. View opens a signed URL. */
export default function EntityVerifiedCard({ verifiedAt, docs }: { verifiedAt: string; docs: AfxDocument[] }) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#F2FBF4', border: '1px solid #CDEAD5' }}>
        <span aria-hidden style={{ fontSize: 15, color: '#2E7D46' }}>✓</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#2E7D46' }}>Company verified</span>
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
                <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>
                  {ENTITY_DOCUMENT_CATEGORY_LABELS[d.category as EntityDocumentCategory] ?? d.category}
                </div>
              </div>
              <button onClick={() => view(d)} style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 12px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066' }}>View</button>
            </div>
          ))}
        </div>
      )}

      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean). If `ENTITY_DOCUMENT_CATEGORY_LABELS` is not exported from `@/lib/afx/documents`, stop and report — it is imported the same way by `AfxEntityDocumentUpload.tsx`, so it should resolve.

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/EntityVerifiedCard.tsx
git commit -m "feat(afx): EntityVerifiedCard — read-only verified entity confirmation"
```

---

### Task 2: Branch EntityVettingPanel on verification

**Files:**
- Modify: `src/components/afx/producer/EntityVettingPanel.tsx`

**Interfaces:**
- Consumes: `EntityVerifiedCard` from `./EntityVerifiedCard` (Task 1). `draft.entityVerifiedAt` (`string | undefined`) and `draft.entityDocs` (`AfxDocument[] | undefined`) from the existing `draft: ProducerProfile` prop.
- Produces: no signature change — `EntityVettingPanel`'s props are unchanged; the parent `ProducerProfileClient` keeps passing the same props.

- [ ] **Step 1: Add the import**

At the top of `src/components/afx/producer/EntityVettingPanel.tsx`, below the existing `import AfxEntityDocumentUpload from './AfxEntityDocumentUpload';` line, add:

```tsx
import EntityVerifiedCard from './EntityVerifiedCard';
```

- [ ] **Step 2: Branch the render on `entityVerifiedAt`**

In the component body, the current code computes `docs`, `ready`, `showBadge` and then returns a `<SectionCard title="Company / Entity Vetting" hint="producer + FRA only">` wrapping the badge + NDA/K2 body + submit/withdraw footer.

Replace the entire `return (...)` block with the version below. It keeps the `SectionCard` wrapper, switches the hint when verified, renders `<EntityVerifiedCard>` in the verified branch, and preserves the existing working body verbatim in the `else` branch:

```tsx
  const verifiedAt = draft.entityVerifiedAt;

  return (
    <SectionCard title="Company / Entity Vetting" hint={verifiedAt ? 'verified · read-only' : 'producer + FRA only'}>
      {verifiedAt ? (
        <EntityVerifiedCard verifiedAt={verifiedAt} docs={docs} />
      ) : (
        <>
          {showBadge ? (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10,
              background: VETTING_STATUS_META[submission!.status].bg, border: `1px solid ${VETTING_STATUS_META[submission!.status].border}`,
              color: VETTING_STATUS_META[submission!.status].ink, fontSize: 12.5 }}>
              <strong style={{ fontWeight: 700 }}>{VETTING_STATUS_META[submission!.status].label}</strong>
              {locked ? ' — read-only while FRA reviews. Withdraw to edit.' : ''}
              {submission!.status === 'changes_requested' && submission!.reviewerNotes ? <div style={{ marginTop: 4 }}>{submission!.reviewerNotes}</div> : null}
            </div>
          ) : null}

          {!ndaSigned ? (
            <div style={{ fontSize: 12.5, color: '#9A9CA3', border: '1px dashed #DAD7D0', borderRadius: 8, padding: '12px 14px' }}>
              Sign the FRA NDA to attach confidential company documents (registration, director ID, tax registration).
            </div>
          ) : (
            <>
              {!draft.entityK2 ? (
                <div style={{ marginBottom: 10, fontFamily: mono, fontSize: 11, color: '#9A6B1E' }}>
                  Turn on the <strong>K2 — Legal entity</strong> gate (Account &amp; Visibility) to make the entity vetting-ready.
                </div>
              ) : null}
              <AfxEntityDocumentUpload docs={docs} locked={locked} onAdd={onAddDoc} onUpdate={onUpdateDoc} onRemove={onRemoveDoc} />
            </>
          )}

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            {locked ? (
              <button onClick={onWithdraw} disabled={busy} style={{ cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 8, border: '1px solid #9A6B1E', background: '#fff', color: '#9A6B1E', opacity: busy ? 0.6 : 1 }}>Withdraw entity submission</button>
            ) : (
              <button onClick={onSubmit} disabled={!ready || busy} title={ready ? '' : 'K2 on + all required company documents'}
                style={{ cursor: busy ? 'wait' : ready ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 8, border: '1px solid #1C4E80', background: ready ? '#1C4E80' : '#A8B6C8', color: '#fff' }}>
                Submit entity for vetting
              </button>
            )}
          </div>
        </>
      )}
    </SectionCard>
  );
```

Leave the `docs`, `ready`, and `showBadge` computations above the return exactly as they are — they are still used by the `else` branch.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 4: Production build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/afx/producer/EntityVettingPanel.tsx
git commit -m "feat(afx): collapse entity vetting to verified card when verified"
```

---

## Post-implementation manual verification (controller, after deploy)

On prod `/afx/producer` as a **verified** producer (Gerhard Mostert): the Company / Entity Vetting section shows the compact card — "✓ Company verified · verified {date}", the on-file docs with working View, and NO upload/submit/withdraw controls. Confirm a **non-verified** state still renders the full working panel (submit button + uploads).

## Self-Review

- **Spec coverage:** trigger on `entityVerifiedAt` → Task 2 Step 2; compact card (confirmation line + doc list + View, no controls) → Task 1; branch preserving all non-verified states unchanged → Task 2 Step 2 `else` branch (verbatim copy of current body); new `EntityVerifiedCard.tsx` + modified `EntityVettingPanel.tsx` → Tasks 1 & 2; no data/server/migration change → nothing in either task touches those. All spec sections mapped.
- **Placeholder scan:** none — both code blocks are complete and copy-paste ready.
- **Type consistency:** `EntityVerifiedCard({ verifiedAt: string; docs: AfxDocument[] })` produced in Task 1, consumed in Task 2 with `verifiedAt={verifiedAt}` (narrowed to `string` by the `verifiedAt ?` truthiness guard) and `docs={docs}` (`AfxDocument[]`, the existing `const docs = draft.entityDocs ?? []`). `ENTITY_DOCUMENT_CATEGORY_LABELS` keyed by `EntityDocumentCategory`; `d.category` is `DocumentCategory | EntityDocumentCategory`, cast + `?? d.category` fallback handles it.
