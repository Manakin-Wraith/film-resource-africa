# AFX Staff Invite/Activation Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all FRA staff a read-only view on the staff surface of the producer invite funnel — every `afx_invites` row as pending or activated ("logged in from the invite"), with activation date, producer name/company, and last-active.

**Architecture:** Mirrors the shipped staff-team surface. Pure, unit-tested projection/sort logic lives in a `'server-only'`-free module; a service-role data layer composes the DB reads behind `resolveStaff()`; a read-only route + client component render the list; the queue page gets an all-staff nav link. No migration — `afx_invites` already exists and is service-role-only.

**Tech Stack:** Next.js App Router (RSC), `@supabase/supabase-js` 2.105.3 (service-role client + `auth.admin.listUsers`), TypeScript, inline `var(--afx-*)` styling.

## Global Constraints

- **No migration.** `afx_invites` already exists: `id uuid pk`, `email text unique`, `created_at timestamptz`, `redeemed_at timestamptz` (null = pending), `redeemed_by uuid references auth.users`. Do not alter it.
- **All `afx_invites` / `afx_producers` access via `afxAdmin` (service-role).** Both have RLS with no relevant client read policies; never query them with an anon/user client.
- **Visible to ANY staff** (reviewer or admin). The gate is `resolveStaff()` truthy — NOT admin-only.
- **Read-only.** No invite creation/edit/revoke in this slice.
- **`last_sign_in_at`** comes from `afxAdmin.auth.admin.listUsers({ page, perPage })`, paged until a page returns fewer than `perPage`; a page error stops paging and leaves the rest unresolved (`null`).
- **Client component may only `import type` from the pure module**, never from the `server-only` data layer (would pull `server-only` into the client bundle).
- **`StaffAccess`** (`src/lib/afx/server/staffAccess.ts`): `{ userId: string; role: 'reviewer' | 'admin' }`.
- **Verification idiom (no test runner):** `npx tsc --noEmit -p tsconfig.json`, `npx next build`, `npx tsx` scripts in the REPO ROOT (deleted after). Live scripts load `.env.local` via `dotenv` (`config({ path: '.env.local' })`), target prod (`rcgynwcttgvqcnbyfhiz`), and mint disposable auth users with `admin.auth.admin.createUser`. Local `.ts` imports from `.mts` test files must be **extensionless** (bundler resolution) — do not add a `.ts` suffix and do not touch `tsconfig.json`.

---

### Task 1: Pure invite-funnel projection (`inviteFunnel.ts`)

The row projection + sort, isolated from any DB so it can be unit-tested directly. MUST NOT import `'server-only'`.

**Files:**
- Create: `src/lib/afx/inviteFunnel.ts`
- Test: `test_invite_funnel.mts` (repo root, temporary — deleted in Task 4)

**Interfaces:**
- Produces:
  - `interface RawInvite { id: string; email: string; created_at: string; redeemed_at: string | null; redeemed_by: string | null }`
  - `interface InviteRow { id: string; email: string; status: 'pending' | 'activated'; invitedAt: string; activatedAt: string | null; producerName: string | null; company: string | null; lastActiveAt: string | null }`
  - `toInviteRow(raw: RawInvite, producer: { name?: string; company?: string } | null, lastActiveAt: string | null): InviteRow`
  - `sortInvites(rows: InviteRow[]): InviteRow[]`

- [ ] **Step 1: Write the failing test**

Create `test_invite_funnel.mts` (repo root):

