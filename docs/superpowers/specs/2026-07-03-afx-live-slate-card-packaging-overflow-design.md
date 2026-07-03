# AFX — Live Slate Card Packaging Overflow Design

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` — the Live Slate card's packaging list (`LiveSlateZone.tsx`)
**Builds on:** the Live Slate producer cockpit cards and the packaging drawer (`LiveProjectDrawer`) as the full-detail source of truth.

## Problem

On the producer cockpit's Live Slate, each project renders as a card, and each
packaging attachment renders as its own row (role · name · status) with **no
cap** (`LiveSlateZone.tsx:72`). A project with many attachments makes that one
card grow tall. Because the cards sit in a responsive grid
(`repeat(auto-fill, minmax(300px, 1fr))`), a single tall card forces ragged row
heights and leaves whitespace beside its shorter neighbors.

The CV/Contract documents added in the packaging-docs feature do **not** appear
on the card (they are drawer-only), so this is purely about the **length of the
packaging list**.

## Goal

Keep each Live Slate card's footprint bounded regardless of attachment count,
while still leading with the producer's chosen headline people. Show the first
few attachments and roll the remainder into a `+N more` affordance that opens
the packaging drawer.

## Confirmed decisions

1. **Cap at 3 visible rows.** Render `ask.packaging.slice(0, 3)` as rows.
2. **Producer order, no re-sorting.** The card shows attachments in the order the
   producer arranged them in the drawer; the producer controls the headline.
3. **`+N more` opens the drawer.** When `ask.packaging.length > 3`, render a
   `+N more` control below the visible rows, where `N = length − 3`. It is a real
   button that calls the card's existing `onOpen()` — the same action as
   "Package / edit" — landing the producer in the packaging drawer, which is the
   source of truth for the full list. No inline expand.
4. **No change at ≤3.** Both current projects have exactly 3 attachments, so
   today's data is visually unchanged; the cap only engages at 4+.
5. **Placeholder rows counted as-is.** Empty/placeholder attachment rows are
   sliced/counted exactly as today (not filtered), to avoid scope creep.

## Architecture

A single presentational change to `src/components/afx/producer/LiveSlateZone.tsx`,
inside `LiveProjectCard`. No data model, type, backend, funder-view, or pure-logic
module change.

Current render (lines 69–80) maps over the full `ask.packaging` array. The change:

- Slice to the first 3 for the rendered rows.
- After the rows, when `ask.packaging.length > 3`, render one `+N more` button
  (`N = ask.packaging.length - 3`) wired to the same `onOpen` handler the card
  already receives and already uses for "Package / edit".

### Styling

`+N more` matches the card's quiet aesthetic: `var(--afx-mono)`, small (~11px),
faint/accent color, left-aligned directly under the packaging rows, with a small
top margin. It reads as an actionable affordance (button, pointer cursor), not a
dead label. No borders/pills — consistent with the understated packaging block.

## Data flow

`LiveSlateZone` already computes `live` projects and passes each an `onOpen`
callback (`onOpenProject(p.id)`). The `+N more` button reuses that same callback.
Nothing new flows through props; no state is added.

## Error handling

None beyond current behavior. `ask.packaging` is already guarded by the
`ask ? (...)` block; `slice` and `.length` are safe on the existing array. A
project with 0–3 attachments simply renders no `+N more` control.

## Testing

No test runner. Verify with:

- `npx tsc --noEmit -p tsconfig.json` + `npx next build`.
- **Browser on prod** (Gerhard): temporarily add a 4th+ attachment to a live
  project via the drawer and save → the card shows exactly 3 rows plus a
  `+N more` control with the correct hidden count → clicking `+N more` opens the
  packaging drawer for that project → a project with ≤3 attachments shows no
  `+N more` and looks unchanged.

No migration, no new RLS/policy, no funder-view change.

## YAGNI (explicitly not building)

- No inline expand/collapse on the card (overflow always routes to the drawer).
- No re-sorting by status or role (producer order is authoritative).
- No status roll-up summary ("N signed / N soft") — that was a rejected
  alternative; the card leads with the strongest-signal names instead.
- No change to `FunderPreview` (renders no packaging list) or the seed
  marketplace `DrillDownOverlay` (already a collapsible block on mock data).
- No filtering of empty/placeholder attachment rows.
- No configurable cap — 3 is fixed.
