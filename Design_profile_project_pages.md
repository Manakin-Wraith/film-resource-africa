# Film Resource Africa — Design Profile: Project Pages

**For:** Design Team  
**Purpose:** Reference guide for designing new pages that are visually consistent with the existing site  
**Stack:** Next.js App Router · Tailwind CSS v4 · Framer Motion · Lucide Icons

---

## 1. Design Character

The site reads as a **dark editorial publication** — think print magazine meets modern SaaS dashboard. It is dense with information but avoids clutter through strong typographic hierarchy, restrained colour, and generous whitespace between sections. The tone is professional and purposeful; every visual decision serves the African film community audience.

Key qualities to preserve on any new page:
- Information-first — no decorative chrome for its own sake
- Editorial rhythm — sections are clearly demarcated with ruled lines and rubrics
- Colour used sparingly as status signals (never purely decorative)
- Near-black backgrounds; white text at varying opacities for hierarchy

---

## 2. Colour Tokens

These are the exact values defined in `globals.css`. Use them by name, not by hex — it keeps pages consistent if tokens ever change.

### Surface & Background

| Token | Hex | Use |
|---|---|---|
| `--background` | `#09090b` | Page background (body) |
| `--surface` | `#111113` | Card & panel backgrounds |
| `--surface-raised` | `#18181b` | Elevated elements inside cards (info rows, sub-panels) |

### Text

| Token | Value | Use |
|---|---|---|
| `--foreground` | `#fafafa` | Primary text — headings, labels |
| `--foreground-secondary` | `rgba(250,250,250,0.55)` | Body copy, descriptions |
| `--foreground-tertiary` | `rgba(250,250,250,0.35)` | Captions, metadata, placeholders |

### Borders

| Token | Value | Use |
|---|---|---|
| `--border` | `rgba(255,255,255,0.08)` | Default dividers and card borders |
| `--border-strong` | `rgba(255,255,255,0.16)` | Hover-state borders, focus rings |

### Brand / Semantic Colours

| Name | Hex | Use |
|---|---|---|
| Primary (blue) | `#3b82f6` | CTAs, active nav, links, primary buttons |
| Accent (amber) | `#f59e0b` | Deadlines, datelines, editorial highlights |
| Urgent (red) | `#ef4444` | Closing-soon alerts, critical deadlines |
| Success (green) | `#22c55e` | Confirmed states, free-entry badges |

### Category Colour System

Each opportunity category has its own full colour set. Use these consistently if new pages reference categories.

| Category | Icon Colour | Bg / Border | Border-left accent |
|---|---|---|---|
| Funds & Grants | `text-green-400` | `bg-green-500/10 border-green-500/20` | `border-l-green-500` |
| Labs & Fellowships | `text-blue-400` | `bg-blue-500/10 border-blue-500/20` | `border-l-blue-500` |
| Markets & Pitching | `text-amber-400` | `bg-amber-500/10 border-amber-500/20` | `border-l-amber-500` |
| Festivals | `text-rose-400` | `bg-rose-500/10 border-rose-500/20` | `border-l-rose-500` |
| AI & Emerging Tech | `text-purple-400` | `bg-purple-500/10 border-purple-500/20` | `border-l-purple-500` |

---

## 3. Typography

Two typefaces from Google Fonts, loaded as CSS variables.

| Variable | Family | Role |
|---|---|---|
| `--font-sans` → `var(--font-inter)` | Inter | Body copy, UI labels, captions |
| `--font-heading` → `var(--font-outfit)` | Outfit | All headings and display text |

### Type Scale in Use

| Element | Size | Weight | Font | Notes |
|---|---|---|---|---|
| Hero / Page H1 (homepage) | `88px` (desktop) / `52px` (mobile) | `extrabold` (800) | Outfit | `tracking-tight`, `leading-[1.02]` |
| Page H1 (inner pages) | `38–42px` (desktop) / `28px` (mobile) | `bold` (700) | Outfit | `leading-[1.08]` |
| Section heading H2 | `26–34px` | `bold` | Outfit | |
| Card heading H3 | `16–21px` | `bold` | Outfit | `leading-snug` |
| Body / description | `14–15px` | `400` | Inter | `leading-relaxed` |
| Small body | `13px` | `400` | Inter | |
| Section rubric | `11px` | `600` | Inter | `uppercase`, `tracking-[0.12em]`, opacity 40% |
| Editorial label | `11px` | `600` | Inter | `uppercase`, `tracking-[0.1em]`, opacity 55% |
| Caption / metadata | `10–11px` | `bold` | Inter | `uppercase tracking-widest` |
| Nav links | `13px` | `500` (inactive) / `600` (active) | Inter | |

---

## 4. Layout & Grid

### Container
```
max-width: container (Tailwind default ~1280px)
padding: px-4 (16px each side)
```

Inner pages use an additional content-width constraint: `max-w-3xl` (prose/article) or `max-w-5xl` (listings/grid).

### Page Shell
- Fixed header: `64px` tall (site nav)
- Mobile tab bar: `72px` at bottom (mobile only, hidden on `md:`)
- Page wrapper: `pt-[64px] pb-[72px] md:pb-0`
- Main page content padding: `pt-8 pb-0 md:pt-12`