```ts
import assert from 'node:assert';
import { toInviteRow, sortInvites, type InviteRow } from './src/lib/afx/inviteFunnel';

// pending → nulls, status pending
const pending = toInviteRow({ id: 'i1', email: 'a@x.com', created_at: '2026-06-01T00:00:00Z', redeemed_at: null, redeemed_by: null }, null, null);
assert.equal(pending.status, 'pending');
assert.equal(pending.activatedAt, null);
assert.equal(pending.producerName, null);
assert.equal(pending.company, null);
assert.equal(pending.lastActiveAt, null);
assert.equal(pending.invitedAt, '2026-06-01T00:00:00Z');

// activated with producer + last active
const act = toInviteRow(
  { id: 'i2', email: 'b@x.com', created_at: '2026-06-02T00:00:00Z', redeemed_at: '2026-06-10T00:00:00Z', redeemed_by: 'u2' },
  { name: 'Bee Films', company: 'Bee Ltd' }, '2026-06-30T00:00:00Z');
assert.equal(act.status, 'activated');
assert.equal(act.activatedAt, '2026-06-10T00:00:00Z');
assert.equal(act.producerName, 'Bee Films');
assert.equal(act.company, 'Bee Ltd');
assert.equal(act.lastActiveAt, '2026-06-30T00:00:00Z');

// activated but producer row missing → nulls, still activated
const actNoProd = toInviteRow(
  { id: 'i3', email: 'c@x.com', created_at: '2026-06-03T00:00:00Z', redeemed_at: '2026-06-11T00:00:00Z', redeemed_by: 'u3' }, null, null);
assert.equal(actNoProd.status, 'activated');
assert.equal(actNoProd.producerName, null);
assert.equal(actNoProd.lastActiveAt, null);

// sort: pending first (oldest invite first); then activated (most recently activated first)
const rows: InviteRow[] = [
  { id: 'p-new', email: '', status: 'pending', invitedAt: '2026-06-05T00:00:00Z', activatedAt: null, producerName: null, company: null, lastActiveAt: null },
  { id: 'a-old', email: '', status: 'activated', invitedAt: '2026-05-01T00:00:00Z', activatedAt: '2026-06-01T00:00:00Z', producerName: null, company: null, lastActiveAt: null },
  { id: 'p-old', email: '', status: 'pending', invitedAt: '2026-06-01T00:00:00Z', activatedAt: null, producerName: null, company: null, lastActiveAt: null },
  { id: 'a-new', email: '', status: 'activated', invitedAt: '2026-05-02T00:00:00Z', activatedAt: '2026-06-20T00:00:00Z', producerName: null, company: null, lastActiveAt: null },
];
assert.deepEqual(sortInvites(rows).map((r) => r.id), ['p-old', 'p-new', 'a-new', 'a-old']);

// sort does not mutate input
const before = rows.map((r) => r.id);
sortInvites(rows);
assert.deepEqual(rows.map((r) => r.id), before);

console.log('INVITE_FUNNEL_OK');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test_invite_funnel.mts`
Expected: FAIL — `Cannot find module './src/lib/afx/inviteFunnel'` (module not created yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/afx/inviteFunnel.ts`:

```ts
/** A raw afx_invites row as selected by the data layer. */
export interface RawInvite {
  id: string;
  email: string;
  created_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
}

/** One funnel row for the staff invites view. */
export interface InviteRow {
  id: string;
  email: string;
  status: 'pending' | 'activated';
  invitedAt: string;
  activatedAt: string | null;
  producerName: string | null;
  company: string | null;
  lastActiveAt: string | null;
}

/** Project a raw invite into a funnel row. Producer identity + last-active are
 *  folded in only for activated invites; pending/unresolved fields stay null. */
export function toInviteRow(
  raw: RawInvite,
  producer: { name?: string; company?: string } | null,
  lastActiveAt: string | null,
): InviteRow {
  const activated = raw.redeemed_at != null;
  return {
    id: raw.id,
    email: raw.email,
    status: activated ? 'activated' : 'pending',
    invitedAt: raw.created_at,
    activatedAt: raw.redeemed_at,
    producerName: activated ? (producer?.name || null) : null,
    company: activated ? (producer?.company || null) : null,
    lastActiveAt: activated ? lastActiveAt : null,
  };
}

/** Pending first (oldest invite first); then activated (most recently activated first).
 *  Returns a new array — does not mutate the input. */
export function sortInvites(rows: InviteRow[]): InviteRow[] {
  return [...rows].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    if (a.status === 'pending') return a.invitedAt.localeCompare(b.invitedAt);
    return (b.activatedAt ?? '').localeCompare(a.activatedAt ?? '');
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test_invite_funnel.mts`
Expected: prints `INVITE_FUNNEL_OK`, exit 0.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 6: Commit** (test file stays; removed in Task 4)

```bash
git add src/lib/afx/inviteFunnel.ts test_invite_funnel.mts
git commit -m "feat(afx): pure invite-funnel projection + sort"
```

---

### Task 2: Data layer (`staffInvites.ts`)

Service-role reads composed through the pure projection.

**Files:**
- Create: `src/lib/afx/server/staffInvites.ts`

**Interfaces:**
- Consumes: `afxAdmin` from `@/lib/afx/server/documentAccess`; `resolveStaff` from `@/lib/afx/server/staffAccess`; `toInviteRow`, `sortInvites`, `type InviteRow`, `type RawInvite` from `@/lib/afx/inviteFunnel`.
- Produces: `listInvites(): Promise<InviteRow[]>`.

- [ ] **Step 1: Write the implementation**

Create `src/lib/afx/server/staffInvites.ts`:

```ts
import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { toInviteRow, sortInvites, type InviteRow, type RawInvite } from '@/lib/afx/inviteFunnel';

const PER_PAGE = 1000;

/** uuid → last_sign_in_at from the auth admin API, paging until exhausted.
 *  A page error stops paging; unresolved ids simply stay absent (→ null downstream). */
async function lastActiveMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await afxAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data) break;
    for (const u of data.users) if (u.last_sign_in_at) map.set(u.id, u.last_sign_in_at);
    if (data.users.length < PER_PAGE) break;
  }
  return map;
}

