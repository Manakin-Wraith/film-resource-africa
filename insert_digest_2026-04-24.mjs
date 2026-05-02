/**
 * Insert opportunities and news from FRA Daily Digest — 24 Apr 2026
 *
 * Duplicates confirmed and skipped:
 *   - Maisha Film Lab (DB ID 113, approved — confirmed via DB query 24 Apr)
 *   - Netflix 2026 African slate (published Apr 16 digest)
 *   - SA Bloomberg rebate crisis (published Apr 16 digest)
 *   - Doha Film Institute (in DB, Spring 2026 cycle closed)
 *   - FESPACO (in DB — no 2026 edition)
 *   - Film Lab Africa Phase 2 / British Council (ID 104, approved)
 *
 * Closed cycles — tracking only, not inserted:
 *   - NFVF Micro-Budget Film Projects 2026 (closed 2 Feb 2026)
 *   - NFVF International Postgraduate Bursary 2026 (closed 9 Mar 2026)
 *
 * Broken links fixed:
 *   - Clarissa (Esiri): LinkedIn profile → Deadline Directors' Fortnight announcement
 *   - Nolly Africa HD: wrong culturecustodian.com URL → Advanced Television launch article
 *   - Nigeria-Germany Film Week: LinkedIn profile → Vanguard / German Consulate Lagos coverage
 *     NOTE: No standalone "Nigeria-Germany Film Week Berlin June 2026" press release found.
 *     Used German Consulate / Goethe-Institut roundtable article as closest available source.
 *
 * REMOVED — stale articles purged from DB 24 Apr 2026:
 *   - Amazon/Inkblot+Anthill deals: source article from Jan 17, 2022 (DB ID 410, deleted)
 *   - Kenya film rebate / Akoroko: source article from Aug 13, 2024 (DB ID 415, deleted)
 *   - Nigeria tax framework / Africa.com: source article from Mar 8, 2024 (DB ID 416, deleted)
 *
 * Image notes:
 *   - Clarissa: Directors' Fortnight 2026 poster (not Clarissa-specific) — replace with film still/poster when available
 *   - East Africa Film Fest + ADCF: festhome logo thumbnails (FilmFreeway blocked) — replace with festival banners if found
 *
 * Usage:
 *   node insert_digest_2026-04-24.mjs             # preview only (dry run, verifies pub dates)
 *   node insert_digest_2026-04-24.mjs --live      # insert to Supabase (blocks stale articles)
 *   node insert_digest_2026-04-24.mjs --live --force  # insert all, bypassing age gate
 */

import { loadEnv, getTitles, insertRecord, checkAndLogDate, STALE_THRESHOLD_DAYS } from './digest_utils.mjs';

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env vars'); process.exit(1); }
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set — opportunities inserts will fail RLS. Add it to .env.local.');
}

const LIVE = process.argv.includes('--live');
const FORCE = process.argv.includes('--force');
const db = { supabaseUrl, headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } };

// ─── OPPORTUNITIES ────────────────────────────────────────────────────────────

