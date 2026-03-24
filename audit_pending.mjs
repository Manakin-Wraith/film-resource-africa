/**
 * Audit pending opportunities in Supabase:
 *   1. Fetch all pending + approved opps
 *   2. Identify duplicates (pending vs approved, and pending vs pending)
 *   3. Report thin/incomplete records needing enrichment
 *   4. Output actionable summary
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

async function supabaseGet(table, query) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── Keyword overlap dedup (same logic as scanner) ──
const STOPWORDS = new Set(['the','and','for','from','with','this','that','are','was','were','been','have','has',
  'its','not','but','what','all','can','had','her','one','our','out','you','his','how','into','who',
  'will','each','make','like','long','look','many','some','them','than','then','these','would',
  'about','could','other','after','more','also','back','been','being','both','came','come','does',
  'done','down','even','find','give','going','good','here','just','know','most','much','must','need',
  'only','over','said','should','show','side','such','take','tell','very','want','well','went',
  'when','where','which','while','your','open','new','now','film','films','2026','2025','call',
  'award','awards','edition','announces','announced','applications']);

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

function isSimilar(a, b) {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 'exact';
  if (na.length > 15 && nb.length > 15 && (na.includes(nb) || nb.includes(na))) return 'substring';
  if (keywordOverlap(na, nb) >= 0.5) return 'keyword-overlap';
  return null;
}

async function main() {
  console.log('🔍 Fetching all opportunities from Supabase...\n');

  const allOpps = await supabaseGet('opportunities',
    'select=id,title,status,"What Is It?","Apply:","For Films or Series?","Next Deadline","Who Can Apply / Eligibility","What Do You Get If Selected?","Cost",category,application_status&order=id.asc&limit=500');

  const pending = allOpps.filter(o => o.status === 'pending');
  const approved = allOpps.filter(o => o.status === 'approved');

  console.log(`📊 Total: ${allOpps.length} | Approved: ${approved.length} | Pending: ${pending.length}\n`);

  // ── 1. Find duplicates: pending vs approved ──
  console.log('═'.repeat(70));
  console.log('🔴 DUPLICATES: Pending opps that match an existing APPROVED opp');
  console.log('═'.repeat(70));
  const dupsOfApproved = [];
  for (const p of pending) {
    for (const a of approved) {
      const match = isSimilar(p.title, a.title);
      if (match) {
        dupsOfApproved.push({ pendingId: p.id, pendingTitle: p.title, approvedId: a.id, approvedTitle: a.title, matchType: match });
        console.log(`  [${match}] PENDING #${p.id}: "${p.title.slice(0, 60)}"`);
        console.log(`           ↔ APPROVED #${a.id}: "${a.title.slice(0, 60)}"`);
        break;
      }
    }
  }
  console.log(`\n  → ${dupsOfApproved.length} pending opps duplicate an approved record.\n`);

  // ── 2. Find duplicates: pending vs pending ──
  console.log('═'.repeat(70));
  console.log('🟡 DUPLICATES: Pending opps that match ANOTHER pending opp');
  console.log('═'.repeat(70));
  const pendingDups = [];
  const seen = new Set();
  for (let i = 0; i < pending.length; i++) {
    if (seen.has(pending[i].id)) continue;
    for (let j = i + 1; j < pending.length; j++) {
      if (seen.has(pending[j].id)) continue;
      const match = isSimilar(pending[i].title, pending[j].title);
      if (match) {
        pendingDups.push({ id1: pending[i].id, title1: pending[i].title, id2: pending[j].id, title2: pending[j].title, matchType: match });
        seen.add(pending[j].id);
        console.log(`  [${match}] #${pending[i].id}: "${pending[i].title.slice(0, 55)}" ↔ #${pending[j].id}: "${pending[j].title.slice(0, 55)}"`);
      }
    }
  }
  console.log(`\n  → ${pendingDups.length} duplicate pairs within pending set.\n`);

  // ── 3. Identify thin/incomplete records needing enrichment ──
  console.log('═'.repeat(70));
  console.log('🟠 INCOMPLETE: Pending opps with "To be confirmed" fields');
  console.log('═'.repeat(70));

  const dupPendingIds = new Set([...dupsOfApproved.map(d => d.pendingId), ...pendingDups.map(d => d.id2)]);
  const unique = pending.filter(p => !dupPendingIds.has(p.id));

  let needsEnrichCount = 0;
  const enrichable = [];
  for (const p of unique) {
    const tbcFields = [];
    if ((p['For Films or Series?'] || '') === 'To be confirmed') tbcFields.push('Format');
    if ((p['Next Deadline'] || '') === 'To be confirmed') tbcFields.push('Deadline');
    if ((p['Who Can Apply / Eligibility'] || '') === 'To be confirmed') tbcFields.push('Eligibility');
    if ((p['What Do You Get If Selected?'] || '') === 'To be confirmed') tbcFields.push('Benefits');
    if ((p['Cost'] || '') === 'To be confirmed') tbcFields.push('Cost');
    if (!p.category) tbcFields.push('Category');

    const descLen = (p['What Is It?'] || '').length;
    const hasUrl = !!(p['Apply:'] && p['Apply:'].startsWith('http'));

    if (tbcFields.length > 0 || descLen < 100) {
      needsEnrichCount++;
      enrichable.push({ ...p, tbcFields, descLen, hasUrl });
      console.log(`  #${p.id} "${p.title.slice(0, 55)}"`);
      console.log(`       TBC: [${tbcFields.join(', ')}] | Desc: ${descLen} chars | URL: ${hasUrl ? p['Apply:'].slice(0, 50) : 'NONE'}`);
    }
  }
  console.log(`\n  → ${needsEnrichCount} unique pending opps need enrichment.`);
  console.log(`  → ${unique.length - needsEnrichCount} unique pending opps appear complete.\n`);

  // ── 4. Ready to approve (complete + unique) ──
  console.log('═'.repeat(70));
  console.log('🟢 READY TO APPROVE: Complete unique pending opps');
  console.log('═'.repeat(70));
  const readyToApprove = unique.filter(p => {
    const tbcFields = [];
    if ((p['For Films or Series?'] || '') === 'To be confirmed') tbcFields.push('Format');
    if ((p['Next Deadline'] || '') === 'To be confirmed') tbcFields.push('Deadline');
    if ((p['Who Can Apply / Eligibility'] || '') === 'To be confirmed') tbcFields.push('Eligibility');
    if ((p['What Do You Get If Selected?'] || '') === 'To be confirmed') tbcFields.push('Benefits');
    if ((p['Cost'] || '') === 'To be confirmed') tbcFields.push('Cost');
    return tbcFields.length === 0 && (p['What Is It?'] || '').length >= 100;
  });
  for (const p of readyToApprove) {
    console.log(`  #${p.id} "${p.title.slice(0, 65)}" — cat: ${p.category || 'none'}`);
  }
  console.log(`\n  → ${readyToApprove.length} opps ready to approve.\n`);

  // ── 5. Full summary ──
  console.log('═'.repeat(70));
  console.log('📋 SUMMARY');
  console.log('═'.repeat(70));
  console.log(`  Total in DB:                 ${allOpps.length}`);
  console.log(`  Approved:                    ${approved.length}`);
  console.log(`  Pending:                     ${pending.length}`);
  console.log(`  Pending → dup of approved:   ${dupsOfApproved.length} (DELETE these)`);
  console.log(`  Pending → dup of pending:    ${pendingDups.length} (MERGE/DELETE lower-id dups)`);
  console.log(`  Unique pending → need enrich:${needsEnrichCount}`);
  console.log(`  Unique pending → ready:      ${readyToApprove.length}`);
  console.log('═'.repeat(70));

  // Output IDs for batch operations
  if (dupsOfApproved.length > 0) {
    console.log(`\n🗑️  DELETE duplicate-of-approved IDs: [${dupsOfApproved.map(d => d.pendingId).join(', ')}]`);
  }
  if (pendingDups.length > 0) {
    console.log(`🗑️  DELETE pending-dup IDs (keep lower): [${pendingDups.map(d => d.id2).join(', ')}]`);
  }
  if (readyToApprove.length > 0) {
    console.log(`✅ APPROVE IDs: [${readyToApprove.map(r => r.id).join(', ')}]`);
  }
  if (enrichable.length > 0) {
    const withUrl = enrichable.filter(e => e.hasUrl);
    console.log(`🔧 ENRICH IDs (have URL): [${withUrl.map(e => e.id).join(', ')}]`);
    const noUrl = enrichable.filter(e => !e.hasUrl);
    if (noUrl.length > 0) {
      console.log(`⚠️  ENRICH IDs (NO URL — manual): [${noUrl.map(e => e.id).join(', ')}]`);
    }
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
