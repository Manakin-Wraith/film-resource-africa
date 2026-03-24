/**
 * List all pending opportunities with full detail for triage.
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
  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?status=eq.pending&select=id,title,"What Is It?","Apply:"&order=id.asc&limit=500`, { headers });
  const pending = await res.json();

  // Also fetch approved titles for cross-reference
  const res2 = await fetch(`${supabaseUrl}/rest/v1/opportunities?status=eq.approved&select=id,title&order=id.asc&limit=500`, { headers });
  const approved = await res2.json();
  const approvedTitles = approved.map(a => a.title.toLowerCase().trim());

  console.log(`\n=== ALL ${pending.length} PENDING OPPORTUNITIES ===\n`);

  for (const p of pending) {
    const url = p['Apply:'] || '';
    const desc = (p['What Is It?'] || '').slice(0, 120);
    
    // Auto-classify
    let tag = '❓';
    const titleLower = p.title.toLowerCase();
    const urlLower = url.toLowerCase();
    
    // Junk detection
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) tag = '🗑️ YOUTUBE';
    else if (urlLower.includes('linkedin.com/pulse') || urlLower.includes('linkedin.com/posts')) tag = '🗑️ LINKEDIN-ARTICLE';
    else if (/research guide|library|dartmouth|university.*guide/i.test(p.title)) tag = '🗑️ RESEARCH-GUIDE';
    else if (/top \d+|best.*grants|minority grants|list of/i.test(titleLower)) tag = '🗑️ AGGREGATOR';
    else if (/other funding|resources$/i.test(titleLower)) tag = '🗑️ AGGREGATOR';
    else if (urlLower.includes('filmdaily.tv/grants') || urlLower === 'https://filmfreeway.com/') tag = '🗑️ AGGREGATOR';
    else if (/government.*allocat|government.*announc|sets up.*fund|launches.*fund|gets a boost|investment in/i.test(titleLower) && !/apply|submit|call|deadline/i.test(titleLower)) tag = '📰 NEWS-NOT-OPP';
    else if (/rise of|challenges|what.*happening|catalysing|practical info/i.test(titleLower)) tag = '📰 NEWS-NOT-OPP';
    else if (/appel|call|submit|fund|grant|lab|fellowship|deadline|apply/i.test(titleLower)) tag = '✅ LIKELY-OPP';
    else if (/fund|grant|program|accelerator/i.test(titleLower)) tag = '✅ LIKELY-OPP';
    else tag = '🔍 REVIEW';

    console.log(`#${p.id} [${tag}] ${p.title}`);
    console.log(`   URL: ${url.slice(0, 80)}`);
    console.log(`   Desc: ${desc}`);
    console.log('');
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
