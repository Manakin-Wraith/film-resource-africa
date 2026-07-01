# AFX Producer Onboarding (AFX login + in-app invite flow) — Design

**Date:** 2026-07-01
**Status:** Approved (design)
**Context:** Producers are gated into AFX by the `afx_invites` email allowlist,
redeemed by `redeem_afx_invite()` on first visit to `/afx/producer`. Two gaps block
a real in-app invite flow:

1. **No AFX login.** The only entry is the generic `/login`, which sends a magic
   link **only to active FRA members** (`/api/members/check-email` → `members.status
   = 'active'`). AFX producers **can be non-members**, so an invited non-member is
   turned away at `/login` before a link is even sent — they cannot get in at all.
   `/afx/producer:9` also redirects unauthenticated visitors to `/login`, compounding
   this.
2. **No in-app invite.** Invites are created by hand via Dashboard SQL; the producer
   is notified out-of-band.

This delivers producer onboarding in two coupled parts: **A)** a dedicated AFX
magic-link login gating on `afx_invites`, and **B)** staff invite creation +
notification email + revoke. Part A is the prerequisite (the invite email is useless
until the AFX login exists), so it ships first.

## Goal

Let staff invite a producer by email from the AFX staff surface — creating the
`afx_invites` row and emailing the producer a link to a dedicated AFX login that lets
them (member or not) sign in and activate.

## Non-goals (YAGNI)

- **Password auth / new auth mechanism.** Reuse Supabase magic-link (`signInWithOtp`)
  and the existing `/auth/callback`.
- **Resend / bulk invite / CSV import.** Single invite by email; revoke a pending one.
- **Editing producers or changing `redeem_afx_invite()`.** Redemption is unchanged.
- **Member↔producer account linking** beyond matching on email (already how redemption
  and login work).
- **Hiding invite existence.** Per decision, `/afx/login` shows a clear "not on the
  list" message (see Enumeration below).

## Constraints (from the AFX project)

- **No migration.** `afx_invites` (`id, email unique, created_at, redeemed_at,
  redeemed_by`) and `afx_producers` already exist. No schema changes.
- **`afx_invites` / `afx_producers` writes/reads via `afxAdmin` (service-role)** — RLS
  has no client policies. The invite-check endpoint and all staff invite actions use
  service-role behind their own gates.
- **Invite management is ANY-staff** (reviewer or admin), consistent with the invite
  funnel page it extends — gate is `resolveStaff()` truthy.
- **Email via Resend**, matching existing server routes: `new
  Resend(process.env.RESEND_API_KEY)` → `resend.emails.send(...)`, `from: 'FRA System
  <hello@film-resource-africa.com>'`. No shared helper exists; inline per the codebase
  pattern.
- **Login is magic-link**, `signInWithOtp({ shouldCreateUser: true })`, redirecting via
  `/auth/callback?next=<path>`. The callback already redirects a non-member to `next`
  (route.ts:58), so `next=/afx/producer` lands a non-member producer in AFX with **no
  callback changes**.
- **AFX visual system:** inline styles + `var(--afx-*)` (afx.css), scoped under
  `.afx-root`, Hanken Grotesk / IBM Plex Mono.
- **Base URL** for email links: `process.env.NEXT_PUBLIC_SITE_URL` (used by the mailer
  scripts), fallback `https://film-resource-africa.com`.

## Enumeration (accepted tradeoff)

`/afx/login` and `/api/afx/invite-check` reveal whether an email is on the AFX list
(a clear "not invited → request access" message). This matches the existing `/login`,
which already reveals membership status, and suits an invite-only beta. The endpoint
is unauthenticated (like `/api/members/check-email`). Accepted per decision.

---

## Part A — Dedicated AFX login (`/afx/login`)

The prerequisite. An AFX-branded magic-link entry gating on `afx_invites`.

