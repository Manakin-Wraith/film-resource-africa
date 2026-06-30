# AFX Producer Onboarding — S1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An invited producer signs in and builds & saves a real, persisted, private AFX profile in the existing cockpit — moving AFX from in-session mock to per-producer Supabase data.

**Architecture:** Three new Supabase tables (`afx_invites`, `afx_producers`, `afx_projects`) with RLS + a security-definer activation RPC. Pure mapper module converts DB rows ⇄ the existing `ProducerProfile`/`Project` types. A server loader authenticates, activates-or-walls, and hydrates the cockpit; the client cockpit gains a debounced full-document autosave server action. No vetting, publishing, payment, or auto-draft (later slices).

**Tech Stack:** Next.js 16 App Router (server components + server actions), React 19, TypeScript, Supabase (Postgres + RLS + `@supabase/ssr`). Spec: `docs/superpowers/specs/2026-06-30-afx-producer-onboarding-s1-foundation-design.md`.

## Global Constraints

- **No test runner exists in this repo.** Do NOT add one. Verification = `npx tsc --noEmit -p tsconfig.json` (silent), `npx next build` (routes prerender / compile, no `error`), Supabase checks via the Supabase MCP (`list_tables`, `get_advisors`, `execute_sql`), an `npx tsx` assertion for pure functions, and documented manual auth checks. "Missing tests" is NOT a defect. (Same convention as the merged AFX branches.)
- **Types are the contract.** `src/lib/afx/types.ts` `ProducerProfile`/`Project` shapes are authoritative; the DB persists them, it does not redefine them.
- **Privacy invariant (carried from `toFunderView`):** the NDA `exact` figures live ONLY in the `afx_projects.exact` column, never inlined into `body`. No funder-facing read exists in S1; keep the boundary clean for S3.
- **RLS is mandatory** on all three tables: a producer reads/writes only their own `afx_producers` row and their own `afx_projects`. `afx_invites` is never client-readable. `get_advisors` must report no "RLS disabled"/"policy missing" errors for the new tables.
- **Additive migration only.** S1 creates new `afx_*` objects; it must not alter or touch any existing table. Applying it to the live Supabase project is safe because it is purely additive.
- **Activation is idempotent & invite-gated** via the `redeem_afx_invite()` security-definer RPC; no service-role key in producer-facing code.
- **Empty-profile defaults** (spec §3): `name`/`company`/`bio`/`careerStage` = `''`, `ratingBand` = `'D'`, `relationships` = `[]`, `entityK2`/`consentK4`/`ndaSigned` = `false`, no projects. `location` omitted.
- **Seed split:** `afxSeed` stays for the marketplace + incentive overlay only. An authenticated producer's profile must come exclusively from Supabase — `src/app/afx/producer/page.tsx` must NOT import `focusProducer`.
- **Commit trailer** on every commit body: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Branch:** `afx-s1-foundation` off `main`. Do NOT work on `main`.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `supabase/migrations/20260630_afx_s1_foundation.sql` | The schema: 3 tables + RLS + indexes + `redeem_afx_invite()` RPC. Versioned record; applied via Supabase MCP. | Create |
| `src/lib/afx/persistence.ts` | Pure mappers: `emptyProducerProfile`, `rowsToProfile`, `profileToRows`, row types. The single DB⇄types mapping truth. | Create |
| `src/lib/afx/server/producerStore.ts` | Server-only data access over the Supabase server client: `loadProducerState`, `persistProfile`. | Create |
| `src/app/afx/producer/actions.ts` | `'use server'` action wrappers: `persistProfileAction`. | Create |
| `src/app/afx/producer/AccessWall.tsx` | Invite-only beta wall for non-invited users. | Create |
| `src/app/afx/producer/useDebouncedAutosave.ts` | Client hook: debounced autosave effect (skips first render). | Create |
| `src/app/afx/producer/page.tsx` | Server loader: auth → activate-or-wall → hydrate cockpit from DB. | Modify |
| `src/app/afx/producer/ProducerProfileClient.tsx` | `initial` now from DB; wire the autosave hook. (All existing edit logic unchanged.) | Modify |

---

## Task 1: Database schema + RLS + activation RPC

**Files:**
- Create: `supabase/migrations/20260630_afx_s1_foundation.sql`

