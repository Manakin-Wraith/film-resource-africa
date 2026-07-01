# AFX Producer Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff invite producers by email from the AFX staff surface (creating the `afx_invites` row + emailing a login link), and give producers a dedicated AFX magic-link login that gates on `afx_invites` instead of FRA membership.

**Architecture:** Two sequenced phases. **Phase A** adds `/afx/login` (magic-link, gated on `afx_invites` via a service-role check) + flips the `/afx/producer` unauthenticated redirect to it — this fixes non-member lockout and is the invite email's destination, so it ships (PR + deploy) first. **Phase B** extends the existing all-staff invite funnel page with invite-by-email (+ Resend notification) and revoke-pending. No migration; reuses Supabase magic-link, `/auth/callback`, and the codebase's Resend pattern.

**Tech Stack:** Next.js App Router (RSC + server actions + route handlers), `@supabase/supabase-js` (service-role) + `@supabase/ssr` browser client, `signInWithOtp`, Resend, TypeScript, inline `var(--afx-*)` styling.

## Global Constraints

- **No migration.** `afx_invites` (`id, email unique, created_at, redeemed_at, redeemed_by`) and `afx_producers` already exist. No schema changes.
- **`afx_invites`/`afx_producers` access via service-role** (`afxAdmin`, or a route-local service client) — RLS has no client policies.
- **Invite management is ANY-staff** — the gate is `resolveStaff()` truthy (reviewer OR admin), consistent with the funnel page it extends.
- **Magic-link auth:** `signInWithOtp({ email, options: { emailRedirectTo: '<origin>/auth/callback?next=/afx/producer', shouldCreateUser: true } })`. The callback already routes a non-member to `next` — do NOT modify `/auth/callback` or `redeem_afx_invite()`.
- **Email via Resend**, matching existing routes: `const { Resend } = await import('resend'); new Resend(process.env.RESEND_API_KEY); resend.emails.send({ from: 'FRA System <hello@film-resource-africa.com>', ... })`. Inline (no shared helper).
- **Base URL:** `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://film-resource-africa.com'`.
- **Enumeration accepted:** `/afx/login` + `/api/afx/invite-check` reveal invite status with a clear message (consistent with `/api/members/check-email`). Endpoint is unauthenticated + service-role.
- **AFX visual system:** inline styles + `var(--afx-*)` (`--afx-bg/surface/ink/muted/accent/border/faint/faintest/body/mono`), scoped under `.afx-root`.
- **Verification idiom (no test runner):** `npx tsc --noEmit -p tsconfig.json`, `npx next build`, `npx tsx` scripts in the REPO ROOT (deleted after). Live scripts load `.env.local` via `dotenv` (`config({ path: '.env.local' })`), target prod (`rcgynwcttgvqcnbyfhiz`), mint disposable users with `admin.auth.admin.createUser`, and clean up in a `finally` using awaited deletes (NEVER `.catch()` on a query builder). Local `.ts` imports from `.mts` are extensionless; do NOT touch `tsconfig.json`.

---

# PHASE A — Dedicated AFX login (ships first: PR + deploy + browser-verify before Phase B)

### Task 1: AFX invite-check endpoint

**Files:**
- Create: `src/app/api/afx/invite-check/route.ts`

**Interfaces:**
- Produces: `GET /api/afx/invite-check?email=<addr>` → `{ invited: boolean }`.

- [ ] **Step 1: Write the route**

Create `src/app/api/afx/invite-check/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Is this email on the AFX invite list (pending or already redeemed)?
 *  Unauthenticated + service-role, mirroring /api/members/check-email.
 *  Reveals invite status by design (enumeration accepted for the invite-only beta). */
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') ?? '').toLowerCase().trim();
  if (!email) return NextResponse.json({ invited: false });
  const { data } = await supabase
    .from('afx_invites')
    .select('id')
    .ilike('email', email)
    .limit(1);
  return NextResponse.json({ invited: (data ?? []).length > 0 });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 3: Production build**

Run: `npx next build`
Expected: build succeeds; `/api/afx/invite-check` appears in the route list.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/afx/invite-check/route.ts
git commit -m "feat(afx): invite-check endpoint (email on afx_invites list)"
```

