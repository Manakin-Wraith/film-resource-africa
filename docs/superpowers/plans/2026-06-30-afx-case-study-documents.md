# AFX Case-Study Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an NDA-signed producer upload categorized confidential documents (budget, chain of title, agreements, bond, audit) to a case study, stored privately and never exposed to funders.

**Architecture:** Files go to a new PRIVATE Supabase Storage bucket `afx-documents` via three server-only API routes that use the service-role key and resolve the producer from the session (never client-supplied). Document metadata persists in a new isolated `afx_projects.docs` JSONB column — parallel to `exact`, never in `body`, stripped from the funder view. The drawer gains an NDA-gated Documents section driven by a new `AfxDocumentUpload` client component.

**Tech Stack:** Next.js 16 App Router (route handlers), React 19, TypeScript, Supabase Storage + Postgres, AFX scoped CSS tokens. No test runner — verification is `npx tsc --noEmit`, `npx next build`, `npx tsx` assertions, and a live supabase-js script.

## Global Constraints

- **Private bucket `afx-documents` (`public = false`).** No client storage policies; ALL storage access is mediated server-side by the API routes using the service-role key. No client ever calls Supabase Storage directly.
- **`docs` isolation:** document metadata lives ONLY in the `afx_projects.docs` column, NEVER in `body`. The funder view strips BOTH `exact` and `docs`. This mirrors how `exact` is handled.
- **Security boundary is the producerId namespace.** The producer is resolved from `getSessionUser()` server-side — NEVER from a client-supplied value. Storage paths are `${producerId}/${caseStudyId}/${docId}.${ext}`. Sign/delete require the requested `path` to start with `${producerId}/`. (This keys on the producer namespace rather than requiring the case-study row to pre-exist, so uploads work on a not-yet-saved case study; the namespace is the real boundary.)
- **NDA gate:** upload requires `producer.profile.ndaSigned === true`, enforced in the upload route (not just the UI). The drawer's Documents section also only renders when `ndaSigned`.
- **Signed URLs are short-lived (60 seconds).** No public URL is ever generated for this bucket.
- **Allowed types:** `application/pdf`, `image/png`, `image/jpeg`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX), `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX). **Max size 25 MB.** Enforced server-side (authoritative) and mirrored client-side (pre-flight). (Spec §7 left DOCX/XLSX optional; included here because real budgets/agreements are commonly Excel/Word — it is a trivial allowlist addition.)
- **IDs via `crypto.randomUUID()`** for documents.
- **AFX visuals:** inline styles + `var(--afx-*)` tokens; the uploader is AFX-styled (light), NOT the dark members styling. Never touch Tailwind `@theme`.
- **Migration applied manually** via the Supabase Dashboard SQL editor (the connected MCP cannot reach the prod project), same as the S1 migrations.
- **No test runner.** Verify pure logic with `npx tsx`, components/routes with `npx tsc --noEmit -p tsconfig.json` (ignore errors ONLY under `.next/dev/types/`; if they appear, `rm -rf .next` and re-run) + `npx next build`, and storage/DB live with a supabase-js script.
- **Branch:** `afx-case-study-documents` (already created off `main`; the spec is committed there).

---

### Task 1: Data layer — types, constants, helpers, persistence, funder boundary + migration file

**Files:**
- Modify: `src/lib/afx/types.ts` (add `DocumentCategory`, `AfxDocument`, `Project.docs`)
- Create: `src/lib/afx/documents.ts` (shared doc constants + category labels)
- Modify: `src/lib/afx/caseStudy.ts` (add/update/remove document helpers)
- Modify: `src/lib/afx/persistence.ts` (route `docs` to its own column)
- Modify: `src/lib/afx/server/producerStore.ts` (select `docs`)
- Modify: `src/lib/afx/funderView.ts` (strip `docs` too)
- Create: `supabase/migrations/20260630_afx_documents.sql` (docs column + private bucket)

**Interfaces:**
- Consumes: `Project`, `Provenance` from `./types`; the existing `ProjectRow` shape.
- Produces:
  - Types: `DocumentCategory`, `AfxDocument`, `Project.docs?: AfxDocument[]`.
  - `src/lib/afx/documents.ts`: `DOCUMENT_CATEGORIES` (readonly tuple), `DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory,string>`, `ALLOWED_DOC_TYPES: string[]`, `MAX_DOC_BYTES: number`.
  - `caseStudy.ts`: `addDocument(s: Project, doc: AfxDocument): Project`; `updateDocument(s, id, patch: Partial<Pick<AfxDocument,'category'>>): Project`; `removeDocument(s, id): Project`.
  - `persistence.ts`: `ProjectRow` gains `docs: AfxDocument[] | null`; `body` becomes `Omit<Project,'exact'|'docs'>`.
  - `funderView.ts`: `FunderProject = Omit<Project,'exact'|'docs'>`.

- [ ] **Step 1: Add types to `src/lib/afx/types.ts`**

After the `EvidenceLink` interface (around line 182), add:

```ts
export type DocumentCategory =
  | 'budget' | 'chain_of_title' | 'financing_agreement'
  | 'distribution_agreement' | 'completion_bond' | 'audit' | 'other';

