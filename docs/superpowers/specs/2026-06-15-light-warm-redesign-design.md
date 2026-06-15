# FRA Light/Warm Editorial Redesign — Design Spec

**Date:** 2026-06-15
**Status:** Approved (design) — pending implementation plan
**Design source of truth:** `fra-redesign-v2-light.html` (repo root) — light adaptation of `fra-redesign-v2.html`
**Canonical guide memory:** `project_redesign_guide`

## Goal

Re-theme the live site from the current cool blue/grey **dark** mode to a warm, paper-light **editorial** system: ochre signature color, Fraunces display serif, newspaper anatomy (mastheads, rules, deadline columns, status pills). The light mockup is the visual contract.

## Decisions (locked with user 2026-06-15)

1. **Theme model:** Replace dark entirely. Light warm is THE theme. No toggle.
2. **Rollout:** Phased. Phase 1 = foundation (tokens + fonts + background + Header + homepage + directory). Phases 2+ sweep the remaining ~30 routes.
3. **Display font:** Replace Outfit with Fraunces. Outfit import removed.
4. **Background:** Replace the `site-bg` cinematic photo + scrim with the mockup's warm radial wash; reduce film-grain opacity.
5. PRS/`assess` and tech-pulse silos shift blue→ochre automatically (they alias `@theme` tokens) — accepted.
6. Mid-branch, un-swept pages may look temporarily off until their phase — accepted. **Branch is NOT promoted to prod until the `white/[…]` sweep is complete across all routes.**

## Architecture

The codebase already uses semantic design tokens via Tailwind `@theme` in `src/app/globals.css`, plus `:root` legacy aliases. Silos (`.prs-root`, tech-pulse) alias these tokens rather than redefining colors. **Therefore the leverage point is the token block** — changing values at existing names propagates site-wide. The friction is literal `white/[…]` (41 files) and `bg-black|zinc-8/9|neutral-8/9` (9 files) utilities that assume a dark base.

### Token map (dark → light)

Applied at existing token names in `@theme` and `:root` so downstream inherits:

| Token | Dark | Light |
| --- | --- | --- |
| `--color-background` / `--background` | `#09090b` | `#f7f3ea` |
| `--color-surface` / `--surface` | `#111113` | `#fffdf8` |
| `--color-surface-raised` / `--surface-raised` | `#18181b` | `#ffffff` |
| `--color-foreground` / `--foreground` | `#fafafa` | `#1f1813` |
| `--foreground-secondary` | `rgba(250,250,250,.55)` | `rgba(31,24,19,.66)` |
| `--foreground-tertiary` | `rgba(250,250,250,.48)` | `rgba(31,24,19,.50)` |
| `--foreground-quaternary` | `rgba(250,250,250,.18)` | `rgba(31,24,19,.22)` |
| `--color-primary` / `--primary` | `#3b82f6` | `#d98e2b` (ochre fill) |
| `--color-primary-hover` | `#2563eb` | `#c47f22` |
| `--color-accent` | `#f59e0b` | `#d98e2b` |
| `--color-urgent` | `#ef4444` | `#cf4327` (ember) |
| `--color-success` | `#22c55e` | `#5b8a3a` (moss) |
| `--color-line` | `rgba(255,255,255,.08)` | `rgba(31,24,19,.12)` |
| `--color-line-mid` | `rgba(255,255,255,.12)` | `rgba(31,24,19,.16)` |
| `--color-line-strong` | `rgba(255,255,255,.16)` | `rgba(31,24,19,.22)` |

New tokens added to `@theme`:
- `--color-primary-text: #8a5a12` — ochre that meets AA as text on paper (use for link text, hover titles, mono "when"). `--color-primary` stays the brighter fill for buttons/accents.
- `--color-ember-text: #b33a20`, `--color-moss-text: #4a7330` — readable status text on light.
- `--color-indigo: #6a5cae`, `--color-indigo-text: #5a4d99` — AI / new-wave accent.
- `--color-sand: #f1e2c4`.

### Fonts (`layout.tsx`)

