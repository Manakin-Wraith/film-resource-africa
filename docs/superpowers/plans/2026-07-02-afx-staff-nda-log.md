# Staff NDA Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A read-only staff page `/afx/staff/nda` showing each producer's current NDA status + full signature history, from the append-only `afx_nda_signatures` log.

**Architecture:** Mirrors the existing `/afx/staff/invites` pattern — a pure transform module (`ndaLog.ts`), a service-role staff-gated fetch (`staffNdaLog.ts`), a client component, a route, and a queue nav link. No migration, no new gate, no writes.

**Tech Stack:** Next.js App Router (server components + one `'use client'` component), TypeScript, Supabase service-role (`afxAdmin`), `resolveStaff()` gate, inline `var(--afx-*)` styling, `mono = 'var(--afx-mono)'`.

## Global Constraints

- **No unit-test runner.** "Tests" = `npx tsc --noEmit -p tsconfig.json` (clean) + `npx next build` (success). The pure `toNdaEntries` gets a `npx tsx` assertion script (repo root, deleted after) — do NOT scaffold Jest/Vitest.
- **Read-only. No migration, no new RLS/policy, no writes** to `afx_producers` or `afx_nda_signatures`.
- **All-staff access** via `resolveStaff()` (returns `StaffAccess | null`; any truthy = staff). The staff `layout.tsx` already redirects non-staff from `/afx/staff/*`; the page ALSO guards (`resolveStaff()` → `redirect('/afx/staff')`) like `invites/page.tsx`.
- **Service-role reads via `afxAdmin`** (imported from `@/lib/afx/server/documentAccess`) — this is the authorized staff path; RLS bypass is intended, exactly as `listInvites` does.
- ISO-8601 `created_at` strings compare lexicographically — sort with plain string comparison, no `Date` needed (and `new Date()` is fine here anyway, but unnecessary).
- Styling: inline styles, `mono = 'var(--afx-mono)'`, match `StaffInvites.tsx`/`StaffQueue.tsx` palette (`var(--afx-border)`, `var(--afx-faint)`, `var(--afx-ink)`).

---

### Task 1: Pure `ndaLog` module + assertion test

**Files:**
- Create: `src/lib/afx/ndaLog.ts`
- Test: `nda_log_assert.mts` (repo root, temporary — deleted in Step 5)

**Interfaces:**
- Produces: the types below + `toNdaEntries(sigs, producers): NdaProducerEntry[]`. Task 2 calls `toNdaEntries`; Task 3 renders `NdaProducerEntry`.

- [ ] **Step 1: Write the module**

Create `src/lib/afx/ndaLog.ts`:

```ts
export interface RawNdaSignature {
  id: string;
  producer_id: string;
  action: 'signed' | 'withdrawn';
  signer_name: string;
  doc_version: string;
  created_at: string;
}
export interface NdaLogEvent {
  id: string;
  action: 'signed' | 'withdrawn';
  signerName: string;
  docVersion: string;
  at: string;
}
export type NdaStatus = 'signed' | 'withdrawn' | 'legacy' | 'none';
export interface NdaProducerEntry {
  producerId: string;
  producerName: string;
  company: string;
  status: NdaStatus;
  current: { signerName: string; at: string; version: string } | null;
  events: NdaLogEvent[];
}
export interface NdaProducerInput {
  id: string;
  name: string;
  company: string;
  ndaSigned: boolean;
}

/** Group signature events per producer (newest first), derive current status, and
 *  emit one entry per producer that has ANY NDA activity (>=1 event OR ndaSigned).
 *  Legacy = ndaSigned true with no audit events (old one-click toggle). */
export function toNdaEntries(sigs: RawNdaSignature[], producers: NdaProducerInput[]): NdaProducerEntry[] {
  const byProducer = new Map<string, NdaLogEvent[]>();
  for (const s of sigs) {
    const ev: NdaLogEvent = { id: s.id, action: s.action, signerName: s.signer_name, docVersion: s.doc_version, at: s.created_at };
    const list = byProducer.get(s.producer_id);
    if (list) list.push(ev);
    else byProducer.set(s.producer_id, [ev]);
  }
  for (const list of byProducer.values()) list.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)); // newest first

  const entries: NdaProducerEntry[] = [];
  for (const p of producers) {
    const events = byProducer.get(p.id) ?? [];
    let status: NdaStatus;
    let current: NdaProducerEntry['current'] = null;
    if (events.length > 0) {
      const latest = events[0];
      status = latest.action === 'signed' ? 'signed' : 'withdrawn';
      if (status === 'signed') current = { signerName: latest.signerName, at: latest.at, version: latest.docVersion };
    } else if (p.ndaSigned) {
      status = 'legacy';
    } else {
      status = 'none';
    }
    if (events.length > 0 || p.ndaSigned) {
      entries.push({ producerId: p.id, producerName: p.name, company: p.company, status, current, events });
    }
  }

  const rank = (s: NdaStatus) => (s === 'signed' || s === 'legacy' ? 0 : 1); // covered first, withdrawn last
  const lastAt = (e: NdaProducerEntry) => (e.events.length > 0 ? e.events[0].at : '');
  entries.sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    if (lastAt(a) !== lastAt(b)) return lastAt(a) < lastAt(b) ? 1 : -1; // most recent activity first
    return a.producerName < b.producerName ? -1 : a.producerName > b.producerName ? 1 : 0;
  });
  return entries;
}
```

