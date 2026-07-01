# AFX Staff Allowlist UI (S2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the single FRA admin an in-app, admin-only UI to add reviewers (by email) to and remove them from the `afx_staff` allowlist, replacing manual Dashboard SQL.

**Architecture:** Mirrors the shipped staff pattern — a new admin-gated route under `/afx/staff/team` whose reads/writes flow through the `afxAdmin` service-role client behind `resolveStaff()`. Authorization decisions live in a pure, `'server-only'`-free guard module (unit-tested); the DB wiring lives in `staffAdmin.ts`; the UI reuses the existing card/button idiom. No migration — the `afx_staff` table already exists.

**Tech Stack:** Next.js App Router (RSC + server actions), `@supabase/supabase-js` 2.105.3 (service-role client + `auth.admin.listUsers`), TypeScript, inline `var(--afx-*)` styling.

## Global Constraints

- **No migration.** `afx_staff` already exists in prod: `user_id uuid pk references auth.users`, `role text check in ('reviewer','admin') default 'reviewer'`, `created_at timestamptz`. Do not add columns.
- **All `afx_staff` access via `afxAdmin` (service-role).** The table has RLS on with no client policies; never query it with an anon/user client.
- **Every data-layer function re-checks `resolveStaff()` and requires `role === 'admin'`** — independent of the page guard.
- **The person being added must already have an auth account** (signed in ≥ once). No invite flow.
- **One admin only.** No role-management UI. Everyone added via the UI is a `reviewer`. The admin row is UI-immutable.
- **Verification idiom (no test runner):** `npx tsc --noEmit -p tsconfig.json`, `npx next build`, `npx tsx` assertion scripts (placed in the REPO ROOT so node_modules resolves; deleted after). Live supabase-js scripts run against prod using `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`); mint disposable auth users via `admin.auth.admin.createUser`.
- **`StaffAccess` shape** (from `src/lib/afx/server/staffAccess.ts`): `{ userId: string; role: 'reviewer' | 'admin' }`.

---

### Task 1: Pure authorization guards (`staffAdminGuards.ts`)

The authorization decisions, isolated from any DB or session so they can be unit-tested directly. This module MUST NOT import `'server-only'`; it may only `import type` from server modules (type imports are erased at runtime).

**Files:**
- Create: `src/lib/afx/staffAdminGuards.ts`
- Test: `test_staff_admin_guards.mts` (repo root, temporary — deleted in the final step)

**Interfaces:**
- Consumes: `type StaffAccess` from `@/lib/afx/server/staffAccess`.
- Produces:
  - `type Result = { ok: boolean; error?: string }`
  - `requireAdmin(staff: StaffAccess | null): Result`
  - `validateEmail(email: string): Result`
  - `canRemove(staff: StaffAccess, targetUserId: string, targetRole: 'reviewer' | 'admin' | null): Result`

- [ ] **Step 1: Write the failing test**

Create `test_staff_admin_guards.mts` (repo root):