- Add `Fraunces` from `next/font/google` with `variable: '--font-fraunces'` (weights incl. italic; opsz axis).
- Remove the `Outfit` import and its `--font-outfit` variable usage from `<body>`.
- In `globals.css @theme`: `--font-heading: var(--font-fraunces), Georgia, serif;`. `--font-sans` stays Inter, `--font-mono` stays JetBrains.
- `.prs-root --font-display` repointed from `--font-outfit` to `--font-fraunces` (silo inherits the serif).

### Background (`layout.tsx` + `globals.css`)

- Remove the `<link rel="preload" … site-cinematic.jpg>` and replace `.site-bg` rule body with the warm radial wash:
  ```
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(217,142,43,.12) 0%, rgba(247,243,234,0) 55%),
    radial-gradient(90% 60% at 85% 110%, rgba(207,67,39,.05) 0%, rgba(247,243,234,0) 60%),
    var(--background);
  ```
- `.film-grain::before { opacity: .05 }` (was `.15`).
- Scrollbar/`custom-scrollbar` thumbs that use `rgba(255,255,255,…)` → repoint to ink alphas.

### The `white/[…]` sweep

Mechanical-but-verified replacement of dark-assuming utilities with semantic equivalents:
- `bg-white/[0.0x]` (hover/fill) → `bg-foreground/[0.04]` (ink-on-paper)
- white-alpha borders → `border-line` / `border-line-mid` / `border-line-strong`
- `bg-black|zinc-8/9|neutral-8/9` literals → `bg-surface` / `bg-surface-raised`
- avatar/initials chips using `bg-primary/20 … text-blue-300` → ochre equivalents (`text-primary-text`)

**Phase 1 only fixes the files reached by the foundation screens** (Header, homepage, directory, and their shared child components). Remaining files are swept in Phase 2+. Done per-file with visual verification, never blind global find-replace.

### Foundation screens

- **Header.tsx** — already deployed nav (Opportunities ▾ · News · Crew & Jobs · Companies · Community ▾ + Member login; Assess stays commented out). Fix its `white/[0.06]` hovers per the sweep; wordmark inherits Fraunces via `--font-heading`. No nav structure change.
- **`src/app/page.tsx` (homepage)** — editorial layout per mockup screen 1: masthead with italic-serif emphasis (no dateline strip — removed per user), lede + signup band, lead-story + "closing this week" deadline column, "Just added" quieted cards, folio footer. Wire to existing data sources; do not invent new data.
- **`src/app/directory/page.tsx`** — mockup screen 2: dir-head + rubric, search bar, category chips with counts, results line, featured lead card, quieted directory cards with status pills and AI left-border accent.

The opportunity detail **modal** (mockup screen 3) is desirable but deferred to a later phase unless it already exists in a form that's trivial to retheme; Phase 1 does not block on it.

## Non-goals (Phase 1)

- No theme toggle. No dark mode retained.
- No re-theme of members, news, call-sheet, industry, projects, film-opportunities, community-spotlight, rebate-calculator, submit, tech-pulse, assess/PRS bespoke layouts (they inherit tokens only).
- No data-model, routing, or copy changes. No new pages.
- No production promotion until the full sweep completes.

## Risks & mitigations

- **Un-swept pages look off mid-branch** → accepted; gate prod promotion on sweep completion; track remaining files in the plan.
- **Ochre-as-fill vs ochre-as-text contrast** → two tokens (`--color-primary` fill / `--color-primary-text` text); use `-text` wherever ochre is type on paper.
- **Silo regressions (PRS/tech-pulse)** → they alias tokens; spot-check `/assess` and `/tech-pulse` render after the token swap.
- **Hardcoded dark shadows** (`rgba(0,0,0,.x)`) read heavy on light → audit glass-card/glass-panel and modal shadows during the foundation pass.

## Verification

- Build passes (`next build` / lint).
- Visual check of `/`, `/directory`, and the Header against `fra-redesign-v2-light.html`.
- Spot-check token-inheriting silos `/assess` and `/tech-pulse` render without contrast failures.
- Confirm no remaining `white/[…]` in the Phase-1 file set (grep).