/** Confidential supporting document attached to a case study. Producer + FRA
 *  only — NEVER funder-visible. The file lives in the private `afx-documents`
 *  bucket; this is just the metadata, persisted in the isolated `docs` column. */
export interface AfxDocument {
  id: string;            // crypto.randomUUID()
  path: string;          // storage key: producerId/caseStudyId/docId.ext
  filename: string;      // original name, for display
  category: DocumentCategory;
  sizeBytes: number;
  contentType: string;
  uploadedAt: string;    // ISO timestamp
}
```

In the `Project` interface, add after `evidence?: EvidenceLink[];`:

```ts
  /** Confidential documents — isolated like `exact`; persisted in the `docs`
   *  column, NEVER in `body`, NEVER serialized to the funder view. */
  docs?: AfxDocument[];
```

- [ ] **Step 2: Create `src/lib/afx/documents.ts`**

```ts
import type { DocumentCategory } from './types';

export const DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  'budget', 'chain_of_title', 'financing_agreement',
  'distribution_agreement', 'completion_bond', 'audit', 'other',
] as const;

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  budget: 'Budget / cost report',
  chain_of_title: 'Chain of title',
  financing_agreement: 'Financing agreement',
  distribution_agreement: 'Distribution / sales agreement',
  completion_bond: 'Completion bond',
  audit: 'Audit',
  other: 'Other',
};

/** MIME allowlist — authoritative copy; the client mirrors it for pre-flight. */
export const ALLOWED_DOC_TYPES: readonly string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
] as const;

export const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25 MB
```

- [ ] **Step 3: Add document helpers to `src/lib/afx/caseStudy.ts`**

Extend the type import at the top of the file to include `AfxDocument`:

```ts
import type { Project, EvidenceLink, ExactMoney, ExactFigures, AfxDocument } from './types';
```

Append these helpers at the end of the file:

```ts
export function addDocument(s: Project, doc: AfxDocument): Project {
  return { ...s, docs: [...(s.docs ?? []), doc] };
}
export function updateDocument(s: Project, id: string, patch: Partial<Pick<AfxDocument, 'category'>>): Project {
  return { ...s, docs: (s.docs ?? []).map((d) => (d.id === id ? { ...d, ...patch } : d)) };
}
export function removeDocument(s: Project, id: string): Project {
  return { ...s, docs: (s.docs ?? []).filter((d) => d.id !== id) };
}
```

- [ ] **Step 4: Route `docs` to its own column in `src/lib/afx/persistence.ts`**

Replace the whole file with:

```ts
import type { ProducerProfile, Project, AfxDocument } from './types';

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
  /** Project minus the two isolated lanes (`exact`, `docs`). */
  body: Omit<Project, 'exact' | 'docs'>;
  exact: Project['exact'] | null;
  docs: AfxDocument[] | null;
}

