# Homepage Editorial Front Page (v2 mock) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 9-section homepage with the v2 mock's editorial front page: masthead → lead-story + "closing this week" grid → "just added" 3 cards → global Footer.

**Architecture:** Three focused server components under `src/components/home/` (`LeadStory`, `ClosingThisWeek`, `JustAddedRow`) composed by `FrontPageGrid`, rendered directly from `src/app/page.tsx`. The homepage drops `HomeClient` and 8 of its 10 data fetches (keeps `closingSoon`, `justAdded`). Tailwind classes map the mock CSS to the app's tokens (Fraunces `font-heading`, ochre `--color-primary-text`, ember `text-urgent`, moss `--color-moss-text`, `border-line`).

**Tech Stack:** Next.js App Router (RSC), Tailwind v4, existing `CardVisualHeader`, `formatDeadline`/`isNewListing` (`@/lib/dateUtils`).

**Design source of truth:** `fra-redesign-v2-light.html` SCREEN 1. **Spec:** `docs/superpowers/specs/2026-06-15-homepage-editorial-frontpage-design.md`. **Branch:** `fix-homepage-duplicate-masthead` (PR #13).

**Note:** Visual/CSS feature — no unit tests. Each task verifies via `npm run build` + a grep/visual check, then commits. Opportunity fields used: `title`, `slug`, `category`, `deadline_date`, `["What Is It?"]`, `["Cost"]`, `og_image_url`, `logo`, `geo_scope`, `country_iso`, `country_name`, `created_at`, `id`.

---

### Task 1: `ClosingThisWeek` component

**Files:**
- Create: `src/components/home/ClosingThisWeek.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from 'next/link';
import type { Opportunity } from '@/app/actions';
import { formatDeadline } from '@/lib/dateUtils';

// urgency → readable-on-light token color for the "N days" marker
const daysColor: Record<string, string> = {
  critical: 'text-urgent',
  warning: 'text-[color:var(--color-primary-text)]',
  normal: 'text-[color:var(--color-moss-text)]',
  passed: 'text-foreground/40',
};

export default function ClosingThisWeek({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <aside className="md:pl-10">
      <div className="flex items-baseline justify-between pb-3 border-b border-line-strong">
        <h3 className="font-heading font-semibold text-[19px] tracking-[-0.01em] text-foreground">Closing this week</h3>
        <Link href="/directory" className="text-xs text-foreground/50 hover:text-[color:var(--color-primary-text)] transition-colors">All deadlines →</Link>
      </div>
      {opportunities.length === 0 && (
        <p className="py-4 text-[13px]" style={{ color: 'var(--foreground-tertiary)' }}>No deadlines closing this week.</p>
      )}
      {opportunities.map((opp, i) => {
        const dl = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
        const last = i === opportunities.length - 1;
        return (
          <Link
            key={opp.id}
            href={`/opportunities/${opp.slug}`}
            className={`group flex items-baseline justify-between gap-3.5 py-3.5 ${last ? '' : 'border-b border-line'}`}
          >
            <span className="min-w-0">
              <span className="block font-heading font-semibold text-[15px] leading-[1.25] tracking-[-0.005em] text-foreground transition-colors group-hover:text-[color:var(--color-primary-text)]">
                {opp.title}
              </span>
              {opp.category && (
                <span className="block mt-[3px] text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--foreground-tertiary)' }}>
                  {opp.category}
                </span>
              )}
            </span>
            {dl && dl.urgency !== 'passed' && (
              <span className={`font-mono text-xs font-semibold flex-none tabular-nums ${daysColor[dl.urgency]}`}>
                {dl.daysLeft} {dl.daysLeft === 1 ? 'day' : 'days'}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compiles (component unused yet is fine — Next tree-shakes; if build errors on unused, it won't, RSC modules are fine).

- [ ] **Step 3: Commit**

```bash
git add src/components/home/ClosingThisWeek.tsx
git commit -m "feat(home): ClosingThisWeek deadline column (v2 mock)"
```

---

### Task 2: `LeadStory` component

**Files:**
- Create: `src/components/home/LeadStory.tsx`

- [ ] **Step 1: Create the component**

The film-strip media uses two sprocket-edge strips (repeating gradient in the paper color) over an image/gradient background.

```tsx
import Link from 'next/link';
import type { Opportunity } from '@/app/actions';
import { formatDeadline } from '@/lib/dateUtils';

export default function LeadStory({ opp }: { opp: Opportunity }) {
  const dl = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const media = opp.og_image_url || opp.logo || null;
  const sprocket = 'repeating-linear-gradient(180deg, var(--background) 0 12px, transparent 12px 26px)';

  return (
    <Link href={`/opportunities/${opp.slug}`} className="group block md:pr-10 md:border-r md:border-line">
      <div
        className="relative rounded-2xl overflow-hidden aspect-[16/8.5]"
        style={{
          backgroundImage: media ? `url(${media})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          background: media ? undefined : 'radial-gradient(110% 90% at 25% 20%, rgba(217,142,43,.30) 0%, transparent 55%), radial-gradient(120% 110% at 85% 90%, rgba(207,67,39,.24) 0%, transparent 60%), linear-gradient(160deg,#3a2a18 0%,#17100a 70%)',
        }}
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-5 border-r border-white/10" style={{ background: sprocket }} />
        <span aria-hidden className="absolute inset-y-0 right-0 w-5 border-l border-white/10" style={{ background: sprocket }} />
        {opp.category && (
          <span className="absolute bottom-3.5 left-9 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: 'rgba(246,239,230,.6)' }}>
            {opp.category}
          </span>
        )}
      </div>
      <div className="pt-[18px]">
        <span className="block mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary-text)]">
          Lead story · Closing soon
        </span>
        <h2 className="font-heading font-semibold text-[clamp(26px,3vw,40px)] leading-[1.08] tracking-[-0.015em] text-foreground mb-3 transition-colors group-hover:text-[color:var(--color-primary-text)]">
          {opp.title}
        </h2>
        {opp['What Is It?'] && (
          <p className="text-[15px] leading-relaxed max-w-[58ch] line-clamp-3" style={{ color: 'var(--foreground-secondary)' }}>
            {opp['What Is It?']}
          </p>
        )}
        <div className="flex items-baseline gap-[18px] mt-3.5">
          {dl && dl.urgency !== 'passed' && (
            <span className="text-[13px] font-semibold text-urgent">
              Closes {dl.dateFormatted} — {dl.daysLeft} {dl.daysLeft === 1 ? 'day' : 'days'}
            </span>
          )}
          {opp.category && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--foreground-tertiary)' }}>
              {opp.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compiles.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/LeadStory.tsx
git commit -m "feat(home): LeadStory featured opportunity (v2 mock film-strip)"
```

---

### Task 3: `FrontPageGrid` component

**Files:**
- Create: `src/components/home/FrontPageGrid.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { Opportunity } from '@/app/actions';
import LeadStory from './LeadStory';
import ClosingThisWeek from './ClosingThisWeek';

export default function FrontPageGrid({ lead, closing }: { lead: Opportunity | null; closing: Opportunity[] }) {
  if (!lead) {
    return (
      <section className="mt-10">
        <ClosingThisWeek opportunities={closing} />
      </section>
    );
  }
  return (
    <section className="grid md:grid-cols-[1.4fr_1fr] gap-10 md:gap-0 mt-10">
      <LeadStory opp={lead} />
      <ClosingThisWeek opportunities={closing} />
    </section>
  );
}
```

- [ ] **Step 2: Build & commit**

Run: `npm run build` (expected: passes)
```bash
git add src/components/home/FrontPageGrid.tsx
git commit -m "feat(home): FrontPageGrid composing lead story + closing column"
```

---

### Task 4: `JustAddedRow` component

**Files:**
- Create: `src/components/home/JustAddedRow.tsx`

- [ ] **Step 1: Create the component** (reuses `CardVisualHeader` for media)

```tsx
import Link from 'next/link';
import type { Opportunity } from '@/app/actions';
import CardVisualHeader from '@/components/CardVisualHeader';
import { formatDeadline, isNewListing } from '@/lib/dateUtils';

export default function JustAddedRow({ opportunities }: { opportunities: Opportunity[] }) {
  if (opportunities.length === 0) return null;
  return (
    <section className="mt-[72px]">
      <div className="flex items-baseline justify-between gap-4 pb-3.5 mb-[22px] border-b border-line">
        <div>
          <span className="block mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--foreground-tertiary)' }}>Just added</span>
          <h2 className="font-heading font-semibold text-[30px] tracking-[-0.015em] text-foreground">New this week</h2>
        </div>
        <span className="text-[13px] flex-none" style={{ color: 'var(--foreground-tertiary)' }}>{opportunities.length} new</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {opportunities.map((opp) => {
          const dl = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
          const isNew = isNewListing(opp.created_at, opp.id);
          const isFree = /free/i.test(opp['Cost'] || '');
          return (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.slug}`}
              className="group flex flex-col rounded-2xl border border-line bg-surface overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_10px_28px_-12px_rgba(31,24,19,0.22)]"
            >
              <CardVisualHeader
                logo={opp.logo}
                ogImage={opp.og_image_url}
                category={opp.category}
                title={opp.title}
                geoScope={opp.geo_scope}
                countryIso={opp.country_iso}
                countryName={opp.country_name}
              />
              <div className="p-[18px] flex flex-col flex-grow">
                {opp.category && (
                  <span className="block mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--foreground-tertiary)' }}>{opp.category}</span>
                )}
                <h3 className="font-heading font-semibold text-[18px] leading-[1.22] tracking-[-0.01em] text-foreground mb-2 transition-colors group-hover:text-[color:var(--color-primary-text)]">
                  {opp.title}
                </h3>
                {opp['What Is It?'] && (
                  <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: 'var(--foreground-secondary)' }}>{opp['What Is It?']}</p>
                )}
                <div className="flex items-baseline justify-between gap-3 border-t border-line mt-auto pt-3">
                  <span className="text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
                    {isNew && <span className="text-[color:var(--color-primary-text)]">● New</span>}
                    {isNew && isFree && ' · '}
                    {isFree && <span className="text-[color:var(--color-moss-text)]">Free to apply</span>}
                  </span>
                  {dl && dl.urgency !== 'passed' && (
                    <span className="font-mono text-[11.5px] text-[color:var(--color-primary-text)]">{dl.dateFormatted}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build & commit**

Run: `npm run build` (expected: passes)
```bash
git add src/components/home/JustAddedRow.tsx
git commit -m "feat(home): JustAddedRow 3-card section (v2 mock)"
```

---

### Task 5: Wire the front page into `page.tsx`; drop the 9 sections

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the imports + data fetch + render**

Open `src/app/page.tsx`. Replace the actions import block, the destructured `Promise.all`, and the `<HomeClient … />` render with the below. Keep the existing masthead `<header>` (lines under `{/* ── Masthead … */}`) and `<NewsletterCTA variant="hero" />` exactly as they are.

Replace the import block at the top:
```tsx
import { getClosingSoonOpportunities, getJustAddedOpportunities } from './actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import FrontPageGrid from '@/components/home/FrontPageGrid';
import JustAddedRow from '@/components/home/JustAddedRow';

export const dynamic = 'force-dynamic';
```

Replace the body's data fetch + the `<HomeClient … />` block. The function becomes:
```tsx
export default async function Home() {
  const [closingSoon, justAdded] = await Promise.all([
    getClosingSoonOpportunities(),
    getJustAddedOpportunities(),
  ]);

  const lead = closingSoon[0] ?? justAdded[0] ?? null;
  const closing = lead === closingSoon[0] ? closingSoon.slice(1, 7) : closingSoon.slice(0, 6);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 pt-8 pb-0 md:pt-12">
        {/* ── Masthead (matches v3 redesign mockup: single "African film, funded.") ── */}
        <header className="pt-4 md:pt-6 pb-10 md:pb-14">
          <h1 className="font-heading font-semibold leading-[1.02] tracking-[-0.02em] text-[clamp(44px,6vw,84px)] max-w-[12ch] text-foreground">
            African film,{' '}
            <em className="italic font-normal bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-urgent)] bg-clip-text text-transparent">
              funded.
            </em>
          </h1>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-12 border-y border-line mt-8 md:mt-10 py-5">
            <p className="text-[15px] md:text-base leading-relaxed max-w-[52ch]" style={{ color: 'var(--foreground-secondary)' }}>
              Screenwriting labs, co-production funds, and pitch forums — every live opportunity for African creators, verified and tracked to deadline.
            </p>
            <div className="w-full md:w-auto md:min-w-[360px] md:flex-shrink-0">
              <NewsletterCTA variant="hero" />
            </div>
          </div>
        </header>

        <FrontPageGrid lead={lead} closing={closing} />
        <JustAddedRow opportunities={justAdded.slice(0, 3)} />
      </div>
    </main>
  );
}
```

IMPORTANT: This removes the imports of `getOpportunities, getOpenOpportunities, getNewWaveOpportunities, getNews, getTrailers, getActivePlacements, getCountriesWithOpportunityCounts`, `HomeClient`, and (already gone) `SponsorTicker`. After editing, ensure no other code in the file references the removed variables.

- [ ] **Step 2: Verify no dangling references**

Run: `grep -nE "HomeClient|SponsorTicker|getOpportunities|getOpenOpportunities|getNewWaveOpportunities|getNews|getTrailers|getActivePlacements|getApprovedPartners|getCountriesWithOpportunityCounts" src/app/page.tsx`
Expected: no matches.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiles, 39 pages. (TypeScript may flag unused vars — there should be none left.)

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): render editorial front page; drop the 9-section layout"
```

---

### Task 6: Remove the now-unused `HomeClient`; final verification

**Files:**
- Delete: `src/components/HomeClient.tsx` (only if nothing else imports it)

- [ ] **Step 1: Confirm HomeClient is unreferenced**

Run: `grep -rn "HomeClient" src/ --include=*.tsx`
Expected: no matches (page.tsx no longer imports it). If any other file imports it, STOP and leave the file; report the reference.

- [ ] **Step 2: Delete it**

```bash
git rm src/components/HomeClient.tsx
```

- [ ] **Step 3: Full build**

Run: `npm run build`
Expected: compiles, 39 pages, no errors.

- [ ] **Step 4: Visual check** (`npm run dev`, open `http://localhost:3000`)

Compare `/` to `fra-redesign-v2-light.html` SCREEN 1:
- Masthead "African film, funded." (Fraunces) + lede/Subscribe band.
- Front-page grid: lead story (left, film-strip media, "Lead story · Closing soon", title, dek, "Closes … — N days") + "Closing this week" column (right, rows with N-days colored by urgency).
- "Just added" → "New this week" 3 cards.
- Global Footer below; no Open Now / News / Trailers / Directory embed.
- Spot-check `/news`, `/directory`, `/call-sheet` still render (routes intact).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(home): remove unused HomeClient after front-page rebuild"
```

---

## Self-review notes

- **Spec coverage:** FrontPageGrid+LeadStory+ClosingThisWeek (T1–T3,T5), JustAddedRow (T4), page.tsx wiring + drop sections + reduce fetches to closingSoon/justAdded (T5), remove HomeClient (T6), keep global Footer (untouched in layout.tsx), masthead unchanged (preserved verbatim in T5). Edge cases: no-lead fallback (FrontPageGrid + page.tsx `lead` fallback), empty closing (ClosingThisWeek empty state), <3 just-added (JustAddedRow renders what exists / null at 0), missing media/deadline (LeadStory + cards guard with `dl &&` and gradient fallback). All spec points covered.
- **Placeholder scan:** none — every component has complete code.
- **Type consistency:** `Opportunity` imported from `@/app/actions` in all; `formatDeadline` returns `{dateFormatted,daysLeft,urgency}` used consistently; `CardVisualHeader` props match its interface (`logo,ogImage,category,title,geoScope,countryIso,countryName`); `isNewListing(created_at,id)` signature matches.
