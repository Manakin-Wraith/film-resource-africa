/**
 * Targeted fix for remaining thin news articles:
 *   1. Revert regressions (#75, #116) 
 *   2. Retry africanfilmpress.com articles with longer Playwright wait
 *   3. Retry other stubborn articles
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

async function supabaseUpdate(id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/news?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`UPDATE #${id} failed: ${res.status}`);
}

function cleanContent(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .replace(/\t+/g, ' ')
    .replace(/\s*(Share|Related Articles?|You may also|Read more|Sign up|Subscribe|Newsletter|Cookie|Privacy|©|Follow us|Tags:|Filed Under|Comments|ADVERTISEMENT)[\s\S]*$/i, '')
    .trim()
    .slice(0, 3000);
}

async function main() {
  console.log('🔧 Targeted fix for remaining thin articles\n');

  // Fetch the thin articles
  const THIN_IDS = [75, 116, 85, 84, 83, 82, 79, 78, 77, 74, 61, 58, 57, 55];
  const res = await fetch(`${supabaseUrl}/rest/v1/news?id=in.(${THIN_IDS.join(',')})&select=id,title,content,url&order=id.asc`, { headers });
  const articles = await res.json();

  console.log(`  ${articles.length} thin articles to process\n`);

  // Import Playwright
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  let enriched = 0;

  for (const article of articles) {
    const currentLen = (article.content || '').length;
    process.stdout.write(`  #${article.id} [${currentLen} chars] "${article.title.slice(0, 50)}" ... `);

    let page;
    try {
      page = await context.newPage();
      
      // Navigate and wait longer for JS-heavy sites
      await page.goto(article.url, { waitUntil: 'networkidle', timeout: 30000 });
      // Extra wait for africanfilmpress (React hydration)
      if (article.url.includes('africanfilmpress')) {
        await page.waitForTimeout(8000);
      } else {
        await page.waitForTimeout(4000);
      }

      // Try multiple content extraction strategies
      const content = await page.evaluate(() => {
        // Strategy 1: article tag content
        const article = document.querySelector('article');
        if (article) {
          const paras = article.querySelectorAll('p');
          if (paras.length >= 2) {
            const texts = Array.from(paras).map(p => p.textContent.trim()).filter(t => t.length > 25);
            if (texts.length >= 2) return texts.join('\n\n');
          }
          // Fall back to article innerText
          const text = article.innerText;
          if (text && text.length > 200) return text;
        }

        // Strategy 2: common content selectors
        const selectors = [
          '[class*="article"] p', '[class*="content"] p', '[class*="post"] p',
          '[class*="body"] p', '[class*="entry"] p', 'main p',
          '.prose p', '.text p', '[class*="story"] p',
        ];
        for (const sel of selectors) {
          const paras = document.querySelectorAll(sel);
          if (paras.length >= 2) {
            const texts = Array.from(paras).map(p => p.textContent.trim()).filter(t => t.length > 25);
            if (texts.length >= 2) return texts.join('\n\n');
          }
        }

        // Strategy 3: all paragraphs, filtered
        const allP = Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(t => t.length > 30 && !/cookie|subscribe|newsletter|sign up|terms|privacy|©/i.test(t));
        if (allP.length >= 2) return allP.join('\n\n');

        // Strategy 4: largest text block in main/body
        const candidates = Array.from(document.querySelectorAll('main, article, [role="main"], .content, .post, .entry'))
          .filter(el => el.innerText && el.innerText.length > 200)
          .sort((a, b) => b.innerText.length - a.innerText.length);
        if (candidates.length > 0) {
          const text = candidates[0].innerText.trim();
          if (text.length > 200) return text;
        }

        // Strategy 5: body text as last resort (strip nav/header/footer)
        const body = document.body.cloneNode(true);
        body.querySelectorAll('nav, header, footer, script, style, aside, [class*="sidebar"], [class*="nav"], [class*="menu"], [class*="comment"]').forEach(el => el.remove());
        const bodyText = body.innerText.trim();
        if (bodyText.length > 300) return bodyText;

        return null;
      });

      if (content) {
        const cleaned = cleanContent(content);
        if (cleaned.length > currentLen + 50) {
          const summary = cleaned.replace(/\n/g, ' ').slice(0, 300).trim();
          await supabaseUpdate(article.id, { content: cleaned, summary });
          console.log(`✅ ${currentLen}→${cleaned.length} chars`);
          enriched++;
        } else {
          console.log(`⊘ No meaningful improvement (${cleaned.length} chars)`);
        }
      } else {
        console.log(`⚠ Could not extract content`);
      }
    } catch (err) {
      console.log(`✗ ${err.message.slice(0, 60)}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  await browser.close();

  console.log(`\n  Enriched: ${enriched} / ${articles.length}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
