# FRA Light/Warm Editorial Redesign — Implementation Plan (Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cool blue/grey dark theme with the warm paper-light editorial system (ochre + Fraunces) across the foundation surfaces: tokens, fonts, background, Header, homepage, directory.

**Architecture:** The site uses semantic design tokens via Tailwind `@theme` + `:root` in `src/app/globals.css`; silos (`.prs-root`, tech-pulse) alias those tokens. Swapping token *values* at existing names propagates the palette site-wide. The remaining work is replacing literal `white/[…]` / dark-bg utilities (which assume a dark base) with semantic equivalents, plus adding the editorial masthead to the homepage.

**Tech Stack:** Next.js App Router, Tailwind CSS v4 (`@theme`), `next/font/google`, React Server + Client Components.

**Design source of truth:** `fra-redesign-v2-light.html` (repo root). Spec: `docs/superpowers/specs/2026-06-15-light-warm-redesign-design.md`.

**Note on verification:** This is a visual/CSS re-theme, not logic — there are no unit tests to add. Each task is verified by (a) `npm run build` passing, (b) targeted `grep` checks, and (c) visual comparison against the mockup. Commit after each task.

**Branch:** `redesign-light-warm` (already created). Do NOT promote to production until the Phase-2 sweep of remaining routes is complete (see backlog at end).

---

### Task 1: Swap color tokens (dark → light warm)

**Files:**
- Modify: `src/app/globals.css:3-27` (the `@theme` block) and `src/app/globals.css:31-51` (`:root`)

- [ ] **Step 1: Replace the color values in the `@theme` block**

In `src/app/globals.css`, within `@theme { … }`, replace these lines' values exactly:

```css
  --color-primary: #d98e2b;
  --color-accent: #d98e2b;
  --color-urgent: #cf4327;
  --color-success: #5b8a3a;
  --color-background: #f7f3ea;
  --color-foreground: #1f1813;
  --color-surface: #fffdf8;
  --color-surface-raised: #ffffff;
  --color-primary-hover: #c47f22;
  --color-callsheet: #0d9488;
  --color-callsheet-deep: #0f766e;
  --color-sponsor: #b45309;
  --color-sponsor-news: #6a5cae;
  --color-line: rgba(31, 24, 19, 0.12);
  --color-line-mid: rgba(31, 24, 19, 0.16);
  --color-line-strong: rgba(31, 24, 19, 0.22);
```

- [ ] **Step 2: Add the new light-only tokens to the `@theme` block**

Immediately after `--color-line-strong`, add:

```css
  /* Light-theme additions: ochre/status as readable TEXT on paper (fills use --color-primary etc.) */
  --color-primary-text: #8a5a12;
  --color-ember-text: #b33a20;
  --color-moss-text: #4a7330;
  --color-indigo: #6a5cae;
  --color-indigo-text: #5a4d99;
  --color-sand: #f1e2c4;
```

- [ ] **Step 3: Update the `:root` legacy aliases**

Replace these lines in `:root` (around `src/app/globals.css:32-40`):

```css
  --background: #f7f3ea;
  --foreground: #1f1813;
  --surface: #fffdf8;
  --surface-raised: #ffffff;
  --border: var(--color-line);
  --border-strong: var(--color-line-strong);
  --foreground-secondary: rgba(31, 24, 19, 0.66);
  --foreground-tertiary: rgba(31, 24, 19, 0.50);
```

And update `--foreground-quaternary` (around line 225, inside `.prs-root`) — leave PRS's local one, but if a top-level `--foreground-quaternary` exists set it to `rgba(31, 24, 19, 0.22)`.

- [ ] **Step 4: Build to verify no CSS errors**

Run: `npm run build`
Expected: build completes (warnings OK; no CSS parse errors).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): swap color tokens to warm light palette"
```

---

### Task 2: Replace Outfit with Fraunces (display font)

**Files:**
- Modify: `src/app/layout.tsx:2,9-11,51`
- Modify: `src/app/globals.css:24-25` (`@theme` font vars) and `src/app/globals.css:233` (`.prs-root --font-display`)

- [ ] **Step 1: Swap the font import in layout.tsx**

In `src/app/layout.tsx`, line 2, replace:

```ts
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
```
with:
```ts
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
```

Replace the Outfit loader (line 10):

```ts
const fraunces = Fraunces({ subsets: ['latin'], axes: ['opsz'], style: ['normal', 'italic'], variable: '--font-fraunces' });
```

- [ ] **Step 2: Update the `<body>` className variable list**

In `src/app/layout.tsx` line 51, replace `${outfit.variable}` with `${fraunces.variable}`:

```tsx
<body className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-sans antialiased text-foreground bg-background film-grain`}>
```

- [ ] **Step 3: Repoint `--font-heading` in globals.css**

