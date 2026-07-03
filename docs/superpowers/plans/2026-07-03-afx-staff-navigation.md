# AFX Staff Cross-Surface Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a staff-only cross-surface switcher (`Producer · Funder · FRA review ▾`) to the shared `AfxTopBar`, so staff can jump between every AFX surface in one click while demoing, with active-state cues; non-staff keep today's bar.

**Architecture:** A new `'use client'` `AfxNavSwitcher` component (grouped links + a `FRA review` dropdown + `usePathname()` active state) is conditionally rendered by `AfxTopBar` when it receives a `staffRole`. Each surface passes the staff role it already resolves via `resolveStaff()`; the producer route threads it through `ProducerProfileClient`. The redundant inline nav row on `/afx/staff` is removed; per-page "← Queue" back-links stay.

**Tech Stack:** Next.js App Router (RSC + `'use client'`, `next/navigation` `usePathname`, `next/link`), TypeScript, inline `var(--afx-*)` styling.

## Global Constraints

- Staff-only: the switcher renders ONLY when `AfxTopBar` receives a truthy `staffRole` (`'reviewer' | 'admin'`). Non-staff surfaces pass `null`/omit it → no switcher.
- Grouped layout: `Producer` (`/afx/producer`) · `Funder` (`/afx/marketplace`) · `FRA review ▾` (dropdown). Placement: after the logo `Link`, before the `flex: 1` spacer, so it never collides with the producer cockpit's right-slot toggle.
- `FRA review` dropdown items in order: `Queue` → `/afx/staff`; `Marketplace review` → `/afx/staff/marketplace`; `NDA log` → `/afx/staff/nda`; `Invites` → `/afx/staff/invites`; `Manage team` → `/afx/staff/team` (shown ONLY when `role === 'admin'`).
- Active state: `Producer` for `/afx/producer*`; `Funder` for `/afx/marketplace*` but NOT `/afx/staff/marketplace`; `FRA review` for any `/afx/staff*` path (including the `/afx/staff/[id]` drill-down). The `/afx/staff` prefix is checked BEFORE `/afx/marketplace` so `/afx/staff/marketplace` resolves to review, not funder.
- Remove the inline link row (`Invites →` / `NDA log →` / `Marketplace review →` / `Manage team →`) from `src/app/afx/staff/page.tsx`. Keep every per-page "← Queue" back-link.
- No new routes, no route renaming, no access-model change, no migration.
- No test runner; verification is `npx tsc --noEmit -p tsconfig.json` + `npx next build`, plus a `npx tsx` assertion for the pure `activeTop` helper (deleted after), plus a manual prod browser check.

**Codebase facts (verified):** `AfxTopBar` (`src/components/afx/AfxTopBar.tsx`) is a non-client component with props `{ subtitle: string; right?: React.ReactNode }`, used by the producer cockpit, funder marketplace, and all staff pages. `resolveStaff()` returns `StaffAccess { userId: string; role: 'reviewer' | 'admin' } | null`. Staff pages `staff/{page,nda/page,marketplace/page,team/page,invites/page}.tsx` already call `resolveStaff()`; `staff/[id]/page.tsx` does NOT (it only calls `getSubmissionDetail`, and the `/afx/staff` layout gates non-staff). `marketplace/page.tsx` (funder) resolves `staff`. `producer/page.tsx` does NOT resolve staff and renders `ProducerProfileClient` (a `'use client'` component whose props are `{ initial, initialSubmissions }`), which renders `AfxTopBar` with a `right` slot.

---

### Task 1: `AfxNavSwitcher` component + `AfxTopBar` prop

**Files:**
- Create: `src/components/afx/AfxNavSwitcher.tsx`
- Modify: `src/components/afx/AfxTopBar.tsx`
- Test (temporary, deleted in Step 6): `afxNavSwitcher.test.mts` at repo root

