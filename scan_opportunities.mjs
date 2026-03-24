/**
 * FRA Daily Opportunity Scanner
 *
 * Scans multiple sources for new film opportunities relevant to African filmmakers:
 *   1. RSS feeds (African Film Press, Cineuropa, Screen Daily, etc.)
 *   2. Gmail newsletters (LinkedIn, Slated, festival alerts)
 *   3. Web search for new grants/funds/labs/festivals
 *   4. Key organisation pages (Realness, Docubox, IDFA, Hubert Bals, etc.)
 *
 * After scanning and inserting, the --enrich flag runs a post-insert
 * enrichment pass using Playwright (headless Chromium) to:
 *   - Scrape full article content from JS-rendered sites (e.g. African Film Press)
 *   - Fill in thin news summaries with multi-paragraph body text
 *   - Populate opportunity fields (deadline, eligibility, format, cost) from source pages
 *
 * Deduplicates against existing opportunities in Supabase.
 * Inserts new finds as `pending` for admin review.
 * Sends a summary email to admin when new opportunities are found.
 *
 * Usage:
 *   node scan_opportunities.mjs              # full scan + insert
 *   node scan_opportunities.mjs --dry-run    # scan only, no inserts
 *   node scan_opportunities.mjs --news-only  # only scan for news, skip opportunities
 *   node scan_opportunities.mjs --enrich     # scan + insert + Playwright enrichment
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 *
 * For --enrich mode, also requires:
 *   npm install playwright (in project or /tmp)
 *   npx playwright install chromium
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
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
const resendApiKey = env.RESEND_API_KEY;
const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://film-resource-africa.com';

if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env vars'); process.exit(1); }

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NEWS_ONLY = args.includes('--news-only');
const ENRICH = args.includes('--enrich');

// ─── Logo fetcher ───────────────────────────────────────────────────────────

const LOGOS_DIR = join(process.cwd(), 'public', 'logos');
if (!existsSync(LOGOS_DIR)) mkdirSync(LOGOS_DIR, { recursive: true });

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

async function fetchLogoForUrl(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  if (PLATFORM_DOMAINS.has(domain) || PLATFORM_DOMAINS.has(domain.replace(/^[^.]+\./, ''))) return null;
  const localPath = `/logos/${domain}.png`;
  const localFile = join(LOGOS_DIR, `${domain}.png`);
  if (existsSync(localFile)) return localPath;
  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-Scanner/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return null;
    writeFileSync(localFile, buf);
    return localPath;
  } catch { return null; }
}

async function fetchOgImageForUrl(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  if (PLATFORM_DOMAINS.has(domain) || PLATFORM_DOMAINS.has(domain.replace(/^[^.]+\./, ''))) return null;
  try {
    let u = url.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    const res = await fetch(u, {
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-Scanner/1.0', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 15 && !match[1].includes('placeholder')) {
        const imgUrl = match[1].startsWith('http') ? match[1] : new URL(match[1], u).href;
        return imgUrl;
      }
    }
    return null;
  } catch { return null; }
}

// ─── HTML entity decoder ────────────────────────────────────────────────────

function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&nbsp;/g, ' ');
}

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

async function supabaseUpdate(table, id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Supabase UPDATE ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Deduplication ───────────────────────────────────────────────────────────

async function getExistingTitles() {
  const opps = await supabaseGet('opportunities', 'select=title');
  const news = await supabaseGet('news', 'select=title,slug,url');
  // Normalize URLs for comparison (strip trailing slash, query params, protocol)
  const normalizeUrl = (u) => u ? u.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/\?.*$/, '') : '';
  return {
    oppTitles: new Set(opps.map(o => o.title.toLowerCase().trim())),
    newsTitles: new Set(news.map(n => n.title.toLowerCase().trim())),
    newsSlugs: new Set(news.filter(n => n.slug).map(n => n.slug)),
    newsUrls: new Set(news.filter(n => n.url).map(n => normalizeUrl(n.url))),
    normalizeUrl,
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
  // ── Tier 3: Producer/lab programme feeds ──
  {
    name: 'Big World Cinema (Medium)',
    url: 'https://medium.com/feed/@bigworldcinema_30298',
    type: 'news',
  },
  {
    name: 'The British Blacklist',
    url: 'https://thebritishblacklist.co.uk/feed/',
    type: 'news',
    filterRelevant: true,
  },
  {
    name: 'Film Efiko',
    url: 'https://filmefiko.com/feed/',
    type: 'news',
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
  // Sales agents, distributors & broad film industry inbox
  { query: '(film OR cinema OR documentary OR festival OR screening OR distribution OR "sales agent") -from:notifications@ -from:noreply@ -from:no-reply@ -from:game.co.za -from:gopro -from:parkrun -from:strava -from:uber -from:takealot -category:promotions -category:social', name: 'Inbox Film Leads' },
  { query: 'subject:"market" OR subject:"sales" OR subject:"acquisition" OR subject:"slate" OR subject:"premiere" (film OR cinema) -from:notifications@ -from:noreply@', name: 'Sales & Market Leads' },
  { query: 'subject:"opportunity" OR subject:"fund" OR subject:"fellowship" OR subject:"residency" OR subject:"workshop" (Africa OR African OR filmmaker) -from:notifications@', name: 'Opportunity Inbox' },
];

// ─── Gmail REST API (replaces gws CLI) ──────────────────────────────────────

const gmailRefreshToken = env.GMAIL_REFRESH_TOKEN;
const gmailClientId = env.GMAIL_CLIENT_ID || '812435843656-v79h346736tin3v5qrun7espa1ooe5r3.apps.googleusercontent.com';
const gmailClientSecret = env.GMAIL_CLIENT_SECRET || '';
let gmailAccessToken = null;

async function getGmailAccessToken() {
  if (gmailAccessToken) return gmailAccessToken;
  if (!gmailRefreshToken || !gmailClientSecret) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: gmailClientId,
        client_secret: gmailClientSecret,
        refresh_token: gmailRefreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    if (data.error) {
      console.error(`  ⚠ Gmail token refresh failed: ${data.error_description || data.error}`);
      return null;
    }
    gmailAccessToken = data.access_token;
    return gmailAccessToken;
  } catch (err) {
    console.error(`  ⚠ Gmail token refresh error: ${err.message}`);
    return null;
  }
}

async function gmailApi(endpoint, params = {}) {
  const token = await getGmailAccessToken();
  if (!token) return null;

  const qs = new URLSearchParams(params).toString();
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/${endpoint}${qs ? '?' + qs : ''}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (res.status === 401) { gmailAccessToken = null; } // Force re-auth next call
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

// Legacy gws fallback (used only if no refresh token configured)
function gws(cmd) {
  try {
    return execSync(`gws ${cmd}`, { encoding: 'utf-8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return null;
  }
}

function parseGwsJson(output) {
  if (!output) return null;
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

  // Check if direct Gmail API is available
  const useDirectApi = !!(gmailRefreshToken && gmailClientSecret);
  if (!useDirectApi) {
    console.log('  ⚠ No GMAIL_REFRESH_TOKEN in .env.local — falling back to gws CLI');
    console.log('    Run: node scripts/gmail_auth.mjs  to set up direct Gmail API access');
  }

  for (const sender of GMAIL_SENDERS) {
    const q = `${sender.query} is:unread newer_than:2d`;

    let messages = null;

    if (useDirectApi) {
      // Direct Gmail REST API
      const result = await gmailApi('messages', { q, maxResults: '5' });
      messages = result?.messages || null;
    } else {
      // Fallback to gws CLI
      const raw = gws(`gmail users messages list --params '{"userId":"me","q":"${q}","maxResults":5}'`);
      const result = parseGwsJson(raw);
      messages = result?.messages || null;
    }

    if (!messages) {
      console.log(`  · ${sender.name}: no new messages`);
      continue;
    }

    console.log(`  ✓ ${sender.name}: ${messages.length} unread`);

    for (const msg of messages.slice(0, 3)) {
      let meta = null;

      if (useDirectApi) {
        meta = await gmailApi(`messages/${msg.id}`, { format: 'metadata' });
      } else {
        const metaRaw = gws(`gmail users messages get --params '{"userId":"me","id":"${msg.id}","format":"metadata"}'`);
        meta = parseGwsJson(metaRaw);
      }

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
  'big world cinema', 'african producers accelerator', 'apa programme',
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
  { name: 'Big World Cinema', url: 'https://bigworldcinema.com', selector: 'accelerator|apply|call|programme|submit|deadline' },
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

// ─── Playwright enrichment ────────────────────────────────────────────────────
//
// JS-rendered sites (e.g. African Film Press) don't expose article content in
// the static HTML. Playwright launches headless Chromium, waits for the JS to
// render, then extracts paragraphs from the fully-hydrated DOM.
//
// For opportunities, it scrapes source pages for deadline, eligibility, format,
// cost, and description — replacing the "To be confirmed" placeholders.

async function enrichWithPlaywright() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.log('  ⚠ Playwright not installed — skipping enrichment.');
    console.log('    Install with: npm install playwright && npx playwright install chromium');
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // ── Phase A: Enrich pending/thin news articles ─────────────────────────
  console.log('\n🎭 Playwright enrichment — pending & thin news articles...');
  const allNews = await supabaseGet('news', 'select=id,title,content,url,image_url,status&order=id.desc&limit=120');
  const thinNews = allNews.filter(n => n.url && (
    n.status === 'pending' ||
    (n.content || '').length < 150 ||
    !n.image_url
  ));
  console.log(`   ${thinNews.length} articles need enrichment (pending/thin/no image)`);

  let newsEnriched = 0;
  for (const item of thinNews) {
    let page;
    try {
      page = await context.newPage();
      await page.goto(item.url, { waitUntil: 'commit', timeout: 15000 });
      await page.waitForTimeout(5000);
      try { await page.waitForSelector('p', { timeout: 8000 }); } catch { /* ok */ }

      const scraped = await page.evaluate(() => {
        // ── Scrape article content ──
        let articleContent = null;
        const selectors = [
          'article p', '[class*="article"] p', '[class*="content"] p',
          '[class*="post"] p', '[class*="body"] p', 'main p',
        ];
        for (const sel of selectors) {
          const paras = document.querySelectorAll(sel);
          if (paras.length >= 2) {
            const texts = Array.from(paras).map(p => p.textContent.trim()).filter(t => t.length > 30);
            if (texts.length >= 2) { articleContent = texts.join('\n\n'); break; }
          }
        }
        if (!articleContent) {
          const allP = Array.from(document.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(t => t.length > 40 && !/cookie|subscribe|newsletter|sign up|terms|privacy/i.test(t));
          if (allP.length >= 2) articleContent = allP.join('\n\n');
        }
        if (!articleContent) {
          const divs = Array.from(document.querySelectorAll('div, section'))
            .filter(el => (el.innerText || '').length > 200 && (el.innerText || '').length < 10000)
            .sort((a, b) => (b.innerText || '').length - (a.innerText || '').length);
          if (divs.length > 0) articleContent = divs[0].innerText.trim();
        }

        // ── Scrape image ──
        let imageUrl = null;
        // Priority 1: OG image meta tag
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) imageUrl = ogImage.getAttribute('content');
        // Priority 2: Twitter card image
        if (!imageUrl) {
          const twImage = document.querySelector('meta[name="twitter:image"]');
          if (twImage) imageUrl = twImage.getAttribute('content');
        }
        // Priority 3: First large image in article
        if (!imageUrl) {
          const articleImgs = document.querySelectorAll('article img, [class*="article"] img, [class*="content"] img, main img');
          for (const img of articleImgs) {
            const src = img.src || img.getAttribute('data-src') || '';
            const w = img.naturalWidth || parseInt(img.getAttribute('width') || '0');
            if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar') && !src.includes('data:image') && (w === 0 || w >= 200)) {
              imageUrl = src;
              break;
            }
          }
        }
        // Ensure absolute URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          try { imageUrl = new URL(imageUrl, window.location.origin).href; } catch { imageUrl = null; }
        }

        return { articleContent, imageUrl };
      });

      const updates = {};

      // Update content if we got something better
      if (scraped.articleContent && scraped.articleContent.length > (item.content || '').length + 50) {
        let cleaned = scraped.articleContent.replace(/\n{3,}/g, '\n\n').replace(/^\s+/gm, '').trim().slice(0, 3000);
        cleaned = cleaned.replace(/\s*(Share|Related|You may also|Read more|Sign up|Subscribe|Newsletter|Cookie|Privacy|©|Follow us)[\s\S]*$/i, '').trim();
        if (cleaned.length > (item.content || '').length + 50) {
          updates.content = cleaned;
          updates.summary = cleaned.replace(/\n/g, ' ').slice(0, 300).trim();
        }
      }

      // Update image if we found one and item doesn't have one
      if (scraped.imageUrl && !item.image_url) {
        updates.image_url = scraped.imageUrl;
      }

      if (Object.keys(updates).length > 0) {
        await supabaseUpdate('news', item.id, updates);
        const parts = [];
        if (updates.content) parts.push(`content ${(item.content || '').length}→${updates.content.length}`);
        if (updates.image_url) parts.push('+ image');
        console.log(`  ✅ [${item.id}] ${item.title.slice(0, 55)} — ${parts.join(', ')}`);
        newsEnriched++;
      } else {
        console.log(`  · [${item.id}] ${item.title.slice(0, 55)} — no improvement found`);
      }
    } catch (err) {
      console.log(`  ✗ [${item.id}] ${item.title.slice(0, 40)} — ${err.message.slice(0, 60)}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
  console.log(`   News enriched: ${newsEnriched} / ${thinNews.length}`);

  // ── Phase B: Enrich opportunity fields ──────────────────────────────────
  console.log('\n🎭 Playwright enrichment — opportunity fields...');
  const allOpps = await supabaseGet('opportunities',
    `select=id,title,"What Is It?","Apply:","For Films or Series?","Next Deadline","Who Can Apply / Eligibility","What Do You Get If Selected?","Cost",category&order=id.desc&limit=150`);
  const needsEnrich = allOpps.filter(o =>
    (o['For Films or Series?'] === 'To be confirmed') ||
    (o['Next Deadline'] === 'To be confirmed') ||
    (o['Who Can Apply / Eligibility'] === 'To be confirmed') ||
    (o['What Do You Get If Selected?'] === 'To be confirmed') ||
    (!o.category)
  );
  console.log(`   ${needsEnrich.length} opportunities need field enrichment`);

  let oppsEnriched = 0;
  for (const opp of needsEnrich) {
    const url = opp['Apply:'];
    if (!url) continue;
    let page;
    try {
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
      await page.waitForTimeout(3000);

      const scraped = await page.evaluate(() => {
        const text = document.body.innerText || '';
        const lower = text.toLowerCase();

        // Deadline
        let deadline = null;
        const dlMatch = text.match(/deadline[:\s]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i)
          || text.match(/closes?[:\s]*on?\s*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i);
        if (dlMatch) deadline = dlMatch[1];

        // Eligibility
        let eligibility = null;
        const eligMatch = text.match(/(?:eligib[a-z]*|who can apply|open to|requirements?)[:\s]*([^.]{20,200}\.)/i);
        if (eligMatch) eligibility = eligMatch[0].trim();

        // Benefits
        let benefits = null;
        const benMatch = text.match(/(?:selected (?:projects?|participants?|filmmakers?) (?:will )?receive|support includes|grant (?:of|amount|value)|funding (?:of|up to))[:\s]*([^.]{20,300}\.)/i)
          || text.match(/((?:€|£|\$|USD|EUR)\s*[\d,]+(?:\s*(?:thousand|million|k))?[^.]{0,200}\.)/i);
        if (benMatch) benefits = benMatch[0].trim();

        // Description
        const paras = Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(p => p.length > 50 && !/cookie|subscribe|privacy/i.test(p));
        const description = paras.slice(0, 3).join(' ').slice(0, 600) || null;

        // Format
        let format = null;
        if (/feature film/i.test(lower)) format = 'Feature Films';
        else if (/short film/i.test(lower)) format = 'Short Films';
        else if (/documentary/i.test(lower)) format = 'Documentary';
        else if (/animation|animated/i.test(lower)) format = 'Animation';
        else if (/series|tv|television/i.test(lower)) format = 'Series / TV';
        else if (/all formats|any format/i.test(lower)) format = 'All Formats';

        // Category
        let category = null;
        if (/lab|workshop|residency|fellowship|training|mentorship/i.test(lower)) category = 'Labs & Fellowships';
        else if (/fund|grant|financ|support|bursary/i.test(lower)) category = 'Funds & Grants';
        else if (/festival|screening|competition|call for (?:entries|films|submissions)/i.test(lower)) category = 'Festivals';
        else if (/market|pitch|forum|co-?production/i.test(lower)) category = 'Markets & Pitching';
        else if (/vr|xr|ar|immersive|ai|virtual/i.test(lower)) category = 'AI & Emerging Tech';

        // Cost
        let cost = 'Free';
        if (/(?:entry |submission )?fee/i.test(lower)) cost = 'Check website';

        return { description, deadline, eligibility, benefits, format, category, cost };
      });

      const updates = {};
      if (scraped.description && (opp['What Is It?'] || '').length < scraped.description.length)
        updates['What Is It?'] = scraped.description;
      if (scraped.deadline && opp['Next Deadline'] === 'To be confirmed')
        updates['Next Deadline'] = scraped.deadline;
      if (scraped.eligibility && opp['Who Can Apply / Eligibility'] === 'To be confirmed')
        updates['Who Can Apply / Eligibility'] = scraped.eligibility;
      if (scraped.benefits && opp['What Do You Get If Selected?'] === 'To be confirmed')
        updates['What Do You Get If Selected?'] = scraped.benefits;
      if (scraped.format && opp['For Films or Series?'] === 'To be confirmed')
        updates['For Films or Series?'] = scraped.format;
      if (scraped.category && !opp.category)
        updates.category = scraped.category;
      if (scraped.cost && opp['Cost'] === 'To be confirmed')
        updates['Cost'] = scraped.cost;

      if (Object.keys(updates).length > 0) {
        await supabaseUpdate('opportunities', opp.id, updates);
        console.log(`  ✅ [${opp.id}] ${opp.title.slice(0, 50)} — ${Object.keys(updates).join(', ')}`);
        oppsEnriched++;
      }
    } catch (err) {
      // silent — many pages will fail and that's ok
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
  console.log(`   Opps enriched: ${oppsEnriched} / ${needsEnrich.length}`);

  await browser.close();
  console.log('   🎭 Playwright enrichment complete.');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`\n🎬 FRA Daily Opportunity Scanner — ${today}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${NEWS_ONLY ? ' (news only)' : ''}${ENRICH ? ' + enrichment' : ''}`);

  // 1. Load existing data for deduplication
  console.log('\n📦 Loading existing data...');
  const { oppTitles, newsTitles, newsSlugs, newsUrls, normalizeUrl } = await getExistingTitles();
  console.log(`   ${oppTitles.size} opportunities, ${newsTitles.size} news articles in DB`);

  const results = { news: [], opportunities: [], emails: [] };

  // 2. Scan RSS feeds
  console.log('\n📡 Scanning RSS feeds...');
  for (const feed of RSS_FEEDS) {
    const items = await fetchRSS(feed);
    for (const item of items) {
      if (isDuplicate(item.title, newsTitles)) continue;
      if (item.link && newsUrls.has(normalizeUrl(item.link))) continue;
      // Tier 1 Africa-focused feeds: skip relevance filter (already on-topic)
      // Tier 2 international feeds: require relevance keywords
      if (feed.filterRelevant && !isRelevant(`${item.title} ${item.description || ''}`)) continue;
      results.news.push(item);
    }
  }

  // 3. Scan Gmail (with dedup against DB titles + URLs)
  console.log('\n📧 Scanning Gmail...');
  try {
    const emailItems = await scanGmail();
    results.emails = emailItems.filter(item => {
      if (isDuplicate(item.title, oppTitles) || isDuplicate(item.title, newsTitles)) return false;
      return true;
    });
    if (emailItems.length !== results.emails.length) {
      console.log(`  ↳ Filtered ${emailItems.length - results.emails.length} duplicate email leads`);
    }
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
        if (item.link && newsUrls.has(normalizeUrl(item.link))) continue;
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

  // 6. Deduplicate within results (by title + URL)
  const seenTitles = new Set();
  const seenUrls = new Set();
  results.news = results.news.filter(item => {
    const key = item.title.toLowerCase().trim();
    const urlKey = item.link ? normalizeUrl(item.link) : null;
    if (seenTitles.has(key)) return false;
    if (urlKey && seenUrls.has(urlKey)) return false;
    seenTitles.add(key);
    if (urlKey) seenUrls.add(urlKey);
    return true;
  });
  results.opportunities = results.opportunities.filter(item => {
    const key = item.title.toLowerCase().trim();
    const urlKey = item.link ? normalizeUrl(item.link) : null;
    if (seenTitles.has(key)) return false;
    if (urlKey && seenUrls.has(urlKey)) return false;
    seenTitles.add(key);
    if (urlKey) seenUrls.add(urlKey);
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
      if (item.link && newsUrls.has(normalizeUrl(item.link))) {
        console.log(`  SKIP (URL exists): ${item.title.slice(0, 60)}`);
        continue;
      }
      // Auto-detect trailers/teasers for separate "Now Screening" section
      const titleLower = item.title.toLowerCase();
      const isTrailer = /\btrailer\b|\bteaser\b|\bfirst look\b|\bexclusive clip\b|\bsneak peek\b/.test(titleLower);
      const newsItem = {
        title: decodeEntities(item.title),
        summary: decodeEntities((item.description || '')).replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim().slice(0, 300),
        content: decodeEntities((item.description || '')).replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim(),
        category: isTrailer ? 'trailer' : 'industry_news',
        url: item.link || null,
        slug,
        image_url: item.imageUrl || null,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        status: 'pending',
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
      // Fetch logo and OG image for the opportunity
      const logo = item.url ? await fetchLogoForUrl(item.url) : null;
      const ogImage = item.url ? await fetchOgImageForUrl(item.url) : null;
      const oppItem = {
        title: decodeEntities(item.title),
        'What Is It?': decodeEntities(item.snippet) || 'Discovered via automated scan — needs review.',
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
        ...(logo ? { logo } : {}),
        ...(ogImage ? { og_image_url: ogImage } : {}),
      };
      const extras = [logo && 'logo', ogImage && 'og'].filter(Boolean).join('+');
      if (DRY_RUN) {
        console.log(`  [DRY] Would insert opp: ${item.title.slice(0, 60)}${extras ? ` (+ ${extras})` : ''}`);
        console.log(`         URL: ${item.url || 'N/A'}`);
      } else {
        try {
          await supabaseInsert('opportunities', oppItem);
          console.log(`  ✓ Inserted (pending): ${item.title.slice(0, 60)}${extras ? ` (+ ${extras})` : ''}`);
          oppsInserted++;
        } catch (err) {
          console.log(`  ✗ Failed: ${item.title.slice(0, 60)} — ${err.message}`);
        }
      }
    }
  }

  // 9. Playwright enrichment
  // Always enrich when new news was inserted (content + images for pending articles)
  // Full opportunity enrichment only with --enrich flag
  if (!DRY_RUN && (newsInserted > 0 || ENRICH)) {
    await enrichWithPlaywright();
  }

  // 10. Summary
  console.log('\n' + '─'.repeat(60));
  console.log(`📊 SCAN SUMMARY — ${today}`);
  console.log(`   RSS news found:      ${results.news.length}`);
  console.log(`   Email leads:         ${results.emails.length}`);
  console.log(`   Web opp leads:       ${results.opportunities.length}`);
  console.log(`   News inserted:       ${newsInserted}`);
  console.log(`   Opps inserted:       ${oppsInserted}`);
  console.log('─'.repeat(60));

  // 11. Send admin summary email
  const totalNew = newsInserted + oppsInserted;
  if (totalNew > 0 && !DRY_RUN && resendApiKey) {
    console.log('\n📧 Sending admin summary...');
    const emailLines = [];
    if (newsInserted > 0) emailLines.push(`<p><strong>${newsInserted} new news article${newsInserted > 1 ? 's' : ''}</strong> added as PENDING — <a href="${siteUrl}/admin">review & publish in admin</a>.</p>`);
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
