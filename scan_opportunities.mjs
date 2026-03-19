/**
 * FRA Daily Opportunity Scanner
 *
 * Scans multiple sources for new film opportunities relevant to African filmmakers:
 *   1. RSS feeds (African Film Press, Cineuropa, Screen Daily, etc.)
 *   2. Gmail newsletters (LinkedIn, Slated, festival alerts)
 *   3. Web search for new grants/funds/labs/festivals
 *
 * Deduplicates against existing opportunities in Supabase.
 * Inserts new finds as `pending` for admin review.
 * Sends a summary email to admin when new opportunities are found.
 *
 * Usage:
 *   node scan_opportunities.mjs              # full scan + insert
 *   node scan_opportunities.mjs --dry-run    # scan only, no inserts
 *   node scan_opportunities.mjs --news-only  # only scan for news, skip opportunities
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

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
const resendApiKey = env.RESEND_API_KEY;
const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://film-resource-africa.com';

if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env vars'); process.exit(1); }

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NEWS_ONLY = args.includes('--news-only');

// ─── Supabase REST helpers ───────────────────────────────────────────────────

const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function supabaseGet(table, query) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`Supabase GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseInsert(table, item) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase INSERT ${table} failed: ${res.status} ${err}`);
  }
  return res.json();
}

// ─── Deduplication ───────────────────────────────────────────────────────────

async function getExistingTitles() {
  const opps = await supabaseGet('opportunities', 'select=title');
  const news = await supabaseGet('news', 'select=title,slug');
  return {
    oppTitles: new Set(opps.map(o => o.title.toLowerCase().trim())),
    newsTitles: new Set(news.map(n => n.title.toLowerCase().trim())),
    newsSlugs: new Set(news.filter(n => n.slug).map(n => n.slug)),
  };
}

// Extract significant keywords (3+ chars, no stopwords)
const STOPWORDS = new Set(['the','and','for','from','with','this','that','are','was','were','been','have','has',
  'its','not','but','what','all','can','had','her','one','our','out','you','his','how','into','who',
  'will','each','make','like','long','look','many','some','them','than','then','these','would',
  'about','could','other','after','more','also','back','been','being','both','came','come','does',
  'done','down','even','find','give','going','good','here','just','know','most','much','must','need',
  'only','over','said','should','show','side','such','take','tell','very','want','well','went',
  'when','where','which','while','your','open','new','now','film','films','2026','2025','call',
  'award','awards','edition','announces','announced','applications']);

function extractKeywords(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

function keywordOverlap(titleA, titleB) {
  const kwA = new Set(extractKeywords(titleA));
  const kwB = new Set(extractKeywords(titleB));
  if (kwA.size === 0 || kwB.size === 0) return 0;
  let overlap = 0;
  for (const w of kwA) { if (kwB.has(w)) overlap++; }
  const minSize = Math.min(kwA.size, kwB.size);
  return overlap / minSize;
}

function isDuplicate(title, existingSet) {
  const normalized = title.toLowerCase().trim();
  for (const existing of existingSet) {
    // Exact match
    if (normalized === existing) return true;
    // Substring containment
    if (normalized.length > 20 && existing.length > 20) {
      if (normalized.includes(existing) || existing.includes(normalized)) return true;
    }
    // Keyword overlap: >40% of the shorter title's keywords match
    if (keywordOverlap(normalized, existing) >= 0.4) return true;
  }
  return false;
}

// Filter out directory/aggregation pages that aren't actual opportunities
const JUNK_TITLE_PATTERNS = [
  /\bdirectory\b/i, /\bgrants? list\b/i, /^home\s*[-–—]?/i, /\bfunding opportunities\b.*closing/i,
  /\btop \d+ (?:grants?|funds?)\b/i, /\bavailable right now\b/i,
  /\bclosing in (?:january|february|march|april|may|june|july|august|september|october|november|december)/i,
  /\bbest film grants\b/i, /\bgrants? (?:&|and) funding opportunities\b/i,
  /\bcurrently open to\b/i, /\b(?:grants?|funds?) for african filmmakers\s*[-–—]?\s*film/i,
  /^home\b/i,
];

function isJunkTitle(title) {
  return JUNK_TITLE_PATTERNS.some(p => p.test(title));
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-$/, '');
}

// ─── Source 1: RSS Feeds ─────────────────────────────────────────────────────

const RSS_FEEDS = [
  // ── Tier 1: Africa-focused film press ──
  {
    name: 'African Film Press',
    url: 'https://africanfilmpress.com/articles/feed.xml',
    type: 'news',
  },
  {
    name: 'Sinema Focus',
    url: 'https://www.sinemafocus.com/feed/',
    type: 'news',
  },
  {
    name: 'Africa is a Country',
    url: 'https://africasacountry.com/feed',
    type: 'news',
    filterRelevant: true,
  },
  {
    name: 'Modern Ghana Entertainment',
    url: 'https://www.modernghana.com/entertainment/rss.xml',
    type: 'news',
    filterRelevant: true,
  },
  {
    name: 'Premium Times Arts',
    url: 'https://www.premiumtimesng.com/arts-entertainment/feed',
    type: 'news',
    filterRelevant: true,
  },
  // ── Tier 2: International trade press (filter for Africa/relevance) ──
  {
    name: 'Cineuropa',
    url: 'https://cineuropa.org/en/rss.aspx?t=news',
    type: 'news',
  },
  {
    name: 'Screen Daily',
    url: 'https://www.screendaily.com/feeds/rss',
    type: 'news',
  },
  {
    name: 'Variety',
    url: 'https://variety.com/feed/',
    type: 'news',
    filterRelevant: true,
  },
  {
    name: 'Deadline',
    url: 'https://deadline.com/feed/',
    type: 'news',
    filterRelevant: true,
  },
  {
    name: 'IndieWire',
    url: 'https://www.indiewire.com/feed/',
    type: 'news',
    filterRelevant: true,
  },
  {
    name: 'The Guardian Film',
    url: 'https://www.theguardian.com/film/rss',
    type: 'news',
    filterRelevant: true,
  },
  {
    name: 'Filmmaker Magazine',
    url: 'https://filmmakermagazine.com/feed/',
    type: 'news',
    filterRelevant: true,
  },
];

async function fetchRSS(feed) {
  const items = [];
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-Scanner/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.log(`  ⚠ ${feed.name}: HTTP ${res.status}`);
      return items;
    }
    const xml = await res.text();

    // Simple XML parsing for RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const get = (tag) => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'));
        return m ? m[1].trim() : null;
      };
      const getAttr = (tag, attr) => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 's'));
        return m ? m[1] : null;
      };

      const title = get('title');
      const link = get('link');
      const description = get('description');
      const pubDate = get('pubDate');
      const imageUrl = getAttr('enclosure', 'url') || getAttr('media:content', 'url') || null;

      if (title) {
        items.push({ title, link, description, pubDate, imageUrl, source: feed.name, type: feed.type });
      }
    }
    console.log(`  ✓ ${feed.name}: ${items.length} items`);
  } catch (err) {
    console.log(`  ✗ ${feed.name}: ${err.message}`);
  }
  return items;
}

// ─── Source 2: Gmail newsletters ─────────────────────────────────────────────

const GMAIL_SENDERS = [
  // Industry trade press
  { query: 'from:cineuropa.org', name: 'Cineuropa' },
  { query: 'from:screendaily.com', name: 'Screen Daily' },
  { query: 'from:slated.com', name: 'Slated' },
  { query: 'from:variety.com', name: 'Variety' },
  { query: 'from:indiewire.com', name: 'IndieWire' },
  // Platforms & festivals
  { query: 'from:noreply@filmfreeway.com', name: 'FilmFreeway' },
  { query: 'from:submittable.com', name: 'Submittable' },
  { query: 'from:newsletters-noreply@linkedin.com subject:film OR subject:cinema OR subject:Africa', name: 'LinkedIn Film' },
  // Funders & institutions
  { query: 'from:bfi.org.uk', name: 'BFI' },
  { query: 'from:europa-cinemas.org', name: 'Europa Cinemas' },
  { query: 'from:realness.institute', name: 'Realness Institute' },
  { query: 'from:berlinale.de OR from:talentpress.org', name: 'Berlinale / Talents' },
  { query: 'from:iffr.com OR from:filmfestivalrotterdam.com', name: 'IFFR / Hubert Bals' },
  { query: 'from:sundance.org OR from:sundanceinstitute.org', name: 'Sundance' },
  { query: 'from:idfa.nl', name: 'IDFA' },
  // Broad catch-all alerts
  { query: 'subject:"call for" OR subject:"submission" OR subject:"deadline" from:(-game.co.za -gopro -parkrun -strava)', name: 'Festival Alerts' },
  { query: 'subject:"open call" OR subject:"grant" (filmmaker OR cinema OR film) from:(-game.co.za -gopro -parkrun -strava)', name: 'Grant Alerts' },
];

function gws(cmd) {
  try {
    return execSync(`gws ${cmd}`, { encoding: 'utf-8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return null;
  }
}

function parseGwsJson(output) {
  if (!output) return null;
  // Strip non-JSON prefix (e.g. "Using keyring backend: keyring")
  const jsonStart = output.indexOf('{');
  if (jsonStart === -1) {
    const arrStart = output.indexOf('[');
    if (arrStart === -1) return null;
    try { return JSON.parse(output.slice(arrStart)); } catch { return null; }
  }
  try { return JSON.parse(output.slice(jsonStart)); } catch { return null; }
}

async function scanGmail() {
  const items = [];
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  for (const sender of GMAIL_SENDERS) {
    const q = `${sender.query} is:unread newer_than:2d`;
    const raw = gws(`gmail users messages list --params '{"userId":"me","q":"${q}","maxResults":5}'`);
    const result = parseGwsJson(raw);

    if (!result || !result.messages) {
      console.log(`  · ${sender.name}: no new messages`);
      continue;
    }

    console.log(`  ✓ ${sender.name}: ${result.messages.length} unread`);

    for (const msg of result.messages.slice(0, 3)) {
      const metaRaw = gws(`gmail users messages get --params '{"userId":"me","id":"${msg.id}","format":"metadata"}'`);
      const meta = parseGwsJson(metaRaw);
      if (!meta || !meta.payload) continue;

      const hdrs = {};
      for (const h of meta.payload.headers || []) {
        hdrs[h.name] = h.value;
      }

      items.push({
        title: hdrs['Subject'] || 'Untitled',
        source: sender.name,
        from: hdrs['From'] || '',
        date: hdrs['Date'] || '',
        messageId: msg.id,
        type: 'email',
      });
    }
  }
  return items;
}

// ─── Source 3: Web search for opportunities ──────────────────────────────────

const SEARCH_QUERIES = [
  // General African film opportunities
  'African film grants 2026 deadline',
  'film fund Africa submission 2026',
  'African filmmaker fellowship 2026',
  'African cinema festival call for entries 2026',
  'co-production fund Africa 2026',
  'film lab emerging filmmaker Africa',
  'African documentary fund open call',
  'site:open-cities.com submissions accelerator',
  'Open Cities accelerator filmmaker submissions 2026',
  // Regional specificity
  'South African film fund NFVF open call 2026',
  'Nigerian film grant Nollywood submission 2026',
  'East African film lab Kenya Uganda Tanzania 2026',
  'North African cinema fund Morocco Tunisia Egypt 2026',
  'Francophone African film fund appel candidatures 2026',
  'West African film fund Ghana Senegal 2026',
  // Type-specific
  'African animation fund submission 2026',
  'African women filmmaker grant 2026',
  'African short film fund open call 2026',
  'African post-production fund finishing 2026',
  'African screenwriting residency lab 2026',
  'African VR XR immersive storytelling fund',
  'African film distribution fund cinema release',
  // Major funders tracking
  'site:realness.institute open call 2026',
  'site:docubox.org open call filmmakers',
  'site:idfa.nl bertha fund Africa',
  'site:sundance.org collab Africa lab',
  'site:iffr.com hubert bals fund open',
  'site:berlinale.de world cinema fund application',
  'site:bfi.org.uk international fund Africa',
  'site:hot-docs.ca crosscurrents fund',
  'site:tribecafilminstitute.org grant Africa',
  'site:durbanfilmmart.com call submissions',
  'site:ffrr.info fund Africa',
];

async function webSearch(query) {
  // Use a simple web search approach via fetch
  const items = [];
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-Scanner/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return items;
    const html = await res.text();

    // Extract results
    const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = resultRegex.exec(html)) !== null) {
      const url = decodeURIComponent(match[1].replace(/.*uddg=/, '').replace(/&.*/, ''));
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      if (title && url) {
        items.push({ title, url, snippet, source: 'Web Search', type: 'opportunity' });
      }
    }
    console.log(`  ✓ "${query.slice(0, 40)}...": ${items.length} results`);
  } catch (err) {
    console.log(`  ✗ "${query.slice(0, 40)}...": ${err.message}`);
  }
  return items;
}

