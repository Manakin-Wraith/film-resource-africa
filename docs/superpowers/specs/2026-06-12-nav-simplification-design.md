# Nav Simplification — Design

**Date:** 2026-06-12 · **Status:** Approved in conversation
**Goal:** Cut the top nav from 8 items to 5, rename items for first-visit clarity, and move all navigation data into one shared config so Header, MobileTabBar, and Footer stop drifting apart.

## Decisions (made with G.)

| Decision | Choice |
|---|---|
| Tech-Pulse & Rebate Calculator | Removed from header; live in the footer Explore column only. Pages stay live at their URLs. |
| Naming | "Minimal 5": Opportunities ▾ · News · Crew & Jobs · Companies · Community ▾ |
| Community dropdown | Members + Spotlight |
| URLs | Unchanged everywhere — labels and structure only, zero route/SEO impact |

## 1. Shared config — `src/lib/navConfig.ts` (new)

Single typed source of truth consumed by `Header`, `MobileTabBar`, and `Footer`:

- `navGroups` — the 5 top-level items in display order. A group may carry `children` (rendered as a dropdown on desktop, an indented group in the mobile menu):
  - **Opportunities** → `/directory`; children: the 7 public directory categories (from `directoryConfig`), By Country (`/film-opportunities`), Projects in Development (`/projects`)
  - **News** → `/news`
  - **Crew & Jobs** → `/call-sheet`, `shortLabel: 'Jobs'`
  - **Companies** → `/industry`
  - **Community** → `/members`; children: Members (`/members`), Spotlight (`/community-spotlight`)
- `footerExtras` — footer-only links: Tech-Pulse (`/tech-pulse`), Rebate Calculator (`/rebate-calculator`), Submit an Opportunity (`/submit`)
- `mobileTabs` — Home, Opportunities, News, Jobs (shortLabel), Members — with icons

Page H1s are untouched: "The Call Sheet" and "Industry Directory" remain the page titles; the nav labels are wayfinding only.

## 2. Header (`src/components/Header.tsx`)

- Delete `NAV_LINKS_BASE`, `DIRECTORY_CHILDREN`, and the splice logic that inserts Members/Tech-Pulse mid-list; render `navGroups` from config in order.
- Generalize `DirectoryDropdown` into `NavDropdown({ group, active })` — same hover/keyboard/escape/aria behavior, used by both Opportunities and Community.
- Members logged-in override stays in Header: when a session exists, the Members link points to `/members/directory`. Config stays static.
- Active-state for a dropdown parent = pathname matches the parent or any child route.
- Mobile menu mirrors the same groups (Opportunities children indented as today; Community group likewise). Assess CTA and login flows untouched.

## 3. Mobile tab bar (`src/components/MobileTabBar.tsx`)

Tabs from `mobileTabs`: Home · Opportunities · News · Jobs · Members. Industry loses its tab (still in header + footer). Existing scroll-hide behavior and active styling unchanged.

## 4. Footer (`src/components/Footer.tsx`)

Explore column = `navGroups` top-level labels + `footerExtras`, so footer names finally match the header. Terms/Privacy and the rest of the footer unchanged.

## 5. Dead stats fetch removed

`getHeaderStats()` runs a DB query on every page load and threads `stats` through `SiteNav → Header`, where it is never rendered. Remove the layout call, the `SiteNav`/`Header` props, and — if nothing else imports it — the `getHeaderStats` action itself. Verify with a repo-wide grep before deleting the action.

## 6. Out of scope (YAGNI)

- No URL or route changes; no redirects needed.
- No page-content or H1 changes.
- No restyling — the warm/Fraunces redesign restyles this nav later (its mockup already assumes the simplified set).

## 7. Done when

- Desktop header shows exactly: Opportunities ▾, News, Crew & Jobs, Companies, Community ▾ (+ Assess CTA, login).
- Tech-Pulse and Rebate appear in the footer only; both URLs still 200.
- Mobile tab bar shows Home/Opportunities/News/Jobs/Members; mobile menu mirrors the new groups.
- Footer labels match header labels; nav data exists in exactly one module.
- `stats` prop and per-request `getHeaderStats()` call are gone; build passes; nav verified at desktop + 390px.