### Grid Patterns

| Pattern | Usage |
|---|---|
| `grid-cols-1 md:grid-cols-2 gap-4` | Cards grid (spotlight, news secondary) |
| `grid-cols-1 md:grid-cols-3 gap-3` | Related items, compact card rows |
| `grid-cols-1 md:grid-cols-4 gap-10` | Footer layout |
| `md:grid-cols-[1fr_320px] md:gap-16` | Hero split (headline left, CTA right) |
| `grid-cols-1 sm:grid-cols-2 gap-3` | Info panels inside modals |

### Horizontal Scroll Rows
Opportunity cards use a horizontal scroll row:
- `flex gap-6 overflow-x-auto pb-4 -mx-4 px-4`
- `snap-x snap-mandatory` for touch snapping
- Cards: `min-w-[320px] max-w-[360px] flex-shrink-0 snap-start`

---

## 5. Section Anatomy

Every content section follows the same editorial pattern. This must be consistent on new pages.

```
┌─────────────────────────────────────┐
│  [1px rule — coloured by section]   │  .section-rule + modifier
│  SECTION RUBRIC                     │  .section-rubric (11px uppercase)
│  Section Heading                    │  h2 font-heading
│  Optional sub-copy                  │  foreground-secondary
│  ─────────────────────────────────  │  Optional lower rule (border)
│  Content                            │
└─────────────────────────────────────┘
```

**Section rule colour modifiers:**
- `.section-rule-urgent` — red (`#ef4444`)
- `.section-rule-accent` — amber (`#f59e0b`)
- `.section-rule-primary` — blue (`#3b82f6`)
- `.section-rule-success` — green (`#22c55e`)
- `.section-rule-muted` — `rgba(255,255,255,0.16)`

Between sections, use `mt-14 md:mt-20` for vertical rhythm.

---

## 6. Card Component

Cards are the primary unit of content display.

### Base Card Styles
```
background: var(--surface)
border: 1px solid rgba(255,255,255,0.08)
border-radius: 12px (rounded-xl)
```

**Hover state:**
```
border-color: rgba(255,255,255,0.16)
```

**Opportunity cards** add a 3px coloured left border using the category accent colour.

### Card Internal Anatomy
1. **Visual header** — OG image or logo + gradient overlay (h-40 to h-64)
2. **Badges row** — status pill + category pill (10px, uppercase, `rounded-lg`)
3. **Heading** — Outfit bold, hover → `text-primary`
4. **Body copy** — `foreground/60`, `line-clamp-2`
5. **Footer row** — deadline (amber + Calendar icon) | external link icon

### Info Panel (inside modals / detail views)
```
background: var(--surface-raised)
border: 1px solid rgba(255,255,255,0.08)
border-radius: 12px
padding: 16–20px
```
Label: `10px bold uppercase tracking-widest foreground-tertiary`  
Value: `14px font-semibold foreground`

---

## 7. Badges & Chips

All badges share this base structure: small, rounded-lg, uppercase, with a semi-transparent coloured background.

```
px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border
```

**Status variants:**
- Open: `bg-green-500/20 border-green-500/30 text-green-400`
- Closing Soon: `bg-red-500/20 border-red-500/30 text-red-400`
- Upcoming: `bg-blue-500/20 border-blue-500/30 text-blue-400`
- NEW: gradient `from-blue-500/20 to-purple-500/20 border-purple-500/30 text-purple-300`
- UPDATED: `bg-amber-500/20 border-amber-500/30 text-amber-300`

**Urgent countdown strip** (when deadline < 7 days):
- Critical: `bg-red-500/20 text-red-400 border-b border-red-500/20`
- Warning: `bg-amber-500/20 text-amber-400 border-b border-amber-500/20`
- Full-bleed strip inside card, `text-xs font-bold tracking-wide text-center`

---

## 8. Buttons

| Type | Classes | Use |
|---|---|---|
| Primary | `bg-primary hover:bg-blue-600 text-white font-bold rounded-xl px-8 py-3.5 text-sm` | Main CTA (Apply Now, Subscribe) |
| Ghost / Outline | `border border-white/[0.2] text-foreground hover:bg-white/[0.06] rounded-lg px-4 py-2 text-[13px] font-semibold` | Secondary actions (Submit, Share) |
| Icon button | `w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full border border-white/10` | Close, Share in modals |
| Text link | `text-primary hover:text-blue-400 font-semibold text-sm` | "All news →", "View more" |

Button minimum touch target on mobile: `min-h-[48px]`.

---

## 9. Form Elements

### Text Input
```
background: var(--surface-raised)
border: 1px solid rgba(255,255,255,0.12)
border-radius: 12px (rounded-xl)
padding: px-4 py-3
font-size: 14px
color: var(--foreground)
placeholder: foreground/30

focus: outline-none, border-primary/50
```

### Textarea / Select
Same treatment as text input. Consistent `rounded-xl` radius throughout.

---

## 10. Modals & Overlays

Modals use the `.glass-panel` / `.glass-card` pattern and Framer Motion for animation.

