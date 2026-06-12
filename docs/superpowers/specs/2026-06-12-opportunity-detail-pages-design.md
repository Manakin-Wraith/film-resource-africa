# Opportunity Detail Pages — Design

**Date:** 2026-06-12 · **Status:** Approved (mockup signed off in conversation)
**Goal:** Replace the `OpportunityModal` overlay with dedicated, indexable pages at `/opportunities/[slug]`. Every opportunity gets a real URL — shareable, crawlable, linkable from newsletters and news articles.

## Decisions (made with G.)

| Decision | Choice |
|---|---|
| Click behavior | Full page navigation; modal deleted (no intercepting-route hybrid) |
| URL scheme | `/opportunities/[slug]` (e.g. `/opportunities/axs-film-fund`) — avoids clash with `/film-opportunities/[country]` |
| Visual design | **Version A (current design)** ships now. **Version B (warm/Fraunces)** is parked for the redesign phase — see `opportunity-page-mockup.html` and the addendum in `docs/design-character-plan-2026-06-11.md` |

## 1. Database (Supabase `opportunities` table)

- Add `slug text` column with a **unique index**.
- **Backfill**: slugify title (lowercase, strip HTML entities, non-alphanumerics → `-`, trim, cap length); on collision append `-{id}`.
- **`BEFORE INSERT` trigger** auto-generates the slug when not provided. Trigger (not app code) because rows are inserted from multiple paths: submit form (`actions.ts`), admin, and scanner scripts (`scan_opportunities.mjs` etc.).
- Slugs are **stable**: never regenerated on title edits (URLs don't break).

## 2. Page — `src/app/opportunities/[slug]/page.tsx`

Server component modeled on `news/[slug]/page.tsx` (`force-dynamic`, per codebase convention). Reference mockup: `opportunity-page-mockup.html` Version A.

**Content** (everything the modal showed): hero from `og_image_url` with scrim + logo chip + geo pill + share button, category badge, title, "Added by" member attribution, About text, key-facts grid (deadline + verified badge / cost / format / eligibility), What You Get, What to Submit, Insider Tips, calendar reminder, Apply band with disclaimer.

**Page-only additions:** breadcrumbs (Home → Opportunities → title), Related Opportunities (same category or country, 3), Newsletter CTA, footer clearance for the mobile tab bar.

**SEO:** `generateMetadata` (OG image, description from "What Is It?"), JSON-LD, canonical URL, approved opportunities in `sitemap.ts`.

**Status handling:**
- Only `status = 'approved'` renders; anything else → `notFound()`.
- `application_status = 'closed'` keeps the page live, shows a Closed state instead of the Apply button (indexed pages must not 404).

**Data:** new `getOpportunityBySlug(slug)` server action (single row + country + member join).

## 3. List wiring (modal removal)

- `JustAddedSection`, `ClosingSoonSection`, `OpenNowSection`, `NewWaveSection`, `OpportunityRow`: `onSelect` callback → `<Link href={'/opportunities/' + slug}>`.
- `HomeClient` and `DirectoryClient` drop `selectedOpp` state and the modal render.
- Delete `src/components/OpportunityModal.tsx`.
- News article "Related Opportunities" cards: `/#directory` → real opportunity URLs.
- Share moves onto the page and shares the canonical URL.

## 4. Mobile

Verified in the mockup at 390px and 320px: single-column stacking, full-width Apply, no horizontal overflow. The newsletter form must stack vertically below 720px (the fixed-width input overflowed at 320px in the first draft — fixed). Re-check the production `NewsletterCTA` component for the same behavior.

## 5. Out of scope (YAGNI)

- Intercepting-route modal hybrid.
- Redirects from old URLs (none existed).
- `generateStaticParams`/ISR.
- Version B restyle — happens in redesign Phase B/C with the rest of the site.

## 6. Done when

- Migration applied; every approved row has a unique slug; new inserts get slugs automatically.
- `/opportunities/[slug]` renders all sections, correct metadata, closed-state behavior.
- All list clicks navigate; `OpportunityModal.tsx` no longer exists; build passes.
- Sitemap includes opportunity URLs.