// ─── Relevance filter ────────────────────────────────────────────────────────

const RELEVANCE_KEYWORDS = [
  // Countries & regions
  'african', 'africa', 'south africa', 'nigeria', 'kenya', 'ghana', 'egypt',
  'morocco', 'tunisia', 'senegal', 'ethiopia', 'tanzania', 'uganda', 'cameroon',
  'zimbabwe', 'mozambique', 'rwanda', 'congo', 'ivory coast', 'mali', 'burkina',
  'angola', 'botswana', 'namibia', 'zambia', 'malawi', 'madagascar', 'mauritius',
  'algeria', 'libya', 'sudan', 'somalia', 'benin', 'togo', 'gabon', 'chad',
  'nollywood', 'east africa', 'west africa', 'north africa', 'southern africa',
  'francophone', 'lusophone', 'anglophone',
  // Industry terms
  'filmmaker', 'film fund', 'film grant', 'filmmaking', 'cinema', 'documentary',
  'festival', 'call for entries', 'submission', 'deadline', 'screenplay',
  'co-production', 'production fund', 'development fund', 'emerging talent',
  'short film', 'feature film', 'animation', 'post-production',
  'distribution', 'exhibition', 'screening', 'premiere',
  'film policy', 'film commission', 'film incentive', 'film tax',
  'streaming', 'content creator', 'showrunner',
  // Major festivals
  'sundance', 'berlinale', 'cannes', 'toronto', 'venice', 'locarno',
  'durban', 'fespaco', 'zanzibar', 'marrakech', 'carthage', 'luxor',
  'lagos film', 'joburg film', 'cape town film', 'nairobi film',
  'afrikamera', 'afriff', 'amaa', 'africlap',
  // Major funders & labs
  'hubert bals', 'world cinema fund', 'bertha fund',
  'realness', 'maisha', 'docubox', 'film lab',
  'hot docs', 'idfa', 'sheffield', 'cph:dox',
  // Platforms
  'netflix', 'showmax', 'multichoice', 'dstv', 'canal+', 'amazon',
  'open cities', 'accelerator', 'emerging technologies',
  'ai filmmaking', 'virtual production',
];