```ts
import assert from 'node:assert';
import { requireAdmin, validateEmail, canRemove } from './src/lib/afx/staffAdminGuards.ts';

const admin = { userId: 'admin-1', role: 'admin' as const };
const reviewer = { userId: 'rev-1', role: 'reviewer' as const };

// requireAdmin
assert.equal(requireAdmin(admin).ok, true, 'admin passes');
assert.equal(requireAdmin(reviewer).ok, false, 'reviewer rejected');
assert.equal(requireAdmin(null).ok, false, 'non-staff rejected');
assert.equal(requireAdmin(reviewer).error, 'Not authorized');

// validateEmail
assert.equal(validateEmail('a@b.com').ok, true, 'non-empty ok');
assert.equal(validateEmail('   ').ok, false, 'blank rejected');
assert.equal(validateEmail('').error, 'Enter an email.');

// canRemove
assert.equal(canRemove(admin, 'admin-1', 'admin').ok, false, 'self blocked');
assert.equal(canRemove(admin, 'admin-1', 'admin').error, "You can't remove yourself.");
assert.equal(canRemove(admin, 'other-admin', 'admin').ok, false, 'admin protected');
assert.equal(canRemove(admin, 'other-admin', 'admin').error, "Admins can't be removed here.");
assert.equal(canRemove(admin, 'ghost', null).ok, false, 'missing row rejected');
assert.equal(canRemove(admin, 'ghost', null).error, 'Not on the team.');
assert.equal(canRemove(admin, 'rev-1', 'reviewer').ok, true, 'reviewer removable');

console.log('GUARDS_OK');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test_staff_admin_guards.mts`
Expected: FAIL — `Cannot find module './src/lib/afx/staffAdminGuards.ts'` (module not created yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/afx/staffAdminGuards.ts`:

```ts
import type { StaffAccess } from '@/lib/afx/server/staffAccess';

export type Result = { ok: boolean; error?: string };

/** Only an admin may manage the roster. */
export function requireAdmin(staff: StaffAccess | null): Result {
  return staff?.role === 'admin' ? { ok: true } : { ok: false, error: 'Not authorized' };
}

/** Reject a blank add-by-email input before any lookup. */
export function validateEmail(email: string): Result {
  return email.trim() ? { ok: true } : { ok: false, error: 'Enter an email.' };
}

/** Guard a removal: no self-removal, no removing an admin, target must exist.
 *  `targetRole` is null when the user id is not on the team. */
export function canRemove(
  staff: StaffAccess,
  targetUserId: string,
  targetRole: 'reviewer' | 'admin' | null,
): Result {
  if (targetUserId === staff.userId) return { ok: false, error: "You can't remove yourself." };
  if (targetRole === null) return { ok: false, error: 'Not on the team.' };
  if (targetRole === 'admin') return { ok: false, error: "Admins can't be removed here." };
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test_staff_admin_guards.mts`
Expected: prints `GUARDS_OK`, exit 0.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 6: Commit** (test file stays for now; removed in Task 5)

```bash
git add src/lib/afx/staffAdminGuards.ts test_staff_admin_guards.mts
git commit -m "feat(afx): pure authorization guards for staff allowlist"
```

---

### Task 2: Data layer (`staffAdmin.ts`)

The service-role DB wiring: resolve the session, apply the guards, read/write `afx_staff`, resolve emails via the auth admin API.

**Files:**
- Create: `src/lib/afx/server/staffAdmin.ts`

**Interfaces:**
- Consumes: `afxAdmin` from `@/lib/afx/server/documentAccess`; `resolveStaff` from `@/lib/afx/server/staffAccess`; `requireAdmin`, `validateEmail`, `canRemove`, `type Result` from `@/lib/afx/staffAdminGuards`.
- Produces:
  - `interface StaffMember { userId: string; email: string; role: 'reviewer' | 'admin'; createdAt: string }`
  - `listStaff(): Promise<StaffMember[]>`
  - `addStaffByEmail(email: string): Promise<Result>`
  - `removeStaff(userId: string): Promise<Result>`

- [ ] **Step 1: Write the implementation**

Create `src/lib/afx/server/staffAdmin.ts`:

```ts
import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { requireAdmin, validateEmail, canRemove, type Result } from '@/lib/afx/staffAdminGuards';

export interface StaffMember {
  userId: string;
  email: string;
  role: 'reviewer' | 'admin';
  createdAt: string;
}

const PER_PAGE = 1000;

/** uuid → email map from the auth admin API, paging until exhausted. */
async function emailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await afxAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data) break;
    for (const u of data.users) if (u.email) map.set(u.id, u.email);
    if (data.users.length < PER_PAGE) break;
  }
  return map;
}

/** Resolve an email (case-insensitive) to an auth user id, or null. */
async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;
  const map = await emailMap();
  for (const [id, mail] of map) if (mail.toLowerCase() === target) return id;
  return null;
}

