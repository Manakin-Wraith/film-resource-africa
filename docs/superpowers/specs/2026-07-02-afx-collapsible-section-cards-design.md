# AFX — Collapsible Producer Section Cards (Design)

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Area:** `/afx/producer` — the seven cockpit cards

## Problem

The producer cockpit is a long single-column scroll of seven cards (Operator
Identity, Confidentiality (NDA), Account & Visibility, Company / Entity Vetting,
Track Record, Live Slate, Financial Aggregates). Producers want to collapse the
cards they aren't working in to shorten the page.

## Goal

Make every cockpit card independently expand/collapse by clicking its header.

## Decisions

- **Interaction:** independent collapse — each card toggles on its own; any
  number may be open at once (NOT a one-at-a-time accordion).
- **Default state:** all cards expanded on load.
- **Persistence:** none. State is per-session only; a reload returns every card
  to expanded. No localStorage, no SSR/hydration concerns.
- **Chevron placement:** the collapse chevron is always the rightmost element in
  the header; when a card also has an action button, the action sits immediately
  to the left of the chevron.

## Architecture

All seven cards render through one shared component, `SectionCard`, in
`src/components/afx/producer/cockpitUi.tsx` (already `'use client'`). `SectionCard`
is used by **exactly** these seven components and nothing else in the repo, so
the change is centralized there; the seven card components are untouched.

`StatusHeader`, the top bar, and `FunderPreview` are not `SectionCard`s and stay
always-visible. Funder Preview mode does not render these cards at all.

## Behavior

- `SectionCard` holds `const [open, setOpen] = useState(true)` (expanded by
  default).
- **Header is the toggle.** The existing header row becomes clickable and flips
  `open`. For accessibility it gets `role="button"`, `tabIndex={0}`,
  `aria-expanded={open}`, and an `onKeyDown` that toggles on Enter/Space
  (calling `preventDefault` for Space). `cursor: pointer` and
  `userSelect: 'none'` on the header.
- **Chevron affordance.** A small muted chevron at the right end of the header:
  `▸` when collapsed, `▾` when open (or an equivalently rotated single glyph).
  Styled to match the header (mono/faint tone). It is always the rightmost
  header element.
- **Body stays mounted, hidden via CSS.** The body wrapper
  (`<div style={{ padding: '18px 22px' }}>{children}</div>`) is NOT unmounted
  when collapsed; it is hidden with `display: open ? 'block' : 'none'`. This
  preserves all transient child state (a half-typed field, an in-progress
  document upload, the lifted autosave `draft`) and matches today's
  everything-mounted behavior. Collapse is purely visual.
- **Action button coexists with the toggle.** The optional `action` prop stays
  in the header, positioned immediately left of the chevron. It is wrapped so a
  click on it:
  1. does NOT toggle collapse (`e.stopPropagation()` on the wrapper), and
  2. auto-expands the card (`setOpen(true)`), so a newly-added item (e.g. a new
     live project) becomes visible.
  The action's own `onClick` still fires. Result: clicking *+ Add live project*
  on a collapsed Live Slate adds the project and expands the card; clicking
  elsewhere on the header toggles.

## Component interface

`SectionCard` keeps its current props (`title`, `hint?`, `children`, `action?`) —
**no signature change**, so all seven call sites are untouched. Collapse is
entirely internal state.

## Out of scope

- No one-at-a-time accordion semantics.
- No persisted / remembered collapse state.
- No "expand all / collapse all" control.
- No change to any of the seven card components, to `StatusHeader`, the top bar,
  `FunderPreview`, or the funder-preview toggle.

## Verification

No test runner (per `project-afx-prod-and-vetting`): `npx tsc --noEmit -p
tsconfig.json` + `npx next build`, then a browser check on prod:
- Each of the seven cards collapses and expands on header click.
- Two (or more) cards can be open simultaneously (independent, not accordion).
- Keyboard: header is focusable and toggles on Enter/Space.
- *+ Add live project* on a collapsed Live Slate adds a project and expands the
  card.
- A reload returns all seven cards to expanded.