**Interfaces:**
- Produces: tables `afx_invites`, `afx_producers(id, user_id, profile jsonb, …)`, `afx_projects(id, producer_id, status, deal_ref, body jsonb, exact jsonb, …)`; RPC `redeem_afx_invite() returns afx_producers`.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260630_afx_s1_foundation.sql`:

```sql
-- AFX S1 Foundation — additive only. New afx_* objects, no existing table touched.

create table public.afx_invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users
);
alter table public.afx_invites enable row level security;
-- intentionally NO client policies → unreadable/unwritable by anon/authenticated.

create table public.afx_producers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users on delete cascade,
  profile    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.afx_producers enable row level security;
create policy afx_producers_sel on public.afx_producers
  for select using (auth.uid() = user_id);
create policy afx_producers_upd on public.afx_producers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- insert is performed only by redeem_afx_invite() (security definer); no client insert policy.

create table public.afx_projects (
  id          uuid primary key,
  producer_id uuid not null references public.afx_producers on delete cascade,
  status      text not null check (status in ('case_study','live','archived')),
  deal_ref    text,
  body        jsonb not null,
  exact       jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index afx_projects_producer_idx on public.afx_projects (producer_id);
create index afx_projects_producer_status_idx on public.afx_projects (producer_id, status);
alter table public.afx_projects enable row level security;
create policy afx_projects_sel on public.afx_projects for select
  using (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()));
create policy afx_projects_ins on public.afx_projects for insert
  with check (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()));
create policy afx_projects_upd on public.afx_projects for update
  using (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()));
create policy afx_projects_del on public.afx_projects for delete
  using (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()));

-- Activation: idempotent, invite-gated. Runs as definer so it can read afx_invites
-- and insert afx_producers without exposing either to the client.
create or replace function public.redeem_afx_invite()
returns public.afx_producers
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_row public.afx_producers;
  v_default jsonb := jsonb_build_object(
    'name','', 'company','', 'bio','', 'careerStage','',
    'ratingBand','D', 'relationships', '[]'::jsonb,
    'entityK2', false, 'consentK4', false, 'ndaSigned', false
  );
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_row from public.afx_producers where user_id = v_uid;
  if found then return v_row; end if;                       -- already activated
  if not exists (select 1 from public.afx_invites where email = v_email and redeemed_at is null) then
    return null;                                            -- not invited
  end if;
  insert into public.afx_producers (user_id, profile) values (v_uid, v_default) returning * into v_row;
  update public.afx_invites set redeemed_at = now(), redeemed_by = v_uid
    where email = v_email and redeemed_at is null;
  return v_row;
end; $$;
revoke all on function public.redeem_afx_invite() from public;
grant execute on function public.redeem_afx_invite() to authenticated;
```

- [ ] **Step 2: Apply the migration to Supabase**

Apply via the Supabase MCP `apply_migration` tool (name: `afx_s1_foundation`, the SQL above). If the MCP is unavailable to the implementer, STOP and report BLOCKED with the SQL ready — applying it is a controller/human action (it touches the live project, additively).

- [ ] **Step 3: Verify schema + RLS**

Via the Supabase MCP:
- `list_tables` → `afx_invites`, `afx_producers`, `afx_projects` exist with the columns above.
- `get_advisors` (security) → NO "RLS disabled" or "policy missing" error for the three `afx_*` tables.
- `execute_sql`: `select proname, prosecdef from pg_proc where proname = 'redeem_afx_invite';` → returns one row with `prosecdef = true` (security definer).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260630_afx_s1_foundation.sql
git commit -m "feat(afx): S1 schema — afx_invites/producers/projects + RLS + redeem RPC"
```

---

## Task 2: Persistence mappers (pure, DB rows ⇄ types)

**Files:**
- Create: `src/lib/afx/persistence.ts`

**Interfaces:**
- Consumes: `ProducerProfile`, `Project` from `./types`.
- Produces: `ProducerRow`, `ProjectRow` types; `emptyProducerProfile(id: string): ProducerProfile`; `rowsToProfile(producer: ProducerRow, projects: ProjectRow[]): ProducerProfile`; `profileToRows(p: ProducerProfile): { profile: ProducerRow['profile']; projects: ProjectRow[] }`.