- [ ] **Step 2: Write the assertion test**

Create `nda_log_assert.mts` in the repo root:

```ts
import assert from 'node:assert';
import { toNdaEntries, type RawNdaSignature, type NdaProducerInput } from './src/lib/afx/ndaLog';

const producers: NdaProducerInput[] = [
  { id: 'p1', name: 'Alice', company: 'ACo', ndaSigned: true },   // withdrawn-latest
  { id: 'p2', name: 'Bob', company: 'BCo', ndaSigned: true },     // signed-latest
  { id: 'p3', name: 'Carol', company: 'CCo', ndaSigned: true },   // legacy (no events)
  { id: 'p4', name: 'Dave', company: 'DCo', ndaSigned: false },   // none → omitted
];
const sigs: RawNdaSignature[] = [
  { id: 's1', producer_id: 'p1', action: 'signed', signer_name: 'Alice', doc_version: '2026-07-02', created_at: '2026-07-01T10:00:00Z' },
  { id: 's2', producer_id: 'p1', action: 'withdrawn', signer_name: 'Alice', doc_version: '2026-07-02', created_at: '2026-07-02T09:00:00Z' },
  { id: 's3', producer_id: 'p2', action: 'signed', signer_name: 'Bob', doc_version: '2026-07-02', created_at: '2026-07-02T11:00:00Z' },
];

const entries = toNdaEntries(sigs, producers);

// p4 (none) omitted; p1,p2,p3 present
assert.strictEqual(entries.length, 3, 'omits pure-none producers');
assert.ok(!entries.find((e) => e.producerId === 'p4'), 'p4 not present');

const p1 = entries.find((e) => e.producerId === 'p1')!;
assert.strictEqual(p1.events[0].action, 'withdrawn', 'events newest-first'); // s2 is newer
assert.strictEqual(p1.status, 'withdrawn', 'status from latest event');
assert.strictEqual(p1.current, null, 'withdrawn has no current');
assert.strictEqual(p1.events.length, 2, 'both events grouped');

const p2 = entries.find((e) => e.producerId === 'p2')!;
assert.strictEqual(p2.status, 'signed', 'signed-latest');
assert.deepStrictEqual(p2.current, { signerName: 'Bob', at: '2026-07-02T11:00:00Z', version: '2026-07-02' }, 'current set from latest signed');

const p3 = entries.find((e) => e.producerId === 'p3')!;
assert.strictEqual(p3.status, 'legacy', 'ndaSigned + no events = legacy');
assert.strictEqual(p3.events.length, 0, 'legacy has no events');

// sort: covered (signed/legacy) before withdrawn; p1 (withdrawn) must be last
assert.strictEqual(entries[entries.length - 1].producerId, 'p1', 'withdrawn sorts after covered');

console.log('NDA_LOG_ASSERT_OK');
```

- [ ] **Step 3: Run the assertion (must fail if logic wrong, pass when right)**

