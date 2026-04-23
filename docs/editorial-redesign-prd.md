# FRA Editorial Redesign — Product Requirements Document

**Version:** 1.6  
**Date:** 2026-04-23  
**Status:** In Progress  
**Owner:** G. Mostert  

---

## 1. Vision

Film Resource Africa is the publication of record for African film opportunity. The current UI reads as a dark SaaS directory — glass morphism, uniform cards, low-opacity colour gradients. Nothing stands out. There is no visual hierarchy and no editorial identity.

This redesign repositions FRA as a **curated publication** — type-led, grid-based, authoritative — drawing on the tradition of African editorial print design while remaining a modern, functional web product. The goal is not a cosmetic refresh. It is a design language change.

**Before:** Dark job board with a film grain overlay.  
**After:** The publication of record for African film.

**Critical constraint:** 50% of users are on mobile. Every design decision must work on mobile first. Desktop is an enhancement, not the baseline.

---

## 2. Design Principles

These principles govern every decision in this redesign. When in doubt, return here.

### 2.1 Type leads, colour follows
Typography carries hierarchy — size, weight, tracking, and line-height do the work. Colour is reserved for **meaning**: red for urgency, amber for deadlines, blue for action. Colour is never decorative.

### 2.2 Ink-on-paper logic
Treat the dark background as the page. Elements are placed with intent. White space is not empty — it signals curation. Not everything needs a border, a glow, or a gradient.

### 2.3 Curated over comprehensive
An editor chose what appears here. The design should feel like decisions were made. Featured placements, cover-story treatments, and editorial picks communicate authority. A directory that shows everything equally is a spreadsheet.

### 2.4 Urgency is visual, not just labelled
A deadline in 48 hours must *look* different from a rolling application. Status is not a badge — it is expressed through scale, colour temperature, and position on the page.

### 2.5 African editorial identity
Draw from pan-African print traditions: Drum, The Continent, FESPACO poster design, West African newspaper typography. FRA should feel native to the industry it serves, not like a Silicon Valley product with a diversity skin.

### 2.6 Timeless over trendy
Glass morphism, blob gradients, and animated grain are trends. A strong typographic grid and restrained colour palette will look authoritative in five years. We are building the latter.

### 2.7 Mobile-first, not mobile-adapted
50% of users arrive on a phone. Design for the 4-column, thumb-driven, portrait experience first. Desktop is a progressive enhancement. Any component that doesn't work one-handed on mobile is not finished.

**Mobile editorial rules:**
- Touch targets minimum 44×44px — no exceptions
- Primary action (Apply / Read) reachable without scrolling on first viewport
- Carousels scroll horizontally with visible overflow (no hidden overflow that hides affordance)
- No hover-dependent information — all content accessible without hover state
- Bottom navigation is the primary nav on mobile (not burger menus)
- Text never smaller than 14px on mobile; captions minimum 12px
- Line length maximum 70 characters on mobile (prevents side-scroll reading)

---

## 3. Typography System

### 3.1 Typefaces (existing — no new packages)
| Role | Font | Notes |
|---|---|---|
| Display / Masthead | Outfit (font-heading) | Heavy weight, large scale |
| Body / UI | Inter (font-sans) | Regular and medium weights |

### 3.2 Type Scale
| Token | Desktop Size | Mobile Size | Weight | Usage |
|---|---|---|---|---|
| `display-xl` | 80–96px | 48–56px | 800 | Hero headline only |
| `display` | 56–72px | 36–44px | 700 | Section hero / cover story title |
| `headline` | 32–40px | 24–28px | 700 | Section titles |
| `rubric` | 11px, tracking-widest, uppercase | 10px, tracking-widest, uppercase | 600 | Section labels / column headers |
| `subhead` | 20–24px | 16–18px | 600 | Card titles, article titles |
| `body` | 16px | 15px | 400 | Article body, descriptions |
| `caption` | 13px | 12px | 400 | Datelines, metadata, tags |
| `label` | 11px | 11px | 600 | Badges, status chips |

