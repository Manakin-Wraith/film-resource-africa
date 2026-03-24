/**
 * Comprehensive duplicate check across ALL approved opportunities.
 * Uses multiple matching strategies:
 *   1. Exact title match
 *   2. Substring containment
 *   3. Keyword overlap (≥50%)
 *   4. URL match (normalized)
 *   5. Levenshtein distance (for typo variants)
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

// ── Matching utilities ──

const STOPWORDS = new Set(['the','and','for','from','with','this','that','are','was','were','been','have','has',
  'its','not','but','what','all','can','had','her','one','our','out','you','his','how','into','who',
  'will','each','make','like','long','look','many','some','them','than','then','these','would',
  'about','could','other','after','more','also','back','been','being','both','came','come','does',
  'done','down','even','find','give','going','good','here','just','know','most','much','must','need',
  'only','over','said','should','show','side','such','take','tell','very','want','well','went',
  'when','where','which','while','your','open','new','now','film','films','2026','2025','2027','call',
  'award','awards','edition','announces','announced','applications','programme','program']);

function extractKeywords(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

function keywordOverlap(a, b) {
  const kwA = new Set(extractKeywords(a));
  const kwB = new Set(extractKeywords(b));
  if (kwA.size === 0 || kwB.size === 0) return 0;
  let overlap = 0;
  for (const w of kwA) if (kwB.has(w)) overlap++;
  return overlap / Math.min(kwA.size, kwB.size);
}

function normalizeUrl(u) {
  if (!u) return '';
  return u.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .replace(/\?.*$/, '')
    .replace(/#.*$/, '');
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function normalizeTitle(t) {
  return t.toLowerCase()
    .replace(/\([^)]*\)/g, ' ')     // strip parentheticals
    .replace(/[^a-z0-9\s]/g, ' ')   // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log('🔍 Comprehensive Duplicate Check — All Opportunities\n');

  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?select=id,title,status,"Apply:","What Is It?",category&order=id.asc&limit=500`, { headers });
  const allOpps = await res.json();

  console.log(`Total opportunities: ${allOpps.length}`);
  console.log(`  Approved: ${allOpps.filter(o => o.status === 'approved').length}`);
  console.log(`  Rejected: ${allOpps.filter(o => o.status === 'rejected').length}`);
  console.log(`  Pending:  ${allOpps.filter(o => o.status === 'pending').length}\n`);

  // Only check approved (and pending if any remain)
  const active = allOpps.filter(o => o.status === 'approved' || o.status === 'pending');

  const duplicates = [];
  const checked = new Set();

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const pairKey = `${a.id}-${b.id}`;
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      const na = normalizeTitle(a.title);
      const nb = normalizeTitle(b.title);
      const reasons = [];

      // 1. Exact title match
      if (na === nb) {
        reasons.push('EXACT title match');
      }

      // 2. Substring containment (titles > 15 chars)
      if (na.length > 15 && nb.length > 15) {
        if (na.includes(nb) || nb.includes(na)) {
          reasons.push('Substring containment');
        }
      }

      // 3. Keyword overlap ≥ 60%
      const kwOverlap = keywordOverlap(a.title, b.title);
      if (kwOverlap >= 0.6) {
        reasons.push(`Keyword overlap: ${(kwOverlap * 100).toFixed(0)}%`);
      }

      // 4. URL match
      const urlA = normalizeUrl(a['Apply:']);
      const urlB = normalizeUrl(b['Apply:']);
      if (urlA && urlB && urlA === urlB) {
        reasons.push('Same URL');
      }

      // 5. Levenshtein similarity (for titles of similar length)
      if (Math.abs(na.length - nb.length) < 15 && na.length > 10) {
        const dist = levenshtein(na, nb);
        const maxLen = Math.max(na.length, nb.length);
        const similarity = 1 - (dist / maxLen);
        if (similarity >= 0.8) {
          reasons.push(`Levenshtein: ${(similarity * 100).toFixed(0)}% similar`);
        }
      }

      if (reasons.length > 0) {
        duplicates.push({ a, b, reasons });
      }
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found! All opportunities are unique.\n');
    return;
  }

  console.log('═'.repeat(70));
  console.log(`🔴 FOUND ${duplicates.length} POTENTIAL DUPLICATE PAIRS`);
  console.log('═'.repeat(70));

  for (let idx = 0; idx < duplicates.length; idx++) {
    const { a, b, reasons } = duplicates[idx];
    console.log(`\n── Pair ${idx + 1} ──`);
    console.log(`  #${a.id} [${a.status}] "${a.title}"`);
    console.log(`    URL: ${(a['Apply:'] || 'none').slice(0, 70)}`);
    console.log(`    Cat: ${a.category || 'none'} | Desc: ${(a['What Is It?'] || '').length} chars`);
    console.log(`  #${b.id} [${b.status}] "${b.title}"`);
    console.log(`    URL: ${(b['Apply:'] || 'none').slice(0, 70)}`);
    console.log(`    Cat: ${b.category || 'none'} | Desc: ${(b['What Is It?'] || '').length} chars`);
    console.log(`  Reasons: ${reasons.join(' | ')}`);

    // Suggest which to keep (longer description = more enriched)
    const descA = (a['What Is It?'] || '').length;
    const descB = (b['What Is It?'] || '').length;
    if (descA > descB + 50) {
      console.log(`  → Suggest: KEEP #${a.id} (richer), DELETE #${b.id}`);
    } else if (descB > descA + 50) {
      console.log(`  → Suggest: KEEP #${b.id} (richer), DELETE #${a.id}`);
    } else {
      console.log(`  → Suggest: Manual review — similar quality`);
    }
  }

  // Output delete commands
  console.log('\n' + '═'.repeat(70));
  console.log('📋 SUGGESTED ACTIONS');
  console.log('═'.repeat(70));
  const toDelete = new Set();
  for (const { a, b } of duplicates) {
    const descA = (a['What Is It?'] || '').length;
    const descB = (b['What Is It?'] || '').length;
    if (descA >= descB) toDelete.add(b.id);
    else toDelete.add(a.id);
  }
  if (toDelete.size > 0) {
    console.log(`\nDelete IDs (keep the richer record): [${[...toDelete].join(', ')}]`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