In `src/app/globals.css` `@theme` (line ~25), replace:
```css
  --font-heading: var(--font-outfit);
```
with:
```css
  --font-heading: var(--font-fraunces), Georgia, serif;
```

- [ ] **Step 4: Repoint the PRS silo display font**

In `src/app/globals.css` line ~233, replace:
```css
  --font-display: var(--font-outfit), system-ui, sans-serif;
```
with:
```css
  --font-display: var(--font-fraunces), Georgia, serif;
```

- [ ] **Step 5: Verify no remaining `--font-outfit` / `Outfit` references**

Run: `grep -rn "outfit\|Outfit" src/`
Expected: no matches (empty output).

- [ ] **Step 6: Build & commit**

Run: `npm run build` (expected: passes)
```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(theme): replace Outfit with Fraunces display serif"
```

---

### Task 3: Replace cinematic background with warm wash; soften grain & scrollbars

**Files:**
- Modify: `src/app/layout.tsx:52-54`
- Modify: `src/app/globals.css` — `.site-bg` (around line 76-88), `.film-grain::before` (line ~198), scrollbar rules (lines ~173-190)

- [ ] **Step 1: Remove the photo preload + keep the bg div in layout.tsx**

In `src/app/layout.tsx`, delete the preload `<link>` line (line 53):
```tsx
<link rel="preload" as="image" href="/bg/site-cinematic.jpg" />
```
Leave `<div className="site-bg" aria-hidden="true" />` in place.

- [ ] **Step 2: Replace the `.site-bg` rule body in globals.css**

Replace the `background-image`/`background-*` declarations inside `.site-bg { … }` with:

```css
.site-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(217, 142, 43, 0.12) 0%, rgba(247, 243, 234, 0) 55%),
    radial-gradient(90% 60% at 85% 110%, rgba(207, 67, 39, 0.05) 0%, rgba(247, 243, 234, 0) 60%),
    var(--background);
}
```

- [ ] **Step 3: Soften the film grain**

In `.film-grain::before` (line ~198), change `opacity: 0.15;` to `opacity: 0.05;`.

- [ ] **Step 4: Repoint scrollbar thumbs to ink alphas**

In the `.custom-scrollbar::-webkit-scrollbar-thumb` rules (lines ~184-190), replace `rgba(255, 255, 255, 0.2)` → `rgba(31, 24, 19, 0.2)` and `rgba(255, 255, 255, 0.4)` → `rgba(31, 24, 19, 0.35)`. In `.custom-scrollbar::-webkit-scrollbar-track`, `rgba(0,0,0,0.1)` is fine on light — leave it.

- [ ] **Step 5: Verify the photo is no longer referenced**

Run: `grep -rn "site-cinematic" src/`
Expected: no matches.

- [ ] **Step 6: Build & commit**

Run: `npm run build` (expected: passes)
```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(theme): warm wash background, softened grain & scrollbars"
```

---

### Task 4: Sweep `white/[…]` in Header.tsx

**Files:**
- Modify: `src/components/Header.tsx` (6 occurrences at lines 123, 136, 146, 219, 235, 315)

**Replacement rule (applies to every `white/[…]` in the foundation set):** `bg-white/[0.06]` (and any `white/[0.0x]` used as a hover/fill) → `bg-foreground/[0.04]`. These are ink-on-paper hovers; `bg-foreground` resolves to the new warm-ink token so opacity reads correctly on light.

- [ ] **Step 1: Replace all occurrences**

Run:
```bash
sed -i '' 's#hover:bg-white/\[0\.06\]#hover:bg-foreground/[0.04]#g' src/components/Header.tsx
```

- [ ] **Step 2: Verify none remain**

Run: `grep -n "white/\[" src/components/Header.tsx`
Expected: no matches.

- [ ] **Step 3: Build & commit**

Run: `npm run build` (expected: passes)
```bash
git add src/components/Header.tsx
git commit -m "fix(theme): light-mode hovers in Header"
```

---

### Task 5: Sweep `white/[…]` in homepage section components

**Files (occurrence counts):**
- Modify: `src/components/ClosingSoonSection.tsx` (4)
- Modify: `src/components/OpenNowSection.tsx` (1)
- Modify: `src/components/NewWaveSection.tsx` (1)
- Modify: `src/components/NewsSection.tsx` (1)
- Modify: `src/components/BrowseByCountry.tsx` (1)
- Modify: `src/components/NewsletterCTA.tsx` (2)
- Modify: `src/components/NewsletterShowcase.tsx`
- Modify: `src/components/NowScreeningSection.tsx`
- Modify: `src/components/PartnersSection.tsx`
- Modify: `src/components/JoinToContributeCTA.tsx`

(All of these render on the homepage via `HomeClient.tsx`. `JustAddedSection`, `HomeClient`, `SponsorTicker`, `Breadcrumbs` have zero `white/[…]` and use semantic tokens — leave them.)