---

### Task 2: AFX login page + producer redirect

**Files:**
- Create: `src/app/afx/login/page.tsx`
- Modify: `src/app/afx/producer/page.tsx` (line 9 redirect target)

**Interfaces:**
- Consumes: `GET /api/afx/invite-check` (Task 1); `createSupabaseBrowserClient` from `@/lib/supabase/client`.
- Produces: route `/afx/login`.

- [ ] **Step 1: Write the AFX login page**

Create `src/app/afx/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AfxLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notInvited, setNotInvited] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError(''); setNotInvited(false);
    const trimmed = email.trim().toLowerCase();
    try {
      const res = await fetch(`/api/afx/invite-check?email=${encodeURIComponent(trimmed)}`);
      const { invited } = await res.json();
      if (!invited) { setNotInvited(true); return; }
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/afx/producer`, shouldCreateUser: true },
      });
      if (authError) { setError(authError.message); return; }
      setSent(true);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="afx-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--afx-bg)', fontFamily: 'var(--afx-body)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--afx-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--afx-accent)', marginBottom: 10 }}>AFX — producer login</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px', margin: 0, color: 'var(--afx-ink)' }}>Sign in to AFX</h1>
          <p style={{ fontSize: 13.5, color: 'var(--afx-muted)', marginTop: 8 }}>We&apos;ll email you a magic link — no password.</p>
        </div>

        <div style={{ border: '1px solid var(--afx-border)', borderRadius: 14, background: 'var(--afx-surface)', padding: 24 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--afx-ink)', marginBottom: 6 }}>Check your inbox</div>
              <p style={{ fontSize: 13, color: 'var(--afx-muted)', margin: 0 }}>We sent a magic link to <strong>{email.trim().toLowerCase()}</strong>. Open it on this device to finish signing in.</p>
            </div>
          ) : notInvited ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--afx-ink)', marginBottom: 6 }}>You&apos;re not on the AFX list yet</div>
              <p style={{ fontSize: 13, color: 'var(--afx-muted)', margin: '0 0 16px' }}>AFX is invite-only. If you&apos;re an FRA producer and want access to the finance layer, request an invite.</p>
              <a href="mailto:hello@film-resource-africa.com?subject=AFX%20producer%20access" style={{ display: 'inline-block', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 9, border: '1px solid var(--afx-ink)', background: 'var(--afx-ink)', color: '#fff', textDecoration: 'none' }}>Request access</a>
              <div style={{ marginTop: 14 }}>
                <button onClick={() => setNotInvited(false)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--afx-mono)', fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'underline' }}>Try a different email</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--afx-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)', marginBottom: 6 }}>Email address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--afx-body)', fontSize: 14, border: '1px solid var(--afx-border)', borderRadius: 9, padding: '11px 13px', background: '#fff', color: 'var(--afx-ink)' }} />
              </div>
              {error ? <div style={{ fontSize: 12.5, color: '#c0392b' }}>{error}</div> : null}
              <button type="submit" disabled={loading}
                style={{ cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'var(--afx-body)', fontSize: 14, fontWeight: 700, padding: '12px', borderRadius: 9, border: '1px solid var(--afx-ink)', background: 'var(--afx-ink)', color: '#fff' }}>
                {loading ? 'Sending…' : 'Send magic link →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Flip the producer-page redirect to the AFX login**

In `src/app/afx/producer/page.tsx`, change line 9:

```tsx
  if (!user) redirect('/login?next=/afx/producer');
```

to:

```tsx
  if (!user) redirect('/afx/login');
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 4: Production build**

Run: `npx next build`
Expected: build succeeds; `/afx/login` appears in the route list.

- [ ] **Step 5: Commit**

```bash
git add src/app/afx/login/page.tsx src/app/afx/producer/page.tsx
git commit -m "feat(afx): dedicated /afx/login (invite-gated magic link) + producer redirect"
```

---

> ### PHASE A BOUNDARY — controller action before Phase B
> After Task 2's review passes: open a PR for Phase A, merge, deploy to prod, then verify at runtime (not a code task):
> 1. `curl -s 'https://film-resource-africa.com/api/afx/invite-check?email=g.mostertpot@gmail.com'` → `{"invited":true}`; a random email → `{"invited":false}`.
> 2. In the browser, `/afx/login`: an invited email shows "Check your inbox"; a non-invited email shows "You're not on the AFX list yet" + Request access.
> Only once `/afx/login` is LIVE does the Phase-B invite email have a working destination. Then proceed to Task 3.

---

# PHASE B — Staff invite management (extends the invite funnel page)

### Task 3: Pure invite-outcome classifier

**Files:**
- Modify: `src/lib/afx/inviteFunnel.ts` (append `inviteOutcome`)
- Test: `test_invite_outcome.mts` (repo root, temporary — deleted in Task 6)

**Interfaces:**
- Produces: `inviteOutcome(existing: { redeemed_at: string | null } | null): 'new' | 'already_invited' | 'already_producer'`.

- [ ] **Step 1: Write the failing test**

Create `test_invite_outcome.mts` (repo root):

```ts
import assert from 'node:assert';
import { inviteOutcome } from './src/lib/afx/inviteFunnel';

assert.equal(inviteOutcome(null), 'new');
assert.equal(inviteOutcome({ redeemed_at: null }), 'already_invited');
assert.equal(inviteOutcome({ redeemed_at: '2026-06-10T00:00:00Z' }), 'already_producer');

console.log('INVITE_OUTCOME_OK');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test_invite_outcome.mts`
Expected: FAIL — `inviteOutcome` is not exported yet (TypeError / import error).

- [ ] **Step 3: Append the implementation**

Append to `src/lib/afx/inviteFunnel.ts`:

```ts
/** Classify an add-invite attempt from the existing afx_invites row (or null).
 *  new = no row; already_producer = row already redeemed; already_invited = pending row. */
export function inviteOutcome(existing: { redeemed_at: string | null } | null): 'new' | 'already_invited' | 'already_producer' {
  if (!existing) return 'new';
  return existing.redeemed_at != null ? 'already_producer' : 'already_invited';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test_invite_outcome.mts`
Expected: prints `INVITE_OUTCOME_OK`, exit 0.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 6: Commit**

```bash
git add src/lib/afx/inviteFunnel.ts test_invite_outcome.mts
git commit -m "feat(afx): pure invite-outcome classifier"
```

---

### Task 4: Invite data layer (create + revoke)

**Files:**
- Modify: `src/lib/afx/server/staffInvites.ts` (append `InviteResult`, `createInvite`, `revokeInvite` + imports)

**Interfaces:**
- Consumes: `afxAdmin`, `resolveStaff` (already imported in the file); `validateEmail` from `@/lib/afx/staffAdminGuards`; `inviteOutcome` from `@/lib/afx/inviteFunnel` (Task 3).
- Produces:
  - `type InviteResult = { ok: boolean; error?: string; note?: string }`
  - `createInvite(email: string): Promise<InviteResult>`
  - `revokeInvite(id: string): Promise<InviteResult>`

- [ ] **Step 1: Add imports**

At the top of `src/lib/afx/server/staffInvites.ts`, below the existing imports, add:

```ts
import { validateEmail } from '@/lib/afx/staffAdminGuards';
import { inviteOutcome } from '@/lib/afx/inviteFunnel';
```

(The file already imports `toInviteRow`, `sortInvites`, `type InviteRow`, `type RawInvite` from `@/lib/afx/inviteFunnel` — leave that line and add `inviteOutcome` to it OR add the separate import above; either compiles.)

- [ ] **Step 2: Append the write layer**

Append to `src/lib/afx/server/staffInvites.ts`:

```ts
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://film-resource-africa.com';

export type InviteResult = { ok: boolean; error?: string; note?: string };

/** Invite a producer by email: create the afx_invites row + email them the AFX
 *  login link. Any staff. Idempotent for an already-invited/redeemed email. */
export async function createInvite(email: string): Promise<InviteResult> {
  if (!(await resolveStaff())) return { ok: false, error: 'Not authorized' };
  const valid = validateEmail(email);
  if (!valid.ok) return valid;
  const addr = email.trim().toLowerCase();

  const { data: existingRows } = await afxAdmin.from('afx_invites').select('redeemed_at').ilike('email', addr).limit(1);
  const existing = (existingRows ?? [])[0] as { redeemed_at: string | null } | undefined;
  const outcome = inviteOutcome(existing ?? null);
  if (outcome === 'already_producer') return { ok: true, note: 'Already an AFX producer.' };
  if (outcome === 'already_invited') return { ok: true, note: 'Already invited.' };

  const { error: insErr } = await afxAdmin.from('afx_invites').insert({ email: addr });
  if (insErr) return { ok: false, error: 'Could not create the invite.' };

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'FRA System <hello@film-resource-africa.com>',
      to: addr,
      subject: "You're invited to AFX",
      html: `<p>You&apos;ve been invited to <strong>AFX</strong>, the Film Resource Africa finance layer for producers.</p>
<p>Sign in with <strong>this email address</strong> to get started:</p>
<p><a href="${SITE_URL}/afx/login" style="display:inline-block;padding:10px 18px;border-radius:9px;background:#1C1D21;color:#fff;text-decoration:none;font-weight:700">Sign in to AFX &rarr;</a></p>
<p style="color:#5E6066;font-size:13px">Or open ${SITE_URL}/afx/login and enter this email.</p>`,
      text: `You've been invited to AFX, the Film Resource Africa finance layer for producers.\n\nSign in with this email address at ${SITE_URL}/afx/login to get started.`,
    });
  } catch {
    return { ok: true, note: 'Invited, but the email failed to send — follow up manually.' };
  }
  return { ok: true };
}

