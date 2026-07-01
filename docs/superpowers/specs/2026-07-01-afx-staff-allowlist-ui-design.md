# AFX Staff Allowlist UI (S2b) — Design

**Date:** 2026-07-01
**Status:** Approved (design)
**Context:** Final S2b follow-up. The FRA review surface (PR #22) shipped with the
`afx_staff` allowlist provisioned only by manual `insert into afx_staff` via the
Supabase Dashboard. This adds an in-app, admin-only UI to manage that roster.

## Goal

Let the single FRA admin add and remove **reviewers** from `afx_staff` in-app,
without hand-writing SQL or copying auth UUIDs out of the Dashboard.

## Non-goals (YAGNI)

- **Role management.** There is exactly one admin. The UI never promotes/demotes;
  everyone added via the UI is a `reviewer`. Adding/removing an admin stays a
  Dashboard SQL operation.
- **Inviting new users.** The person being added must already have an auth account
  (they have signed in to FRA/AFX at least once). No Supabase invite plumbing,
  no pending/invited state.
- **Self-service onboarding, audit trail of who-added-whom, email notifications.**
  Not in this slice.

## Constraints (from the AFX project)

- **No migration.** The `afx_staff` table already exists in prod
  (`user_id uuid pk`, `role text check in ('reviewer','admin')`, `created_at`).
  This feature is **code-only + service-role runtime** — it deliberately avoids a
  Dashboard migration round-trip. (The connected Supabase MCP cannot reach the AFX
  prod project `rcgynwcttgvqcnbyfhiz`; all migrations are applied by the user via
  the Dashboard. Not needing one is a feature.)
- **No client RLS on `afx_staff`.** The table has RLS enabled with no client
  policies — only the service-role guard reads/writes it. This UI keeps that model:
  all access flows through `afxAdmin` (service-role) behind `resolveStaff()`.
- **supabase-js 2.105.3** — has `afxAdmin.auth.admin.listUsers({ page, perPage })`;
  no direct `getUserByEmail`, so email→uuid resolution pages through `listUsers`.

## Architecture

Mirrors the shipped staff pattern (`resolveStaff()` gate + `afxAdmin` writes,
producer RLS untouched). One new data module, one new route, one new client
component, and a small edit to the queue page for navigation.

### Files

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/afx/server/staffAdmin.ts` | **new** | server-only data layer: `listStaff`, `addStaffByEmail`, `removeStaff`, `resolveUserIdByEmail` |
| `src/app/afx/staff/team/page.tsx` | **new** | admin-only page; non-admins redirected to `/afx/staff` |
| `src/app/afx/staff/team/actions.ts` | **new** | `'use server'` thin wrappers |
| `src/components/afx/staff/StaffTeam.tsx` | **new** | client roster + add-by-email form |
| `src/app/afx/staff/page.tsx` | **edit** | "Team" nav link, rendered only when caller role is `admin` |

## Data layer — `staffAdmin.ts`

`import 'server-only'`. **Every exported function re-checks `resolveStaff()` and
requires `role === 'admin'`** — defence in depth, independent of the page guard.
A non-admin (reviewer or non-staff) caller gets `{ ok:false, error:'Not authorized' }`
(or `[]` for the list).

### `interface StaffMember { userId: string; email: string; role: 'reviewer' | 'admin'; createdAt: string; }`

### `listStaff(): Promise<StaffMember[]>`
1. `resolveStaff()`; if not admin → `[]`.
2. `afxAdmin.from('afx_staff').select('user_id, role, created_at')`.
3. Build a `Map<uuid, email>` from `afxAdmin.auth.admin.listUsers({ perPage: 1000 })`
   (page through if `users.length === perPage`).
4. Map rows → `StaffMember`, `email` falling back to `'—'` if not resolvable.
5. Sort: admins first, then `createdAt` ascending.

### `resolveUserIdByEmail(email: string): Promise<string | null>` (internal)
Normalise (`trim().toLowerCase()`), page through `listUsers`, return the first
user whose email matches case-insensitively, else `null`.

### `addStaffByEmail(email: string): Promise<Result>`
`Result = { ok: boolean; error?: string }`.
1. Admin gate.
2. Reject empty/blank email → `'Enter an email.'`.
3. `resolveUserIdByEmail`; if `null` →
   `'No account for that email — they must sign in to FRA at least once first.'`.
4. `afxAdmin.from('afx_staff').upsert({ user_id, role: 'reviewer' },
   { onConflict: 'user_id', ignoreDuplicates: true })` — idempotent: an existing
   row is left untouched (so a reviewer already present, or the admin themselves,
   is never clobbered to `reviewer`) and returns `{ ok:true }`, surfaced as a
   benign "already on the team" note, not an error.
5. Return `{ ok:true }`.

### `removeStaff(userId: string): Promise<Result>`
1. Admin gate.
2. Reject self-removal (`userId === caller.userId`) → `'You can't remove yourself.'`.
3. Read the target row; if `role === 'admin'` → `'Admins can't be removed here.'`.
4. `afxAdmin.from('afx_staff').delete().eq('user_id', userId)`.
5. Return `{ ok:true }`.

## Server actions — `team/actions.ts`

```ts
'use server';
import { addStaffByEmail, removeStaff } from '@/lib/afx/server/staffAdmin';
export async function addStaffAction(email: string) { return addStaffByEmail(email); }
export async function removeStaffAction(userId: string) { return removeStaff(userId); }
```

## Page — `team/page.tsx`

Server component. `resolveStaff()`; if `role !== 'admin'` → `redirect('/afx/staff')`
(the parent `staff/layout.tsx` already blocks non-staff entirely). Renders
`AfxTopBar subtitle="FRA review"` + `<StaffTeam staff={await listStaff()} />`
inside the same `main` shell as the queue page.

## UI — `StaffTeam.tsx`

`'use client'`. Reuses the card/button idiom from `StaffSubmissionDetail`
(`cardStyle`, `btn`, `busy`/`error` state, `run()` helper, `router.refresh()`).

- **Add row:** an email `<input type="email">` + **Add reviewer** button. On success,
  clears the input and refreshes; benign "already on the team" shown as a muted
  note, hard failures shown in the existing error style.
- **Roster:** one row per member — `email` · role chip (`admin` distinct from
  `reviewer`) · joined date. Reviewer rows get a **Remove** button using a
  lightweight **two-click inline confirm** (click → "Confirm?" → click; no
  `window.confirm`). The admin row (and the caller's own row) shows a lock / "you"
  marker and no Remove button.

## Navigation — `staff/page.tsx` edit

The queue page resolves the caller (already staff via layout). When
`role === 'admin'`, render a small **Team** link (to `/afx/staff/team`) in the
page header next to the queue title. Reviewers never see it.

## Guardrails summary

- Page **and** every data-layer function gated to `role === 'admin'`.
- Admin row is UI-immutable: not removable, not demotable (no role UI exists).
- Self-removal blocked.
- Add is idempotent (existing reviewer → no-op success).
- Unknown email → clear, actionable error (no silent failure).

## Bootstrap precondition

This page is only reachable once at least one `admin` row exists in `afx_staff`.
If prod's allowlist is currently empty, the first admin must be seeded once via
Dashboard SQL:

```sql
insert into public.afx_staff (user_id, role)
values ('<admin-auth-user-uuid>', 'admin')
on conflict (user_id) do update set role = 'admin';
```

This is surfaced to the user at ship time. No other migration is required.

## Error handling

- All data-layer functions return the `Result` shape (or `[]`); no throwing across
  the action boundary. Supabase errors map to a generic `'Could not …'` message;
  the specific, actionable cases (unknown email, admin-protected, self-removal) get
  their own messages.
- The client surfaces `error` in the existing red style and never leaves the button
  stuck in `busy` (try/finally).

## Testing / verification

Per the AFX idiom (no test runner):
1. `npx tsc --noEmit -p tsconfig.json`
2. `npx next build`
3. **Live gate** — a repo-root `tsx` script against prod (deleted after):
   - Seed a disposable **admin** auth user + `afx_staff` row, and a disposable
     plain auth user (the future reviewer).
   - Assert `addStaffByEmail(reviewerEmail)` inserts a `reviewer` row.
   - Assert `addStaffByEmail('nobody@example.com')` returns the unknown-email error.
   - Assert `addStaffByEmail(reviewerEmail)` again is idempotent (`ok:true`, still
     one row).
   - Assert `removeStaff(adminUserId)` is refused (admin-protected) and self-removal
     is refused.
   - Assert `removeStaff(reviewerUserId)` deletes the row.
   - Assert the data layer rejects a **reviewer-role** caller (simulate by resolving
     as the reviewer) — i.e. management is admin-only.
   - Print `LIVE_OK` only if every assertion holds; always clean up (`afx_staff`
     rows + both auth users).

## Future (out of scope)

- If the user base outgrows `listUsers` pagination, replace `resolveUserIdByEmail`
  with a `SECURITY DEFINER` SQL function `afx_lookup_user_id(email)` (would need a
  Dashboard migration).
- Second admin / role management UI.
- Invite flow for users without an account yet.