**Interfaces:**
- Consumes: `usePathname` from `next/navigation`; `Link` from `next/link`.
- Produces:
  - `AfxNavSwitcher` default export — `({ role }: { role: 'reviewer' | 'admin' }) => JSX`.
  - `activeTop(pathname: string): 'producer' | 'funder' | 'review' | null` (named export, pure).
  - `AfxTopBar` gains prop `staffRole?: 'reviewer' | 'admin' | null` (consumed by Task 2's call sites).

- [ ] **Step 1: Write the failing test**

Create `afxNavSwitcher.test.mts` at the repo root:

```ts
import assert from 'node:assert/strict';
import { activeTop } from './src/components/afx/AfxNavSwitcher';

assert.equal(activeTop('/afx/producer'), 'producer');
assert.equal(activeTop('/afx/producer/anything'), 'producer');
assert.equal(activeTop('/afx/marketplace'), 'funder');
assert.equal(activeTop('/afx/staff'), 'review');
assert.equal(activeTop('/afx/staff/nda'), 'review');
assert.equal(activeTop('/afx/staff/invites'), 'review');
assert.equal(activeTop('/afx/staff/team'), 'review');
// The subtle one: the internal review marketplace must NOT read as the funder seat.
assert.equal(activeTop('/afx/staff/marketplace'), 'review');
// A submission drill-down is still the review surface.
assert.equal(activeTop('/afx/staff/abc-123'), 'review');
// Non-surface paths.
assert.equal(activeTop('/afx'), null);
assert.equal(activeTop('/afx/login'), null);

console.log('afxNavSwitcher.activeTop: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx afxNavSwitcher.test.mts`
Expected: FAIL — module `./src/components/afx/AfxNavSwitcher` not found.

- [ ] **Step 3: Create the component**

Create `src/components/afx/AfxNavSwitcher.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mono = 'var(--afx-mono)';

export type ActiveTop = 'producer' | 'funder' | 'review' | null;

/** Which top-level seat a path belongs to. `/afx/staff` is checked before
 *  `/afx/marketplace` so `/afx/staff/marketplace` (the internal review surface)
 *  reads as 'review', not the funder seat. Pure. */
export function activeTop(pathname: string): ActiveTop {
  if (pathname.startsWith('/afx/producer')) return 'producer';
  if (pathname.startsWith('/afx/staff')) return 'review';
  if (pathname.startsWith('/afx/marketplace')) return 'funder';
  return null;
}

const REVIEW_ITEMS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: '/afx/staff', label: 'Queue' },
  { href: '/afx/staff/marketplace', label: 'Marketplace review' },
  { href: '/afx/staff/nda', label: 'NDA log' },
  { href: '/afx/staff/invites', label: 'Invites' },
  { href: '/afx/staff/team', label: 'Manage team', adminOnly: true },
];

function topStyle(active: boolean): React.CSSProperties {
  return {
    fontFamily: mono, fontSize: 11, fontWeight: 700, textDecoration: 'none',
    padding: '6px 11px', borderRadius: 8,
    border: `1px solid ${active ? 'var(--afx-ink)' : 'transparent'}`,
    background: active ? 'var(--afx-ink)' : 'transparent',
    color: active ? '#fff' : 'var(--afx-muted)',
  };
}

export default function AfxNavSwitcher({ role }: { role: 'reviewer' | 'admin' }) {
  const pathname = usePathname() ?? '';
  const active = activeTop(pathname);
  const [open, setOpen] = useState(false);
  const items = REVIEW_ITEMS.filter((it) => !it.adminOnly || role === 'admin');

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Link href="/afx/producer" style={topStyle(active === 'producer')}>Producer</Link>
      <Link href="/afx/marketplace" style={topStyle(active === 'funder')}>Funder</Link>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ ...topStyle(active === 'review'), cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          FRA review <span style={{ fontSize: 8 }}>{open ? '▲' : '▼'}</span>
        </button>
        {open ? (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 41, background: '#fff', border: '1px solid var(--afx-border)', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.10)', padding: 5, minWidth: 190, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.map((it) => {
                const isCurrent = pathname === it.href;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    style={{ fontFamily: mono, fontSize: 11.5, fontWeight: 600, textDecoration: 'none', padding: '8px 11px', borderRadius: 7, color: isCurrent ? 'var(--afx-ink)' : 'var(--afx-muted)', background: isCurrent ? '#F1EFEA' : 'transparent' }}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx afxNavSwitcher.test.mts`
Expected: PASS — prints `afxNavSwitcher.activeTop: all assertions passed`.

- [ ] **Step 5: Wire the prop into `AfxTopBar`**

In `src/components/afx/AfxTopBar.tsx`: add the import, extend `Props`, and render the switcher after the logo `Link`. Replace the import line and `Props` interface:

```tsx
import Link from 'next/link';
import AfxNavSwitcher from './AfxNavSwitcher';

interface Props {
  subtitle: string;
  staffRole?: 'reviewer' | 'admin' | null;
  right?: React.ReactNode;
}
```

Change the function signature `export default function AfxTopBar({ subtitle, right }: Props) {` to:

```tsx
export default function AfxTopBar({ subtitle, staffRole, right }: Props) {
```

Immediately after the closing `</Link>` of the logo link and before `<div style={{ flex: 1 }} />`, insert:

```tsx
        {staffRole ? <AfxNavSwitcher role={staffRole} /> : null}
```

- [ ] **Step 6: Delete the temp test, type-check, build, commit**

```bash
rm afxNavSwitcher.test.mts
npx tsc --noEmit -p tsconfig.json
npx next build
```
Expected: `tsc` exits 0; `next build` succeeds (no ESLint errors). The switcher renders nowhere yet (no call site passes `staffRole`) — that is Task 2.

```bash
git add src/components/afx/AfxNavSwitcher.tsx src/components/afx/AfxTopBar.tsx
git commit -m "feat(afx): AfxNavSwitcher + AfxTopBar staffRole prop"
```

---

### Task 2: Wire `staffRole` into every surface + remove the inline nav row

**Files:**
- Modify: `src/app/afx/staff/page.tsx`, `src/app/afx/staff/nda/page.tsx`, `src/app/afx/staff/marketplace/page.tsx`, `src/app/afx/staff/team/page.tsx`, `src/app/afx/staff/invites/page.tsx`, `src/app/afx/staff/[id]/page.tsx`, `src/app/afx/marketplace/page.tsx`, `src/app/afx/producer/page.tsx`, `src/app/afx/producer/ProducerProfileClient.tsx`

**Interfaces:**
- Consumes: `AfxTopBar`'s new prop `staffRole?: 'reviewer' | 'admin' | null` (Task 1); `resolveStaff()` from `@/lib/afx/server/staffAccess` (returns `{ userId, role } | null`).
- Produces: nothing new exported; each surface now feeds the switcher.

- [ ] **Step 1: Staff pages that already resolve `staff` — pass `staffRole`**

In each of these four files, the `AfxTopBar` is currently `<AfxTopBar subtitle="FRA review" />` and a `const staff = await resolveStaff();` already exists above it. Change the tag to `<AfxTopBar subtitle="FRA review" staffRole={staff?.role ?? null} />`:
- `src/app/afx/staff/nda/page.tsx`
- `src/app/afx/staff/marketplace/page.tsx`
- `src/app/afx/staff/invites/page.tsx`

And in `src/app/afx/staff/team/page.tsx` (where `staff` is guaranteed admin past the guard, but the null-safe form is still correct):

```tsx
      <AfxTopBar subtitle="FRA review" staffRole={staff?.role ?? null} />
```

- [ ] **Step 2: Funder marketplace — pass `staffRole`**

In `src/app/afx/marketplace/page.tsx`, `const staff = await resolveStaff();` already exists. Change `<AfxTopBar subtitle="Deal screening" />` to:

```tsx
      <AfxTopBar subtitle="Deal screening" staffRole={staff?.role ?? null} />
```

- [ ] **Step 3: Submission drill-down — resolve staff, then pass**

`src/app/afx/staff/[id]/page.tsx` does not resolve staff yet. Add the import and the call, then pass the role. Replace the top imports and function body so it reads:

```tsx
import { notFound } from 'next/navigation';
import AfxTopBar from '@/components/afx/AfxTopBar';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { getSubmissionDetail } from '@/lib/afx/server/staffReview';
import StaffSubmissionDetail from '@/components/afx/staff/StaffSubmissionDetail';

export default async function AfxStaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await resolveStaff();
  const detail = await getSubmissionDetail(id);
  if (!detail) notFound();
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" staffRole={staff?.role ?? null} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffSubmissionDetail detail={detail} />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Staff queue — remove the inline nav row, pass `staffRole`**

Rewrite `src/app/afx/staff/page.tsx` entirely to (removes the `navLink` const, the `Link` import, and the inline nav-row `<div>`; keeps `staff` for the `staffRole`):

```tsx
import AfxTopBar from '@/components/afx/AfxTopBar';
import { listSubmissions } from '@/lib/afx/server/staffReview';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import StaffQueue from '@/components/afx/staff/StaffQueue';

export default async function AfxStaffPage() {
  const staff = await resolveStaff();
  const open = await listSubmissions('open');
  const decided = await listSubmissions('decided');
  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar subtitle="FRA review" staffRole={staff?.role ?? null} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <StaffQueue open={open} decided={decided} />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Producer route — resolve staff, thread to the client**

Rewrite `src/app/afx/producer/page.tsx` to resolve staff and pass `staffRole`:

```tsx
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { loadProducerState } from '@/lib/afx/server/producerStore';
import ProducerProfileClient from './ProducerProfileClient';
import AccessWall from './AccessWall';

export default async function AfxProducerPage() {
  const user = await getSessionUser();
  if (!user) redirect('/afx/login');

  const state = await loadProducerState();
  if (!state) return <AccessWall />; // authenticated but not invited

  const staff = await resolveStaff();
  return <ProducerProfileClient initial={state.profile} initialSubmissions={state.submissions} staffRole={staff?.role ?? null} />;
}
```

- [ ] **Step 6: Producer client — accept + forward `staffRole`**

In `src/app/afx/producer/ProducerProfileClient.tsx`, change the component signature (currently `export default function ProducerProfileClient({ initial, initialSubmissions }: { initial: ProducerProfile; initialSubmissions: VettingSubmission[] }) {`) to:

```tsx
export default function ProducerProfileClient({ initial, initialSubmissions, staffRole }: { initial: ProducerProfile; initialSubmissions: VettingSubmission[]; staffRole?: 'reviewer' | 'admin' | null }) {
```

Then add the prop to its `AfxTopBar` — change `<AfxTopBar subtitle="Producer cockpit" right={` to:

```tsx
      <AfxTopBar
        subtitle="Producer cockpit"
        staffRole={staffRole}
        right={
```

(The rest of the `AfxTopBar` block — the `right` slot content — is unchanged.)

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors.

- [ ] **Step 8: Production build**

Run: `npx next build`
Expected: build succeeds; no ESLint errors (the removed `Link`/`navLink` in `staff/page.tsx` leave no unused symbols; every `AfxTopBar` call type-checks with the new optional prop).

- [ ] **Step 9: Commit**

```bash
git add src/app/afx/staff/page.tsx src/app/afx/staff/nda/page.tsx src/app/afx/staff/marketplace/page.tsx src/app/afx/staff/team/page.tsx src/app/afx/staff/invites/page.tsx "src/app/afx/staff/[id]/page.tsx" src/app/afx/marketplace/page.tsx src/app/afx/producer/page.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): wire staff switcher into all surfaces; drop inline staff nav row"
```

## Manual verification (post-merge, on prod by Gerhard, staff admin)

Not automatable (auth-gated, client nav). After deploy:

1. On `/afx/producer`, `/afx/marketplace`, and every `/afx/staff*` page, the switcher appears in the masthead: `Producer · Funder · FRA review ▾`.
2. The active top-level item matches the current surface (Producer on the cockpit, Funder on `/afx/marketplace`, FRA review on all staff pages — including a submission drill-down and `/afx/staff/marketplace`, which must NOT light up Funder).
3. `Producer` and `Funder` navigate to those seats; `FRA review ▾` opens a dropdown listing Queue / Marketplace review / NDA log / Invites / Manage team, and "Manage team" is present (Gerhard is admin); each item navigates and the dropdown closes.
4. The old inline link row on `/afx/staff` is gone; each staff sub-page still shows "← Queue".
5. Reason/confirm the non-staff path: a producer-only session (`staffRole` null) shows no switcher on `/afx/producer`.

No migration, no new RLS/policy, no access-model change.
