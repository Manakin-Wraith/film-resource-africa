# Film Resource Africa — Design Brief: Members Section

**For:** Design Team  
**Companion doc:** `Design_profile_project_pages.md` — base design system (colours, typography, layout, components). Read that first. This document only covers what is *new or specific* to the Members section.  
**Scope:** Four pages — Members Hub · Individual Profile (view + edit mode) · Business Profile (view + edit mode) · Members Directory browse  
**Out of scope this iteration:** Team/employee listing on Business profiles · Financier self-serve tier

---

## 1. Section Overview — What These Pages Do

The Members section is a **two-mode experience** depending on auth state.

| Visitor | What they see |
|---|---|
| Guest (not logged in) | Conversion page — tier comparison, founding member counter, teased directory, CTAs to join |
| Logged-in member (viewing their own profile) | Profile in edit mode — all fields unlocked, completeness indicator visible |
| Logged-in member (viewing another member) | Profile in view mode — read-only, contact CTA visible |
| Logged-in member (viewing the directory) | Full member browse with filters |

The "Members" nav button always resolves to `/members`. Auth state determines what renders — it is never a separate route for the logged-in view.

---

## 2. New Design Tokens — Members Section Only

These extend the base design system. Do not use them outside the Members section.

### Availability Status Colours

Availability is the highest-priority signal on an Individual profile. It must be immediately readable.

| Status | Colour | Token reference |
|---|---|---|
| Available | `#22c55e` (success green) | `--color-success` |
| In Production | `#f59e0b` (accent amber) | `--color-accent` |
| Not Taking Work | `rgba(250,250,250,0.35)` (foreground-tertiary) | `--foreground-tertiary` |

### Tier Badge Colours

| Tier | Label | Colour treatment |
|---|---|---|
| Individual | `INDIVIDUAL` | Blue — `bg-blue-500/10 border-blue-500/20 text-blue-400` |
| Business | `BUSINESS` | Amber — `bg-amber-500/10 border-amber-500/20 text-amber-400` |
| Founding Member | `FOUNDING MEMBER` | Gold gradient — `bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-500/30 text-yellow-300` |

### PRS Score Band Colours

| Band | Score | Colour |
|---|---|---|
| Production Ready | 20–25 | Green — `text-green-400 bg-green-500/10 border-green-500/20` |
| Funding Ready | 15–19 | Blue — `text-blue-400 bg-blue-500/10 border-blue-500/20` |
| Development Stage | 10–14 | Amber — `text-amber-400 bg-amber-500/10 border-amber-500/20` |
| Early Concept | 0–9 | Muted — `text-foreground/40 bg-white/5 border-white/10` |

---

## 3. New Components — Members Section Only

### 3.1 Availability Badge

Used at the top of every Individual profile. Must be one of the three states above.

```
┌─────────────────────────────────────┐
│  ● Available                        │
│  (10px dot + 11px label, uppercase) │
└─────────────────────────────────────┘
```

- Dot: `w-2 h-2 rounded-full` in the status colour, with a matching `animate-pulse` glow ring when Available
- Label: `11px font-bold uppercase tracking-wider` in the status colour
- Always sits top-left of the profile header, below the tier badge
- In edit mode: clicking it opens a 3-option inline dropdown (no modal)

### 3.2 Founding Member Badge

Permanent identity mark. Appears on every profile that has `founding_member = true`.

- Two parts: `FOUNDING MEMBER` chip (gold gradient, same spec as tier badge) + `#N` member number in muted foreground-tertiary
- Example: `⬡ FOUNDING MEMBER  #3`
- The member number is the unique identifier — design it with weight, like a jersey number
- Small: sits in the badge row on the profile header and on directory cards
- Never removed once set — this is a permanent record, not a status

### 3.3 Profile Completeness Bar (Edit Mode Only)

Shown only when a member is viewing their own profile in edit mode.

```
Profile completeness  ████████████░░░░  72%
                      "Add a headshot to reach 85%"
```

- Thin progress bar: `h-1 rounded-full bg-surface-raised` with fill in `bg-primary`
- Percentage label: `11px font-bold text-foreground`
- Next action prompt: `11px foreground-secondary` — one specific field nudge, not a list
- Positioned at the very top of the edit mode panel, above all other fields
- Disappears at 100% (or at 90%+ to avoid chasing perfection — decide which)

### 3.4 "Contact via FRA" Button (Individual profiles only)

This is a **mediated enquiry** — not a direct contact. The design must communicate this clearly.

```
┌─────────────────────────────────┐
│  Enquire via FRA                │  Primary button style (blue bg)
│  "We'll be in touch within 48h" │  12px caption below, muted
└─────────────────────────────────┘
```