/** Roster for the admin team page. Admin-only; [] for anyone else. */
export async function listStaff(): Promise<StaffMember[]> {
  const staff = await resolveStaff();
  if (!requireAdmin(staff).ok) return [];
  const { data } = await afxAdmin.from('afx_staff').select('user_id, role, created_at');
  const rows = (data ?? []) as { user_id: string; role: 'reviewer' | 'admin'; created_at: string }[];
  if (rows.length === 0) return [];
  const emails = await emailMap();
  return rows
    .map((r) => ({ userId: r.user_id, email: emails.get(r.user_id) ?? '—', role: r.role, createdAt: r.created_at }))
    .sort((a, b) => (a.role === b.role ? a.createdAt.localeCompare(b.createdAt) : a.role === 'admin' ? -1 : 1));
}

/** Add a reviewer by email. Admin-only. Idempotent for an already-present user. */
export async function addStaffByEmail(email: string): Promise<Result> {
  const staff = await resolveStaff();
  const gate = requireAdmin(staff);
  if (!gate.ok) return gate;
  const valid = validateEmail(email);
  if (!valid.ok) return valid;
  const userId = await resolveUserIdByEmail(email);
  if (!userId) return { ok: false, error: 'No account for that email — they must sign in to FRA at least once first.' };
  const { error } = await afxAdmin
    .from('afx_staff')
    .upsert({ user_id: userId, role: 'reviewer' }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) return { ok: false, error: 'Could not add reviewer.' };
  return { ok: true };
}

/** Remove a reviewer. Admin-only; the admin row and self are protected. */
export async function removeStaff(userId: string): Promise<Result> {
  const staff = await resolveStaff();
  const gate = requireAdmin(staff);
  if (!gate.ok || !staff) return { ok: false, error: 'Not authorized' };
  const { data: row } = await afxAdmin
    .from('afx_staff').select('role').eq('user_id', userId)
    .maybeSingle<{ role: 'reviewer' | 'admin' }>();
  const allowed = canRemove(staff, userId, row?.role ?? null);
  if (!allowed.ok) return allowed;
  const { error } = await afxAdmin.from('afx_staff').delete().eq('user_id', userId);
  if (error) return { ok: false, error: 'Could not remove reviewer.' };
  return { ok: true };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean). If `data.users` typing errors, confirm the supabase-js `listUsers` return shape — `data.users` is `User[]`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/afx/server/staffAdmin.ts
git commit -m "feat(afx): staff allowlist data layer (list/add/remove)"
```

---

### Task 3: Server actions + admin-only page

**Files:**
- Create: `src/app/afx/staff/team/actions.ts`
- Create: `src/app/afx/staff/team/page.tsx`

**Interfaces:**
- Consumes: `addStaffByEmail`, `removeStaff`, `listStaff`, `type StaffMember` from `@/lib/afx/server/staffAdmin`; `resolveStaff` from `@/lib/afx/server/staffAccess`; `AfxTopBar`; the `StaffTeam` component (Task 4).
- Produces:
  - `addStaffAction(email: string): Promise<Result>`
  - `removeStaffAction(userId: string): Promise<Result>`
  - Route `/afx/staff/team` (admin-only).

- [ ] **Step 1: Write the server actions**

Create `src/app/afx/staff/team/actions.ts`:

```ts
'use server';

import { addStaffByEmail, removeStaff } from '@/lib/afx/server/staffAdmin';

export async function addStaffAction(email: string) { return addStaffByEmail(email); }
export async function removeStaffAction(userId: string) { return removeStaff(userId); }
```

- [ ] **Step 2: Write the page**

Create `src/app/afx/staff/team/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { listStaff } from '@/lib/afx/server/staffAdmin';
import StaffTeam from '@/components/afx/staff/StaffTeam';