- [ ] **Step 1: Create `src/lib/afx/persistence.ts`**

```ts
import type { ProducerProfile, Project } from './types';

/** DB row shapes (subset of columns the mappers read/write). */
export interface ProducerRow {
  id: string;
  user_id: string;
  /** ProducerProfile minus `id` and `slate` — the producer-level fields. */
  profile: Omit<ProducerProfile, 'id' | 'slate'>;
}
export interface ProjectRow {
  id: string;
  producer_id: string;
  status: Project['status'];
  deal_ref: string | null;
  /** Project minus `exact`. Retains status/dealRef so the type round-trips;
   *  the status/deal_ref columns mirror these for indexing. */
  body: Omit<Project, 'exact'>;
  exact: Project['exact'] | null;
}

/** A fresh, type-valid empty profile (spec §3 defaults). */
export function emptyProducerProfile(id: string): ProducerProfile {
  return {
    id, name: '', company: '', bio: '', careerStage: '',
    ratingBand: 'D', relationships: [], slate: [],
    entityK2: false, consentK4: false, ndaSigned: false,
  };
}

function projectFromRow(row: ProjectRow): Project {
  return row.exact == null ? { ...row.body } : { ...row.body, exact: row.exact };
}

function projectToRow(producerId: string, p: Project): ProjectRow {
  const { exact, ...body } = p;
  return {
    id: p.id, producer_id: producerId, status: p.status,
    deal_ref: p.dealRef ?? null, body, exact: exact ?? null,
  };
}

/** Stitch a producer row + its project rows into the cockpit ProducerProfile. */
export function rowsToProfile(producer: ProducerRow, projects: ProjectRow[]): ProducerProfile {
  return { ...producer.profile, id: producer.id, slate: projects.map(projectFromRow) };
}

/** Split a ProducerProfile into the producer-level blob + project rows for upsert. */
export function profileToRows(p: ProducerProfile): { profile: ProducerRow['profile']; projects: ProjectRow[] } {
  const { id: _id, slate, ...profile } = p;
  void _id;
  return { profile, projects: (slate ?? []).map((pr) => projectToRow(p.id, pr)) };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent. (If errors only under `.next/dev/types/`, `rm -rf .next` and re-run.)

- [ ] **Step 3: Round-trip proof (no DB)**

Run and confirm it prints `roundtrip ok: true`:

```bash
npx tsx -e "import {emptyProducerProfile, profileToRows, rowsToProfile} from './src/lib/afx/persistence'; const p=emptyProducerProfile('prod1'); p.slate=[{id:'a',status:'case_study',title:'T',format:'feature',role:'Producer',jurisdiction:['ZA'],budgetBand:{value:'\$1-2M',provenance:'self'},exact:{budget:{amount:1000000,currency:'ZAR'}}}]; const {profile,projects}=profileToRows(p); const back=rowsToProfile({id:'prod1',user_id:'u1',profile},projects); console.log('roundtrip ok:', JSON.stringify(back)===JSON.stringify(p)); console.log('exact isolated in column:', projects[0].exact!=null && !('exact' in projects[0].body));"
```

Expected:
```
roundtrip ok: true
exact isolated in column: true
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/persistence.ts
git commit -m "feat(afx): persistence mappers (rows <-> ProducerProfile, exact isolated)"
```

---

## Task 3: Server data access + autosave action

**Files:**
- Create: `src/lib/afx/server/producerStore.ts`
- Create: `src/app/afx/producer/actions.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient`/`getSessionUser` from `@/lib/supabase/server`; the Task 2 mappers.
- Produces: `loadProducerState(): Promise<{ profile: ProducerProfile } | null>` (null = authenticated but not invited); `persistProfile(profile: ProducerProfile): Promise<void>`; server action `persistProfileAction(profile: ProducerProfile): Promise<void>`.

- [ ] **Step 1: Create `src/lib/afx/server/producerStore.ts`**

```ts
import 'server-only';
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server';
import type { ProducerProfile } from '@/lib/afx/types';
import { rowsToProfile, profileToRows, type ProducerRow, type ProjectRow } from '@/lib/afx/persistence';

