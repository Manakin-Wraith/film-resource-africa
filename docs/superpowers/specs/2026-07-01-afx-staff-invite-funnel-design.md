# AFX Staff Invite/Activation Funnel — Design

**Date:** 2026-07-01
**Status:** Approved (design)
**Context:** Producers are onboarded via `afx_invites` (an email allowlist). When an
invited person first signs in and visits `/afx/producer`, `redeem_afx_invite()`
creates their `afx_producers` row and stamps `redeemed_at` + `redeemed_by`. Today
FRA staff have no in-app view of this funnel — they can't see who was invited, who
has actually logged in from their invite, or when. This adds that view.

## Goal

Give all FRA staff a read-only view, on the staff surface, of the producer invite
funnel: every invite, whether it's still pending or has been activated ("logged in
from the invite"), when it activated, who it became, and when that producer was
last active.

## Non-goals (YAGNI)

- **Creating / resending / revoking invites.** Invites remain a Dashboard SQL
  operation (`insert into afx_invites (email) values (…)`), matching current
  practice. This slice is display-only.
- **Editing producers or invites.** Purely read-only.
- **Pagination / search / filtering UI.** At current scale the full list renders at
  once; revisit if the invite count grows large (see Future).

## Constraints (from the AFX project)

- **No migration.** `afx_invites` already exists:
  `id uuid pk`, `email text unique`, `created_at timestamptz`,
  `redeemed_at timestamptz` (null = pending), `redeemed_by uuid references auth.users`.
  Do not alter it.
- **`afx_invites` is service-role-only** (RLS on, no client policies). All access via
  `afxAdmin` (service-role) behind `resolveStaff()`, same as `afx_staff`.
- **Visible to any staff** (reviewer or admin) — the gate is `resolveStaff()` truthy,
  NOT admin-only.
- **supabase-js 2.105.3** — `last_sign_in_at` comes from
  `afxAdmin.auth.admin.listUsers({ page, perPage })` (paginated), the same admin API
  the team surface already uses.
- **`StaffAccess` shape** (`src/lib/afx/server/staffAccess.ts`): `{ userId, role }`.

## Architecture

Mirrors the shipped staff-team surface: `resolveStaff()` gate + `afxAdmin` reads,
one data module, one route, one client component, and a nav-link edit on the queue
page. No writes.

