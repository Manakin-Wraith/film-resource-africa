/**
 * Fix truncated news articles — re-scrape full content from source URLs
 *
 * Finds all published articles whose content doesn't end with sentence-ending
 * punctuation (truncated mid-sentence) and re-scrapes them via Playwright.
 *
 * Usage:
 *   node fix_truncated_articles.mjs              # fix all truncated
 *   node fix_truncated_articles.mjs --dry-run    # preview only
 */

import { readFileSync } from 'fs';

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

const MAX_CONTENT_LENGTH = 15000;

async function supabaseUpdate(id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/news?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Update #${id} failed: ${res.status}`);
}

function cleanContent(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .replace(/\t+/g, ' ')
    .replace(/\s*(Share this|Share on|Tweet|Pin it|Email this|Print this).*$/gim, '')
    .replace(/\s*(Share|Related Articles?|Related Posts?|You may also|Read more|Read More|Sign up|Subscribe|Newsletter|Cookie|Privacy Policy|©|Follow us on|Tags:|Filed Under|About the Author|Comments|Leave a Reply|ADVERTISEMENT|SPONSORED|Popular Posts)[\s\S]*$/i, '')
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);
}

function isTruncated(content) {
  if (!content || content.length < 100) return false;
  const lastChar = content.trim().slice(-1);
  return !/[.!?"'\u201D\u2019)\]\u2026]/.test(lastChar);
}

async function main() {
  console.log(`\n🔧 Fix Truncated Articles${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

  // Fetch all published articles
  const res = await fetch(
    `${supabaseUrl}/rest/v1/news?select=id,title,content,url&status=eq.published&order=id.desc&limit=500`,
    { headers }
  );
  const allArticles = await res.json();
  const truncated = allArticles.filter(a => isTruncated(a.content));

  console.log(`   Total published: ${allArticles.length}`);
  console.log(`   Truncated:       ${truncated.length}`);
  console.log(`   With URL:        ${truncated.filter(a => a.url).length}\n`);

  const toFix = truncated.filter(a => a.url && a.url.startsWith('http'));

  if (toFix.length === 0) {
    console.log('   Nothing to fix!\n');
    return;
  }

  if (DRY_RUN) {
    for (const a of toFix) {
      const ends = a.content.trim().slice(-30).replace(/\n/g, '\\n');
      console.log(`   #${a.id} (${a.content.length} chars) ends: "...${ends}"`);
      console.log(`      ${a.title.slice(0, 60)}`);
    }
    console.log(`\n   Would re-scrape ${toFix.length} articles\n`);
    return;
  }

  // Launch Playwright
  const pw = await import('playwright');
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  let fixed = 0, failed = 0, noImprovement = 0;

  for (const article of toFix) {
    const currentLen = article.content.length;
    process.stdout.write(`   #${article.id} [${currentLen} chars] "${article.title.slice(0, 45)}" ... `);

    let page;
    try {
      page = await context.newPage();
      await page.goto(article.url, { waitUntil: 'domcontentloaded', timeout: 20000 });

      try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
      await page.waitForTimeout(2000);
      try { await page.waitForSelector('article p, [class*="content"] p, main p', { timeout: 5000 }); } catch {}

      const scraped = await page.evaluate(() => {
        // Try targeted selectors first
        const selectors = [
          'article p', '[class*="article-body"] p', '[class*="article__body"] p',
          '[class*="article-content"] p', '[class*="entry-content"] p',
          '[class*="story-body"] p', '[class*="post-content"] p',
          '[class*="content"] p', 'main p',
        ];

        for (const sel of selectors) {
          const paras = document.querySelectorAll(sel);
          if (paras.length >= 2) {
            const texts = Array.from(paras)
              .map(p => p.textContent.trim())
              .filter(t => t.length > 30)
              .filter(t => !/^(cookie|subscribe|newsletter|sign up|terms|privacy|©|advertisement|share this|related|tags:|filed under|click here|read more|popular|trending)/i.test(t));
            if (texts.length >= 2) return texts.join('\n\n');
          }
        }

        // Fallback: all P tags
        const allP = Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(t => t.length > 40)
          .filter(t => !/^(cookie|subscribe|newsletter|sign up|terms|privacy|©|advertisement|share this|related)/i.test(t));
        if (allP.length >= 2) return allP.join('\n\n');

        return null;
      });

      await page.close();
      page = null;

      if (!scraped || scraped.length < currentLen + 50) {
        console.log(`⊘ no improvement (${scraped ? scraped.length : 0} chars)`);
        noImprovement++;
        continue;
      }

      const cleaned = cleanContent(scraped);

      // Reject if it's junk or a regression
      if (cleaned.length < currentLen || cleaned.length < 200) {
        console.log(`⊘ rejected (regression: ${cleaned.length} chars)`);
        noImprovement++;
        continue;
      }

      // Check it's no longer truncated
      const stillTruncated = isTruncated(cleaned);
      const summary = cleaned.replace(/\n/g, ' ').slice(0, 300).trim();

      await supabaseUpdate(article.id, { content: cleaned, summary });
      console.log(`✅ ${currentLen}→${cleaned.length} chars${stillTruncated ? ' (still truncated)' : ''}`);
      fixed++;

    } catch (err) {
      console.log(`✗ ${err.message.slice(0, 50)}`);
      failed++;
    } finally {
      if (page) await page.close().catch(() => {});
    }

    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Fix Truncated Articles Summary`);
  console.log(`   Fixed:          ${fixed}`);
  console.log(`   No improvement: ${noImprovement}`);
  console.log(`   Failed:         ${failed}`);
  console.log(`${'─'.repeat(50)}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