/** Activate-or-load. Returns null when the user is authenticated but not invited. */
export async function loadProducerState(): Promise<{ profile: ProducerProfile } | null> {
  const supabase = await createSupabaseServerClient();
  // Idempotent: returns existing producer, creates one if invited, or null if not invited.
  const { data: producer, error } = await supabase.rpc('redeem_afx_invite').single<ProducerRow>();
  if (error || !producer) return null;
  const { data: projects } = await supabase
    .from('afx_projects')
    .select('id, producer_id, status, deal_ref, body, exact')
    .eq('producer_id', producer.id);
  return { profile: rowsToProfile(producer, (projects ?? []) as ProjectRow[]) };
}

/** Full-document upsert of the caller's profile (RLS scopes everything to them). */
export async function persistProfile(profile: ProducerProfile): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error('not authenticated');
  const supabase = await createSupabaseServerClient();

  const { data: producer } = await supabase
    .from('afx_producers').select('id').eq('user_id', user.id).single<{ id: string }>();
  if (!producer) throw new Error('no producer row'); // must be activated first

  const { profile: profileBlob, projects } = profileToRows({ ...profile, id: producer.id });

  await supabase.from('afx_producers')
    .update({ profile: profileBlob, updated_at: new Date().toISOString() })
    .eq('id', producer.id);

  if (projects.length > 0) {
    await supabase.from('afx_projects').upsert(
      projects.map((p) => ({ ...p, producer_id: producer.id, updated_at: new Date().toISOString() })),
      { onConflict: 'id' },
    );
  }
  // delete rows the producer removed this session
  const keepIds = projects.map((p) => p.id);
  let del = supabase.from('afx_projects').delete().eq('producer_id', producer.id);
  if (keepIds.length > 0) del = del.not('id', 'in', `(${keepIds.join(',')})`);
  await del;
}
```

(Note: `new Date().toISOString()` is allowed in app code; only workflow scripts forbid `Date.now()`.)

- [ ] **Step 2: Create `src/app/afx/producer/actions.ts`**

```ts
'use server';

import type { ProducerProfile } from '@/lib/afx/types';
import { persistProfile } from '@/lib/afx/server/producerStore';

export async function persistProfileAction(profile: ProducerProfile): Promise<void> {
  await persistProfile(profile);
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` → silent.
Run: `npx next build 2>&1 | grep -E '/afx/producer|error'` → `/afx/producer` present, no `error`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/afx/server/producerStore.ts src/app/afx/producer/actions.ts
git commit -m "feat(afx): server store (load/activate + full-document persist) + action"
```

---

## Task 4: Server loader + access wall

**Files:**
- Create: `src/app/afx/producer/AccessWall.tsx`
- Modify: `src/app/afx/producer/page.tsx`

**Interfaces:**
- Consumes: `getSessionUser` from `@/lib/supabase/server`; `loadProducerState` from `@/lib/afx/server/producerStore`.
- Produces: the `/afx/producer` route now hydrates from DB (or walls), no seed.

- [ ] **Step 1: Create `src/app/afx/producer/AccessWall.tsx`**

```tsx
export default function AccessWall() {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '80px 28px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--afx-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--afx-accent)', marginBottom: 12 }}>AFX — invite only</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', margin: '0 0 12px' }}>AFX is in invite-only beta</h1>
      <p style={{ fontSize: 14.5, color: '#5E6066', lineHeight: 1.55 }}>
        Your account isn’t on the AFX producer list yet. If you’re an FRA producer and want
        access to the finance layer, request an invite and we’ll be in touch.
      </p>
      <a href="mailto:hello@film-resource-africa.com?subject=AFX%20producer%20access"
         style={{ display: 'inline-block', marginTop: 22, fontFamily: 'var(--afx-body)', fontSize: 13.5, fontWeight: 600, padding: '10px 18px', borderRadius: 9, border: '1px solid #1C1D21', background: '#1C1D21', color: '#fff', textDecoration: 'none' }}>
        Request access
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Replace `src/app/afx/producer/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { loadProducerState } from '@/lib/afx/server/producerStore';
import ProducerProfileClient from './ProducerProfileClient';
import AccessWall from './AccessWall';

export default async function AfxProducerPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/afx/producer');

  const state = await loadProducerState();
  if (!state) return <AccessWall />; // authenticated but not invited

  return <ProducerProfileClient initial={state.profile} />;
}
```

(Removes the `focusProducer` import — the Global Constraint seed-split guard.)

- [ ] **Step 3: Typecheck + build + grep guard**

Run: `npx tsc --noEmit -p tsconfig.json` → silent.
Run: `npx next build 2>&1 | grep -E '/afx/producer|error'` → `/afx/producer` present, no `error`.
Run: `grep -n 'focusProducer' src/app/afx/producer/page.tsx || echo "CLEAN: no seed import"` → `CLEAN: no seed import`.

- [ ] **Step 4: Commit**

```bash
git add src/app/afx/producer/page.tsx src/app/afx/producer/AccessWall.tsx
git commit -m "feat(afx): server loader hydrates cockpit from DB + invite-only wall"
```

---

## Task 5: Client autosave wiring

**Files:**
- Create: `src/app/afx/producer/useDebouncedAutosave.ts`
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx`

