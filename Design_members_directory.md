# Members Directory — Design Brief
**Route:** `/members/directory`  
**Auth:** members only — guests are redirected to `/members` (the conversion page)  
**Status:** ready to design / pre-build

---

## 1. Purpose & context

The directory is the social layer of FRA. Once a member has built their profile they need to be able to find collaborators, scope the talent pool, and understand who else is in the room. It is not a job board. It is not a feed. It is a curated, searchable register.

**Who lands here:**
- A logged-in member navigating away from their own profile (the primary flow)
- A logged-in member clicking "Members" in the top nav
- A logged-in member following the breadcrumb from any profile page

**Who never lands here:**
- Guests — they hit `/members` (conversion page) instead
- The directory URL is not indexed or linked from any public page

---

## 2. Route & redirect logic

| Visitor | Hits `/members` | Hits `/members/directory` |
|---|---|---|
| Guest | Sees conversion page | Redirect → `/members` |
| Logged-in member | Redirect → `/members/directory` | Sees the directory |

The breadcrumb on all `/members/[username]` profile pages changes from linking to `/members` to linking to `/members/directory` once a member is signed in.

---

## 3. Design system — tokens

All colours, surfaces, and type must use these tokens. Do not introduce new values.

### Colour
| Token | Hex | Use |
|---|---|---|
| `--background` | `#09090b` | Page background |
| `--surface` | `#111113` | Card backgrounds |
| `--surface-raised` | `#18181b` | Hover states, elevated elements |
| `--foreground` | `#fafafa` | Primary text |
| `--foreground-secondary` | `rgba(250,250,250,0.55)` | Body copy, descriptions |
| `--foreground-tertiary` | `rgba(250,250,250,0.35)` | Labels, metadata, placeholders |
| `--border` | `rgba(255,255,255,0.08)` | Card borders |
| `--border-strong` | `rgba(255,255,255,0.16)` | Hover borders, dividers |

### Brand colours
| Role | Hex | Tailwind ref | Use on this page |
|---|---|---|---|
| Primary (blue) | `#3b82f6` | `blue-500` | Individual tier accents, search ring, active filter |
| Accent (amber) | `#f59e0b` | `amber-500` | Business tier accents, founding badge |
| Success (green) | `#22c55e` | `green-500` | "Available" dot |
| Urgent (red) | `#ef4444` | `red-500` | "Busy" dot |

### Typography
| Face | Variable | Use |
|---|---|---|
| Outfit | `--font-heading` / `.font-heading` | Section titles, card names, large numerics |
| Inter | `--font-sans` | All UI, body copy, labels |
| System mono | `font-mono` | Years, IDs, member numbers, counts |

### Spacing & radius
- Page container: `max-w-screen-xl mx-auto px-4` (matches the rest of the site)
- Card radius: `rounded-xl` (12px) — same as member profile cards and tier comparison cards
- Pill radius: `rounded-lg` (8px)
- Top nav height: `64px` — sticky content must offset by at least this

---

## 4. Section anatomy (site-wide pattern — use consistently)

Every content section on the site follows this three-part header. Use it here too.

```
────────────────────  ← .section-rule .section-rule-[colour]  (1px line)
RUBRIC TEXT           ← .section-rubric  (11px / uppercase / 0.4 opacity / Outfit)
Section heading       ← font-heading, bold, large
```

Colour modifier picks:
- `section-rule-primary` (blue) — individual-oriented sections
- `section-rule-accent` (amber) — business-oriented or featured sections  
- `section-rule-muted` (`rgba(255,255,255,0.16)`) — neutral / utility sections

---

## 5. Page anatomy

```
┌─────────────────────────────────────────────────────┐
│  Fixed site nav (64px)                              │
├─────────────────────────────────────────────────────┤
│  Page header                                        │
│    Rubric: "Members directory"                      │
│    Headline: "The room."  (Outfit 800, large)       │
│    Subline: member count + discipline count         │
├────────────────┬────────────────────────────────────┤
│  Filter rail   │  Member grid                       │
│  (260px fixed) │  (fills remaining width)           │
│                │                                    │
│  Search        │  Card  Card  Card                  │
│  ──────        │  Card  Card  Card                  │
│  Tier          │  Card  Card  Card                  │
│  Discipline    │  ...                               │
│  Country       │                                    │
│  Availability  │                                    │
│                │                                    │
└────────────────┴────────────────────────────────────┘
```

