# AFX Collapsible Producer Section Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every producer-cockpit card independently expand/collapse by clicking its header, via one central change to the shared `SectionCard`.

**Architecture:** All seven cards (Operator Identity, Confidentiality (NDA), Account & Visibility, Company / Entity Vetting, Track Record, Live Slate, Financial Aggregates) render through `SectionCard` in `cockpitUi.tsx`, which is used by exactly those seven components and nothing else. Add internal `open` state + a clickable/keyboard-accessible header + a chevron; hide the body with `display:none` (keep it mounted). No card component or prop-signature changes.

**Tech Stack:** Next.js App Router client component, TypeScript, inline `var(--afx-*)` styling.

## Global Constraints

- Behavior: **independent** collapse (any number open at once — NOT one-at-a-time accordion); **all expanded** on load; **no persistence** (reload → all expanded). No localStorage.
- No change to `SectionCard`'s props (`title`, `hint?`, `children`, `action?`) — all seven call sites stay untouched.
- Body must stay **mounted** and be hidden via `display:none` when collapsed (preserve in-flight child state) — do NOT conditionally unmount `children`.
- Header accessibility: `role="button"`, `tabIndex={0}`, `aria-expanded`, Enter/Space toggle.
- Action button (when present) must not toggle collapse (`stopPropagation`) and must auto-expand the card; chevron is always the rightmost header element, action immediately left of it.
- No test runner — verify with `npx tsc --noEmit -p tsconfig.json` and `npx next build`.

---

### Task 1: Make SectionCard collapsible

**Files:**
- Modify: `src/components/afx/producer/cockpitUi.tsx` (the `SectionCard` function + add a `useState` import)

**Interfaces:**
- Consumes: nothing new.
- Produces: `SectionCard` with unchanged props `{ title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }` — collapse is entirely internal.

- [ ] **Step 1: Add the `useState` import**

At the top of `src/components/afx/producer/cockpitUi.tsx`, directly below the `'use client';` line (before `const mono = ...`), add:

```tsx
import { useState } from 'react';
```

- [ ] **Step 2: Replace the `SectionCard` function**

Replace the entire existing `SectionCard` function (the `export function SectionCard({...}) { return (...); }` block) with:

```tsx
export function SectionCard({
  title,
  hint,
  children,
  action,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section style={{ background: 'var(--afx-surface)', border: '1px solid #EAE8E3', borderRadius: 14, overflow: 'hidden' }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); }
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 22px', borderBottom: open ? '1px solid #F2F0EB' : 'none', background: 'linear-gradient(180deg,#FCFBF9,#fff)', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--afx-accent)' }} />
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</h2>
        {hint ? <span style={{ fontSize: 11.5, color: '#9A9CA3' }}>{hint}</span> : null}
        {action ? (
          <div style={{ marginLeft: 'auto' }} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>{action}</div>
        ) : null}
        <span aria-hidden style={{ marginLeft: action ? 10 : 'auto', fontFamily: mono, fontSize: 12, color: '#9A9CA3', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none', lineHeight: 1 }}>▸</span>
      </div>
      <div style={{ padding: '18px 22px', display: open ? 'block' : 'none' }}>{children}</div>
    </section>
  );
}
```

Notes on the code (intentional, per spec):
- `const [open, setOpen] = useState(true)` → all cards start expanded.
- Header is the toggle: `role="button"` + `tabIndex` + `aria-expanded` + Enter/Space handler (`preventDefault` on Space so the page doesn't scroll).
- `display: open ? 'block' : 'none'` hides the body but keeps `children` mounted — in-flight state preserved.
- `action` wrapper calls `e.stopPropagation()` (so the action click does not toggle) and `setOpen(true)` (auto-expand so a newly-added item is visible); the action's own handler still fires.
- Chevron `▸` rotates to point down (`rotate(90deg)`) when open; `marginLeft: action ? 10 : 'auto'` keeps it the rightmost element in both layouts.
- `borderBottom` is dropped when collapsed so a collapsed card reads as a single clean bar.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 4: Production build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/afx/producer/cockpitUi.tsx
git commit -m "feat(afx): collapsible producer section cards"
```

---

## Post-implementation manual verification (controller, after deploy)

On prod `/afx/producer`:
- Each of the seven cards collapses/expands on header click; chevron rotates.
- Two or more cards open at once (independent, not accordion).
- Keyboard: Tab to a header, Enter/Space toggles it.
- On a collapsed **Live Slate**, clicking *+ Add live project* adds a project AND expands the card.
- Reload → all seven cards expanded again.

## Self-Review

- **Spec coverage:** independent collapse (each header toggles its own `open`) → Step 2; all-expanded default (`useState(true)`) → Step 2; no persistence (state only, no storage) → Step 2; chevron rightmost with action to its left (`marginLeft: action ? 10 : 'auto'` + action `marginLeft:'auto'`) → Step 2; body mounted + `display:none` → Step 2; header a11y (role/tabIndex/aria-expanded/keydown) → Step 2; action stopPropagation + auto-expand → Step 2; no prop change / seven call sites untouched → props block unchanged, only internal state added. All spec sections mapped.
- **Placeholder scan:** none — the full replacement function is provided.
- **Type consistency:** `SectionCard` prop type is byte-identical to the current definition; `useState<boolean>` inferred from `true`; `open`/`setOpen` used consistently. No new exported names, so no cross-file drift.
