/**
 * Enrich Logos — Batch fetch organisation logos for opportunities
 *
 * For each opportunity with no logo and a valid Apply URL:
 *   1. Try Google Favicon API (128px PNG)
 *   2. Save to /public/logos/{domain}.png
 *   3. Update the `logo` field in Supabase
 *
 * Usage:
 *   node enrich_logos.mjs              # fetch missing logos
 *   node enrich_logos.mjs --dry-run    # preview only, no writes
 *   node enrich_logos.mjs --force      # re-fetch even if logo exists
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
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

const LOGOS_DIR = join(process.cwd(), 'public', 'logos');
if (!existsSync(LOGOS_DIR)) mkdirSync(LOGOS_DIR, { recursive: true });

// Minimum file size to consider a valid logo (skip 1x1 placeholders)
const MIN_LOGO_BYTES = 200;

// Platform domains — these are hosting/sourcing platforms, not the actual org
const PLATFORM_DOMAINS = new Set([
  'lnkd.in', 'linkedin.com',
  'facebook.com', 'fb.com',
  'filmfreeway.com',
  'forms.gle', 'docs.google.com',
  'airtable.com',
  'bit.ly', 't.co', 'tinyurl.com', 'ow.ly',
  'youtube.com', 'youtu.be',
  'twitter.com', 'x.com',
  'instagram.com',
  'eventbrite.com',
  'submittable.com',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractDomain(url) {
  try {
    let u = url.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    const parsed = new URL(u);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isPlatformDomain(domain) {
  if (!domain) return false;
  return PLATFORM_DOMAINS.has(domain) || PLATFORM_DOMAINS.has(domain.replace(/^[^.]+\./, ''));
}

async function resolveRedirect(url) {
  try {
    let u = url.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    const res = await fetch(u, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-LogoEnricher/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const finalUrl = res.url;
    const finalDomain = extractDomain(finalUrl);
    if (finalDomain && !isPlatformDomain(finalDomain)) {
      return { url: finalUrl, domain: finalDomain };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchGoogleFavicon(domain) {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-LogoEnricher/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < MIN_LOGO_BYTES) return null;
    return buffer;
  } catch {
    return null;
  }
}

async function fetchOgImage(url) {
  try {
    let u = url.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    const res = await fetch(u, {
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-LogoEnricher/1.0' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Try apple-touch-icon first (usually higher quality than favicon)
    const touchIcon = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i);
    if (touchIcon) {
      const iconUrl = touchIcon[1].startsWith('http') ? touchIcon[1] : new URL(touchIcon[1], u).href;
      const iconRes = await fetch(iconUrl, { signal: AbortSignal.timeout(8000) });
      if (iconRes.ok) {
        const buf = Buffer.from(await iconRes.arrayBuffer());
        if (buf.length >= MIN_LOGO_BYTES) return buf;
      }
    }

    // Try large favicon link
    const faviconLink = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
    if (faviconLink) {
      const iconUrl = faviconLink[1].startsWith('http') ? faviconLink[1] : new URL(faviconLink[1], u).href;
      const iconRes = await fetch(iconUrl, { signal: AbortSignal.timeout(8000) });
      if (iconRes.ok) {
        const buf = Buffer.from(await iconRes.arrayBuffer());
        if (buf.length >= MIN_LOGO_BYTES) return buf;
      }
    }

    return null;
  } catch {
    return null;
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
  console.log(`\n🎨 FRA Logo Enricher${DRY_RUN ? ' (DRY RUN)' : ''}${FORCE ? ' (FORCE)' : ''}\n`);

  // Fetch opportunities
  const query = FORCE
    ? 'select=id,title,"Apply:",logo&status=eq.approved&order=id.asc'
    : 'select=id,title,"Apply:",logo&status=eq.approved&logo=is.null&order=id.asc';
  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?${query}`, { headers });
  const opps = await res.json();
  console.log(`   ${opps.length} opportunities ${FORCE ? 'total' : 'missing logos'}\n`);

  let fetched = 0, skipped = 0, failed = 0, alreadyLocal = 0;

  for (const opp of opps) {
    const url = opp['Apply:'];
    if (!url) { skipped++; continue; }

    let domain = extractDomain(url);
    if (!domain) { skipped++; continue; }

    // If the URL points to a platform, try to resolve the redirect to find the real org
    if (isPlatformDomain(domain)) {
      console.log(`  ↻ #${opp.id} ${opp.title.slice(0, 45)} — resolving ${domain}...`);
      const resolved = await resolveRedirect(url);
      if (resolved) {
        domain = resolved.domain;
        console.log(`    → resolved to ${domain}`);
      } else {
        console.log(`    → could not resolve, clearing platform logo`);
        if (!DRY_RUN && opp.logo) await supabaseUpdate(opp.id, { logo: null });
        skipped++;
        continue;
      }
    }

    const localPath = `/logos/${domain}.png`;
    const localFile = join(LOGOS_DIR, `${domain}.png`);

    // Check if we already have this domain's logo locally
    if (existsSync(localFile) && !FORCE) {
      if (!opp.logo || isPlatformDomain(extractDomain(opp.logo?.replace('/logos/', 'https://') || ''))) {
        // Logo file exists but DB not updated or has platform logo — fix it
        if (!DRY_RUN) await supabaseUpdate(opp.id, { logo: localPath });
        console.log(`  ✅ #${opp.id} ${opp.title.slice(0, 50)} — linked existing ${domain}`);
        alreadyLocal++;
      }
      continue;
    }

    // Try Google Favicon API
    let logoBuffer = await fetchGoogleFavicon(domain);
    let source = 'google-favicon';

    // Fallback: scrape the page for apple-touch-icon or favicon link
    if (!logoBuffer) {
      logoBuffer = await fetchOgImage(url);
      source = 'page-scrape';
    }

    if (logoBuffer) {
      if (DRY_RUN) {
        console.log(`  [DRY] #${opp.id} ${opp.title.slice(0, 50)} — would save ${domain} (${logoBuffer.length}B via ${source})`);
      } else {
        writeFileSync(localFile, logoBuffer);
        await supabaseUpdate(opp.id, { logo: localPath });
        console.log(`  ✅ #${opp.id} ${opp.title.slice(0, 50)} — ${domain} (${logoBuffer.length}B via ${source})`);
      }
      fetched++;
    } else {
      // Clear platform logo if we can't find a real one
      if (!DRY_RUN && opp.logo) await supabaseUpdate(opp.id, { logo: null });
      console.log(`  ✗ #${opp.id} ${opp.title.slice(0, 50)} — no logo found for ${domain}`);
      failed++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Logo Enrichment Summary`);
  console.log(`   Fetched:       ${fetched}`);
  console.log(`   Linked local:  ${alreadyLocal}`);
  console.log(`   Skipped:       ${skipped}`);
  console.log(`   Failed:        ${failed}`);
  console.log(`${'─'.repeat(50)}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
