# Film Resource Africa (FRA)

A curated directory of global screenwriting labs, co-production funds, pitch forums, and industry news for African creators. Built with Next.js, Supabase, and deployed on Vercel.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
RESEND_API_KEY=<resend-api-key>
NEXT_PUBLIC_SITE_URL=https://film-resource-africa.com
```

## Architecture

- **Framework**: Next.js (App Router, Server Components)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

### Key directories

```
src/
  app/             # Pages and server actions
    actions.ts     # Supabase queries (opportunities, news, partners, etc.)
    admin/         # Admin dashboard (auth-gated)
    submit/        # Public opportunity submission form
  components/      # Client components (HomeClient, DirectoryClient, AdminClient, etc.)
scan_opportunities.mjs   # Content pipeline — scanner + enrichment
```

## Content Pipeline

The site is populated via `scan_opportunities.mjs`, a multi-source scanner that finds new opportunities and news, inserts them into Supabase, and optionally enriches them using Playwright.

### How it works

```
┌─────────────┐   ┌───────────┐   ┌───────────┐   ┌───────────────┐
│  RSS Feeds  │   │   Gmail   │   │ Web Search│   │ Org Pages     │
│ (AFP, etc.) │   │ Newsletters│  │ (DuckDuck)│   │ (Realness...) │
└──────┬──────┘   └─────┬─────┘   └─────┬─────┘   └──────┬────────┘
       │                │               │                 │
       └────────────────┴───────┬───────┴─────────────────┘
                                │
                        ┌───────▼───────┐
                        │ Deduplicate   │
                        │ & Filter      │
                        └───────┬───────┘
                                │
                        ┌───────▼───────┐
                        │ Insert into   │
                        │ Supabase      │
                        │ (pending)     │
                        └───────┬───────┘
                                │
                     ┌──────────▼──────────┐
                     │ Playwright Enrich   │  ← --enrich flag
                     │ (headless Chromium) │
                     └─────────────────────┘
```

### Usage

```bash
# Full scan + insert
node scan_opportunities.mjs

# Scan only, no database writes
node scan_opportunities.mjs --dry-run

# Only scan for news, skip opportunity search
node scan_opportunities.mjs --news-only

# Scan + insert + Playwright enrichment pass
node scan_opportunities.mjs --enrich
```

### Playwright Enrichment (`--enrich`)

Some news sources (notably African Film Press) are JS-rendered single-page applications. A regular HTTP fetch only gets a shell HTML — the article content is rendered client-side. The `--enrich` flag adds a post-insert pass that uses **Playwright** (headless Chromium) to:

1. **Enrich thin news articles** — opens each article URL in a real browser, waits for JS to render, then extracts paragraph content from the hydrated DOM. Updates `content` and `summary` in Supabase.
2. **Enrich opportunity fields** — visits each opportunity's source page and scrapes structured data (deadline, eligibility, benefits, format, category, cost) to replace "To be confirmed" placeholders.

#### Setup

```bash
npm install playwright
npx playwright install chromium
```

If Playwright isn't installed, the enrichment step is silently skipped and the scanner runs as normal.

#### How it extracts content

- Tries semantic selectors: `article p`, `[class*="content"] p`, `main p`
- Falls back to all substantial `<p>` elements (filtered for junk like cookie banners)
- Last resort: largest text block in `div`/`section` elements
- Strips trailing noise (share buttons, related articles, newsletter CTAs)

### Data flow summary

| Source | Inserts as | Enrichment |
|---|---|---|
| RSS feeds (AFP, Sinema Focus, etc.) | News (`industry_news`, published) | Playwright scrapes full article body |
| Web search (DuckDuckGo) | Opportunities (`pending`) | Playwright fills deadline/eligibility/format |
| Key org pages | Opportunities (`pending`) | Same as above |
| Gmail newsletters | Email leads (logged) | Manual review |

## Admin Dashboard

Accessible at `/admin` (password-protected). Supports:

- **Opportunities**: Approve/reject pending submissions, edit fields, delete
- **Spotlight / News**: Publish/unpublish, edit content, manage categories
- **Industry Directory**: Approve company/crew listings
- **Call Sheet**: Manage crew job listings
- **Partners**: Add/edit sponsor logos and tiers

## Deployment

Deployed on Vercel. Push to `main` triggers automatic deployment.

```bash
vercel --prod
```