Run: `npx tsx nda_log_assert.mts`
Expected: prints `NDA_LOG_ASSERT_OK` (exit 0).

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` — clean. Run: `npx next build` — success.

- [ ] **Step 5: Delete the test script + commit**

```bash
rm nda_log_assert.mts
git add src/lib/afx/ndaLog.ts
git commit -m "feat(afx): pure ndaLog toNdaEntries — per-producer NDA status + history"
```

---

### Task 2: Service-role staff data layer

**Files:**
- Create: `src/lib/afx/server/staffNdaLog.ts`

**Interfaces:**
- Consumes: `toNdaEntries` + types (Task 1); `afxAdmin`, `resolveStaff`.
- Produces: `listNdaSignatures(): Promise<NdaProducerEntry[]>`. Task 3's route calls it.

- [ ] **Step 1: Write the data layer**

Create `src/lib/afx/server/staffNdaLog.ts`:

```ts
import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { toNdaEntries, type RawNdaSignature, type NdaProducerEntry, type NdaProducerInput } from '@/lib/afx/ndaLog';

/** The NDA signature log for the staff view. Any staff; [] for anyone else. */
export async function listNdaSignatures(): Promise<NdaProducerEntry[]> {
  if (!(await resolveStaff())) return [];
  const { data: sigs } = await afxAdmin
    .from('afx_nda_signatures')
    .select('id, producer_id, action, signer_name, doc_version, created_at');
  const { data: producers } = await afxAdmin.from('afx_producers').select('id, profile');
  const producerInputs: NdaProducerInput[] = ((producers ?? []) as { id: string; profile: { name?: string; company?: string; ndaSigned?: boolean } }[])
    .map((p) => ({ id: p.id, name: p.profile?.name ?? '—', company: p.profile?.company ?? '', ndaSigned: !!p.profile?.ndaSigned }));
  return toNdaEntries((sigs ?? []) as RawNdaSignature[], producerInputs);
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` — clean. Run: `npx next build` — success.

- [ ] **Step 3: Commit**

```bash
git add src/lib/afx/server/staffNdaLog.ts
git commit -m "feat(afx): listNdaSignatures staff data layer (service-role, resolveStaff-gated)"
```

---

### Task 3: Component + route + queue nav link

**Files:**
- Create: `src/components/afx/staff/StaffNdaLog.tsx`
- Create: `src/app/afx/staff/nda/page.tsx`
- Modify: `src/app/afx/staff/page.tsx` (add the nav link)

**Interfaces:**
- Consumes: `listNdaSignatures` (Task 2), `NdaProducerEntry` (Task 1).
- Produces: the page + nav entry. Terminal — nothing consumes it.

- [ ] **Step 1: Write the component**

Create `src/components/afx/staff/StaffNdaLog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NdaProducerEntry, NdaStatus } from '@/lib/afx/ndaLog';

const mono = 'var(--afx-mono)';

const STATUS_META: Record<NdaStatus, { label: string; ink: string; bg: string; border: string }> = {
  signed: { label: 'Signed', ink: '#2E7D46', bg: '#F2FBF4', border: '#CDEAD5' },
  legacy: { label: 'Signed · legacy', ink: '#5E9A6E', bg: '#F4F8F5', border: '#D8E6DC' },
  withdrawn: { label: 'Withdrawn', ink: '#9A6B1E', bg: '#FBF6EC', border: '#EAD9BE' },
  none: { label: 'Not signed', ink: 'var(--afx-faint)', bg: '#F6F5F2', border: 'var(--afx-border)' },
};

function EventBadge({ action }: { action: 'signed' | 'withdrawn' }) {
  const s = action === 'signed' ? STATUS_META.signed : STATUS_META.withdrawn;
  return <span style={{ fontFamily: mono, fontSize: 9.5, fontWeight: 700, color: s.ink, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '2px 8px' }}>{action}</span>;
}