function projectFromRow(row: ProjectRow): Project {
  const p: Project = { ...row.body };
  if (row.exact != null) p.exact = row.exact;
  if (row.docs != null) p.docs = row.docs;
  return p;
}

function projectToRow(producerId: string, p: Project): ProjectRow {
  const { exact, docs, ...body } = p;
  return {
    id: p.id, producer_id: producerId, status: p.status,
    deal_ref: p.dealRef ?? null, body, exact: exact ?? null, docs: docs ?? null,
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

- [ ] **Step 5: Select `docs` in `src/lib/afx/server/producerStore.ts`**

In `loadProducerState`, change the projects select line from:
```ts
    .select('id, producer_id, status, deal_ref, body, exact')
```
to:
```ts
    .select('id, producer_id, status, deal_ref, body, exact, docs')
```
(The `persistProfile` upsert needs no change — it spreads each `ProjectRow`, which now carries `docs`, into the upsert payload, so the `docs` column is written automatically.)

- [ ] **Step 6: Strip `docs` from the funder view in `src/lib/afx/funderView.ts`**

Replace the file with:

```ts
import type { ProducerProfile, Project } from './types';

/** A project as a funder may see it — the private `exact` and `docs` lanes are
 *  removed at the type level, so funder-facing code cannot even reference them. */
export type FunderProject = Omit<Project, 'exact' | 'docs'>;

/** The producer profile projected to the funder boundary: identical to
 *  `ProducerProfile` except every slate project is exact-/docs-stripped. */
export type FunderView = Omit<ProducerProfile, 'slate'> & { slate: FunderProject[] };

/** Remove the NDA-gated `exact` figures AND confidential `docs` from a single
 *  project (runtime + type). Shallow by design. */
export function stripExact(pr: Project): FunderProject {
  const clone = { ...pr };
  delete (clone as Partial<Project>).exact;
  delete (clone as Partial<Project>).docs;
  return clone as FunderProject;
}

/** Project a producer's cockpit `draft` into the funder-safe view. Returns a
 *  fresh object; never mutates `p`. This is THE funder boundary — exact figures
 *  and confidential documents do not exist past this function. */
export function toFunderView(p: ProducerProfile): FunderView {
  return { ...p, slate: p.slate.map(stripExact) };
}
```

- [ ] **Step 7: Create the migration file `supabase/migrations/20260630_afx_documents.sql`**

```sql
-- AFX confidential case-study documents — additive only.
-- New isolated `docs` column on afx_projects + a PRIVATE storage bucket.

alter table public.afx_projects add column if not exists docs jsonb;

-- Private bucket: public = false. No client storage policies — all access is
-- service-role-mediated through the /api/afx/documents/* routes.
insert into storage.buckets (id, name, public)
values ('afx-documents', 'afx-documents', false)
on conflict (id) do nothing;
```

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent (exit 0).

- [ ] **Step 9: Round-trip + funder-isolation assertion**

```bash
npx tsx -e "
import {addDocument, updateDocument, removeDocument} from './src/lib/afx/caseStudy';
import {profileToRows, rowsToProfile} from './src/lib/afx/persistence';
import {toFunderView} from './src/lib/afx/funderView';
const doc = { id:'d1', path:'prod1/cs1/d1.pdf', filename:'budget.pdf', category:'budget', sizeBytes:1234, contentType:'application/pdf', uploadedAt:'2026-06-30T00:00:00Z' };
let cs = { id:'cs1', status:'case_study', title:'T', format:'Feature', role:'Producer', jurisdiction:['ZA'], budgetBand:{value:'\$1-2M',provenance:'self'}, exact:{budget:{amount:1000000,currency:'ZAR'}} };
cs = addDocument(cs, doc);
console.log('addDocument:', cs.docs.length === 1 && cs.docs[0].category === 'budget');
cs = updateDocument(cs, 'd1', { category:'chain_of_title' });
console.log('updateDocument:', cs.docs[0].category === 'chain_of_title');
const p = { id:'prod1', name:'', company:'', bio:'', ratingBand:'D', careerStage:'', relationships:[], ndaSigned:true, entityK2:false, consentK4:false, slate:[cs] };
const { projects } = profileToRows(p);
console.log('docs in column, not body:', projects[0].docs != null && !('docs' in projects[0].body));
console.log('exact still isolated:', projects[0].exact != null && !('exact' in projects[0].body));
const back = rowsToProfile({ id:'prod1', user_id:'u1', profile: profileToRows(p).profile }, projects);
console.log('docs round-trip:', back.slate[0].docs.length === 1);
const fv = toFunderView(p);
console.log('funder view strips docs+exact:', !('docs' in fv.slate[0]) && !('exact' in fv.slate[0]));
const removed = removeDocument(cs, 'd1');
console.log('removeDocument:', (removed.docs ?? []).length === 0);
"
```
Expected output (all `true`):
```
addDocument: true
updateDocument: true
docs in column, not body: true
exact still isolated: true
docs round-trip: true
funder view strips docs+exact: true
removeDocument: true
```

- [ ] **Step 10: Commit**

```bash
git add src/lib/afx/types.ts src/lib/afx/documents.ts src/lib/afx/caseStudy.ts src/lib/afx/persistence.ts src/lib/afx/server/producerStore.ts src/lib/afx/funderView.ts supabase/migrations/20260630_afx_documents.sql
git commit -m "feat(afx): docs data layer — isolated docs column, funder strip, migration"
```

---

### Task 2: Server access helper + upload/sign/delete API routes

**Files:**
- Create: `src/lib/afx/server/documentAccess.ts` (session→producer resolver + admin client + bucket const)
- Create: `src/app/api/afx/documents/upload/route.ts`
- Create: `src/app/api/afx/documents/sign/route.ts`
- Create: `src/app/api/afx/documents/delete/route.ts`

**Interfaces:**
- Consumes: `getSessionUser` from `@/lib/supabase/server`; `ALLOWED_DOC_TYPES`, `MAX_DOC_BYTES`, `DOCUMENT_CATEGORIES` from `@/lib/afx/documents`; `AfxDocument`, `DocumentCategory` from `@/lib/afx/types`.
- Produces: `documentAccess.ts` exports `AFX_DOCS_BUCKET`, `afxAdmin` (service-role client), `resolveDocAccess(): Promise<{ producerId: string; ndaSigned: boolean } | null>`. Three POST route handlers.

- [ ] **Step 1: Create `src/lib/afx/server/documentAccess.ts`**

```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';

export const AFX_DOCS_BUCKET = 'afx-documents';

/** Service-role client — bypasses RLS; used ONLY behind explicit ownership checks. */
export const afxAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export interface DocAccess {
  producerId: string;
  ndaSigned: boolean;
}

/** Resolve the calling session's producer. The producerId comes from the
 *  authenticated session — never from client input — so it is the storage
 *  namespace boundary. Returns null when unauthenticated or not a producer. */
export async function resolveDocAccess(): Promise<DocAccess | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { data: producer } = await afxAdmin
    .from('afx_producers')
    .select('id, profile')
    .eq('user_id', user.id)
    .maybeSingle<{ id: string; profile: { ndaSigned?: boolean } }>();
  if (!producer) return null;
  return { producerId: producer.id, ndaSigned: !!producer.profile?.ndaSigned };
}
```

- [ ] **Step 2: Create `src/app/api/afx/documents/upload/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess } from '@/lib/afx/server/documentAccess';
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES, DOCUMENT_CATEGORIES } from '@/lib/afx/documents';
import type { AfxDocument, DocumentCategory } from '@/lib/afx/types';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const caseStudyId = form.get('caseStudyId') as string | null;
  const category = form.get('category') as string | null;

  if (!file || !caseStudyId || !category) {
    return NextResponse.json({ error: 'Missing file, caseStudyId or category' }, { status: 400 });
  }
  if (!(DOCUMENT_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!access.ndaSigned) return NextResponse.json({ error: 'NDA must be signed to upload documents' }, { status: 403 });

  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type (PDF, PNG, JPEG, DOCX, XLSX only)' }, { status: 400 });
  }
  if (file.size > MAX_DOC_BYTES) {
    return NextResponse.json({ error: 'File must be under 25 MB' }, { status: 400 });
  }

  const docId = crypto.randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${access.producerId}/${caseStudyId}/${docId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const doc: AfxDocument = {
    id: docId, path, filename: file.name, category: category as DocumentCategory,
    sizeBytes: file.size, contentType: file.type, uploadedAt: new Date().toISOString(),
  };
  return NextResponse.json({ doc });
}
```

- [ ] **Step 3: Create `src/app/api/afx/documents/sign/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess } from '@/lib/afx/server/documentAccess';

export async function POST(req: NextRequest) {
  const { path } = await req.json().catch(() => ({} as { path?: string }));
  if (typeof path !== 'string' || path === '') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  // Namespace boundary: a producer may only sign paths under their own id.
  if (!path.startsWith(`${access.producerId}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data, error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).createSignedUrl(path, 60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
```

- [ ] **Step 4: Create `src/app/api/afx/documents/delete/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess } from '@/lib/afx/server/documentAccess';

export async function POST(req: NextRequest) {
  const { path } = await req.json().catch(() => ({} as { path?: string }));
  if (typeof path !== 'string' || path === '') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!path.startsWith(`${access.producerId}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent (exit 0).

Run: `npx next build 2>&1 | grep -E 'api/afx/documents|error'`
Expected: the three routes appear (`/api/afx/documents/upload`, `/sign`, `/delete`) and NO line containing `error`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/afx/server/documentAccess.ts src/app/api/afx/documents/
git commit -m "feat(afx): document API routes — upload/sign/delete (service-role, NDA + namespace gated)"
```

---

### Task 3: AfxDocumentUpload client component + drawer Documents section

**Files:**
- Create: `src/components/afx/producer/AfxDocumentUpload.tsx`
- Modify: `src/components/afx/producer/CaseStudyDrawer.tsx` (add the NDA-gated Documents section)

**Interfaces:**
- Consumes: `AfxDocument`, `Project` from `@/lib/afx/types`; `DOCUMENT_CATEGORIES`, `DOCUMENT_CATEGORY_LABELS`, `ALLOWED_DOC_TYPES`, `MAX_DOC_BYTES` from `@/lib/afx/documents`; `addDocument`, `updateDocument`, `removeDocument` from `@/lib/afx/caseStudy`.
- Produces: `AfxDocumentUpload` (default export) with props `{ caseStudyId: string; docs: AfxDocument[]; onAdd: (doc: AfxDocument) => void; onUpdate: (id: string, patch: { category: DocumentCategory }) => void; onRemove: (id: string) => void }`.

- [ ] **Step 1: Create `src/components/afx/producer/AfxDocumentUpload.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import type { AfxDocument, DocumentCategory } from '@/lib/afx/types';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--afx-body)', fontSize: 13, color: '#1C1D21',
  border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none',
};

interface Props {
  caseStudyId: string;
  docs: AfxDocument[];
  onAdd: (doc: AfxDocument) => void;
  onUpdate: (id: string, patch: { category: DocumentCategory }) => void;
  onRemove: (id: string) => void;
}

function prettySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AfxDocumentUpload({ caseStudyId, docs, onAdd, onUpdate, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setError('');
    if (!ALLOWED_DOC_TYPES.includes(file.type)) { setError('Unsupported type (PDF, PNG, JPEG, DOCX, XLSX only)'); return; }
    if (file.size > MAX_DOC_BYTES) { setError(`File is ${prettySize(file.size)} — max is 25 MB`); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caseStudyId', caseStudyId);
      fd.append('category', 'other');
      const res = await fetch('/api/afx/documents/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? `Upload failed (${res.status})`);
      else onAdd(json.doc as AfxDocument);
    } catch (e) {
      setError(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — check your connection');
    } finally {
      setBusy(false);
    }
  }

  async function view(doc: AfxDocument) {
    try {
      const res = await fetch('/api/afx/documents/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: doc.path }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch {
      setError('Could not open document');
    }
  }

  async function remove(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: doc.path }),
      });
      if (res.ok) onRemove(doc.id);
      else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Could not remove document');
      }
    } catch {
      setError('Could not remove document');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {docs.map((d) => (
        <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>{prettySize(d.sizeBytes)}</div>
          </div>
          <select value={d.category} onChange={(e) => onUpdate(d.id, { category: e.target.value as DocumentCategory })} style={{ ...inputStyle, cursor: 'pointer', minWidth: 140 }}>
            {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{DOCUMENT_CATEGORY_LABELS[c]}</option>)}
          </select>
          <button onClick={() => view(d)} style={linkBtn}>View</button>
          <button onClick={() => remove(d)} aria-label="Remove document" style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, width: 30, height: 30, color: '#9A9CA3', fontSize: 15, lineHeight: 1 }}>×</button>
        </div>
      ))}

      <button onClick={() => inputRef.current?.click()} disabled={busy}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8, border: '1px solid #D6D8F5', background: '#fff', color: 'var(--afx-accent)' }}>
        {busy ? 'Uploading…' : '+ Upload document'}
      </button>
      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}

      <input ref={inputRef} type="file"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7,
  padding: '6px 10px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066',
};
```

- [ ] **Step 2: Add the Documents section to `src/components/afx/producer/CaseStudyDrawer.tsx`**

Add the import (after the existing imports, near line 17):

```ts
import AfxDocumentUpload from './AfxDocumentUpload';
import { addDocument, updateDocument, removeDocument } from '@/lib/afx/caseStudy';
```

Add the section inside the scrollable body, immediately AFTER the closing `</Field>` of the "Tagged evidence" block (after the evidence `Field` that ends near line 139, before the closing `</div>` of the scroll container at line 140):

```tsx
          {/* Confidential documents — NDA-gated */}
          <Field label="Confidential documents">
            {ndaSigned ? (
              <AfxDocumentUpload
                caseStudyId={study.id}
                docs={study.docs ?? []}
                onAdd={(doc) => setStudy((s) => addDocument(s, doc))}
                onUpdate={(id, patch) => setStudy((s) => updateDocument(s, id, patch))}
                onRemove={(id) => setStudy((s) => removeDocument(s, id))}
              />
            ) : (
              <div style={{ fontSize: 12.5, color: '#9A9CA3', border: '1px dashed #DAD7D0', borderRadius: 8, padding: '12px 14px' }}>
                Sign the FRA NDA to attach confidential documents (budget, chain of title, agreements).
              </div>
            )}
          </Field>
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: silent (exit 0).

Run: `npx next build 2>&1 | grep -E '/afx/producer|api/afx/documents|error'`
Expected: `/afx/producer` and the three document routes present, NO line containing `error`.

- [ ] **Step 4: Commit**

```bash
git add src/components/afx/producer/AfxDocumentUpload.tsx src/components/afx/producer/CaseStudyDrawer.tsx
git commit -m "feat(afx): drawer Documents section + AfxDocumentUpload (NDA-gated)"
```

---

### Task 4: End-to-end verification gate (migration applied first)

**Files:**
- None (verification only; no new feature code unless a defect surfaces).

**Interfaces:**
- Consumes: everything above. Produces: a verified, isolated documents slice.

**PRECONDITION:** the controller must have applied `supabase/migrations/20260630_afx_documents.sql` to the live project (Dashboard SQL editor) before this task runs — it needs the `docs` column and the `afx-documents` bucket to exist.

- [ ] **Step 1: Live DB isolation + storage privacy check**

This proves: (a) `docs` persists to its own column under a real RLS session and never lands in `body`; (b) the private bucket rejects unsigned public access but serves a signed URL; (c) cleanup. It mirrors the S1/Track-Record live scripts (service-role admin + a per-user JWT) and cleans up after itself.

```bash
cat > .docs_verify.mjs <<'EOF'
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const URL=env.NEXT_PUBLIC_SUPABASE_URL, ANON=env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE=env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(URL, SERVICE, { auth:{persistSession:false, autoRefreshToken:false} });
const EMAIL='afx-docs-test@example.com', PWD='Afx-Docs-Test-3318!';
const BUCKET='afx-documents';
async function findUser(email){let p=1;for(;;){const{data}=await admin.auth.admin.listUsers({page:p,perPage:200});const u=data.users.find(x=>(x.email||'').toLowerCase()===email.toLowerCase());if(u)return u;if(data.users.length<200)return null;p++;}}
let testPath=null;
async function cleanup(){const u=await findUser(EMAIL);if(u){await admin.from('afx_producers').delete().eq('user_id',u.id);await admin.auth.admin.deleteUser(u.id);}await admin.from('afx_invites').delete().ilike('email',EMAIL); if(testPath){await admin.storage.from(BUCKET).remove([testPath]).catch(()=>{});}}
let ok=false;
try{
  await cleanup();
  await admin.from('afx_invites').insert({email:EMAIL});
  await admin.auth.admin.createUser({email:EMAIL,password:PWD,email_confirm:true});
  const c=createClient(URL, ANON, {auth:{persistSession:false,autoRefreshToken:false}});
  await c.auth.signInWithPassword({email:EMAIL,password:PWD});
  const {data:prod}=await c.rpc('redeem_afx_invite').single();
  // (a) DB: persist a case study with a docs entry under RLS
  const projId=crypto.randomUUID(), docId=crypto.randomUUID();
  testPath=\`\${prod.id}/\${projId}/\${docId}.pdf\`;
  await c.from('afx_projects').insert({ id:projId, producer_id:prod.id, status:'case_study', deal_ref:null,
    body:{ id:projId, status:'case_study', title:'Doc Test', format:'Feature', role:'Producer', jurisdiction:['ZA'], budgetBand:{value:'\$1–2M',provenance:'self'} },
    exact:null,
    docs:[{ id:docId, path:testPath, filename:'budget.pdf', category:'budget', sizeBytes:1234, contentType:'application/pdf', uploadedAt:new Date().toISOString() }] });
  const {data:row}=await c.from('afx_projects').select('body, docs').eq('id',projId).single();
  console.log('docs column populated     :', Array.isArray(row.docs) && row.docs[0]?.category==='budget');
  console.log('body has NO docs key      :', !('docs' in row.body));
  // (b) Storage: upload via service-role to the private bucket, confirm not public, signed URL works
  const bytes = new Uint8Array([37,80,68,70]); // %PDF
  const up = await admin.storage.from(BUCKET).upload(testPath, bytes, { contentType:'application/pdf', upsert:true });
  console.log('storage upload ok         :', !up.error);
  const pub = admin.storage.from(BUCKET).getPublicUrl(testPath);
  const pubRes = await fetch(pub.data.publicUrl).then(r=>r.status).catch(()=>0);
  console.log('public fetch denied       :', pubRes===400 || pubRes===403 || pubRes===404);
  const signed = await admin.storage.from(BUCKET).createSignedUrl(testPath, 60);
  const sigRes = await fetch(signed.data.signedUrl).then(r=>r.status).catch(()=>0);
  console.log('signed URL fetch ok (200) :', sigRes===200);
  ok = Array.isArray(row.docs) && row.docs[0]?.category==='budget' && !('docs' in row.body) && !up.error && (pubRes===400||pubRes===403||pubRes===404) && sigRes===200;
}catch(e){console.error('ERROR:',e.message);}
finally{ try{await cleanup();console.log('cleanup done');}catch(e){console.error('cleanup err',e.message);} }
console.log(ok?'\n===== Documents isolation + privacy VERIFIED =====':'\n===== CHECK FAILED =====');
process.exit(ok?0:1);
EOF
node .docs_verify.mjs ; rm -f .docs_verify.mjs
```
Expected:
```
docs column populated     : true
body has NO docs key      : true
storage upload ok         : true
public fetch denied       : true
signed URL fetch ok (200) : true
cleanup done

===== Documents isolation + privacy VERIFIED =====
```

- [ ] **Step 2: Full build gate**

Run: `npx tsc --noEmit -p tsconfig.json` → exit 0.
Run: `npx next build 2>&1 | grep -E '/afx|api/afx/documents|error'` → `/afx`, `/afx/producer`, the three document routes present; no `error` lines.

- [ ] **Step 3: Record the result**

No code change if all checks pass — record in the report that the documents slice is verified isolated and private. If any check fails, the migration may not be applied or a mapper/route defect surfaced — fix and re-verify.

---

## Self-Review

**Spec coverage:**
- §2.1 NDA-gated Documents section → Task 3 (gated render). ✔
- §2.2 upload/category/view/remove → Task 2 (routes) + Task 3 (component). ✔
- §2.3 private bucket, server-mediated → Task 1 (migration) + Task 2 (routes, service-role). ✔
- §2.4 metadata in isolated column → Task 1 (persistence routing). ✔
- §2.5 funder view cannot expose docs → Task 1 (funderView strips docs; `FunderProject = Omit<...,'exact'|'docs'>`). ✔
- §2.6 upload enforces ownership + NDA server-side → Task 2 (`resolveDocAccess` + `ndaSigned` check). ✔
- §3 sign = 60s short-lived; delete; FRA service-role → Task 2. ✔
- §4 types + migration (docs column + bucket) → Task 1. ✔
- §6 drawer UX, NDA hint, AfxDocumentUpload → Task 3. ✔
- §7 validation (types/size, server authoritative) → Task 1 (constants) + Task 2 (route enforcement) + Task 3 (client pre-flight). ✔
- §8 orphan handling: explicit Remove deletes file → Task 2 (delete route) + Task 3 (remove calls it). Cancel-orphans accepted (no reconcile) — out of scope per spec. ✔

**Deviation from spec (conscious refinement, flagged for the final review):** the spec §3 wording has the upload route verify "the caseStudyId belongs to them" via the `afx_projects` row. This plan instead keys the security boundary on the **producerId namespace** resolved from the session (`resolveDocAccess` does not require the project row to pre-exist). Reason: a brand-new case study has no `afx_projects` row until Save, so requiring it would block uploads on unsaved studies. The producerId namespace (session-derived, never client-supplied; sign/delete enforce `path.startsWith(producerId + '/')`) is the real boundary and is equally strong. Net effect: uploads work pre-save; files always land in the producer's own namespace.

**Edge case tracked (not blocking):** Remove deletes the file immediately (spec §8). If a producer removes a doc then Cancels the drawer (discarding the buffer), the persisted study still lists that doc but the file is gone → View returns an error gracefully (the component surfaces "Could not open document"). Acceptable for beta; the reconcile/repair is out of scope.

**Placeholder scan:** none — every step has complete code or exact commands with expected output.

**Type consistency:** `AfxDocument`/`DocumentCategory` defined in Task 1, consumed in Tasks 2-3. `ProjectRow.docs` + `body: Omit<Project,'exact'|'docs'>` defined in Task 1, consumed by the loader/persist path. `resolveDocAccess`/`afxAdmin`/`AFX_DOCS_BUCKET` defined in Task 2, consumed by all three routes. `AfxDocumentUpload` props (`caseStudyId`, `docs`, `onAdd`, `onUpdate`, `onRemove`) defined in Task 3, supplied by the drawer. `addDocument`/`updateDocument`/`removeDocument` defined in Task 1, consumed in Task 3. `ALLOWED_DOC_TYPES`/`MAX_DOC_BYTES`/`DOCUMENT_CATEGORIES`/`DOCUMENT_CATEGORY_LABELS` defined in Task 1, consumed in Tasks 2-3.