**Mobile:** filter rail collapses into a horizontal scrollable pill row above the grid. Grid drops to 1 column (≤ 480px) or 2 columns (481–768px).

---

## 6. Page header

Sits below the nav, above the filter + grid. Matches the masthead style used on `/members` and profile pages.

- Top rule: thin white line (`--border-strong`)
- Rubric: `MEMBERS DIRECTORY` — `.section-rubric`
- Headline: `"The room."` — Outfit 800, ~`text-5xl md:text-7xl`, tight tracking
- Subline beneath: `{n} members across {countries} countries` — Inter, `--foreground-secondary`
- Right-aligned on desktop: a live count pill — `{n} members` in blue, `{b} businesses` in amber, displayed as small inline-flex badges

---

## 7. Filter rail (desktop sidebar, 260px)

Background: `--background` (not a card — it reads as part of the page, not an elevated panel).  
Sticky: `top: 80px` (clears the nav).

### Search input
- Full-width text input, same style as all other inputs in the app:  
  `background: rgba(255,255,255,0.04)` · `border: 1px solid rgba(255,255,255,0.12)` · `border-radius: 10px` · `padding: 11px 14px`
- Placeholder: `Search by name, discipline, country…`
- On focus: blue ring (`box-shadow: 0 0 0 2px rgba(59,130,246,0.4)`)
- No search button — live filter on keystroke (debounced 150ms)

### Filter sections
Each filter group follows the section anatomy: section-rule-muted → rubric → options.

**Tier** (radio — one at a time)
- All · Individual · Business
- Selected: filled pill `bg-primary text-white` (Individual) or `bg-accent text-black` (Business)
- Unselected: ghost pill `border border-white/12 text-foreground-secondary`

**Availability** (checkbox — multiple)
- Available · Selective · Unavailable
- Each with a coloured dot matching the profile page dots (green / amber / red)

**Discipline** (checkbox — multiple, collapsed to top 8 with "Show more")
- Pulled from actual data — not hardcoded
- Alphabetical, Inter 13px

**Country** (checkbox — multiple, collapsed to top 6 with "Show more")
- Same pattern as Discipline

**Active filter summary**
- When any filter is active, show a subtle "Clear all" text link (`--foreground-tertiary`, 12px) above the grid — not in the rail
- Each active filter also shows as a dismissible pill in the same area

---

## 8. Member cards

The grid is the core of the page. Each card represents one member. Cards are compact — they show enough to intrigue, not enough to replace the profile.

### Grid layout
- Desktop: 3 columns, `gap-4`
- Tablet (768–1024px): 2 columns
- Mobile: 1 column

### Card — Individual tier

```
┌───────────────────────────────────────┐
│  [Avatar 48px circle]  ●  [Avail dot] │  ← right-aligned dot
│                                       │
│  Full Name            [Individual]    │  ← tier badge top-right
│  Tagline                              │
│                                       │
│  [Discipline] [Discipline]            │
│                                       │
│  Lagos, Nigeria      Member since '26 │  ← footer row
└───────────────────────────────────────┘
```

- Card container: `background: var(--surface)` · `border: 1px solid var(--border)` · `border-radius: 12px` · `padding: 18px`
- Hover: border lifts to `--border-strong`, subtle `background: var(--surface-raised)` — no box-shadow, no lift transform
- **Avatar:** 48px circle. Fallback: initial letter on `rgba(59,130,246,0.15)` background (matching profile page)
- **Availability dot:** 8px circle, right-aligned in the avatar row. Colours: `#22c55e` (available) / `#ef4444` (busy) / `#f59e0b` (selective). No pulse animation on the card — pulse is reserved for the full profile page
- **Name:** Outfit 700, 16px, `--foreground`
- **Tagline:** Inter 13px, `--foreground-secondary`, italic, max 1 line (`text-ellipsis overflow-hidden whitespace-nowrap`)
- **Tier badge:** top-right, `Individual` — `text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400`
- **Discipline pills:** up to 3, then `+N more`. Same blue pill style as profile page — `border-blue-500/25 text-blue-300 bg-blue-500/10`
- **Footer row:** `--foreground-tertiary`, 11px, uppercase, mono. City + Country left · `Member since 'YY` right