/** The producer invite funnel for the staff view. Any staff; [] for anyone else. */
export async function listInvites(): Promise<InviteRow[]> {
  if (!(await resolveStaff())) return [];
  const { data } = await afxAdmin.from('afx_invites').select('id, email, created_at, redeemed_at, redeemed_by');
  const invites = (data ?? []) as RawInvite[];
  if (invites.length === 0) return [];

  const redeemedIds = [...new Set(invites.map((i) => i.redeemed_by).filter((x): x is string => !!x))];
  const producerMap = new Map<string, { name?: string; company?: string }>();
  let lastActive = new Map<string, string>();
  if (redeemedIds.length > 0) {
    const { data: producers } = await afxAdmin.from('afx_producers').select('user_id, profile').in('user_id', redeemedIds);
    for (const p of (producers ?? []) as { user_id: string; profile: { name?: string; company?: string } }[]) {
      producerMap.set(p.user_id, { name: p.profile?.name, company: p.profile?.company });
    }
    lastActive = await lastActiveMap();
  }

  const rows = invites.map((i) =>
    toInviteRow(
      i,
      i.redeemed_by ? producerMap.get(i.redeemed_by) ?? null : null,
      i.redeemed_by ? lastActive.get(i.redeemed_by) ?? null : null,
    ),
  );
  return sortInvites(rows);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean). If `u.last_sign_in_at` errors, confirm the supabase-js `User` type exposes `last_sign_in_at?: string`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/afx/server/staffInvites.ts
git commit -m "feat(afx): staff invite-funnel data layer"
```

---

### Task 3: Route + read-only component + nav link

**Files:**
- Create: `src/app/afx/staff/invites/page.tsx`
- Create: `src/components/afx/staff/StaffInvites.tsx`
- Modify: `src/app/afx/staff/page.tsx` (add an all-staff "Invites" nav link)

**Interfaces:**
- Consumes: `listInvites` from `@/lib/afx/server/staffInvites`; `type InviteRow` from `@/lib/afx/inviteFunnel`; `resolveStaff` from `@/lib/afx/server/staffAccess`; `AfxTopBar`; `StaffQueue`; `listSubmissions`.
- Produces: route `/afx/staff/invites`; `default StaffInvites({ rows: InviteRow[] })`.

- [ ] **Step 1: Write the read-only component**

Create `src/components/afx/staff/StaffInvites.tsx`:

```tsx
'use client';

import Link from 'next/link';
import type { InviteRow } from '@/lib/afx/inviteFunnel';

const mono = 'var(--afx-mono)';

