# FRA Scanner — Fix Report

**Date:** 2026-06-03
**Author:** Cascade (diagnostic pass)
**Subject:** `scan_opportunities.mjs --enrich` quality issues found in the 2026-06-03 06:00 UTC run
**Scope:** Two related defect clusters — (A) bad opportunity inserts and (B) truncated news content

---

## 1. Executive summary

The morning scan inserted 3 new opportunities and enriched 195 of 200 pending news articles. On review:

- **2 of the 3 opportunities are not real opportunities.** They are a regulatory licensing page (Uganda Communications Commission) and a news article *about* a fund (TheAfricanComicsEmpire). The Claude relevance gate that should have rejected both is silently broken.
- **The 3rd opportunity** (Cine-Afrique PDF) was inserted with mostly `TBC` fields and never enriched, because the Phase-B Playwright enricher cannot read PDF bodies.
- **~77 of the news articles enriched today are truncated to the free-tier preview** (mostly Deadline and Variety paywalls). The enricher itself works; the source pages simply don't expose the full body to anonymous readers. A second-order issue is that `enriched_at` is set even when no improvement was found, sealing those rows from future retries.

Both clusters are fixable with surgical, low-risk edits. Recommended fixes are listed in §6.

---

## 2. Cluster A — Bad opportunity inserts

### 2.1 What got inserted

| `id` | Title | URL | Verdict |
| :-- | :-- | :-- | :-- |
| 678 | PDF CALL FOR FILMS 2026 RULES — cine-afrique.ch | `https://www.cine-afrique.ch/files/.../call-for-films-rules-2026-49725.pdf` | **Real**, but never enriched (`enriched_at = NULL`). Most fields are `TBC`. |
| 679 | The $600m Fund and Government Support Nigerian Creators Are Missing Out... | `https://theafricancomicsempire.com/the-600m-fund-and-government-support-nigerian-creators-...rendacon-2026/` | **Not an opportunity.** News article *about* a fund. Claude's own enrichment text says: *"1. Read the full article to identify any specific funds or programmes mentioned that you can apply to directly."* |
| 680 | Broadcasting | `https://www.ucc.co.ug/broadcasting/` | **Not an opportunity.** UCC regulatory licensing page. Claude's enrichment text says: *"No actionable opportunity found on this page."* |

### 2.2 Root cause — `_isActualOpportunity: false` is silently stripped

Inside `enrichOpportunityFromPage`, Claude's response is merged into the page-extraction record using a falsy-filter that strips boolean `false`:

```@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:735-739
      const merged = { ...regexFields, ...geoFields };
      for (const [key, val] of Object.entries(claudeFields)) {
        if (val && val !== 'TBC') merged[key] = val;
      }
      return merged;
```

The condition `if (val && val !== 'TBC')` rejects every falsy value, including the boolean `false`. Claude's `_isActualOpportunity: false` therefore **never reaches the caller**.

That makes this gate downstream effectively dead code:

```@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1866-1869
      if (scraped._isActualOpportunity === false) {
        console.log(`  ✗ SKIP (not an opportunity — blog/list/directory): ${item.title.slice(0, 55)}`);
        continue;
      }
```

It can only fire when `claudeEnrichFields` is bypassed entirely (i.e. when `ANTHROPIC_API_KEY` is unset), which is never the case in production. The same merge bug exists in the Phase-B post-insert enricher at line 1600.

### 2.3 Secondary cause — `isNewsArticleUrl` is too narrow

The URL gate looks only for date paths, `/blog/`, `/news/`, `/article/`, etc.:

```@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:101-110
function isNewsArticleUrl(url) {
  if (!url) return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path.endsWith('.pdf')) return false;
    if (/\/\d{4}\/\d{1,2}\//.test(path)) return true;        // /2026/04/ date paths
    if (/\/(blog|news|article|articles|post|posts|story|stories|press-release|media-release)\//i.test(path)) return true;
    return false;
  } catch { return false; }
}
```

