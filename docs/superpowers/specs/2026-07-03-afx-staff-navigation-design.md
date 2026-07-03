# AFX Staff Cross-Surface Navigation Design

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Area:** `AfxTopBar` (the shared masthead) — add a staff-only switcher so staff can move between every AFX surface in one click, for demoing the full flow to partners.
**Builds on:** the shared `AfxTopBar` component, the `resolveStaff()` gate (`StaffAccess { userId; role: 'reviewer' | 'admin' }`), and the existing `/afx/*` route set.

## Problem

Navigating the AFX surfaces requires typing URLs. `AfxTopBar` (on the producer
cockpit, funder marketplace, and every staff page) only links back to `/afx`. Staff
nav is scattered: the `/afx/staff` queue has an inline link row (Invites / NDA log /
Marketplace review / Manage team), each staff sub-page has a lone "← Queue" back link,
and there is no way to hop from the producer cockpit to the funder marketplace to the
staff queue without editing the address bar. Demoing the end-to-end flow to partners is
clumsy.

## Goal

Give staff a single cross-surface switcher in the shared masthead — Producer seat,
Funder seat, and the FRA review tools — with an active-state cue, visible only to staff.
Producers and funders keep today's minimal bar.

## Confirmed decisions

1. **Staff-only global switcher** across all AFX surfaces, added to `AfxTopBar` (so it
   appears everywhere staff go). Non-staff see today's bar unchanged.
2. **Grouped layout:** `Producer` · `Funder` · `FRA review ▾` — the two seats as
   top-level links, the five review tools in a labeled dropdown. Matches the product's
   "two seats, one set of facts" narrative.
3. **Placement:** in the masthead after the logo, left of the flex spacer, so it never
   collides with the producer cockpit's right-slot "My Data / Funder Preview" toggle.
4. **Existing nav:** remove the inline link row on `/afx/staff` (superseded by the
   switcher); keep the per-page "← Queue" back-links as the local "up to the list" cue.

## Architecture

### New component — `src/components/afx/AfxNavSwitcher.tsx` (`'use client'`)
The switcher. Props: `{ role: 'reviewer' | 'admin' }`. Uses `usePathname()` for active
state and `useState` for the dropdown open/close.

- Three top-level items rendered inline:
  - **Producer** → `/afx/producer`
  - **Funder** → `/afx/marketplace`
  - **FRA review ▾** → a button toggling a dropdown.
- The **FRA review** dropdown lists: **Queue** (`/afx/staff`), **Marketplace review**
  (`/afx/staff/marketplace`), **NDA log** (`/afx/staff/nda`), **Invites**
  (`/afx/staff/invites`), and **Manage team** (`/afx/staff/team`) — the last shown only
  when `role === 'admin'`.
- **Active state** from `usePathname()`:
  - `Producer` active when the path is under `/afx/producer`.
  - `Funder` active when the path is `/afx/marketplace` (exact; NOT `/afx/staff/marketplace`).
  - `FRA review` active when the path is under `/afx/staff` (any staff page, including the
    submission drill-down `/afx/staff/[id]`).
  - Inside the open dropdown, the exact current review page is also highlighted.
- The "Funder" seat (`/afx/marketplace`) and the internal "Marketplace review"
  (`/afx/staff/marketplace`) keep distinct labels to avoid demo confusion.
- Styling follows the existing masthead / staff-nav idiom (`var(--afx-mono)`,
  `var(--afx-*)` tokens, the pill/`navLink` look already used on `/afx/staff`).

### Modified — `src/components/afx/AfxTopBar.tsx`
Add an optional prop `staff?: StaffAccess | null` (import the `StaffAccess` type from
`@/lib/afx/server/staffAccess`, type-only). When `staff` is truthy, render
`<AfxNavSwitcher role={staff.role} />` in the bar after the logo `Link` and before the
`flex: 1` spacer. When `staff` is null/absent, the bar is exactly as today. `AfxTopBar`
itself stays a non-client component; it simply composes the client `AfxNavSwitcher`.

### Wiring the staff flag into every call site
Each surface passes the staff object it already resolves:
- **Staff pages** (`/afx/staff`, `/afx/staff/nda`, `/afx/staff/marketplace`,
  `/afx/staff/team`, `/afx/staff/[id]`): each already calls `resolveStaff()` (or can);
  pass `staff={staff}` to its `AfxTopBar`.
- **Funder marketplace** (`/afx/marketplace/page.tsx`): already resolves `staff` for its
  gate; pass it to `AfxTopBar`.
- **Producer cockpit:** `AfxTopBar` there is rendered inside the client
  `ProducerProfileClient`. The server route `/afx/producer/page.tsx` resolves
  `resolveStaff()` and passes a serializable `staffRole?: 'reviewer' | 'admin' | null`
  (or the whole `staff` object) down through `ProducerProfileClient` to its `AfxTopBar`.
  A non-staff producer gets `null` → no switcher.

### Removed
The inline link row (`Invites →` / `NDA log →` / `Marketplace review →` /
`Manage team →`) in `src/app/afx/staff/page.tsx`, now superseded by the switcher. The
`navLink` style const there is removed if it has no other user. The per-page "← Queue"
back-links on the staff sub-pages are **kept**.

## Data flow

Each server surface resolves `resolveStaff()` (staff pages and the funder marketplace
already do; the producer route adds the call) and passes the result into `AfxTopBar`.
`AfxTopBar` conditionally renders `AfxNavSwitcher`, which is a pure client component
driven only by its `role` prop and `usePathname()`. No new server round-trips, no data
fetching in the switcher.

## Error handling

- Non-staff (`staff` null): the switcher is not rendered — producers/funders never see
  staff destinations. The `/afx/staff/*` layout still redirects non-staff who try the
  URLs directly, so the switcher exposes nothing a staff session isn't already entitled to.
- `role !== 'admin'`: the "Manage team" item is omitted (matches the existing
  admin-gating on `/afx/staff`).
- The switcher performs no I/O, so there are no failure states to handle beyond
  conditional rendering.

## Testing

No test runner. Verify with:
- `npx tsc --noEmit -p tsconfig.json` + `npx next build`.
- **Browser on prod** (Gerhard, staff admin): the switcher appears on the producer
  cockpit, the funder marketplace, and every staff page; `Producer`/`Funder`/`FRA review`
  each navigate correctly; the active item reflects the current surface; the FRA review
  dropdown opens and lists Queue / Marketplace review / NDA log / Invites / Manage team,
  and "Manage team" is present for the admin; the `/afx/staff` inline link row is gone;
  each staff sub-page still shows "← Queue". Confirm (or reason via the null path) that a
  non-staff producer session shows no switcher.

No migration, no new RLS/policy, no access-model change (the switcher is presentation over
the existing `resolveStaff()` gate).

## YAGNI (explicitly not building)

- No switcher on the `/afx` landing page (it keeps its own two-card layout; the switcher
  appears once inside any surface).
- No producer/funder-facing nav changes (their bar is unchanged).
- No new routes, no route renaming, no access-model change.
- No mobile hamburger / responsive redesign of the masthead beyond what the existing bar
  already does.
- No breadcrumb system beyond the retained "← Queue" back-links.
