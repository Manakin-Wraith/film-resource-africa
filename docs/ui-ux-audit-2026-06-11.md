# FRA UI/UX Audit — Baseline for Redesign Brief

Date: 2026-06-11. Compiled from a full codebase sweep (4 parallel explorations: IA/public pages, members area, design system, interactive flows). This is the "current state" reference the new design brief will be written against.

---

## 1. What the product is (UX terms)

Film Resource Africa is a dark-mode, editorial-styled marketplace with three audiences:

1. **Guests / subscribers** — browse opportunities, news, country guides; convert via newsletter signup.
2. **Members** (Individual R990/yr · Business R2,250/yr, founding cohort capped at 100) — magic-link login, profile in a members-only directory, PRS scoring, submission rights (opportunities, industry listings, call-sheet roles).
3. **Admin** — single password-gated dashboard (`admin123` cookie) for moderating all content.

Stack: Next.js 16 App Router (server components + client islands), Tailwind v4, Supabase (data + auth + storage), Resend (email), PayFast (payments), Vercel (hosting + analytics), framer-motion (sparingly), lucide-react icons.

## 2. Information architecture

~22 public routes, all reachable from header/footer (no orphans):

- `/` — long-scroll editorial home: hero masthead → sponsor ticker → Just Added → Closing Soon → Open Now → New Wave → Now Screening (trailers) → News (+ sponsored slots) → newsletter showcase → Browse by Country → full directory (`#directory`)
- `/directory` (funds/grants/festivals) and `/industry` (companies/crew/services/training/agencies) — two parallel listing surfaces with separate client components (`DirectoryClient` vs `IndustryDirectoryClient`)
- `/film-opportunities` → `/[country]` — region-grouped country index; country pages are rich 2-col guides (opportunities, services directory, film commission, locations, stats, FAQs, multiple JSON-LD schemas)
- `/news` → `/[slug]` — editorial hub, 8-category color taxonomy, featured + grid, sponsored placements, related-content matching
- `/call-sheet` (+ `/submit`) — paid-only crew job board
- `/community-spotlight` — member achievement stories + submit form
- `/tech-pulse` — podcast hub with its own scoped CSS (`tech-pulse.css`), currently gated behind a `CONTENT_READY` flag (coming-soon state)
- `/rebate-calculator` — coming-soon landing; calculator component + pure client-side calc logic already built (`src/lib/rebate/calculate.ts`)
- `/assess` → `/assess/processing` → `/p/[token]` — PRS funnel: 25-question intake → polling spinner → tokenized report (free vs member render branches, journal history for members)
- `/members` (conversion page) → `/members/directory`, `/members/onboarding`, `/members/[username]` (+ `/edit`), `/m/[username]` (public founding-member showcase), `/projects/[token]`
- `/submit` (Business-tier only), `/login` (+ `/check-email`), `/privacy`, `/terms`, `/admin`

Navigation: fixed 64px header (Directory dropdown, 7 nav links, Assess + Login CTAs), 4-column footer with newsletter form, breadcrumbs on every public page, mobile bottom tab bar (5 tabs, auto-hide on scroll, safe-area aware) + hamburger menu.

## 3. Current visual language ("the look")

- **Dark only.** `--background #09090b`, surfaces `#111113`/`#18181b`, white-alpha borders (0.08/0.16). No light mode anywhere.
- **Cinematic backdrop:** fixed full-screen image `/bg/site-cinematic.jpg` under layered radial/linear scrims (tunable `--bg-scrim-strength: 0.90`) + static film-grain SVG overlay at 0.15 opacity.
- **Fonts:** Outfit (headings), Inter (body), JetBrains Mono (metadata/editorial accents). Display sizes via `clamp(44px…96px)`; dominant body is `text-sm`; tiny 10–11px mono labels.
- **Color semantics:** primary blue `#3b82f6`, accent amber `#f59e0b`, urgent red `#ef4444`, success green `#22c55e` — defined in `@theme` but also hardcoded as Tailwind utilities (`bg-amber-500/20 text-amber-400 border-amber-500/30`) in 100+ spots.
- **Editorial signature:** "section rule" (1px colored hr) + "section rubric" (11px ALL-CAPS letterspaced label) + big Outfit headline + muted lede + live count. Used on virtually every page.
- **Cards:** `border-white/[0.08] rounded-xl bg-[var(--surface)] hover:border-white/[0.16] hover:-translate-y-0.5`.
- **Badges/pills:** `rounded-full bg-{color}/20 text-{color}-400 border-{color}-500/30 uppercase text-xs font-bold`.
- **Motion:** restrained — framer-motion only for modals (mobile bottom-sheet with drag-to-dismiss, desktop scale-fade), form success states, and filter layout; CSS keyframes for ticker, PRS spinner, availability pulse dot.

## 4. Design-system maturity (candid)

**~7/10.** Strong token discipline at the CSS-variable level, cohesive aesthetic, but:

