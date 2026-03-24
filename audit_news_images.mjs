/**
 * Audit news articles for missing image URLs.
 * Reports stats and lists articles without images.
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

async function main() {
  const res = await fetch(`${supabaseUrl}/rest/v1/news?select=id,title,image_url,url,category,published_at&order=id.desc&limit=500`, { headers });
  const news = await res.json();

  const withImage = news.filter(n => n.image_url && n.image_url.trim().length > 0);
  const noImage = news.filter(n => !n.image_url || n.image_url.trim().length === 0);

  console.log(`\n📰 News Image Audit`);
  console.log(`   Total articles: ${news.length}`);
  console.log(`   With image:     ${withImage.length} (${(withImage.length/news.length*100).toFixed(0)}%)`);
  console.log(`   Missing image:  ${noImage.length} (${(noImage.length/news.length*100).toFixed(0)}%)\n`);

  if (noImage.length > 0) {
    console.log('═'.repeat(70));
    console.log('🔴 ARTICLES MISSING IMAGE URL');
    console.log('═'.repeat(70));

    // Group by category
    const byCategory = {};
    for (const n of noImage) {
      const cat = n.category || 'uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(n);
    }

    for (const [cat, articles] of Object.entries(byCategory).sort()) {
      console.log(`\n  [${cat}] — ${articles.length} articles`);
      for (const n of articles) {
        const hasSourceUrl = n.url && n.url.trim().length > 0;
        console.log(`    #${n.id} "${n.title.slice(0, 60)}" ${hasSourceUrl ? '→ has source URL' : '→ NO source URL'}`);
      }
    }

    // Count how many have source URLs (can potentially scrape og:image)
    const scrapeable = noImage.filter(n => n.url && n.url.trim().length > 0);
    console.log(`\n  → ${scrapeable.length} / ${noImage.length} have source URLs (can try og:image scrape)`);
    console.log(`  → ${noImage.length - scrapeable.length} have no source URL (need manual image)`);
  }

  // Also check for broken image URLs (common issues)
  console.log('\n═'.repeat(70));
  console.log('🔍 CHECKING IMAGE URL QUALITY');
  console.log('═'.repeat(70));
  let broken = 0;
  for (const n of withImage) {
    const url = n.image_url.trim();
    const issues = [];
    if (!url.startsWith('http')) issues.push('not absolute URL');
    if (url.includes(' ')) issues.push('contains spaces');
    if (url.length < 10) issues.push('suspiciously short');
    if (issues.length > 0) {
      console.log(`  ⚠ #${n.id} "${n.title.slice(0, 50)}" — ${issues.join(', ')}`);
      console.log(`    image_url: "${url.slice(0, 80)}"`);
      broken++;
    }
  }
  if (broken === 0) {
    console.log(`  ✅ All ${withImage.length} image URLs look valid (absolute, no spaces)\n`);
  } else {
    console.log(`\n  → ${broken} image URLs have quality issues\n`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