- [ ] **Step 1: Inspect each file's `white/[…]` lines before replacing**

Run: `grep -n "white/\[" src/components/{ClosingSoonSection,OpenNowSection,NewWaveSection,NewsSection,BrowseByCountry,NewsletterCTA,NewsletterShowcase,NowScreeningSection,PartnersSection,JoinToContributeCTA}.tsx`

For each match, classify: is it a **hover/fill** (`bg-white/[…]`) → `bg-foreground/[0.04]`; a **border** (`border-white/[…]`) → `border-line` (or `border-line-mid` for the stronger `/[0.12+]`); a **text/icon** (`text-white/[…]`) → `text-foreground/[…]` keeping the same alpha. Do NOT blind-replace borders to `foreground/[0.04]`.

- [ ] **Step 2: Apply the hover/fill replacements (the common case)**

For each file, replace `bg-white/[0.0x]` patterns with `bg-foreground/[0.04]`. Example for the whole set's hover case:
```bash
for f in ClosingSoonSection OpenNowSection NewWaveSection NewsSection BrowseByCountry NewsletterCTA NewsletterShowcase NowScreeningSection PartnersSection JoinToContributeCTA; do
  sed -i '' -E 's#(hover:)?bg-white/\[0\.[0-9]+\]#bg-foreground/[0.04]#g' "src/components/$f.tsx"
done
```
Then hand-fix any `border-white/[…]` → `border-line` and `text-white/[…]` → `text-foreground/…` that the grep in Step 1 surfaced (sed above only handles `bg-`).

- [ ] **Step 3: Verify none remain in this set**

Run: `grep -rn "white/\[" src/components/{ClosingSoonSection,OpenNowSection,NewWaveSection,NewsSection,BrowseByCountry,NewsletterCTA,NewsletterShowcase,NowScreeningSection,PartnersSection,JoinToContributeCTA}.tsx`
Expected: no matches.

- [ ] **Step 4: Build & commit**

Run: `npm run build` (expected: passes)
```bash
git add src/components/ClosingSoonSection.tsx src/components/OpenNowSection.tsx src/components/NewWaveSection.tsx src/components/NewsSection.tsx src/components/BrowseByCountry.tsx src/components/NewsletterCTA.tsx src/components/NewsletterShowcase.tsx src/components/NowScreeningSection.tsx src/components/PartnersSection.tsx src/components/JoinToContributeCTA.tsx
git commit -m "fix(theme): light-mode hovers/borders in homepage sections"
```

---

### Task 6: Sweep + polish the Directory (DirectoryClient)

**Files:**
- Modify: `src/components/DirectoryClient.tsx` (2 `white/[…]` occurrences)

- [ ] **Step 1: Inspect the two occurrences and classify**

Run: `grep -n "white/\[" src/components/DirectoryClient.tsx`
Apply the same rule: `bg-white/[…]` → `bg-foreground/[0.04]`; borders → `border-line`.

- [ ] **Step 2: Verify the chip "on/active" state reads on light**

Open `src/components/DirectoryClient.tsx`, find the category chip button classes. Confirm the active chip uses `bg-surface-raised border-line-strong text-foreground` (per mockup `.chip.on`) and inactive uses `bg-surface border-line text-foreground-secondary`. Adjust any hardcoded dark values to those token utilities.

- [ ] **Step 3: Verify status/deadline accents use ochre-as-text**

Where deadline/"days left" text appears, ensure urgent uses `text-urgent` (now ember) and any ochre emphasis uses the new `text-[color:var(--color-primary-text)]` (readable on light) rather than `text-primary` (the bright fill). Only change ochre used as *text*; leave fills/buttons on `text-primary`/`bg-primary`.

- [ ] **Step 4: Verify none remain**

Run: `grep -n "white/\[" src/components/DirectoryClient.tsx`
Expected: no matches.

- [ ] **Step 5: Build & commit**

Run: `npm run build` (expected: passes)
```bash
git add src/components/DirectoryClient.tsx
git commit -m "fix(theme): directory chips/cards light-mode polish"
```

---

### Task 7: Add the editorial masthead to the homepage

**Files:**
- Modify: `src/components/HomeClient.tsx` (the area rendered above `<JustAddedSection>` — around lines 36-61)

**Reference:** `fra-redesign-v2-light.html`, SCREEN 1 — the `.masthead` + `.lede-band` blocks (the `<h1>African film, <em>funded.</em></h1>` masthead, the lede paragraph, and the email signup band). NOTE: the dateline strip was removed per the user — do NOT add it.

- [ ] **Step 1: Read the current top of HomeClient's returned JSX**

Run: `sed -n '36,62p' src/components/HomeClient.tsx`
Identify what currently renders before `<JustAddedSection>` (existing hero, if any) so the masthead replaces/precedes it cleanly without duplicating a hero.