- **No primitives layer** — 53 components, zero shared `<Button>`, `<Badge>`, `<Card>`, `<Input>`; styles copy-pasted (the top repeated pattern, border+hover-lift, appears 47+ times).
- **Mixed styling idioms** — Tailwind utilities, inline `style={{ color: 'var(--foreground-secondary)' }}`, and arbitrary values (`text-[34px]`) coexist; `/m/[username]` is heavily inline-styled.
- **Siloed sub-systems** — PRS has its own 394-line `.prs-root` namespace; Tech-Pulse has its own stylesheet. Patterns don't cross-pollinate.
- **Inconsistencies** — animation usage varies per form, error displays differ (AlertCircle vs plain div), empty states inconsistent, editorial-header ordering differs between news and directory, spacing rhythm loose (gap-1→6, p-2→10).

**Existing redesign exploration:** `fra-redesign-concept.html` (repo root) sketches a warmer direction — brown-black bg `#0b0907`, ochre `#e8b057` replacing amber, ember/moss/indigo/sand palette, **Fraunces serif** display replacing Outfit, 1400px container, 18px radii, 56px section-rule stubs, more gradient/shadow depth. Not implemented anywhere in the live app. Also relevant: `fra-x-afx-spec.docx` and the three `Design_*.md` briefs in the root.

## 5. Members experience (state of play)

- Magic-link auth with pre-flight active-member email check; callback routes to onboarding (token-gated, prefilled from `directory_listings` with "✓ already on file" pills) or profile.
- `/members` conversion page: founding counter (n/100 + gradient bar), tier comparison, FAQ `<details>` accordion, PRS explainer, blurred directory tease with lock overlay.
- Members directory: sticky sidebar filter rail (search/tier/availability/discipline/country), asymmetric 3-col grid with rotating wide cards, skeleton loading, mobile bottom-sheet filters.
- Profiles: Individual (avatar, availability pulse, disciplines, credits, reel embed, "Enquire via FRA" mediated CTA) vs Business (logo, stat strip, direct mailto + website CTAs, amber gradient masthead). Separate `/edit` route with sticky save bar.
- **Gaps vs design briefs:** profile completeness bar not built; mediated enquiry is just `mailto:`; founding badge simplified to ★.

## 6. Conversion flows & friction (top findings)

- **Newsletter** (single opt-in, 3 CTA variants everywhere, Resend welcome email) — lowest-friction conversion; no double opt-in.
- **PRS funnel** — 25 questions ≈10 min with **no draft save**; black-box 2–5 min scoring with polling + ambient ticker; free tier limited to one per email (409 returns prior token). Strongest "product" UX in the app.
- **Submission funnels** — all three (opportunity/industry/call-sheet) are member-gated client-side with `JoinToContributeCTA`, all end in pending-review; no drafts, no edit-after-submit. Opportunity submit is Business-tier only with an upgrade upsell for Individuals.
- **Member acquisition** is a 7-step path: PayFast → ITN webhook creates member + auth user → welcome email with onboarding token → onboarding form → profile → login → submit.
- **Search/filter is 100% client-side** against server-fetched data; only `/directory` supports a `?cat=` deep link; filters don't survive back-navigation; mobile filter chips overflow with no affordance.
- **Voting** (hearts) is optimistic + localStorage only, effectively unlimited.
- **Tracking:** custom events (newsletter_signup, opportunity_click, news_article_read, outbound_click, contact_inquiry) via Vercel Analytics, drained to Supabase `page_views`; newsletter click tracking via `/api/track/click` redirects.

## 7. Levers and risks for the redesign

**Reusable strengths to keep/lean on:** editorial rubric/rule system, country-guide depth, restrained motion language, breadcrumbs + JSON-LD SEO discipline, the cinematic-scrim layering technique, mobile tab bar.

**What a redesign must touch carefully:**
1. No primitives layer means a reskin = touching ~53 components; building `<Button>/<Badge>/<Card>/<Input>` primitives first would make any new brief dramatically cheaper to apply.
2. Hardcoded Tailwind color utilities (amber/blue/red/green families) won't follow `@theme` token changes — a palette swap requires a sweep, not a variable edit.
3. Three siloed style systems (global, `.prs-root`, `tech-pulse.css`) need either unification or deliberate exemption in the brief.
4. Email templates (newsletter/digest/member mailers, built in .mjs scripts) share the brand today — brief should decide if they follow the new direction.
5. Dark-only assumption is structural (fixed bg image + scrims); a light or dual-mode brief is a bigger lift than a palette shift.
6. Coming-soon surfaces (rebate calculator, tech-pulse) are half-built — the brief can define their look before launch rather than retrofit.

---

## Addendum (2026-06-12): state changes since this audit

This audit describes the 2026-06-11 baseline. Two structural changes shipped the next day; read the sections above with these corrections:

1. **OpportunityModal no longer exists.** Opportunity detail is now dedicated pages at `/opportunities/[slug]` (DB-backed slugs, metadata, JSON-LD, sitemap, related items). All list cards are real links. Spec: `superpowers/specs/2026-06-12-opportunity-detail-pages-design.md`.
2. **Navigation simplified.** Header is 5 items — Opportunities ▾ · News · Crew & Jobs · Companies · Community ▾ — with Tech-Pulse and Rebate Calculator moved to the footer. Mobile tabs: Home / Opportunities / News / Jobs / Members. All nav data is a single config (`src/lib/navConfig.ts`) consumed by Header, MobileTabBar, and Footer. Spec: `superpowers/specs/2026-06-12-nav-simplification-design.md`.
3. **Page titles fixed site-wide.** The `%s | Film Resource Africa` layout template was being doubled by 19 pages appending the suffix manually; all now rely on the template.
