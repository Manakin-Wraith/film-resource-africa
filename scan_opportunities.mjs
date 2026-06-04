import { generateUniqueSummary, verifyAndFixSummary } from './summary_utils.mjs';
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
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { createHash } from 'crypto';

// Resolve the @mozilla/readability browser bundle once (injected into Playwright pages for
// article-body extraction). null if the package isn't installed — extraction falls back to
// the legacy DOM walker.
const _require = createRequire(import.meta.url);
let READABILITY_JS_PATH = null;
try {
  READABILITY_JS_PATH = join(dirname(_require.resolve('@mozilla/readability')), 'Readability.js');
  if (!existsSync(READABILITY_JS_PATH)) READABILITY_JS_PATH = null;
} catch { READABILITY_JS_PATH = null; }

// Domains that gate full text behind a paywall — when extraction is thin on these, we retry
// via the Wayback Machine, which usually has the full pre-paywall snapshot.
const PAYWALL_DOMAINS = new Set([
  'deadline.com', 'variety.com', 'thewrap.com', 'hollywoodreporter.com',
  'ft.com', 'wsj.com', 'nytimes.com', 'thetimes.co.uk', 'telegraph.co.uk',
]);

// ─── Config ──────────────────────────────────────────────────────────────────

// Load env: use .env.local if present (local dev), otherwise fall back to process.env (CI)
let env = {};
if (existsSync('.env.local')) {
  const envFile = readFileSync('.env.local', 'utf-8');
  env = Object.fromEntries(
    envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
  );
} else {
  env = process.env;
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const resendApiKey = env.RESEND_API_KEY;
const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://film-resource-africa.com';

// ─── Scanner config ───────────────────────────────────────────────────────────
const CONFIG_PATH = join(process.cwd(), 'scanner_config.json');
if (!existsSync(CONFIG_PATH)) {
  console.error('Missing scanner_config.json — copy from PI_Brain vault to repo root');
  process.exit(1);
}
const SCANNER_CONFIG = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env vars'); process.exit(1); }

// Save native fetch before Playwright overrides it
const nativeFetch = globalThis.fetch;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NEWS_ONLY = args.includes('--news-only');
const ENRICH = args.includes('--enrich');
const BACKFILL_DEADLINES = args.includes('--backfill-deadlines');
const VERIFY_ONLY = args.includes('--verify-only');

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

// Returns true for URLs that are clearly news articles rather than application pages.
// Date-based paths (/2026/04/) and /blog/ /news/ /article/ segments are strong indicators.
// PDFs are excluded — they can be legitimate call-for-entries documents.
function isNewsArticleUrl(url) {
  if (!url) return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path.endsWith('.pdf')) return false;
    if (/\/\d{4}\/\d{1,2}\//.test(path)) return true;        // /2026/04/ date paths
    if (/\/(blog|news|article|articles|post|posts|story|stories|press-release|media-release)\//i.test(path)) return true;
    // NB: deliberately NO slug-density heuristic here — it false-rejected real call-for-entries
    // pages (long hyphenated slugs). The actual news/non-opportunity safety net is the
    // _isActualOpportunity gate in the insert pipeline (works post-scrape via Claude).
    return false;
  } catch { return false; }
}

async function fetchLogoForUrl(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  if (PLATFORM_DOMAINS.has(domain) || PLATFORM_DOMAINS.has(domain.replace(/^[^.]+\./, ''))) return null;
  const localPath = `/logos/${domain}.png`;
  const localFile = join(LOGOS_DIR, `${domain}.png`);
  if (existsSync(localFile)) return localPath;
  try {
    const res = await nativeFetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
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
    const res = await nativeFetch(u, {
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
    // Pass 1: decode &amp; first so double-encoded entities (&amp;#8217;) become &#8217;
    .replace(/&amp;/g, '&')
    // Pass 2: numeric entities (decimal + hex)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    // Pass 3: named entities
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
    .replace(/&nbsp;/g, ' ')
    .replace(/&trade;/g, "\u2122")
    .replace(/&copy;/g, "\u00A9")
    .replace(/&reg;/g, "\u00AE")
    .replace(/&eacute;/g, "\u00E9")
    .replace(/&egrave;/g, "\u00E8");
}

// ─── Gmail body helpers ──────────────────────────────────────────────────────

function decodeBase64Url(data) {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractEmailBody(payload) {
  if (!payload) return '';
  // Simple non-multipart body
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  if (!payload.parts) return '';

  let htmlPart = null, textPart = null;
  for (const part of payload.parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) textPart = part;
    if (part.mimeType === 'text/html'  && part.body?.data) htmlPart = part;
    if (part.mimeType?.startsWith('multipart/')) {
      const nested = extractEmailBody(part);
      if (nested) return nested;
    }
  }
  if (textPart) return decodeBase64Url(textPart.body.data);
  if (htmlPart) {
    const html = decodeBase64Url(htmlPart.body.data);
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  return '';
}

// ─── Supabase REST helpers ───────────────────────────────────────────────────

const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function supabaseGet(table, query) {
  const res = await nativeFetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`Supabase GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Fetch ALL rows for a select, paging past PostgREST's per-response row cap (default 1000).
// Without this, dedup sets miss the most-recent rows and re-inserts hit 409 unique-violations.
async function supabaseGetAll(table, select) {
  const PAGE = 1000;
  const all = [];
  let offset = 0;
  while (true) {
    const rows = await supabaseGet(table, `${select}&order=id.asc&limit=${PAGE}&offset=${offset}`);
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

async function supabaseInsert(table, item) {
  const res = await nativeFetch(`${supabaseUrl}/rest/v1/${table}`, {
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
  const res = await nativeFetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Supabase UPDATE ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Deduplication ───────────────────────────────────────────────────────────

async function getExistingTitles() {
  const opps = await supabaseGetAll('opportunities', 'select=title');
  const news = await supabaseGetAll('news', 'select=title,slug,url');
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

function stripSiteSuffix(title) {
  // Remove trailing " - sitename.com" / " | Site Name" patterns added by page <title> tags
  return title
    .replace(/\s*[-–—|]\s*[a-z0-9-]+\.(com|org|net|co|io|tv|africa|ng|za|ke|uk)\b.*$/i, '')
    .replace(/\s*[-–—|]\s*[A-Z][\w\s&]+$/, m => m.length < 30 ? '' : m)
    .trim();
}

function extractKeywords(text) {
  return stripSiteSuffix(text).toLowerCase()
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

// Filter out directory/aggregation/news pages that aren't actual opportunities
const JUNK_TITLE_PATTERNS = [
  // Existing list/directory patterns
  /\bdirectory\b/i,
  /\bgrants? list\b/i,
  /^home\s*[-–—]?/i,
  /^home\b/i,
  /\bfunding opportunities\b.*closing/i,
  /\btop \d+ (?:grants?|funds?)\b/i,
  /\bavailable right now\b/i,
  /\bclosing in (?:january|february|march|april|may|june|july|august|september|october|november|december)/i,
  /\bbest film grants\b/i,
  /\bgrants? (?:&|and) funding opportunities\b/i,
  /\bcurrently open to\b/i,
  /\b(?:grants?|funds?) for african filmmakers\s*[-–—]?\s*film/i,

  // Film/TV news articles masquerading as opportunities
  /\bline.?up\b/i,                                          // "announces 2026 lineup"
  /\bfilms? turning \d+\b/i,                                // "25 films turning 10"
  /\b\d+ (?:african |best |must.see )?films?\b/i,           // "10 African films to watch"
  /\bfilms? (?:and|&) (?:tv shows?|series|television)\b/i,  // "Films and TV Shows Releasing"
  /\bfilms? (?:to watch|you (?:must|should)|worth)\b/i,
  /\breleasing in \d{4}\b/i,                                // "releasing in 2026"
  /\b(?:\d{4} )?(?:tv|ramadan|schedule)\b.*\bseries\b/i,   // TV/Ramadan schedules
  /\bschedule\b.*\b(?:tv|series|show|season)\b/i,

  // Film reviews
  /\breview\s*[–—:]/i,                                      // "Title review –"
  /[–—:]\s*review\b/i,                                      // "Review: Title"

  // Oscar/festival race (news) vs open call (opportunity)
  /\b(?:oscar|academy award)s?\s+(?:submission|entry|race|contender|campaign)\b/i,
  /\b(?:race|compete|competing|shortlist) (?:for|at) the (?:oscar|academy|cannes|berlinale)\b/i,
  /\b\d+ (?:arab|african|asian) films? (?:join|in) the race\b/i,

  // Pure news/analysis that isn't actionable
  /\bwho is (?:the |a )\b/i,                               // "Who is the Real Power"
  /\bpower (?:ranking|list|index)\b/i,
  /\bstrategic roadmap\b/i,
  /\bbox office\b/i,
  /\bopening weekend\b/i,
  /\bwikipedia\b/i,
  /^msn\b/i,
  /^(?:login|sign in|gms login)\b/i,                        // Login pages

  // Grant/award result announcements — past tense, not open calls
  /\b(?:wins?|won|bags?|bagged|lands?|secures?|secured|scoops?|clinch(?:es?)?)\b.{0,50}\b(?:grant|fund|award|fellowship|prize|bursary)\b/i,
  /\b(?:awarded|receives?|received)\b.{0,50}\b(?:grant|fund|fellowship|prize|bursary)\b/i,
  /\b(?:grant|fund|award|fellowship|prize)\b.{0,50}\b(?:goes? to|awarded to|received by|presented to|claimed by|won by)\b/i,
  /\b(?:winner|recipient|awardee)s?\b.{0,30}\b(?:announced|revealed|named|selected)\b/i,

  // Shortlist / selection result announcements
  /\b(?:shortlist|longlist)(?:ed|s)?\b/i,                  // "shortlisted for HBF", "HBF longlist"
  /\b\d+\s+(?:african\s+)?(?:films?|projects?|filmmakers?)\s+(?:selected|chosen|shortlisted|awarded)\b/i,
  /\bannounces?\s+(?:its\s+|the\s+)?\d{4}\s+(?:grant|fund|fellow|lab|winner|selection|recipient)s?\b/i,

  // Editorial, guide, listicle content
  /\bhow\s+to\s+(?:apply|get|win|write|access|secure)\b/i, // advice articles
  /\b(?:complete|ultimate|beginner|practical)\s+guide\b/i,
  /\b\d+\s+(?:tips?|ways?|steps?)\s+(?:to|for)\s+(?:apply|get|win|write)\b/i,

  // Interview / profile / opinion content
  /^(?:interview|in\s+conversation|q\s*[&+]\s*a|profile|opinion|essay|analysis)\s*:/i,
  /[–—:]\s*(?:an?\s+)?(?:interview|profile|conversation)\s+with\b/i,
];

// Strong signals: present in actionable open-call language; one is sufficient.
const OPPORTUNITY_SIGNALS_STRONG = [
  'call for', 'open call', 'call for entries', 'call for submissions',
  'apply now', 'apply by', 'applications open', 'applications now open',
  'submit your', 'submit your film', 'open for submissions',
  'pitch forum', 'co-production fund',
  'development programme', 'development program',
  'commission fund', 'award fund', 'prize fund', 'bursary', 'stipend',
  'rebate', 'incentive',
];

// Weak signals: common in both news and open calls; require a strong signal alongside them.
const OPPORTUNITY_SIGNALS_WEAK = [
  'grant', 'fund', 'fellowship', 'residency', 'lab', 'accelerator',
  'financing', 'application', 'apply', 'deadline',
  'training', 'workshop', 'masterclass',
];

function hasOpportunitySignal(title, snippet) {
  const text = `${title} ${snippet || ''}`.toLowerCase();
  if (OPPORTUNITY_SIGNALS_STRONG.some(w => text.includes(w))) return true;
  // Weak signals only count when paired with at least one other weak signal
  // (e.g. "fellowship application" or "grant deadline" → likely actionable)
  const weakHits = OPPORTUNITY_SIGNALS_WEAK.filter(w => text.includes(w));
  return weakHits.length >= 2;
}

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

// ─── Pre-insert QC helpers ───────────────────────────────────────────────────

const COUNTRY_KEYWORDS = {
  nigeria: ['nigeria', 'nigerian', 'lagos', 'nollywood', 'abuja'],
  'south-africa': ['south africa', 'south african', 'cape town', 'johannesburg', 'durban', 'joburg'],
  kenya: ['kenya', 'kenyan', 'nairobi', 'mombasa'],
  ghana: ['ghana', 'ghanaian', 'accra', 'ghallywood', 'kumasi'],
  egypt: ['egypt', 'egyptian', 'cairo', 'alexandria'],
  morocco: ['morocco', 'moroccan', 'marrakech', 'casablanca', 'ouarzazate', 'rabat'],
  tanzania: ['tanzania', 'tanzanian', 'dar es salaam', 'zanzibar', 'dodoma'],
  ethiopia: ['ethiopia', 'ethiopian', 'addis ababa', 'addis'],
  uganda: ['uganda', 'ugandan', 'kampala'],
  rwanda: ['rwanda', 'rwandan', 'kigali'],
  senegal: ['senegal', 'senegalese', 'dakar'],
  cameroon: ['cameroon', 'cameroonian', 'yaoundé', 'douala'],
  tunisia: ['tunisia', 'tunisian', 'tunis', 'carthage'],
  zimbabwe: ['zimbabwe', 'zimbabwean', 'harare'],
  'burkina-faso': ['burkina faso', 'burkinabè', 'ouagadougou', 'fespaco'],
};
const PAN_AFRICAN_KW = ['africa', 'african', 'pan-african', 'continent', 'sub-saharan', 'global south'];

function detectCountry(text) {
  const lower = text.toLowerCase();
  let best = null, bestCount = 0;
  for (const [slug, kws] of Object.entries(COUNTRY_KEYWORDS)) {
    const c = kws.filter(kw => lower.includes(kw)).length;
    if (c > bestCount) { best = slug; bestCount = c; }
  }
  return bestCount > 0 ? best : null;
}

function detectGeoScope(text) {
  const lower = text.toLowerCase();
  const countryHits = Object.values(COUNTRY_KEYWORDS).flat().filter(kw => lower.includes(kw)).length;
  const panHits = PAN_AFRICAN_KW.filter(kw => lower.includes(kw)).length;
  if (panHits >= 2 || (panHits >= 1 && countryHits === 0)) return 'pan_african';
  if (countryHits > 0) return 'country_specific';
  if (/international|global|worldwide|open to all/i.test(text)) return 'international';
  return null;
}

// ─── Africa relevance gate ───────────────────────────────────────────────────
//
// An opportunity must pass at least ONE of these checks to be inserted:
//   1. Geo signal: text contains African country names or pan-African terms
//   2. Known Africa-specific source org
//   3. Title/content references a known Africa-adjacent funder or programme
//
// "international" scope alone is not enough — we skip those unless they
// come from a trusted Africa-specific source.

const AFRICA_SPECIFIC_SOURCES = new Set([
  'Realness Institute', 'Docubox', 'Durban FilmMart', 'FESPACO',
  'Maisha Film Lab', 'Big World Cinema', 'Gauteng Film Commission',
  'Western Cape Film Commission', 'KwaZulu-Natal Film Commission',
  'Uganda Communications Commission', 'Uganda Film Festival',
  'African Film Press', 'Sinema Focus', 'Africa is a Country',
  'Nollywood Reinvented', 'The British Blacklist',
]);

const AFRICA_ADJACENT_TERMS = [
  'hubert bals', 'world cinema fund', 'bertha fund',
  'idfa bertha', 'hot docs crosscurrents', 'crosscurrents fund',
  'realness', 'docubox', 'maisha', 'fespaco', 'durban film mart',
  'durban filmmart', 'nfvf', 'safta', 'catapult film fund',
  'multichoice', 'showmax', 'canal+', 'mnet films',
  'africa is a country', 'african producers accelerator',
  'big world cinema', 'open cities', 'afriff', 'amaa',
  'zanzibar film', 'marrakech film', 'carthage film',
  'cape town film', 'nairobi film', 'lagos film',
];

function isAfricaRelevant(combinedText, source) {
  const lower = combinedText.toLowerCase();

  // Check 1: Africa-specific source
  if (source && AFRICA_SPECIFIC_SOURCES.has(source)) return true;

  // Check 2: African country or pan-African geo signal
  const geoScope = detectGeoScope(combinedText);
  if (geoScope === 'pan_african' || geoScope === 'country_specific') return true;

  // Check 3: Known Africa-adjacent funder/programme term in content
  if (AFRICA_ADJACENT_TERMS.some(t => lower.includes(t))) return true;

  return false;
}

async function validateUrl(url) {
  if (!url) return false;
  try {
    const res = await nativeFetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 FRA-Scanner/1.0' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    return res.ok || res.status === 405;
  } catch { return false; }
}

// ─── Regex-based opportunity field extraction (no AI required) ───────────────
//
// Extracts structured fields from page text using pattern matching.
// Works as a fallback when no ANTHROPIC_API_KEY is available, and as a
// supplement to Claude enrichment (fills gaps Claude misses).

function regexExtractFields(pageText) {
  const text = pageText || '';
  const lower = text.toLowerCase();
  const result = {};

  // ── Deadline extraction ──
  // Look for date patterns near deadline-related keywords
  const deadlineSection = text.match(/(?:deadline|closing date|due date|submit by|apply by|applications? close|closes?)[:\s—–-]*([^\n.]{5,80})/i);
  if (deadlineSection) {
    const dateStr = deadlineSection[1].trim();
    // Validate it looks like a date (has a month name or date-like pattern)
    if (/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4}|\d{4}[-/]\d{2})/i.test(dateStr)) {
      result['Next Deadline'] = dateStr.replace(/[.;,]+$/, '').slice(0, 60);
    }
  }
  // Fallback: standalone date near "deadline" word (within 200 chars)
  if (!result['Next Deadline']) {
    const deadlineBlock = text.match(/deadline[\s\S]{0,200}/i);
    if (deadlineBlock) {
      const dateMatch = deadlineBlock[0].match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i)
        || deadlineBlock[0].match(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i)
        || deadlineBlock[0].match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
      if (dateMatch) result['Next Deadline'] = dateMatch[1];
    }
  }
  // Rolling deadline detection
  if (!result['Next Deadline'] && /\b(rolling|ongoing|no deadline|open[-\s]?ended|year[-\s]?round)\b/i.test(text)) {
    result['Next Deadline'] = 'Rolling';
  }

  // ── Eligibility extraction ──
  const eligPatterns = [
    /(?:who can apply|eligibility|eligible|requirements?|open to)[:\s—–-]*((?:[^\n]{10,200}\n?){1,3})/i,
    /(?:applicants? (?:must|should|need to))[:\s]*((?:[^\n]{10,200}\n?){1,2})/i,
    /(?:this (?:call|fund|grant|programme|program|fellowship|residency) is (?:open )?(?:to|for))[:\s]*((?:[^\n]{10,150}\n?){1,2})/i,
  ];
  for (const pat of eligPatterns) {
    const m = text.match(pat);
    if (m && m[1].trim().length > 15) {
      result['Who Can Apply / Eligibility'] = m[1].trim().replace(/\s{2,}/g, ' ').slice(0, 300);
      break;
    }
  }

  // ── Benefits / what you get extraction ──
  const benefitPatterns = [
    /(?:what (?:you|participants?|fellows?|grantees?) (?:will )?(?:get|receive)|benefits?|prize|award|funding amount|grant (?:amount|value)|support includes?)[:\s—–-]*((?:[^\n]{10,200}\n?){1,3})/i,
    /(?:selected (?:projects?|filmmakers?|participants?) (?:will )?receive)[:\s]*((?:[^\n]{10,200}\n?){1,2})/i,
    /(?:up to|total of|worth|valued at)\s*([€$£¥₦R]?\s*[\d,.]+\s*(?:k|m|million|thousand|USD|EUR|GBP|ZAR|NGN)?)/i,
  ];
  for (const pat of benefitPatterns) {
    const m = text.match(pat);
    if (m && m[1].trim().length > 5) {
      result['What Do You Get If Selected?'] = m[1].trim().replace(/\s{2,}/g, ' ').slice(0, 300);
      break;
    }
  }
  // Supplement: find currency amounts as benefits hint
  if (!result['What Do You Get If Selected?']) {
    const amountMatch = text.match(/([€$£¥₦R]\s*[\d,.]+(?:\s*(?:k|m|million|thousand|USD|EUR|GBP|ZAR|NGN))?)/i);
    if (amountMatch && /fund|grant|prize|award|support|fellowship/i.test(lower)) {
      result['What Do You Get If Selected?'] = `Funding: ${amountMatch[1]}`;
    }
  }

  // ── Cost extraction ──
  if (/\b(no (?:entry |submission |application )?fee|free (?:to apply|of charge|submission)|fee[\s:-]*free|no cost)\b/i.test(text)) {
    result['Cost'] = 'Free';
  } else {
    const feeMatch = text.match(/(?:(?:entry|submission|application|registration)\s*fee)[:\s—–-]*((?:[€$£¥₦R]?\s*[\d,.]+[^\n]{0,50})|free)/i);
    if (feeMatch) {
      result['Cost'] = feeMatch[1].trim().slice(0, 80);
    }
  }

  // ── Format / type of work ──
  const formatKeywords = {
    'Feature Films': /\b(feature[- ]?film|feature[- ]?length|full[- ]?length film)\b/i,
    'Short Films': /\b(short film|short[- ]form)\b/i,
    'Documentary': /\b(documentary|docu(?:mentary|series|drama)?)\b/i,
    'Animation': /\b(animat(?:ion|ed))\b/i,
    'Series': /\b(tv series|web series|television|episodic)\b/i,
    'All Formats': /\b(all (?:genres?|formats?|types?)|any format|any genre)\b/i,
  };
  const detectedFormats = [];
  for (const [label, regex] of Object.entries(formatKeywords)) {
    if (regex.test(text)) detectedFormats.push(label);
  }
  if (detectedFormats.length > 0) {
    result['For Films or Series?'] = detectedFormats.length > 2 ? 'All Formats' : detectedFormats.join(' / ');
  }

  // ── What to submit ──
  const submitPatterns = [
    /(?:required (?:materials?|documents?)|submission (?:requirements?|materials?|guidelines?))[:\s—–-]*((?:[^\n]{10,200}\n?){1,4})/i,
    /(?:please (?:submit|send|provide|include))[:\s]*((?:[^\n]{10,150}\n?){1,3})/i,
    /(?:application (?:must|should) include)[:\s]*((?:[^\n]{10,200}\n?){1,3})/i,
    /(?:what to submit)[:\s—–-]*((?:[^\n]{10,200}\n?){1,4})/i,
  ];
  for (const pat of submitPatterns) {
    const m = text.match(pat);
    if (m && m[1].trim().length > 15) {
      const candidate = m[1].trim().replace(/\s{2,}/g, ' ').slice(0, 400);
      // Quality check: reject nav-like text (too many capitalized words in sequence)
      const words = candidate.split(/\s+/);
      const capWords = words.filter(w => /^[A-Z]/.test(w)).length;
      if (capWords / words.length > 0.7 && words.length > 10) continue; // Likely nav
      result['What to Submit'] = candidate;
      break;
    }
  }

  // ── Description (first substantial paragraph about the programme) ──
  const descPatterns = [
    /(?:about (?:the )?(?:programme|program|fund|grant|fellowship|residency|lab|call))[:\s—–-]*((?:[^\n]{30,300}\n?){1,3})/i,
    /(?:(?:this|the) (?:programme|program|fund|grant|fellowship|residency|lab|initiative|scheme))\s+((?:is|supports?|provides?|offers?|aims?|seeks?)[^\n]{20,250})/i,
  ];
  for (const pat of descPatterns) {
    const m = text.match(pat);
    if (m && m[1].trim().length > 30) {
      result.description = m[1].trim().replace(/\s{2,}/g, ' ').slice(0, 400);
      break;
    }
  }

  // ── Category inference ──
  if (/\b(festival|film festival|submit your film|call for entries|screening)\b/i.test(text)) {
    result.category = 'Festivals';
  } else if (/\b(lab|fellowship|residency|incubator|talent|mentorship)\b/i.test(text)) {
    result.category = 'Labs & Fellowships';
  } else if (/\b(market|pitch|pitching forum|co-?production|slate)\b/i.test(text)) {
    result.category = 'Markets & Pitching';
  } else if (/\b(training|workshop|masterclass|course|skill)\b/i.test(text)) {
    result.category = 'Training';
  } else if (/\b(distribution|sales agent|acquisition|theatrical release)\b/i.test(text)) {
    result.category = 'Distribution';
  } else if (/\b(grant|fund|financing|bursary|subsidy|rebate|incentive)\b/i.test(text)) {
    result.category = 'Funds & Grants';
  }

  // ── Determine if this is an actual opportunity page ──
  const oppSignals = ['apply', 'submit', 'deadline', 'eligib', 'open call', 'call for',
    'application', 'grant', 'fund', 'fellowship', 'residency', 'lab', 'programme', 'program'];
  const signalCount = oppSignals.filter(s => lower.includes(s)).length;
  if (signalCount >= 3) {
    result._isActualOpportunity = true;
  } else if (signalCount <= 1 && text.length > 500) {
    // Long page with almost no opportunity language — likely not actionable
    result._isActualOpportunity = false;
  }

  return result;
}

// ─── Claude API enrichment ───────────────────────────────────────────────────

const anthropicApiKey = env.ANTHROPIC_API_KEY;

async function enrichOpportunityFromPage(url) {
  if (!url) return {};
  try {
    // Fetch page text
    const res = await nativeFetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });
    if (!res.ok) return {};
    const html = await res.text();
    const pageText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 6000);

    // Detect bot/challenge pages — skip enrichment
    if (/verif(y|ying) you are|cloudflare|just a moment|enable javascript|browser check/i.test(pageText.slice(0, 300))) {
      return {};
    }

    // Always run regex extraction (fast, no API needed)
    const regexFields = regexExtractFields(pageText);
    const country = detectCountry(pageText);
    const scope = detectGeoScope(pageText);
    const geoFields = {
      ...(country ? { _detectedCountry: country } : {}),
      ...(scope ? { _geoScope: scope } : {}),
    };

    // Use Claude if API key available — merge with regex (Claude takes priority, regex fills gaps)
    if (anthropicApiKey) {
      const claudeFields = await claudeEnrichFields(pageText, url);
      // Merge: Claude wins where it has data, regex fills remaining gaps
      const merged = { ...regexFields, ...geoFields };
      for (const [key, val] of Object.entries(claudeFields)) {
        // NB: keep `val !== undefined` not `val` — a falsy `false` (e.g. _isActualOpportunity)
        // must survive the merge, otherwise the downstream not-an-opportunity gate is dead.
        if (val !== undefined && val !== '' && val !== 'TBC') merged[key] = val;
      }
      return merged;
    }

    // No Claude: regex extraction + geo signals
    return { ...regexFields, ...geoFields };
  } catch {
    return {};
  }
}

async function claudeEnrichFields(pageText, url) {
  const prompt = `You are extracting structured data about a film industry opportunity for African filmmakers from a scraped web page.

URL: ${url}

Page content:
${pageText}

Return ONLY a valid JSON object — no markdown, no explanation. Use exactly these keys:
{
  "description": "2-3 sentence plain-English description of what this opportunity is. Be specific.",
  "For Films or Series?": "one of: Feature Films / Short Films / Documentary / Animation / Series / TV / All Formats — pick the best fit",
  "What Do You Get If Selected?": "specific benefits: funding amount, mentorship, distribution, residency etc. Include currency and amounts if stated.",
  "Cost": "Free — or the actual fee amount if one exists",
  "Next Deadline": "deadline in plain text e.g. '30 June 2026', or 'Rolling', or 'TBC' if not found",
  "Who Can Apply / Eligibility": "nationality, career stage, project stage, country restrictions etc. Be specific.",
  "What to Submit": "required materials: script, trailer, synopsis, CV, budget etc.",
  "Strongest Submission Tips": "2-3 practical tips inferred from the eligibility and submission criteria",
  "CALENDAR REMINDER:": "short string e.g. 'Set reminder: 16 June 2026 (2 weeks before deadline)'",
  "category": "one of: Funds & Grants / Labs & Fellowships / Festivals / Markets & Pitching / Training / Distribution — pick the best fit",
  "is_actual_opportunity": true if this page describes a specific actionable grant/fund/festival/lab/residency with application details, false if it is a blog post, list, directory, or generic about page,
  "africa_relevance": "explain in one sentence why this is relevant to African filmmakers"
}

Rules:
- Never invent specifics not supported by the page content
- Use "TBC" for fields you cannot find — never use "To be confirmed"
- If the page is bot-protected, a list/directory, or has no real opportunity content, set is_actual_opportunity to false`;

  try {
    const res = await nativeFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return {};
    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const parsed = JSON.parse(jsonMatch[0]);

    // Map Claude output to scanner field names
    return {
      description:                    parsed.description || '',
      'For Films or Series?':         parsed['For Films or Series?'] || '',
      'What Do You Get If Selected?': parsed['What Do You Get If Selected?'] || '',
      'Cost':                         parsed['Cost'] || '',
      'Next Deadline':                parsed['Next Deadline'] || '',
      'Who Can Apply / Eligibility':  parsed['Who Can Apply / Eligibility'] || '',
      'What to Submit':               parsed['What to Submit'] || '',
      'Strongest Submission Tips':    parsed['Strongest Submission Tips'] || '',
      'CALENDAR REMINDER:':           parsed['CALENDAR REMINDER:'] || '',
      category:                       parsed.category || '',
      _isActualOpportunity:           parsed.is_actual_opportunity !== false,
      _africaRelevance:               parsed.africa_relevance || '',
      _detectedCountry:               detectCountry(pageText),
      _geoScope:                      detectGeoScope(pageText),
    };
  } catch {
    return {};
  }
}

// ─── Claude: extract leads from a Gmail email body ───────────────────────────

async function claudeExtractFromEmail(subject, from, body) {
  if (!anthropicApiKey || !body || body.length < 80) return [];
  const prompt = `Extract all film industry opportunities and news items from this email newsletter.

From: ${from}
Subject: ${subject}

Email content:
${body.slice(0, 5500)}

Return ONLY a valid JSON array — no markdown, no explanation. Each object:
{
  "type": "opportunity" or "news",
  "title": "specific, descriptive title",
  "description": "2–3 sentence plain-English description of what this is",
  "url": "direct apply/read-more URL if present, else null",
  "deadline": "deadline date string, 'Rolling', or null",
  "eligibility": "who can apply (opportunities only), else null",
  "benefits": "what is offered/awarded (opportunities only), else null",
  "category": "Funds & Grants | Labs & Fellowships | Festivals | Markets & Pitching | Training | Distribution | industry_news"
}

Rules:
- Only include items relevant to African filmmakers or the African/global film industry
- Opportunities: grants, labs, residencies, fellowships, festivals with open calls, pitching forums
- News: industry announcements, box office, acquisitions, festival results, casting, distribution deals
- Skip unsubscribe links, footers, generic promotional copy
- Return [] if nothing relevant
- Maximum 6 items per email`;

  try {
    const res = await nativeFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch { return []; }
}

// ─── Source 1: RSS Feeds ─────────────────────────────────────────────────────
// Source of truth: scanner_config.json → sources.rss (status: active)

const RSS_FEEDS = SCANNER_CONFIG.sources.rss
  .filter(f => f.status === 'active')
  .map(f => ({ name: f.name, url: f.url, type: 'news', filterRelevant: f.filter ?? false }));

async function fetchRSS(feed) {
  const items = [];
  try {
    const res = await nativeFetch(feed.url, {
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
      const rawImageUrl = getAttr('enclosure', 'url') || getAttr('media:content', 'url') || null;
      const imageUrl = rawImageUrl ? decodeEntities(rawImageUrl) : null;

      if (title) {
        // Skip items older than 7 days — RSS feeds sometimes serve stale archive content
        if (pubDate) {
          const ageMs = Date.now() - new Date(pubDate).getTime();
          if (ageMs > 7 * 24 * 60 * 60 * 1000) continue;
        }
        items.push({ title: decodeEntities(title), link, description, pubDate, imageUrl, source: feed.name, type: feed.type });
      }
    }
    console.log(`  ✓ ${feed.name}: ${items.length} items`);
  } catch (err) {
    console.log(`  ✗ ${feed.name}: ${err.message}`);
  }
  return items;
}

// ─── Source 2: Gmail newsletters ─────────────────────────────────────────────
// Source of truth: scanner_config.json → sources.gmail (senders + subjects, status: active)

const GMAIL_SENDERS = [
  ...SCANNER_CONFIG.sources.gmail.senders.filter(s => s.status === 'active'),
  ...SCANNER_CONFIG.sources.gmail.subjects.filter(s => s.status === 'active'),
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
    const res = await nativeFetch('https://oauth2.googleapis.com/token', {
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
    const res = await nativeFetch(url, {
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

  // Decide Gmail access method: try direct API first, fall back to gws CLI
  let method = (gmailRefreshToken && gmailClientSecret) ? 'api' : 'gws';

  // Pre-flight: test direct API token before looping through all senders
  if (method === 'api') {
    const token = await getGmailAccessToken();
    if (!token) {
      console.log('  ⚠ Direct API token refresh failed — falling back to gws CLI');
      method = 'gws';
    }
  }

  if (method === 'gws') {
    // Verify gws is available and authenticated
    const testResult = parseGwsJson(gws(`gmail users messages list --params '{"userId":"me","maxResults":1}'`));
    if (!testResult) {
      console.log('  ✗ gws CLI also unavailable — skipping Gmail scan');
      console.log('    Fix: run "gws auth login" to re-authenticate');
      return items;
    }
    console.log('  ✓ Using gws CLI for Gmail access');
  } else {
    console.log('  ✓ Using direct Gmail API');
  }

  for (const sender of GMAIL_SENDERS) {
    const q = `${sender.query} is:unread newer_than:2d`;

    let messages = null;

    if (method === 'api') {
      const result = await gmailApi('messages', { q, maxResults: '5' });
      messages = result?.messages || null;
    } else {
      const raw = gws(`gmail users messages list --params '{"userId":"me","q":"${q.replace(/'/g, "\\'")}","maxResults":5}'`);
      const result = parseGwsJson(raw);
      messages = result?.messages || null;
    }

    if (!messages) {
      console.log(`  · ${sender.name}: no new messages`);
      continue;
    }

    console.log(`  ✓ ${sender.name}: ${messages.length} unread`);

    for (const msg of messages.slice(0, 3)) {
      let full = null;

      if (method === 'api') {
        full = await gmailApi(`messages/${msg.id}`, { format: 'full' });
      } else {
        const raw = gws(`gmail users messages get --params '{"userId":"me","id":"${msg.id}","format":"full"}'`);
        full = parseGwsJson(raw);
      }

      if (!full || !full.payload) continue;

      const hdrs = {};
      for (const h of full.payload.headers || []) {
        hdrs[h.name] = h.value;
      }

      const subject = hdrs['Subject'] || 'Untitled';
      const from    = hdrs['From'] || '';
      const date    = hdrs['Date'] || '';

      // Extract body text and parse leads with Claude
      const body = extractEmailBody(full.payload);
      if (body && body.length > 80) {
        const leads = await claudeExtractFromEmail(subject, from, body);
        for (const lead of leads) {
          if (!lead.title || !lead.type) continue;
          if (lead.type === 'opportunity') {
            items.push({
              title:   lead.title,
              url:     lead.url || null,
              snippet: lead.description || '',
              source:  sender.name,
              type:    'opportunity',
              _emailDeadline:    lead.deadline || null,
              _emailEligibility: lead.eligibility || null,
              _emailBenefits:    lead.benefits || null,
              _emailCategory:    lead.category || null,
            });
          } else if (lead.type === 'news') {
            items.push({
              title:       lead.title,
              link:        lead.url || null,
              description: lead.description || '',
              source:      sender.name,
              type:        'news',
              pubDate:     date,
            });
          }
        }
        console.log(`    → ${sender.name} [${subject.slice(0,40)}]: ${leads.length} lead(s) extracted`);
      } else {
        // Fallback: surface as a raw email signal (body too short / no content)
        items.push({
          title:     subject,
          source:    sender.name,
          from,
          date,
          messageId: msg.id,
          type:      'email_signal',
        });
      }
    }
  }
  return items;
}

// ─── Source 3: Web search for opportunities ──────────────────────────────────
// Source of truth: scanner_config.json → sources.web_search.queries (status: active)

const SEARCH_QUERIES = SCANNER_CONFIG.sources.web_search.queries
  .filter(q => q.status === 'active')
  .map(q => q.q);

async function webSearch(query) {
  // Use a simple web search approach via fetch
  const items = [];
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await nativeFetch(searchUrl, {
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
// Source of truth: scanner_config.json → relevance_keywords (all categories, lowercased)

const RELEVANCE_KEYWORDS = Object.values(SCANNER_CONFIG.relevance_keywords)
  .flat()
  .map(k => k.toLowerCase());

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
// Source of truth: scanner_config.json → sources.org_pages (status: active)

const KEY_ORG_PAGES = SCANNER_CONFIG.sources.org_pages
  .filter(p => p.status === 'active')
  .map(p => ({ name: p.name, url: p.url, selector: p.keywords.join('|') }));

function extractLinksFromHtml(html, page) {
  const items = [];
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
  return items;
}

async function scanKeyPages(existingTitles) {
  const items = [];
  const failedPages = [];

  // Pass 1: Try with plain fetch
  for (const page of KEY_ORG_PAGES) {
    try {
      const res = await nativeFetch(page.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      if (!res.ok) {
        console.log(`  ⚠ ${page.name}: HTTP ${res.status} — queued for Playwright retry`);
        failedPages.push(page);
        continue;
      }
      const html = await res.text();
      items.push(...extractLinksFromHtml(html, page));
      console.log(`  ✓ ${page.name}: scanned`);
    } catch (err) {
      console.log(`  ⚠ ${page.name}: ${err.message.slice(0, 50)} — queued for Playwright retry`);
      failedPages.push(page);
    }
  }

  // Pass 2: Retry failed pages with Playwright (bypasses bot-blocking / JS-rendered sites)
  if (failedPages.length > 0) {
    let chromium;
    try {
      ({ chromium } = await import('playwright'));
    } catch {
      console.log(`  ⚠ Playwright not installed — skipping ${failedPages.length} failed pages`);
      return items;
    }

    console.log(`  🎭 Retrying ${failedPages.length} blocked pages with Playwright...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });

    for (const page of failedPages) {
      let pwPage;
      try {
        pwPage = await context.newPage();
        await pwPage.goto(page.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await pwPage.waitForTimeout(3000);
        const html = await pwPage.content();
        const found = extractLinksFromHtml(html, page);
        items.push(...found);
        console.log(`  ✓ ${page.name}: scanned via Playwright (${found.length} links)`);
      } catch (err) {
        console.log(`  ✗ ${page.name}: Playwright also failed — ${err.message.slice(0, 50)}`);
      } finally {
        if (pwPage) await pwPage.close().catch(() => {});
      }
    }
    await browser.close();
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

// ─── Deadline text → date parsing ─────────────────────────────────────────────
// Parse a free-text "Next Deadline" into a YYYY-MM-DD string for cadence math. Strategy:
// collect every date mention that carries a 4-digit year, then pick the next actionable one —
// the earliest FUTURE date, or if all are past, the latest PAST date. Returns null for
// rolling/TBC/prose with no year-qualified date (year-less "1 July" is intentionally skipped
// to avoid guessing). `now` is injected for testability. Reused by the Phase-C re-verify pass.
const _MONTHS = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
function monthNum(s) { return _MONTHS[s.slice(0, 3).toLowerCase()] || null; }

function parseDeadlineToDate(text, now = new Date()) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  // Pure rolling/ongoing/TBC with no concrete date → no cadence date.
  if (/\b(rolling|ongoing|tbc|to be confirmed)\b/.test(t) && !/\d{4}/.test(t)) return null;

  const monthAlt = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
  const dates = [];
  let m;
  // "19 April 2026" / "09 march 2026" / "18th July 2025"
  const reA = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthAlt})\\.?\\s+(\\d{4})\\b`, 'gi');
  while ((m = reA.exec(t))) {
    const day = +m[1], mon = monthNum(m[2]), yr = +m[3];
    if (mon && day >= 1 && day <= 31) dates.push(Date.UTC(yr, mon - 1, day));
  }
  // "April 10, 2026" / "Jan 07 2026" / "April 4th, 2026" / "OCTOBER 2, 2024"
  const reB = new RegExp(`\\b(${monthAlt})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'gi');
  while ((m = reB.exec(t))) {
    const mon = monthNum(m[1]), day = +m[2], yr = +m[3];
    if (mon && day >= 1 && day <= 31) dates.push(Date.UTC(yr, mon - 1, day));
  }

  if (!dates.length) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const future = dates.filter(d => d >= today).sort((a, b) => a - b);
  const chosen = future.length ? future[0] : dates.sort((a, b) => b - a)[0];
  return new Date(chosen).toISOString().slice(0, 10);
}

// One-time (and re-runnable) backfill of deadline_date from existing "Next Deadline" text.
async function backfillDeadlineDates() {
  console.log('\n📅 Backfilling deadline_date from "Next Deadline" text...');
  const opps = await supabaseGetAll('opportunities', 'select=id,"Next Deadline",deadline_date');
  let updated = 0, alreadySet = 0, skipped = 0;
  for (const o of opps) {
    if (o.deadline_date) { alreadySet++; continue; }
    const parsed = parseDeadlineToDate(o['Next Deadline']);
    if (!parsed) { skipped++; continue; }
    if (DRY_RUN) {
      console.log(`  [DRY] #${o.id}: "${(o['Next Deadline'] || '').slice(0, 45)}" → ${parsed}`);
    } else {
      await supabaseUpdate('opportunities', o.id, { deadline_date: parsed });
      console.log(`  ✓ #${o.id}: ${parsed}  ← "${(o['Next Deadline'] || '').slice(0, 45)}"`);
    }
    updated++;
  }
  console.log(`   Backfill complete: ${updated} ${DRY_RUN ? 'would update' : 'updated'}, ${alreadySet} already had a date, ${skipped} unparseable/rolling.`);
}

// Decide whether an opportunity is due for Phase-C re-verification, and in which urgency
// bucket. Cadence scales with deadline proximity: closing-soon checks weekly, open monthly,
// dormant (past/no deadline) monthly for reopen detection. Returns null if not due.
function verifyBucket(opp, nowMs) {
  if (!['approved', 'pending', 'closed', 'expired'].includes(opp.status)) return null;
  const url = opp['Apply:'];
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (url.toLowerCase().split('?')[0].endsWith('.pdf')) return null;     // can't read PDFs
  if ((opp.verify_attempts || 0) >= 5) return null;                      // give up on dead sources
  const DAY = 86400000;
  const lastV = opp.last_verified_at ? new Date(opp.last_verified_at).getTime() : 0;
  const ageDays = (nowMs - lastV) / DAY;
  const dd = opp.deadline_date ? new Date(opp.deadline_date + 'T00:00:00Z').getTime() : null;
  const daysToDeadline = dd != null ? (dd - nowMs) / DAY : null;

  if (daysToDeadline != null && daysToDeadline >= 0 && daysToDeadline <= 30) return ageDays >= 7 ? 'closing_soon' : null;
  if (daysToDeadline != null && daysToDeadline > 30) return ageDays >= 30 ? 'open' : null;
  return ageDays >= 30 ? 'dormant' : null;   // past deadline or none → monthly reopen check
}

// ─── Stale deadline cleanup ───────────────────────────────────────────────────
// Marks pending opportunities as 'expired' when their deadline has clearly passed.

async function flagExpiredPendingOpps() {
  const pending = await supabaseGet('opportunities',
    `select=id,title,"Next Deadline"&status=eq.pending`);
  if (!pending.length) return;

  const now = new Date();
  let flagged = 0;
  for (const opp of pending) {
    const dl = opp['Next Deadline'];
    if (!dl || dl === 'TBC' || dl === 'Rolling') continue;
    // Parse common formats: "30 June 2026", "June 30, 2026", "2026-06-30"
    const parsed = new Date(dl);
    if (isNaN(parsed.getTime())) continue;
    // Give a 3-day grace period in case deadline is "end of day"
    if (parsed.getTime() + 3 * 24 * 60 * 60 * 1000 < now.getTime()) {
      await supabaseUpdate('opportunities', opp.id, { status: 'expired' });
      console.log(`  🗑  Expired: ${opp.title.slice(0, 60)} (deadline: ${dl})`);
      flagged++;
    }
  }
  if (flagged > 0) console.log(`   Flagged ${flagged} expired opportunity/ies`);
}

// Extract article body + lead image from a fully-rendered Playwright page.
// Prefers @mozilla/readability (injected as a page global via addScriptTag) and falls back
// to a hand-rolled DOM walker. Returns { articleContent, imageUrl }.
async function extractArticle(page) {
  if (READABILITY_JS_PATH) {
    try { await page.addScriptTag({ path: READABILITY_JS_PATH }); } catch { /* fall back to walker */ }
  }
  return page.evaluate(() => {
    // ── Clean text extractor (no markdown links/images) ──
    function toPlainText(el) {
      if (!el) return '';
      let out = '';
      for (const node of el.childNodes) {
        if (node.nodeType === 3) { // Text
          out += node.textContent;
        } else if (node.nodeType === 1) { // Element
          const tag = node.tagName.toLowerCase();
          if (['nav', 'footer', 'aside', 'script', 'style', 'form', 'button', 'noscript', 'svg', 'iframe'].includes(tag)) continue;
          const cls = (node.className || '').toString().toLowerCase();
          if (/\b(nav|menu|sidebar|footer|widget|cookie|banner|social|share|comment|signup|subscribe|ad-|advert)\b/.test(cls)) continue;

          const content = toPlainText(node).trim();
          if (!content && tag !== 'br') continue;

          switch (tag) {
            case 'p': out += `\n\n${content}\n\n`; break;
            case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': out += `\n\n${content}\n\n`; break;
            case 'strong': case 'b': out += `**${content}**`; break;
            case 'em': case 'i': out += `*${content}*`; break;
            case 'a': out += content; break; // Just the link text, no URL
            case 'ul': case 'ol': out += `\n${content}\n`; break;
            case 'li': out += `\n- ${content}`; break;
            case 'blockquote': out += `\n\n> ${content.replace(/\n/g, '\n> ')}\n\n`; break;
            case 'img': break;
            case 'br': out += '\n'; break;
            case 'hr': out += '\n\n---\n\n'; break;
            case 'figure': case 'figcaption': break;
            case 'div': case 'section': case 'article': out += `\n${content}\n`; break;
            default: out += content;
          }
        }
      }
      return out.replace(/\n{3,}/g, '\n\n').trim();
    }

    // ── Quality check: reject content that's mostly short lines (nav menus) ──
    function isQualityContent(text) {
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) return false;
      const longLines = lines.filter(l => l.trim().length > 50);
      return longLines.length >= Math.max(2, lines.length * 0.3);
    }

    let articleContent = null;

    // ── Attempt 1: Mozilla Readability on a document clone (best on hostile/cluttered pages) ──
    try {
      if (typeof Readability === 'function') {
        const parsed = new Readability(document.cloneNode(true)).parse();
        if (parsed && parsed.content) {
          const holder = document.createElement('div');
          holder.innerHTML = parsed.content;
          const text = toPlainText(holder);
          if (isQualityContent(text)) articleContent = text;
        }
      }
    } catch { /* fall through to legacy selectors */ }

    // ── Attempt 2: legacy article-container selectors ──
    if (!articleContent) {
      const selectors = [
        '[class*="article-body"]', '[class*="entry-content"]',
        '[class*="post-content"]', '[class*="article-content"]',
        '.td-post-content', '.post-text', '.article-text',
        'article', 'main article'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = toPlainText(el);
          if (isQualityContent(text)) { articleContent = text; break; }
        }
      }
    }

    if (!articleContent) {
      const paras = Array.from(document.querySelectorAll('p'))
        .filter(p => {
          const text = p.textContent.trim();
          return text.length > 40 && !/cookie|subscribe|newsletter|sign up|terms|privacy|©|all rights/i.test(text);
        });
      if (paras.length >= 2) articleContent = paras.map(p => toPlainText(p)).join('\n\n');
    }

    if (!articleContent) {
      const main = document.querySelector('main') || document.querySelector('#content') || document.querySelector('.content');
      if (main) {
        const text = toPlainText(main);
        if (isQualityContent(text)) articleContent = text;
      }
    }

    // ── Scrape image ──
    let imageUrl = null;
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) imageUrl = ogImage.getAttribute('content');
    if (!imageUrl) {
      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (twImage) imageUrl = twImage.getAttribute('content');
    }
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
    if (imageUrl && !imageUrl.startsWith('http')) {
      try { imageUrl = new URL(imageUrl, window.location.origin).href; } catch { imageUrl = null; }
    }

    return { articleContent, imageUrl };
  });
}

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
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    }
  });

  // ── Phase A: Enrich pending/thin news articles ─────────────────────────
  console.log('\n🎭 Playwright enrichment — pending & thin news articles...');
  const allNews = await supabaseGet('news', 'select=id,title,content,url,image_url,status,enriched_at,enrich_attempts&order=id.desc&limit=200');
  const thinNews = allNews.filter(n => n.url && !n.enriched_at && (
    n.status === 'pending' ||
    (n.content || '').length < 150 ||
    !n.image_url
  ));
  console.log(`   ${thinNews.length} articles need enrichment (unenriched/pending/thin/no image)`);

  let newsEnriched = 0;
  for (const item of thinNews) {
    let page;
    try {
      page = await context.newPage();
      await page.goto(item.url, { waitUntil: 'commit', timeout: 15000 });
      await page.waitForTimeout(5000);
      try { await page.waitForSelector('p', { timeout: 8000 }); } catch { /* ok */ }

      let scraped = await extractArticle(page);

      // Wayback fallback: paywalled domains expose only a preview to anonymous traffic. If
      // extraction is thin on a known paywall domain, retry against the Internet Archive
      // snapshot, which usually captured the full pre-paywall article.
      const _domain = (extractDomain(item.url) || '').replace(/^www\./, '');
      const _thin = !scraped.articleContent || scraped.articleContent.length < 600;
      if (_thin && PAYWALL_DOMAINS.has(_domain)) {
        try {
          const availRes = await nativeFetch(
            `https://archive.org/wayback/available?url=${encodeURIComponent(item.url)}`,
            { signal: AbortSignal.timeout(10000) });
          const avail = availRes.ok ? await availRes.json() : null;
          const snap = avail?.archived_snapshots?.closest;
          if (snap?.available && snap.url) {
            // Archive pages render slower than origin; wait for DOM, not just commit.
            await page.goto(snap.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(6000);
            try { await page.waitForSelector('p', { timeout: 8000 }); } catch { /* ok */ }
            const archived = await extractArticle(page);
            if (archived.articleContent && archived.articleContent.length > (scraped.articleContent || '').length) {
              console.log(`  ↩ [${item.id}] Wayback recovered ${(scraped.articleContent || '').length}→${archived.articleContent.length} chars`);
              scraped = { articleContent: archived.articleContent, imageUrl: scraped.imageUrl || archived.imageUrl };
            }
          }
        } catch { /* wayback miss — keep original extraction */ }
      }

      const updates = {};

      // Update content if we got something better
      if (scraped.articleContent) {
        const cleaned = scraped.articleContent.replace(/\s*(Share|Related|You may also|Read more|Sign up|Subscribe|Newsletter|Cookie|Privacy|©|Follow us)[\s\S]*$/i, '').trim();
        
        // Priority for 'pending' articles: if we got structured markdown, we want it
        const isPending = item.status === 'pending';
        const currentLen = (item.content || '').length;
        const newLen = cleaned.length;
        
        // Always accept if new content is significantly longer, or if pending and looks like quality markdown
        if (newLen > currentLen + 50 || (isPending && newLen > 300 && newLen > currentLen * 0.7)) {
          updates.content = cleaned;
          updates.summary = generateUniqueSummary(cleaned, 300);
        }
      }

      // Update image if we found one and item doesn't have one
      if (scraped.imageUrl && !item.image_url) {
        updates.image_url = scraped.imageUrl;
      }

      if (Object.keys(updates).length > 0) {
        updates.enriched_at = new Date().toISOString();
        await supabaseUpdate('news', item.id, updates);
        const parts = [];
        if (updates.content) parts.push(`content ${(item.content || '').length}→${updates.content.length}`);
        if (updates.image_url) parts.push('+ image');
        console.log(`  ✅ [${item.id}] ${item.title.slice(0, 55)} — ${parts.join(', ')}`);
        newsEnriched++;
      } else {
        // Seal if content is already substantial OR we've exhausted the retry budget. Thin
        // rows (paywalled previews, RSS teasers) are left unsealed for a few attempts so a
        // future extractor improvement can recover them — but capped so they don't churn forever.
        const MAX_ENRICH_ATTEMPTS = 3;
        const existingLen = (item.content || '').length;
        const attempts = (item.enrich_attempts || 0) + 1;
        if (existingLen >= 800) {
          await supabaseUpdate('news', item.id, { enriched_at: new Date().toISOString() });
          console.log(`  · [${item.id}] ${item.title.slice(0, 55)} — no improvement, sealed (${existingLen} chars)`);
        } else if (attempts >= MAX_ENRICH_ATTEMPTS) {
          await supabaseUpdate('news', item.id, { enriched_at: new Date().toISOString(), enrich_attempts: attempts });
          console.log(`  · [${item.id}] ${item.title.slice(0, 55)} — no improvement (${existingLen} chars), sealed after ${attempts} attempts`);
        } else {
          await supabaseUpdate('news', item.id, { enrich_attempts: attempts });
          console.log(`  · [${item.id}] ${item.title.slice(0, 55)} — no improvement (${existingLen} chars), retry ${attempts}/${MAX_ENRICH_ATTEMPTS}`);
        }
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
    `select=id,title,status,"What Is It?","Apply:","For Films or Series?","Next Deadline","Who Can Apply / Eligibility","What Do You Get If Selected?","Cost","What to Submit",category,africa_relevance,enriched_at&order=id.desc&limit=200`);
  const needsEnrich = allOpps.filter(o => !o.enriched_at && (
    (o['For Films or Series?'] === 'To be confirmed') ||
    (o['For Films or Series?'] === 'TBC') ||
    (o['Next Deadline'] === 'To be confirmed') ||
    (o['Next Deadline'] === 'TBC') ||
    (o['Who Can Apply / Eligibility'] === 'To be confirmed') ||
    (o['Who Can Apply / Eligibility'] === 'TBC') ||
    (o['What Do You Get If Selected?'] === 'To be confirmed') ||
    (o['What Do You Get If Selected?'] === 'TBC') ||
    (!o.category)
  ));
  console.log(`   ${needsEnrich.length} opportunities need field enrichment`);

  let oppsEnriched = 0;
  for (const opp of needsEnrich) {
    const url = opp['Apply:'];
    if (!url) continue;
    // Playwright hands PDFs to the browser's built-in viewer, so the DOM has no readable
    // body — enrichment can never succeed. Seal enriched_at so it stops re-queuing forever.
    if (url.toLowerCase().split('?')[0].endsWith('.pdf')) {
      await supabaseUpdate('opportunities', opp.id, { enriched_at: new Date().toISOString() });
      console.log(`  · [${opp.id}] ${opp.title.slice(0, 50)} — PDF, skipped (needs manual/pdf-parse)`);
      continue;
    }
    let page;
    try {
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Extract full page text via Playwright — prefer article body selectors
      const pageText = await page.evaluate(() => {
        const skipTags = new Set(['script', 'style', 'nav', 'footer', 'noscript', 'aside', 'form', 'button', 'svg', 'iframe']);
        function extractText(el) {
          if (!el) return '';
          if (skipTags.has(el.tagName?.toLowerCase())) return '';
          const cls = (el.className || '').toString().toLowerCase();
          if (/\b(nav|menu|sidebar|footer|widget|cookie|banner|social|share|comment|signup|subscribe)\b/.test(cls)) return '';
          if (el.nodeType === 3) return el.textContent;
          return Array.from(el.childNodes).map(extractText).join(' ');
        }
        // Try article-scoped selectors first (higher signal-to-noise)
        const articleSelectors = [
          '[class*="article-body"]', '[class*="entry-content"]', '[class*="post-content"]',
          '[class*="article-content"]', '[class*="page-content"]', '[class*="main-content"]',
          'article', 'main',
        ];
        for (const sel of articleSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            const text = extractText(el).replace(/\s+/g, ' ').trim();
            if (text.length > 400) return text.slice(0, 7000);
          }
        }
        return extractText(document.body).replace(/\s+/g, ' ').trim().slice(0, 7000);
      });

      // Bot/challenge page — skip
      if (/verif(y|ying) you are|cloudflare|just a moment|enable javascript/i.test(pageText.slice(0, 300))) {
        console.log(`  ⚠ [${opp.id}] Bot wall detected — skipping`);
        continue;
      }

      // Always run regex extraction (works without AI)
      const regexFields = regexExtractFields(pageText);

      // If Claude is available, merge (Claude takes priority); otherwise regex-only
      let enriched;
      if (anthropicApiKey) {
        const claudeFields = await claudeEnrichFields(pageText, url);
        enriched = { ...regexFields };
        for (const [key, val] of Object.entries(claudeFields)) {
          if (val !== undefined && val !== '' && val !== 'TBC') enriched[key] = val;
        }
      } else {
        enriched = regexFields;
      }

      const placeholder = v => !v || v === 'To be confirmed' || v === 'TBC';
      const updates = {};
      if (enriched.description && enriched.description.length > (opp['What Is It?'] || '').length)
        updates['What Is It?'] = enriched.description;
      if (enriched['Next Deadline'] && enriched['Next Deadline'] !== 'TBC' && placeholder(opp['Next Deadline']))
        updates['Next Deadline'] = enriched['Next Deadline'];
      if (enriched['Who Can Apply / Eligibility'] && enriched['Who Can Apply / Eligibility'] !== 'TBC' && placeholder(opp['Who Can Apply / Eligibility']))
        updates['Who Can Apply / Eligibility'] = enriched['Who Can Apply / Eligibility'];
      if (enriched['What Do You Get If Selected?'] && enriched['What Do You Get If Selected?'] !== 'TBC' && placeholder(opp['What Do You Get If Selected?']))
        updates['What Do You Get If Selected?'] = enriched['What Do You Get If Selected?'];
      if (enriched['For Films or Series?'] && enriched['For Films or Series?'] !== 'TBC' && placeholder(opp['For Films or Series?']))
        updates['For Films or Series?'] = enriched['For Films or Series?'];
      if (enriched['What to Submit'] && enriched['What to Submit'] !== 'TBC')
        updates['What to Submit'] = enriched['What to Submit'];
      if (enriched['Strongest Submission Tips'])
        updates['Strongest Submission Tips'] = enriched['Strongest Submission Tips'];
      if (enriched['CALENDAR REMINDER:'])
        updates['CALENDAR REMINDER:'] = enriched['CALENDAR REMINDER:'];
      if (enriched.category && !opp.category)
        updates.category = enriched.category;
      if (enriched['Cost'] && enriched['Cost'] !== 'TBC' && placeholder(opp['Cost']))
        updates['Cost'] = enriched['Cost'];
      if (enriched._africaRelevance && !opp.africa_relevance)
        updates.africa_relevance = enriched._africaRelevance;

      // Promote a held 'needs_enrichment' row to 'pending' once enrichment has filled the
      // core boxes (using the merged post-update values), so it can reach the admin queue.
      if (opp.status === 'needs_enrichment') {
        const merged = { ...opp, ...updates };
        const isReal = v => v && v !== 'TBC' && v !== 'To be confirmed';
        const coreNow = [
          merged['Next Deadline'],
          merged['Who Can Apply / Eligibility'],
          merged['What Do You Get If Selected?'],
          merged['What to Submit'],
        ].filter(isReal).length;
        // A real deadline is mandatory for promotion — same rule as insert (Step D.6).
        if (coreNow >= 3 && isReal(merged['Next Deadline'])) {
          updates.status = 'pending';
          console.log(`  ⬆ [${opp.id}] ${opp.title.slice(0, 45)} — promoted needs_enrichment → pending (${coreNow}/4 core)`);
        }
      }

      updates.enriched_at = new Date().toISOString();
      await supabaseUpdate('opportunities', opp.id, updates);
      if (Object.keys(updates).length > 1) {
        console.log(`  ✅ [${opp.id}] ${opp.title.slice(0, 50)} — ${Object.keys(updates).filter(k => k !== 'enriched_at').join(', ')}`);
        oppsEnriched++;
      } else {
        console.log(`  · [${opp.id}] ${opp.title.slice(0, 50)} — no fields extracted, marked done`);
      }
    } catch (err) {
      // silent — many pages will fail; leave enriched_at null so it retries next run
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
  console.log(`   Opps enriched: ${oppsEnriched} / ${needsEnrich.length}`);

  // Phase C: re-verify live opportunities (freshness + cycle roll-forward).
  await reverifyOpportunities(context, DRY_RUN);

  await browser.close();
  console.log('   🎭 Playwright enrichment complete.');
}

// ── Phase C: Re-verify live opportunities on a proximity-based cadence ─────────
// Keeps deadlines/info fresh and rolls cycles forward. Minor changes (deadline shifted)
// auto-apply; major ones (cycle reopened, source dead, no-longer-an-opportunity) set
// review_reason for the admin. Closed opps are re-checked for reopen; passed deadlines hidden.
// `dryRun` previews decisions without writing. `context` is a live Playwright browser context.
async function reverifyOpportunities(context, dryRun = false, forceEmail = false) {
  console.log(`\n🎭 Playwright re-verification — opportunity freshness (Phase C)${dryRun ? ' [DRY RUN]' : ''}...`);
  const VERIFY_CAP = 40;
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();
  const verifyPool = await supabaseGetAll('opportunities',
    'select=id,title,status,"Apply:","Next Deadline",deadline_date,content_hash,last_verified_at,verify_attempts,review_reason');
  const dueList = verifyPool
    .map(o => ({ o, bucket: verifyBucket(o, nowMs) }))
    .filter(x => x.bucket)
    .sort((a, b) => {
      const rank = { closing_soon: 0, open: 1, dormant: 2 };
      if (rank[a.bucket] !== rank[b.bucket]) return rank[a.bucket] - rank[b.bucket];
      return new Date(a.o.last_verified_at || 0) - new Date(b.o.last_verified_at || 0);
    });
  const dueBatch = dueList.slice(0, VERIFY_CAP);
  console.log(`   ${dueList.length} opps due for re-verification; processing ${dueBatch.length} this run.`);

  const writeOpp = async (id, u) => { if (!dryRun) await supabaseUpdate('opportunities', id, u); };
  let reFresh = 0, reChanged = 0, reFlagged = 0;
  const isRealDl = v => v && v !== 'TBC' && v !== 'To be confirmed';
  for (const { o: opp } of dueBatch) {
    const url = opp['Apply:'];
    let page;
    try {
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
      await page.waitForTimeout(2500);
      const pageText = await page.evaluate(() => (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 6000));

      const looksBlocked = !pageText || pageText.length < 120 ||
        /verif(y|ying) you are|cloudflare|just a moment|enable javascript|are you a robot/i.test(pageText.slice(0, 300));
      if (looksBlocked) {
        const attempts = (opp.verify_attempts || 0) + 1;
        const u = { verify_attempts: attempts, last_verified_at: new Date().toISOString() };
        if (attempts >= 3) u.review_reason = `source unreachable (${attempts} attempts)`;
        await writeOpp(opp.id, u);
        console.log(`  ⚠ [${opp.id}] ${opp.title.slice(0, 45)} — unreachable (attempt ${attempts})`);
        continue;
      }

      const hash = createHash('sha1').update(pageText.toLowerCase()).digest('hex');
      // Unchanged page → cheap freshness bump, no Claude call. We loaded the page, so a
      // connectivity flag is now stale and can be cleared; an opportunity-ness flag can't be
      // (we didn't re-run Claude), so it stays.
      if (opp.content_hash && hash === opp.content_hash) {
        const u = { last_verified_at: new Date().toISOString(), verify_attempts: 0 };
        if (opp.review_reason && /(unreachable|source error)/i.test(opp.review_reason)) u.review_reason = null;
        await writeOpp(opp.id, u);
        console.log(`  ✓ [${opp.id}] ${opp.title.slice(0, 45)} — unchanged, freshness bumped`);
        reFresh++;
        continue;
      }

      // Page changed (or first verification) → re-extract the live state with Claude.
      const fields = anthropicApiKey ? await claudeEnrichFields(pageText, url) : {};
      const updates = { content_hash: hash, last_verified_at: new Date().toISOString(), verify_attempts: 0 };
      // Assume the re-check heals any prior flag; the flag/reopen branches below re-set it.
      if (opp.review_reason) updates.review_reason = null;
      const freshText = fields['Next Deadline'];
      const freshDate = parseDeadlineToDate(freshText, new Date());
      const freshFuture = freshDate && freshDate >= todayStr;
      const isClosedState = opp.status === 'closed' || opp.status === 'expired';

      if (fields._isActualOpportunity === false) {
        updates.review_reason = 'page no longer looks like an opportunity';
        reFlagged++;
        console.log(`  ⚑ [${opp.id}] ${opp.title.slice(0, 45)} — flagged: no longer an opportunity`);
      } else if (isClosedState && freshFuture) {
        // Cycle reopened — major change; route to admin for a one-click approve.
        updates['Next Deadline'] = freshText;
        updates.deadline_date = freshDate;
        updates.status = 'pending';
        updates.review_reason = 'cycle reopened — verify before publishing';
        reFlagged++;
        console.log(`  ⟳ [${opp.id}] ${opp.title.slice(0, 45)} — REOPENED → pending (${freshDate})`);
      } else if (!isClosedState && isRealDl(freshText) && freshDate && !freshFuture) {
        // Deadline has passed → close + hide (routine lifecycle, auto, no admin flag).
        updates['Next Deadline'] = freshText;
        updates.deadline_date = freshDate;
        updates.status = 'closed';
        reChanged++;
        console.log(`  🗓 [${opp.id}] ${opp.title.slice(0, 45)} — deadline passed → closed`);
      } else if (!isClosedState && freshFuture && freshDate !== (opp.deadline_date || null)) {
        // Deadline shifted to a new future date → minor auto-update.
        updates['Next Deadline'] = freshText;
        updates.deadline_date = freshDate;
        reChanged++;
        console.log(`  ✎ [${opp.id}] ${opp.title.slice(0, 45)} — deadline updated → ${freshDate}`);
      } else {
        console.log(`  · [${opp.id}] ${opp.title.slice(0, 45)} — content changed, no deadline change`);
      }
      await writeOpp(opp.id, updates);
      reFresh++;
    } catch {
      const attempts = (opp.verify_attempts || 0) + 1;
      const u = { verify_attempts: attempts, last_verified_at: new Date().toISOString() };
      if (attempts >= 3) u.review_reason = `source error (${attempts} attempts)`;
      await writeOpp(opp.id, u).catch(() => {});
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
  console.log(`   Re-verified ${reFresh} (${reChanged} deadline updates, ${reFlagged} flagged). ${Math.max(0, dueList.length - dueBatch.length)} remain for next run.`);

  // Standalone verification email only for manual --verify-only runs (forceEmail). During the
  // daily --enrich run the flagged queue rides along in the scan-summary email instead, so we
  // don't double-send.
  if (!dryRun && forceEmail) await sendVerificationReviewEmail();
}

// Build the "needs a human glance" HTML section — every opportunity currently carrying a
// review_reason (excluding rejected), grouped by the kind of attention needed, each row linking
// to the live source page and the admin dashboard. Returns { count, html }; html is '' if none.
// Shared by the standalone verification email and the daily scan-summary email.
async function buildFlaggedQueueSection() {
  const flagged = await supabaseGetAll('opportunities',
    'select=id,title,status,review_reason,"Apply:","Next Deadline"&review_reason=not.is.null&status=neq.rejected');
  if (!flagged.length) return { count: 0, html: '' };

  const groups = {
    reopened: { title: '⟳ Cycle reopened — approve to publish', items: [] },
    notOpp:   { title: '⚑ No longer looks like an opportunity — keep or reject?', items: [] },
    dead:     { title: '⚠ Source unreachable — check the link still works', items: [] },
    other:    { title: '• Other flags', items: [] },
  };
  for (const o of flagged.sort((a, b) => a.id - b.id)) {
    const r = (o.review_reason || '').toLowerCase();
    const key = r.includes('reopen') ? 'reopened'
      : r.includes('no longer') ? 'notOpp'
      : (r.includes('unreachable') || r.includes('source error')) ? 'dead'
      : 'other';
    groups[key].items.push(o);
  }

  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const row = o => `
    <li style="margin:0 0 14px;">
      <strong>${esc(o.title)}</strong>
      <span style="color:#888;">(#${o.id}, ${esc(o.status)})</span><br/>
      <span style="color:#b45309;font-size:13px;">${esc(o.review_reason)}</span><br/>
      <span style="font-size:13px;">Deadline on file: ${esc(o['Next Deadline'] || '—')}</span><br/>
      ${o['Apply:'] ? `<a href="${esc(o['Apply:'])}" style="color:#0d9488;">🔗 Open source page</a> · ` : ''}
      <a href="${siteUrl}/admin" style="color:#0d9488;">✏️ Edit in admin</a>
    </li>`;

  const sections = Object.values(groups)
    .filter(g => g.items.length)
    .map(g => `<h3 style="color:#0f172a;margin:22px 0 8px;">${g.title} <span style="color:#888;font-weight:normal;">(${g.items.length})</span></h3><ul style="padding-left:18px;margin:0;list-style:none;">${g.items.map(row).join('')}</ul>`)
    .join('');

  const html = `
    <h2 style="color:#0d9488;margin-top:24px;">🔍 Needs a glance — ${flagged.length} flagged</h2>
    <p style="color:#555;font-size:14px;">Auto-verifier flagged these. Click through, decide, and act in admin. Items disappear once resolved (reject, or the source recovers / re-verifies healthy).</p>
    ${sections}`;
  return { count: flagged.length, html };
}

// Standalone verification email (used by manual --verify-only runs). No-ops if nothing flagged.
async function sendVerificationReviewEmail() {
  if (!resendApiKey) return;
  const today = new Date().toISOString().slice(0, 10);
  const { count, html } = await buildFlaggedQueueSection();
  if (!count) {
    console.log('\n📧 No flagged opportunities — review email skipped.');
    return;
  }
  try {
    const res = await nativeFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Film Resource Africa <hello@film-resource-africa.com>',
        to: ['hello@film-resource-africa.com'],
        subject: `FRA Verification: ${count} opportunit${count === 1 ? 'y needs' : 'ies need'} a glance — ${today}`,
        html: `<div style="font-family:sans-serif;max-width:640px;margin:auto;padding:20px;">${html}
          <hr style="border:none;border-top:1px solid #eee;margin:22px 0;" />
          <p style="font-size:13px;color:#888;"><a href="${siteUrl}/admin" style="color:#0d9488;font-weight:bold;">Open Admin Dashboard</a></p></div>`,
      }),
    });
    if (res.ok) console.log(`\n📧 Verification review email sent (${count} flagged).`);
    else console.log(`\n  ✗ Review email failed: ${res.status}`);
  } catch (err) {
    console.log(`\n  ✗ Review email error: ${err.message}`);
  }
}

// Standalone entry for `--verify-only`: run just Phase C with its own browser. Useful for
// testing (with --dry-run) and for running verification off its own schedule if ever needed.
async function runVerifyOnly() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.log('  ⚠ Playwright not installed — cannot run verification.');
    return;
  }
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  try {
    await reverifyOpportunities(context, DRY_RUN, true);  // manual run → always email the queue
  } finally {
    await browser.close();
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  // Standalone maintenance mode: backfill deadline_date and exit (no scanning).
  if (BACKFILL_DEADLINES) {
    console.log(`\n🎬 FRA Scanner — deadline_date backfill — ${today}${DRY_RUN ? ' (DRY RUN)' : ''}`);
    await backfillDeadlineDates();
    console.log('\n✅ Done.');
    return;
  }

  // Standalone maintenance mode: run only the Phase-C re-verification pass and exit.
  if (VERIFY_ONLY) {
    console.log(`\n🎬 FRA Scanner — re-verification only — ${today}${DRY_RUN ? ' (DRY RUN)' : ''}`);
    await runVerifyOnly();
    console.log('\n✅ Done.');
    return;
  }

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

  // 3. Scan Gmail — reads full email bodies, extracts typed leads via Claude
  console.log('\n📧 Scanning Gmail...');
  try {
    const emailItems = await scanGmail();
    let emailDups = 0;
    for (const item of emailItems) {
      if (isDuplicate(item.title, oppTitles) || isDuplicate(item.title, newsTitles)) {
        emailDups++;
        continue;
      }
      if (item.type === 'news') {
        results.news.push(item);
      } else if (item.type === 'opportunity') {
        results.opportunities.push(item);
      } else {
        // email_signal fallback — surface in admin summary only
        results.emails.push(item);
      }
    }
    if (emailDups > 0) console.log(`  ↳ Filtered ${emailDups} duplicate email leads`);
    const emailNewsCount = emailItems.filter(i => i.type === 'news').length;
    const emailOppCount  = emailItems.filter(i => i.type === 'opportunity').length;
    if (emailNewsCount + emailOppCount > 0)
      console.log(`  ↳ Routed ${emailNewsCount} news + ${emailOppCount} opp leads into main pipeline`);
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
        if (!hasOpportunitySignal(item.title, item.snippet)) continue;
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

  // 7. Validate + insert news items
  let newsInserted = 0, newsSkipped404 = 0;
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
      // Pre-insert QC: drop non-article hub pages and teaser-only RSS items that can never
      // enrich into a real body (e.g. Deadline /feature/ landing pages, "[…]" RSS stubs).
      const isFeatureHub = /\/feature\//i.test(item.link || '');
      const rssBody = (item.description || '').trim();
      const isRssTeaser = /\[…\]$|…$/.test(rssBody) && rssBody.length < 600;
      if (isFeatureHub || isRssTeaser) {
        console.log(`  SKIP (${isFeatureHub ? 'hub page' : 'RSS teaser'}): ${item.title.slice(0, 55)}`);
        continue;
      }
      // Pre-insert QC: validate URL is reachable
      if (item.link) {
        const urlOk = await validateUrl(item.link);
        if (!urlOk) {
          console.log(`  ✗ SKIP (dead URL): ${decodeEntities(item.title).slice(0, 55)}`);
          newsSkipped404++;
          continue;
        }
      }
      // Auto-detect trailers/teasers for separate "Now Screening" section
      const titleLower = item.title.toLowerCase();
      const isTrailer = /\btrailer\b|\bteaser\b|\bfirst look\b|\bexclusive clip\b|\bsneak peek\b/.test(titleLower);
      // Auto-detect country from title + description
      const combinedText = `${item.title} ${item.description || ''}`;
      const detectedCountry = detectCountry(combinedText);
      const newsItem = {
        title: decodeEntities(item.title),
        summary: generateUniqueSummary(decodeEntities((item.description || '')).replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim(), 300),
        content: decodeEntities((item.description || '')).replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim(),
        category: isTrailer ? 'trailer' : 'industry_news',
        url: item.link || null,
        slug,
        image_url: item.imageUrl || null,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        status: 'pending',
      };
      if (DRY_RUN) {
        console.log(`  [DRY] Would insert news: ${item.title.slice(0, 55)}${detectedCountry ? ` (🌍 ${detectedCountry})` : ''}`);
      } else {
        try {
          await supabaseInsert('news', newsItem);
          console.log(`  ✓ Inserted news: ${item.title.slice(0, 55)}${detectedCountry ? ` (🌍 ${detectedCountry})` : ''}`);
          newsInserted++;
        } catch (err) {
          console.log(`  ✗ Failed: ${item.title.slice(0, 55)} — ${err.message}`);
        }
      }
    }
    if (newsSkipped404 > 0) console.log(`   ⚠ Skipped ${newsSkipped404} dead URLs`);
  }

  // 8. QC + enrich + insert opportunity leads
  let oppsInserted = 0, oppsSkipped404 = 0;
  if (results.opportunities.length > 0 && !NEWS_ONLY) {
    console.log(`\n🎯 Found ${results.opportunities.length} potential opportunity leads`);
    console.log('   Running pre-insert QC (URL validation + page enrichment)...');
    for (const item of results.opportunities.slice(0, 15)) {
      // Step A: Validate URL is reachable
      const urlOk = await validateUrl(item.url);
      if (!urlOk) {
        console.log(`  ✗ SKIP (dead URL): ${item.title.slice(0, 55)} — ${item.url}`);
        oppsSkipped404++;
        continue;
      }

      // Step A.1: Platform domain gate — LinkedIn, YouTube etc. are never application pages.
      // Their bot protection also means enrichOpportunityFromPage returns {} every time,
      // bypassing the Claude _isActualOpportunity gate entirely.
      const urlDomain = extractDomain(item.url);
      if (urlDomain && (PLATFORM_DOMAINS.has(urlDomain) || PLATFORM_DOMAINS.has(urlDomain.replace(/^[^.]+\./, '')))) {
        console.log(`  ✗ SKIP (platform domain — not an application page): ${item.title.slice(0, 55)}`);
        continue;
      }

      // Step A.2: News article URL gate for web-search items.
      // Date-path URLs (/2026/04/) and /blog/ /news/ paths are almost always news articles.
      // Org-page links are already targeted so exempt from this check.
      if (item.source === 'Web Search' && isNewsArticleUrl(item.url)) {
        console.log(`  ✗ SKIP (news article URL from web search): ${item.title.slice(0, 55)}`);
        continue;
      }

      // Step B: Scrape page for real field data
      const scraped = await enrichOpportunityFromPage(item.url);
      // Count only fields actually filled with real data — not keys present. Claude always
      // returns all keys (many as 'TBC'), so counting keys overstated how complete a row was.
      const enrichedFields = Object.entries(scraped)
        .filter(([k, v]) => !k.startsWith('_') && v && v !== 'TBC')
        .length;

      // Step B.1: Web search items with no enrichment data at all (bot-blocked, timeout, etc.)
      // are too risky to auto-insert. Org-page items are trusted sources so pass through.
      // Now that regexExtractFields runs, enrichedFields > 0 means regex found real data.
      if (item.source === 'Web Search' && enrichedFields === 0 && scraped._isActualOpportunity === undefined) {
        console.log(`  ✗ SKIP (web search item — no fields extracted from page): ${item.title.slice(0, 55)}`);
        continue;
      }

      // Step C: Fetch logo and OG image
      const logo = item.url ? await fetchLogoForUrl(item.url) : null;
      const ogImage = item.url ? await fetchOgImageForUrl(item.url) : null;

      // Step D: Auto-detect country from title + snippet + page content
      const combinedText = `${item.title} ${item.snippet || ''} ${scraped.description || ''}`;
      const detectedCountry = scraped._detectedCountry || detectCountry(combinedText);
      const geoScope = scraped._geoScope || detectGeoScope(combinedText);

      // Step D.5: Quality + Africa relevance gate
      if (scraped._isActualOpportunity === false) {
        console.log(`  ✗ SKIP (not an opportunity — blog/list/directory): ${item.title.slice(0, 55)}`);
        continue;
      }
      if (!isAfricaRelevant(combinedText, item.source)) {
        console.log(`  ✗ SKIP (not Africa-relevant): ${item.title.slice(0, 60)}`);
        continue;
      }

      // Step D.6: Schema-completeness gate. An opportunity is only worth surfacing if the
      // core "boxes" are actually filled. A real deadline is MANDATORY — a "TBC" deadline is
      // useless to a filmmaker deciding whether to apply, so it never reaches the pending
      // queue. Of the remaining boxes we require ≥3 of 4 to be real. Anything short is held
      // as 'needs_enrichment' (invisible publicly) for Phase-B re-enrichment. "Rolling" counts
      // as a real deadline.
      const isReal = v => v && v !== 'TBC' && v !== 'To be confirmed';
      const deadlineVal = scraped['Next Deadline'] || item._emailDeadline;
      const hasRealDeadline = isReal(deadlineVal);
      const coreValues = [
        deadlineVal,
        scraped['Who Can Apply / Eligibility'] || item._emailEligibility,
        scraped['What Do You Get If Selected?'] || item._emailBenefits,
        scraped['What to Submit'],
      ];
      const coreFilled = coreValues.filter(isReal).length;
      const oppStatus = (hasRealDeadline && coreFilled >= 3) ? 'pending' : 'needs_enrichment';

      // Step E: Build the record — page scrape takes priority, email extraction fills gaps
      const oppItem = {
        title: decodeEntities(item.title),
        'What Is It?': scraped.description || decodeEntities(item.snippet || item._emailBenefits || '') || 'Discovered via automated scan — needs review.',
        'For Films or Series?': scraped['For Films or Series?'] || 'TBC',
        'What Do You Get If Selected?': scraped['What Do You Get If Selected?'] || item._emailBenefits || 'TBC',
        'Cost': scraped['Cost'] || 'TBC',
        'Next Deadline': scraped['Next Deadline'] || item._emailDeadline || 'TBC',
        'Apply:': item.url || '',
        'Who Can Apply / Eligibility': scraped['Who Can Apply / Eligibility'] || item._emailEligibility || 'TBC',
        'What to Submit': scraped['What to Submit'] || 'TBC',
        'Strongest Submission Tips': scraped['Strongest Submission Tips'] || '',
        'CALENDAR REMINDER:': scraped['CALENDAR REMINDER:'] || '',
        status: oppStatus,
        votes: 0,
        application_status: 'open',
        ...(scraped.category || item._emailCategory ? { category: scraped.category || item._emailCategory } : {}),
        ...(scraped._africaRelevance ? { africa_relevance: scraped._africaRelevance } : {}),
        ...(logo ? { logo } : {}),
        ...(ogImage ? { og_image_url: ogImage } : {}),
      };
      const extras = [
        `${coreFilled}/4 core`,
        enrichedFields > 0 && `${enrichedFields} fields`,
        oppStatus === 'needs_enrichment' && '⏳ needs_enrichment',
        detectedCountry && `🌍 ${detectedCountry}`,
        logo && 'logo',
        ogImage && 'og',
      ].filter(Boolean).join(', ');

      if (DRY_RUN) {
        console.log(`  [DRY] Would insert opp: ${decodeEntities(item.title).slice(0, 55)}${extras ? ` (${extras})` : ''}`);
      } else {
        try {
          await supabaseInsert('opportunities', oppItem);
          console.log(`  ✓ Inserted: ${item.title.slice(0, 55)}${extras ? ` (${extras})` : ''}`);
          oppsInserted++;
        } catch (err) {
          console.log(`  ✗ Failed: ${item.title.slice(0, 55)} — ${err.message}`);
        }
      }
    }
    if (oppsSkipped404 > 0) console.log(`   ⚠ Skipped ${oppsSkipped404} dead URLs`);
  }

  // 9. Playwright enrichment + stale deadline cleanup
  if (!DRY_RUN) {
    console.log('\n🗑  Checking for expired pending opportunities...');
    await flagExpiredPendingOpps();
    // Always enrich when new news was inserted (content + images for pending articles)
    // Full opportunity enrichment only with --enrich flag
    if (newsInserted > 0 || oppsInserted > 0 || ENRICH) {
      await enrichWithPlaywright();
    }
  }

  // 10. Summary
  console.log('\n' + '─'.repeat(60));
  console.log(`📊 SCAN SUMMARY — ${today}`);
  console.log(`   News found (RSS + Gmail): ${results.news.length}`);
  console.log(`   Opps found (web + Gmail): ${results.opportunities.length}`);
  console.log(`   Email signals (raw):      ${results.emails.length}`);
  console.log(`   News inserted:            ${newsInserted}${newsSkipped404 ? ` (${newsSkipped404} dead URLs skipped)` : ''}`);
  console.log(`   Opps inserted:            ${oppsInserted}${oppsSkipped404 ? ` (${oppsSkipped404} dead URLs skipped)` : ''}`);
  console.log('─'.repeat(60));

  // 11. Send admin summary email — covers new items AND the outstanding verification queue,
  // so the flagged opportunities ride along even on runs that found nothing new.
  const totalNew = newsInserted + oppsInserted;
  const flaggedSection = (!DRY_RUN && resendApiKey) ? await buildFlaggedQueueSection() : { count: 0, html: '' };
  if ((totalNew > 0 || flaggedSection.count > 0) && !DRY_RUN && resendApiKey) {
    console.log('\n📧 Sending admin summary...');
    const emailLines = [];
    if (newsInserted > 0) emailLines.push(`<p><strong>${newsInserted} new news article${newsInserted > 1 ? 's' : ''}</strong> added as PENDING — <a href="${siteUrl}/admin">review & publish in admin</a>.</p>`);
    if (oppsInserted > 0) emailLines.push(`<p><strong>${oppsInserted} new opportunity lead${oppsInserted > 1 ? 's' : ''}</strong> added as PENDING — <a href="${siteUrl}/admin">review in admin</a>.</p>`);
    if (totalNew === 0) emailLines.push('<p style="color:#555;">No new items this run.</p>');

    if (results.emails.length > 0) {
      emailLines.push('<p><strong>Email signals (no body extracted — check manually):</strong></p><ul>');
      for (const e of results.emails.slice(0, 10)) {
        emailLines.push(`<li>${e.source}: ${e.title}</li>`);
      }
      emailLines.push('</ul>');
    }

    const subjectBits = [];
    if (totalNew > 0) subjectBits.push(`${totalNew} new`);
    if (flaggedSection.count > 0) subjectBits.push(`${flaggedSection.count} to verify`);

    try {
      const emailRes = await nativeFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Film Resource Africa <hello@film-resource-africa.com>',
          to: ['hello@film-resource-africa.com'],
          subject: `FRA Scanner: ${subjectBits.join(', ')} — ${today}`,
          html: `
            <div style="font-family:sans-serif;max-width:640px;margin:auto;padding:20px;">
              <h2 style="color:#0d9488;">🎬 Daily Opportunity Scan — ${today}</h2>
              ${emailLines.join('\n')}
              ${flaggedSection.html ? `<hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />${flaggedSection.html}` : ''}
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
              <p style="font-size:13px;color:#888;">
                <a href="${siteUrl}/admin" style="color:#0d9488;font-weight:bold;">Open Admin Dashboard</a>
              </p>
            </div>
          `,
        }),
      });
      if (emailRes.ok) console.log(`  ✓ Admin summary sent${flaggedSection.count ? ` (incl. ${flaggedSection.count} flagged)` : ''}`);
      else console.log(`  ✗ Email failed: ${emailRes.status}`);
    } catch (err) {
      console.log(`  ✗ Email error: ${err.message}`);
    }
  } else if (totalNew === 0) {
    console.log('\n   No new items and nothing flagged. All quiet on the African front. 🌍');
  }

  console.log('\n✅ Scan complete.\n');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
