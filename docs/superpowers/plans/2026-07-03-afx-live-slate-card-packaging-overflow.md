# Live Slate Card Packaging Overflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cap the Live Slate card's packaging list at 3 visible rows and roll the rest into a `+N more` button that opens the packaging drawer, so a card's height stays bounded no matter how many attachments a project has.

**Architecture:** A single presentational edit to `LiveProjectCard` inside `src/components/afx/producer/LiveSlateZone.tsx`. The full `ask.packaging` map becomes a `.slice(0, 3)` map, followed by a conditional `+N more` button wired to the card's existing `onOpen` callback (the same handler "Package / edit" already uses). No data model, type, backend, pure-logic, or funder-view change.

**Tech Stack:** Next.js App Router, React (`'use client'`), TypeScript, inline `var(--afx-*)` styling under `.afx-root`.

## Global Constraints

- Cap visible packaging rows at **3**: render `ask.packaging.slice(0, 3)`.
- Preserve **producer order** — no re-sorting of `ask.packaging`.
- Show `+N more` only when `ask.packaging.length > 3`; the count is `ask.packaging.length - 3`.
- `+N more` is a real `<button type="button">` calling the existing `onOpen` prop — same action as "Package / edit". No inline expand.
- Do not filter empty/placeholder attachment rows — slice/count the array exactly as-is.
- `+N more` styling uses the card's quiet aesthetic: `var(--afx-mono)`, ~11px, `var(--afx-accent)` color, left-aligned, no border/background, pointer cursor.
- No test runner exists; verification is `npx tsc --noEmit -p tsconfig.json` + `npx next build` + a browser check on prod.

---

### Task 1: Cap packaging rows and add `+N more` overflow button

**Files:**
- Modify: `src/components/afx/producer/LiveSlateZone.tsx:69-80` (the packaging block inside `LiveProjectCard`)

**Interfaces:**
- Consumes (already present, no signature change): `LiveProjectCard`'s props `{ project: Project; onArchive: () => void; lastScreenable: boolean; onOpen: () => void }`. `onOpen` is already destructured at line 48 and used at line 96; the new button reuses it. `ask.packaging` is `PackagingAttachment[]` (`{ role: string; name: string; status: 'signed' | 'soft-hold' | 'wishlist'; id?: string }`). `mono` is the module-level `const mono = 'var(--afx-mono)'`.
- Produces: no new exported symbol; a purely internal JSX change.

- [ ] **Step 1: Replace the packaging block with the capped version**

In `src/components/afx/producer/LiveSlateZone.tsx`, replace this exact block (lines 69–80):

```tsx
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Packaging</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5 }}>
              {ask.packaging.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 70, flex: 'none', color: '#9A9CA3' }}>{a.role}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontSize: 10.5, color: '#5E6066' }}>{({ signed: 'Signed', 'soft-hold': 'Soft-hold', wishlist: 'Wishlist' } as const)[a.status]}</span>
                </div>
              ))}
            </div>
          </div>
```

with:

```tsx
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Packaging</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5 }}>
              {ask.packaging.slice(0, 3).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 70, flex: 'none', color: '#9A9CA3' }}>{a.role}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontSize: 10.5, color: '#5E6066' }}>{({ signed: 'Signed', 'soft-hold': 'Soft-hold', wishlist: 'Wishlist' } as const)[a.status]}</span>
                </div>
              ))}
            </div>
            {ask.packaging.length > 3 ? (
              <button
                type="button"
                onClick={onOpen}
                style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-accent)', background: 'none', border: 'none', padding: 0, marginTop: 6, cursor: 'pointer' }}
              >
                +{ask.packaging.length - 3} more
              </button>
            ) : null}
          </div>
```

The only changes: `ask.packaging.map` → `ask.packaging.slice(0, 3).map`, and a new conditional `+N more` button after the rows list. Everything else is unchanged.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors. (`onOpen` is in scope; `ask.packaging` is a real array so `.slice`/`.length` type-check cleanly.)

- [ ] **Step 3: Production build**

Run: `npx next build`
Expected: build succeeds with no ESLint error for `LiveSlateZone.tsx` (no unused symbols introduced; `onOpen` was already referenced).

- [ ] **Step 4: Commit**

```bash
git add src/components/afx/producer/LiveSlateZone.tsx
git commit -m "feat(afx): cap Live Slate card packaging at 3 rows with +N more"
```

## Manual verification (post-merge, on prod by Gerhard)

Not automatable (no test runner; presentational). After deploy:

1. Open a live project's packaging drawer, add a **4th** attachment, Save.
2. On the Live Slate card, confirm exactly **3** rows render, followed by `+1 more`.
3. Click `+1 more` → the packaging drawer for that project opens.
4. Confirm a project with **≤3** attachments shows **no** `+N more` and looks unchanged (both current projects have exactly 3).
5. Remove the temporary 4th attachment to restore state.
