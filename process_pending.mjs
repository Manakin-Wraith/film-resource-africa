/**
 * Process pending opportunities:
 *   1. Delete junk, duplicates, non-opportunities
 *   2. Enrich genuine opportunities with real data
 *   3. Approve enriched opportunities
 *
 * Usage:
 *   node process_pending.mjs --dry-run    # preview only
 *   node process_pending.mjs              # execute changes
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

async function supabaseDelete(table, id) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE', headers,
  });
  if (!res.ok) throw new Error(`DELETE ${table} #${id} failed: ${res.status}`);
}

async function supabaseUpdate(table, id, updates) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`UPDATE ${table} #${id} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── IDs to DELETE (junk, duplicates, news-not-opps, non-film, aggregators) ──
const DELETE_IDS = [
  // Duplicates (pending vs pending)
  171, 179, 185, 188, 205,
  // YouTube
  182,
  // LinkedIn articles
  189, 195,
  // Research guides / aggregator / directory pages
  166, 173, 175, 184, 186, 191, 192, 197, 198,
  // Not film-related (food fellowship, earth observation, writing fellowship)
  168, 169, 172,
  // News articles, not actionable opportunities
  176, 177, 178, 180, 183, 187, 199, 202, 203, 204, 207, 208, 209,
];

// ── IDs to CONVERT to news (interesting industry news worth keeping) ──
const CONVERT_TO_NEWS = [
  {
    id: 174,
    news: {
      title: "Meet The Advisory Board Of Nigeria's First ₦20bn SEC-Approved Film Fund",
      summary: "Five respected industry leaders appointed to the advisory board of the Utica Film Fund, Nigeria's first SEC-licensed ₦20bn venture capital fund for the film industry.",
      content: "Five respected industry leaders have been appointed to the advisory board that will review and select projects for the Utica Film Fund — Nigeria's first SEC-licensed ₦20bn venture capital fund dedicated to the Nigerian film industry. The fund represents a major milestone in institutional financing for Nollywood.",
      category: 'industry_news',
      url: 'https://shockng.com/utica-film-fund-nollywood-2026/',
      slug: 'nigeria-first-n20bn-sec-approved-film-fund-advisory-board',
      published_at: new Date().toISOString(),
    }
  },
];

// ── IDs to ENRICH and APPROVE ──
const ENRICH_AND_APPROVE = [
  {
    id: 167,
    updates: {
      title: "Filmmakers Without Borders – Teaching Fellowship",
      "What Is It?": "Fully-funded fellowships to teach filmmaking, media literacy, and technology to underserved students across Africa, Asia, and Latin America. Fellows spend 2–6 months embedded in partner communities, running hands-on filmmaking workshops while developing their own creative practice. The programme provides flights, accommodation, a stipend, and production equipment.",
      "For Films or Series?": "All formats — training-focused fellowship",
      "What Do You Get If Selected?": "Fully-funded fellowship: flights, accommodation, stipend, and access to production equipment. Professional development and cross-cultural filmmaking experience.",
      "Cost": "FREE — fully funded",
      "Next Deadline": "Rolling applications — check website for current cycle",
      "Apply:": "https://filmmakerswithoutborders.org/fellowships/",
      "Who Can Apply / Eligibility": "Emerging and mid-career filmmakers, media educators, and technologists. Must be willing to relocate for 2–6 months.",
      "What to Submit": "Online application including CV, portfolio/reel, motivation statement. See website.",
      "Strongest Submission Tips": "A unique opportunity for African filmmakers to gain international teaching experience while building their network. Particularly valuable for documentary filmmakers and those interested in community-based storytelling.",
      "CALENDAR REMINDER:": "Rolling — check filmmakerswithoutborders.org for open cycles.",
      category: "Labs & Fellowships",
      status: "approved",
    }
  },
  {
    id: 170,
    updates: {
      title: "Film Independent Amplifier Fellowship",
      "What Is It?": "A year-long fellowship from Film Independent amplifying the voices of Black or African American artists working in fiction, nonfiction, and episodic formats. Fellows receive mentorship, industry access, grant funding, and participation in Film Independent's year-round programming including the LA Film Festival and Spirit Awards. Film Independent is the non-profit behind the Spirit Awards — the leading awards for independent cinema.",
      "For Films or Series?": "Fiction, documentary, and episodic — all formats",
      "What Do You Get If Selected?": "Year-long mentorship, industry introductions, grant funding, Film Independent membership and programming access, Spirit Awards participation.",
      "Cost": "FREE — No application fee",
      "Next Deadline": "Annual cycle — typically opens Q1. Check filmindependent.org for 2026 dates.",
      "Apply:": "https://www.filmindependent.org/programs/artist-development/amplifier-fellowship/",
      "Who Can Apply / Eligibility": "Black or African American filmmakers (US-based or with US work authorization). Emerging to mid-career artists working in fiction, nonfiction, or episodic formats.",
      "What to Submit": "Application form, work sample, artist statement, project proposal. Full details on Film Independent website.",
      "Strongest Submission Tips": "One of the most prestigious fellowship programmes specifically for Black filmmakers in the US. African diaspora filmmakers based in the US should prioritise this. The Film Independent network provides direct access to the Spirit Awards ecosystem and major US distribution pathways.",
      "CALENDAR REMINDER:": "Watch filmindependent.org for 2026 application window, typically Q1.",
      category: "Labs & Fellowships",
      status: "approved",
    }
  },
  {
    id: 181,
    updates: {
      title: "Open Cities – Film Accelerator & Production Company",
      "What Is It?": "Open Cities is a new film accelerator and production company launched in 2026 by former Sundance Film Festival CEO Joana Vicente and producer Jason Blum's team. It focuses on discovering and fast-tracking emerging filmmakers from underrepresented communities globally, with an emphasis on stories from the Global South. Open Cities provides development funding, production support, mentorship, and distribution pathways through its studio partnerships.",
      "For Films or Series?": "Feature films — fiction and documentary",
      "What Do You Get If Selected?": "Development and production funding, mentorship from industry leaders, studio distribution pathways. Accelerator model designed to fast-track projects from script to screen.",
      "Cost": "FREE",
      "Next Deadline": "Newly launched March 2026 — first open call expected soon. Monitor website.",
      "Apply:": "https://variety.com/2026/film/news/open-cities-film-company-joana-vicente-jason-blum/",
      "Who Can Apply / Eligibility": "Emerging filmmakers globally, with focus on underrepresented voices and Global South storytellers.",
      "What to Submit": "To be announced — monitor Open Cities website for submission guidelines.",
      "Strongest Submission Tips": "Major new player with serious industry credibility (Joana Vicente ran Sundance). This accelerator model is specifically designed for filmmakers who struggle with the traditional funding pipeline. African filmmakers should watch this closely — the Global South focus makes this highly relevant.",
      "CALENDAR REMINDER:": "Monitor for first open call — expected Q2 2026.",
      category: "Labs & Fellowships",
      status: "approved",
    }
  },
  {
    id: 190,
    updates: {
      title: "Abidjan Animation Film Festival (FFAA) 2026 – Call for Submissions",
      "What Is It?": "The Abidjan Animation Film Festival (Festival du Film d'Animation d'Abidjan — FFAA) is West Africa's premier animation festival, held annually in Abidjan, Côte d'Ivoire. The 2026 edition is now accepting submissions for animated short films and features across all animation techniques. FFAA showcases African animation talent and connects creators with the growing continental animation industry.",
      "For Films or Series?": "Animation — short films and features, all techniques",
      "What Do You Get If Selected?": "Festival screening, awards consideration, networking with African animation industry professionals and international buyers.",
      "Cost": "Check website for submission fees",
      "Next Deadline": "2026 — check callfor.org/ffaa for exact deadline",
      "Apply:": "https://www.callfor.org/ffaa/",
      "Who Can Apply / Eligibility": "Open to animators and animation studios globally, with focus on African-produced animation.",
      "What to Submit": "Completed animated film, director bio, film synopsis. Submit via Callfor.org platform.",
      "Strongest Submission Tips": "One of the only dedicated animation festivals in West Africa. African animators should prioritise this as a launchpad for continental visibility. The growing African animation sector (driven by Netflix, Disney+, and Showmax commissions) makes festival presence increasingly valuable.",
      "CALENDAR REMINDER:": "Check callfor.org/ffaa for 2026 submission deadline.",
      category: "Festivals",
      status: "approved",
    }
  },
  {
    id: 193,
    updates: {
      title: "World Cinema Fund (WCF) Africa – Post-Production Funding",
      "What Is It?": "The World Cinema Fund (WCF), run by the Berlinale in cooperation with the German Federal Foreign Office, launched a dedicated Africa strand providing post-production funding of up to €40,000 for African film projects. WCF Africa specifically targets films from sub-Saharan Africa that need finishing funds for post-production (editing, sound design, colour grading, DCP creation). This complements the broader WCF programme which supports development and production.",
      "For Films or Series?": "Feature films — fiction and documentary (post-production stage)",
      "What Do You Get If Selected?": "Up to €40,000 in post-production funding. WCF/Berlinale endorsement, which significantly boosts festival and sales prospects.",
      "Cost": "FREE — No application fee",
      "Next Deadline": "Check berlinale.de/world-cinema-fund for current deadlines (typically bi-annual cycles)",
      "Apply:": "https://www.berlinale.de/en/world-cinema-fund/",
      "Who Can Apply / Eligibility": "Filmmakers from sub-Saharan African countries with a feature film in post-production. Must have a German or European co-producer or post-production partner.",
      "What to Submit": "Application form, rough cut, budget, financing plan, co-production agreements. Full requirements on WCF website.",
      "Strongest Submission Tips": "This is one of the most important finishing funds for African cinema. A WCF grant virtually guarantees Berlinale consideration and opens doors to European distribution. If your film is in post-production and you have (or can find) a German post-production partner, this should be your top priority.",
      "CALENDAR REMINDER:": "Check berlinale.de/world-cinema-fund for next application deadline.",
      category: "Funds & Grants",
      status: "approved",
    }
  },
  {
    id: 194,
    updates: {
      title: "IQOQO – African XR/Immersive Storytelling Initiative",
      "What Is It?": "IQOQO is an initiative by Electric South, a South African non-profit pioneering immersive storytelling (VR, AR, XR) across Africa. IQOQO supports African creators in building new worlds through extended reality technologies, offering residencies, production support, and exhibition opportunities. Electric South has produced award-winning African XR works shown at Venice, Sundance, and IDFA.",
      "For Films or Series?": "VR, AR, XR — immersive formats",
      "What Do You Get If Selected?": "Creative residency, production support, mentorship from XR experts, exhibition opportunities at international festivals (Venice, Sundance, IDFA).",
      "Cost": "FREE",
      "Next Deadline": "Check iqoqo.org and electricsouth.org for current open calls",
      "Apply:": "https://iqoqo.org/building-new-african-worlds-through-xr/",
      "Who Can Apply / Eligibility": "African artists, filmmakers, and digital creators interested in immersive storytelling. Based in or connected to the African continent.",
      "What to Submit": "Project concept, creative statement, portfolio of previous work. Full requirements on website.",
      "Strongest Submission Tips": "Electric South is THE pioneer of African XR storytelling. Their alumni have shown at Venice Immersive and Sundance New Frontier. If you're interested in VR/AR/XR, this is the most relevant African programme. The immersive space is still emerging in Africa, meaning less competition for a growing number of opportunities.",
      "CALENDAR REMINDER:": "Monitor electricsouth.org and iqoqo.org for open calls.",
      category: "AI & Emerging Tech",
      status: "approved",
    }
  },
  {
    id: 200,
    updates: {
      title: "Creative Economy Development Fund (CEDF) – Nigeria",
      "What Is It?": "The Creative Economy Development Fund (CEDF) is a non-repayable grant programme by the Nigerian government supporting projects and enterprises in Nigeria's creative economy, including film, music, fashion, and technology. The fund provides direct grants to creative businesses and projects, administered through the Nigerian Creative Economy Initiative. This represents one of the first structured public grant mechanisms for the Nigerian creative sector.",
      "For Films or Series?": "All creative formats including film, TV, animation, and digital content",
      "What Do You Get If Selected?": "Non-repayable grant funding for creative projects. Amount varies by project tier — check website for current funding levels.",
      "Cost": "FREE — No application fee",
      "Next Deadline": "2026 cycle — check gistreel.com or official CEDF channels for current deadline",
      "Apply:": "https://www.gistreel.com/creative-economy-development-fund-cedf/",
      "Who Can Apply / Eligibility": "Nigerian creative entrepreneurs and production companies. Projects must demonstrate commercial viability and cultural impact.",
      "What to Submit": "Business plan, project proposal, budget, evidence of creative track record. Full details on application portal.",
      "Strongest Submission Tips": "A rare non-repayable government grant for Nigerian filmmakers. Unlike the Utica Film Fund (which is a venture capital vehicle), CEDF grants don't require repayment. Nigerian filmmakers should apply to both CEDF and explore the Utica Fund for different project types.",
      "CALENDAR REMINDER:": "Monitor official CEDF channels for 2026 application window.",
      category: "Funds & Grants",
      status: "approved",
    }
  },
  {
    id: 201,
    updates: {
      title: "Luxor African Film Festival (LAFF) 2026 – Call for Films",
      "What Is It?": "The Luxor African Film Festival (LAFF) is one of Africa's premier film festivals, held annually in Luxor, Egypt. The 2026 edition (15th) is accepting film submissions across competition sections. LAFF 2026 also pays tribute to legendary Egyptian filmmaker Youssef Chahine. The festival screens fiction, documentary, and short films from across the African continent, and is a major meeting point for North and sub-Saharan African cinema.",
      "For Films or Series?": "Feature fiction, documentary, short films — African productions",
      "What Do You Get If Selected?": "Festival screening, competition awards, networking with Pan-African film industry. Travel support possible for selected filmmakers.",
      "Cost": "Check website for submission fees",
      "Next Deadline": "LAFF 2026 dates: 30 March – 5 April 2026. Submissions deadline likely passed — check for late submissions.",
      "Apply:": "https://souffleinedit.com/cinema/laff-2026-festival-de-louxor-du-film/",
      "Who Can Apply / Eligibility": "African filmmakers from all 54 countries. Films must be African productions or co-productions.",
      "What to Submit": "Completed film, director bio, film synopsis, technical details. Submit via festival platform.",
      "Strongest Submission Tips": "LAFF is strategically important as a bridge between North African and sub-Saharan cinema circuits. The Youssef Chahine tribute signals the festival's artistic seriousness. Egyptian and North African filmmakers should consider this a must-attend.",
      "CALENDAR REMINDER:": "LAFF 2026: 30 March – 5 April. Watch for 2027 call for submissions later in 2026.",
      category: "Festivals",
      status: "approved",
    }
  },
  {
    id: 206,
    updates: {
      title: "FFAA 2026 (Festival du Film d'Animation d'Abidjan) – Final Submissions",
      "What Is It?": "Final call for submissions to the Festival du Film d'Animation d'Abidjan (FFAA) 2026. Filmmakers, producers, students, and animation studios are invited to submit animated works for the festival's competitive and non-competitive sections. FFAA is the leading animation festival in Francophone West Africa.",
      "For Films or Series?": "Animation — all techniques and formats",
      "What Do You Get If Selected?": "Festival screening, awards, exposure to West African animation industry and international buyers.",
      "Cost": "Check submission platform for fees",
      "Next Deadline": "Final deadline — check awnchina.cn/submit-your-film-to-ffaa-2026 for exact date",
      "Apply:": "https://awnchina.cn/submit-your-film-to-ffaa-2026/",
      "Who Can Apply / Eligibility": "Animators, animation studios, and film students globally. African productions prioritised.",
      "What to Submit": "Completed animated film, synopsis, director statement.",
      "Strongest Submission Tips": "This appears to be a duplicate/partner submission portal for FFAA 2026 (also listed via callfor.org). Use whichever portal works best for you.",
      "CALENDAR REMINDER:": "Final call — submit immediately if interested.",
      category: "Festivals",
      status: "approved",
    }
  },
  {
    id: 210,
    updates: {
      title: "Hubert Bals Fund (HBF) – Practical Info & Deadlines",
      "What Is It?": "The Hubert Bals Fund (HBF), managed by the International Film Festival Rotterdam (IFFR), is one of the world's most important funds for cinema from developing countries. HBF provides grants of €10,000–€50,000 across three schemes: HBF Script & Project Development, HBF+Europe (co-production with European partners), and a Post-Production Support scheme. Since 1988, HBF has supported over 1,200 films from Africa, Asia, Latin America, and the Middle East.",
      "For Films or Series?": "Feature fiction and creative documentary — development, production, and post-production",
      "What Do You Get If Selected?": "€10,000–€50,000 depending on scheme. IFFR premiere consideration. Access to CineMart (IFFR's co-production market).",
      "Cost": "FREE — No application fee",
      "Next Deadline": "Bi-annual deadlines — check iffr.com/en/hubert-bals-fund for current cycle (typically March and September)",
      "Apply:": "https://iffr.com/en/hubert-bals-fund/hbf-practical-info-deadlines",
      "Who Can Apply / Eligibility": "Filmmakers from countries listed on the DAC list (includes most African countries). Must have a producer attached. First and second features prioritised for some schemes.",
      "What to Submit": "Application form, script/treatment, director's statement, budget, financing plan. Full details on IFFR website.",
      "Strongest Submission Tips": "HBF is arguably the single most impactful international fund for African filmmakers — a who's who of African cinema has come through HBF. The fund has been running since 1988 and its track record is unmatched. Apply to HBF Script & Development first, then HBF+Europe once you have a European co-producer.",
      "CALENDAR REMINDER:": "Check iffr.com/en/hubert-bals-fund for next deadline (typically March or September).",
      category: "Funds & Grants",
      status: "approved",
    }
  },
  {
    id: 211,
    updates: {
      title: "FESPACO 2027 – Call for Film Submissions",
      "What Is It?": "FESPACO (Festival Panafricain du Cinéma et de la Télévision de Ouagadougou) is THE flagship Pan-African film festival, held biennially in Ouagadougou, Burkina Faso since 1969. The 2027 edition has opened its call for film submissions across all competitive sections. FESPACO is the oldest and most prestigious African film festival — winning the Étalon de Yennenga (Golden Stallion) is the highest honour in African cinema.",
      "For Films or Series?": "Feature fiction, documentary, short films, animation, TV series — African productions only",
      "What Do You Get If Selected?": "Festival screening at Africa's most prestigious film event. Competition for the Étalon de Yennenga and other prizes. Massive Pan-African industry networking.",
      "Cost": "Check FESPACO website for submission fees",
      "Next Deadline": "FESPACO 2027 — submissions now open. Check fespaco.bf for exact deadline.",
      "Apply:": "https://fespaco.bf/le-fespaco/les-sections/la-competition-officielle/",
      "Who Can Apply / Eligibility": "African filmmakers from all 54 countries. Films must be directed by an African filmmaker and produced on the continent or in the diaspora.",
      "What to Submit": "Completed film, director bio, synopsis, technical specifications. Submit via FESPACO website.",
      "Strongest Submission Tips": "FESPACO is the Cannes of African cinema. If you have a completed African film, submitting to FESPACO should be a priority. The 2027 edition submissions are now open — this is a time-sensitive opportunity. The festival's Ouagadougou location makes it the most important networking event for Francophone African cinema.",
      "CALENDAR REMINDER:": "FESPACO 2027 submissions open NOW — submit as early as possible.",
      category: "Festivals",
      status: "approved",
    }
  },
];

async function main() {
  console.log(`\n🔧 FRA Pending Opportunities Processor`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  // ── Phase 1: Delete junk ──
  console.log('═'.repeat(60));
  console.log('🗑️  PHASE 1: Deleting junk, duplicates, and non-opportunities');
  console.log('═'.repeat(60));
  let deleted = 0;
  for (const id of DELETE_IDS) {
    if (DRY_RUN) {
      console.log(`  [DRY] Would delete #${id}`);
    } else {
      try {
        await supabaseDelete('opportunities', id);
        console.log(`  ✓ Deleted #${id}`);
        deleted++;
      } catch (err) {
        console.log(`  ✗ Failed to delete #${id}: ${err.message}`);
      }
    }
  }
  console.log(`\n  → Deleted: ${deleted} / ${DELETE_IDS.length}\n`);

  // ── Phase 2: Convert news items ──
  console.log('═'.repeat(60));
  console.log('📰 PHASE 2: Converting news-worthy items to news table');
  console.log('═'.repeat(60));
  for (const item of CONVERT_TO_NEWS) {
    if (DRY_RUN) {
      console.log(`  [DRY] Would convert #${item.id} to news: "${item.news.title.slice(0, 55)}"`);
    } else {
      try {
        // Insert into news table
        const res = await fetch(`${supabaseUrl}/rest/v1/news`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify(item.news),
        });
        if (!res.ok) throw new Error(`News insert failed: ${res.status}`);
        // Delete from opportunities
        await supabaseDelete('opportunities', item.id);
        console.log(`  ✓ Converted #${item.id} to news: "${item.news.title.slice(0, 55)}"`);
      } catch (err) {
        console.log(`  ✗ Failed #${item.id}: ${err.message}`);
      }
    }
  }

  // ── Phase 3: Enrich and approve ──
  console.log('\n' + '═'.repeat(60));
  console.log('✅ PHASE 3: Enriching and approving genuine opportunities');
  console.log('═'.repeat(60));
  let enriched = 0;
  for (const item of ENRICH_AND_APPROVE) {
    if (DRY_RUN) {
      console.log(`  [DRY] Would enrich+approve #${item.id}: "${item.updates.title.slice(0, 55)}"`);
    } else {
      try {
        await supabaseUpdate('opportunities', item.id, item.updates);
        console.log(`  ✅ Enriched+approved #${item.id}: "${item.updates.title.slice(0, 55)}"`);
        enriched++;
      } catch (err) {
        console.log(`  ✗ Failed #${item.id}: ${err.message}`);
      }
    }
  }
  console.log(`\n  → Enriched & approved: ${enriched} / ${ENRICH_AND_APPROVE.length}\n`);

  // ── Summary ──
  console.log('═'.repeat(60));
  console.log('📋 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Deleted (junk/dupes/news):  ${deleted}`);
  console.log(`  Converted to news:         ${CONVERT_TO_NEWS.length}`);
  console.log(`  Enriched & approved:       ${enriched}`);
  console.log(`  Total processed:           ${deleted + CONVERT_TO_NEWS.length + enriched}`);
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
