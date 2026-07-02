# NDA Read-and-Sign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the one-click `ndaSigned` toggle with an inline read-and-sign NDA flow backed by an append-only signature audit table.

**Architecture:** A new `afx_nda_signatures` append-only table (immutability via RLS) records each sign/withdraw event. A versioned NDA constant is rendered inline in the "Confidentiality (NDA)" card; typed-name click-through calls `signNda`/`withdrawNda` server actions that log the event, while the client sets `ndaSigned`/`ndaSignature` on the profile through the existing persist path. Every existing `ndaSigned` gate is untouched.

**Tech Stack:** Next.js App Router (`'use server'` actions, client components), TypeScript, Supabase (session client `createSupabaseServerClient` — RLS-scoped, NOT service-role, for the audit writes), inline `var(--afx-*)` styling, `mono = 'var(--afx-mono)'`.

## Global Constraints

- **No unit-test runner.** "Tests" = `npx tsc --noEmit -p tsconfig.json` (clean) + `npx next build` (success), plus a live supabase-js gate script (repo root, deleted after) for the RLS behavior. Do NOT scaffold Jest/Vitest.
- **Migration is applied on prod by the USER** via the Dashboard SQL editor (MCP can't reach the AFX project `rcgynwcttgvqcnbyfhiz`). The plan creates the migration FILE; a later task hands the SQL over and runs the live gate.
- **`ndaSigned` gate semantics are unchanged.** Exact-figure entry (`CaseStudyDrawer`, `LiveSlateZone`, aggregates) and entity-doc upload (`resolveDocAccess`) still read `ndaSigned`. `deriveVisibility` untouched. The NDA remains a producer-self-asserted gate; the new table is the audit trail.
- **`ndaSignature` rides in the profile blob** — it is a normal `ProducerProfile` field, so it round-trips through `persistProfile`/`rowsToProfile` automatically. Do NOT add an isolated column or touch `persistence.ts`.
- **Append-only via RLS** (SELECT + INSERT policies only; no UPDATE/DELETE policy). Do NOT add an UPDATE/DELETE trigger — it would break the `on delete cascade` from `afx_producers`.
- **Server actions and client components MAY use `new Date()`** (the no-`Date.now()` rule is a Workflow-script restriction only).
- Styling: inline styles, `mono = 'var(--afx-mono)'`, match the existing card palette.
- **NDA body text is a required input (Task 2).** If the real tripartite NDA text is not yet supplied, use the clearly-marked placeholder body and interpolation tokens exactly as written here; the controller substitutes the real text before merge.

---

### Task 1: Migration file + types

**Files:**
- Create: `supabase/migrations/20260702_afx_nda_signatures.sql`
- Modify: `src/lib/afx/types.ts` (add `NdaSignature`; add `ndaSignature?` to `ProducerProfile`)
- Test: none (typecheck + build; RLS proven live in Task 5)

**Interfaces:**
- Produces: table `afx_nda_signatures (id, producer_id, action, signer_name, doc_version, created_at)`; `export interface NdaSignature { name: string; signedAt: string; version: string }`; `ProducerProfile.ndaSignature?: NdaSignature | null`. Task 3 inserts rows; Tasks 3–4 read/write `ndaSignature`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260702_afx_nda_signatures.sql`:

```sql
-- AFX NDA read-and-sign: append-only signature audit log.
create table if not exists public.afx_nda_signatures (
  id           uuid primary key default gen_random_uuid(),
  producer_id  uuid not null references public.afx_producers on delete cascade,
  action       text not null check (action in ('signed','withdrawn')),
  signer_name  text not null,
  doc_version  text not null,
  created_at   timestamptz not null default now()
);
create index if not exists afx_nda_sig_producer_idx
  on public.afx_nda_signatures (producer_id, created_at desc);

alter table public.afx_nda_signatures enable row level security;

-- Append-only for client roles: producers may SELECT and INSERT their own rows.
-- No UPDATE/DELETE policy → authenticated/anon cannot mutate history (immutable).
-- Service-role and the on-delete cascade from afx_producers bypass RLS.
create policy afx_nda_sig_sel on public.afx_nda_signatures for select
  using (producer_id in (select id from public.afx_producers where user_id = auth.uid()));
create policy afx_nda_sig_ins on public.afx_nda_signatures for insert
  with check (producer_id in (select id from public.afx_producers where user_id = auth.uid()));
```

- [ ] **Step 2: Add the types**

In `src/lib/afx/types.ts`, add the interface (near the other AFX interfaces, e.g. just above `ProducerProfile`):

```ts
export interface NdaSignature {
  name: string;      // full legal name as typed by the signer
  signedAt: string;  // ISO timestamp
  version: string;   // NDA_VERSION at signing
}
```

And add the field to `ProducerProfile`, immediately after the `ndaSigned: boolean;` line:

```ts
  ndaSigned: boolean;
  /** Denormalized current NDA signature for display (name/date/version). Profile blob;
   *  null when unsigned/withdrawn. The immutable audit trail lives in afx_nda_signatures. */
  ndaSignature?: NdaSignature | null;
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` — expected clean.
Run: `npx next build` — expected success.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260702_afx_nda_signatures.sql src/lib/afx/types.ts
git commit -m "feat(afx): afx_nda_signatures migration + NdaSignature type (nda phase)"
```

---

### Task 2: NDA document module

**Files:**
- Create: `src/lib/afx/nda.ts`
- Test: none (typecheck + build; rendering seen in Task 4)

**Interfaces:**
- Produces: `NDA_VERSION: string`; `NDA_BODY: string`; `renderNda(p: { producerName: string; company?: string; date: string }): string`. Task 4 renders `renderNda(...)`; Task 3 imports `NDA_VERSION`.

- [ ] **Step 1: Create the module**

Create `src/lib/afx/nda.ts`. `NDA_BODY` uses `{{producerName}}`, `{{company}}`, `{{date}}`, `{{fraSignatories}}` tokens interpolated by `renderNda`. **The body below is a placeholder — replace with the real tripartite NDA text (Producer↔FRA, Jarred & Cati as FRA signatories) before merge; keep the token names.**

```ts
export const NDA_VERSION = '2026-07-02';

// TODO(nda-content): replace with the real tripartite NDA body, generalized to
// Producer <-> FRA with Jarred & Cati as FRA's signatories. Keep the {{tokens}}.
export const NDA_BODY = `MUTUAL NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on {{date}} between
Film Resource Africa, represented by {{fraSignatories}} ("FRA"), and
{{producerName}} of {{company}} ("Producer").

1. Confidential Information. Each party may disclose confidential business and
   financial information to the other in connection with FRA's deal-screening
   platform. Exact figures entered by the Producer are Confidential Information.

2. Obligations. The receiving party shall keep Confidential Information secret,
   use it only for evaluating and facilitating financing opportunities, and not
   disclose it to third parties without the disclosing party's written consent.

3. Term. This Agreement remains in effect for the duration of the parties'
   relationship and for three (3) years thereafter.

4. No License. Nothing herein grants any rights other than as expressly stated.

By signing below, the Producer confirms they have read and agree to this
Agreement as of {{date}}.`;

/** Interpolate the per-producer fields into the versioned NDA body. */
export function renderNda(p: { producerName: string; company?: string; date: string }): string {
  return NDA_BODY
    .replaceAll('{{producerName}}', p.producerName || '—')
    .replaceAll('{{company}}', (p.company && p.company.trim()) || 'an independent capacity')
    .replaceAll('{{date}}', p.date)
    .replaceAll('{{fraSignatories}}', 'Jarred & Cati');
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` — expected clean.
Run: `npx next build` — expected success.

- [ ] **Step 3: Commit**

```bash
git add src/lib/afx/nda.ts
git commit -m "feat(afx): versioned NDA document + renderNda (nda phase)"
```

---

### Task 3: Signature store + server actions

**Files:**
- Create: `src/lib/afx/server/ndaStore.ts`
- Modify: `src/app/afx/producer/actions.ts` (add `signNdaAction`, `withdrawNdaAction`)
- Test: none (typecheck + build; behavior via Task 5 live gate + browser)

**Interfaces:**
- Consumes: `NDA_VERSION` (Task 2), `NdaSignature` (Task 1), `createSupabaseServerClient`/`getSessionUser`.
- Produces: `signNda({ name }): Promise<{ ok: boolean; signature?: NdaSignature; error?: string }>`; `withdrawNda({ lastSignerName }): Promise<{ ok: boolean; error?: string }>`; thin action wrappers `signNdaAction`/`withdrawNdaAction`. Task 4's client handlers call the actions.

- [ ] **Step 1: Create the store**

Create `src/lib/afx/server/ndaStore.ts`. Uses the session client (RLS enforces producer ownership on insert — no service-role needed). `resolveProducerId` mirrors the private helper in `vettingStore.ts`:

```ts
import 'server-only';
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server';
import { NDA_VERSION } from '@/lib/afx/nda';
import type { NdaSignature } from '@/lib/afx/types';

async function resolveProducerId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('afx_producers').select('id').eq('user_id', user.id).single<{ id: string }>();
  return data?.id ?? null;
}

/** Log a 'signed' event (append-only) and return the signature to store on the profile. */
export async function signNda(input: { name: string }): Promise<{ ok: boolean; signature?: NdaSignature; error?: string }> {
  const name = (input.name ?? '').trim();
  if (!name) return { ok: false, error: 'Full name is required' };
  const producerId = await resolveProducerId();
  if (!producerId) return { ok: false, error: 'Not authenticated' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('afx_nda_signatures')
    .insert({ producer_id: producerId, action: 'signed', signer_name: name, doc_version: NDA_VERSION });
  if (error) return { ok: false, error: 'Could not record signature' };
  return { ok: true, signature: { name, signedAt: new Date().toISOString(), version: NDA_VERSION } };
}

/** Log a 'withdrawn' event (append-only). The prior signature record is preserved. */
export async function withdrawNda(input: { lastSignerName?: string }): Promise<{ ok: boolean; error?: string }> {
  const producerId = await resolveProducerId();
  if (!producerId) return { ok: false, error: 'Not authenticated' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('afx_nda_signatures')
    .insert({ producer_id: producerId, action: 'withdrawn', signer_name: (input.lastSignerName ?? '').trim() || 'unknown', doc_version: NDA_VERSION });
  if (error) return { ok: false, error: 'Could not record withdrawal' };
  return { ok: true };
}
```

- [ ] **Step 2: Add the action wrappers**

In `src/app/afx/producer/actions.ts`, add imports and two wrappers alongside the existing ones (keep the `'use server'` directive at the top of the file):

```ts
import { signNda, withdrawNda } from '@/lib/afx/server/ndaStore';
import type { NdaSignature } from '@/lib/afx/types';

export async function signNdaAction(input: { name: string }): Promise<{ ok: boolean; signature?: NdaSignature; error?: string }> {
  return signNda(input);
}

export async function withdrawNdaAction(input: { lastSignerName?: string }): Promise<{ ok: boolean; error?: string }> {
  return withdrawNda(input);
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` — expected clean.
Run: `npx next build` — expected success.

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/server/ndaStore.ts src/app/afx/producer/actions.ts
git commit -m "feat(afx): signNda/withdrawNda store + actions (nda phase)"
```

---

### Task 4: `NdaUpgrade` card rewrite + client wiring

**Files:**
- Rewrite: `src/components/afx/producer/NdaUpgrade.tsx`
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx` (imports; remove `toggleNda`; add `ndaBusy` + `onSignNda`/`onWithdrawNda`; update the `<NdaUpgrade>` call)
- Test: none (typecheck + build; full flow in Task 5 browser)

**Interfaces:**
- Consumes: `renderNda`/`NDA_VERSION` (Task 2), `signNdaAction`/`withdrawNdaAction` (Task 3), `NdaSignature` (Task 1).
- Produces: the new card + wiring. `ndaSigned`/`ndaSignature` on the draft are set from the action results and persisted via the existing `persistProfileAction`.

- [ ] **Step 1: Rewrite the card**

Replace the entire contents of `src/components/afx/producer/NdaUpgrade.tsx` with the three-state read-and-sign card:

```tsx
'use client';

import { useState } from 'react';
import { SectionCard } from './cockpitUi';
import { renderNda } from '@/lib/afx/nda';
import type { NdaSignature } from '@/lib/afx/types';

const mono = 'var(--afx-mono)';

interface Props {
  signed: boolean;
  signature: NdaSignature | null;
  producerName: string;
  company?: string;
  busy: boolean;
  onSign: (name: string) => void;
  onWithdraw: () => void;
}

export default function NdaUpgrade({ signed, signature, producerName, company, busy, onSign, onWithdraw }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const docText = renderNda({ producerName, company, date: today });
  const canSign = name.trim().length > 0 && agreed && !busy;

  const docBox = (
    <pre style={{ maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--afx-body)', fontSize: 12.5, lineHeight: 1.55, color: '#3A3B40', background: '#FAF9F6', border: '1px solid #EDEBE4', borderRadius: 10, padding: '14px 16px', margin: 0 }}>{docText}</pre>
  );

  if (signed && signature) {
    return (
      <SectionCard title="Confidentiality (NDA)" hint="signed · read-only">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#F2FBF4', border: '1px solid #CDEAD5' }}>
          <span aria-hidden style={{ fontSize: 15, color: '#2E7D46' }}>✓</span>
          <span style={{ fontSize: 13, color: '#2E7D46' }}>
            Signed by <strong>{signature.name}</strong> on {signature.signedAt.slice(0, 10)}
          </span>
          <span style={{ fontFamily: mono, fontSize: 10, color: '#5E9A6E', marginLeft: 'auto' }}>NDA v{signature.version}</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-prov-verified)', marginTop: 8 }}>
          ✓ NDA signed — exact-figure entry unlocked (USD or ZAR) on every budget, capital-stack and funding field
        </div>
        {expanded ? <div style={{ marginTop: 12 }}>{docBox}</div> : null}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={() => setExpanded((v) => !v)} style={ghost}>{expanded ? 'Hide agreement' : 'View agreement'}</button>
          <button onClick={onWithdraw} disabled={busy} style={{ ...ghost, marginLeft: 'auto', color: '#B23B3B', borderColor: '#E4C4C4' }}>Withdraw</button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Confidentiality (NDA)" hint="optional upgrade">
      <div style={{ fontSize: 13.5, color: '#5E6066', lineHeight: 1.5 }}>
        Sign the FRA↔producer NDA to add <strong>exact figures</strong> to your bands. Exact numbers stay private —
        funders still see only bands — but they lift your confidence from self-reported to confirmed and raise your rating.
      </div>
      {!expanded ? (
        <button onClick={() => setExpanded(true)} disabled={busy} style={{ ...primary, marginTop: 12 }}>Review &amp; sign NDA</button>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {docBox}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full legal name"
            style={{ fontFamily: 'var(--afx-body)', fontSize: 13.5, padding: '9px 12px', borderRadius: 9, border: '1px solid #E4E2DC' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#5E6066' }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            I have read and agree to this agreement.
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onSign(name.trim())} disabled={!canSign} style={{ ...primary, opacity: canSign ? 1 : 0.5, cursor: canSign ? 'pointer' : 'not-allowed' }}>Sign agreement</button>
            <button onClick={() => { setExpanded(false); setAgreed(false); }} disabled={busy} style={ghost}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ fontFamily: mono, fontSize: 10.5, color: '#9A9CA3', marginTop: 8 }}>Not signed — bands only</div>
    </SectionCard>
  );
}

const primary: React.CSSProperties = { cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9, border: '1px solid #1C1D21', background: '#1C1D21', color: '#fff' };
const ghost: React.CSSProperties = { cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' };
```

- [ ] **Step 2: Wire the client**

In `src/app/afx/producer/ProducerProfileClient.tsx`:

(a) Add the action imports to the existing `./actions` import (line 5):

```ts
import { persistProfileAction, submitForVettingAction, withdrawVettingAction, signNdaAction, withdrawNdaAction } from './actions';
```

(b) Add an `ndaBusy` state next to `vettingBusy` (line 39):

```ts
  const [ndaBusy, setNdaBusy] = useState(false);
```

(c) Replace the `toggleNda` line (line 209):

```ts
  const toggleNda = () => setDraft((d) => ({ ...d, ndaSigned: !d.ndaSigned }));
```

with the two handlers:

```ts
  const onSignNda = async (name: string) => {
    if (ndaBusy) return;
    setNdaBusy(true);
    setActionError(null);
    try {
      const res = await signNdaAction({ name });
      if (res.ok && res.signature) {
        const next = { ...draft, ndaSigned: true, ndaSignature: res.signature };
        setDraft(next);
        await persistProfileAction(next);
      } else setActionError(res.error ?? 'Could not sign the NDA');
    } catch {
      setActionError('Could not sign the NDA — please try again');
    } finally {
      setNdaBusy(false);
    }
  };
  const onWithdrawNda = async () => {
    if (ndaBusy) return;
    setNdaBusy(true);
    setActionError(null);
    try {
      const res = await withdrawNdaAction({ lastSignerName: draft.ndaSignature?.name });
      if (res.ok) {
        const next = { ...draft, ndaSigned: false, ndaSignature: null };
        setDraft(next);
        await persistProfileAction(next);
      } else setActionError(res.error ?? 'Could not withdraw the NDA');
    } catch {
      setActionError('Could not withdraw the NDA — please try again');
    } finally {
      setNdaBusy(false);
    }
  };
```

(d) Replace the `<NdaUpgrade>` call (line 239):

```tsx
            <NdaUpgrade signed={!!draft.ndaSigned} onToggle={toggleNda} />
```

with:

```tsx
            <NdaUpgrade
              signed={!!draft.ndaSigned}
              signature={draft.ndaSignature ?? null}
              producerName={draft.name}
              company={draft.company}
              busy={ndaBusy}
              onSign={onSignNda}
              onWithdraw={onWithdrawNda}
            />
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` — expected clean (the old `onToggle` prop is gone; `NdaUpgrade`'s new Props are satisfied).
Run: `npx next build` — expected success.

- [ ] **Step 4: Commit**

```bash
git add src/components/afx/producer/NdaUpgrade.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): inline read-and-sign NDA card + client wiring (nda phase)"
```

---

### Task 5: Prod migration apply + live gate

**Files:**
- Temporary: `live_gate_nda.mjs` (repo root, deleted after)
- Test: the live gate itself

**Interfaces:** none produced; this task verifies the deployed schema + RLS.

- [ ] **Step 1: Hand the migration SQL to the USER**

The controller supplies the contents of `supabase/migrations/20260702_afx_nda_signatures.sql` to the user to run in the Dashboard SQL editor (`https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new`), and waits for "SQL has run". (Idempotent: `create table if not exists` + `create index if not exists`; the `create policy` statements error if re-run, so run once.)

- [ ] **Step 2: Write + run the live gate**

Create `live_gate_nda.mjs` in the repo root (loads `.env.local`, uses `@supabase/supabase-js`). It must assert, using a disposable auth user + a service-role-inserted producer row:
1. Service-role can `select` from `afx_nda_signatures` (table exists).
2. An authenticated producer can INSERT a `{action:'signed', signer_name, doc_version}` row for their own producer_id, and SELECT it back.
3. The authenticated producer CANNOT UPDATE that row (RLS: no update policy → 0 rows affected / error) and CANNOT DELETE it (append-only holds).
4. An authenticated producer CANNOT insert a row for a DIFFERENT producer_id (RLS ownership).
Print `LIVE_GATE_OK` when all pass; clean up (delete producer row → cascades the signatures; delete auth user).

Run: `node live_gate_nda.mjs` — expected `LIVE_GATE_OK`.

- [ ] **Step 3: Delete the gate script**

```bash
rm live_gate_nda.mjs
```

## Verification (controller, after Task 5)

- Whole-branch opus review (via superpowers:requesting-code-review), focused on: the audit table is append-only (RLS, no update/delete; no immutability trigger that would break cascade); `ndaSignature` rides in the blob (no `persistence.ts` change, no isolated-column claim); `signNda`/`withdrawNda` reject unauthenticated + empty name; the card's `canSign` gate; no change to any `ndaSigned` gate consumer or `deriveVisibility`; the real NDA text has replaced the placeholder (or is explicitly deferred).
- Browser on prod (Gerhard = test producer): Confidentiality card → Review & sign → doc renders with his name/company/date → Sign disabled until name + checkbox → Sign → card shows "Signed by … · NDA v…", exact-figure entry unlocks → Withdraw → figures re-gate, a `withdrawn` row appended (prior `signed` row still present).

## Self-Review

- **Spec coverage:** append-only table + RLS immutability (Task 1/5) ✓; versioned parameterized doc (Task 2) ✓; typed-name click-through + sign/withdraw actions logging events (Task 3) ✓; inline three-state card with read-gate checkbox (Task 4) ✓; `ndaSigned` gate unchanged (Global Constraints; Task 4 sets it via existing persist path) ✓; live gate proves RLS append-only (Task 5) ✓.
- **Placeholder scan:** the NDA body is a deliberately-marked required input (Global Constraints + Task 2 TODO), not a hidden gap; every code step is complete.
- **Type consistency:** `NdaSignature { name, signedAt, version }` defined in Task 1, consumed in Tasks 3 (return) and 4 (prop); `ndaSignature?: NdaSignature | null` on `ProducerProfile`; `signNdaAction`/`withdrawNdaAction` signatures match between `actions.ts` (Task 3) and the client handlers (Task 4); `renderNda({ producerName, company, date })` signature matches the Task 4 call.