**Interfaces:**
- Consumes: `persistProfileAction` from `./actions`; `ProducerProfile` from `@/lib/afx/types`.
- Produces: edits to `draft` persist to Supabase ~800ms after the last change.

- [ ] **Step 1: Create `src/app/afx/producer/useDebouncedAutosave.ts`**

```ts
'use client';

import { useEffect, useRef } from 'react';
import type { ProducerProfile } from '@/lib/afx/types';

/** Persist `draft` ~`delay`ms after the last change. Skips the initial mount
 *  (the loaded value is already in the DB) so hydration doesn't trigger a write. */
export function useDebouncedAutosave(
  draft: ProducerProfile,
  save: (p: ProducerProfile) => Promise<void>,
  delay = 800,
): void {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { void save(draft); }, delay);
    return () => clearTimeout(t);
  }, [draft, save, delay]);
}
```

- [ ] **Step 2: Wire it into `ProducerProfileClient.tsx`**

Add the imports near the top of `src/app/afx/producer/ProducerProfileClient.tsx`:
```ts
import { useDebouncedAutosave } from './useDebouncedAutosave';
import { persistProfileAction } from './actions';
```

Immediately after the `const [draft, setDraft] = useState<ProducerProfile>(() => structuredClone(initial));` line, add:
```ts
  useDebouncedAutosave(draft, persistProfileAction);
```