const opportunities = [
  {
    title: 'UNESCO International Fund for Cultural Diversity (IFCD) — 17th Call 2026',
    'What Is It?': '17th call for funding requests to the UNESCO International Fund for Cultural Diversity. Supports projects that foster the emergence of dynamic cultural and creative sectors in developing countries — film, audiovisual and creative-economy projects are core eligible areas. Since 2010 the fund has invested USD 13.6M across 175 projects in 77 developing countries.',
    'For Films or Series?': 'Film, audiovisual and creative-economy projects in developing countries',
    'What Do You Get If Selected?': 'Grants of up to USD 100,000 for cultural and creative sector projects in developing countries',
    'Cost': 'Free',
    'Next Deadline': '6 May 2026 — noon Paris time. Applications opened 23 March 2026.',
    'Apply:': 'https://www.unesco.org/creativity/en/ifcd/apply',
    'Who Can Apply / Eligibility': 'Organisations based in developing countries that are parties to the 2005 UNESCO Convention on the Protection and Promotion of the Diversity of Cultural Expressions. Register on the IFCD online platform before applying.',
    'What to Submit': 'Online application via the IFCD platform at unesco.org/creativity/en/ifcd/apply. Register first, then complete the application form on the platform.',
    'Strongest Submission Tips': 'Projects must align with the 2005 UNESCO Convention objectives. Strong organisational capacity and track record help. Study previously funded projects for benchmark — 175 projects funded across 77 countries since 2010. Film and audiovisual projects are core eligible areas.',
    'CALENDAR REMINDER:': 'URGENT: Closes 6 May 2026 (noon Paris time). Only 12 days from 24 April. Apply immediately.',
    category: 'Funds & Grants',
    deadline_date: '2026-05-06',
    application_status: 'open',
    geo_scope: 'pan_african',
    og_image_url: 'https://opportunitydesk.org/wp-content/uploads/2026/04/UNESCO-International-Fund-for-Cultural-Diversity-2026.webp',
    status: 'pending',
    votes: 0,
  },
  {
    title: 'SFP9 Short Film Production Grant — Sharjah Art Foundation',
    'What Is It?': 'SFP9 Short Film Production Grant from the Sharjah Art Foundation. Total pool of 120,000 AED (~USD 30,000) for original short films (up to 50 minutes including credits). Open to independent filmmakers worldwide — African filmmakers explicitly eligible. Selected films may premiere at the Sharjah Film Platform.',
    'For Films or Series?': 'Short films (up to 50 minutes including credits)',
    'What Do You Get If Selected?': 'Share of 120,000 AED total pool (~USD 30,000). Individual grant amounts determined based on project needs. Potential premiere at Sharjah Film Platform.',
    'Cost': 'Free',
    'Next Deadline': '28 May 2026 — 11:59pm UAE time (GMT+4)',
    'Apply:': 'https://www.sharjahart.org/en/open-calls/details/open-call-sfp9-short-film-production-grant',
    'Who Can Apply / Eligibility': 'Independent filmmakers based anywhere in the world. Short films up to 50 minutes including credits. No geographic restriction — African filmmakers eligible.',
    'What to Submit': 'Check Sharjah Art Foundation website for full application requirements at sharjahart.org',
    'Strongest Submission Tips': 'Copyright and distribution rights remain with the applicant — Sharjah Art Foundation requires acknowledgement in opening/closing credits only. The total pool is 120,000 AED split across selected projects, so budget projects proportionately.',
    'CALENDAR REMINDER:': 'Deadline: 28 May 2026 — 11:59pm UAE time (GMT+4). Applications after this will not be considered.',
    category: 'Funds & Grants',
    deadline_date: '2026-05-28',
    application_status: 'open',
    geo_scope: 'international',
    og_image_url: 'https://www.sharjahart.org/images/Banner/Visuals-03.jpg',
    status: 'pending',
    votes: 0,
  },
  {
    title: 'AFAC Cinema Grant Program 2026 — Arab Fund for Arts and Culture',
    'What Is It?': 'Arab Fund for Arts and Culture (AFAC) Cinema Grant for fiction and documentary feature and short/medium films. Covers development, production and post-production phases. Open to Arab directors and producers across the Arab region and diaspora — includes Arab North Africa (Egypt, Morocco, Tunisia, Algeria, Libya, Sudan, Mauritania). This is the Cinema Grant, distinct from the AFAC Documentary Film Program (separate grant, separate deadline).',
    'For Films or Series?': 'Feature films and short/medium-length films (fiction and documentary)',
    'What Do You Get If Selected?': 'Development: up to USD 10,000 | Production (features): up to USD 50,000 | Production (short/medium): up to USD 20,000 | Post-production (features): up to USD 25,000 | Post-production (short/medium): up to USD 10,000',
    'Cost': 'Free',
    'Next Deadline': '19 June 2026 — check arabculturefund.org/Programs/12 for exact deadline and any updates',
    'Apply:': 'https://www.arabculturefund.org/Programs/12',
    'Who Can Apply / Eligibility': 'Arab directors and producers living in the Arab region or the diaspora. A non-Arab producer may apply if the film director is Arab. Explicitly includes North Africa: Egypt, Morocco, Tunisia, Algeria, Libya, Sudan, Mauritania.',
    'What to Submit': 'Check AFAC website at arabculturefund.org for full application requirements — typically includes script, budget, director statement, and team credentials.',
    'Strongest Submission Tips': 'AFAC has an extensive track record backing Arab-language cinema. Apply for the appropriate phase (development, production, or post) — multiple phases require separate applications. Strong team track record and a clear distribution plan strengthen applications.',
    'CALENDAR REMINDER:': 'Deadline: 19 June 2026',
    category: 'Funds & Grants',
    deadline_date: '2026-06-19',
    application_status: 'open',
    geo_scope: 'pan_african',
    og_image_url: 'https://www.arabculturefund.org/data/programs/12.jpg?v=',
    status: 'pending',
    votes: 0,
  },
  {
    title: 'Durban International Film Festival 2026 — 47th Edition (Entries Open)',
    'What Is It?': '47th Durban International Film Festival, 23 July – 2 August 2026, themed "The Prism of Heritage" — a new visual identity launched 22 April 2026. Call for entries is open via FilmFreeway. Includes the Durban FilmMart co-production and financing market. Hosted at Suncoast CineCentre and community arts centres across Durban, under CCA UKZN.',
    'For Films or Series?': 'Feature films, short films and documentaries',
    'What Do You Get If Selected?': 'World or international premiere screening slot at DIFF, access to festival platform and audience, eligibility for Durban FilmMart (apply separately for co-production / financing market accreditation).',
    'Cost': 'Submission via FilmFreeway — check FilmFreeway for current tier pricing',
    'Next Deadline': 'Check FilmFreeway (filmfreeway.com/DurbanFilmFest) for current earlybird, regular and late deadline tiers',
    'Apply:': 'https://filmfreeway.com/DurbanFilmFest',
    'Who Can Apply / Eligibility': 'Open to African and international filmmakers. African content is prioritised in programming.',
    'What to Submit': 'Submit via FilmFreeway — check for technical screening format requirements, language subtitling requirements, and world/international premiere status.',
    'Strongest Submission Tips': 'DIFF programmes strong African stories with commercial appeal alongside arthouse work. The Durban FilmMart is a separate market accreditation — apply for both if your project is in development or seeking co-producers. Check FilmFreeway listing for deadline tiers to submit at the lowest fee.',
    'CALENDAR REMINDER:': 'Festival: 23 July – 2 August 2026. Check FilmFreeway for entry deadline tiers now.',
    category: 'Festivals & Markets',
    deadline_date: null,
    application_status: 'open',
    geo_scope: 'pan_african',
    og_image_url: 'https://iol-prod.appspot.com/image/86d1989d4bb50f258246f55df31a76da4a801d6b=w700',
    status: 'pending',
    votes: 0,
  },
  {
    title: 'African Film Festival (East Africa) 2026 — Earlybird Deadline 8 May',
    'What Is It?': 'East Africa-focused African Film Festival accepting submissions for short films filmed at least partially in Uganda, Rwanda, Tanzania, Burundi, South Sudan, Ethiopia, DRC or Kenya. Festival held 12 December 2026. Free earlybird submissions. All programmers are African.',
    'For Films or Series?': 'Short films (under 45 minutes)',
    'What Do You Get If Selected?': 'Official selection at the African Film Festival (East Africa edition), 12 December 2026',
    'Cost': 'Free (earlybird) — check FilmFreeway for regular and late fees',
    'Next Deadline': 'Earlybird: 8 May 2026 (free submission). Check FilmFreeway for regular and late deadline tiers.',
    'Apply:': 'https://filmfreeway.com/AfricanFilmFestival',
    'Who Can Apply / Eligibility': 'Films must be at least partially filmed in Uganda, Rwanda, Tanzania, Burundi, South Sudan, Ethiopia, DRC or Kenya. Exceptions for films written and directed by citizens of those countries, filmed abroad. Completed no earlier than 1 September 2025. Runtime under 45 minutes.',
    'What to Submit': 'Submit via FilmFreeway — check listing for full technical requirements and language/subtitle requirements.',
    'Strongest Submission Tips': 'All programmers are African — stories that speak authentically to East African experience have the strongest case. Films in local languages are welcome. Submit earlybird (by 8 May) to avoid fees.',
    'CALENDAR REMINDER:': 'URGENT: Earlybird deadline 8 May 2026 (free submission). Festival: 12 December 2026.',
    category: 'Festivals & Markets',
    deadline_date: '2026-05-08',
    application_status: 'open',
    geo_scope: 'regional',
    og_image_url: 'https://festhomedocs.com/festivals/8142/logo_thumb-8142.jpg',
    status: 'pending',
    votes: 0,
  },
  {
    title: 'African Diaspora Cinema Festival (ADCF) — 10th Edition, 2–5 September 2026',
    'What Is It?': '10th edition of the African Diaspora Cinema Festival (ADCF), Florence, Italy, 2–5 September 2026. A primary international platform for African diaspora film and arts since 2013 — includes music, live performance, dance, fashion exhibitions, and book presentations alongside film. Non-profit, dedicated to Black stories and images. Hosted by InStabile – Culture in movimento.',
    'For Films or Series?': 'Feature films and short films by and about the African diaspora',
    'What Do You Get If Selected?': 'Official selection and screening at ADCF in Florence, Italy — one of the leading international African diaspora film platforms',
    'Cost': 'Check FilmFreeway for submission fees',
    'Next Deadline': 'Official deadline: 31 May 2026 | Late deadline: 30 June 2026',
    'Apply:': 'https://filmfreeway.com/AfricanDiasporaCinemaFestival',
    'Who Can Apply / Eligibility': 'Films by or about the African diaspora. International applicants welcome. Check FilmFreeway listing for genre and runtime requirements.',
    'What to Submit': 'Submit via FilmFreeway — check listing for format, runtime, language and subtitle requirements.',
    'Strongest Submission Tips': "ADCF champions diaspora stories — films that speak to the African experience outside the continent, or bridge both worlds. The festival's broad arts programming means films in conversation with music, fashion, or literary traditions may resonate with programmers.",
    'CALENDAR REMINDER:': 'Official deadline: 31 May 2026 | Late: 30 June 2026 | Festival: 2–5 September 2026 (Florence, Italy)',
    category: 'Festivals & Markets',
    deadline_date: '2026-05-31',
    application_status: 'open',
    geo_scope: 'international',
    og_image_url: 'https://festhomedocs.com/festivals/4427/logo_thumb-4427.jpg',
    status: 'pending',
    votes: 0,
  },
];

