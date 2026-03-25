/**
 * Scrape callfor.org for film/cinema/documentary opportunities relevant to FRA
 *
 * Strategy:
 *   1. Browse FRA-relevant category pages on callfor.org
 *   2. Scroll to load all listings, collect links
 *   3. Visit each detail page to extract full info
 *   4. Filter for relevance (film, documentary, Africa, international)
 *   5. Insert relevant opportunities as pending into Supabase
 *
 * Usage:
 *   node scrape_callfor.mjs              # scrape and insert
 *   node scrape_callfor.mjs --dry-run    # preview only
 */

import { readFileSync } from 'fs';

// ─── Config ──────────────────────────────────────────────────────────────────

const envFile = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env vars'); process.exit(1); }

const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
const DRY_RUN = process.argv.includes('--dry-run');

// Category pages to scrape (paginated with /page/N/)
const CATEGORY_URLS = [
  { label: 'Film | Documentary', url: 'https://www.callfor.org/category/film-documentary/' },
  { label: 'Script Writing', url: 'https://www.callfor.org/category/script-writing/' },
  { label: 'Animation | Comic', url: 'https://www.callfor.org/category/animation-comic/' },
  { label: 'Video', url: 'https://www.callfor.org/category/video/' },
  { label: 'Storytelling', url: 'https://www.callfor.org/category/storytelling/' },
  { label: 'Festival', url: 'https://www.callfor.org/category/festival/' },
];

// Relevance keywords — title or description must match at least one
const RELEVANCE_KEYWORDS = [
  'film', 'cinema', 'documentary', 'filmmaker', 'screenwriter', 'screenplay',
  'animation', 'short film', 'feature film', 'video', 'moving image',
  'director', 'producer', 'production', 'festival', 'series', 'tv ',
  'television', 'streaming', 'script', 'narrative', 'media art',
  'africa', 'african', 'global south', 'xr', 'immersive',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function supabaseInsert(table, row) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert failed: ${res.status} ${text}`);
  }
}

async function getExistingTitles() {
  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?select=title&order=id.desc&limit=500`, { headers });
  const data = await res.json();
  return new Set(data.map(d => d.title.toLowerCase().trim()));
}

function isRelevant(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some(kw => text.includes(kw));
}

