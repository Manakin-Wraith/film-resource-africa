# Film Resource Africa — Partner Rate Card

> Internal reference — last updated 20 March 2026

---

## How It Works

Partners are managed entirely from the **Admin Dashboard → Partners tab**. When you add a partner, you select a **bundle** which determines their tier, placements, and which form fields are shown. The system auto-provisions everything — no manual SQL or Supabase edits needed.

### Admin Flow

1. Go to `/admin` → **Partners** tab → **Add Partner**
2. Select a bundle (Starter / Growth / Headline)
3. Fill in the fields — the form adapts based on the bundle selected
4. Click **Save** — the partner and all placements are created automatically
5. Editing a partner's bundle auto-upgrades/downgrades their placements

---

## Bundles

Bundles are the single source of truth. Each bundle maps to a **ticker tier**, **news placement**, and **newsletter type** automatically.

| Bundle | Ticker Tier | News Placement | Newsletter | Price |
|--------|-------------|----------------|------------|-------|
| **Starter** | Partner (blue glow) | — | Mention | $75/mo |
| **Growth** | Sponsor (gold shimmer) | Scattered in `/news` feed | Mention | $250/mo |
| **Headline** | Sponsor (gold shimmer) | Prime slot on homepage | Spotlight | $300/mo |

### What each bundle sets automatically

| Field | Starter | Growth | Headline |
|-------|---------|--------|----------|
| `tier` | `partner` | `sponsor` | `sponsor` |
| `bundle` | `starter` | `growth` | `headline` |
| `newsletter_type` | `mention` | `mention` | `spotlight` |
| Profile card fields | Hidden | Shown | Shown |
| `sponsored_placements` row | Not created | Auto-created | Auto-created |

---

## Placements Overview

| # | Placement | Where | Who Gets It |
|---|-----------|-------|-------------|
| 1 | **Partner Ticker** | Homepage scrolling banner | All bundles |
| 2 | **News Profile Card — Prime** | Homepage Latest News grid (2nd position) | Headline only |
| 3 | **News Profile Card — Scattered** | `/news` page, every 4th item | Growth + Headline |
| 4 | **Newsletter Feature** | Weekly deadline alert email | All bundles (mention or spotlight) |

---

## 1. Partner Ticker (Homepage)

Logo + name in the scrolling "Industry Partners" banner on the homepage.

- Clickable logo linking to partner's website
- Scrolls continuously — visible on every homepage visit
- Sits inside a premium gold-bordered container

| Tier | Style | Set By |
|------|-------|--------|
| **Partner** | Blue glow chip, logo + name + checkmark | Starter bundle |
| **Sponsor** | Gold shimmer chip, larger logo, crown badge, priority position | Growth / Headline bundle |

Sponsor tier gets **priority (leftmost)** position via `sort_order`.

---

## 2. News Profile Card

A branded company profile card placed in the news sections. Only available for **Growth** and **Headline** bundles.

### Homepage (Headline only)

- Appears as the **2nd card** in the Latest News grid — prime visibility
- Only one Headline partner occupies this slot at a time
- If no Headline partner is active, the slot shows as a "Sponsor this space" ghost card

### /news Page (Growth + Headline)

- Profile cards are **scattered every 4th news item** in the full news feed
- Multiple partners can appear (one card per placement)
- Cards use the `branded` variant with full profile display

### Profile Card Content

The profile card displays data from the **Company Profile** section of the admin form (Growth/Headline only):

| Field | Description | Required |
|-------|-------------|----------|
| `about` | 2–3 sentence company description | Yes |
| `services` | Comma-separated tags (e.g. "Post-Production, VFX, Color Grading") | No |
| `cta_text` | Button label (default: "Visit Website") | No |
| `cta_url` | Button link URL | No |
| `featured_image_url` | Banner image behind the card (landscape recommended) | No |

---

## 3. Newsletter Feature