### Card — Business tier

Same structure, amber colour scheme throughout:
- Border on hover: `rgba(245,158,11,0.2)`
- **Logo:** 48px square (not circle), `border-radius: 10px`. Fallback: initial letter on `rgba(245,158,11,0.1)` background
- **Tier badge:** `Business` — `bg-amber-500/10 border-amber-500/20 text-amber-400`
- **Discipline pills → Specialism pills:** amber style — `border-amber-500/25 text-amber-300 bg-amber-500/10`
- Replace "Member since" with "Est. YYYY" (founded year, if set) or "Joined 'YY" as fallback
- No availability dot — Business members are always "open to projects". Show a small green `●` + `Open to projects` text instead, bottom-left, `text-green-400 text-[11px]`

### Card states

**Loading:** skeleton version of the card — grey shimmer blocks where avatar, name, tagline, and pills would be. Use `animate-pulse` (Tailwind). Same card dimensions.

**No results:** centred in the grid area. Icon (faint, ~32px), heading `"Nobody matching that filter"`, subline `"Try broadening your search or clearing a filter."` No illustration — text only.

**Founding member:** for members where `founding_member_lock = true`, add a tiny amber `★` icon in the top-left corner of the card. No tooltip needed — it reads as a mark of distinction.

---

## 9. Card interaction

Clicking anywhere on a card navigates to `/members/[username]`. The entire card is the tap target — no separate "View profile" button on the card. Use `cursor: pointer` on the card wrapper.

The card does not open a modal. Full-page navigation only.

---

## 10. Auth gate

If an unauthenticated user somehow reaches `/members/directory`, the server redirects them to `/members`. There is no in-page gate — this is handled entirely server-side. No "lock" overlay, no blurred grid on this route.

---

## 11. Empty directory state

If the directory has zero active members (edge case — only possible before launch):
- Show the rubric + headline
- Below: `"No members yet — check back soon."` in `--foreground-tertiary`
- No illustration

---

## 12. Member count strip (optional — above grid, below header)

A single horizontal strip showing aggregate stats. Minimal, not a dashboard.

```
[ 24 Members ]   [ 18 Individuals ]   [ 6 Businesses ]   [ 9 Countries ]
```

- Each: `--surface` background, `border: var(--border)`, `rounded-xl`, `padding: 12px 20px`
- Number: Outfit 700, 24px, `--foreground`
- Label: 10px, uppercase, `--foreground-tertiary`
- 4-column grid desktop / 2×2 mobile

---

## 13. Breadcrumb update

On all `/members/[username]` profile pages (both Individual and Business), the breadcrumb currently reads:

`Home / Members / Name`

Where "Members" links to `/members`.

**Change:** when a user is logged in, "Members" in the breadcrumb should link to `/members/directory`. When logged out, it stays as `/members`. The profile page server component already knows `isOwner` — it can pass the same session signal to the breadcrumb.

---

## 14. Nav update

The "Members" nav link currently always points to `/members`.

**Change:** logged-in members see "Members" point to `/members/directory`. This is a client-side change in `Header.tsx` — the header already fetches the member session and knows auth state. Add a computed `membersHref` that resolves to `/members/directory` when `member` is non-null, `/members` when null.

---

## 15. What this page is not

- Not a feed or activity stream
- Not sortable by "most recent" or "most active" — this is a directory, not a ranking
- No follow / connect buttons on the card — contact goes through the full profile page
- No pagination numbers — use infinite scroll or a "Load more" button (preference TBD; "Load more" recommended for SEO-neutral pages behind auth)
- No map view (out of scope for v1)