export default async function AfxStaffTeamPage() {
  const staff = await resolveStaff();
  if (staff?.role !== 'admin') redirect('/afx/staff');
  const members = await listStaff();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffTeam members={members} selfUserId={staff.userId} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: ONE error — `Cannot find module '@/components/afx/staff/StaffTeam'` (created in Task 4). This is expected; proceed.

- [ ] **Step 4: Commit**

```bash
git add src/app/afx/staff/team/actions.ts src/app/afx/staff/team/page.tsx
git commit -m "feat(afx): admin-only team route + server actions"
```

---

### Task 4: Roster UI component (`StaffTeam.tsx`) + nav link

**Files:**
- Create: `src/components/afx/staff/StaffTeam.tsx`
- Modify: `src/app/afx/staff/page.tsx` (add admin-only "Manage team" link)

**Interfaces:**
- Consumes: `type StaffMember` from `@/lib/afx/server/staffAdmin`; `addStaffAction`, `removeStaffAction` from `@/app/afx/staff/team/actions`; `resolveStaff` from `@/lib/afx/server/staffAccess` (in the modified queue page).
- Produces: `default StaffTeam({ members: StaffMember[]; selfUserId: string })`.

- [ ] **Step 1: Write the component**

Create `src/components/afx/staff/StaffTeam.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { StaffMember } from '@/lib/afx/server/staffAdmin';
import { addStaffAction, removeStaffAction } from '@/app/afx/staff/team/actions';

const mono = 'var(--afx-mono)';

export default function StaffTeam({ members, selfUserId }: { members: StaffMember[]; selfUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function add() {
    if (busy || !email.trim()) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const res = await addStaffAction(email);
      if (res.ok) { setNote(`${email.trim()} is on the team.`); setEmail(''); router.refresh(); }
      else setError(res.error ?? 'Could not add reviewer.');
    } catch { setError('Could not add reviewer — please try again.'); }
    finally { setBusy(false); }
  }

  async function remove(userId: string) {
    if (busy) return;
    setBusy(true); setError(null); setNote(null); setConfirmId(null);
    try {
      const res = await removeStaffAction(userId);
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Could not remove reviewer.');
    } catch { setError('Could not remove reviewer — please try again.'); }
    finally { setBusy(false); }
  }

  const cardStyle: React.CSSProperties = { border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
  const btn = (bg: string, bd: string, fg: string): React.CSSProperties => ({ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 15px', borderRadius: 8, border: `1px solid ${bd}`, background: bg, color: fg });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Review team</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Add reviewer</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="reviewer@example.com"
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            style={{ flex: 1, fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid var(--afx-border)', borderRadius: 8, padding: '9px 11px' }} />
          <button disabled={busy} onClick={add} style={btn('var(--afx-ink)', 'var(--afx-ink)', '#fff')}>Add reviewer</button>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--afx-faint)' }}>They must have signed in to FRA at least once.</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Team ({members.length})</div>
        {members.map((mbr) => {
          const isAdmin = mbr.role === 'admin';
          const isSelf = mbr.userId === selfUserId;
          return (
            <div key={mbr.userId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mbr.email}{isSelf ? ' (you)' : ''}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)' }}>joined {mbr.createdAt.slice(0, 10)}</div>
              </div>
              <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '3px 10px',
                color: isAdmin ? '#1C4E80' : 'var(--afx-muted)', background: isAdmin ? '#EAF1F8' : '#F4F4F2', border: `1px solid ${isAdmin ? '#C3D6EA' : 'var(--afx-border)'}` }}>{mbr.role}</span>
              {isAdmin ? (
                <span title="Admin — manage via Dashboard" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faintest)' }}>🔒</span>
              ) : confirmId === mbr.userId ? (
                <button disabled={busy} onClick={() => remove(mbr.userId)} style={btn('#fff', '#E3B6AE', '#7A2E2E')}>Confirm?</button>
              ) : (
                <button disabled={busy} onClick={() => setConfirmId(mbr.userId)} style={btn('#fff', 'var(--afx-border)', 'var(--afx-muted)')}>Remove</button>
              )}
            </div>
          );
        })}
      </div>

      {note ? <div style={{ fontSize: 12, color: 'var(--afx-muted)' }}>{note}</div> : null}
      {error ? <div style={{ fontSize: 12, color: '#c0392b' }}>{error}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Add the admin-only nav link to the queue page**

Modify `src/app/afx/staff/page.tsx` to the following (adds `Link` + `resolveStaff` and a conditional "Manage team" link):

```tsx
import AfxTopBar from '@/components/afx/AfxTopBar';
import Link from 'next/link';
import { listSubmissions } from '@/lib/afx/server/staffReview';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import StaffQueue from '@/components/afx/staff/StaffQueue';

export default async function AfxStaffPage() {
  const staff = await resolveStaff();
  const open = await listSubmissions('open');
  const decided = await listSubmissions('decided');
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        {staff?.role === 'admin' ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Link href="/afx/staff/team" style={{ fontFamily: 'var(--afx-mono)', fontSize: 11, fontWeight: 700, color: 'var(--afx-muted)', textDecoration: 'none', border: '1px solid var(--afx-border)', borderRadius: 8, padding: '7px 13px' }}>Manage team →</Link>
          </div>
        ) : null}
        <StaffQueue open={open} decided={decided} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean — the Task 3 dangling import now resolves).