### 3.3 Hierarchy Rules
- Maximum **three type sizes** visible in any single viewport.
- Section rubrics always appear above section headlines, always uppercase, always `opacity-40`.
- Card titles never exceed `text-xl` (20px) desktop / `text-base` (16px) mobile.
- Deadlines displayed as editorial **datelines** (`caption` size, amber, left-aligned) — not inside badge chips.
- On mobile, hero `display-xl` scales down to 48px minimum — it should still feel large and editorial, not cramped.

---

## 4. Colour System

### 4.1 Palette
| Token | Value | Role |
|---|---|---|
| `background` | `#09090b` | Page canvas |
| `surface` | `#111113` | Card / section background |
| `surface-raised` | `#18181b` | Hover / elevated state |
| `border` | `rgba(255,255,255,0.08)` | Structural borders |
| `border-strong` | `rgba(255,255,255,0.16)` | Emphasis borders |
| `foreground` | `#fafafa` | Primary text |
| `foreground-secondary` | `rgba(250,250,250,0.55)` | Secondary text |
| `foreground-tertiary` | `rgba(250,250,250,0.35)` | Captions, metadata |
| `primary` | `#3b82f6` | Action, apply CTA, links |
| `accent` | `#f59e0b` | Deadlines, featured, editorial picks |
| `urgent` | `#ef4444` | Closing soon, critical deadlines |
| `success` | `#22c55e` | Open / confirmed status |

### 4.2 Colour Usage Rules
- **Glass morphism gradients (`from-[colour]/[0.07]`) are removed entirely.** Sections are differentiated by layout and typography, not tinted backgrounds.
- Accent (`#f59e0b`) used at **full saturation** for: deadline datelines, editorial pick markers, featured section rule lines.
- Urgent (`#ef4444`) used at **full saturation** for: closing soon section rule, countdown text on critical deadlines.
- Primary (`#3b82f6`) used at full saturation for: "Apply" buttons, links, active tab indicators.
- Background gradients: maximum one subtle radial (`from-white/[0.02]`) per major section. No blob animations on content pages.

---

## 5. Layout System

### 5.1 Grid
- Desktop: 12-column grid, 1280px max-width, 24px gutters
- Tablet: 8-column
- Mobile: 4-column, 16px gutters — single column by default, 2-column only when cards are compact enough to read at half-screen width

### 5.2 Spacing Scale
Remove the current uniform `p-6 md:p-8` applied to every section. Introduce intentional variation:

| Context | Mobile | Desktop |
|---|---|---|
| Page top padding | `py-10` | `py-16 md:py-24` |
| Between major sections | `mt-14` | `mt-20 md:mt-28` |
| Between subsections | `mt-8` | `mt-10 md:mt-14` |
| Section internal padding | `pt-5 pb-8` | `pt-6 pb-10` |
| Card internal padding | `p-4` (compact) | `p-5` (compact) or `p-6` (standard) |

### 5.3 Section Anatomy
Every section follows this structure:

```
[Rule line — 1px, coloured]
[Rubric label — 11px uppercase tracking-widest opacity-40]
[Section headline — 32-40px bold desktop / 24-28px mobile]
[Optional standfirst — 16px secondary text, hidden on mobile if space is tight]
[Content area — grid or list, defined per section]
```

### 5.4 Featured / Cover Story Treatment
The single most important item in a section receives a **cover story card**:
- Full section width (not fixed 360px)
- Large title (`display` scale desktop, 36px mobile minimum)
- Image behind or beside at editorial proportions (16:9 or 3:2); stacked vertically on mobile
- Deadline displayed prominently as a dateline, not a chip
- "Apply Now" button at full primary blue, full width on mobile (min-height: 48px)