- Button: full primary button spec from base design system
- Caption below: `12px foreground-tertiary`, sets the expectation
- Do NOT use "Contact" or "Message" — those imply a direct connection
- On Business profiles: replace entirely with direct contact fields (email, website). No caption needed.

### 3.5 Edit Field — Inline Edit Pattern

When viewing own profile (edit mode), every editable field gets an edit affordance. Pattern:

- Field renders as normal read-only text
- On hover: a faint `Edit` label appears top-right of the field's bounding box (`11px text-primary`)
- On click: field transforms into the appropriate input (text, textarea, dropdown, tag selector)
- Save on blur or on explicit "Save" button for longer fields
- Cancel with Escape
- No separate "Edit Profile" page — everything is inline

This keeps the page readable in both modes without a jarring layout shift.

### 3.6 PRS Project Card

Used on both Individual and Business profiles. Compact card that links to the full project page.

```
┌────────────────────────────────────────────┐
│  ● PRODUCTION READY   21/25                │  ← score band badge + score
│  Project Title Here                        │  ← 15px font-heading bold
│  Feature Film · Drama · South Africa       │  ← 11px editorial-label muted
│  Looking for: DoP · Line Producer          │  ← roles needed (amber, 12px)
│  ─────────────────────────────────────────  │
│  [Request Introduction →]  [View Project]  │  ← CTAs  (financier / member)
└────────────────────────────────────────────┘
```

- Width: full-width within its column on desktop, full-width on mobile
- Background: `var(--surface-raised)`, border `border-white/[0.08]`, `rounded-xl`
- "Roles needed" row: only shown if roles are listed. Amber `text-accent`, `12px`
- "Request Introduction" CTA: only visible to logged-in members (gated)
- Score and pathway are visible to all logged-in members; pitch deck link is not shown here — visible only on the full project page to verified financiers
- Members who own the project see an "Edit Project" link instead of the CTAs

### 3.7 Role / Discipline Tag

A compact tag used to display a member's roles and skills. Not a badge — no border, lighter treatment.

```
Director  ·  Screenwriter  ·  Cinematographer
```

- `text-[13px] font-medium foreground-secondary`
- Dots as separators, not pills — keeps it clean in the profile header
- On the directory card, collapse to first 2 roles with `+N more` if there are many

### 3.8 Directory Member Card

The card used in the directory browse grid (`/members/directory`).

```
┌───────────────────────────────────────────┐
│  [AVATAR]  Full Name              ● Avail │
│            Director · Screenwriter        │
│            Lagos, Nigeria                 │
│            ──────────────────────────     │
│            [FOUNDING #2]  [INDIVIDUAL]    │
└───────────────────────────────────────────┘
```

- Avatar: `w-10 h-10 rounded-xl` — headshot or initials fallback (see §5)
- Availability dot: `w-2 h-2 rounded-full` top-right, colour-coded
- Name: `15px font-heading font-bold`
- Role/discipline: `12px foreground-secondary`
- Location: `11px foreground-tertiary`
- Badges: founding member + tier, compact size
- Card: same base card spec as the rest of the site — `surface` bg, `border-white/[0.08]`, `rounded-xl`, hover lifts border to `border-white/[0.16]`
- On click: goes to the member's profile page (view mode)

Business member cards have a logo in place of the avatar and show company type instead of discipline.

---

## 4. Page Anatomy

### 4.1 Members Hub — `/members`

**For guests (not logged in):**

```
── SECTION RULE (accent / amber) ──
MEMBERS
The participant seat.
"Subscribers read about opportunities. Members act on them."

[FOUNDING MEMBER COUNTER]
47 / 100 founding spots taken  ████████████░░░░░░░░  (live bar)
Price locked for life at founding rate.

── TIER COMPARISON TABLE ──
Two columns: Individual R99/m | Business R225/m
Benefits listed, CTA buttons below each

── TEASED DIRECTORY PREVIEW ──
section-rule (muted)
"WHO'S ALREADY HERE"
Grid of ~6 member cards — overlaid with blur/lock treatment
Lock overlay text: "Members-only directory — join to see and be seen"
[Become a member →]

── WHAT THE PRS DOES ──
section-rule (primary / blue)
"LIST YOUR PROJECT. GET YOUR SCORE. GET MATCHED."
Short explainer of the two-gate system (narrative + compliance)
Side-by-side: narrative gate card | compliance gate card
CTA: [Submit a project →]

── FOUNDING MEMBERS ──
section-rule (accent)
"THE FIRST 100"
Link to /founding-members with counter
```