function isRelevant(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of RELEVANCE_KEYWORDS) {
    if (lower.includes(kw)) score++;
  }
  return score >= 2;
}

// ─── Source 4: Key organisation pages ────────────────────────────────────────

const KEY_ORG_PAGES = [
  { name: 'Realness Institute', url: 'https://realness.institute', selector: 'open call|applications|submit|deadline' },
  { name: 'Docubox', url: 'https://docubox.org', selector: 'open call|applications|submit|deadline' },
  { name: 'Durban FilmMart', url: 'https://durbanfilmmart.com', selector: 'call for|submissions|apply|deadline' },
  { name: 'IDFA Bertha Fund', url: 'https://www.idfa.nl/en/info/idfa-bertha-fund', selector: 'apply|deadline|submit|open' },
  { name: 'Hubert Bals Fund', url: 'https://iffr.com/en/hubert-bals-fund', selector: 'apply|deadline|submit|open' },
  { name: 'World Cinema Fund', url: 'https://www.berlinale.de/en/world-cinema-fund/', selector: 'apply|deadline|submit|open' },
  { name: 'Hot Docs', url: 'https://www.hotdocs.ca/funds', selector: 'crosscurrents|apply|deadline|submit' },
  { name: 'Sundance Labs', url: 'https://www.sundance.org/programs', selector: 'apply|deadline|submit|lab' },
  { name: 'FESPACO', url: 'https://fespaco.bf', selector: 'appel|candidatures|submit|deadline' },
  { name: 'Maisha Film Lab', url: 'https://www.maishafilmlab.org', selector: 'apply|call|submit|deadline' },
  { name: 'Open Cities Lab', url: 'https://open-cities.com', selector: 'accelerator|submissions|apply|deadline' },
];