### 5.5 Mobile Touch & Thumb Zones
- All interactive elements: minimum 44×44px touch target
- Primary CTA buttons: full-width on mobile (`w-full`), height 48px minimum
- Carousel scroll: `overflow-x-auto`, `scroll-snap-type: x mandatory`, show 1.2 cards to signal scroll affordance
- Bottom safe area: account for `env(safe-area-inset-bottom)` on all bottom-fixed elements
- Avoid placing key actions in top corners (thumb dead zone on large phones)

---

## 6. Component Inventory

### 6.1 Components to redesign (in priority order)

| # | Component | Current State | Target State | Mobile Priority | Status |
|---|---|---|---|---|---|
| 1 | **Design tokens** | globals.css partial | Full token set + section anatomy | Foundation | ✅ Done |
| 2 | **MobileTabBar** | Dark glass | Clean dark bar, stronger active state, safe-area aware | P0 — 50% of users | ✅ Done |
| 3 | **Hero / Masthead** | Large gradient text, newsletter CTA | Masthead treatment, publication identity | Stacked single-col | ✅ Done |
| 4 | **Section rubric** | Icon + title only | Rule + rubric label + headline + standfirst | Same pattern, scaled | ✅ Done |
| 5 | **Closing Soon — featured card** | Same as all other cards | Cover story card, full-width, red rule, large deadline | Full-width, image stacked | ✅ Done |
| 6 | **Closing Soon — section** | Horizontal carousel | Featured card (1st) + horizontal strip (rest) | Snap carousel | ✅ Done |
| 7 | **Opportunity card** | glass-card uniform | Clean dark surface, dateline deadline, no glow | Full-width card | ✅ Done |
| 8 | **Just Added — section** | Horizontal carousel | 2-column grid desktop / single-col mobile | Single col mobile | ✅ Done |
| 9 | **Open Now — section** | Horizontal carousel | Horizontal carousel (kept, reduced decoration) | Snap carousel | ✅ Done |
| 10 | **New Wave — section** | Horizontal carousel | Editorial list (title + category + deadline per row) | Compact list rows | ✅ Done |
| 11 | **News card** | Amber-tinted glass card | Editorial article entry (image left/top, headline, dateline) | Image top, stacked | ✅ Done |
| 12 | **News section** | Uniform card grid | Featured article (large) + secondary grid | Full-width featured | ✅ Done |
| 13 | **SponsorTicker / NewsletterShowcase** | Gradient glow card | Spacing and context preserved; full redesign deferred | Kept functional | ⬜ Phase 5 |
| 14 | **Header / Nav** | Glass panel | Masthead bar with publication wordmark | Minimal wordmark only | ✅ Done |
| 15 | **OpportunityModal** | Glass panel | Editorial detail sheet — full content layout | Full-screen sheet | ⬜ Phase 4 |
| 16 | **BrowseByCountry** | Card grid | Editorial map/index treatment | Clean editorial grid | ✅ Done |
| 17 | **Footer** | Minimal | Masthead footer with publication credit | Compact, above tab bar | ⬜ Phase 5 |

### 6.2 Components NOT changing in this sprint
- Admin UI (AdminClient.tsx) — functional, not public-facing
- Scanner / backend scripts
- Auth / login page
- Submit forms (submit, call-sheet, industry submit)
- Rebate calculator

---

## 7. Page Scope

| Page | Priority | Notes |
|---|---|---|
| `/` — Homepage | P0 | Primary target. All sections. |
| `/news` — News index | P1 | Editorial article list |
| `/news/[slug]` — Article | P1 | Already uses MarkdownBody — enhance with editorial layout |
| `/film-opportunities/[country]` | P2 | Country page hero + opportunity list |
| `/community-spotlight` | P2 | Spotlight feature — editorial profile layout |
| `/call-sheet` | P3 | Functional page — light touch |
| `/industry` | P3 | Directory — light touch |

---

## 8. Implementation Phases

### Phase 1 — Foundation *(Design tokens + global CSS)*
**Goal:** Establish the design language without touching any component.
- [x] Remove blob gradient animations from `page.tsx`
- [x] Add full colour token set to `globals.css`
- [x] Define section anatomy CSS classes (`.section-rubric`, `.section-rule`, `.editorial-label`, `.editorial-dateline`)
- [x] Define new spacing tokens (mobile + desktop variants)
- [x] Remove `glass-card` usage from section wrappers (kept for modals only)

