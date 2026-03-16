import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const newOpportunities = [
  {
    title: "NEXT NARRATIVE AFRICA FUND (NNAF)",
    "What Is It?": "The Next Narrative Africa Fund is a mission-driven content and media investment vehicle targeting $50 million in total capitalization — $40 million commercial content fund paired with $10 million from its non-profit Venture Studio — to support commercially viable audio-visual content made on the African continent by African and African-diaspora storytellers. Founded in late 2024 by Akunna Cook, a former US Deputy Assistant Secretary of State for African Affairs, NNAF's stated aim is to 'shift the global perception of the African continent by industrializing the African narrative.' The fund's advisory board includes Talitha Watkins, President of ColorCreative Management (Issa Rae's company). NNAF partnered with Parrot Analytics on a first-of-its-kind African entertainment landscape study. On 13 March 2026, NNAF unveiled its first slate of development projects — selected from more than 2,000 global submissions — including productions involving Trevor Noah, Rapman (Blue Story, Supacell), and Mohamed Kordofani (Goodbye Julia, Cannes Un Certain Regard Freedom Prize 2023).",
    "For Films or Series?": "Feature films and episodic television series at the script development stage.",
    "What Do You Get If Selected?": "Up to $100,000 per project for script development. Access to NNAF's network of advisors, distributors, and industry partners. Part of a $50M five-year investment pipeline in African content.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "First grantees announced March 2026. Future open calls expected — monitor the NNAF website.",
    "Apply:": "nextnarrativeafricafund.com/pitch",
    "Who Can Apply / Eligibility": "African and African-diaspora creators with a compelling film or episodic series idea. Projects must be produced on the African continent and have a strong 'Africa nexus' — stories rooted in African realities but crafted for global commercial appeal.",
    "What to Submit": "Script or project pitch via the NNAF submission portal. Full details on the website.",
    "Strongest Submission Tips": "This is the single largest new dedicated fund for African screen content to emerge in recent years. Unlike festival-linked funds that support one project at a time, NNAF operates as an investment vehicle with a five-year, $50M commitment. The involvement of Trevor Noah and Rapman in the first slate signals that NNAF is attracting top-tier talent. Focus on commercially viable stories with global audience appeal — this fund explicitly values commercial potential alongside artistic merit.",
    "CALENDAR REMINDER:": "Monitor nextnarrativeafricafund.com for future open calls. The first cycle received 2,000+ submissions — apply early when the next call opens.",
    status: "approved",
    votes: 0
  },
  {
    title: "AFAC DOCUMENTARY FILM PROGRAM (Arab Fund for Arts & Culture)",
    "What Is It?": "The Arab Fund for Arts and Culture (AFAC) is an independent organisation founded in 2007 to support artists and cultural institutions across the Arab world. Its Documentary Film Program provides financial support to creative documentary filmmakers from the Arab region and diaspora, funding projects across development, production, and post-production stages. AFAC prioritises storytelling-driven, artistically ambitious documentaries. Donors include the Ford Foundation, Open Society Foundations, Magnum Foundation, and Andrew Mellon Foundation. Roughly 42% of grantees are emerging artists and 30% are women. AFAC runs two open calls per year: the first covers Documentary Film, Creative and Critical Writings, Performing Arts, and Visual Arts; the second covers Cinema (fiction), Music, Documentary Photography, and Training.",
    "For Films or Series?": "Creative documentary only. Projects at development, production, or post-production stage.",
    "What Do You Get If Selected?": "Production grant covering project-related expenses including materials, equipment rentals, and fees for artistic and technical collaboration. Director and producer fee of up to 30% of grant amount is allowable.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "DEADLINE: 2 April 2026 at 5:00 PM Beirut time (GMT+3). Online application only.",
    "Apply:": "arabculturefund.org/Programs/7",
    "Who Can Apply / Eligibility": "Filmmakers of Arab origin or nationality — including North African countries: Morocco, Tunisia, Algeria, Libya, Egypt, Sudan, and Mauritania. A non-Arab producer may apply if the director is Arab. No age or experience restrictions. Applicants with a current open AFAC grant are not eligible. Recipients of grants in two consecutive years are ineligible for the next two years.",
    "What to Submit": "Online application form with supporting materials. Submit 24 hours before deadline — AFAC cannot assist with technical issues on deadline day. Preview application forms available on the AFAC website.",
    "Strongest Submission Tips": "AFAC is one of the most important funding bodies for North African filmmakers — covering Morocco, Tunisia, Algeria, Libya, Egypt, Sudan, and Mauritania. These countries are often underserved by sub-Saharan African film initiatives and by European funds. AFAC fills this gap with significant funding and a network connecting North African filmmakers to Arab Gulf financing, European festivals, and global distribution.",
    "CALENDAR REMINDER:": "URGENT: Apply before 2 April 2026. Second AFAC call (for fiction cinema) opens later in 2026.",
    status: "approved",
    votes: 0
  },
  {
    title: "NFVF PRODUCTION & DEVELOPMENT FUNDING (National Film and Video Foundation, South Africa)",
    "What Is It?": "The National Film and Video Foundation is a South African government agency mandated by the Department of Sport, Arts and Culture to support the development, production, marketing, and distribution of South African films. It is the primary public funding body for the South African film industry. The NFVF operates multiple funding tiers: Development Funding for script development; Production Funding for features, documentaries, shorts, and animation (including a dedicated tier for first-time filmmakers seeking a 'calling card' short film); Training Provider Grants; and Marketing & Distribution support for international festivals and markets. The NFVF also sponsors South African delegations to Cannes, Berlin, AFRIFF (Lagos), and the Durban FilmMart.",
    "For Films or Series?": "Feature fiction, documentary, short films, animation. South African content only.",
    "What Do You Get If Selected?": "Funding varies by tier and project. Multiple call cycles per year. First-time filmmaker short film tier available. International delegation support for festivals and markets.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "Multiple call cycles per year. Check the NFVF website for current open calls.",
    "Apply:": "nfvf.co.za/production-funding",
    "Who Can Apply / Eligibility": "South African production companies with relevant experience and a credible track record. First-time filmmakers are eligible for the short film tier specifically.",
    "What to Submit": "Application form and project documentation as specified per funding tier. Full details on the NFVF website.",
    "Strongest Submission Tips": "The NFVF is THE primary South African government film fund. If you are based in South Africa, this should be your first port of call. The first-time filmmaker short film tier is a particularly valuable entry point for emerging talent. The NFVF's international delegation support provides pathways to co-production funds listed elsewhere in this guide — being part of the NFVF delegation to the Durban FilmMart significantly increases your visibility to international co-producers.",
    "CALENDAR REMINDER:": "Check nfvf.co.za regularly for new funding call openings throughout the year.",
    status: "approved",
    votes: 0
  },
  {
    title: "DOHA FILM INSTITUTE (DFI) GRANTS PROGRAMME",
    "What Is It?": "The Doha Film Institute is the primary engine for independent cinema funding in the MENA region, and one of the most important international grant bodies for filmmakers from the Global South. Founded in Qatar, DFI provides non-recoupable funding of up to $100,000 for feature production through its bi-annual grants programme, which has supported over 1,000 projects from 46 countries. Grants are awarded in Spring and Fall cycles. The programme funds projects at three stages: development, production, and post-production. Feature budgets must not exceed $2.2 million. DFI grantees gain access to Qumra, the DFI's annual industry event connecting funded filmmakers to international sales agents, producers, and festival programmers.",
    "For Films or Series?": "Feature fiction, documentary, short film, animation.",
    "What Do You Get If Selected?": "Up to $100,000 for feature production. Non-recoupable funding. Access to Qumra — the DFI's annual industry event. The DFI 'stamp of approval' is widely recognised as a signal of quality that helps trigger additional financing.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "Spring 2026 cycle: CLOSED (8 January 2026). Fall 2026 cycle: Expected to open approximately July–August 2026.",
    "Apply:": "dohafilm.com/en/funding-industry/funding/grants",
    "Who Can Apply / Eligibility": "MENA filmmakers (including North African countries): eligible for all stages — development, production, and post-production. International filmmakers (including sub-Saharan African): generally restricted to first or second-time directors, primarily focused on post-production funding unless there is a significant cultural connection.",
    "What to Submit": "Online application during open cycles. Full project documentation required.",
    "Strongest Submission Tips": "For North African filmmakers (Morocco, Tunisia, Algeria, Libya, Egypt, Sudan, Mauritania), DFI is one of the most accessible and substantial funding sources — with full eligibility across all stages. For sub-Saharan African filmmakers, DFI remains relevant for first and second features at the post-production stage. The fund's 1,000+ project milestone makes a DFI grant a powerful credibility signal for further fundraising.",
    "CALENDAR REMINDER:": "Set a reminder for July 2026 to watch for the Fall 2026 grants cycle opening.",
    status: "approved",
    votes: 0
  },
  {
    title: "SUNDANCE DOCUMENTARY FUND",
    "What Is It?": "The Sundance Institute Documentary Film Program, established in 2002 with founding support from the Open Society Foundations, supports nonfiction filmmakers worldwide in the production of cinematic documentaries on contemporary themes. The Documentary Fund provides grants of $15,000 to $50,000 to documentary projects at development, production, and post-production stages. This is a separate programme from the Sundance Screenwriters Lab and Sundance Episodic Lab (also in this guide), which focus on fiction screenplays and TV pilots respectively. In September 2025, the Documentary Fund announced 32 grantees for its 2025 cycle. At the 2026 Sundance Film Festival, African filmmakers participated prominently — including Nigerian filmmaker Olive Nwosu, Kenyan filmmaker Bea Wangondu, and Nigerian filmmaker Praise Odigie Paige.",
    "For Films or Series?": "Documentary only — features and shorts. Any stage: development, production, or post-production.",
    "What Do You Get If Selected?": "$15,000–$50,000 grant. Sundance Institute support and network access. Association with the world's most prestigious independent film brand.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "2026 cycle expected to open mid-2026. Check sundance.org for announcements.",
    "Apply:": "sundance.org/programs/documentary-film",
    "Who Can Apply / Eligibility": "Global — no geographic restrictions. Strong artistic vision and social relevance are prioritised.",
    "What to Submit": "Project application with treatment, director's statement, work sample, and budget. Full requirements on the Sundance website.",
    "Strongest Submission Tips": "The Sundance name carries unmatched prestige in the independent film world. African documentary filmmakers have an increasingly strong track record at Sundance. A Sundance Documentary Fund grant signals quality to every other funder and distributor in this guide. Pair this with a DFM pitch or an IDFA Forum Pitch for maximum impact.",
    "CALENDAR REMINDER:": "Set a reminder for mid-2026 to watch for the Sundance Documentary Fund call opening.",
    status: "approved",
    votes: 0
  },
  {
    title: "ITVS OPEN CALL (Independent Television Service / PBS)",
    "What Is It?": "The Independent Television Service (ITVS) is a US-based organisation that funds and presents independent documentaries on PBS — America's public broadcasting network reaching 120 million viewers. Its Open Call offers up to $400,000 in co-production funding for independent documentary films, from shorts to features, on any subject and in any style. This is the single largest documentary production fund in this guide. Unlike most grants which offer $10,000–$50,000, ITVS funds at a scale that covers a significant portion of a documentary's budget. ITVS funding comes with PBS broadcast rights in the US.",
    "For Films or Series?": "Documentary only (shorts to features). Any subject, any viewpoint, any style. Must be in active production.",
    "What Do You Get If Selected?": "Up to $400,000 co-production funding. PBS broadcast in the United States. ITVS production and distribution support.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "Rolling applications — open year-round. Allow 2–4 weeks for application preparation.",
    "Apply:": "itvs.org/funds/open-call",
    "Who Can Apply / Eligibility": "Independent producers globally. Projects must be in active production (not pre-production). For pre-production projects, ITVS offers a separate Development Fund.",
    "What to Submit": "Project application including rough cut or work sample, budget, distribution plan. Full requirements on the ITVS website.",
    "Strongest Submission Tips": "At up to $400,000, this is by far the largest single documentary fund in this guide. The PBS broadcast pipeline gives African documentaries access to the US market. African documentary filmmakers who have already secured partial funding (e.g., from Hot Docs–Blue Ice, IDFA Bertha Fund, or Berlinale WCF) can use ITVS to close their financing gap at scale. The rolling application window means there is no deadline pressure.",
    "CALENDAR REMINDER:": "No deadline — apply whenever your project is in active production.",
    status: "approved",
    votes: 0
  },
  {
    title: "FESPACO (Pan-African Film and Television Festival of Ouagadougou)",
    "What Is It?": "FESPACO is Africa's oldest and largest film festival, founded in 1969 in Ouagadougou, Burkina Faso. It is the continent's most important celebration of African cinema, operating on a biennial cycle (odd years). The festival accepts for competition only films by African filmmakers — the only major international-class festival with an exclusively African competition. The Golden Stallion of Yennenga (Étalon d'Or de Yennenga) is Africa's most prestigious film award. The most recent edition (29th, February–March 2025) attracted an estimated audience exceeding 100,000. The 30th edition is confirmed for February/March 2027. UNESCO, the Organisation Internationale de la Francophonie (OIF), and multiple African national film commissions organise delegation support and side programmes.",
    "For Films or Series?": "All formats — feature fiction, documentary, series, animation, short film. Competition restricted to African filmmakers.",
    "What Do You Get If Selected?": "Screening at Africa's most prestigious film festival. Eligibility for the Golden Stallion of Yennenga and other awards. Networking with pan-African and international industry professionals. Visibility to distributors, broadcasters, and co-producers.",
    "Cost": "FREE submission",
    "Next Deadline": "Call for film submissions for the 30th edition (2027) opened 7 February 2026. Check fespaco.bf for deadlines.",
    "Apply:": "fespaco.bf",
    "Who Can Apply / Eligibility": "African filmmakers only. Films must be directed by filmmakers of African nationality or origin.",
    "What to Submit": "Completed film for festival selection. Submission details on the official FESPACO website.",
    "Strongest Submission Tips": "FESPACO is foundational to the African film ecosystem. Having your film selected — or winning the Golden Stallion — establishes your reputation across the entire continent and opens doors to every other opportunity in this guide. Francophone African filmmakers in particular should treat FESPACO as a cornerstone of their festival strategy. The 2027 call is already open — start preparing now.",
    "CALENDAR REMINDER:": "2027 call for films is OPEN NOW. Check fespaco.bf for submission deadline.",
    status: "approved",
    votes: 0
  },
  {
    title: "DOCUBOX — EAST AFRICAN DOCUMENTARY FILM FUND",
    "What Is It?": "Docubox is the only dedicated film fund for East African documentary filmmakers. Founded in 2013 by Kenyan filmmaker Judy Kibinge, it provides development and production grants of $5,000–$20,000 to documentary, short fiction, and experimental filmmakers in Kenya, Uganda, Tanzania, and Rwanda. Beyond funding, Docubox runs workshops, labs, and mentorship programmes. Supported by the Hewlett Foundation, Climate Justice Resilience Fund, and IIED. Alumni include The Letter, an acclaimed Kenyan documentary that secured international distribution. In 2025–2026, Docubox began expanding its model to Morocco.",
    "For Films or Series?": "Documentary, short fiction, experimental. East Africa only (Kenya, Uganda, Tanzania, Rwanda).",
    "What Do You Get If Selected?": "$5,000–$20,000 grant. Workshops, labs, and mentorship. Community of East African documentary filmmakers and alumni network.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "Annual cycle. Check mydocubox.org for current call status.",
    "Apply:": "mydocubox.org/funding",
    "Who Can Apply / Eligibility": "Filmmakers based in Kenya, Uganda, Tanzania, or Rwanda. Documentary, short fiction, and experimental work.",
    "What to Submit": "Project application as specified on the Docubox website.",
    "Strongest Submission Tips": "East Africa has a rapidly growing film sector — particularly Kenya and Tanzania — but has historically been underserved by international film funds. Docubox fills this gap with funding, training, and community. For East African filmmakers, this is the most directly relevant opportunity in this guide.",
    "CALENDAR REMINDER:": "Check mydocubox.org for annual call opening dates.",
    status: "approved",
    votes: 0
  },
  {
    title: "AFRIFF (Africa International Film Festival, Lagos)",
    "What Is It?": "AFRIFF is Africa's premier film festival based in Nigeria, held annually in November in Lagos. Founded in 2010 by Chioma Ude, it has grown into one of the continent's most important platforms for African cinema, with particular strength in connecting Nollywood and the wider West African film ecosystem to international markets. AFRIFF runs a full industry programme including content licensing, co-production deals, and distribution agreements. A notable partnership with MTN — Africa's largest telecommunications company — expands the festival's digital distribution reach. The NFVF sponsors a South African delegation annually.",
    "For Films or Series?": "Features, documentaries, shorts, animation, student films.",
    "What Do You Get If Selected?": "Festival screening and awards eligibility. Access to AFRIFF's industry programme including content licensing, co-production deals, and distribution agreements. Networking with pan-African and international industry professionals.",
    "Cost": "Submission fee via FilmFreeway",
    "Next Deadline": "Annual. Submissions typically open mid-year for November festival. Check afriff.com for 2026 dates.",
    "Apply:": "afriff.com",
    "Who Can Apply / Eligibility": "Open to filmmakers globally, with focus on African cinema. Submissions via FilmFreeway.",
    "What to Submit": "Completed film via FilmFreeway. Details on the AFRIFF website.",
    "Strongest Submission Tips": "AFRIFF is the primary industry platform for Nigeria's film sector — the largest in Africa by volume. For West African filmmakers, AFRIFF is the gateway to international co-production networks. Combined with the Durban FilmMart (Southern Africa) and FESPACO (Francophone Africa), AFRIFF completes the trio of continent-defining African film industry events.",
    "CALENDAR REMINDER:": "Watch afriff.com from mid-2026 for submission opening dates.",
    status: "approved",
    votes: 0
  },
  {
    title: "ACP-EU CULTURE PROGRAMME",
    "What Is It?": "The ACP-EU Culture Programme is funded by the European Union to support cultural and creative industries in African, Caribbean, and Pacific (ACP) countries. It provides grants of up to €200,000 or more for international co-production, film development, and distribution projects that involve collaboration between ACP and European production companies. This is one of the largest structured co-production funding mechanisms available to African filmmakers, supporting fiction, documentary, animation, short films, and web content.",
    "For Films or Series?": "Fiction, documentary, animation, short film, web content. Must be international co-production.",
    "What Do You Get If Selected?": "Up to €200,000+ depending on project scope. Co-production support, development funding, and distribution assistance.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "Periodic calls for proposals. Check acp-ue-culture.eu for current opportunities.",
    "Apply:": "acp-ue-culture.eu/en",
    "Who Can Apply / Eligibility": "Production companies from ACP countries (all of Sub-Saharan Africa, plus Caribbean and Pacific nations) in partnership with EU-based companies. Requires at least two production companies working together — one from an ACP country and one from the EU.",
    "What to Submit": "Project proposal as specified in the call for proposals.",
    "Strongest Submission Tips": "At up to €200,000, this is one of the largest funding opportunities available. It explicitly requires the kind of Africa-EU co-production partnerships that many programmes in this guide facilitate. If you have connected with a European producer at CineMart, Berlinale Co-Pro Series Market, or TorinoFilmLab, the ACP-EU Culture Programme is a natural next step for significant production financing.",
    "CALENDAR REMINDER:": "Monitor acp-ue-culture.eu for periodic calls for proposals.",
    status: "approved",
    votes: 0
  },
  {
    title: "MULTICHOICE TALENT FACTORY (MTF)",
    "What Is It?": "The MultiChoice Talent Factory is a pan-African film and television training programme operated by the MultiChoice Group (now owned by Canal+). It runs three regional academies: West Africa (Lagos, Nigeria), East Africa (Nairobi, Kenya), and Southern Africa (Lusaka, Zambia). Each academy accepts approximately 20 students per cohort for a fully-sponsored 12-month programme covering directing, producing, cinematography, editing, sound design, and other screen crafts. Students work on real productions during the programme. MTF also runs masterclasses, alumni networking events, and industry partnerships. Despite the Showmax shutdown in March 2026, MTF continues as a separate CSR initiative.",
    "For Films or Series?": "Training programme covering all formats — film and television production.",
    "What Do You Get If Selected?": "Fully-sponsored 12-month programme — tuition, accommodation, and living expenses covered. Hands-on production experience on real projects. Continental alumni network. Industry masterclasses.",
    "Cost": "FREE — Fully sponsored",
    "Next Deadline": "2026 applications CLOSED (deadline was 27 February 2026). 2027 applications expected to open approximately January–February 2027.",
    "Apply:": "multichoicetalentfactory.com",
    "Who Can Apply / Eligibility": "Aspiring filmmakers and media professionals from across Africa. Must hold at least a tertiary qualification.",
    "What to Submit": "Application form, portfolio of work, and motivation. Full details on the MTF website.",
    "Strongest Submission Tips": "This is the only structured pan-African training programme at this scale — fully funded, 12 months, with three regional hubs. For emerging filmmakers who have not yet had access to formal industry training, MTF is an unmatched entry point. Graduates enter a continental alumni network and gain production credits that strengthen applications to every development lab and fund in this guide.",
    "CALENDAR REMINDER:": "Set a reminder for January 2027 to watch for 2027 MTF applications opening.",
    status: "approved",
    votes: 0
  },
  {
    title: "CPH:FORUM (CPH:DOX Copenhagen Documentary Festival)",
    "What Is It?": "CPH:FORUM is the flagship financing and co-production event of CPH:DOX — the Copenhagen International Documentary Film Festival. Each March, approximately 30 documentary projects are selected for live pitch presentations to international financiers, broadcasters, and distributors. The 2026 edition brought together 101 directors and producers from 23 countries. CPH:FORUM also includes CPH:ROUGHCUT (for post-production projects) and CHANGE (for impact-driven documentaries). Alongside IDFA Forum Pitch (Amsterdam, November) and Sheffield DocFest MeetMarket (June), CPH:FORUM completes the trio of the world's most important documentary financing forums.",
    "For Films or Series?": "Documentary only. Projects from early development to late production.",
    "What Do You Get If Selected?": "Live pitch to international financiers, broadcasters, sales agents, and distributors. Co-production meetings. Awards and prizes. Access to the full CPH:DOX industry programme.",
    "Cost": "Accreditation fee for CPH:DOX industry programme",
    "Next Deadline": "Annual, March. 2026 edition complete. Submissions for 2027 typically open in autumn 2026.",
    "Apply:": "cphdox.dk",
    "Who Can Apply / Eligibility": "Documentary filmmakers globally. Projects selected by CPH:DOX programming team.",
    "What to Submit": "Project submission via CPH:DOX platform. Details published when call opens.",
    "Strongest Submission Tips": "Target all three of the world's top documentary financing forums in sequence: CPH:FORUM (March), Sheffield MeetMarket (June), and IDFA Forum Pitch (November). Same universe of European broadcasters, funds, and sales agents — three chances per year. Having an IDFA Bertha Fund or Hot Docs–Blue Ice grant already in place significantly strengthens a CPH:FORUM application.",
    "CALENDAR REMINDER:": "Set a reminder for autumn 2026 to watch for CPH:FORUM 2027 submissions opening.",
    status: "approved",
    votes: 0
  },
  {
    title: "AFRICA NO FILTER / KEKERE STORYTELLERS FUND",
    "What Is It?": "Africa No Filter is a donor collaborative focused on shifting stereotypical narratives about Africa. Its Kekere Storytellers Fund provides micro-grants to emerging African content creators, wordsmiths, performance artists, visual artists, and journalists whose work tells African stories 'beyond stereotypes of poverty, conflict, disease, poor leadership, and corruption.' The fund supports short films (up to $5,000), feature films (up to $10,000), documentaries, digital storytelling, and youth-led content.",
    "For Films or Series?": "Short films, feature films, documentaries, digital storytelling, youth-led content.",
    "What Do You Get If Selected?": "Micro-grants: up to $5,000 for shorts, up to $10,000 for features. Part of the Africa No Filter narrative change ecosystem.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "Periodic calls. Check africanofilter.org for current opportunities.",
    "Apply:": "africanofilter.org/kekere-storytellers-fund",
    "Who Can Apply / Eligibility": "Filmmakers and content creators based in Africa or members of the African diaspora. Members of the African Narrative Collective are prioritised.",
    "What to Submit": "Project proposal as specified in the call. Details on the Africa No Filter website.",
    "Strongest Submission Tips": "This fund fills a critical gap for emerging creators who need smaller amounts to get started — amounts that larger funds like HBF or WCF do not typically provide. The 'narrative-shifting' mandate aligns with the broader movement toward authentic African storytelling. A completed short film funded by Africa No Filter can serve as the 'proof of concept' that strengthens applications to larger development labs and production funds.",
    "CALENDAR REMINDER:": "Monitor africanofilter.org for periodic call openings.",
    status: "approved",
    votes: 0
  },
  {
    title: "MERCK FOUNDATION FILM AWARDS 2026",
    "What Is It?": "The Merck Foundation Film Awards 'More Than a Mother' is an annual competition launched in partnership with African First Ladies, inviting African filmmakers, film students, and young creative talents to submit long or short films addressing critical social issues including infertility stigma, girls' education, women empowerment, child marriage, and FGM. The awards accept drama, documentary, and docudrama submissions. Cash prizes are awarded across categories.",
    "For Films or Series?": "Long or short films — drama, documentary, or docudrama. Must address one of the Merck Foundation's focus themes.",
    "What Do You Get If Selected?": "Cash prizes across categories. Visibility through Merck Foundation's partnership with African First Ladies. Recognition as a social-impact filmmaker.",
    "Cost": "FREE — No application fee",
    "Next Deadline": "OPEN NOW. Deadline: 30 September 2026.",
    "Apply:": "merck-foundation.com/Awards/merck-foundation-film-awards-more-than-a-mother",
    "Who Can Apply / Eligibility": "All African filmmakers, film students, and young creative talents.",
    "What to Submit": "Completed long or short film (drama, documentary, or docudrama) addressing one of the specified social themes.",
    "Strongest Submission Tips": "The long application window (until September 2026) and broad eligibility make this accessible for filmmakers currently in production on a relevant project. The partnership with African First Ladies provides political visibility. The social-impact theme aligns with priorities of many international documentary funds (IDFA Bertha Fund, Hot Docs–Blue Ice, Sundance Documentary Fund) — a Merck Foundation award strengthens applications to these larger funds.",
    "CALENDAR REMINDER:": "Deadline 30 September 2026. Plenty of time to submit.",
    status: "approved",
    votes: 0
  }
];

async function migrate() {
  console.log(`Inserting ${newOpportunities.length} new opportunities into Supabase...`);
  
  for (const opp of newOpportunities) {
    const { data, error } = await supabase
      .from('opportunities')
      .insert([opp])
      .select()
      .single();
    
    if (error) {
      console.error(`FAILED: ${opp.title}`, error.message);
    } else {
      console.log(`✓ ${data.id}: ${opp.title}`);
    }
  }
  
  console.log('\nDone! Check your site.');
}

migrate();