- [ ] **Step 4: Production build**

Run: `npx next build`
Expected: build succeeds; `/afx/staff/team` appears in the route list.

- [ ] **Step 5: Commit**

```bash
git add src/components/afx/staff/StaffTeam.tsx src/app/afx/staff/page.tsx
git commit -m "feat(afx): staff team roster UI + admin nav link"
```

---

### Task 5: Live gate against prod

Validate — against the real AFX prod project — the three DB-level mechanisms the data layer depends on: (a) `auth.admin.listUsers` resolves a known email to its uuid, (b) `afx_staff` accepts a reviewer insert and delete via service-role, (c) `afx_staff` is NOT readable by a user-JWT client (RLS), confirming the allowlist stays server-only. TS authorization guards are already covered by Task 1.

**Precondition:** Pause and ask the USER to confirm prod is reachable with the `.env.local` service-role key, and note this script creates/deletes disposable auth users + one `afx_staff` row and cleans up after itself. Proceed only after confirmation.

**Files:**
- Create: `live_gate_staff_admin.mts` (repo root, temporary — deleted at the end)
- Delete: `test_staff_admin_guards.mts` (from Task 1)

- [ ] **Step 1: Write the live gate script**

Create `live_gate_staff_admin.mts` (repo root):

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });   // AFX secrets live in .env.local, not .env
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const stamp = process.argv[2] ?? 'x';           // pass a unique suffix; Date.now() is fine here (plain node)
const email = `afx-livegate-${stamp}@example.com`;
const pass = `Pw-${stamp}-aA1!`;
let reviewerId = '';