**Exit criteria:** Tokens defined. Section wrappers cleaned up. No visual regression beyond reduced gradient noise.

---

### Phase 2 — MobileTabBar + Hero + Closing Soon *(The flagship moment)*
**Goal:** Fix the primary mobile navigation and deliver one section that immediately demonstrates the editorial direction.
- [x] **MobileTabBar** — clean dark bar, stronger active state, `env(safe-area-inset-bottom)` padding, 44px touch targets
- [x] Redesign homepage hero as masthead — rubric, 2px accent rule, 52/88px headline, split layout desktop
- [x] Implement section rubric pattern for "Closing Soon" (red rule → rubric → headline)
- [x] Build featured cover-story card for the #1 most urgent opportunity (image banner, full-width CTA on mobile)
- [x] Apply full-strength red rule and amber deadline dateline
- [x] Header/Nav rebuilt as masthead bar (wordmark + text-only links + ghost Submit CTA) — pulled forward from Phase 5
- [x] SiteNav wrapper to suppress header on admin/login routes
- [x] Mobile Submit button: ghost outline (was bg-primary, clashed with Subscribe)
- [x] Vercel build resolved (ESLint config, SiteNav untracked, unescaped entities)

**Exit criteria:** MobileTabBar is editorial. Hero + Closing Soon looks unmistakably editorial at 375px and 1280px. ✅

---

### Phase 3 — Remaining Homepage Sections
**Goal:** Extend the editorial language across all homepage sections.
- [x] Redesign Just Added → 2-column editorial grid, blue section-rule, CardVisualHeader cards
- [x] Redesign Open Now → cleaned snap carousel, green section-rule, inline Apply link
- [x] Redesign New Wave → editorial list rows with category icon pip, amber section-rule
- [x] Redesign News section → featured article full-width + 2-col secondary thumbnail grid
- [x] Redesign BrowseByCountry → editorial grid, green section-rule, no gradient/blob backgrounds
- [x] Fix section spacing — NowScreeningSection and NewsletterShowcase missing `mt-14 md:mt-20`

**Exit criteria:** Homepage is cohesive at all breakpoints. Every section has distinct layout. No two adjacent sections look the same. ✅

---

### Phase 4 — Article + Opportunity Pages
**Goal:** The detail views match the editorial quality of the homepage.
- [x] OpportunityModal → solid surface background, clean fieldset info sections, pinned Apply Now footer
- [x] Enhance `/news/[slug]` → editorial masthead (rubric + rule + extrabold headline + standfirst), clean hero image, border-t article body, editorial cards for related/more sections
- [ ] News index page `/news` — deferred to Phase 5

**Exit criteria:** Article and opportunity detail feel like magazine pages. Full-screen on mobile without horizontal overflow. ✅

---

### Phase 5 — Polish + Core Pages
**Goal:** Remaining pages, newsletter CTA redesign, footer, news index.
- [x] Redesign `NewsletterShowcase` — editorial section anatomy, surface-raised preview cards, no gradient blobs
- [x] Redesign `Footer` — removed `bg-black/40 backdrop-blur`, `<img>` → `<Image>`, clean surface-raised inputs/social, editorial typography
- [x] News index page `/news` — editorial left-aligned header, clean filter tabs, featured-first layout, surface cards

**Exit criteria:** All main site pages cohesive. ✅

---

### Phase 6 — Country Pages + QA
**Goal:** Country detail pages editorial touch, then full site QA.
- [x] `/film-opportunities/[country]` — editorial hero (section-rule + rubric + left-aligned h1), surface cards, no glass
- [x] `/film-opportunities` index — editorial header, per-region dividers with accent rubrics, surface country cards

**Exit criteria:** Country pages cohesive. ✅

---