**Backdrop:** `bg-black/60 backdrop-blur-sm`

**Modal panel:**
```
background: var(--surface)
border: 1px solid rgba(255,255,255,0.12)
```
- Desktop: `max-w-4xl rounded-2xl`, entry animation `scale: 0.9 → 1, opacity: 0 → 1`
- Mobile: `rounded-t-[2rem]`, slides up from bottom (`y: 100% → 0`), drag-to-dismiss

**Glass card** (for secondary panels, not page wrappers):
```
background: rgba(25,25,25,0.6)
backdrop-filter: blur(16px)
border: 1px solid rgba(255,255,255,0.08)
box-shadow: 0 4px 30px rgba(0,0,0,0.1)
```

---

## 11. Navigation

### Top Header (fixed, 64px)
- Background: `var(--surface)` with `border-b border-white/[0.08]`
- Logo: 24×24 icon + "Film Resource Africa" in Outfit bold 15px
- Nav links: 13px Inter, inactive = `foreground-secondary`, active = `foreground font-semibold`
- Submit CTA: ghost outline button (desktop only)

### Mobile Tab Bar (fixed bottom)
- 5 tabs: Home, Directory, News, Call Sheet, Industry
- Active indicator: `2px blue line above icon` + `text-primary` label
- Inactive: `foreground/35`, icon `strokeWidth: 1.5`
- Active: `foreground`, icon `strokeWidth: 2.5`
- Auto-hides on scroll down, reappears on scroll up

### Breadcrumbs
Displayed below header on inner pages. Text links separated by `/` chevron. Last item is non-linked current page. Font: 13px Inter, `foreground-secondary`.

---

## 12. Special Textures & Effects

### Film Grain (`.film-grain::before`)
A subtle static SVG noise overlay applied to full-page hero elements at `opacity: 0.15`. Disabled for users with `prefers-reduced-motion`. Do not apply to card interiors.

### Sponsor Ticker
Continuous horizontal scroll animation (30s linear infinite) for partner logos. Used once per page, typically below the page masthead.

### Hover Lift
Cards and related-item links use `hover:-translate-y-0.5` for a subtle lift effect.

### Transitions
Default: `transition-all duration-300` on cards, `transition-colors` on text links and buttons. Framer Motion spring: `damping: 30, stiffness: 300`.

---

## 13. Icon System

**Lucide React** is the only icon library. Always use inline SVG at the sizes below:

| Context | Size |
|---|---|
| Body / card icons | 14–16px |
| Badge / chip icons | 9–12px |
| Button icons | 14–18px |
| Modal action buttons | 18–20px |
| Mobile tab bar | 22px |
| Section heading icons | Varies (typically 20–24px) |

Icons are `stroke` based. Active nav icons use `strokeWidth: 2.5`; inactive use `strokeWidth: 1.5`.

---

## 14. Responsive Breakpoints

Tailwind default breakpoints apply. Key patterns:

| Breakpoint | Behaviour |
|---|---|
| `< md (768px)` | Single column, mobile tab bar visible, header hamburger menu |
| `md+` | Multi-column grids, desktop nav, mobile tab bar hidden |
| Touch targets | All interactive elements `min-h-[44px]` on mobile |

---

## 15. Editorial Datelines & Metadata Display

The site uses two recurring patterns for time/date display:

**`.editorial-dateline`** — amber (`#f59e0b`), 13px, for deadline and publication dates  
**`.editorial-label`** — 11px, uppercase, 55% opacity, for category rubrics on cards

Publication dates are always formatted `day month year` (e.g. "6 May 2026") using `en-GB` locale.

Relative dates (e.g. "3 days ago") are used for news items, formatted by the `RelativeDate` component.

---

## 16. Empty States

When a section has no content, use a centred empty state:
- Muted icon at 28–32px, `opacity-50`, category accent colour
- Bold heading `17px` Outfit
- Body copy `14px foreground-secondary`
- Contained in a `rounded-xl border border-white/[0.08]` panel with `surface` background
- Padding: `py-14`

---

## Key Design Rules — Summary

1. **Dark-mode only.** No light mode. Backgrounds are `#09090b` / `#111113` / `#18181b`.
2. **Outfit for headings, Inter for everything else.** Never mix.
3. **Blue (`#3b82f6`) is the only primary action colour.** Amber is for editorial/deadline signalling only, not actions.
4. **`rounded-xl` everywhere.** Cards, inputs, buttons, badges — the site does not use square corners or `rounded-full` on content elements (only icon buttons).
5. **Section rules always come first.** Every new content section must open with a 1px rule + section rubric before the heading.
6. **Glass effects are modal-only.** Do not apply `glass-card` to page-level sections or cards.
7. **Colour encodes status.** Don't use category colours (green/amber/rose/purple) outside their semantic meaning.
8. **Minimum 44px touch targets** on all mobile-interactive elements.
9. **Never centre-align body copy** — only hero headings on mobile use centred alignment. Cards and sections are always left-aligned.
10. **`container mx-auto px-4`** on all page wrappers. Never full-bleed content without this wrapper.