try {
  // Create a disposable auth user (the future reviewer).
  const created = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true });
  assert.ok(!created.error, `createUser: ${created.error?.message}`);
  reviewerId = created.data.user!.id;

  // (a) email -> uuid via listUsers pagination.
  let found: string | null = null;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    assert.ok(!error, `listUsers: ${error?.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) { found = hit.id; break; }
    if (data.users.length < 1000) break;
  }
  assert.equal(found, reviewerId, 'email resolves to the reviewer uuid');

  // (b) service-role insert + delete on afx_staff.
  const ins = await admin.from('afx_staff').upsert({ user_id: reviewerId, role: 'reviewer' }, { onConflict: 'user_id', ignoreDuplicates: true });
  assert.ok(!ins.error, `insert: ${ins.error?.message}`);
  const present = await admin.from('afx_staff').select('user_id, role').eq('user_id', reviewerId).maybeSingle();
  assert.equal(present.data?.role, 'reviewer', 'reviewer row present');

  // (c) user-JWT client cannot read afx_staff (RLS: no client policy).
  const asUser = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = await asUser.auth.signInWithPassword({ email, password: pass });
  assert.ok(!signIn.error, `signIn: ${signIn.error?.message}`);
  const leaked = await asUser.from('afx_staff').select('user_id');
  assert.equal((leaked.data ?? []).length, 0, 'afx_staff NOT client-readable');

  const del = await admin.from('afx_staff').delete().eq('user_id', reviewerId);
  assert.ok(!del.error, `delete: ${del.error?.message}`);
  const gone = await admin.from('afx_staff').select('user_id').eq('user_id', reviewerId).maybeSingle();
  assert.equal(gone.data, null, 'reviewer row removed');

  console.log('LIVE_OK');
} finally {
  await admin.from('afx_staff').delete().eq('user_id', reviewerId).catch(() => {});
  if (reviewerId) await admin.auth.admin.deleteUser(reviewerId).catch(() => {});
}
```

- [ ] **Step 2: Run the live gate**

Run: `npx tsx live_gate_staff_admin.mts run-$(date +%s)`
Expected: prints `LIVE_OK`. If it prints an assertion error instead, STOP and diagnose (do not delete the script); the most likely cause is a stale `.env.local` or the `afx_staff` table not existing in the targeted project.

- [ ] **Step 3: Remove the temporary scripts**

```bash
rm test_staff_admin_guards.mts live_gate_staff_admin.mts
```

- [ ] **Step 4: Confirm no stray temp files & type-check once more**

Run: `git status --porcelain && npx tsc --noEmit -p tsconfig.json`
Expected: no `.mts` files listed as untracked; tsc clean.

- [ ] **Step 5: Commit** (only if any tracked files changed; the temp scripts were never committed after Task 1 except the guard test)

```bash
git add -A
git commit -m "chore(afx): remove temporary staff-allowlist verification scripts"
```

Note: `test_staff_admin_guards.mts` WAS committed in Task 1, so this commit records its deletion. `live_gate_staff_admin.mts` was never committed.

---

## Ship note (surface to the user after Task 5)

The team page is only reachable once an `admin` row exists in `afx_staff`. If prod's allowlist is empty or has only reviewers, seed the admin once via the Dashboard SQL editor (`https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new`):

```sql
insert into public.afx_staff (user_id, role)
values ('<admin-auth-user-uuid>', 'admin')
on conflict (user_id) do update set role = 'admin';
```

No other migration is required.

---

## Self-Review

- **Spec coverage:** data layer (`listStaff`/`addStaffByEmail`/`removeStaff`) → Task 2; email-existing-account lookup + unknown-email error → Task 2 (`resolveUserIdByEmail`) + guard `validateEmail` Task 1; admin-only gate on page AND every function → Tasks 1 (`requireAdmin`), 2, 3; admin/self removal protection → Task 1 (`canRemove`) + Task 2; idempotent add → Task 2 (`upsert ignoreDuplicates`); UI roster + add form + two-click confirm + admin lock/"you" marker → Task 4; admin-only nav link → Task 4; no migration → honored throughout; live verification → Task 5; bootstrap precondition → Ship note. All spec sections mapped.
- **Placeholder scan:** none — every code step is complete; the only `<...>` is the intentional SQL template in the Ship note.
- **Type consistency:** `Result` defined in Task 1, imported in Task 2, returned by actions in Task 3, consumed in Task 4. `StaffMember` defined in Task 2, consumed in Tasks 3–4. `StaffAccess` (`{ userId, role }`) used consistently. `canRemove(staff, targetUserId, targetRole)` signature matches its Task 2 call site. `requireAdmin` returns `{ ok:true }` on success — Task 2's `removeStaff` additionally narrows `staff` non-null before calling `canRemove`.
