/**
 * Fix missing/broken news image URLs by scraping og:image from source pages.
 * Also fixes relative image URLs.
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
const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://film-resource-africa.com';
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function supabaseUpdate(table, id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`UPDATE ${table} #${id} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function scrapeOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Try og:image first
    let match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (match) return match[1];

    // Try twitter:image
    match = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (match) return match[1];

    // Try first large image in article
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = imgMatch[1];
      if (src.startsWith('data:')) continue;
      if (/logo|icon|avatar|badge|sprite|pixel|tracking/i.test(src)) continue;
      // Check for width/height hints suggesting a large image
      const tag = imgMatch[0];
      const widthMatch = tag.match(/width=["']?(\d+)/i);
      if (widthMatch && parseInt(widthMatch[1]) >= 300) return src;
      // If no width hint, accept images with typical article image patterns
      if (/upload|content|media|wp-content|image|photo|featured/i.test(src)) return src;
    }

    return null;
  } catch (err) {
    console.log(`    ✗ Fetch failed: ${err.message.slice(0, 60)}`);
    return null;
  }
}

async function main() {
  console.log('🖼️  Fixing news image URLs\n');

  // ── Fix #121: relative URL → absolute ──
  console.log('── Fixing relative URL on #121 ──');
  try {
    await supabaseUpdate('news', 121, { image_url: `${siteUrl}/images/sa-film-workforce-demonstration.webp` });
    console.log(`  ✅ #121 → ${siteUrl}/images/sa-film-workforce-demonstration.webp\n`);
  } catch (err) {
    console.log(`  ✗ #121: ${err.message}\n`);
  }

  // ── Scrape og:image for missing articles ──
  const MISSING_IDS = [127, 120, 63, 52, 42];
  
  // Fetch their source URLs
  const res = await fetch(`${supabaseUrl}/rest/v1/news?id=in.(${MISSING_IDS.join(',')})&select=id,title,url`, { headers });
  const articles = await res.json();

  console.log(`── Scraping og:image for ${articles.length} articles ──\n`);

  let fixed = 0;
  for (const article of articles) {
    console.log(`  #${article.id} "${article.title.slice(0, 55)}"`);
    console.log(`    Source: ${article.url.slice(0, 70)}`);

    const imageUrl = await scrapeOgImage(article.url);
    if (imageUrl) {
      // Make absolute if relative
      let absUrl = imageUrl;
      if (!imageUrl.startsWith('http')) {
        try {
          absUrl = new URL(imageUrl, article.url).href;
        } catch { absUrl = imageUrl; }
      }

      try {
        await supabaseUpdate('news', article.id, { image_url: absUrl });
        console.log(`    ✅ Set image: ${absUrl.slice(0, 70)}`);
        fixed++;
      } catch (err) {
        console.log(`    ✗ Update failed: ${err.message}`);
      }
    } else {
      console.log(`    ⚠ No og:image found — needs manual image`);
    }
    console.log('');
  }

  console.log('═'.repeat(60));
  console.log(`📋 SUMMARY`);
  console.log(`   Relative URL fixed:  1 (#121)`);
  console.log(`   og:image scraped:    ${fixed} / ${articles.length}`);
  console.log(`   Still missing:       ${articles.length - fixed}`);
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