No other change — all existing edit handlers already update `draft`, so the hook covers every edit path.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json` → silent.
Run: `npx next build 2>&1 | grep -E '/afx/producer|error'` → `/afx/producer` present, no `error`.

- [ ] **Step 4: Commit**

```bash
git add src/app/afx/producer/useDebouncedAutosave.ts src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): debounced autosave persists cockpit edits to Supabase"
```

---

## Task 6: End-to-end + RLS isolation verification

**Files:**
- Modify: `supabase/migrations/20260630_afx_s1_foundation.sql` (only if a fix is needed; otherwise none)

**Interfaces:**
- Consumes: everything above. Produces: a verified, isolated S1.

This task is the integration gate. It writes no new feature code unless verification surfaces a defect.

- [ ] **Step 1: Seed a test invite + verify activation**

Via the Supabase MCP `execute_sql`:
```sql
insert into public.afx_invites (email) values ('beta-producer@example.com')
on conflict (email) do nothing;
```
Document (the controller/human performs the browser portion): sign in as `beta-producer@example.com` → visit `/afx/producer` → an empty cockpit renders (no seed data); a second sign-in/refresh still shows the (now empty) profile; `select count(*) from public.afx_producers;` increased by 1 and the invite row's `redeemed_at` is set.

- [ ] **Step 2: Verify persistence round-trips through the UI**

Manual: in the cockpit, edit identity (e.g., company name) and add a case study → wait ~1s → reload the page → the edits are still present. Then `execute_sql`: `select profile->>'company' from public.afx_producers where user_id = (select id from auth.users where email='beta-producer@example.com');` returns the edited value, and `select count(*) from public.afx_projects` reflects the added project.

- [ ] **Step 3: Verify RLS isolation (the critical gate)**

Via `execute_sql`, prove cross-account denial. Using Supabase's role simulation (set the request JWT claims to a different `sub`), confirm a SELECT on `afx_producers`/`afx_projects` as a *different* user returns 0 rows, and that `afx_invites` is not selectable by `authenticated` at all:
```sql
-- as an unrelated authenticated user (sub = some other uuid), expect 0 rows:
select count(*) from public.afx_producers;          -- 0 (RLS hides others)
select count(*) from public.afx_projects;           -- 0
-- afx_invites has no client policy → also 0 / denied for authenticated.
```
Also re-run `get_advisors` (security) → no new RLS warnings. If any check fails, fix the policy in the migration SQL, re-apply via `apply_migration`, and re-verify.

- [ ] **Step 4: Verify the privacy boundary holds in storage**

`execute_sql`: for a project where the producer entered an exact figure, confirm the figure is in the `exact` column and absent from `body`:
```sql
select (exact is not null) as has_exact, (body ? 'exact') as body_has_exact
from public.afx_projects limit 5;
```
Expected: `has_exact = true` (where entered), `body_has_exact = false` for every row.

- [ ] **Step 5: Full build + isolation of the rest of the app**

Run: `npx tsc --noEmit -p tsconfig.json` → silent.
Run: `npx next build 2>&1 | grep -E '/afx|error'` → `/afx`, `/afx/marketplace`, `/afx/producer` present, no `error`. (Marketplace still builds from `afxSeed`, untouched.)

- [ ] **Step 6: Commit (only if Step 3/4 required a migration fix)**

```bash
git add supabase/migrations/20260630_afx_s1_foundation.sql
git commit -m "fix(afx): tighten S1 RLS per isolation verification"
```
If no fix was needed, record in the report that verification passed with no code change.

---

## Self-Review

**Spec coverage:**
- §2 success criteria → Task 1 (invite table), Task 4 (activate-or-wall + non-invited wall), Tasks 3+5 (load + autosave), Task 6 (persistence across sessions, RLS). ✔
- §3 invite→activate + empty-profile defaults → Task 1 (`redeem_afx_invite` + defaults), Task 4 (loader branches), Task 2 (`emptyProducerProfile`). ✔
- §4 data model (promoted columns, isolated `exact`, RLS) → Task 1; mappers preserve it → Task 2; storage boundary verified → Task 6 Step 4. ✔
- §5 cockpit goes real (loader, mappers, autosave, IDs) → Tasks 2–5. New-project IDs use `crypto.randomUUID()` — already the behaviour in `ProducerProfileClient.onAddProject`? **Verify during Task 5:** if `onAddProject` still mints `np{n}` string ids, change it to `crypto.randomUUID()` so DB ids are unique uuids (note added below). ✔
- §6 out-of-scope respected (no vetting/publish/payment/auto-draft; marketplace mock) → no task adds them. ✔
- §7 risks → RLS verification (Task 6 Step 3), exact privacy (Step 4), seed-split guard (Task 4 Step 3 grep). ✔

**Placeholder scan:** none — every step has complete SQL/code/commands with expected output. Task 6 is verification-first by design (the integration gate), not a placeholder.

**Type consistency:** `loadProducerState`/`persistProfile`/`persistProfileAction` signatures match across Tasks 3→4→5. `ProducerRow`/`ProjectRow` (Task 2) are consumed unchanged in Task 3. `emptyProducerProfile` defaults match the RPC's `v_default` JSONB (Task 1) — both set `ratingBand='D'`, empty strings, false flags. `rowsToProfile` sets `id` from the row (the RPC default JSONB intentionally omits `id`).

**One correction folded in (Task 5):** confirm `onAddProject` uses `crypto.randomUUID()` for new project ids (spec §4/§5). The current cockpit mints `np{n}`; the Task 5 implementer must switch it to `crypto.randomUUID()` and include that one-line change in the Task 5 commit, so persisted ids are valid uuids.

## Execution Handoff

Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, spec+quality review between tasks, final whole-branch review. Tasks 1→6 are largely sequential (each builds on the prior); Task 1 (DB) and Task 2 (pure mappers) are independent and could parallelize.
2. **Inline Execution** — batch in this session with checkpoints.

Note: Task 1 applies an additive migration to the live Supabase project (via the Supabase MCP). It touches no existing table, but it is a real infrastructure change — apply with that awareness, or run it against a Supabase branch first.