### Phase 7 — Community Spotlight + Final QA
**Goal:** Community Spotlight page editorial treatment, then full site QA pass.
- [ ] `/community-spotlight` — editorial profile layout, remove glass/gradients
- [ ] Cross-browser + responsive QA (375px, 390px, 428px, 768px, 1280px, 1440px)
- [ ] Accessibility audit (contrast, focus states, touch target sizes)

**Exit criteria:** Full site cohesive. Ship-ready.

---

## 9. Design Reference Points

These are reference points for the *feeling* to aim for — not to copy.

| Reference | What to borrow |
|---|---|
| **The Continent** (African newspaper) | Column-based layout, strong headline hierarchy, authoritative tone |
| **Filmmaker Magazine** | Editorial rubrics, type-led design, film industry specificity |
| **Monocle** | Restrained colour, deliberate white space, masthead identity |
| **FESPACO poster tradition** | Bold type, pan-African colour confidence, event urgency |
| **Sight & Sound** | Publication authority, critical voice, film-specific visual grammar |
| **Le Monde Diplomatique** | Dense but readable, editorial trust through typography |

**What to avoid:** Linear gradients on every surface. Glassmorphism everywhere. Badge-heavy cards. Animated blob shadows. Anything that looks like a SaaS dashboard. Hover-only interactions on mobile.

---

## 10. Success Metrics

| Metric | How to measure |
|---|---|
| Visual hierarchy | Can a new user identify the most urgent opportunity in <5 seconds without scrolling? |
| Section differentiation | Do adjacent sections look visually distinct without reading the title? |
| Editorial identity | Does a screenshot of FRA look like a publication or a directory? |
| Mobile usability | Can all primary actions (read, apply, browse) be completed one-handed on mobile at 375px? |
| Mobile navigation | Is the MobileTabBar the clear primary nav — no ambiguity about how to move between sections? |
| Touch targets | Zero interactive elements below 44px in any dimension on mobile |
| Performance | No regression in Core Web Vitals (LCP, CLS) after redesign |
| Engagement | Click-through rate on opportunities (tracked via existing analytics) improves post-launch |

---

## 11. Open Questions

- [ ] Do we introduce a condensed typeface for display/masthead use, or stay with Outfit? (Outfit Bold is good but not a true editorial condensed)
- [ ] Light mode: is the editorial direction dark-only, or does it translate to a warm off-white light mode?
- [ ] Film stills / editorial imagery: do we source/allow cover images for the featured card, or keep it type-and-logo?
- [ ] Does the "New Wave: AI Filmmaking" section stay as a permanent section or become a rotating editorial theme?
- [ ] MobileTabBar tabs: current tabs are Home / Browse / Saved / Submit. Do these map correctly to the editorial publication model, or should one tab become "Latest" (news feed)?
- [ ] OpportunityModal on mobile: full-screen sheet (current direction) vs. navigating to a dedicated page route? A dedicated route is more shareable and better for SEO.

---

## 12. Progress Tracker

| Phase | Status | Started | Completed |
|---|---|---|---|
| Phase 1 — Foundation | ✅ Complete | 2026-04-23 | 2026-04-23 |
| Phase 2 — MobileTabBar + Hero + Closing Soon + Nav | ✅ Complete | 2026-04-23 | 2026-04-23 |
| Phase 3 — Remaining Homepage Sections | ✅ Complete | 2026-04-23 | 2026-04-23 |
| Phase 4 — Article + Detail Pages | ✅ Complete | 2026-04-23 | 2026-04-23 |
| Phase 5 — Polish + Core Pages | ✅ Complete | 2026-04-23 | 2026-04-23 |
| Phase 6 — Country Pages | ✅ Complete | 2026-04-23 | 2026-04-23 |
| Phase 7 — Community Spotlight + Final QA | 🔄 In progress | 2026-04-23 | — |

---

*Last updated: 2026-04-23 — v1.6: Phase 6 complete. Phase 7 starting (Community Spotlight, responsive QA, accessibility audit).*