Placement in the weekly deadline alert email sent to all FRA subscribers.

- Reaches filmmakers, producers, and creators across Africa
- Direct inbox placement — bypasses social algorithms

| Type | Style | Set By |
|------|-------|--------|
| **Mention** | Logo + one-line CTA in email footer | Starter / Growth bundle |
| **Spotlight** | Dedicated block with logo, description, and link | Headline bundle |

---

## Database Schema

### `partners` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint (auto) | Primary key |
| `name` | text | Partner display name |
| `logo_url` | text | Uploaded to Supabase storage |
| `website` | text | Partner website |
| `tier` | text | `partner` or `sponsor` — auto-set by bundle |
| `bundle` | text | `starter`, `growth`, or `headline` |
| `status` | text | `pending`, `approved`, or `rejected` |
| `sort_order` | int | Lower = further left in ticker |
| `newsletter_type` | text | `mention` or `spotlight` — auto-set by bundle |
| `about` | text | Company description (Growth/Headline) |
| `services` | text | Comma-separated service tags (Growth/Headline) |
| `cta_text` | text | CTA button label |
| `cta_url` | text | CTA button URL |
| `featured_image_url` | text | Banner image for profile card |

### `sponsored_placements` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (auto) | Primary key |
| `partner_id` | bigint | FK → partners.id |
| `section` | text | Always `Latest News` |
| `slot_position` | int | Position in the section |
| `variant` | text | `minimal` or `branded` |
| `cta_text` | text | Synced from partner |
| `start_date` | date | When the placement goes live |
| `end_date` | date | Null = indefinite |
| `active` | bool | Auto-managed on bundle changes |

### `sponsored_clicks` table

Tracks real partner engagement clicks. Recorded automatically on the frontend via `trackSponsoredClick()`.

| Click Source | `section` value | Tracked For |
|-------------|----------------|-------------|
| **Ticker logo click** | `ticker` | All bundles (Starter/Growth/Headline) |
| **Profile Card CTA button** | `Latest News` | Growth + Headline (homepage & /news) |
| **`/news` page card click** | `news_feed` | Growth + Headline |

### `sponsored_impressions` table

Impression tracking per placement. Fires once per session when a sponsored card enters the viewport.

---

## Automation

### On Add Partner

- Partner row is created in `partners` table
- If bundle is Growth or Headline → a `sponsored_placements` row is auto-created with `active: true`
- If Starter → no placement row is created

### On Edit Partner (bundle change)

- **Upgrade to Growth/Headline** → placement row is auto-created if it doesn't exist
- **Stays at Growth/Headline** → placement is updated (CTA text synced)
- **Downgrade to Starter** → existing placement is set to `active: false`

### Frontend Rendering

- `getActivePlacements()` fetches active placements with joined partner data
- Homepage `NewsSection` filters for `partner_bundle === 'headline'` only
- `/news` page filters for `partner_bundle === 'growth' || 'headline'`
- Cards are rendered via `NewsSponsoredCard` component

---

## Selling Points

- **"Your logo on every page, every visit"** — ticker is homepage-persistent
- **"Right next to the content they're reading"** — news card is contextual, not banner-blind
- **"Direct to inbox"** — newsletter bypasses algorithms
- **Low entry point** — $75/mo gets you started with Starter
- **No long-term lock-in** — monthly billing, cancel anytime
- **Full company profile** — Growth/Headline partners get a mini storefront in the news feed

---

## Notes

- All prices are monthly, no minimum commitment
- Sponsor tier gets priority (leftmost) position in the ticker
- Homepage prime news slot is limited to **1 Headline partner** for exclusivity
- `/news` page can show **multiple** Growth + Headline cards scattered in the feed
- Newsletter goes out weekly (every Monday)
- Click tracking covers ticker logos (all bundles), profile card CTAs, and /news card clicks
- Impressions fire once per session per sponsored card view
- All partner management is done via `/admin` — no direct DB edits needed
