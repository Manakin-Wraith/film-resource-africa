/**
 * Shared utilities for FRA weekly digest insert scripts.
 *
 * Usage:
 *   import { loadEnv, getTitles, insertRecord, verifyPublicationDate } from './digest_utils.mjs';
 */

import { readFileSync } from 'fs';

// ─── Env ──────────────────────────────────────────────────────────────────────

export function loadEnv(path = '.env.local') {
  const raw = readFileSync(path, 'utf-8');
  return Object.fromEntries(
    raw.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
  );
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

export async function getTitles(table, { supabaseUrl, headers }) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=title`, { headers });
  const data = await res.json();
  return new Set(data.map(r => r.title.toLowerCase().trim()));
}

export async function insertRecord(table, item, { supabaseUrl, headers }) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`INSERT failed [${table}]: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Date verification ────────────────────────────────────────────────────────

export const STALE_THRESHOLD_DAYS = 180;

/**
 * Fetch an article URL and extract its publication date from common meta patterns.
 *
 * Returns:
 *   { isoDate: string, dayAge: number, isStale: boolean } on success
 *   { isoDate: null, error: string }                       on failure
 *
 * Patterns checked (in order):
 *   1. <meta property="article:published_time">
 *   2. <meta property="og:article:published_time">
 *   3. JSON-LD "datePublished"
 *   4. <time datetime="..."> (first occurrence)
 *   5. "published_date":"..." or "published":"..." in inline JSON
 */
export async function verifyPublicationDate(url, thresholdDays = STALE_THRESHOLD_DAYS) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FRA-digest-verifier/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { isoDate: null, error: `HTTP ${res.status}` };
    const html = await res.text();

    const patterns = [
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i,
      /<meta[^>]+property=["']og:article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:article:published_time["']/i,
      /"datePublished"\s*:\s*"([^"]+)"/i,
      /<time[^>]+datetime=["']([^"']+)["']/i,
      /"published_date"\s*:\s*"([^"]+)"/i,
      /"published"\s*:\s*"(\d{4}-\d{2}-\d{2}[^"]+)"/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const parsed = new Date(match[1]);
        if (!isNaN(parsed.getTime())) {
          const dayAge = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
          return {
            isoDate: parsed.toISOString().slice(0, 10),
            dayAge,
            isStale: dayAge > thresholdDays,
          };
        }
      }
    }

    return { isoDate: null, error: 'no date found in page' };
  } catch (err) {
    return { isoDate: null, error: err.message };
  }
}

/**
 * Run date verification on a news article and log the result.
 * Returns true if the article should be inserted (not stale, or force=true).
 */
export async function checkAndLogDate(article, { force = false } = {}) {
  process.stdout.write(`  Verifying date: ${article.title.slice(0, 60)}…`);
  const dateCheck = await verifyPublicationDate(article.url);

  if (dateCheck.isoDate) {
    const ageLabel = dateCheck.dayAge > 365
      ? `${Math.floor(dateCheck.dayAge / 365)}yr ${Math.floor((dateCheck.dayAge % 365) / 30)}mo`
      : `${dateCheck.dayAge}d`;
    const staleFlag = dateCheck.isStale ? ' ⚠️  STALE' : ' ✓';
    console.log(` ${dateCheck.isoDate} (${ageLabel})${staleFlag}`);

    if (dateCheck.isStale && !force) {
      console.log(`  🚫 BLOCKED — article is ${dateCheck.dayAge} days old (>${STALE_THRESHOLD_DAYS}d). Use --force to override.`);
      return false;
    }
  } else {
    console.log(` date unknown (${dateCheck.error})`);
  }

  return true;
}
