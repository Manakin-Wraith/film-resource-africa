/**
 * Enrich OG Images — Scrape Open Graph images for opportunity cards
 *
 * For each opportunity with no og_image_url and a valid Apply URL:
 *   1. Fetch the page HTML
 *   2. Extract og:image, twitter:image, or large article images
 *   3. Validate the image URL is reachable and large enough
 *   4. Store the URL directly in Supabase (external image, not downloaded)
 *
 * Usage:
 *   node enrich_og_images.mjs              # fetch missing OG images
 *   node enrich_og_images.mjs --dry-run    # preview only
 *   node enrich_og_images.mjs --force      # re-fetch even if og_image_url exists
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
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

// Platform/shortener domains we should skip or resolve through
const PLATFORM_DOMAINS = new Set([
  'lnkd.in', 'linkedin.com', 'facebook.com', 'fb.com', 'filmfreeway.com',
  'forms.gle', 'docs.google.com', 'airtable.com', 'bit.ly', 't.co',
  'tinyurl.com', 'ow.ly', 'youtube.com', 'youtu.be', 'twitter.com',
  'x.com', 'instagram.com', 'eventbrite.com', 'submittable.com',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractDomain(url) {
  try {
    let u = url.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    return new URL(u).hostname.replace(/^www\./, '');
  } catch { return null; }
}

function isPlatformDomain(domain) {
  if (!domain) return false;
  return PLATFORM_DOMAINS.has(domain) || PLATFORM_DOMAINS.has(domain.replace(/^[^.]+\./, ''));
}

function resolveUrl(base, relative) {
  try {
    if (relative.startsWith('http')) return relative;
    return new URL(relative, base).href;
  } catch { return null; }
}

async function fetchPageHtml(url) {
  try {
    let u = url.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    const res = await fetch(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FRA-OGScraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });
    if (!res.ok) return { html: null, finalUrl: u };
    const html = await res.text();
    return { html, finalUrl: res.url || u };
  } catch {
    return { html: null, finalUrl: url };
  }
}

function extractOgImage(html, pageUrl) {
  if (!html) return null;

  // Priority order: og:image > twitter:image > large image in content
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<meta[^>]+property=["']og:image:url["'][^>]+content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const imgUrl = resolveUrl(pageUrl, match[1]);
      if (imgUrl && !isPlaceholder(imgUrl)) return imgUrl;
    }
  }

  return null;
}

function isPlaceholder(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  // Skip common placeholder/default images
  return (
    lower.includes('placeholder') ||
    lower.includes('default') ||
    lower.includes('no-image') ||
    lower.includes('blank') ||
    lower.includes('1x1') ||
    lower.includes('spacer') ||
    lower.includes('pixel.gif') ||
    lower.includes('data:image') ||
    lower.length < 15
  );
}

async function validateImage(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return false;
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    // Skip tiny images (likely placeholders/icons)
    if (contentLength > 0 && contentLength < 2000) return false;
    return true;
  } catch {
    return false;
  }
}

async function supabaseUpdate(id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🖼️  FRA OG Image Enricher${DRY_RUN ? ' (DRY RUN)' : ''}${FORCE ? ' (FORCE)' : ''}\n`);

  const query = FORCE
    ? 'select=id,title,"Apply:",og_image_url,logo&status=eq.approved&order=id.asc'
    : 'select=id,title,"Apply:",og_image_url,logo&status=eq.approved&og_image_url=is.null&order=id.asc';
  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?${query}`, { headers });
  const opps = await res.json();
  console.log(`   ${opps.length} opportunities to process\n`);

  let found = 0, skipped = 0, failed = 0;

  for (const opp of opps) {
    const url = opp['Apply:'];
    if (!url) { skipped++; continue; }

    const domain = extractDomain(url);
    if (!domain) { skipped++; continue; }

    // Skip platform domains — their OG images are generic
    if (isPlatformDomain(domain)) {
      console.log(`  ⊘ #${opp.id} ${opp.title.slice(0, 50)} — skipping platform ${domain}`);
      skipped++;
      continue;
    }

    // Fetch page and extract OG image
    const { html, finalUrl } = await fetchPageHtml(url);
    const ogImage = extractOgImage(html, finalUrl);

    if (ogImage) {
      // Validate the image is reachable and not tiny
      const valid = await validateImage(ogImage);
      if (valid) {
        if (DRY_RUN) {
          console.log(`  [DRY] #${opp.id} ${opp.title.slice(0, 45)} — ${ogImage.slice(0, 70)}`);
        } else {
          await supabaseUpdate(opp.id, { og_image_url: ogImage });
          console.log(`  ✅ #${opp.id} ${opp.title.slice(0, 45)} — OG image found`);
        }
        found++;
      } else {
        console.log(`  ✗ #${opp.id} ${opp.title.slice(0, 45)} — OG image invalid/tiny`);
        failed++;
      }
    } else {
      console.log(`  ✗ #${opp.id} ${opp.title.slice(0, 45)} — no OG image on ${domain}`);
      failed++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 OG Image Enrichment Summary`);
  console.log(`   Found:    ${found}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Failed:   ${failed}`);
  console.log(`${'─'.repeat(50)}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