export default function StaffInvites({ rows }: { rows: InviteRow[] }) {
  const pending = rows.filter((r) => r.status === 'pending').length;
  const activated = rows.length - pending;
  const cardStyle: React.CSSProperties = { border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Producer invites</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>
          Pending ({pending}) · Activated ({activated})
        </div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--afx-faint)' }}>No invites yet.</div>
        ) : rows.map((r) => {
          const isPending = r.status === 'pending';
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)' }}>
                  {isPending ? 'not activated yet' : ([r.producerName, r.company].filter(Boolean).join(' · ') || '—')}
                </div>
              </div>
              <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '3px 10px',
                color: isPending ? '#9A6B1E' : '#2E7D46', background: isPending ? '#FBF3E4' : '#F2FBF4', border: `1px solid ${isPending ? '#E6D3A8' : '#CDEAD5'}` }}>
                {isPending ? 'Pending' : 'Activated'}
              </span>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)', textAlign: 'right', minWidth: 150 }}>
                <div>invited {r.invitedAt.slice(0, 10)}</div>
                {!isPending ? <div>activated {r.activatedAt ? r.activatedAt.slice(0, 10) : '—'}</div> : null}
                {!isPending ? <div>last active {r.lastActiveAt ? r.lastActiveAt.slice(0, 10) : '—'}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the route**

Create `src/app/afx/staff/invites/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listInvites } from '@/lib/afx/server/staffInvites';
import StaffInvites from '@/components/afx/staff/StaffInvites';

export default async function AfxStaffInvitesPage() {
  const staff = await resolveStaff();
  if (!staff) redirect('/afx/staff');
  const rows = await listInvites();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffInvites rows={rows} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Add the all-staff "Invites" nav link to the queue page**

Replace the full contents of `src/app/afx/staff/page.tsx` with:

```tsx
import AfxTopBar from '@/components/afx/AfxTopBar';
import Link from 'next/link';
import { listSubmissions } from '@/lib/afx/server/staffReview';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import StaffQueue from '@/components/afx/staff/StaffQueue';

const navLink: React.CSSProperties = { fontFamily: 'var(--afx-mono)', fontSize: 11, fontWeight: 700, color: 'var(--afx-muted)', textDecoration: 'none', border: '1px solid var(--afx-border)', borderRadius: 8, padding: '7px 13px' };

export default async function AfxStaffPage() {
  const staff = await resolveStaff();
  const open = await listSubmissions('open');
  const decided = await listSubmissions('decided');
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
          <Link href="/afx/staff/invites" style={navLink}>Invites →</Link>
          {staff?.role === 'admin' ? (
            <Link href="/afx/staff/team" style={navLink}>Manage team →</Link>
          ) : null}
        </div>
        <StaffQueue open={open} decided={decided} />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 5: Production build**

Run: `npx next build`
Expected: build succeeds; `/afx/staff/invites` appears in the route list.

- [ ] **Step 6: Commit**

```bash
git add src/app/afx/staff/invites/page.tsx src/components/afx/staff/StaffInvites.tsx src/app/afx/staff/page.tsx
git commit -m "feat(afx): staff producer-invite funnel view + nav link"
```

---

### Task 4: Live gate against prod

Validate the three DB mechanisms `listInvites` composes: read `afx_invites`, resolve `afx_producers` by `redeemed_by`, and `listUsers` returning `last_sign_in_at`; plus confirm `afx_invites` is not client-readable. The pure projection/sort is already covered by Task 1.

**Precondition:** Pause and ask the USER to confirm prod is reachable via `.env.local` and that this script creates/deletes disposable auth users + `afx_invites`/`afx_producers` rows and cleans up after itself. Proceed only after confirmation.

**Files:**
- Create: `live_gate_invites.mts` (repo root, temporary — deleted at the end)
- Delete: `test_invite_funnel.mts` (from Task 1)

- [ ] **Step 1: Write the live gate script**

Create `live_gate_invites.mts` (repo root):

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });   // AFX secrets live in .env.local, not .env
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const stamp = process.argv[2] ?? 'x';         // pass a unique suffix
const pendingEmail = `afx-inv-pending-${stamp}@example.com`;
const activeEmail = `afx-inv-active-${stamp}@example.com`;
const pass = `Pw-${stamp}-aA1!`;
let pendingUid = '';
let activeUid = '';