async function scanKeyPages(existingTitles) {
  const items = [];
  for (const page of KEY_ORG_PAGES) {
    try {
      const res = await fetch(page.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 FRA-Scanner/1.0' },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      if (!res.ok) {
        console.log(`  ⚠ ${page.name}: HTTP ${res.status}`);
        continue;
      }
      const html = await res.text();

      // Extract links with text matching the selector keywords
      const selectorPattern = new RegExp(page.selector, 'i');
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        const text = match[2].replace(/<[^>]+>/g, '').trim();
        if (!text || text.length < 10 || text.length > 200) continue;
        if (!selectorPattern.test(text)) continue;
        if (isJunkTitle(text)) continue;

        const fullUrl = href.startsWith('http') ? href : new URL(href, page.url).href;
        items.push({
          title: text,
          url: fullUrl,
          snippet: `Found on ${page.name} website`,
          source: page.name,
          type: 'opportunity',
        });
      }
      console.log(`  ✓ ${page.name}: scanned`);
    } catch (err) {
      console.log(`  ✗ ${page.name}: ${err.message}`);
    }
  }
  return items;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`\n🎬 FRA Daily Opportunity Scanner — ${today}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${NEWS_ONLY ? ' (news only)' : ''}`);

  // 1. Load existing data for deduplication
  console.log('\n📦 Loading existing data...');
  const { oppTitles, newsTitles, newsSlugs } = await getExistingTitles();
  console.log(`   ${oppTitles.size} opportunities, ${newsTitles.size} news articles in DB`);

  const results = { news: [], opportunities: [], emails: [] };

  // 2. Scan RSS feeds
  console.log('\n📡 Scanning RSS feeds...');
  for (const feed of RSS_FEEDS) {
    const items = await fetchRSS(feed);
    for (const item of items) {
      if (isDuplicate(item.title, newsTitles)) continue;
      // Tier 1 Africa-focused feeds: skip relevance filter (already on-topic)
      // Tier 2 international feeds: require relevance keywords
      if (feed.filterRelevant && !isRelevant(`${item.title} ${item.description || ''}`)) continue;
      results.news.push(item);
    }
  }

  // 3. Scan Gmail
  console.log('\n📧 Scanning Gmail...');
  try {
    const emailItems = await scanGmail();
    results.emails = emailItems;
  } catch (err) {
    console.log(`  ⚠ Gmail scan failed: ${err.message}`);
  }

  // 4. Web search for opportunities
  if (!NEWS_ONLY) {
    console.log('\n🔍 Searching web for opportunities...');
    for (const query of SEARCH_QUERIES) {
      const items = await webSearch(query);
      for (const item of items) {
        if (isJunkTitle(item.title)) continue;
        if (isDuplicate(item.title, oppTitles)) continue;
        if (isDuplicate(item.title, newsTitles)) continue;
        if (!isRelevant(`${item.title} ${item.snippet || ''}`)) continue;
        results.opportunities.push(item);
      }
      // Rate limit between searches
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // 5. Scan key org pages for opportunity changes
  if (!NEWS_ONLY) {
    console.log('\n🌐 Checking key organisation pages...');
    const keyPages = await scanKeyPages(oppTitles);
    for (const item of keyPages) {
      if (!isDuplicate(item.title, oppTitles)) {
        results.opportunities.push(item);
      }
    }
  }

  // 6. Deduplicate within results
  const seenTitles = new Set();
  results.news = results.news.filter(item => {
    const key = item.title.toLowerCase().trim();
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });
  results.opportunities = results.opportunities.filter(item => {
    const key = item.title.toLowerCase().trim();
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });

  // 7. Insert news items
  let newsInserted = 0;
  if (results.news.length > 0) {
    console.log(`\n📰 Found ${results.news.length} new news items`);
    for (const item of results.news.slice(0, 10)) {
      const slug = slugify(item.title);
      if (newsSlugs.has(slug)) {
        console.log(`  SKIP (slug exists): ${item.title.slice(0, 60)}`);
        continue;
      }
      const newsItem = {
        title: item.title,
        summary: (item.description || '').replace(/<[^>]+>/g, '').slice(0, 300),
        content: (item.description || '').replace(/<[^>]+>/g, ''),
        category: 'industry_news',
        url: item.link || null,
        slug,
        image_url: item.imageUrl || null,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      };
      if (DRY_RUN) {
        console.log(`  [DRY] Would insert news: ${item.title.slice(0, 60)}`);
      } else {
        try {
          await supabaseInsert('news', newsItem);
          console.log(`  ✓ Inserted news: ${item.title.slice(0, 60)}`);
          newsInserted++;
        } catch (err) {
          console.log(`  ✗ Failed: ${item.title.slice(0, 60)} — ${err.message}`);
        }
      }
    }
  }

  // 8. Log opportunity leads (insert as pending for manual review)
  let oppsInserted = 0;
  if (results.opportunities.length > 0 && !NEWS_ONLY) {
    console.log(`\n🎯 Found ${results.opportunities.length} potential opportunity leads`);
    for (const item of results.opportunities.slice(0, 15)) {
      const oppItem = {
        title: item.title,
        'What Is It?': item.snippet || 'Discovered via automated scan — needs review.',
        'For Films or Series?': 'To be confirmed',
        'What Do You Get If Selected?': 'To be confirmed',
        'Cost': 'To be confirmed',
        'Next Deadline': 'To be confirmed',
        'Apply:': item.url || '',
        'Who Can Apply / Eligibility': 'To be confirmed',
        'What to Submit': 'To be confirmed',
        'Strongest Submission Tips': '',
        'CALENDAR REMINDER:': '',
        status: 'pending',
        votes: 0,
        application_status: 'open',
      };
      if (DRY_RUN) {
        console.log(`  [DRY] Would insert opp: ${item.title.slice(0, 60)}`);
        console.log(`         URL: ${item.url || 'N/A'}`);
      } else {
        try {
          await supabaseInsert('opportunities', oppItem);
          console.log(`  ✓ Inserted (pending): ${item.title.slice(0, 60)}`);
          oppsInserted++;
        } catch (err) {
          console.log(`  ✗ Failed: ${item.title.slice(0, 60)} — ${err.message}`);
        }
      }
    }
  }

  // 9. Summary
  console.log('\n' + '─'.repeat(60));
  console.log(`📊 SCAN SUMMARY — ${today}`);
  console.log(`   RSS news found:      ${results.news.length}`);
  console.log(`   Email leads:         ${results.emails.length}`);
  console.log(`   Web opp leads:       ${results.opportunities.length}`);
  console.log(`   News inserted:       ${newsInserted}`);
  console.log(`   Opps inserted:       ${oppsInserted}`);
  console.log('─'.repeat(60));

  // 10. Send admin summary email
  const totalNew = newsInserted + oppsInserted;
  if (totalNew > 0 && !DRY_RUN && resendApiKey) {
    console.log('\n📧 Sending admin summary...');
    const emailLines = [];
    if (newsInserted > 0) emailLines.push(`<p><strong>${newsInserted} new news article${newsInserted > 1 ? 's' : ''}</strong> added to the site.</p>`);
    if (oppsInserted > 0) emailLines.push(`<p><strong>${oppsInserted} new opportunity lead${oppsInserted > 1 ? 's' : ''}</strong> added as PENDING — <a href="${siteUrl}/admin">review in admin</a>.</p>`);

    if (results.emails.length > 0) {
      emailLines.push('<p><strong>Unread industry emails:</strong></p><ul>');
      for (const e of results.emails.slice(0, 10)) {
        emailLines.push(`<li>${e.source}: ${e.title}</li>`);
      }
      emailLines.push('</ul>');
    }

    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Film Resource Africa <hello@film-resource-africa.com>',
          to: ['hello@film-resource-africa.com'],
          subject: `FRA Scanner: ${totalNew} new item${totalNew > 1 ? 's' : ''} found — ${today}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;">
              <h2 style="color:#0d9488;">🎬 Daily Opportunity Scan — ${today}</h2>
              ${emailLines.join('\n')}
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
              <p style="font-size:13px;color:#888;">
                <a href="${siteUrl}/admin" style="color:#0d9488;font-weight:bold;">Open Admin Dashboard</a>
              </p>
            </div>
          `,
        }),
      });
      if (emailRes.ok) console.log('  ✓ Admin summary sent');
      else console.log(`  ✗ Email failed: ${emailRes.status}`);
    } catch (err) {
      console.log(`  ✗ Email error: ${err.message}`);
    }
  } else if (totalNew === 0) {
    console.log('\n   No new items to report. All quiet on the African front. 🌍');
  }

  console.log('\n✅ Scan complete.\n');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
