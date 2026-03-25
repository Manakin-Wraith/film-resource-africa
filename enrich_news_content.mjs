/**
 * Enrich thin news articles by scraping full content from source URLs.
 * Phase 1: Plain fetch (works for static HTML sites)
 * Phase 2: Playwright (for JS-rendered sites like African Film Press)
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
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

const MAX_CONTENT_LENGTH = 15000;
const MIN_IMPROVEMENT = 100; // only update if we get at least this many more chars

async function supabaseUpdate(id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/news?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`UPDATE #${id} failed: ${res.status}`);
  return res.json();
}

function cleanContent(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .replace(/\t+/g, ' ')
    .replace(/\s*(Share|Related Articles?|Related Posts?|You may also|Read more|Read More|Sign up|Subscribe|Newsletter|Cookie|Privacy Policy|©|Follow us on|Tags:|Filed Under|About the Author|Comments|Leave a Reply|ADVERTISEMENT|SPONSORED|Popular Posts)[\s\S]*$/i, '')
    .replace(/\s*(Share this|Share on|Tweet|Pin it|Email this|Print this).*$/gim, '')
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);
}

function extractArticleContent(html) {
  // Strip script/style tags first
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Try to find article content via common selectors (regex-based)
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]+class="[^"]*(?:article|entry|post|story)-?(?:content|body|text)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>|<div[^>]+class)/i,
    /<div[^>]+class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>|<div[^>]+class)/i,
  ];

  let articleHtml = null;
  for (const pattern of articlePatterns) {
    const match = clean.match(pattern);
    if (match && match[1] && match[1].length > 200) {
      articleHtml = match[1];
      break;
    }
  }

  // Extract paragraphs
  const source = articleHtml || clean;
  const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs = [];
  let match;
  while ((match = paraRegex.exec(source)) !== null) {
    // Strip HTML tags from paragraph content
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .trim();

    // Filter out junk paragraphs
    if (text.length < 30) continue;
    if (/^(cookie|subscribe|newsletter|sign up|terms|privacy|©|advertisement|sponsored|share this|related)/i.test(text)) continue;
    if (/^(click here|read more|see also|follow us|tags:|filed under)/i.test(text)) continue;

    paragraphs.push(text);
  }

  return paragraphs;
}

async function scrapeContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    if (!res.ok) return { paragraphs: [], error: `HTTP ${res.status}` };
    const html = await res.text();
    if (html.length < 500) return { paragraphs: [], error: 'Empty/tiny HTML' };
    const paragraphs = extractArticleContent(html);
    return { paragraphs, error: null };
  } catch (err) {
    return { paragraphs: [], error: err.message.slice(0, 60) };
  }
}

async function main() {
  const THRESHOLD = parseInt(process.argv[2]) || 500;
  console.log(`\n🔧 News Content Enrichment (threshold: <${THRESHOLD} chars)\n`);

  const res = await fetch(`${supabaseUrl}/rest/v1/news?select=id,title,content,summary,url&order=id.asc&limit=500`, { headers });
  const allNews = await res.json();
  const thin = allNews.filter(n => (n.content || '').length < THRESHOLD && n.url && n.url.startsWith('http'));

  console.log(`  Total articles: ${allNews.length}`);
  console.log(`  Below ${THRESHOLD} chars with URL: ${thin.length}\n`);

  // Group by domain for reporting
  const byDomain = {};
  thin.forEach(n => {
    try {
      const domain = new URL(n.url).hostname.replace('www.', '');
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(n);
    } catch {}
  });
  console.log('  Domains:');
  Object.entries(byDomain).sort((a, b) => b[1].length - a[1].length).forEach(([d, arts]) => {
    console.log(`    ${d}: ${arts.length} articles`);
  });
  console.log('');

  let enriched = 0;
  let failed = 0;
  const needsPlaywright = [];

  for (const article of thin) {
    const currentLen = (article.content || '').length;
    process.stdout.write(`  #${article.id} [${currentLen} chars] "${article.title.slice(0, 50)}" ... `);

    const { paragraphs, error } = await scrapeContent(article.url);

    if (error) {
      console.log(`✗ ${error}`);
      needsPlaywright.push(article);
      failed++;
      continue;
    }

    if (paragraphs.length < 2) {
      console.log(`⚠ Only ${paragraphs.length} paragraphs (JS-rendered?)`);
      needsPlaywright.push(article);
      failed++;
      continue;
    }

    const fullContent = cleanContent(paragraphs.join('\n\n'));
    if (fullContent.length < currentLen + MIN_IMPROVEMENT) {
      console.log(`⊘ No improvement (scraped ${fullContent.length} chars)`);
      continue;
    }

    const summary = fullContent.replace(/\n/g, ' ').slice(0, 300).trim();
    try {
      await supabaseUpdate(article.id, { content: fullContent, summary });
      console.log(`✅ ${currentLen}→${fullContent.length} chars (${paragraphs.length} paragraphs)`);
      enriched++;
    } catch (err) {
      console.log(`✗ DB update failed: ${err.message.slice(0, 40)}`);
      failed++;
    }

    // Small delay to be polite
    await new Promise(r => setTimeout(r, 500));
  }

  // ── Phase 2: Playwright for JS-rendered sites ──
  if (needsPlaywright.length > 0) {
    console.log(`\n🎭 Phase 2: Playwright for ${needsPlaywright.length} JS-rendered articles...\n`);
    let chromium;
    try {
      ({ chromium } = await import('playwright'));
    } catch {
      console.log('  ⚠ Playwright not installed — skipping Phase 2.');
      console.log('    Install with: npm install playwright && npx playwright install chromium');
      chromium = null;
    }

    if (chromium) {
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      for (const article of needsPlaywright) {
        const currentLen = (article.content || '').length;
        process.stdout.write(`  #${article.id} [${currentLen} chars] "${article.title.slice(0, 50)}" ... `);

        let page;
        try {
          page = await context.newPage();
          await page.goto(article.url, { waitUntil: 'commit', timeout: 20000 });
          await page.waitForTimeout(5000);
          try { await page.waitForSelector('p', { timeout: 8000 }); } catch {}

          const articleContent = await page.evaluate(() => {
            const selectors = [
              'article p', '[class*="article"] p', '[class*="content"] p',
              '[class*="post"] p', '[class*="body"] p', 'main p',
            ];
            for (const sel of selectors) {
              const paras = document.querySelectorAll(sel);
              if (paras.length >= 2) {
                const texts = Array.from(paras).map(p => p.textContent.trim()).filter(t => t.length > 30);
                if (texts.length >= 2) return texts.join('\n\n');
              }
            }
            const allP = Array.from(document.querySelectorAll('p'))
              .map(p => p.textContent.trim())
              .filter(t => t.length > 40 && !/cookie|subscribe|newsletter|sign up|terms|privacy/i.test(t));
            if (allP.length >= 2) return allP.join('\n\n');
            return null;
          });

          if (articleContent && articleContent.length > currentLen + MIN_IMPROVEMENT) {
            const cleaned = cleanContent(articleContent);
            // Safeguard: reject junk content (ToS, copyright, cookie boilerplate)
            const JUNK_RE = /^(By providing your information|IndieWire is a part|CloseSearch|Cookie|Terms of Use|Subscribe to|Sign me up|Already a member)/i;
            if (cleaned.length < 200 || cleaned.length < currentLen || JUNK_RE.test(cleaned)) {
              console.log(`⊘ Rejected (junk or regression: ${cleaned.length} chars)`);
            } else {
              const summary = cleaned.replace(/\n/g, ' ').slice(0, 300).trim();
              await supabaseUpdate(article.id, { content: cleaned, summary });
              console.log(`✅ ${currentLen}→${cleaned.length} chars`);
              enriched++;
            }
          } else {
            console.log(`⊘ No improvement`);
          }
        } catch (err) {
          console.log(`✗ ${err.message.slice(0, 50)}`);
        } finally {
          if (page) await page.close().catch(() => {});
        }
      }

      await browser.close();
    }
  }

  // ── Summary ──
  console.log('\n' + '═'.repeat(60));
  console.log('📋 ENRICHMENT SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Articles processed: ${thin.length}`);
  console.log(`  Enriched:           ${enriched}`);
  console.log(`  Failed/no content:  ${failed}`);
  console.log(`  Already adequate:   ${thin.length - enriched - failed}`);
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
