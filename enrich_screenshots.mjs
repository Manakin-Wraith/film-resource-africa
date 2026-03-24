/**
 * Enrich Screenshots — Capture banner screenshots of opportunity pages via Playwright
 *
 * For each opportunity missing an og_image_url:
 *   1. Launch headless Chromium and navigate to the Apply URL
 *   2. Wait for page to settle (network idle + short delay)
 *   3. Dismiss common cookie/consent banners
 *   4. Capture a 1200×630 viewport screenshot (social-media banner ratio)
 *   5. Save as WebP under /public/og-screenshots/{id}.webp
 *   6. Update og_image_url in Supabase to the local path
 *
 * Usage:
 *   node enrich_screenshots.mjs              # capture missing screenshots
 *   node enrich_screenshots.mjs --dry-run    # preview only
 *   node enrich_screenshots.mjs --force      # re-capture all
 *   node enrich_screenshots.mjs --limit=20   # cap at N screenshots
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
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
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

const SCREENSHOTS_DIR = join(process.cwd(), 'public', 'og-screenshots');
if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Viewport — social media banner ratio (1200×630 ≈ 1.9:1)
const VIEWPORT = { width: 1200, height: 630 };

// Platform domains we should skip
const PLATFORM_DOMAINS = new Set([
  'lnkd.in', 'linkedin.com', 'facebook.com', 'fb.com', 'filmfreeway.com',
  'forms.gle', 'docs.google.com', 'airtable.com', 'bit.ly', 't.co',
  'tinyurl.com', 'ow.ly', 'youtube.com', 'youtu.be', 'twitter.com',
  'x.com', 'instagram.com', 'eventbrite.com', 'submittable.com',
]);

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

async function supabaseUpdate(id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
}

// ─── Cookie banner dismissal ────────────────────────────────────────────────

async function dismissCookieBanners(page) {
  // Common cookie consent button selectors
  const selectors = [
    // Text-based
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("OK")',
    'button:has-text("Got it")',
    'button:has-text("Allow")',
    'button:has-text("Agree")',
    'button:has-text("Consent")',
    'button:has-text("Continue")',
    // ID/class based
    '#onetrust-accept-btn-handler',
    '#cookie-accept',
    '.cookie-accept',
    '[data-testid="cookie-accept"]',
    '.cc-accept',
    '.cc-btn.cc-dismiss',
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
    } catch {
      // Selector not found or not clickable, continue
    }
  }
  return false;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📸 FRA Screenshot Enricher${DRY_RUN ? ' (DRY RUN)' : ''}${FORCE ? ' (FORCE)' : ''}\n`);

  // Fetch opportunities
  const query = FORCE
    ? 'select=id,title,"Apply:",og_image_url&status=eq.approved&order=id.asc'
    : 'select=id,title,"Apply:",og_image_url&status=eq.approved&og_image_url=is.null&order=id.asc';
  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?${query}`, { headers });
  const allOpps = await res.json();

  // Filter out platform domains and already-screenshotted
  const opps = allOpps.filter(opp => {
    const url = opp['Apply:'];
    if (!url) return false;
    const domain = extractDomain(url);
    if (!domain || isPlatformDomain(domain)) return false;
    if (!FORCE) {
      const localFile = join(SCREENSHOTS_DIR, `${opp.id}.jpg`);
      if (existsSync(localFile)) return false;
    }
    return true;
  }).slice(0, LIMIT);

  console.log(`   ${allOpps.length} total → ${opps.length} to screenshot\n`);

  if (opps.length === 0) {
    console.log('   Nothing to do!\n');
    return;
  }

  if (DRY_RUN) {
    for (const opp of opps) {
      console.log(`  [DRY] #${opp.id} ${opp.title.slice(0, 55)} → ${opp['Apply:'].slice(0, 50)}`);
    }
    console.log(`\n   Would screenshot ${opps.length} pages\n`);
    return;
  }

  // Launch Playwright
  let chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    console.error('Playwright not available. Install with: npm install playwright');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'en-US',
    ignoreHTTPSErrors: true,
  });

  let captured = 0, failed = 0, skipped = 0;

  for (const opp of opps) {
    const url = opp['Apply:'];
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;

    const outFile = join(SCREENSHOTS_DIR, `${opp.id}.jpg`);
    const localPath = `/og-screenshots/${opp.id}.jpg`;

    try {
      const page = await context.newPage();

      // Navigate with a generous timeout
      await page.goto(fullUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });

      // Wait for network to settle
      try {
        await page.waitForLoadState('networkidle', { timeout: 8000 });
      } catch {
        // Some pages never fully idle — that's fine
      }

      // Extra settle time for JS rendering
      await page.waitForTimeout(1500);

      // Try to dismiss cookie banners
      await dismissCookieBanners(page);
      await page.waitForTimeout(500);

      // Capture screenshot as WebP for smaller file size
      await page.screenshot({
        path: outFile,
        type: 'jpeg',
        quality: 80,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      });

      await page.close();

      // Update Supabase
      await supabaseUpdate(opp.id, { og_image_url: localPath });
      console.log(`  ✅ #${opp.id} ${opp.title.slice(0, 50)}`);
      captured++;

    } catch (err) {
      console.log(`  ✗ #${opp.id} ${opp.title.slice(0, 50)} — ${err.message.slice(0, 60)}`);
      failed++;
    }
  }

  await browser.close();

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Screenshot Enrichment Summary`);
  console.log(`   Captured:  ${captured}`);
  console.log(`   Failed:    ${failed}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`${'─'.repeat(50)}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