### Files
| File | Change | Purpose |
|------|--------|---------|
| `src/app/api/afx/invite-check/route.ts` | **new** | GET `?email=` → `{ invited: boolean }` — service-role check of `afx_invites` |
| `src/app/afx/login/page.tsx` | **new** | AFX-branded magic-link login gating on the invite check |
| `src/app/afx/producer/page.tsx` | **edit** | redirect unauthenticated visitors to `/afx/login` (line 9) |

### `invite-check` endpoint
Mirrors `/api/members/check-email`: unauthenticated GET, service-role client.
`email = (?email).toLowerCase().trim()`. Query `afx_invites` for a row where
`lower(email) = email` (any redemption state — a returning producer's email is also in
`afx_invites`). Returns `{ invited: !!row }`. (A row exists iff the person was invited;
every producer has one, since redemption requires an invite.)

### `/afx/login` page
`'use client'`, scoped under `.afx-root`, AFX styling (mirrors `/login`'s structure but
AFX-branded). Flow:
1. Producer enters email → `fetch('/api/afx/invite-check?email=…')`.
2. `invited === false` → inline message: "You're not on the AFX list yet." + the
   AccessWall's "Request access" mailto CTA (`hello@film-resource-africa.com?subject=AFX
   producer access`). No link sent.
3. `invited === true` → `supabase.auth.signInWithOtp({ email, options: {
   emailRedirectTo: `${origin}/auth/callback?next=/afx/producer`, shouldCreateUser: true
   } })` → on success switch to an inline "Check your inbox — we sent a magic link to
   <email>" state (no separate route; single-page state, unlike `/login`'s
   `/login/check-email`). On error, show the message.

### Producer page redirect
`src/app/afx/producer/page.tsx:9`: change
`redirect('/login?next=/afx/producer')` → `redirect('/afx/login')`.
So a logged-out visitor to `/afx/producer` (e.g. bookmarked, or the post-invite link)
is sent to the AFX login, not the member login.

### Post-login (unchanged)
Magic link → `/auth/callback?next=/afx/producer` → session established → non-member
falls through to `next` (`/afx/producer`) → `redeem_afx_invite()` activates them (or
`AccessWall` if somehow not invited). No callback or redeem changes.

---

## Part B — Staff invite management (on the invite funnel page)

Extends the shipped all-staff invite funnel (`/afx/staff/invites`) from read-only to
create + revoke-pending.

### Files
| File | Change | Purpose |
|------|--------|---------|
| `src/lib/afx/inviteFunnel.ts` | **edit** | add pure `inviteOutcome(existing)` classifier |
| `src/lib/afx/server/staffInvites.ts` | **edit** | add `createInvite(email)`, `revokeInvite(id)` |
| `src/app/afx/staff/invites/actions.ts` | **new** | `'use server'` wrappers |
| `src/components/afx/staff/StaffInvites.tsx` | **edit** | add-by-email form + revoke button |

### Pure classifier — `inviteOutcome`
`inviteOutcome(existing: { redeemed_at: string | null } | null): 'new' | 'already_invited'
| 'already_producer'` — `null → 'new'`; `redeemed_at != null → 'already_producer'`;
else `'already_invited'`. Unit-tested.

### Data layer — `staffInvites.ts` (server-only)
Both re-check `resolveStaff()` (any staff). Reuse `validateEmail` from
`@/lib/afx/staffAdminGuards`.

- **`createInvite(email): Promise<Result>`** (`Result = { ok, error?, note? }`):
  1. `resolveStaff()` gate.
  2. `validateEmail(email)`; normalise `trim().toLowerCase()`.
  3. Look up existing `afx_invites` row by email → `inviteOutcome`:
     - `already_producer` → `{ ok: true, note: 'Already an AFX producer.' }` (no email).
     - `already_invited` → `{ ok: true, note: 'Already invited.' }` (idempotent; no
       duplicate email — resend is a non-goal).
     - `new` → `insert afx_invites (email)`; then send the invite email via Resend.
       - Insert error → `{ ok: false, error: 'Could not create the invite.' }`.
       - Insert ok but email send throws → `{ ok: true, note: 'Invited, but the email
         failed to send — follow up manually.' }` (invite persists; never silent).
       - Both ok → `{ ok: true }`.
- **`revokeInvite(id): Promise<Result>`**:
  1. `resolveStaff()` gate.
  2. `delete from afx_invites where id = $1 and redeemed_at is null` (pending only).
  3. Zero rows deleted → `{ ok: false, error: 'Already activated — can\'t revoke.' }`
     (or already gone). Else `{ ok: true }`.

### Invite email (Resend, inline)
`from: 'FRA System <hello@film-resource-africa.com>'`, `to: [email]`, subject
`You're invited to AFX`. Body (html + text): a short note that they've been invited to
the AFX finance layer, and a CTA button/link to `${SITE_URL}/afx/login`, telling them to
sign in with **this** email address. `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ??
'https://film-resource-africa.com'`.

### Server actions — `invites/actions.ts`
```ts
'use server';
import { createInvite, revokeInvite } from '@/lib/afx/server/staffInvites';
export async function createInviteAction(email: string) { return createInvite(email); }
export async function revokeInviteAction(id: string) { return revokeInvite(id); }
```

### UI — `StaffInvites.tsx` (now interactive)
Becomes read-write (keeps `'use client'`, adds `busy`/`error`/`note` state +
`router.refresh()`, mirroring `StaffTeam`):
- **Invite card** at the top: an email input + "Invite producer" button. Success clears
  the input, shows the `note` (or a generic "Invited.") and refreshes; errors in the red
  style. Empty input is a no-op.
- **Revoke** on **pending rows only**: a two-click inline confirm (Revoke → Confirm?),
  matching `StaffTeam`'s remove idiom. Activated rows get no revoke control.

---

## Error handling

- Endpoints/actions never throw across the boundary: `invite-check` returns
  `{ invited: false }` on any lookup miss/error; `createInvite`/`revokeInvite` return the
  `Result` shape. A failed invite-email send after a successful insert degrades to a
  visible `note`, never a silent success.
- `/afx/login` surfaces `signInWithOtp` errors inline and never leaves the button stuck
  (`try/finally`).

## Testing / verification

Per the AFX idiom (no test runner):
1. `npx tsc --noEmit -p tsconfig.json`
2. `npx next build` — `/afx/login` and `/api/afx/invite-check` appear in the route list.
3. **Unit (pure):** `inviteOutcome` — `null→'new'`, `{redeemed_at:null}→'already_invited'`,
   `{redeemed_at:'…'}→'already_producer'` (repo-root `.mts`, run via `npx tsx`, deleted
   after; extensionless local import, no tsconfig change).
4. **Live gate** against prod (DB-level; deleted after): seed a disposable auth user +
   pending `afx_invites` row; assert the invite-check DB read finds it (invited) and a
   random email does not; assert a duplicate insert hits the unique constraint; assert the
   `redeemed_at is null` delete removes a pending invite but does NOT remove a redeemed one;
   confirm `afx_invites` stays non-client-readable (RLS). Does NOT send a real email.
   Cleans up (invite rows + auth user) in a `finally` (awaited deletes — no `.catch()` on
   query builders).
5. **Manual browser e2e** (post-deploy): from `/afx/staff/invites`, invite a test address
   you control → confirm the email arrives and its CTA opens `/afx/login` → enter the
   address → magic link → lands in `/afx/producer` activated. (This is the only path that
   sends a real email, so it's verified by hand, not in the live gate.)

## Sequencing

**Part A first** (the AFX login is the invite email's destination and the fix for
non-member lockout), then **Part B**. Recommend **two PRs** (A, then B) so the login can
be verified independently before invites point at it.

## Future (out of scope)

- Resend / bulk invite / CSV.
- Invite expiry (`afx_invites` has no expiry column; would need a migration).
- Suppressing enumeration (generic "if invited, check your inbox" messaging).
- An AFX-branded `check-email` confirmation route (currently an inline state).