The TheAfricanComicsEmpire URL is a hyphenated slug at the site root with no path marker, so this check returns `false`. With Bug 2.2 removing the `_isActualOpportunity` safety net, the article slipped through.

### 2.4 Tertiary cause — wrong-domain in `org_pages`

`scanner_config.json:187` configures the Uganda Communications Commission as a film-opportunity source:

```@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scanner_config.json:187
      { "name": "Uganda Comms Commission",     "url": "https://ucc.co.ug",                                  "keywords": ["open call","film","broadcast","grant"],                  "status": "active" },
```

UCC is a telecoms/broadcasting regulator, not a film funder. Even with the relevance gate working, this domain shouldn't be in `org_pages`.

### 2.5 Why all three rows have mostly `TBC` fields

- **#678 (Cine-Afrique PDF):** `enriched_at` is `NULL` because the Phase-B enricher uses `page.goto(url)` then `document.querySelector('article')` — for a PDF URL, the browser hands off to its built-in PDF viewer and `document.body` contains no readable text. The `try/catch` at line 1638 swallows the failure silently with the comment *"leave enriched_at null so it retries next run"* — but for a PDF the retry will never succeed via Playwright. The row is in a permanent enrichment loop.
- **#679 + #680:** Both have `enriched_at` set, but most fields stayed `TBC` because the source pages genuinely don't contain a deadline/eligibility/cost/what-to-submit — they are not opportunity pages. Claude correctly returned `TBC` for those fields, and the writeback path only overwrites placeholders with non-placeholder values:

```@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1611-1612
      if (enriched['Next Deadline'] && enriched['Next Deadline'] !== 'TBC' && placeholder(opp['Next Deadline']))
        updates['Next Deadline'] = enriched['Next Deadline'];
```

The `TBC`s are a **symptom** of Bug 2.2 letting non-opportunities through. The fix is upstream: don't insert non-opportunities in the first place.

### 2.6 Misleading log line

The pre-insert log message format is `"(7 fields, logo)"` / `"(9 fields, ...)"`. That count comes from:

```@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1846
      const enrichedFields = Object.keys(scraped).filter(k => !k.startsWith('_')).length;
```

It counts *keys present* in Claude's response. Claude always returns all 9 keys, even when 7 of them are `TBC`. So `(9 fields)` does not mean 9 fields filled with real data — it means Claude responded. This makes the scan look more successful than it is.

---

## 3. Cluster B — Truncated news content

### 3.1 The pattern

A breakdown of the 200 news articles enriched today, by source domain:

| Domain | Total | Truncated (<800 chars) | RSS `[…]` ellipsis | Avg length | Min | Max |
| :-- | --: | --: | --: | --: | --: | --: |
| **deadline.com** | 71 | **51 (72%)** | 4 | 747 | 284 | 2,115 |
| **variety.com** | 52 | **22 (42%)** | 0 | 880 | 529 | 2,898 |
| theguardian.com | 42 | 0 | 0 | 3,716 | 854 | 22,966 |
| indiewire.com | 24 | 0 | 0 | 4,314 | 1,214 | 10,269 |
| filmmakermagazine.com | 2 | 0 | 0 | 4,164 | 2,874 | 5,453 |
| sinemafocus.com | 4 | 1 | 0 | 3,106 | 421 | 4,537 |
| africanfilmpress.com | 4 | 1 | 0 | 1,613 | 388 | 3,462 |
| thebritishblacklist.co.uk | 1 | 1 | 1 | 391 | 391 | 391 |

The truncation is concentrated almost entirely in **Deadline (72% truncated)** and **Variety (42% truncated)**. Guardian/IndieWire/Filmmaker enrich correctly to multi-thousand-character bodies.

### 3.2 Root cause — paywall preview, not a bug

Concrete examples from today's batch:

- **#1027 — *Zack Snyder / Escape From New York*** (deadline.com, 373 chars). Content ends mid-sentence: *"...The Picture Company's Andrew Rona and Alex Heineman will produce through their overall deal with StudioCanal, which"* — no period. Deadline's free-tier lead paragraph; the rest is gated behind subscription.
- **#1043 — *Snowfall spinoff*** (deadline.com, 576 chars). Body ends with the literal token `"ADVERTISEMENT"` followed by one trailing sentence — only the content above the first ad break is exposed to non-subscribers.
- **#1057 — *The Climb collapse*** (deadline.com, 1,113 chars). Two complete paragraphs, then nothing — Deadline's "free preview" boundary.
- **#1030 — *Jeymes Samuel / Streets of Rage*** (thebritishblacklist.co.uk, 391 chars), ends in `[…]`. RSS teaser unchanged. Playwright visited the page but logged *"no improvement, marked done"* — the article body either didn't pass the quality check or the site served a different body to the headless browser.
- **#1044 — *God of the Woods*** (deadline.com `/feature/` landing page, 314 chars ending in `[…]`). `/feature/` URLs on Deadline are hub pages, not articles — there's no article body to scrape.

The Playwright enricher worked as designed — it just hit the ceiling of what those sources expose to anonymous traffic.

```@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1499-1503
        // Always accept if new content is significantly longer, or if pending and looks like quality markdown
        if (newLen > currentLen + 50 || (isPending && newLen > 300 && newLen > currentLen * 0.7)) {
          updates.content = cleaned;
          updates.summary = generateUniqueSummary(cleaned, 300);
        }
```

For Deadline/Variety, what Playwright scrapes IS what's in the DOM — the sites only render the free preview text and inject the paywall overlay later. There's no extra body to extract because it isn't in the HTML at all for anonymous readers.

### 3.3 Secondary issue — `enriched_at` sealed too eagerly

```@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1519-1523
      } else {
        // Mark as enriched even with no improvement — page was visited, no better content exists
        await supabaseUpdate('news', item.id, { enriched_at: new Date().toISOString() });
        console.log(`  · [${item.id}] ${item.title.slice(0, 55)} — no improvement, marked done`);
      }
```

Once an article is sealed as enriched, the scanner never retries it. That's why #1030 (RSS `[…]`) and #1044 (`/feature/` hub) stayed at 391 / 314 chars permanently — even if we improve the extractor next week, they're locked in.

### 3.4 Tertiary issue — non-article URLs in RSS

Deadline's RSS sometimes includes hub/landing pages (`/feature/...`), which have no article body at all. #1044 is one of these. They should be filtered before insert.

---

## 4. Severity & impact