export default function StaffNdaLog({ entries }: { entries: NdaProducerEntry[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--afx-ink)', margin: 0 }}>NDA signatures</h1>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
      </div>
      {entries.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--afx-faint)', padding: '20px 0' }}>No NDA activity yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e) => {
            const m = STATUS_META[e.status];
            const isOpen = !!open[e.producerId];
            return (
              <div key={e.producerId} style={{ border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)' }}>{e.producerName}{e.company ? <span style={{ color: 'var(--afx-faint)', fontWeight: 400 }}> · {e.company}</span> : null}</div>
                    <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)', marginTop: 3 }}>
                      {e.current ? `by ${e.current.signerName} · ${e.current.at.slice(0, 10)} · NDA v${e.current.version}` : e.status === 'legacy' ? 'signed before the audit log existed' : '—'}
                    </div>
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: m.ink, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 999, padding: '3px 10px' }}>{m.label}</span>
                  {e.events.length > 0 ? (
                    <button onClick={() => setOpen((o) => ({ ...o, [e.producerId]: !o[e.producerId] }))}
                      style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--afx-border)', borderRadius: 7, padding: '5px 10px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: 'var(--afx-muted)' }}>
                      {isOpen ? '▾' : '▸'} {e.events.length} event{e.events.length === 1 ? '' : 's'}
                    </button>
                  ) : null}
                </div>
                {isOpen && e.events.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--afx-border)' }}>
                    {e.events.map((ev) => (
                      <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <EventBadge action={ev.action} />
                        <span style={{ fontSize: 12.5, color: 'var(--afx-ink)' }}>{ev.signerName}</span>
                        <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginLeft: 'auto' }}>NDA v{ev.docVersion} · {ev.at.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write the route**

Create `src/app/afx/staff/nda/page.tsx` (mirrors `invites/page.tsx`):

```tsx
import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listNdaSignatures } from '@/lib/afx/server/staffNdaLog';
import StaffNdaLog from '@/components/afx/staff/StaffNdaLog';

export default async function AfxStaffNdaPage() {
  const staff = await resolveStaff();
  if (!staff) redirect('/afx/staff');
  const entries = await listNdaSignatures();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffNdaLog entries={entries} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Add the queue nav link**

In `src/app/afx/staff/page.tsx`, in the nav `<div>` add the NDA-log link immediately after the `Invites →` link (all staff, NOT admin-gated):

```tsx
          <Link href="/afx/staff/invites" style={navLink}>Invites →</Link>
          <Link href="/afx/staff/nda" style={navLink}>NDA log →</Link>
          {staff?.role === 'admin' ? (
            <Link href="/afx/staff/team" style={navLink}>Manage team →</Link>
          ) : null}
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` — clean. Run: `npx next build` — success (a new `/afx/staff/nda` route appears in the manifest).

- [ ] **Step 5: Commit**

```bash
git add src/components/afx/staff/StaffNdaLog.tsx src/app/afx/staff/nda/page.tsx src/app/afx/staff/page.tsx
git commit -m "feat(afx): staff NDA log page + queue nav link"
```

## Verification (controller, after Task 3)

- Whole-branch review (optional for a read-only feature): confirm `toNdaEntries` status/sort correctness, service layer is staff-gated + read-only, no writes, the page redirects non-staff, styling matches the staff surface.
- Browser on prod (Gerhard = staff admin + test producer): open `/afx/staff` → click "NDA log →" → see Gerhard's entry with status **Signed** (`by Gerhard Mostert · 2026-07-02 · NDA v2026-07-02`), expand to the full history (his `withdrawn` then `signed` events from today's testing).

## Self-Review

- **Spec coverage:** per-producer status + expandable history (Task 3 UI, Task 1 logic) ✓; legacy reconciliation (Task 1 `legacy`, Task 2 reads `ndaSigned`) ✓; all-staff gate (Task 2 `resolveStaff`, route redirect) ✓; nav link (Task 3) ✓; no migration/writes (Global Constraints) ✓.
- **Placeholder scan:** none — every step has complete code.
- **Type consistency:** `NdaProducerEntry`/`NdaProducerInput`/`RawNdaSignature`/`NdaStatus` defined in Task 1, imported in Task 2 (`toNdaEntries` call + input mapping) and Task 3 (`entries` prop + `STATUS_META` keyed by `NdaStatus`); `listNdaSignatures` return type matches the route's `entries`.
