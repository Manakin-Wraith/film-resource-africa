/**
 * FRA Daily Growth Snapshot
 *
 * Captures a point-in-time snapshot of all key metrics and stores in
 * the growth_snapshots table for trend analysis and projections.
 *
 * Usage:
 *   node snapshot_growth.mjs          # take today's snapshot
 *   node snapshot_growth.mjs --backfill  # backfill from existing data
 *
 * Intended to run daily via cron.
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
const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
};

const BACKFILL = process.argv.includes('--backfill');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function supabaseGet(table, query = '') {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers });
  return res.json();
}

async function supabaseCount(table, filter = '') {
  const q = filter ? `${filter}&` : '';
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${q}select=id&limit=0`, {
    headers: { ...headers, Prefer: 'count=exact' },
  });
  const range = res.headers.get('content-range') || '*/0';
  return parseInt(range.split('/')[1]) || 0;
}

async function supabaseUpsert(table, data) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(data),
  });
  return res.json();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Snapshot for a given date ───────────────────────────────────────────────

async function takeSnapshot(date, { historical = false } = {}) {
  const dayStart = `${date}T00:00:00Z`;
  const dayEnd = `${date}T23:59:59Z`;

  // For backfill: count rows created on or before this date (cumulative)
  // For daily: count all rows (current totals)
  const lte = historical ? `created_at=lte.${dayEnd}&` : '';
  const ltePub = historical ? `published_at=lte.${dayEnd}&` : '';

  // Subscribers
  const totalSubs = await supabaseCount('newsletter_subscriptions', historical ? `created_at=lte.${dayEnd}` : '');
  const activeSubs = await supabaseCount('newsletter_subscriptions', historical ? `status=eq.active&created_at=lte.${dayEnd}` : 'status=eq.active');
  const newSubsToday = await supabaseCount(
    'newsletter_subscriptions',
    `created_at=gte.${dayStart}&created_at=lte.${dayEnd}`
  );

  // News
  const totalNews = await supabaseCount('news', historical ? `published_at=lte.${dayEnd}` : '');
  const newNewsToday = await supabaseCount(
    'news',
    `published_at=gte.${dayStart}&published_at=lte.${dayEnd}`
  );

  // Opportunities
  const totalOpps = await supabaseCount('opportunities', historical ? `created_at=lte.${dayEnd}` : '');
  const newOppsToday = await supabaseCount(
    'opportunities',
    `created_at=gte.${dayStart}&created_at=lte.${dayEnd}`
  );
  const approvedOpps = await supabaseCount('opportunities', historical ? `status=eq.approved&created_at=lte.${dayEnd}` : 'status=eq.approved');
  const pendingOpps = await supabaseCount('opportunities', historical ? `status=eq.pending&created_at=lte.${dayEnd}` : 'status=eq.pending');

  // Newsletter sends
  const totalSends = await supabaseCount('newsletter_sends', historical ? `sent_at=lte.${dayEnd}` : '');
  const totalOpens = await supabaseCount('newsletter_sends', historical ? `opened_at=not.is.null&sent_at=lte.${dayEnd}` : 'opened_at=not.is.null');
  const totalClicks = await supabaseCount('newsletter_sends', historical ? `clicked_at=not.is.null&sent_at=lte.${dayEnd}` : 'clicked_at=not.is.null');

  // Partners
  const totalPartners = await supabaseCount('partners', historical ? `created_at=lte.${dayEnd}` : '');

  // Sponsor clicks/impressions today
  const sponsorClicksToday = await supabaseCount(
    'sponsored_clicks',
    `clicked_at=gte.${dayStart}&clicked_at=lte.${dayEnd}`
  );
  const sponsorImpressionsToday = await supabaseCount(
    'sponsored_impressions',
    `viewed_at=gte.${dayStart}&viewed_at=lte.${dayEnd}`
  );

  // Page views today (from drain)
  const pvToday = await supabaseCount(
    'page_views',
    `timestamp=gte.${dayStart}&timestamp=lte.${dayEnd}&event_type=eq.pageview`
  );

  // Unique sessions/devices today — need actual data for distinct counts
  let uniqueSessionsToday = 0;
  let uniqueDevicesToday = 0;
  try {
    const pvData = await supabaseGet(
      'page_views',
      `select=session_id,device_id&timestamp=gte.${dayStart}&timestamp=lte.${dayEnd}&event_type=eq.pageview&limit=10000`
    );
    if (Array.isArray(pvData)) {
      uniqueSessionsToday = new Set(pvData.map(p => p.session_id).filter(Boolean)).size;
      uniqueDevicesToday = new Set(pvData.map(p => p.device_id).filter(Boolean)).size;
    }
  } catch (e) { /* drain may not have data yet */ }

  // Directory
  const totalDir = await supabaseCount('directory_listings');
  const totalCallSheet = await supabaseCount('call_sheet_listings');

  const snapshot = {
    snapshot_date: date,
    total_subscribers: totalSubs,
    new_subscribers_today: newSubsToday,
    active_subscribers: activeSubs,
    total_news: totalNews,
    new_news_today: newNewsToday,
    total_opportunities: totalOpps,
    new_opportunities_today: newOppsToday,
    approved_opportunities: approvedOpps,
    pending_opportunities: pendingOpps,
    total_newsletter_sends: totalSends,
    total_newsletter_opens: totalOpens,
    total_newsletter_clicks: totalClicks,
    total_partners: totalPartners,
    sponsor_clicks_today: sponsorClicksToday,
    sponsor_impressions_today: sponsorImpressionsToday,
    pageviews_today: pvToday,
    unique_sessions_today: uniqueSessionsToday,
    unique_devices_today: uniqueDevicesToday,
    total_directory_listings: totalDir,
    total_call_sheet_listings: totalCallSheet,
  };

  const result = await supabaseUpsert('growth_snapshots', snapshot);
  console.log(`  ✓ ${date}: subs=${totalSubs} news=${totalNews} opps=${totalOpps} pv=${pvToday} new_subs=+${newSubsToday}`);
  return result;
}

// ─── Backfill from existing data ─────────────────────────────────────────────

async function backfill() {
  console.log('Backfilling growth snapshots from existing data...\n');

  // Find the earliest subscriber date
  const subs = await supabaseGet(
    'newsletter_subscriptions',
    'select=created_at&order=created_at.asc&limit=1'
  );
  const news = await supabaseGet(
    'news',
    'select=published_at&order=published_at.asc&limit=1'
  );

  const earliest = [
    subs[0]?.created_at,
    news[0]?.published_at,
  ].filter(Boolean).sort()[0];

  if (!earliest) {
    console.log('No data to backfill from.');
    return;
  }

  const startDate = new Date(earliest);
  startDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = [];
  const d = new Date(startDate);
  while (d <= today) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }

  console.log(`Backfilling ${dates.length} days: ${dates[0]} → ${dates[dates.length - 1]}\n`);

  for (const date of dates) {
    await takeSnapshot(date, { historical: true });
  }

  console.log(`\n✅ Backfill complete: ${dates.length} snapshots`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📊 FRA Growth Snapshot\n');

  if (BACKFILL) {
    await backfill();
  } else {
    const date = todayStr();
    console.log(`Taking snapshot for ${date}...\n`);
    await takeSnapshot(date);
    console.log('\n✅ Snapshot complete');
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
