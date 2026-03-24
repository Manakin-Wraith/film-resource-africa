#!/usr/bin/env node
/**
 * Sync script: auto-tag opportunities to countries based on text matching.
 *
 * Usage:
 *   node scripts/sync-country-opportunities.mjs          # dry-run (prints matches)
 *   node scripts/sync-country-opportunities.mjs --apply   # writes to DB
 *
 * Uses the Supabase REST API directly (no JS client needed).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env.local');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* ignore */ }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');

/** Simple REST wrapper for Supabase */
async function query(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function insert(table, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST ${table}: ${res.status} ${body}`);
  }
}

// Country keywords for detection (slug → keywords)
const COUNTRY_KEYWORDS = {
  nigeria: ['nigeria', 'nigerian', 'lagos', 'nollywood', 'abuja'],
  'south-africa': ['south africa', 'south african', 'cape town', 'johannesburg', 'durban', 'joburg', 'pretoria'],
  kenya: ['kenya', 'kenyan', 'nairobi', 'mombasa'],
  ghana: ['ghana', 'ghanaian', 'accra', 'ghallywood', 'kumasi'],
  egypt: ['egypt', 'egyptian', 'cairo', 'alexandria'],
  morocco: ['morocco', 'moroccan', 'marrakech', 'casablanca', 'ouarzazate', 'rabat'],
  tanzania: ['tanzania', 'tanzanian', 'dar es salaam', 'zanzibar', 'dodoma'],
  ethiopia: ['ethiopia', 'ethiopian', 'addis ababa', 'addis'],
};

const PAN_AFRICAN_KEYWORDS = ['africa', 'african', 'pan-african', 'continent'];

async function main() {
  console.log(`\n🎬 Country–Opportunity Sync ${APPLY ? '(APPLY mode)' : '(DRY RUN)'}\n`);

  // 1. Fetch all countries
  const countries = await query('countries', 'select=id,slug,name');
  if (!countries?.length) { console.error('❌ No countries found'); process.exit(1); }

  const slugToId = Object.fromEntries(countries.map((c) => [c.slug, c.id]));
  const slugToName = Object.fromEntries(countries.map((c) => [c.slug, c.name]));
  console.log(`📍 ${countries.length} countries loaded\n`);

  // 2. Fetch all approved opportunities
  const opps = await query('opportunities', 'select=*&status=eq.approved');
  if (!opps?.length) { console.error('❌ No approved opportunities found'); process.exit(1); }

  console.log(`🎯 ${opps.length} approved opportunities loaded\n`);

  // 3. Match each opportunity against country keywords
  const links = [];
  let matchCount = 0;

  for (const opp of opps) {
    const text = [
      opp.title || '',
      opp['Who Can Apply / Eligibility'] || '',
      opp['What Is It?'] || '',
    ].join(' ').toLowerCase();

    const matchedSlugs = new Set();

    for (const [slug, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
      if (keywords.some((kw) => text.includes(kw))) {
        matchedSlugs.add(slug);
      }
    }

    // Pan-African opps get tagged to all countries (only if no specific match)
    const isPanAfrican = PAN_AFRICAN_KEYWORDS.some((kw) => text.includes(kw));
    if (isPanAfrican && matchedSlugs.size === 0) {
      for (const slug of Object.keys(COUNTRY_KEYWORDS)) matchedSlugs.add(slug);
    }

    if (matchedSlugs.size > 0) {
      matchCount++;
      const names = [...matchedSlugs].map((s) => slugToName[s] || s);
      console.log(`  ✅ [${opp.id}] ${opp.title.slice(0, 60)}${opp.title.length > 60 ? '...' : ''}`);
      console.log(`     → ${names.join(', ')}`);

      for (const slug of matchedSlugs) {
        if (slugToId[slug]) links.push({ opportunity_id: opp.id, country_id: slugToId[slug] });
      }
    }
  }

  console.log(`\n📊 ${matchCount}/${opps.length} opportunities matched to countries`);
  console.log(`📎 ${links.length} total links to create\n`);

  if (!APPLY) {
    console.log('ℹ️  Dry run — no changes written. Run with --apply to write to DB.\n');
    return;
  }

  // 4. Insert links in batches (duplicates ignored via Prefer header)
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize);
    try {
      await insert('opportunity_countries', batch);
      inserted += batch.length;
    } catch (err) {
      console.error(`❌ Batch at offset ${i}:`, err.message);
    }
  }

  console.log(`✅ Inserted ${inserted} links\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
