# Sequential Vetting (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AFX vetting sequential — every producer is vetted as an individual first; company producers then unlock entity vetting, hard-gated (UI + server) behind `individual_verified_at`.

**Architecture:** Pure application change on top of Phases 1–2 — no schema migration (all columns/markers exist). The producer page stops XOR-ing one vetting panel by type and instead stacks two conditional sections; the server rejects entity submit + entity-doc upload until the individual marker is set.

**Tech Stack:** Next.js App Router (RSC + `'use server'` actions + route handlers), TypeScript, Supabase service-role (`afxAdmin`), inline `var(--afx-*)` styling under `.afx-root`, `mono = 'var(--afx-mono)'`.

## Global Constraints

- **No test runner in this repo.** "Tests" = `npx tsc --noEmit -p tsconfig.json` (clean) + `npx next build` (success). Server-behavior correctness is proven by code review + the browser walkthrough in the Verification section — do NOT scaffold Jest/Vitest.
- **No migration, no new columns/triggers.** `individual_verified_at`, `entity_verified_at`, `individual_docs`, `entity_docs`, the anti-forge trigger, and the widened `kind` CHECK all already exist on prod. Any task that adds SQL is wrong.
- **Isolation invariants unchanged.** `individual_verified_at`/`entity_verified_at` remain staff-only, written only by staff review, stripped from the producer persist path. This phase READS them, never writes them from the producer side.
- **Legacy-safe.** An already-`entity_verified_at` producer must keep its verified card regardless of individual status. The hard gate applies only to NEW entity submissions/uploads.
- **No `deriveVisibility`/rating/cap change. No global status pill.** Per-section verified cards are the only status UI.
- **Entity panel props are passed byte-for-byte** as they are today — the restructure only changes WHEN the panel renders, never its props.
- Styling: inline styles only, `mono = 'var(--afx-mono)'`, match the palette of the existing verified/panel cards.

---

### Task 1: Server hard gate — reject entity submit + entity upload until individual verified

**Files:**
- Modify: `src/lib/afx/server/documentAccess.ts:14-17,25-31` (expose `individualVerifiedAt` on `DocAccess`)
- Modify: `src/app/api/afx/documents/upload/route.ts:32-36` (entity branch gate)
- Modify: `src/lib/afx/server/vettingStore.ts:30-37` (entity submit gate)
- Test: none (typecheck + build; behavior verified in the Verification section)

**Interfaces:**
- Consumes: existing `resolveDocAccess()`, `submitForVetting({ kind, targetId })`, `isEntityVettingReady`.
- Produces: `DocAccess.individualVerifiedAt: string | null` — the entity upload branch and any future entity-scope guard read it. Entity submit now returns `{ ok:false, error:'Complete individual vetting before submitting the entity' }` when the marker is null; entity upload returns HTTP 403 with `'Complete individual vetting before uploading company documents'`.

- [ ] **Step 1: Extend `DocAccess` to carry the individual marker**

In `src/lib/afx/server/documentAccess.ts`, change the interface:

```ts
export interface DocAccess {
  producerId: string;
  ndaSigned: boolean;
  individualVerifiedAt: string | null;
}
```

And the resolver's select + return (the isolated column is not in the profile blob, so select it explicitly):

```ts
  const { data: producer } = await afxAdmin
    .from('afx_producers')
    .select('id, profile, individual_verified_at')
    .eq('user_id', user.id)
    .maybeSingle<{ id: string; profile: { ndaSigned?: boolean }; individual_verified_at: string | null }>();
  if (!producer) return null;
  return { producerId: producer.id, ndaSigned: !!producer.profile?.ndaSigned, individualVerifiedAt: producer.individual_verified_at ?? null };
```

- [ ] **Step 2: Gate entity-doc upload behind the individual marker**

In `src/app/api/afx/documents/upload/route.ts`, the entity branch currently reads:

```ts
  if (scope === 'entity') {
    if (await hasOpenSubmission(access.producerId, 'entity', null)) {
      return NextResponse.json({ error: 'Entity is locked for review — withdraw to edit' }, { status: 409 });
    }
    segment = 'entity';
  } else if (scope === 'individual') {
```

Insert the individual-verified precondition FIRST (before the open-submission lock), so entity docs cannot be staged before the gate opens:

```ts
  if (scope === 'entity') {
    if (!access.individualVerifiedAt) {
      return NextResponse.json({ error: 'Complete individual vetting before uploading company documents' }, { status: 403 });
    }
    if (await hasOpenSubmission(access.producerId, 'entity', null)) {
      return NextResponse.json({ error: 'Entity is locked for review — withdraw to edit' }, { status: 409 });
    }
    segment = 'entity';
  } else if (scope === 'individual') {
```

Do NOT touch the `individual` or `case_study` branches. The existing NDA gate (`scope !== 'individual' && !access.ndaSigned → 403`) stays and still applies to entity on top of this.

- [ ] **Step 3: Gate entity submit behind the individual marker**

In `src/lib/afx/server/vettingStore.ts`, the entity branch currently reads:

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
```

Add `individual_verified_at` to the select + type, and reject when it is null (before the readiness check):

```ts
  } else if (input.kind === 'entity') {
    const { data: prod } = await supabase
      .from('afx_producers').select('profile, entity_docs, individual_verified_at').eq('id', producerId)
      .single<{ profile: { entityK2?: boolean }; entity_docs: AfxDocument[] | null; individual_verified_at: string | null }>();
    if (!prod) return { ok: false, error: 'Producer not found' };
    if (!prod.individual_verified_at) {
      return { ok: false, error: 'Complete individual vetting before submitting the entity' };
    }
    if (!isEntityVettingReady({ entityK2: !!prod.profile?.entityK2, entityDocs: prod.entity_docs ?? undefined })) {
      return { ok: false, error: 'Entity is not vetting-ready (K2 + required company documents)' };
    }
  } else {
```

Do NOT touch the `case_study` or `individual` (else) branches.

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean (exit 0). Confirms the new `DocAccess.individualVerifiedAt` is consistently typed across the resolver and the upload route, and the new select type compiles.

Run: `npx next build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/lib/afx/server/documentAccess.ts src/app/api/afx/documents/upload/route.ts src/lib/afx/server/vettingStore.ts
git commit -m "feat(afx): server hard-gate — entity submit + upload require individual verified (phase 3)"
```

---

### Task 2: `EntityVettingLockedCard` component

**Files:**
- Create: `src/components/afx/producer/EntityVettingLockedCard.tsx`
- Test: none (typecheck + build; rendered in Task 3, seen in Verification)

**Interfaces:**
- Consumes: `SectionCard` from `./cockpitUi` (same wrapper `EntityVettingPanel` uses — title `"Company / Entity Vetting"`).
- Produces: `export default function EntityVettingLockedCard(): JSX.Element` — takes NO props. Task 3 renders `<EntityVettingLockedCard />` for company producers who are not yet individually verified and not yet entity-verified.

- [ ] **Step 1: Create the locked placeholder**

Create `src/components/afx/producer/EntityVettingLockedCard.tsx`. It wraps in the same `SectionCard` as the working panel (so the section header is consistent) and shows a muted, control-less lock notice. Match the neutral palette used by the on-file doc rows in `EntityVerifiedCard` (`#E4E2DC` border, muted greys):

```tsx
'use client';

import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

/** Company producers whose individual vetting is not yet verified see this in
 *  place of the working entity panel. Entity vetting is hard-gated behind the
 *  individual marker (also enforced server-side) — no upload/submit controls
 *  until FRA verifies the individual. Sibling to EntityVerifiedCard. */
export default function EntityVettingLockedCard() {
  return (
    <SectionCard title="Company / Entity Vetting" hint="locked">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#F6F5F2', border: '1px solid #E4E2DC' }}>
        <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: '#9A9CA3', letterSpacing: 0.4 }}>LOCKED</span>
        <span style={{ fontSize: 12.5, color: '#5E6066' }}>Complete individual vetting first to unlock company vetting.</span>
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx next build`
Expected: success (component compiles; unused until Task 3, which is fine).

- [ ] **Step 3: Commit**

```bash
git add src/components/afx/producer/EntityVettingLockedCard.tsx
git commit -m "feat(afx): EntityVettingLockedCard — gated placeholder for entity vetting (phase 3)"
```

---

### Task 3: Producer page — stack individual (always) + entity (company, gated) instead of XOR

**Files:**
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx` (import at top near line 23; render block at lines 240-272)
- Test: none (typecheck + build; full flow in Verification)

**Interfaces:**
- Consumes: `EntityVettingLockedCard` (Task 2); existing `IndividualVettingPanel`, `EntityVettingPanel`, `producerTypeOf`, `openIndividualSubmission`/`latestIndividualSubmission`, `openEntitySubmission`/`latestEntitySubmission`, and all `on*` handlers already in scope.
- Produces: the final producer render. Individual section renders for ALL producers; entity section renders only for `producerTypeOf(draft) === 'company'`, showing the locked card when `!entityVerifiedAt && !individualVerifiedAt`, else the working/verified `EntityVettingPanel`.

- [ ] **Step 1: Import the locked card**

In `src/app/afx/producer/ProducerProfileClient.tsx`, next to the existing `import EntityVettingPanel from '@/components/afx/producer/EntityVettingPanel';` (line 23), add:

```ts
import EntityVettingLockedCard from '@/components/afx/producer/EntityVettingLockedCard';
```

- [ ] **Step 2: Replace the XOR ternary with stacked conditional sections**

Replace the entire current block (lines 240-272), which reads:

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

with (individual now unconditional; entity now company-only + gated):

```tsx
            {/* Individual vetting — universal, always first (the operator/person). */}
            {(() => {
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
            })()}
            {/* Entity vetting — company producers only, hard-gated behind individual verification.
                Locked until individual verified UNLESS the entity is already verified (legacy-safe:
                EntityVettingPanel renders EntityVerifiedCard when entityVerifiedAt is set). */}
            {producerTypeOf(draft) === 'company' ? (
              !draft.entityVerifiedAt && !draft.individualVerifiedAt ? (
                <EntityVettingLockedCard />
              ) : (() => {
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
              })()
            ) : null}
```

The `EntityVettingPanel` props are copied verbatim from the current code — do not alter them. The gate `!draft.entityVerifiedAt && !draft.individualVerifiedAt` yields: new company producer (neither set) → locked; after individual approval (individual set, entity unset) → working panel; legacy already-verified entity (entity set) → panel renders its internal `EntityVerifiedCard`.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx next build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): stack individual (always) + entity (company, gated) vetting sections (phase 3)"
```

---

## Verification

No migration and no DB-level change, so there is no live SQL gate this phase; the server guard is application logic, exercised by the browser walkthrough. After all tasks:

1. `npx tsc --noEmit -p tsconfig.json` + `npx next build` both green.
2. Whole-branch opus review (via superpowers:requesting-code-review), focused on: the render restructure preserves `EntityVettingPanel`/`IndividualVettingPanel` props exactly; the gate boolean handles all four (individualVerifiedAt × entityVerifiedAt) combinations incl. legacy; the two server guards read the isolated `individual_verified_at` column (not the blob) and reject correctly; no isolation/marker-write regression.
3. Browser on prod (Gerhard's account is currently individual-type; switch it back to **company** to exercise the legacy + gate paths):
   - **Company, not individually verified, entity not verified:** entity section shows the `LOCKED` card (no controls); individual section shows the working panel.
   - **Legacy (company, `entity_verified_at` set, `individual_verified_at` unset):** entity section shows the verified card (earned, not stripped) AND the individual section shows its working panel.
   - **After individual submit → staff approve:** entity section flips from locked → working panel; upload an entity doc + submit → staff approve → both verified cards show.
   - **Server gate (optional direct check):** with individual unverified, an entity-scope upload returns 403 and an entity submit returns the "Complete individual vetting…" error (the UI already prevents reaching these, so this is a defense-in-depth spot-check via devtools/network if desired).
   - **Freelancer (individual-type):** only the individual section renders; no entity section.

## Self-Review

- **Spec coverage:** universal individual section (Task 3) ✓; company-only gated entity section with locked state (Tasks 2+3) ✓; server hard gate on submit AND upload (Task 1) ✓; legacy-safe verified card (Task 3 gate boolean) ✓; no migration / no visibility change / no global pill (Global Constraints) ✓.
- **Placeholder scan:** none — every code step contains the exact code.
- **Type consistency:** `DocAccess.individualVerifiedAt: string | null` defined in Task 1 and consumed only there (upload route); `EntityVettingLockedCard` default export (Task 2) imported/rendered in Task 3; `producerTypeOf`, `draft.individualVerifiedAt`, `draft.entityVerifiedAt` all already exist on the `ProducerProfile` draft from Phases 1–2.