/** Revoke a still-pending invite. Any staff. Activated invites are untouched. */
export async function revokeInvite(id: string): Promise<InviteResult> {
  if (!(await resolveStaff())) return { ok: false, error: 'Not authorized' };
  const { data, error } = await afxAdmin.from('afx_invites').delete().eq('id', id).is('redeemed_at', null).select('id');
  if (error) return { ok: false, error: 'Could not revoke the invite.' };
  if (!data || data.length === 0) return { ok: false, error: "Already activated — can't revoke." };
  return { ok: true };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean). If `resend` types error, confirm `resend` is a dependency (it is — used in `src/app/api/assess/intro/route.ts`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/server/staffInvites.ts
git commit -m "feat(afx): createInvite (+ Resend email) and revokeInvite data layer"
```

---

### Task 5: Server actions + interactive invite UI

**Files:**
- Create: `src/app/afx/staff/invites/actions.ts`
- Modify: `src/components/afx/staff/StaffInvites.tsx` (full replace — read-only → interactive)

**Interfaces:**
- Consumes: `createInvite`, `revokeInvite` from `@/lib/afx/server/staffInvites`; `type InviteRow` from `@/lib/afx/inviteFunnel`.
- Produces: `createInviteAction(email)`, `revokeInviteAction(id)`.

- [ ] **Step 1: Write the server actions**

Create `src/app/afx/staff/invites/actions.ts`:

```ts
'use server';

import { createInvite, revokeInvite } from '@/lib/afx/server/staffInvites';

export async function createInviteAction(email: string) { return createInvite(email); }
export async function revokeInviteAction(id: string) { return revokeInvite(id); }
```

- [ ] **Step 2: Replace the component with the interactive version**

Replace the full contents of `src/components/afx/staff/StaffInvites.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { InviteRow } from '@/lib/afx/inviteFunnel';
import { createInviteAction, revokeInviteAction } from '@/app/afx/staff/invites/actions';

const mono = 'var(--afx-mono)';

export default function StaffInvites({ rows }: { rows: InviteRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const pending = rows.filter((r) => r.status === 'pending').length;
  const activated = rows.length - pending;

  async function invite() {
    if (busy || !email.trim()) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const res = await createInviteAction(email);
      if (res.ok) { setNote(res.note ?? `Invited ${email.trim()}.`); setEmail(''); router.refresh(); }
      else setError(res.error ?? 'Could not invite.');
    } catch { setError('Could not invite — please try again.'); }
    finally { setBusy(false); }
  }

  async function revoke(id: string) {
    if (busy) return;
    setBusy(true); setError(null); setNote(null); setConfirmId(null);
    try {
      const res = await revokeInviteAction(id);
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Could not revoke.');
    } catch { setError('Could not revoke — please try again.'); }
    finally { setBusy(false); }
  }

  const cardStyle: React.CSSProperties = { border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
  const btn = (bg: string, bd: string, fg: string): React.CSSProperties => ({ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 15px', borderRadius: 8, border: `1px solid ${bd}`, background: bg, color: fg });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Producer invites</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Invite a producer</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="producer@example.com"
            onKeyDown={(e) => { if (e.key === 'Enter') invite(); }}
            style={{ flex: 1, fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid var(--afx-border)', borderRadius: 8, padding: '9px 11px' }} />
          <button disabled={busy} onClick={invite} style={btn('var(--afx-ink)', 'var(--afx-ink)', '#fff')}>Invite producer</button>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--afx-faint)' }}>They&apos;ll get an email with a link to the AFX login.</div>
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
              {isPending ? (
                confirmId === r.id ? (
                  <button disabled={busy} onClick={() => revoke(r.id)} style={btn('#fff', '#E3B6AE', '#7A2E2E')}>Confirm?</button>
                ) : (
                  <button disabled={busy} onClick={() => setConfirmId(r.id)} style={btn('#fff', 'var(--afx-border)', 'var(--afx-muted)')}>Revoke</button>
                )
              ) : null}
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

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 4: Production build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/afx/staff/invites/actions.ts src/components/afx/staff/StaffInvites.tsx
git commit -m "feat(afx): invite-a-producer form + revoke-pending on the funnel"
```

---

### Task 6: Phase-B live gate

Validate the invite DB mechanics against prod: insert an invite, the unique-email constraint, `revokeInvite`'s pending-only delete (removes pending, spares redeemed), and RLS. The Resend email path is NOT exercised here (would email a real address) — it is verified by hand in the browser after deploy. The pure `inviteOutcome` is covered by Task 3.

**Precondition:** Pause and ask the USER to confirm prod is reachable via `.env.local` and that this script creates/deletes disposable auth users + `afx_invites` rows and cleans up. Proceed only after confirmation.

**Files:**
- Create: `live_gate_invite_write.mts` (repo root, temporary — deleted at the end)
- Delete: `test_invite_outcome.mts` (from Task 3)

- [ ] **Step 1: Write the live gate script**

Create `live_gate_invite_write.mts` (repo root):

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });   // AFX secrets live in .env.local, not .env
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const stamp = process.argv[2] ?? 'x';
const pendingEmail = `afx-invw-pending-${stamp}@example.com`;
const redeemedEmail = `afx-invw-redeemed-${stamp}@example.com`;
let redeemedUid = '';

try {
  // (1) Insert a pending invite.
  const ins = await admin.from('afx_invites').insert({ email: pendingEmail });
  assert.ok(!ins.error, `insert pending: ${ins.error?.message}`);

  // (2) Duplicate email hits the unique constraint.
  const dup = await admin.from('afx_invites').insert({ email: pendingEmail });
  assert.ok(dup.error, 'duplicate email must violate the unique constraint');

  // (3) Redeemed invite (a producer already activated): create a user, redeemed row.
  const u = await admin.auth.admin.createUser({ email: redeemedEmail, email_confirm: true });
  assert.ok(!u.error, `createUser: ${u.error?.message}`);
  redeemedUid = u.data.user!.id;
  const ri = await admin.from('afx_invites').insert({ email: redeemedEmail, redeemed_at: new Date().toISOString(), redeemed_by: redeemedUid });
  assert.ok(!ri.error, `insert redeemed: ${ri.error?.message}`);

  // (4) revokeInvite semantics: delete where redeemed_at is null.
  //     Pending row deletes (1 row); redeemed row is spared (0 rows).
  const pendRow = await admin.from('afx_invites').select('id').eq('email', pendingEmail).maybeSingle<{ id: string }>();
  const redRow = await admin.from('afx_invites').select('id').eq('email', redeemedEmail).maybeSingle<{ id: string }>();
  assert.ok(pendRow.data && redRow.data, 'both rows present before revoke');

  const revPend = await admin.from('afx_invites').delete().eq('id', pendRow.data!.id).is('redeemed_at', null).select('id');
  assert.equal((revPend.data ?? []).length, 1, 'pending invite revoked');

  const revRed = await admin.from('afx_invites').delete().eq('id', redRow.data!.id).is('redeemed_at', null).select('id');
  assert.equal((revRed.data ?? []).length, 0, 'redeemed invite is NOT revoked by the pending-only delete');

  // (5) afx_invites is NOT readable by a user JWT (RLS).
  const asUser = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  // (no session — anon client) confirm the anon role cannot read the table
  const leaked = await asUser.from('afx_invites').select('id');
  assert.equal((leaked.data ?? []).length, 0, 'afx_invites NOT client-readable');

  console.log('LIVE_OK');
} finally {
  await admin.from('afx_invites').delete().in('email', [pendingEmail, redeemedEmail]);
  if (redeemedUid) await admin.auth.admin.deleteUser(redeemedUid);
}
```

- [ ] **Step 2: Run the live gate**

Run: `npx tsx live_gate_invite_write.mts run-$(date +%s)`
Expected: prints `LIVE_OK`. On an assertion error: STOP, do NOT delete the script, report BLOCKED with the failing assertion.

- [ ] **Step 3: Remove the temporary scripts**

```bash
rm test_invite_outcome.mts live_gate_invite_write.mts
```

- [ ] **Step 4: Confirm clean tree & type-check**

Run: `git status --porcelain && npx tsc --noEmit -p tsconfig.json`
Expected: no stray `.mts` files; tsc clean.

- [ ] **Step 5: Commit the test-file deletion**

`test_invite_outcome.mts` was committed in Task 3, so this records its removal (`live_gate_invite_write.mts` was never committed). Stage ONLY that deletion — the working tree has unrelated pre-existing dirty files (`scan_opportunities.mjs`, newsletter/insert `.mjs`/`.html`, `supabase/*`); do NOT stage them.

```bash
git rm test_invite_outcome.mts
git commit -m "chore(afx): remove temporary invite-outcome test script"
```

---

## Post-Phase-B manual verification (controller, after deploy)

From `/afx/staff/invites` on prod, invite a **test address you control** → confirm the email arrives and its CTA opens `/afx/login`; enter that address → "Check your inbox". Then revoke a pending invite and confirm it disappears. (This is the only path that sends a real email, so it is verified by hand, not in the live gate.)

---

## Self-Review

- **Spec coverage:** `/api/afx/invite-check` (any-email → invited) → Task 1; `/afx/login` page (invited→magic link, not-invited→request access, sent state) → Task 2; producer redirect flip → Task 2; `inviteOutcome` classifier → Task 3; `createInvite` (validate, classify, insert, Resend email, partial-failure note) + `revokeInvite` (pending-only) → Task 4; server actions + interactive UI (invite form + revoke two-click confirm) → Task 5; live DB verification → Task 6; enumeration (clear message) → Task 2 not-invited state; any-staff gate → Tasks 1/4; no migration, magic-link + callback reuse, Resend pattern, base-URL fallback → honored. All spec sections mapped.
- **Placeholder scan:** none — every code step is complete; the only `${...}` are live-script / email template literals.
- **Type consistency:** `InviteResult` defined in Task 4, returned by actions in Task 5, consumed by the UI (`res.ok`/`res.error`/`res.note`). `inviteOutcome(existing)` defined Task 3, called in Task 4 with `existing ?? null`. `validateEmail` returns `{ ok, error? }` (from staffAdminGuards) — assignable to `InviteResult`. `createInviteAction`/`revokeInviteAction` names match between Task 5 actions and the component. `/afx/login` `emailRedirectTo` uses `next=/afx/producer`, matching the callback's non-member passthrough.
