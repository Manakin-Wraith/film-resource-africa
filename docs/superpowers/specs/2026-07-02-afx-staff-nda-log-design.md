# AFX — Staff NDA Log Design

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/staff` — new read-only NDA signature log view
**Builds on:** the NDA read-and-sign feature (`afx_nda_signatures` append-only table, `20334ed`) and the existing staff read-only surfaces (Invites, Team).

## Problem

The `afx_nda_signatures` append-only audit log records every producer NDA
sign/withdraw event, but FRA staff have no way to see it. Staff need a
compliance view: who is currently under NDA, and the full signature history.

## Goal

Add a read-only staff page at `/afx/staff/nda` that lists, per producer, their
**current NDA status** and their **full chronological event history** — mirroring
the existing `/afx/staff/invites` read-only pattern. No migration, no new gate,
no writes.

## Confirmed decisions

1. **Content:** both a per-producer current-status summary AND each producer's
   full event history (expandable inline).
2. **Access:** all staff (`resolveStaff()`), same level as Invites. The staff
   `layout.tsx` already redirects non-staff away from every `/afx/staff/*` route.

## Architecture

Follows the Invites split: a **pure** module for shaping/grouping + a
**service-role server** module for the gated fetch + a **client** component +
a **route** + a **nav link**.

### Pure module — `src/lib/afx/ndaLog.ts`
Types + pure transform (no I/O), unit-shaped like `inviteFunnel.ts`:
- `RawNdaSignature = { id; producer_id; action: 'signed'|'withdrawn'; signer_name; doc_version; created_at }`
- `NdaLogEvent = { id; action: 'signed'|'withdrawn'; signerName; docVersion; at }`
- `NdaStatus = 'signed' | 'withdrawn' | 'legacy' | 'none'`
- `NdaProducerEntry = { producerId; producerName; company; status: NdaStatus; current: { signerName; at; version } | null; events: NdaLogEvent[] }`
- `toNdaEntries(sigs: RawNdaSignature[], producers: { id; name; company; ndaSigned: boolean }[]): NdaProducerEntry[]`
  - group sigs by `producer_id`; sort each producer's events **newest first**;
  - **status** = latest event's action (`signed`→`'signed'`, `withdrawn`→`'withdrawn'`); if a producer has **no events but `ndaSigned === true`** → `'legacy'` (old-toggle producers, `current: null`); else `'none'`;
  - `current` = the latest event's `{ signerName, at, version }` when status is `'signed'`, else `null`;
  - **emit an entry only** for producers with `events.length > 0` OR `ndaSigned` (pure-`'none'` producers are omitted as noise);
  - **sort entries:** currently-covered (`signed`, `legacy`) first, then `withdrawn`; within each, by most recent activity (latest event `at`, or `''` for legacy) descending; tie-break by `producerName`.

### Server module — `src/lib/afx/server/staffNdaLog.ts`
- `listNdaSignatures(): Promise<NdaProducerEntry[]>`
  - `if (!(await resolveStaff())) return [];`
  - `afxAdmin.from('afx_nda_signatures').select('id, producer_id, action, signer_name, doc_version, created_at')` (service-role — RLS bypass is fine, this is the authorized staff path);
  - `afxAdmin.from('afx_producers').select('id, profile')` → map each to `{ id, name: profile.name, company: profile.company, ndaSigned: !!profile.ndaSigned }`;
  - `return toNdaEntries(sigs, producers);`

### Route — `src/app/afx/staff/nda/page.tsx`
Mirror `invites/page.tsx`: `resolveStaff()` → `redirect('/afx/staff')` if not staff; `const entries = await listNdaSignatures()`; render `<AfxTopBar subtitle="FRA review" />` + `<main>` + `<StaffNdaLog entries={entries} />`.

### Component — `src/components/afx/staff/StaffNdaLog.tsx` (`'use client'`)
Read-only list. Header "NDA signatures" + "← Queue" back link (like `StaffInvites`). Each producer row:
- **producer name / company** · **status badge** (Signed = green / Withdrawn = amber / Signed · legacy = muted green "pre-audit") · when signed: `by {current.signerName} · {current.at date} · NDA v{current.version}`;
- a "▸ {events.length} event(s)" toggle (per-row `useState`) that expands the chronological history — each event: a signed/withdrawn badge · `signer_name` · `NDA v{docVersion}` · `{at}` timestamp. Legacy entries with zero events show "no audit events (signed before the audit log existed)".
- Empty state: "No NDA activity yet."

### Nav link — `src/app/afx/staff/page.tsx`
Add `<Link href="/afx/staff/nda" style={navLink}>NDA log →</Link>` beside the existing `Invites →` link (all staff; not admin-gated).

## Out of scope (YAGNI)

- No editing/withdrawing from staff (the log is immutable; producer-side owns sign/withdraw).
- No CSV/PDF export, no filtering/search, no pagination (current producer scale is small).
- No migration, no new RLS/policy, no `afx_producers` write.
- No producers with zero NDA activity (omitted).

## Verification

No test runner: `npx tsc --noEmit -p tsconfig.json` + `npx next build`. The pure
`toNdaEntries` is the logic-bearing unit — a `npx tsx` assertion script (repo
root, deleted after) covering: grouping + newest-first ordering; status from
latest event (signed/withdrawn); legacy (ndaSigned, no events); none-omission;
entry sort order. No live DB gate needed (read-only, no schema/RLS change).
Then browser on prod: a staff user opens `/afx/staff/nda` and sees Gerhard's
entry — status **Signed**, expandable to his withdrawn→signed history from
today's testing.
