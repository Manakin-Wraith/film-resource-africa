/**
 * Fetch, enrich, and insert a single news article by URL.
 * Usage: node scripts/enrich_single_news.mjs <url>
 */
import { config } from 'dotenv';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueSummary } from '../summary_utils.mjs';

config({ path: '.env.local' });

const url = process.argv[2];
if (!url) { console.error('Usage: node scripts/enrich_single_news.mjs <url>'); process.exit(1); }

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Skip if already in DB
const { data: existing } = await sb.from('news').select('id,title').eq('url', url);
if (existing?.length) {
  console.log('Already in DB:', existing[0]);
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
});
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
try { await page.click('button:has-text("Yes, I accept"), button:has-text("Accept all")', { timeout: 3000 }); } catch {}

const data = await page.evaluate(() => {
  const meta = (n) => document.querySelector(`meta[property="${n}"], meta[name="${n}"]`)?.content || '';
  const title = document.querySelector('h1')?.innerText?.trim() || meta('og:title') || document.title;
  const image = meta('og:image');
  const published = meta('article:published_time') || document.querySelector('time')?.getAttribute('datetime') || '';
  const paras = Array.from(document.querySelectorAll('article p, [data-gu-name="body"] p, #maincontent p, main p'));
  const seen = new Set();
  const content = paras
    .map(p => p.innerText.trim())
    .filter(t => t.length > 30 && !seen.has(t) && seen.add(t))
    .join('\n\n');
  return { title, image, published, content };
});
await browser.close();

if (!data.content || data.content.length < 200) {
  console.error('Failed to extract sufficient content. Got', data.content?.length, 'chars');
  process.exit(1);
}

const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
const summary = generateUniqueSummary(data.content, 280);

const row = {
  title: data.title,
  slug,
  url,
  summary,
  content: data.content.slice(0, 15000),
  category: 'Industry',
  image_url: data.image || null,
  published_at: data.published || new Date().toISOString(),
  status: 'published',
  geo_scope: 'international',
  enriched_at: new Date().toISOString(),
};

const { data: ins, error } = await sb.from('news').insert(row).select();
if (error) { console.error('Insert error:', error); process.exit(1); }

console.log('✅ Inserted news id:', ins[0].id);
console.log('   Title:', data.title);
console.log('   Published:', data.published);
console.log('   Image:', data.image || '(none)');
console.log('   Content:', data.content.length, 'chars');
console.log('   Summary:', summary);