### Files

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/afx/server/staffInvites.ts` | **new** | `listInvites()` — read `afx_invites`, resolve producer name/company + `last_sign_in_at` |
| `src/app/afx/staff/invites/page.tsx` | **new** | all-staff route; redirects non-staff |
| `src/components/afx/staff/StaffInvites.tsx` | **new** | read-only funnel list |
| `src/app/afx/staff/page.tsx` | **edit** | add an all-staff "Invites" nav link |

## Data layer — `staffInvites.ts`

`import 'server-only'`. `listInvites()` re-checks `resolveStaff()` (any staff) — a
non-staff caller gets `[]`.

### `interface InviteRow`
```ts
export interface InviteRow {
  id: string;
  email: string;
  status: 'pending' | 'activated';
  invitedAt: string;                 // afx_invites.created_at
  activatedAt: string | null;        // afx_invites.redeemed_at
  producerName: string | null;       // activated only, from afx_producers.profile.name
  company: string | null;            // activated only, from afx_producers.profile.company
  lastActiveAt: string | null;       // auth last_sign_in_at of redeemed_by, or null
}
```

### `listInvites(): Promise<InviteRow[]>`
1. `resolveStaff()`; if not staff → `[]`.
2. `afxAdmin.from('afx_invites').select('id, email, created_at, redeemed_at, redeemed_by')`.
3. Collect the non-null `redeemed_by` ids. If any:
   - `afxAdmin.from('afx_producers').select('user_id, profile').in('user_id', ids)` →
     `Map<user_id, { name, company }>`.
   - Build a `Map<user_id, last_sign_in_at>` by paging
     `afxAdmin.auth.admin.listUsers({ page, perPage: 1000 })` until a page returns
     fewer than `perPage` (reuse the team surface's pattern; on a page error, stop
     and treat unresolved values as `null`).
4. Map each invite row → `InviteRow`:
   - `status`: `redeemed_at ? 'activated' : 'pending'`.
   - `producerName`/`company`/`lastActiveAt`: looked up by `redeemed_by` when
     activated; `null` otherwise.
5. Sort: **pending first**, pending by `invitedAt` ascending (oldest/longest-waiting
   first); then activated by `activatedAt` descending (most recently activated first).

## Route — `invites/page.tsx`

Async server component. `resolveStaff()`; if falsy → `redirect('/afx/staff')` (the
parent `staff/layout.tsx` already blocks non-staff, so this is defence-in-depth).
Renders `AfxTopBar subtitle="FRA review"` + `<StaffInvites rows={await listInvites()} />`
inside the same `main` shell as the queue page.

## UI — `StaffInvites.tsx`

`'use client'` (read-only; no actions, but keep it a client component for styling
consistency with the sibling staff components). Reuses the card/badge idiom from
`StaffQueue`/`StaffTeam`.

- Header: `← Queue` back link + "Producer invites" title.
- A count line: `Pending (N) · Activated (M)`.
- One card, rows in the sorted order. Each row:
  - **Email** (primary), with the producer's `name · company` beneath it when
    activated (else a muted "not activated yet").
  - A **status badge**: amber "Pending" or green "Activated".
  - Right-aligned meta, monospace: `invited YYYY-MM-DD`; for activated rows also
    `activated YYYY-MM-DD` and `last active YYYY-MM-DD` (or `last active —` when
    `lastActiveAt` is null).
- Empty state: "No invites yet." when the list is empty.

Dates render via `.slice(0, 10)` (YYYY-MM-DD), matching `StaffQueue`.

## Navigation — `staff/page.tsx` edit

Add an **"Invites"** link (to `/afx/staff/invites`) in the queue page header,
visible to **all staff** (rendered unconditionally, since the whole `/afx/staff`
area is already staff-gated by the layout). It sits alongside the existing
admin-only "Manage team →" link (which stays gated on `role === 'admin'`).

## Guardrails / edge cases

- Page + `listInvites()` both require `resolveStaff()` (any staff); non-staff never
  reach either.
- An activated invite whose `redeemed_by` producer row is missing (shouldn't happen,
  but defensively): `producerName`/`company` fall back to `null` → UI shows the email
  and "activated" without a name; never throws.
- `last_sign_in_at` unresolved (auth API hiccup, or user not in the paged set):
  `lastActiveAt` null → "last active —". A transient `listUsers` error degrades the
  last-active column to "—" but never blocks the list.
- Pending rows never have producer/last-active data (no `redeemed_by`).

## Error handling

- `listInvites()` returns `[]` on non-staff or on a top-level `afx_invites` read
  error (no throw across the RSC boundary). Producer/last-active enrichment failures
  degrade individual fields to `null`, they do not fail the whole list.

## Testing / verification

Per the AFX idiom (no test runner):
1. `npx tsc --noEmit -p tsconfig.json`
2. `npx next build` — `/afx/staff/invites` appears in the route list.
3. **Live gate** — a repo-root `tsx` script against prod (deleted after), which:
   - Seeds a disposable auth user + a matching **pending** `afx_invites` row; asserts
     `listInvites`-shaped reads see it as pending with null activation fields.
     (Since `listInvites` is `server-only` and can't be imported into a plain script,
     the live gate exercises the underlying DB reads directly with `afxAdmin`:
     read `afx_invites`, resolve `afx_producers` by `redeemed_by`, and confirm
     `listUsers` returns `last_sign_in_at` for a known user — the three mechanisms the
     data layer composes.)
   - Seeds a second disposable user with an `afx_producers` row and a **redeemed**
     invite (`redeemed_at`, `redeemed_by` set); asserts the producer name/company and
     an auth `last_sign_in_at` resolve for it.
   - Confirms `afx_invites` is **not** readable by a signed-in user JWT (RLS holds).
   - Prints `LIVE_OK`; always cleans up (invite rows, producer rows, auth users).

## Future (out of scope)

- Invite management UI (create / resend / revoke) — would still need no migration,
  just service-role writes behind an admin gate.
- Search / filter / pagination if the invite list grows large enough that a single
  `listUsers` sweep or a full-list render becomes heavy.