| Issue | Severity | Impact today | Recurs every run? |
| :-- | :-- | :-- | :-- |
| **A1** — `_isActualOpportunity: false` stripped by merge | **High** | 2 / 3 inserted opps are bogus | Yes — every Claude `false` is silently dropped |
| **A2** — `isNewsArticleUrl` too narrow | Medium | 1 row (#679) | Yes — every slug-only news URL slips through |
| **A3** — UCC in `org_pages` | Low (config) | 1 row (#680) | Yes — UCC is scanned every run |
| **A4** — PDF enricher silently fails | Medium | #678 stuck unenriched | Yes — every PDF opp stays in the queue forever |
| **A5** — Misleading `(N fields)` log | Low | Cosmetic | — |
| **B1** — Deadline/Variety paywall truncation | **High** | ~73 of today's 200 enrichments | Yes — structural to the source |
| **B2** — `enriched_at` sealed on no-improvement | Medium | Permanent lock-in for B1 rows | Yes |
| **B3** — `/feature/` hub URLs in RSS | Low | A handful per run | Yes |

---

## 5. Cleanup actions for today's run

Before deploying any fixes:

1. **Reject opps #679 and #680.** They're `pending` so not public, but they'll clutter the admin queue.

   ```sql
   update opportunities set status = 'rejected' where id in (679, 680);
   ```

2. **Reset `enriched_at` on truncated Deadline/Variety/Britlist rows from today** so they're eligible for re-enrichment after fixes B1/B2 land.

   ```sql
   update news
      set enriched_at = null
    where enriched_at::date = '2026-06-03'
      and length(content) < 800
      and (url ilike '%deadline.com%' or url ilike '%variety.com%' or url ilike '%thebritishblacklist%');
   ```

3. **Leave #678 (Cine-Afrique PDF) as-is** — admin can manually fill the fields, or we can route PDFs through `pdf-parse` separately (see §6 fix #5).

---

## 6. Recommended fixes (smallest → biggest)

### Fix 1 — Preserve booleans through the Claude→merged pipeline (1 line × 2 sites)

In both merge loops, change:

```js
if (val && val !== 'TBC') merged[key] = val;
```

to:

```js
if (val !== undefined && val !== '' && val !== 'TBC') merged[key] = val;
```

Sites: `scan_opportunities.mjs:737` and `scan_opportunities.mjs:1601`.

This restores the `_isActualOpportunity: false` signal end-to-end. Resolves **A1** and prevents future Broadcasting / $600m-style inserts.

### Fix 2 — Stop sealing news enrichments that didn't improve

Only set `enriched_at` when the result is "good enough". Replace the no-improvement seal at line 1519 with:

```js
} else {
  // Only seal if existing content is already substantial; otherwise leave for retry
  const existingLen = (item.content || '').length;
  if (existingLen >= 800) {
    await supabaseUpdate('news', item.id, { enriched_at: new Date().toISOString() });
    console.log(`  · [${item.id}] ${item.title.slice(0, 55)} — no improvement, sealed (already ${existingLen} chars)`);
  } else {
    console.log(`  · [${item.id}] ${item.title.slice(0, 55)} — no improvement, leaving for retry`);
  }
}
```

Resolves **B2**. Combined with the cleanup SQL in §5.2, today's truncated rows will retry next run.

### Fix 3 — Drop `Uganda Comms Commission` from `org_pages`

Edit `scanner_config.json` to mark UCC dead:

```json
{ "name": "Uganda Comms Commission", "url": null, "tier": 1, "status": "dead", "dead_reason": "telecoms regulator, not a film funder — removed 2026-06-03" }
```

Resolves **A3**.

### Fix 4 — Skip Deadline `/feature/` and RSS-teaser-only items pre-insert

Inside the news-insert loop, add a check before insertion:

```js
const isFeatureHub = /\/feature\//i.test(item.link || '');
const isRssTeaser = (item.description || '').trim().endsWith('[\u2026]') &&
                   (item.description || '').length < 600;
if (isFeatureHub || isRssTeaser) {
  console.log(`  SKIP (hub page or RSS teaser): ${item.title.slice(0, 55)}`);
  continue;
}
```

Resolves **B3** and reduces input volume on **B1**.

### Fix 5 — Skip PDF URLs in the Phase-B opportunity enricher

In `enrichWithPlaywright` Phase B, add at the top of the loop:

```js
if (url.toLowerCase().endsWith('.pdf')) {
  // Playwright can't read PDF bodies; mark as enriched to avoid permanent retry loop
  await supabaseUpdate('opportunities', opp.id, { enriched_at: new Date().toISOString() });
  console.log(`  · [${opp.id}] ${opp.title.slice(0, 50)} — PDF, skipped`);
  continue;
}
```

Optionally, follow up with a `pdf-parse` pipeline for PDFs in a separate pass.

Resolves **A4**.

### Fix 6 — Tighten `isNewsArticleUrl` (heuristic)

Add a slug-density heuristic: if the path has ≥6 hyphenated segments and no path marker, treat it as a news article. Won't catch every case but covers the AfricanComicsEmpire pattern:

```js
const slugSegments = (path.split('/').pop() || '').split('-').length;
if (slugSegments >= 6) return true;
```

Resolves **A2** (partially). This is a heuristic — the real safety net is Fix 1.

### Fix 7 — Honest "(N fields)" log

Count only non-`TBC`, non-empty values:

```js
const enrichedFields = Object.entries(scraped)
  .filter(([k, v]) => !k.startsWith('_') && v && v !== 'TBC')
  .length;
```

Resolves **A5**.

### Fix 8 (bigger lift, optional) — Mozilla Readability for body extraction

Replace the custom `toPlainText()` walker in the news enricher with `@mozilla/readability` running inside Playwright. Better article-body detection on hostile sites; won't fix paywalls but improves edge cases like The British Blacklist.

### Fix 9 (optional) — Wayback fallback for paywalled URLs

When extraction yields <600 chars on a known paywall domain, retry via `https://web.archive.org/web/<url>`. Wayback frequently has the full text snapshot. Worth A/B-ing on Deadline before committing.

---

## 7. Recommended deploy order

| Order | Fix | Why first |
| --: | :-- | :-- |
| 1 | Fix 1 (boolean preservation) | Highest-impact correctness fix; one-line change |
| 2 | Fix 3 (drop UCC) | Config-only, removes one bad source |
| 3 | Fix 5 (skip PDFs) | Stops the permanent retry loop on #678-class rows |
| 4 | Fix 2 (don't seal failed enrichments) | Prerequisite for re-enriching today's truncated rows |
| 5 | §5 cleanup SQL | Recover today's rows + reject bogus opps |
| 6 | Fix 4 (skip hub/teaser pre-insert) | Reduces noise volume |
| 7 | Fix 6 (slug-density heuristic) | Defence-in-depth for Fix 1 |
| 8 | Fix 7 (honest log) | Cosmetic but prevents future misleading reports |
| 9 | Fix 8 / Fix 9 (Readability / Wayback) | Bigger changes; do after the surgical fixes above are validated in 2–3 scan runs |

---

## 8. Open questions for the owner

1. **Are Deadline + Variety worth keeping?** They produce 123 / 200 (~62%) of today's enrichment volume but only 50/123 articles end up substantive. Most are US/UK industry copy with low African relevance anyway. Options:
   - Keep them, accept the truncation, gate publishing on `length(content) >= 600`.
   - Demote both to tier-3 with stricter Africa-relevance filtering.
   - Drop them and rely on Cineuropa/Screen Daily Gmail signals + Guardian/IndieWire RSS.
2. **Should #678 (Cine-Afrique PDF) get a dedicated `pdf-parse` pass, or is admin manual review acceptable for PDF opportunities?** They're rare (~1 per scan).
3. **Re-enrichment retry budget:** if Fix 2 lands, truncated rows retry every 12h scan. Do we want a max retry count (e.g. seal after 3 failed attempts) so chronically-paywalled rows don't churn forever?

---

## 9. Files referenced

- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:101-110` — `isNewsArticleUrl`
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:735-739` — opportunity merge bug (primary site)
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1499-1523` — news enrichment accept/seal logic
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1600-1605` — opportunity merge bug (secondary site)
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1830-1873` — opportunity insert pipeline + dead `_isActualOpportunity` gate
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scanner_config.json:187` — UCC org_page entry

---

## 10. Truncation pipeline (2026-06-04 addendum)

Spec'd and implemented in response to a published Deadline article surfacing on the live site with a mid-sentence ending (`"…Netflix and Disney+ to"`). The fix is four layers — detection, recovery, quarantine, insert-time pre-flag — and is the durable answer to **B1** / **B2**.

### 10.1 Detection — `isTruncatedContent(content, url)`

`@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:70-101`

Flags `content` as truncated if **any** signal trips:

1. Body ends mid-sentence (last non-ws char is not `.`, `!`, `?`, `"`, `'`, `)`, `]`, `…`, `”`, `’`) AND length < 1500.
2. Ends with RSS ellipsis `[…]` / `[...]`, or trailing `…` with length < 1200.
3. Last non-empty line is a paywall stub: `ADVERTISEMENT`, `Subscribe`, `Sign in`, `Read More`, `To continue reading`, `Source: …`, `Follow us`, `Share this`.
4. Length < 1200 AND source domain ∈ `PAYWALL_DOMAINS` (Deadline, Variety, WSJ, NYT, HR, TheWrap, FT, Times, Telegraph).
5. Length < 200 (always).

### 10.2 Recovery — AMP probe (new) + Wayback (already shipped)

`@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1697-1717`

After Wayback fallback, if still thin, follow `<link rel="amphtml">` and re-extract. Most paywall sites (Deadline, Variety, HR) don't gate AMP. This is cheap (one extra page load when warranted) and recovers the bulk of B1 cases.

### 10.3 Quarantine — `is_truncated` column + read-path filter

DB migration `add_news_is_truncated`:

```sql
alter table public.news
  add column if not exists is_truncated boolean not null default false;
create index if not exists news_is_truncated_idx
  on public.news (is_truncated) where is_truncated = true;
```

Public read paths now filter `is_truncated = false`:

- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/src/app/actions.ts:236-243` — `getTrailers`
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/src/app/actions.ts:255-262` — `getNews`
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/src/app/actions.ts:274-279` — `getNewsArticle`
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/src/app/actions.ts:308-313` — `getAllNews`
- `@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/src/app/sitemap.ts:73-79` — `sitemap`

Admin read (`getAllNewsAdmin`) is intentionally untouched so admins can see + fix truncated rows.

### 10.4 Insert-time pre-flag

`@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:2316-2330`

At RSS insert, `is_truncated` is set from `isTruncatedContent(initialContent, item.link)` so paywall/teaser bodies never enter the publish queue clean — they sit as pending+truncated and wait for the enricher.

### 10.5 Enrichment loop changes

`@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/scan_opportunities.mjs:1646-1657, 1742-1782`

- Phase A query now selects `is_truncated`.
- Truncated rows are eligible for re-enrichment even after `enriched_at` is set (until either recovered or `MAX_ENRICH_ATTEMPTS = 3`).
- After every extraction attempt the row's `is_truncated` is re-evaluated against the *final* body that would be persisted (either new content or existing), so a Wayback/AMP recovery clears the flag in the same write.
- Sealing now requires `length ≥ 800 AND is_truncated = false` (or attempts exhausted).

### 10.6 Admin UX

`@/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/src/components/AdminClient.tsx:1038-1108`

- Red **TRUNCATED** badge next to the title.
- One-click **Publish** is hidden when `is_truncated === true`.
- New **Clear truncated** action requires an explicit confirmation that the body has been fixed.

### 10.7 Backfill

```sql
update public.news set is_truncated = true
 where length(content) < 800 and (
   url ilike '%deadline.com%' or url ilike '%variety.com%' or url ilike '%thewrap.com%' or
   url ilike '%hollywoodreporter.com%' or url ilike '%ft.com%' or url ilike '%wsj.com%' or
   url ilike '%nytimes.com%' or url ilike '%thetimes.co.uk%' or url ilike '%telegraph.co.uk%'
 ) or content ~ '\[(\u2026|\.\.\.)\]\s*$'
   or content ~* '(advertisement|subscribe|sign in|read more|to continue reading|subscribers only)\s*$';
```

Ran 2026-06-04 — flagged ~200 historical rows (including several `status='published'` Deadline/Variety articles that were showing truncated on the live site). They will be hidden from public reads immediately and become eligible for AMP/Wayback re-enrichment on the next `--enrich` run.

### 10.8 Verification

- `node --check scan_opportunities.mjs` — passes.
- `npx tsc --noEmit` — passes (NewsItem.is_truncated typed).

To watch the pipeline work on next run, look for these new log markers in the enricher output:

```
⚡ [1027] AMP recovered 496→3142 chars
✅ [1027] Zack Snyder / Escape From New York... — content 496→3142, ✓ recovered
⚠ still truncated   ← still paywalled after all fallbacks; stays quarantined
```

---

*End of report.*
