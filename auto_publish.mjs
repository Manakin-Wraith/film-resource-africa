/**
 * Auto-Publish Pipeline — Enrich images and approve pending opportunities & news
 *
 * Pipeline per pending opportunity:
 *   1. Fetch organisation logo (Google Favicon API + page scrape fallback)
 *   2. Try OG image scrape (og:image / twitter:image meta tags)
 *   3. If no OG image → Playwright screenshot (1200×630 banner)
 *   4. Set status = 'approved'
 *
 * Pipeline per pending news:
 *   1. Set status = 'published'
 *
 * Usage:
 *   node auto_publish.mjs              # enrich + approve + publish
 *   node auto_publish.mjs --dry-run    # preview only
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

const LOGOS_DIR = join(process.cwd(), 'public', 'logos');
const SCREENSHOTS_DIR = join(process.cwd(), 'public', 'og-screenshots');
if (!existsSync(LOGOS_DIR)) mkdirSync(LOGOS_DIR, { recursive: true });
if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const VIEWPORT = { width: 1200, height: 630 };
const MIN_LOGO_BYTES = 200;

const PLATFORM_DOMAINS = new Set([
  'lnkd.in', 'linkedin.com', 'facebook.com', 'fb.com', 'filmfreeway.com',
  'forms.gle', 'docs.google.com', 'airtable.com', 'bit.ly', 't.co',
  'tinyurl.com', 'ow.ly', 'youtube.com', 'youtu.be', 'twitter.com',
  'x.com', 'instagram.com', 'eventbrite.com', 'submittable.com',
  'jotform.com', 'form.jotform.com',
]);

// ─── Shared Helpers ──────────────────────────────────────────────────────────

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

async function supabaseUpdate(table, id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Update ${table}#${id} failed: ${res.status}`);
}

// ─── Step 1: Logo Enrichment ─────────────────────────────────────────────────

async function fetchLogo(applyUrl) {
  let domain = extractDomain(applyUrl);
  if (!domain || isPlatformDomain(domain)) {
    // Try resolving redirect for shortened URLs
    try {
      let u = applyUrl.trim();
      if (!u.startsWith('http')) u = 'https://' + u;
      const res = await fetch(u, {
        method: 'HEAD', redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 FRA-AutoPublish/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      const finalDomain = extractDomain(res.url);
      if (finalDomain && !isPlatformDomain(finalDomain)) {
        domain = finalDomain;
      } else {
        return null;
      }
    } catch { return null; }
  }

  const localFile = join(LOGOS_DIR, `${domain}.png`);
  const localPath = `/logos/${domain}.png`;

  // Already have it locally
  if (existsSync(localFile)) return { localPath, domain, source: 'cached' };

  // Try Google Favicon API
  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-AutoPublish/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length >= MIN_LOGO_BYTES) {
        writeFileSync(localFile, buffer);
        return { localPath, domain, source: 'google-favicon' };
      }
    }
  } catch {}

  // Fallback: scrape apple-touch-icon
  try {
    let u = applyUrl.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    const res = await fetch(u, {
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-AutoPublish/1.0' },
      signal: AbortSignal.timeout(10000), redirect: 'follow',
    });
    if (res.ok) {
      const html = await res.text();
      const touchIcon = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i);
      if (touchIcon) {
        const iconUrl = touchIcon[1].startsWith('http') ? touchIcon[1] : new URL(touchIcon[1], u).href;
        const iconRes = await fetch(iconUrl, { signal: AbortSignal.timeout(8000) });
        if (iconRes.ok) {
          const buf = Buffer.from(await iconRes.arrayBuffer());
          if (buf.length >= MIN_LOGO_BYTES) {
            writeFileSync(localFile, buf);
            return { localPath, domain, source: 'apple-touch-icon' };
          }
        }
      }
    }
  } catch {}

  return null;
}

// ─── Step 2: OG Image Scrape ─────────────────────────────────────────────────

function isPlaceholder(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return lower.includes('placeholder') || lower.includes('default') ||
    lower.includes('no-image') || lower.includes('blank') ||
    lower.includes('1x1') || lower.includes('spacer') ||
    lower.includes('pixel.gif') || lower.includes('data:image') || lower.length < 15;
}

async function fetchOgImage(applyUrl) {
  const domain = extractDomain(applyUrl);
  if (!domain || isPlatformDomain(domain)) return null;

  try {
    let u = applyUrl.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    const res = await fetch(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FRA-AutoPublish/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000), redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const finalUrl = res.url || u;

    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const imgUrl = resolveUrl(finalUrl, match[1]);
        if (imgUrl && !isPlaceholder(imgUrl)) {
          // Validate it's a real image
          try {
            const headRes = await fetch(imgUrl, {
              method: 'HEAD', signal: AbortSignal.timeout(8000), redirect: 'follow',
            });
            if (headRes.ok) {
              const ct = headRes.headers.get('content-type') || '';
              const cl = parseInt(headRes.headers.get('content-length') || '0', 10);
              if (ct.startsWith('image/') && (cl === 0 || cl >= 2000)) return imgUrl;
            }
          } catch {}
        }
      }
    }
  } catch {}

  return null;
}

// ─── Step 3: Playwright Screenshot ───────────────────────────────────────────

let _browser = null;
let _context = null;

async function ensureBrowser() {
  if (_browser) return;
  const pw = await import('playwright');
  _browser = await pw.chromium.launch({ headless: true });
  _context = await _browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'en-US',
    ignoreHTTPSErrors: true,
  });
}

async function closeBrowser() {
  if (_browser) { await _browser.close(); _browser = null; _context = null; }
}

async function dismissCookieBanners(page) {
  const selectors = [
    'button:has-text("Accept")', 'button:has-text("Accept All")',
    'button:has-text("Accept all")', 'button:has-text("I agree")',
    'button:has-text("OK")', 'button:has-text("Got it")',
    'button:has-text("Allow")', 'button:has-text("Agree")',
    '#onetrust-accept-btn-handler', '#cookie-accept', '.cookie-accept',
    '.cc-accept', '.cc-btn.cc-dismiss',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '#gdpr-cookie-accept',
  ];
  for (const selector of selectors) {
    try {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(300);
        return true;
      }
    } catch {}
  }
  return false;
}

async function captureScreenshot(id, applyUrl) {
  const domain = extractDomain(applyUrl);
  if (!domain || isPlatformDomain(domain)) return null;

  await ensureBrowser();

  const outFile = join(SCREENSHOTS_DIR, `${id}.jpg`);
  const localPath = `/og-screenshots/${id}.jpg`;

  if (existsSync(outFile)) return localPath; // Already captured

  let fullUrl = applyUrl.trim();
  if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;

  const page = await _context.newPage();
  try {
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
    await page.waitForTimeout(1500);
    await dismissCookieBanners(page);
    await page.waitForTimeout(500);
    await page.screenshot({
      path: outFile, type: 'jpeg', quality: 80,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
    });
    return localPath;
  } finally {
    await page.close();
  }
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 FRA Auto-Publish Pipeline${DRY_RUN ? ' (DRY RUN)' : ''}\n`);
  console.log('─'.repeat(60));

  // ── Phase A: Pending Opportunities ──────────────────────────────────────

  console.log('\n📋 PHASE A: Pending Opportunities\n');

  const oppRes = await fetch(
    `${supabaseUrl}/rest/v1/opportunities?select=id,title,"Apply:",logo,og_image_url&status=eq.pending&order=id.asc`,
    { headers }
  );
  const pendingOpps = await oppRes.json();
  console.log(`   ${pendingOpps.length} pending opportunities\n`);

  let oppStats = { logos: 0, ogImages: 0, screenshots: 0, approved: 0, failed: 0 };

  for (const opp of pendingOpps) {
    const applyUrl = opp['Apply:'];
    const updates = {};
    let imageSource = 'none';

    console.log(`   #${opp.id} ${opp.title.slice(0, 55)}`);

    // Step 1: Logo
    if (!opp.logo && applyUrl) {
      const logo = await fetchLogo(applyUrl);
      if (logo) {
        updates.logo = logo.localPath;
        oppStats.logos++;
        console.log(`      🎨 Logo: ${logo.domain} (${logo.source})`);
      }
    }

    // Step 2: OG Image
    if (!opp.og_image_url && applyUrl) {
      const ogImage = await fetchOgImage(applyUrl);
      if (ogImage) {
        updates.og_image_url = ogImage;
        oppStats.ogImages++;
        imageSource = 'og';
        console.log(`      🖼️  OG image found`);
      }
    }

    // Step 3: Screenshot (if no OG image)
    if (!opp.og_image_url && !updates.og_image_url && applyUrl) {
      try {
        const screenshotPath = await captureScreenshot(opp.id, applyUrl);
        if (screenshotPath) {
          updates.og_image_url = screenshotPath;
          oppStats.screenshots++;
          imageSource = 'screenshot';
          console.log(`      📸 Screenshot captured`);
        }
      } catch (err) {
        console.log(`      ✗ Screenshot failed: ${err.message.slice(0, 50)}`);
      }
    }

    // Step 4: Approve
    updates.status = 'approved';

    if (DRY_RUN) {
      console.log(`      [DRY] Would approve with image=${imageSource}`);
    } else {
      try {
        await supabaseUpdate('opportunities', opp.id, updates);
        oppStats.approved++;
        console.log(`      ✅ Approved (image: ${imageSource})`);
      } catch (err) {
        oppStats.failed++;
        console.log(`      ✗ Update failed: ${err.message.slice(0, 50)}`);
      }
    }

    console.log('');
    await new Promise(r => setTimeout(r, 300));
  }

  await closeBrowser();

  // ── Phase B: Pending News ──────────────────────────────────────────────

  console.log('\n📰 PHASE B: Pending News\n');

  const newsRes = await fetch(
    `${supabaseUrl}/rest/v1/news?select=id,title,status,image_url,slug&status=eq.pending&order=id.asc`,
    { headers }
  );
  const pendingNews = await newsRes.json();
  console.log(`   ${pendingNews.length} pending news articles\n`);

  let newsStats = { published: 0, failed: 0 };

  for (const article of pendingNews) {
    console.log(`   #${article.id} ${article.title.slice(0, 55)}`);

    if (DRY_RUN) {
      console.log(`      [DRY] Would publish`);
    } else {
      try {
        await supabaseUpdate('news', article.id, { status: 'published' });
        newsStats.published++;
        console.log(`      ✅ Published`);
      } catch (err) {
        newsStats.failed++;
        console.log(`      ✗ Publish failed: ${err.message.slice(0, 50)}`);
      }
    }
    console.log('');
  }

  // ── Summary ────────────────────────────────────────────────────────────

  console.log('─'.repeat(60));
  console.log('📊 Auto-Publish Summary\n');
  console.log('   Opportunities:');
  console.log(`     Approved:     ${DRY_RUN ? pendingOpps.length + ' (dry run)' : oppStats.approved}`);
  console.log(`     Logos:        ${oppStats.logos}`);
  console.log(`     OG images:    ${oppStats.ogImages}`);
  console.log(`     Screenshots:  ${oppStats.screenshots}`);
  if (oppStats.failed > 0) console.log(`     Failed:       ${oppStats.failed}`);
  console.log('');
  console.log('   News:');
  console.log(`     Published:    ${DRY_RUN ? pendingNews.length + ' (dry run)' : newsStats.published}`);
  if (newsStats.failed > 0) console.log(`     Failed:       ${newsStats.failed}`);
  console.log('\n' + '─'.repeat(60) + '\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