**For logged-in members:**

The hub becomes a minimal dashboard — not a complex page.

```
── Welcome back, [Name] ──
Profile completeness bar (if < 90%)
Quick links:
  [View my profile]  [Browse directory]  [Add a project]
Recent activity: last enquiry received, last opportunity matched (future)
```

Keep this tight — logged-in members navigate via the bar, not this page.

---

### 4.2 Individual Profile Page — `/members/[username]`

**View mode (other member's profile):**

```
── PROFILE HEADER ──
[AVATAR 80px]  Full Name
               ● Available  (availability badge)
               Director · Screenwriter  (role tags)
               Lagos, Nigeria
               [FOUNDING #2]  [INDIVIDUAL]  (tier + founding badges)

── BIO ──
section-rule (muted)
Free text, 150-word max, foreground-secondary
Member since [Month Year]

── CREDITS ──
section-rule (muted)
FILMOGRAPHY
List: Title · Role · Year · Format (Film / Series / Doc / Short)
IMDb link if available  [↗ IMDb]
Reel link if available  [▶ Watch reel]

── LANGUAGES + TRAVEL ──
section-rule (muted)
Two-col: Languages spoken | Travel availability
11px uppercase label, 13px value

── PROJECTS ──
section-rule (primary)
PROJECTS
PRS project cards (if member has opted to show them)
[See all projects →] if more than 2

── CONTACT ──
section-rule (muted)
[Enquire via FRA]
"We'll be in touch within 48 hours."
```

**Edit mode (viewing own profile — logged in):**

Same layout. Key differences:

- **Profile completeness bar** appears at very top, above everything
- Each section has an edit affordance on hover (inline edit pattern — see §3.5)
- Avatar has an upload overlay on hover: camera icon + "Change photo"
- Availability badge is tappable/clickable — opens 3-state inline toggle
- "Add a credit" button after the filmography list
- "Add a project" button after the projects section
- Footer: `[Preview public profile]` link — shows how the profile looks to other members
- No "save" button at page level — each field saves on blur

---

### 4.3 Business Profile Page — `/companies/[slug]`

**View mode:**

```
── COMPANY HEADER ──
[LOGO 80px]  Company Name
             Production House  (company type tag)
             Cape Town, South Africa
             [BUSINESS]  [FOUNDING #4]  (tier + founding badges if applicable)
             [↗ Website]  (direct link — business members own the relationship)

── ABOUT ──
section-rule (muted)
Company bio, 250-word max

── SERVICES ──
section-rule (muted)
WHAT WE DO
Structured service tags — pill style, same tag spec as role tags
Example: Documentary Production · Commercials · Post Production · Fixing

── NOTABLE PRODUCTIONS ──
section-rule (muted)
3-column grid of production cards
Each: Title · Year · Format
Simple — no PRS score here unless project is listed

── PROJECTS ──
section-rule (primary)
PROJECTS
PRS project cards — same component as Individual profiles

── CONTACT ──
section-rule (muted)
Direct contact block — email, phone (if opted in), website
No "via FRA" mediation — business members own every relationship
[Send enquiry →] opens a mailto: or native contact form, not mediated
```

**Key visual distinction from Individual profile:**
- Logo replaces avatar (wider aspect ratio allowed — logo lockup)
- "Website" link is prominent in the header (direct relationship)
- No availability status — companies don't go "In Production"
- No IMDb / personal credits — company has productions, not personal filmography
- Contact is unmediated — this must be visually different from the Individual CTA

**Edit mode (viewing own company profile):**
Same inline edit pattern as Individual. Additional edit zones:
- Services: tag picker (add/remove service tags from a controlled list)
- Productions: `+ Add production` inline form
- Logo: upload overlay on hover

---

### 4.4 Members Directory — `/members/directory`

**Access:** Logged-in members only. Guests who land here see a gate: "This directory is for members only" + CTA.

**Layout:**

```
── DIRECTORY HEADER ──
section-rule (muted)
MEMBERS DIRECTORY
[N] members  ·  [N] companies

── FILTERS (sticky top bar below site header) ──
Role ▾   Country ▾   Availability ▾   Tier ▾   [Search…]
Active filter chips appear below the bar when filters are set

── RESULTS GRID ──
3-col desktop / 2-col tablet / 1-col mobile
Directory member cards (see §3.8)

── PAGINATION / LOAD MORE ──
"Load more" button (not numbered pagination — feels more like a community)
```

**Filter behaviour:**
- Filters are additive (AND logic)
- Active filter chips: `bg-primary/20 border-primary/30 text-primary text-[11px] rounded-lg px-2 py-1` with `×` to remove
- "Clear all" text link when any filter is active
- Search is full-text across name, bio, roles, credits, location

**Empty state** (no results for the filter combination):
- Muted icon, "No members match those filters"
- "Clear filters" link

**Featured members:**
Admin-curated members can be surfaced at the top of the grid. These use the same card but with a subtle `section-rule-accent` gold top border. No special label — the position implies the curation.

---

## 5. Avatar Fallback — Initials Component

When a member has no headshot, generate an avatar from initials.

- Background colour: derived from the member's name using a deterministic colour assignment (same name always gets same colour)
- Colour palette: use the category colour set from the base design system — green, blue, amber, rose, purple — assigned by first letter of last name
- Initials: first letter of first name + first letter of last name, `font-heading font-bold text-white`
- Sizes: `w-10 h-10` (directory card) · `w-20 h-20` (profile header) · `rounded-xl` for both

---

## 6. Auth Gate — What Guests See on Protected Pages

Any page or section that requires a membership must show a consistent gate pattern.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  🔒  Members only                                │  Icon centred
│  This directory is for FRA members.              │  17px font-heading bold
│  Join to see and be seen by producers,           │  14px foreground-secondary
│  funders, and collaborators.                     │
│                                                  │
│  [Become a member →]    [Learn more]             │  Primary + ghost buttons
│                                                  │
└──────────────────────────────────────────────────┘
```

- Container: `rounded-xl border border-white/[0.08]` with `surface` bg, `py-14`
- Use a lock icon (Lucide `Lock`) at `28px`, `text-primary/50`
- This same component is used wherever content is gated — directory, project pitch decks, etc.
- The blurred directory preview on the hub page uses a semi-transparent version of this overlaid on top of real blurred cards

---

## 7. PRS Score Visibility Rules (Summary for Design)

These rules determine what elements are visible and to whom on any project card or project page.

| Element | Guest | Member (any) | Project Owner | Verified Financier |
|---|---|---|---|---|
| Project title + logline | — | ✓ | ✓ | ✓ |
| Score band (e.g. "Funding Ready") | — | ✓ | ✓ | ✓ |
| Score number (e.g. "18/25") | — | ✓ | ✓ | ✓ |
| Pathway tag | — | ✓ | ✓ | ✓ |
| Roles needed | — | ✓ | ✓ | ✓ |
| Full diagnostic breakdown | — | — | ✓ | ✓ |
| Pitch deck / look book | — | — | ✓ | ✓ (gated) |
| Chain of title | — | — | ✓ | ✓ (gated) |

**Gated content UX:** When a member without access tries to view a gated element, show the inline lock treatment: greyed placeholder with a `Lock` icon and `"Verified financiers only"` or `"Project owner only"` label. Do not hide the element entirely — the placeholder communicates what exists.

---

## 8. Mobile Considerations — Members Section

The existing mobile tab bar does not currently include "Members." When Members launches:

- Add `Members` as a tab with `Users` icon (Lucide) — this replaces one of the existing 5 tabs
- Suggested replacement: swap out `Industry` (lower-frequency use) or add as a 6th — decision needed
- Profile pages stack into a single column. The profile header (avatar + badges + availability) is the critical above-the-fold element on mobile
- The edit affordance on mobile: a floating `[Edit profile]` button fixed at bottom-right (same size as CTA buttons, `min-h-[48px]`), which switches the page into edit mode rather than the desktop hover-to-reveal pattern

---

## 9. Key Rules — Members Section Only

1. **Availability status is always the first thing a producer reads.** Never bury it below the fold.
2. **Individual = mediated contact. Business = direct contact.** The CTA buttons must be visually distinct and clearly worded. Never use "Contact" for Individual — use "Enquire via FRA."
3. **Founding member number is permanent identity.** Design it with weight — it is earned, not assigned.
4. **Edit mode is the same page as view mode** — not a separate route. Inline edit only. No full-page "Edit Profile" form.
5. **PRS score band is the headline of a project card** — not the title. Funders read the score before they read the name.
6. **The directory is a community page, not a table.** Cards, not rows. It should feel like discovering people, not reading a spreadsheet.
7. **Gate pages must sell.** The auth gate component is also a conversion moment — it shows what exists and why it's worth joining.
8. **Business profiles do not have availability status.** They have direct contact. The difference in contact model must be immediately obvious to any visitor.
9. **Profile completeness is a nudge, not a nag.** Show it once, clearly, at the top. Do not repeat it throughout the page.
10. **Employee listing is OUT of this iteration.** Business profiles show the company, not the team. Build the slot for it (empty section placeholder is fine) but do not design the team grid yet.
