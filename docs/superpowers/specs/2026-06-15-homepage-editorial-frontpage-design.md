# Homepage Editorial Front Page (v2 mock) — Design Spec

**Date:** 2026-06-15
**Status:** Approved (design) — pending implementation plan
**Design source of truth:** `fra-redesign-v2-light.html` SCREEN 1 (front page)
**Builds on:** branch `fix-homepage-duplicate-masthead` (PR #13) — ships together before merge
**Related:** [[project_redesign_guide]]

## Goal

Replace the current heavy 9-section homepage with the minimal editorial front page from the v2 mock: masthead → front-page grid (lead story + "closing this week") → "just added" cards. Keep the global site Footer.

## Decisions (locked with user 2026-06-15)

1. Homepage = **mock only**. Drop from the homepage: Open Now, New Wave, Now Screening (trailers), News, Newsletter Showcase, Browse by Country, the full Directory embed, and the Advertise/ContactModal. Their components stay in the repo and remain reachable via nav routes (`/news`, `/call-sheet`, `/directory`, `/community-spotlight`, etc.).
2. **Lead story = most-urgent closing-soon item** (`closingSoon[0]`), automatic — no new "featured" flag.
3. Keep the **global site Footer** (rendered in `layout.tsx`). Do **not** add the mock's folio strip.
4. Masthead + lede/Subscribe band already shipped (PR #13) — unchanged.

## Architecture

The homepage server component (`src/app/page.tsx`) currently fetches 10 data sets and renders the masthead + `<SponsorTicker>` (already removed) + `<HomeClient>` (which orchestrates the 9 sections + ContactModal). After this change:

- `page.tsx` fetches only **`closingSoon`** and **`justAdded`** (removes the other 8 `getX()` calls — a perf win).
- `page.tsx` renders: masthead (unchanged) → `<FrontPageGrid lead={...} closing={...} />` → `<JustAddedRow opportunities={...} />`. The global `<Footer>` continues to render from `layout.tsx`.
- `<HomeClient>` is no longer used by the homepage and is removed from `page.tsx`. (Leave the `HomeClient.tsx` file in place but unreferenced, OR delete it — the plan will delete it since nothing else imports it; verify with grep first.)

New components (server components — no client interactivity needed; all are links):

### `src/components/home/LeadStory.tsx`
Props: `{ opp: Opportunity }`. Renders the mock `.lead-story`:
- `lead-media`: a 16/8.5 framed block with film-strip sprocket edges (mock `.lead-media::before/::after`). Background = `opp.og_image_url` (cover) if present, else `opp.logo`, else the warm gradient fallback. A small mono `frame-note` caption (e.g. the source/partner or category).
- `lead-body`: eyebrow `Lead story · Closing soon` (ochre); `<h2>` = `opp.title` (Fraunces); dek = `opp["What Is It?"]` (clamped ~3 lines); `lead-meta` = deadline (`Closes {formatDeadline(opp.deadline_date).dateFormatted} — {daysLeft} days`, ember text) + category label (`opp.category`, uppercase tertiary).
- Whole card links to `/opportunities/${opp.slug}`.

### `src/components/home/ClosingThisWeek.tsx`
Props: `{ opportunities: Opportunity[] }` (already the next items after the lead). Renders the mock `.closing-col`:
- `col-head`: "Closing this week" (Fraunces) + "All deadlines →" link to `/directory` (or `/call-sheet`? use `/directory`).
- For each opp: a `c-row` linking to `/opportunities/${opp.slug}`: `c-title` (Fraunces) + `c-cat` (`opp.category`) + `c-days` = `{daysLeft} days`, colored by `formatDeadline().urgency` (critical→ember `text-urgent`, warning→ochre `text-[var(--color-primary-text)]`, normal→moss `text-success`).
- Last row drops its bottom border.

### `src/components/home/JustAddedRow.tsx`
Props: `{ opportunities: Opportunity[] }` (top 3). Renders the mock `.sect` "Just added":
- `sect-head`: rubric "Just added" + `<h2>` "New this week" + count (`{n} new`).
- `cardrow` (3-col, responsive 1/2/3): each `card` links to `/opportunities/${opp.slug}`:
  - `card-media`: reuse the existing `CardVisualHeader` (already handles og_image/logo/gradient + the dark photo label) OR the mock's gradient `.card-media`. **Reuse `CardVisualHeader`** for consistency with the rest of the site and correct media handling.
  - `card-pad`: label (`opp.category`, tertiary uppercase) + `<h3>` (`opp.title`, Fraunces) + dek (`opp["What Is It?"]`, 2-line clamp) + `card-foot`: meta (`isNewListing(opp.created_at, opp.id)` → "● New"; `/free/i.test(opp["Cost"])` → "Free") + `when` (mono, `formatDeadline(opp.deadline_date).dateFormatted` or "—").

### `src/components/home/FrontPageGrid.tsx`
Props: `{ lead: Opportunity | null; closing: Opportunity[] }`. Renders the mock `.frontgrid` 2-col (1.4fr / 1fr, stacks on mobile): `<LeadStory>` (left, with right border on desktop) + `<ClosingThisWeek>` (right). If `lead` is null, render only the closing column full-width.

## Data flow

```
page.tsx (server)
  closingSoon = await getClosingSoonOpportunities()   // ordered deadline asc (most-urgent first)
  justAdded   = await getJustAddedOpportunities()
  lead    = closingSoon[0] ?? justAdded[0] ?? null     // fallback if no closing-soon
  closing = (lead === closingSoon[0] ? closingSoon.slice(1, 7) : closingSoon.slice(0, 6))
  → <Masthead/> <FrontPageGrid lead={lead} closing={closing}/> <JustAddedRow opportunities={justAdded.slice(0,3)}/>
```

## Edge cases

- **No closing-soon at all:** lead falls back to `justAdded[0]`; closing column shows an empty-state line ("No deadlines this week") or is omitted.
- **Fewer than 3 just-added:** render what exists (1–2 cards); section hidden if 0.
- **Missing media:** LeadStory + cards fall back to the gradient (CardVisualHeader already does this).
- **Missing deadline:** c-days/when shows "—"; lead deadline line omitted.

## Non-goals

- No changes to the dropped sections' own routes/pages (they stay live).
- No directory/modal (mock screens 2–3) — this spec is the **front page only**.
- No new data model, server actions, or routes. No copy changes beyond the editorial labels above.
- No removal of the dropped section components from the repo (only unreferenced from the homepage; `HomeClient.tsx` deleted only if unused elsewhere).

## Verification

- `npm run build` passes.
- Visual match of `/` against `fra-redesign-v2-light.html` SCREEN 1: masthead, lead-story + closing-this-week grid, just-added 3 cards, global Footer.
- Lead = the most-urgent closing-soon item; closing list = the next ones; deadline colors correct by urgency.
- Dropped sections no longer on `/` but their routes still render.
- No console errors; Fraunces headings throughout.