// ─── NEWS ─────────────────────────────────────────────────────────────────────

const news = [
  {
    title: "Esiri Brothers' 'Clarissa' Selected for Cannes Directors' Fortnight 2026",
    summary: "Nigerian directors Arie and Chuko Esiri's sophomore feature Clarissa — a 35mm reimagining of Virginia Woolf's Mrs Dalloway shot in Lagos and Delta State — selected for the Directors' Fortnight at Cannes 2026. Stars Sophie Okonedo, David Oyelowo, Ayo Edebiri, and India Amarteifio. Acquired by NEON.",
    content: "Nigerian directors Arie and Chuko Esiri's sophomore feature Clarissa has been selected for the Directors' Fortnight (Quinzaine des Cinéastes) at the 2026 Cannes Film Festival, running 13–23 May 2026.\n\nShot on 35mm across Lagos and Delta State in late 2025, Clarissa is a reimagining of Virginia Woolf's Mrs Dalloway, unfolding over a single day as a society hostess prepares for an evening gathering while confronting memories, past relationships, and the life she has built. The film stars Sophie Okonedo, David Oyelowo, Ayo Edebiri, Toheeb Jimoh, and India Amarteifio, and has been acquired by NEON for international distribution.\n\nThe Esiri brothers' debut, Eyimofe (This Is My Desire), premiered in Berlin and won five African Movie Academy Awards. Clarissa's selection at the Directors' Fortnight — with a major international cast and NEON backing — represents a significant step in the internationalisation of Nollywood-adjacent auteur cinema.\n\nFor FRA members: Arie and Chuko Esiri are both listed in the FRA directory. This is a strong example of African filmmakers operating at the intersection of local storytelling and global arthouse infrastructure.",
    category: 'festivals',
    url: 'https://deadline.com/2026/04/cannes-directors-fortnight-unveils-2026-lineup-1236860043/',
    published_at: '2026-04-24T00:00:00+00:00',
    slug: 'esiri-brothers-clarissa-cannes-directors-fortnight-2026',
    image_url: 'https://afrocritik.com/wp-content/uploads/2026/04/Directors-Fortnight-poster-2026-1.jpg',
    geo_scope: 'pan_african',
    status: 'pending',
  },
  {
    title: 'Showmax Shuts Down 30 April 2026: Impact on African Streaming and Content Pipelines',
    summary: "Showmax ceases operations on 30 April 2026, with content transitioning to DStv Stream. A major structural shift in the SA/Africa streaming landscape — downstream impact on SA content commissioning pipelines and the competitive balance between Netflix, Disney+, Amazon Prime Video, and local platforms.",
    content: "Showmax, MultiChoice's streaming platform and one of South Africa's largest local streaming services, will cease operations on 30 April 2026. Content and original programming will transition to DStv Stream.\n\nFor South African and African content producers, the shutdown has downstream implications. Showmax had been a meaningful commissioning outlet for South African original content — its exit removes a local buyer from the market and pushes producers further toward Netflix, Amazon, and international co-production models as the primary routes to streaming budgets.\n\nThe platform shift comes at a difficult moment for the SA content industry, which is also grappling with the DTIC rebate delay crisis (millions in owed 25% cash rebates unpaid) and broader market consolidation across African streaming.\n\nFor SA-based FRA members with projects licensed to Showmax, DStv Stream will be the continuity platform. For those in development or production seeking streaming partners, the landscape post-30 April will be more concentrated around international platforms and South African linear television.",
    category: 'industry_news',
    url: 'https://inboundsa.com/featured/what-to-watch-south-africa-2026/',
    published_at: '2026-04-24T00:00:00+00:00',
    slug: 'showmax-shutdown-april-2026-streaming-africa',
    image_url: 'https://inboundsa.com/wp-content/uploads/2026/04/ChatGPT-Image-Apr-16-2026-12_26_02-PM.png',
    geo_scope: 'pan_african',
    status: 'pending',
  },
  {
    title: 'Nolly Africa HD Launches on Samsung TV Plus UK — AMC Expands Nollywood to European FAST',
    summary: "African Movie Channel (AMC) launched Nolly Africa HD on Samsung TV Plus in the UK — bringing a 24-hour curated Nollywood FAST channel to millions of Samsung Smart TV households. Part of AMC's growing European FAST distribution strategy for African content.",
    content: "African Movie Channel (AMC) has launched Nolly Africa HD on Samsung TV Plus in the UK, giving the 24-hour Nollywood FAST channel access to millions of Samsung Smart TV households across Britain.\n\nNolly Africa HD delivers curated Nollywood blockbusters, immersive series and unscripted entertainment, including titles from AMC's original production arm AMCOP (African Movie Channel Original Productions).\n\nAccording to AMC CEO Yinka Mayungbo: 'Launching Nolly Africa HD on Samsung TV Plus UK is a significant strategic achievement for AMC and for Nollywood globally.'\n\nThe Samsung TV Plus launch follows previous Nolly Africa HD expansions onto Cineverse, DistroTV, and Plex. Together, these FAST channel placements are quietly building a European and US distribution layer for Nollywood content outside the major SVOD platforms — a distribution model that doesn't require streamer commissioning deals and instead monetises through advertising on free-to-air connected TV platforms.\n\nFor the African film industry, this represents a maturing distribution infrastructure that complements, rather than competes with, Netflix and Amazon strategies.",
    category: 'industry_news',
    url: 'https://www.advanced-television.com/2026/02/26/nolly-africa-hd-launches-on-samsung-tv-plus-uk/',
    published_at: '2026-02-26T00:00:00+00:00',
    slug: 'nolly-africa-hd-samsung-tv-plus-uk-2026',
    image_url: 'https://www.africanmoviechannel.tv/sites/default/files/field/image/Web%20banner%20samsung%20Uk%20.jpg',
    geo_scope: 'pan_african',
    status: 'pending',
  },
  {
    title: 'Nigeria–Germany Film Ties Deepen: German Consulate and Goethe-Institut Partner with Nollywood',
    summary: "German Consulate Lagos and Goethe-Institut hosted Nigerian filmmakers who participated in Berlinale 2026 at a roundtable to strengthen Nollywood-German ties. Separately, a German film delegation made its first formal outreach to Nigeria, exploring co-productions, equipment partnerships, and IP/royalty frameworks.",
    content: "The German Consulate in Lagos and Goethe-Institut hosted a roundtable with Nigerian filmmakers who participated in the 2026 Berlin International Film Festival, in what has been described as a 'Berlinale-Back-to-Back' initiative to strengthen collaboration between Nollywood and the German film industry.\n\nSeparately, a German film industry delegation made its first formal outreach to Nigeria, with Daniel Krull, the German Consul General, introducing German companies to Nigerian filmmakers and producers at a Lagos press conference. Key areas of collaboration discussed include joint film co-productions, equipment partnerships, and IP and royalty frameworks for Nigerian content distributed on global streaming platforms.\n\nFor FRA members: Nigeria-Germany bilateral co-production represents an emerging opportunity for Nigerian filmmakers — particularly those seeking European financing and technical partnerships. Germany's film incentive infrastructure (regional film funds, the DFFF, and the Goethe-Institut's co-production support) is accessible to Nigerian projects with German co-producers attached.",
    category: 'industry_news',
    url: 'https://www.vanguardngr.com/2026/03/german-consulate-goethe-institut-host-berlinale-back-to-back-to-strengthen-nollywood-german-ties/',
    published_at: '2026-03-01T00:00:00+00:00',
    slug: 'nigeria-germany-film-partnership-nollywood-berlin-2026',
    image_url: 'https://global.ariseplay.com/amg/www.arise.tv/uploads/2025/11/German-Consul-General-Daniel-Krull-addresses-the-press.jpeg',
    geo_scope: 'pan_african',
    status: 'pending',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== FRA Digest Insert — 24 Apr 2026 ===');
  console.log(`Mode: ${LIVE ? '🔴 LIVE' : '🟡 DRY RUN (pass --live to insert)'}`);
  if (FORCE) console.log('⚠️  --force: stale age gate bypassed');
  console.log(`Stale threshold: ${STALE_THRESHOLD_DAYS} days\n`);

  const existingOpps = await getTitles('opportunities', db);
  const existingNews = await getTitles('news', db);

  console.log(`DB: ${existingOpps.size} opportunities, ${existingNews.size} news items\n`);

  // ── Opportunities (no date gate — deadlines are the integrity check) ──
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
        await insertRecord('opportunities', opp, db);
        console.log(`  ✅ Inserted: ${opp.title}`);
        oppInserted++;
      } catch (err) {
        console.log(`  ❌ Failed: ${opp.title} — ${err.message}`);
      }
    } else {
      console.log(`  [DRY] Would insert: ${opp.title}`);
      console.log(`        Category: ${opp.category} | Geo: ${opp.geo_scope} | Deadline: ${opp.deadline_date || 'Check listing'}`);
      console.log(`        Image: ${opp.og_image_url || 'null — add in /admin'}`);
    }
  }

  // ── News (date verification gate) ──
  console.log('\n── NEWS ──');
  let newsInserted = 0, newsSkipped = 0, newsBlocked = 0;

  for (const article of news) {
    const key = article.title.toLowerCase().trim();
    if (existingNews.has(key)) {
      console.log(`  ⏭  SKIP (duplicate): ${article.title}`);
      newsSkipped++;
      continue;
    }

    const ok = await checkAndLogDate(article, { force: FORCE });
    if (!ok) { newsBlocked++; continue; }

    if (LIVE) {
      try {
        await insertRecord('news', article, db);
        console.log(`  ✅ Inserted: ${article.title}`);
        newsInserted++;
      } catch (err) {
        console.log(`  ❌ Failed: ${article.title} — ${err.message}`);
      }
    } else {
      console.log(`  [DRY] Would insert: ${article.title}`);
      console.log(`        Category: ${article.category} | Geo: ${article.geo_scope}`);
      console.log(`        Image: ${article.image_url || 'null — add in /admin'}`);
    }
  }

  // ── Summary ──
  console.log('\n=== Summary ===');
  if (LIVE) {
    console.log(`  Opportunities inserted: ${oppInserted} | skipped: ${oppSkipped}`);
    console.log(`  News inserted:          ${newsInserted} | skipped: ${newsSkipped} | blocked (stale): ${newsBlocked}`);
    if (oppInserted + newsInserted > 0) {
      console.log('\n💡 Review and approve pending items at /admin');
      console.log('ℹ️  Image notes:');
      console.log("   - Clarissa: Directors' Fortnight 2026 poster used — replace with Clarissa-specific still when available");
      console.log('   - East Africa Film Fest + ADCF: festhome logo thumbnails — replace with festival banners if found');
    }
  } else {
    console.log(`  Would insert: ${opportunities.length} opportunities + ${news.length} news items (subject to date gate)`);
    console.log(`  Maisha Film Lab: confirmed duplicate (DB ID 113, approved) — not included`);
    console.log(`  Stale items removed: Amazon/Inkblot (2022), Kenya rebate (Aug 2024), Nigeria tax (Mar 2024) — deleted from DB 24 Apr`);
    console.log(`  Run with --live to execute (--force to bypass age gate)`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
