/**
 * Insert opportunities and news from FRA Daily Digest — 16 Apr 2026
 *
 * Duplicates already in DB (skipped):
 *   - NFVF Female Filmmaker Project (ID 286, approved)
 *   - Hot Docs–Blue Ice Docs Fund (ID 338, approved)
 *   - NollywoodWeek 2026 (ID 373, pending — similar coverage)
 *   - British Council Film Lab Africa (ID 104, approved)
 *
 * Image notes:
 *   - NFVF Travel Grant: logo only (no og:image on page) — update in /admin
 *   - VII Foundation: og:image is a person headshot — update in /admin
 *   - Netflix Slate: small 225×225 image — update in /admin
 *
 * Usage:
 *   node insert_digest_2026-04-16.mjs           # preview only (dry run)
 *   node insert_digest_2026-04-16.mjs --live    # insert to Supabase
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
if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env vars'); process.exit(1); }
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set — opportunities inserts will fail RLS. Add it to .env.local.');
}

const LIVE = process.argv.includes('--live');
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function insert(table, item) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`INSERT failed [${table}]: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getTitles(table) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=title`, { headers });
  const data = await res.json();
  return new Set(data.map(r => r.title.toLowerCase().trim()));
}

// ─── OPPORTUNITIES ────────────────────────────────────────────────────────────

const opportunities = [
  {
    title: 'NFVF Festival & Market Travel Grant — May 2026',
    'What Is It?': 'Financial support for South African filmmakers and industry practitioners to attend film festivals and markets taking place 8–31 May 2026. Funded by the National Film and Video Foundation (NFVF).',
    'For Films or Series?': 'All — for industry practitioners attending markets/festivals',
    'What Do You Get If Selected?': 'Travel grant funding to attend eligible film festivals and markets during May 2026',
    'Cost': 'Free',
    'Next Deadline': 'Check NFVF website — applications currently open',
    'Apply:': 'https://www.nfvf.co.za/call-for-nfvf-funding-applications-to-attend-film-festivals-and-markets-taking-place-from-08-31-may-2026/',
    'Who Can Apply / Eligibility': 'South African citizens and permanent residents working in film/TV industry',
    'What to Submit': 'Check NFVF website for full application requirements',
    'Strongest Submission Tips': 'Clearly demonstrate how attending the specific festival or market will benefit your project and career. Apply early — funds are limited.',
    'CALENDAR REMINDER:': 'Applications open now for May 2026 festivals/markets — check NFVF site for closing date',
    category: 'Funds & Grants',
    deadline_date: null,
    application_status: 'open',
    geo_scope: 'national',
    og_image_url: 'https://www.nfvf.co.za/wp-content/uploads/2021/09/NFVF-NEW-logo-with-text.png', // logo only — replace in /admin
    status: 'pending',
    votes: 0,
  },
  {
    title: 'Red Sea Fund — Development, Production & Post-Production Funding',
    'What Is It?': 'The Red Sea Fund supports development, production, and post-production across four annual cycles. Has backed 280+ films since 2021. Strong focus on African and Middle Eastern filmmakers, but open globally.',
    'For Films or Series?': 'Feature films (development, production, post-production)',
    'What Do You Get If Selected?': 'Funding across development, production, and/or post-production phases',
    'Cost': 'Free',
    'Next Deadline': 'Rolling — four cycles per year. Check redseafilmfest.com for current cycle dates.',
    'Apply:': 'https://redseafilmfest.com/en/red-sea-fund/',
    'Who Can Apply / Eligibility': 'Open globally, with strong focus on African and Middle Eastern filmmakers',
    'What to Submit': 'Check Red Sea Fund website for current cycle application requirements',
    'Strongest Submission Tips': 'The fund prioritises authentic stories from the Arab world and Africa. Projects with strong development attachments and clear distribution strategies have done well.',
    'CALENDAR REMINDER:': 'Rolling — four cycles per year. Monitor redseafilmfest.com for opening dates.',
    category: 'Funds & Grants',
    deadline_date: null,
    application_status: 'open',
    geo_scope: 'pan_african',
    og_image_url: 'https://redseafilmfest.com/wp-content/uploads/2024/10/RedSeaFund_En.jpg',
    status: 'pending',
    votes: 0,
  },
  {
    title: 'VII Foundation Film Lab — Fully-Funded Filmmaking Fellowships',
    'What Is It?': 'Fully-funded fellowships teaching filmmaking, media literacy, and technology to underserved students across Africa, Asia, and Latin America. Fellows spend 2–6 months embedded in partner communities.',
    'For Films or Series?': 'Filmmaking education / short-form',
    'What Do You Get If Selected?': 'Fully-funded fellowship including filmmaking training, media literacy education, and technology instruction. 2–6 month community-embedded residency.',
    'Cost': 'Free',
    'Next Deadline': 'Rolling applications — check theviifoundation.org for current openings',
    'Apply:': 'https://theviifoundation.org/educate/programs/film-lab/',
    'Who Can Apply / Eligibility': 'Emerging filmmakers from underserved communities across Africa, Asia, and Latin America',
    'What to Submit': 'Check VII Foundation Film Lab website for current application requirements',
    'Strongest Submission Tips': 'Emphasise your connection to and embeddedness in an underserved community. The fellowship is explicitly about impact in local contexts.',
    'CALENDAR REMINDER:': 'Rolling — check site regularly for new cohort openings',
    category: 'Labs & Fellowships',
    deadline_date: null,
    application_status: 'open',
    geo_scope: 'pan_african',
    og_image_url: 'https://theviifoundation.org/app/uploads/2026/04/moses-bwayo-headshot-768x818.jpg', // headshot — replace in /admin
    status: 'pending',
    votes: 0,
  },
];

// ─── NEWS ─────────────────────────────────────────────────────────────────────

const news = [
  {
    title: "Togo's International Film Festival (FIFTO) 2026 Opens in Lomé — 33 Films Screening",
    summary: "The 9th FIFTO opened 14 April 2026 in Lomé, running through 18 April. 33 films screen across documentary and fiction categories, with the theme 'Telling our realities: African cinema in local languages and everyday stories.' Films from Burkina Faso, Côte d'Ivoire, Cameroon, Gabon, Senegal, France, and Togo.",
    content: "The 9th edition of the Togo International Film Festival (FIFTO) opened on 14 April 2026 in Lomé, running through 18 April. The festival is screening 33 films including documentaries and fiction features, under the theme: 'Telling our realities: African cinema in local languages and everyday stories.'\n\nFilms from Burkina Faso, Côte d'Ivoire, Cameroon, Gabon, Senegal, France, and Togo are featured in the programme. FIFTO has grown into one of West Africa's key festival platforms, championing Francophone African cinema and stories told in local languages.",
    category: 'festivals',
    url: 'https://www.togofirst.com/en/culture/1504-18727-togo-s-international-film-festival-opens-in-lome-showcasing-33-films',
    published_at: '2026-04-14T00:00:00+00:00',
    slug: 'fifto-2026-togo-international-film-festival-lome-33-films',
    image_url: 'https://www.togofirst.com/media/k2/items/cache/f0858fb16cac199b879119822161efb8_L.jpg',
    geo_scope: 'pan_african',
    status: 'pending',
  },
  {
    title: "Netflix's 2026 African Slate: South Africa and Nigeria Remain Priorities as Originals Roll Out",
    summary: "South Africa and Nigeria remain Netflix's African production priorities in 2026. Aníkúlápó series returns, multiple SA and Nigerian originals are in production, and South Africa is now described as one of Netflix's global production hubs.",
    content: "Netflix's 2026 African slate continues to centre South Africa and Nigeria as its primary production markets on the continent. South Africa has been described internally as one of Netflix's global production hubs, with multiple originals in various stages of production.\n\nAmong the highlights: the acclaimed Aníkúlápó series is returning for a new season, cementing its place as one of Netflix Africa's flagship originals. Several additional SA and Nigerian originals are in production or pre-production for 2026 release.\n\nThe update comes amid a broader industry conversation about the sustainability of streaming investment in African content, with Amazon having pulled back from the region and Canal+/MultiChoice filling some of the gap alongside local platforms.",
    category: 'industry_news',
    url: 'https://culturecustodian.com/netflixs-african-slate-for-2026-the-films-and-shows-we-know-so-far/',
    published_at: '2026-04-16T00:00:00+00:00',
    slug: 'netflix-2026-african-slate-south-africa-nigeria-originals',
    image_url: 'https://i0.wp.com/culturecustodian.com/wp-content/uploads/2026/01/images.png?fit=225%2C225&ssl=1', // small image — replace in /admin
    geo_scope: 'pan_african',
    status: 'pending',
  },
  {
    title: "South Africa's Film Rebate Crisis: DTIC Delays Leave Filmmakers Millions Out of Pocket",
    summary: "South Africa's 25% cash rebate system is crippled by unexplained delays at the DTIC, with millions owed to local production companies. Bloomberg reports the state is effectively withholding support from an industry already under pressure.",
    content: "South Africa's film industry is facing a serious funding crisis, with the Department of Trade, Industry and Competition (DTIC) failing to pay out millions in owed 25% cash rebates to local production companies. The delays are unexplained and ongoing, threatening the viability of productions that budgeted based on expected rebate payments.\n\nBloomberg reported in February 2026 that the South African state is \"withholding support\" from its film industry, while Variety has covered the growing alarm within the sector. South Africa's rebate programme has historically been one of the country's key tools for attracting international productions and supporting local filmmakers.\n\nThe crisis has prompted calls for greater transparency from the DTIC and advocacy from industry bodies. For African filmmakers and producers relying on co-production or SA-based financing, understanding this rebate situation is critical context for any South African partnerships in 2026.",
    category: 'industry_news',
    url: 'https://variety.com/2025/film/global/south-africa-alarm-rebate-crisis-1236337333/',
    published_at: '2026-02-17T00:00:00+00:00',
    slug: 'south-africa-film-rebate-crisis-dtic-delays-2026',
    image_url: 'https://variety.com/wp-content/uploads/2025/03/MixCollage-14-Mar-2025-07-37-AM-1097.jpg?w=1000&h=563&crop=1',
    geo_scope: 'pan_african',
    status: 'pending',
  },
  {
    title: "African Filmmaking Talent Is Thriving Globally — But the Market Is Stumbling",
    summary: "A Variety analysis finds African filmmaking talent is gaining global recognition at an unprecedented rate, but the business models and market infrastructure supporting African content are resetting. Post-Amazon, post-Netflix pullback, questions remain about who builds a sustainable ecosystem.",
    content: "A major Variety analysis published in early 2026 captures a defining tension in African cinema: the talent is globally recognised and celebrated — but the market infrastructure to support it commercially is under severe strain.\n\nFollowing Amazon's pullback from African original content and Netflix's recalibration of its African slate, the piece examines whether Canal+/MultiChoice and local streaming platforms can build a sustainable ecosystem for African film and series.\n\nThe article highlights pan-African co-productions as a growing strategy for creators seeking regional reach, and points to the Cape Town-based Both Worlds partnering with US outfit Freeli Films to co-produce a slate of vertical series and movies for distribution via mobile operators across Africa as one such model.\n\nFor African industry professionals, the piece is essential reading — not as a pessimistic verdict, but as a clear-eyed map of where the gaps and opportunities lie in 2026.",
    category: 'industry_news',
    url: 'https://variety.com/2026/film/markets-festivals/african-filmmaking-talent-market-stumbles-1236658271/',
    published_at: '2026-04-16T00:00:00+00:00',
    slug: 'african-filmmaking-talent-market-stumbles-variety-2026',
    image_url: 'https://variety.com/wp-content/uploads/2026/02/MixCollage-10-Feb-2026-06-02-PM-3708.jpg?w=1000&h=563&crop=1',
    geo_scope: 'pan_african',
    status: 'pending',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== FRA Digest Insert — 16 Apr 2026 ===');
  console.log(`Mode: ${LIVE ? '🔴 LIVE' : '🟡 DRY RUN (pass --live to insert)'}\n`);

  const existingOpps = await getTitles('opportunities');
  const existingNews = await getTitles('news');

  console.log(`DB: ${existingOpps.size} opportunities, ${existingNews.size} news items\n`);

  // ── Opportunities ──
  console.log('── OPPORTUNITIES ──');
  let oppInserted = 0, oppSkipped = 0;

  for (const opp of opportunities) {
    const key = opp.title.toLowerCase().trim();
    if (existingOpps.has(key)) {
      console.log(`  ⏭  SKIP (duplicate): ${opp.title}`);
      oppSkipped++;
      continue;
    }
    if (LIVE) {
      try {
        await insert('opportunities', opp);
        console.log(`  ✅ Inserted: ${opp.title}`);
        oppInserted++;
      } catch (err) {
        console.log(`  ❌ Failed: ${opp.title} — ${err.message}`);
      }
    } else {
      console.log(`  [DRY] Would insert: ${opp.title}`);
      console.log(`        Category: ${opp.category} | Geo: ${opp.geo_scope} | Deadline: ${opp.deadline_date || 'Rolling'}`);
      console.log(`        Image: ${opp.og_image_url}`);
    }
  }

  // ── News ──
  console.log('\n── NEWS ──');
  let newsInserted = 0, newsSkipped = 0;

  for (const article of news) {
    const key = article.title.toLowerCase().trim();
    if (existingNews.has(key)) {
      console.log(`  ⏭  SKIP (duplicate): ${article.title}`);
      newsSkipped++;
      continue;
    }
    if (LIVE) {
      try {
        await insert('news', article);
        console.log(`  ✅ Inserted: ${article.title}`);
        newsInserted++;
      } catch (err) {
        console.log(`  ❌ Failed: ${article.title} — ${err.message}`);
      }
    } else {
      console.log(`  [DRY] Would insert: ${article.title}`);
      console.log(`        Category: ${article.category} | Geo: ${article.geo_scope}`);
      console.log(`        Image: ${article.image_url}`);
    }
  }

  // ── Summary ──
  console.log('\n=== Summary ===');
  if (LIVE) {
    console.log(`  Opportunities inserted: ${oppInserted} | skipped: ${oppSkipped}`);
    console.log(`  News inserted:          ${newsInserted} | skipped: ${newsSkipped}`);
    if (oppInserted + newsInserted > 0) {
      console.log('\n💡 Review and approve pending items at /admin');
      console.log('⚠️  Image flags to fix in /admin:');
      console.log('   - NFVF Travel Grant: replace logo with a proper image');
      console.log('   - VII Foundation Film Lab: replace headshot with program image');
      console.log('   - Netflix 2026 Slate: replace 225×225 thumbnail with full image');
    }
  } else {
    console.log(`  Would insert: ${opportunities.length} opportunities + ${news.length} news items`);
    console.log(`  Run with --live to execute`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