try {
  // Disposable users: one stays pending (no producer), one is "redeemed".
  const p = await admin.auth.admin.createUser({ email: pendingEmail, password: pass, email_confirm: true });
  assert.ok(!p.error, `createUser pending: ${p.error?.message}`);
  pendingUid = p.data.user!.id;
  const a = await admin.auth.admin.createUser({ email: activeEmail, password: pass, email_confirm: true });
  assert.ok(!a.error, `createUser active: ${a.error?.message}`);
  activeUid = a.data.user!.id;

  // Pending invite (no redemption).
  const pi = await admin.from('afx_invites').insert({ email: pendingEmail });
  assert.ok(!pi.error, `insert pending invite: ${pi.error?.message}`);

  // Activated: a producer row + a redeemed invite pointing at it.
  const pr = await admin.from('afx_producers').insert({ user_id: activeUid, profile: { name: 'Live Gate Films', company: 'LG Ltd' } });
  assert.ok(!pr.error, `insert producer: ${pr.error?.message}`);
  const ai = await admin.from('afx_invites').insert({ email: activeEmail, redeemed_at: new Date().toISOString(), redeemed_by: activeUid });
  assert.ok(!ai.error, `insert redeemed invite: ${ai.error?.message}`);

  // (a) afx_invites read sees both, with correct pending/redeemed shape.
  const invs = await admin.from('afx_invites').select('email, redeemed_at, redeemed_by').in('email', [pendingEmail, activeEmail]);
  assert.ok(!invs.error, `read invites: ${invs.error?.message}`);
  const byEmail = new Map((invs.data ?? []).map((r: { email: string; redeemed_at: string | null; redeemed_by: string | null }) => [r.email, r]));
  assert.equal(byEmail.get(pendingEmail)?.redeemed_at, null, 'pending invite has null redeemed_at');
  assert.equal(byEmail.get(activeEmail)?.redeemed_by, activeUid, 'redeemed invite points at the producer');

  // (b) afx_producers resolves the redeemed producer's name/company.
  const prod = await admin.from('afx_producers').select('profile').eq('user_id', activeUid).maybeSingle<{ profile: { name?: string; company?: string } }>();
  assert.equal(prod.data?.profile?.name, 'Live Gate Films', 'producer name resolves');
  assert.equal(prod.data?.profile?.company, 'LG Ltd', 'producer company resolves');

  // (c) last_sign_in_at populates after a sign-in and surfaces via listUsers.
  const asUser = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = await asUser.auth.signInWithPassword({ email: activeEmail, password: pass });
  assert.ok(!signIn.error, `signIn: ${signIn.error?.message}`);
  let lastActive: string | null = null;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    assert.ok(!error, `listUsers: ${error?.message}`);
    const hit = data.users.find((u) => u.id === activeUid);
    if (hit) { lastActive = hit.last_sign_in_at ?? null; break; }
    if (data.users.length < 1000) break;
  }
  assert.ok(lastActive, 'last_sign_in_at is populated after sign-in');

  // (d) afx_invites is NOT client-readable (RLS: no client policy).
  const leaked = await asUser.from('afx_invites').select('email');
  assert.equal((leaked.data ?? []).length, 0, 'afx_invites NOT client-readable');

  console.log('LIVE_OK');
} finally {
  await admin.from('afx_invites').delete().in('email', [pendingEmail, activeEmail]);
  if (activeUid) await admin.from('afx_producers').delete().eq('user_id', activeUid);
  if (pendingUid) await admin.auth.admin.deleteUser(pendingUid);
  if (activeUid) await admin.auth.admin.deleteUser(activeUid);
}
```

- [ ] **Step 2: Run the live gate**

Run: `npx tsx live_gate_invites.mts run-$(date +%s)`
Expected: prints `LIVE_OK`. On an assertion error instead: STOP, do NOT delete the script, report BLOCKED with the failing assertion.

- [ ] **Step 3: Remove the temporary scripts**

```bash
rm test_invite_funnel.mts live_gate_invites.mts
```

- [ ] **Step 4: Confirm clean tree & type-check**

Run: `git status --porcelain && npx tsc --noEmit -p tsconfig.json`
Expected: no stray `.mts` files; tsc clean.

- [ ] **Step 5: Commit the test-file deletion**

`test_invite_funnel.mts` was committed in Task 1, so this records its removal (`live_gate_invites.mts` was never committed). Stage ONLY that deletion — the working tree has unrelated pre-existing dirty files (`scan_opportunities.mjs`, newsletter/insert `.mjs`/`.html`, `supabase/*`); do NOT stage them.

```bash
git rm test_invite_funnel.mts
git commit -m "chore(afx): remove temporary invite-funnel verification scripts"
```

---

## Self-Review

- **Spec coverage:** InviteRow shape + pending/activated + producer name/company + last-active → Task 1 (`toInviteRow`) & Task 2; pending-first/activated sort → Task 1 (`sortInvites`); `listInvites` data layer with any-staff gate + service-role reads + `listUsers` last-active → Task 2; route (redirect non-staff) + read-only component + count header + badges + empty state → Task 3; all-staff "Invites" nav link alongside admin-only "Manage team" → Task 3; graceful degradation (missing producer / null last-active / pending has no producer data) → Task 1 mapping + Task 2 `?? null`; no migration, service-role only → honored; live verification → Task 4. All spec sections mapped.
- **Placeholder scan:** none — every code step is complete; the only `${...}` are live-script template literals.
- **Type consistency:** `RawInvite`/`InviteRow` defined in Task 1, consumed in Task 2 (`staffInvites.ts`) and Task 3 (component imports `type InviteRow` from the pure module, never the server module). `listInvites(): Promise<InviteRow[]>` defined in Task 2, consumed by the Task 3 route. `toInviteRow(raw, producer, lastActiveAt)` / `sortInvites(rows)` signatures match their Task 2 call sites. Queue-page `navLink` const reused for both links.
