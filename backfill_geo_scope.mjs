/**
 * Backfill geo_scope and country_id on opportunities and news.
 *
 * Classification rules:
 *   - If title/description mentions a specific African country → country_specific + country_id
 *   - If it's clearly pan-African (AU, African Union, "across Africa", etc.) → pan_african
 *   - If it's an international org open to Africans → international
 *   - Default for ambiguous → pan_african (since FRA is Africa-focused)
 *
 * Usage:
 *   node backfill_geo_scope.mjs --dry-run   # preview classifications
 *   node backfill_geo_scope.mjs             # execute updates
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
const DRY_RUN = process.argv.includes('--dry-run');

async function supabaseUpdate(table, id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Update ${table}#${id} failed: ${res.status} ${await res.text()}`);
}

// ── Country keyword patterns ─────────────────────────────────────────────────

const COUNTRY_PATTERNS = [
  { id: null, iso: 'NG', name: 'Nigeria',      keywords: ['nigeria', 'nigerian', 'nollywood', 'lagos', 'abuja', 'nfvcb'] },
  { id: null, iso: 'ZA', name: 'South Africa',  keywords: ['south africa', 'south african', 'nfvf', 'cape town', 'johannesburg', 'durban', 'sa film'] },
  { id: null, iso: 'KE', name: 'Kenya',         keywords: ['kenya', 'kenyan', 'nairobi', 'kalasha', 'kfrb'] },
  { id: null, iso: 'GH', name: 'Ghana',         keywords: ['ghana', 'ghanaian', 'ghallywood', 'accra'] },
  { id: null, iso: 'EG', name: 'Egypt',         keywords: ['egypt', 'egyptian', 'cairo', 'el gouna'] },
  { id: null, iso: 'MA', name: 'Morocco',       keywords: ['morocco', 'moroccan', 'marrakech', 'casablanca', 'ccm'] },
  { id: null, iso: 'TZ', name: 'Tanzania',      keywords: ['tanzania', 'tanzanian', 'dar es salaam', 'zanzibar'] },
  { id: null, iso: 'ET', name: 'Ethiopia',      keywords: ['ethiopia', 'ethiopian', 'addis ababa'] },
  // Non-DB countries (no country_id, but still country_specific)
  { id: null, iso: 'SN', name: 'Senegal',       keywords: ['senegal', 'senegalese', 'dakar'] },
  { id: null, iso: 'TN', name: 'Tunisia',       keywords: ['tunisia', 'tunisian', 'carthage', 'jcc'] },
  { id: null, iso: 'CM', name: 'Cameroon',      keywords: ['cameroon', 'cameroonian', 'yaoundé', 'douala'] },
  { id: null, iso: 'RW', name: 'Rwanda',        keywords: ['rwanda', 'rwandan', 'kigali'] },
  { id: null, iso: 'UG', name: 'Uganda',        keywords: ['uganda', 'ugandan', 'kampala'] },
  { id: null, iso: 'BF', name: 'Burkina Faso',  keywords: ['burkina faso', 'burkinabè', 'ouagadougou', 'fespaco'] },
  { id: null, iso: 'DZ', name: 'Algeria',       keywords: ['algeria', 'algerian', 'algiers'] },
  { id: null, iso: 'ZW', name: 'Zimbabwe',      keywords: ['zimbabwe', 'zimbabwean', 'harare'] },
  { id: null, iso: 'MZ', name: 'Mozambique',    keywords: ['mozambique', 'mozambican', 'maputo'] },
  { id: null, iso: 'AO', name: 'Angola',        keywords: ['angola', 'angolan', 'luanda'] },
  { id: null, iso: 'CI', name: "Côte d'Ivoire", keywords: ['ivory coast', "côte d'ivoire", 'ivorian', 'abidjan'] },
];

const INTERNATIONAL_PATTERNS = [
  'berlinale', 'berlin', 'world cinema fund',
  'hubert bals', 'iffr', 'rotterdam',
  'sundance', 'tribeca', 'toronto', 'tiff',
  'cannes', 'venice', 'locarno', 'san sebastián',
  'bfi', 'british film', 'film independent',
  'idfa', 'hot docs', 'sheffield',
  'global', 'worldwide', 'international fund',
  'european', 'europe', 'eu fund',
  'asia tv forum', 'asian',
  'us-based', 'american',
  'filmmaker without borders',
  'amplifier fellowship',
  'doha film institute', 'dfi grants',
  'torinofilmlab', 'torino film lab',
  'cph:forum', 'cph:dox',
  'gotham week', 'gotham',
  'goethe-institut', 'goethe institut',
  'alter-ciné', 'alter cine',
  'red sea', 'harvard', 'elevenlab',
  'runway ai', 'runway hundred',
  'ai film awards', 'metamorph',
  'ai for good', 'aiffi',
  'aaron awards',
  'billion followers summit',
  'chroma awards',
  'acp-eu', 'itv',
  'seriencamp',
];

const PAN_AFRICAN_PATTERNS = [
  'african', 'africa', 'pan-african', 'pan african',
  'continent', 'across africa', 'au-eu', 'african union',
  'afrique', 'francophone africa',
  'sub-saharan', 'saharan',
  'east africa', 'west africa', 'north africa', 'southern africa', 'central africa',
  'docubox', 'maisha', 'realness',
  'open cities',
  'african women', 'african youth',
];

function classify(title, description, eligibility, applyUrl) {
  const text = `${title} ${description} ${eligibility} ${applyUrl}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // 1. Check for international org patterns FIRST (high confidence)
  //    These orgs mention African countries in descriptions but are international.
  for (const pattern of INTERNATIONAL_PATTERNS) {
    if (text.includes(pattern)) {
      return { geo_scope: 'international', country: null };
    }
  }

  // 2. Check for specific country mentions
  const countryMatches = [];
  for (const country of COUNTRY_PATTERNS) {
    for (const kw of country.keywords) {
      if (text.includes(kw)) {
        countryMatches.push(country);
        break;
      }
    }
  }

  // If exactly one country matched → country_specific
  if (countryMatches.length === 1) {
    return { geo_scope: 'country_specific', country: countryMatches[0] };
  }

  // If 2 countries and one is clearly in the title → country_specific
  if (countryMatches.length === 2) {
    for (const cm of countryMatches) {
      if (cm.keywords.some(kw => titleLower.includes(kw))) {
        return { geo_scope: 'country_specific', country: cm };
      }
    }
  }

  // If multiple countries → probably pan_african (regional)
  if (countryMatches.length > 1) {
    return { geo_scope: 'pan_african', country: null };
  }

  // 3. Check for pan-African patterns
  for (const pattern of PAN_AFRICAN_PATTERNS) {
    if (text.includes(pattern)) {
      return { geo_scope: 'pan_african', country: null };
    }
  }

  // 4. Default to pan_african (FRA is Africa-focused)
  return { geo_scope: 'pan_african', country: null };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌍 FRA Geo-Scope Backfill${DRY_RUN ? ' (DRY RUN)' : ''}\n`);
  console.log('─'.repeat(60));

  // Load countries from DB to get UUIDs
  const countriesRes = await fetch(`${supabaseUrl}/rest/v1/countries?select=id,name,iso_code&order=name.asc`, { headers });
  const dbCountries = await countriesRes.json();
  const isoToId = {};
  dbCountries.forEach(c => { isoToId[c.iso_code] = c.id; });
  console.log(`   ${dbCountries.length} countries in DB: ${dbCountries.map(c => c.iso_code).join(', ')}\n`);

  // Populate COUNTRY_PATTERNS with actual DB IDs
  for (const cp of COUNTRY_PATTERNS) {
    cp.id = isoToId[cp.iso] || null;
  }

  // ── Phase A: Opportunities ──────────────────────────────────────────────

  console.log('📋 PHASE A: Opportunities\n');

  const oppRes = await fetch(
    `${supabaseUrl}/rest/v1/opportunities?status=eq.approved&select=id,title,"What Is It?","Apply:","Who Can Apply / Eligibility"&order=id.asc&limit=500`,
    { headers }
  );
  const opps = await oppRes.json();

  const oppStats = { country_specific: 0, pan_african: 0, international: 0, total: 0 };

  for (const opp of opps) {
    const result = classify(
      opp.title,
      opp['What Is It?'] || '',
      opp['Who Can Apply / Eligibility'] || '',
      opp['Apply:'] || ''
    );

    const updates = { geo_scope: result.geo_scope };
    if (result.country && result.country.id) {
      updates.country_id = result.country.id;
    }

    const label = result.country ? `${result.geo_scope} → ${result.country.iso} ${result.country.name}` : result.geo_scope;
    const flag = result.country ? isoToFlag(result.country.iso) : (result.geo_scope === 'international' ? '🌐' : '🌍');

    oppStats[result.geo_scope]++;
    oppStats.total++;

    if (DRY_RUN) {
      console.log(`   ${flag} #${opp.id} [${label}] ${opp.title.slice(0, 55)}`);
    } else {
      await supabaseUpdate('opportunities', opp.id, updates);
      console.log(`   ${flag} #${opp.id} [${label}] ✅`);
    }
  }

  console.log(`\n   Summary: ${oppStats.country_specific} country-specific, ${oppStats.pan_african} pan-african, ${oppStats.international} international (${oppStats.total} total)\n`);

  // ── Phase B: News ───────────────────────────────────────────────────────

  console.log('📰 PHASE B: News\n');

  const newsRes = await fetch(
    `${supabaseUrl}/rest/v1/news?status=eq.published&select=id,title,summary,url&order=id.asc&limit=500`,
    { headers }
  );
  const newsItems = await newsRes.json();

  const newsStats = { country_specific: 0, pan_african: 0, international: 0, total: 0 };

  for (const item of newsItems) {
    const result = classify(item.title, item.summary || '', '', item.url || '');

    const updates = { geo_scope: result.geo_scope };
    if (result.country && result.country.id) {
      updates.country_id = result.country.id;
    }

    const label = result.country ? `${result.geo_scope} → ${result.country.iso} ${result.country.name}` : result.geo_scope;
    const flag = result.country ? isoToFlag(result.country.iso) : (result.geo_scope === 'international' ? '🌐' : '🌍');

    newsStats[result.geo_scope]++;
    newsStats.total++;

    if (DRY_RUN) {
      console.log(`   ${flag} #${item.id} [${label}] ${item.title.slice(0, 55)}`);
    } else {
      await supabaseUpdate('news', item.id, updates);
      console.log(`   ${flag} #${item.id} [${label}] ✅`);
    }
  }

  console.log(`\n   Summary: ${newsStats.country_specific} country-specific, ${newsStats.pan_african} pan-african, ${newsStats.international} international (${newsStats.total} total)\n`);
  console.log('─'.repeat(60));
  console.log('✅ Backfill complete.\n');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isoToFlag(iso) {
  return String.fromCodePoint(...[...iso.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