- [ ] **Step 2: Insert the masthead block**

Above `<JustAddedSection opportunities={justAdded} />`, add (Tailwind port of the mockup masthead; `font-heading` is now Fraunces):

```tsx
<section className="container mx-auto px-4 pt-12 md:pt-14">
  <h1 className="font-heading font-semibold leading-[1.02] tracking-[-0.02em] text-[clamp(44px,6vw,84px)] max-w-[11ch] text-foreground">
    African film,{' '}
    <em className="not-italic font-normal italic bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-urgent)] bg-clip-text text-transparent">
      funded.
    </em>
  </h1>
  <div className="flex flex-wrap items-center justify-between gap-8 border-y border-line mt-8 py-4">
    <p className="text-[16px] max-w-[52ch]" style={{ color: 'var(--foreground-secondary)' }}>
      Screenwriting labs, co-production funds, and pitch forums — every live opportunity for African creators, verified and tracked to deadline.
    </p>
  </div>
</section>
```

If a NewsletterCTA/signup already lives in this region, reuse it inside the `.lede-band` flex instead of duplicating an email field. If the existing hero block conflicts, remove the old hero markup it replaces (confirm with the diff from Step 1).

- [ ] **Step 3: Build to verify it compiles**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Visual check against the mockup**

Run the dev server (`npm run dev`) and open `http://localhost:3000`. Compare the masthead to `fra-redesign-v2-light.html` SCREEN 1: Fraunces serif, italic ochre→ember "funded.", warm paper bg, rules above/below the lede. Confirm no leftover dark hero.

- [ ] **Step 5: Commit**

```bash
git add src/components/HomeClient.tsx
git commit -m "feat(home): editorial masthead per light redesign"
```

---

### Task 8: Foundation verification & silo spot-check

**Files:** none modified unless a regression is found.

- [ ] **Step 1: Confirm the Phase-1 file set is free of `white/[…]`**

Run:
```bash
grep -rn "white/\[" src/components/Header.tsx src/components/ClosingSoonSection.tsx src/components/OpenNowSection.tsx src/components/NewWaveSection.tsx src/components/NewsSection.tsx src/components/BrowseByCountry.tsx src/components/DirectoryClient.tsx src/components/NewsletterCTA.tsx src/components/NewsletterShowcase.tsx src/components/NowScreeningSection.tsx src/components/PartnersSection.tsx src/components/JoinToContributeCTA.tsx
```
Expected: no matches.

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: passes with no errors.

- [ ] **Step 3: Visual check of the three foundation surfaces**

`npm run dev`, then check against `fra-redesign-v2-light.html`:
- `/` — masthead, sections, cards read on warm paper; nav = Opportunities · News · Crew & Jobs · Companies · Community + Member login; no Assess button.
- `/directory` — rubric header, chips, cards, status accents.
- Header hovers are subtle ink, not invisible.

- [ ] **Step 4: Spot-check token-inheriting silos**

Open `/assess` (PRS) and `/tech-pulse`. Confirm they render in the warm palette (blue→ochre) with no contrast failures or invisible white-on-white text. If a silo has a hardcoded dark surface that now clashes, note it for Phase 2 (do not fix bespoke silo layout here unless it's an outright unreadable regression).

- [ ] **Step 5: Final commit (if any regression fixes were made)**

```bash
git add -A
git commit -m "fix(theme): foundation verification adjustments"
```

---

## Phase-2 backlog (NOT in this plan — gates prod promotion)

Remaining files with `white/[…]` / dark-bg assumptions to sweep before promoting `redesign-light-warm` to production:
`CallSheetClient.tsx`, `IndustryDirectoryClient.tsx`, `SubmitOpportunityForm.tsx`, `DirectoryListingModal.tsx` (the opportunity detail modal — mockup SCREEN 3), plus the bespoke layouts on routes: members/*, news, projects, film-opportunities, community-spotlight, rebate-calculator, submit, industry, call-sheet, and the PRS/`assess` + tech-pulse silos' bespoke surfaces. Each follows the same replacement rule as Tasks 4-6. Track with: `grep -rl "white/\[" src/components src/app`.

## Self-review notes

- **Spec coverage:** tokens (T1), fonts (T2), background/grain (T3), Header (T4), homepage sweep + masthead (T5,T7), directory (T6), verification + silo spot-check (T8) — all spec sections covered. Modal explicitly deferred to backlog per spec.
- **Replacement rule consistency:** `bg-white/[…]`→`bg-foreground/[0.04]`, `border-white/[…]`→`border-line*`, `text-white/[…]`→`text-foreground/…` used identically in T4, T5, T6.
- **Token names** (`--color-primary`, `--color-primary-text`, `--color-urgent`, `--color-line*`) defined in T1, referenced consistently in T6/T7.