function cleanText(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

// ─── Scrape listings from a category page ────────────────────────────────────

async function scrapeListingPage(page) {
  return page.evaluate(() => {
    const results = [];
    // callfor.org lists posts as h2 links inside the main content area
    const allLinks = document.querySelectorAll('h2 a[href*="callfor.org"], .entry-title a');
    for (const a of allLinks) {
      const href = a.href?.trim();
      const title = a.textContent?.trim();
      if (href && title && href.includes('callfor.org/') && !href.endsWith('/category/') && !href.includes('/page/')) {
        results.push({ url: href, title });
      }
    }
    // Check if there's a next page link
    let nextUrl = null;
    const nextEl = document.querySelector('a.next, a[rel="next"]');
    if (nextEl) { nextUrl = nextEl.href; }
    else {
      for (const a of document.querySelectorAll('a')) {
        if (a.textContent.includes('Next Page') || a.textContent.includes('→')) {
          nextUrl = a.href; break;
        }
      }
    }
    return { results, nextUrl };
  });
}

// ─── Scrape detail page ──────────────────────────────────────────────────────

async function scrapeDetailPage(page) {
  return page.evaluate(() => {
    const title = document.querySelector('h1.entry-title, h1')?.textContent?.trim() || '';

    // Get the main content
    const contentEl = document.querySelector('.entry-content, article .content, .post-content, article');
    const contentText = contentEl?.textContent?.trim() || '';

    // Look for deadline info
    const deadlinePatterns = [
      /deadline[:\s]*([^\n.]{5,80})/i,
      /closes?[:\s]*([^\n.]{5,80})/i,
      /due[:\s]*([^\n.]{5,80})/i,
      /submit by[:\s]*([^\n.]{5,80})/i,
      /before[:\s]*(\d{1,2}[\s/.-]\w+[\s/.-]\d{2,4})/i,
    ];
    let deadline = '';
    for (const pat of deadlinePatterns) {
      const match = contentText.match(pat);
      if (match) { deadline = match[1].trim().slice(0, 80); break; }
    }

    // Look for external apply link
    const links = contentEl?.querySelectorAll('a[href]') || [];
    let applyUrl = '';
    for (const a of links) {
      const text = a.textContent.toLowerCase();
      const href = a.href;
      if ((text.includes('apply') || text.includes('submit') || text.includes('enter') ||
           text.includes('website') || text.includes('more info') || text.includes('click here') ||
           text.includes('register') || text.includes('details')) &&
          !href.includes('callfor.org')) {
        applyUrl = href;
        break;
      }
    }
    // Fallback: first external link
    if (!applyUrl) {
      for (const a of links) {
        if (a.href && !a.href.includes('callfor.org') && !a.href.includes('javascript') &&
            !a.href.includes('#') && a.href.startsWith('http')) {
          applyUrl = a.href;
          break;
        }
      }
    }

    // Description
    const description = contentText.slice(0, 800);

    // Eligibility hints
    const lower = contentText.toLowerCase();
    let eligibility = '';
    if (lower.includes('africa') || lower.includes('african')) eligibility += 'African creatives welcome. ';
    if (lower.includes('international') || lower.includes('worldwide') || lower.includes('global')) eligibility += 'International/global eligibility. ';
    if (lower.includes('emerging') || lower.includes('early career')) eligibility += 'Emerging/early career. ';

    // Cost
    let cost = 'To be confirmed';
    if (lower.includes('free') || lower.includes('no fee') || lower.includes('no entry fee')) cost = 'Free';
    const feeMatch = contentText.match(/(entry|submission)?\s*fee[:\s]*([^\n.]{3,40})/i);
    if (feeMatch) cost = feeMatch[0].trim().slice(0, 60);

    return { title, description, deadline, applyUrl, eligibility, cost };
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Scraping callfor.org for FRA-relevant opportunities${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

  const pw = await import('playwright');
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  const existingTitles = await getExistingTitles();
  console.log(`   ${existingTitles.size} existing opportunities in DB\n`);

  const allLinks = new Map(); // url -> { title, category }

  // Phase 1: Collect links from category pages (first 3 pages each)
  const MAX_PAGES_PER_CATEGORY = 3;

  for (const cat of CATEGORY_URLS) {
    console.log(`\n   📂 ${cat.label}`);

    for (let pageNum = 1; pageNum <= MAX_PAGES_PER_CATEGORY; pageNum++) {
      const pageUrl = pageNum === 1 ? cat.url : `${cat.url}page/${pageNum}/`;

      try {
        const page = await context.newPage();
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500);

        // Scroll to trigger any lazy loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        const { results, nextUrl } = await scrapeListingPage(page);
        await page.close();

        if (results.length === 0) {
          console.log(`      Page ${pageNum}: no results (end)`);
          break;
        }

        let newCount = 0;
        for (const item of results) {
          if (!allLinks.has(item.url)) {
            allLinks.set(item.url, { title: item.title, category: cat.label });
            newCount++;
          }
        }
        console.log(`      Page ${pageNum}: ${results.length} listings (${newCount} new)`);

        if (!nextUrl) break;
      } catch (err) {
        console.log(`      Page ${pageNum}: failed — ${err.message.slice(0, 50)}`);
        break;
      }

      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log(`\n   📋 ${allLinks.size} unique listings found across all categories\n`);

  // Phase 2: Visit each detail page and extract info
  const opportunities = [];

  for (const [url, meta] of allLinks) {
    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(800);

      const detail = await scrapeDetailPage(page);
      await page.close();

      const fullTitle = detail.title || meta.title;

      // Relevance filter
      // Film | Documentary category items are always relevant
      // Other categories require stricter film-specific keywords
      const titleLower = fullTitle.toLowerCase();
      const descLower = detail.description.toLowerCase();
      const filmCoreKeywords = ['film', 'cinema', 'documentary', 'filmmaker', 'screenwriter',
        'animation', 'short film', 'video art', 'moving image', 'xr', 'immersive',
        'script', 'screenplay', 'director', 'producer'];
      const isFromFilmCategory = meta.category === 'Film | Documentary';
      const hasCoreKeyword = filmCoreKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));
      if (!isFromFilmCategory && !hasCoreKeyword) {
        console.log(`   ⊘ Not relevant: ${fullTitle.slice(0, 55)}`);
        continue;
      }

      // Check for duplicates (fuzzy — check first 40 chars lowercased)
      const normTitle = fullTitle.toLowerCase().trim();
      const shortNorm = normTitle.slice(0, 40);
      let isDup = false;
      for (const existing of existingTitles) {
        if (existing.startsWith(shortNorm) || shortNorm.startsWith(existing.slice(0, 40))) {
          isDup = true;
          break;
        }
      }
      if (isDup) {
        console.log(`   ⊘ Dup: ${fullTitle.slice(0, 60)}`);
        continue;
      }

      opportunities.push({
        title: fullTitle,
        description: cleanText(detail.description.slice(0, 500)),
        deadline: detail.deadline || 'To be confirmed',
        applyUrl: detail.applyUrl || url,
        callforUrl: url,
        eligibility: detail.eligibility || 'To be confirmed',
        cost: detail.cost,
        category: meta.category,
      });

      console.log(`   ✅ [${meta.category}] ${fullTitle.slice(0, 55)}`);

    } catch (err) {
      console.log(`   ✗ ${meta.title.slice(0, 50)} — ${err.message.slice(0, 50)}`);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  await browser.close();

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 Found ${opportunities.length} FRA-relevant opportunities\n`);

  if (opportunities.length === 0) {
    console.log('   No new opportunities found.\n');
    return;
  }

  // Phase 3: Insert into Supabase
  let inserted = 0;
  for (const opp of opportunities) {
    const record = {
      title: opp.title,
      'What Is It?': opp.description,
      'For Films or Series?': 'To be confirmed',
      'What Do You Get If Selected?': 'To be confirmed',
      'Cost': opp.cost,
      'Next Deadline': opp.deadline,
      'Apply:': opp.applyUrl,
      'Who Can Apply / Eligibility': opp.eligibility || 'To be confirmed',
      'What to Submit': 'To be confirmed',
      'Strongest Submission Tips': '',
      'CALENDAR REMINDER:': '',
      status: 'pending',
      votes: 0,
      application_status: 'open',
    };

    if (DRY_RUN) {
      console.log(`   [DRY] ${opp.title.slice(0, 55)}`);
      console.log(`         Apply: ${opp.applyUrl.slice(0, 60)}`);
      console.log(`         Deadline: ${opp.deadline}`);
      console.log(`         Category: ${opp.category}`);
      console.log('');
    } else {
      try {
        await supabaseInsert('opportunities', record);
        console.log(`   ✓ Inserted (pending): ${opp.title.slice(0, 55)}`);
        inserted++;
      } catch (err) {
        console.log(`   ✗ Insert failed: ${opp.title.slice(0, 40)} — ${err.message.slice(0, 60)}`);
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 callfor.org Scrape Summary`);
  console.log(`   Total found:    ${opportunities.length}`);
  console.log(`   Inserted:       ${DRY_RUN ? '0 (dry run)' : inserted}`);
  console.log(`${'─'.repeat(60)}\n`);

  // Print summary for review
  if (opportunities.length > 0) {
    console.log('📋 Opportunities for manual review:\n');
    for (const opp of opportunities) {
      console.log(`   • ${opp.title.slice(0, 70)}`);
      console.log(`     Category: ${opp.category}`);
      console.log(`     Deadline: ${opp.deadline}`);
      console.log(`     Apply: ${opp.applyUrl.slice(0, 70)}`);
      console.log(`     callfor: ${opp.callforUrl}`);
      console.log('');
    }
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
