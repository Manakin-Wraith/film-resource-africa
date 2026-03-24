-- Seed: Enrich South Africa & Nigeria with resource data
-- Run AFTER enrich_countries_table.sql
-- Run in Supabase SQL Editor

-- ============================================================
-- SOUTH AFRICA
-- ============================================================
UPDATE countries SET
  film_commission = '{
    "name": "National Film and Video Foundation (NFVF)",
    "website": "https://www.nfvf.co.za",
    "email": "info@nfvf.co.za",
    "phone": "+27 11 483 0880",
    "address": "87 Central Street, Houghton, Johannesburg 2198"
  }'::jsonb,

  co_production_treaties = '[
    { "country": "Canada", "treaty_name": "SA-Canada Co-Production Treaty", "year": 1997, "details": "Covers film and television co-productions. Administered by NFVF and Telefilm Canada." },
    { "country": "France", "treaty_name": "SA-France Co-Production Agreement", "year": 2010, "details": "Bilateral treaty covering feature films, documentaries, and animation." },
    { "country": "Germany", "treaty_name": "SA-Germany Co-Production Treaty", "year": 2004, "details": "Covers feature films and documentaries. Administered by NFVF and FFA." },
    { "country": "Italy", "treaty_name": "SA-Italy Co-Production Treaty", "year": 2003, "details": "Bilateral agreement for film and television co-productions." },
    { "country": "Ireland", "treaty_name": "SA-Ireland Co-Production Treaty", "year": 2012, "details": "Covers feature films, animation, and creative documentaries." },
    { "country": "United Kingdom", "treaty_name": "SA-UK Co-Production Treaty", "year": 2006, "details": "Covers film and television. Administered by NFVF and BFI." },
    { "country": "Australia", "treaty_name": "SA-Australia Co-Production Treaty", "year": 2000, "details": "Bilateral treaty for film, television, and animation co-productions." },
    { "country": "Netherlands", "treaty_name": "SA-Netherlands Co-Production Agreement", "year": 2006, "details": "Covers film and television co-productions between the two countries." },
    { "country": "New Zealand", "treaty_name": "SA-New Zealand Co-Production Treaty", "year": 2011, "details": "Bilateral agreement covering feature films and documentaries." }
  ]'::jsonb,

  key_resources = '[
    { "name": "National Film and Video Foundation (NFVF)", "url": "https://www.nfvf.co.za", "type": "government", "description": "Primary national body supporting and promoting the South African film industry through funding, training, and policy." },
    { "name": "DTI Film & Television Production Incentive", "url": "https://www.thedtic.gov.za", "type": "fund", "description": "Government incentive offering 20-25% rebate on qualifying SA production expenditure for local productions, and 25% for foreign productions." },
    { "name": "Industrial Development Corporation (IDC)", "url": "https://www.idc.co.za", "type": "fund", "description": "Provides film production financing through debt and equity funding for commercially viable projects." },
    { "name": "Wesgro Film & Media Promotion", "url": "https://www.wesgro.co.za/film", "type": "government", "description": "Western Cape film commission promoting Cape Town and surrounds as a world-class filming destination." },
    { "name": "Gauteng Film Commission", "url": "https://www.gautengfilm.org.za", "type": "government", "description": "Provincial film commission supporting productions in Johannesburg, Pretoria, and the Gauteng region." },
    { "name": "KwaZulu-Natal Film Commission", "url": "https://www.kwazulunatalfilm.co.za", "type": "government", "description": "Provincial body promoting film production in Durban and KwaZulu-Natal." },
    { "name": "Durban FilmMart (DFM)", "url": "https://www.durbanfilmmart.co.za", "type": "festival_org", "description": "Africa''s premier film finance and co-production market, held annually during the Durban International Film Festival." },
    { "name": "Encounters South African International Documentary Festival", "url": "https://www.encounters.co.za", "type": "festival_org", "description": "Leading documentary film festival in Africa, held in Cape Town and Johannesburg." }
  ]'::jsonb,

  filming_locations = '[
    { "name": "Cape Town & Western Cape", "region": "Western Cape", "description": "Diverse locations from Table Mountain to the Cape Winelands. World-class studios at Cape Town Film Studios. Doubles for Mediterranean, tropical, and urban settings.", "notable_productions": ["Blood Diamond", "Safe House", "Black Sails", "Maze Runner"] },
    { "name": "Johannesburg & Gauteng", "region": "Gauteng", "description": "Urban landscapes, townships, and modern cityscapes. Home to most post-production facilities and the largest talent pool in Africa.", "notable_productions": ["Tsotsi", "District 9", "Avengers: Age of Ultron", "The Woman King"] },
    { "name": "Durban & KwaZulu-Natal", "region": "KwaZulu-Natal", "description": "Subtropical coastline, lush valleys, and the Drakensberg mountains. Growing studio infrastructure with tax incentives.", "notable_productions": ["Zulu", "Long Walk to Freedom"] },
    { "name": "Garden Route", "region": "Western/Eastern Cape", "description": "Dramatic coastal scenery, indigenous forests, and small-town charm. Popular for road-trip sequences and nature documentaries.", "notable_productions": [] },
    { "name": "Mpumalanga & Kruger Region", "region": "Mpumalanga", "description": "Lowveld bush, the Blyde River Canyon, and proximity to Kruger National Park. Ideal for wildlife and adventure productions.", "notable_productions": [] },
    { "name": "Free State & Karoo", "region": "Free State/Northern Cape", "description": "Vast open plains, semi-desert Karoo landscapes, and big skies. Used for Westerns and post-apocalyptic settings.", "notable_productions": ["Mad Max: Fury Road (pre-production)", "Tremors 5"] }
  ]'::jsonb,

  industry_associations = '[
    { "name": "South African Guild of Actors (SAGA)", "website": "https://www.saguildofactors.co.za", "description": "Professional body representing actors and performers in South Africa." },
    { "name": "Independent Producers Organisation (IPO)", "website": "https://www.ipo.org.za", "description": "Represents independent film and television producers. Advocates for industry policy and fair practices." },
    { "name": "South African Screen Federation (SASFED)", "website": "https://www.sasfed.org", "description": "Umbrella body for the South African screen sector, representing guilds, unions, and industry associations." },
    { "name": "Directors Guild of Southern Africa", "website": "", "description": "Professional guild for directors working in film, television, and commercials across Southern Africa." },
    { "name": "Animation South Africa (ASA)", "website": "https://www.animationsa.org", "description": "Industry body promoting and developing the South African animation sector." },
    { "name": "South African Society of Cinematographers (SASC)", "website": "https://sasc.co.za", "description": "Professional society for directors of photography and cinematographers." }
  ]'::jsonb,

  practical_info = '{
    "currency": "South African Rand (ZAR)",
    "languages": ["English", "Zulu", "Xhosa", "Afrikaans", "Sotho", "Tswana"],
    "timezone": "SAST (UTC+2)",
    "power_standard": "Type M plug, 230V 50Hz",
    "visa_info": "Many nationalities can enter visa-free for up to 90 days. Work permits required for paid crew. Film-specific permits vary by province and municipality."
  }'::jsonb,

  production_guide_url = 'https://www.nfvf.co.za/production-guide'

WHERE slug = 'south-africa';


-- ============================================================
-- NIGERIA
-- ============================================================
UPDATE countries SET
  film_commission = '{
    "name": "National Film and Video Censors Board (NFVCB)",
    "website": "https://www.nfvcb.gov.ng",
    "email": "info@nfvcb.gov.ng",
    "phone": "+234 9 413 3814",
    "address": "Plot 1067, Sapele Close, Off Ekukinam Street, Area 3, Garki, Abuja"
  }'::jsonb,

  co_production_treaties = '[
    { "country": "South Africa", "treaty_name": "Nigeria-South Africa Bilateral Film Agreement", "year": 2016, "details": "Framework agreement to promote co-productions and skills exchange between Nollywood and South African filmmakers." },
    { "country": "France", "treaty_name": "Nigeria-France Cultural Cooperation", "year": 2018, "details": "Includes provisions for film co-production and cultural exchange. Facilitated through the French Institute in Nigeria." },
    { "country": "United Kingdom", "treaty_name": "Nigeria-UK Creative Industries Partnership", "year": 2019, "details": "Broad creative industries agreement with specific film and television provisions. Supported by the British Council." }
  ]'::jsonb,

  key_resources = '[
    { "name": "National Film and Video Censors Board (NFVCB)", "url": "https://www.nfvcb.gov.ng", "type": "government", "description": "Regulates the film and video industry in Nigeria. Handles classification, censorship, and licensing." },
    { "name": "Lagos State Film & Video Censors Board", "url": "", "type": "government", "description": "Manages filming permits and regulations specific to Lagos State, the primary hub of Nollywood production." },
    { "name": "Creative Industry Financing Initiative (CIFI)", "url": "https://www.boi.ng", "type": "fund", "description": "Bank of Industry initiative providing low-interest loans to film producers, distributors, and cinema operators." },
    { "name": "Bank of Industry (BOI) Nollywood Fund", "url": "https://www.boi.ng", "type": "fund", "description": "Dedicated funding window for Nigerian film productions with commercial viability." },
    { "name": "Nigerian Export Promotion Council (NEPC)", "url": "https://www.nepc.gov.ng", "type": "government", "description": "Supports the export of Nigerian creative content including film through grants and market access programs." },
    { "name": "Africa International Film Festival (AFRIFF)", "url": "https://www.afriff.com", "type": "festival_org", "description": "Leading international film festival in Nigeria, held annually in Lagos. Includes industry programs, masterclasses, and a talent market." },
    { "name": "iREP International Documentary Film Festival", "url": "https://www.irepfilmfestival.com", "type": "festival_org", "description": "Nigeria''s premier documentary film festival, showcasing African and international non-fiction works." }
  ]'::jsonb,

  filming_locations = '[
    { "name": "Lagos", "region": "South-West", "description": "Nigeria''s largest city and commercial capital. Offers everything from modern skyline shots on Victoria Island to the energy of Lagos Mainland markets and the historic streets of Lagos Island.", "notable_productions": ["The Wedding Party", "King of Boys", "Citation", "Gangs of Lagos"] },
    { "name": "Abuja", "region": "Federal Capital Territory", "description": "Nigeria''s planned capital city with modern architecture, wide boulevards, and government buildings. Clean urban settings that contrast with the bustle of Lagos.", "notable_productions": [] },
    { "name": "Calabar", "region": "South-South (Cross River)", "description": "Colonial-era architecture, lush tropical surroundings, and the famous Obudu Mountain Resort. Increasingly used for period and nature productions.", "notable_productions": [] },
    { "name": "Benin City", "region": "South-South (Edo)", "description": "Rich cultural heritage with the ancient Benin Kingdom history. Home to growing production infrastructure and Edo-language cinema.", "notable_productions": [] },
    { "name": "Enugu / South-East", "region": "South-East", "description": "Known as the birthplace of Nollywood. Rolling hills, coal mines, and Igbo cultural settings. Still a major production centre.", "notable_productions": ["Living in Bondage"] },
    { "name": "Jos & Plateau State", "region": "North-Central", "description": "Temperate climate, rocky terrain, and scenic waterfalls. Offers unique highland landscapes rarely seen in West African cinema.", "notable_productions": [] }
  ]'::jsonb,

  industry_associations = '[
    { "name": "Directors Guild of Nigeria (DGN)", "website": "https://www.dgn.ng", "description": "Professional guild representing Nigerian film and television directors." },
    { "name": "Association of Movie Producers (AMP)", "website": "", "description": "Major industry body representing Nollywood producers. Advocates for industry regulation and standards." },
    { "name": "Actors Guild of Nigeria (AGN)", "website": "", "description": "Represents actors and performers across Nigeria. The largest actors'' guild in Africa." },
    { "name": "Screenwriters Guild of Nigeria", "website": "", "description": "Professional body for screenwriters working in Nigerian film and television." },
    { "name": "Cinema Exhibitors Association of Nigeria (CEAN)", "website": "", "description": "Represents cinema operators and exhibitors. Advocates for cinema infrastructure development." },
    { "name": "Nigerian Society of Cinematographers (NSC)", "website": "", "description": "Professional society for directors of photography and camera operators working in Nigeria." }
  ]'::jsonb,

  practical_info = '{
    "currency": "Nigerian Naira (NGN)",
    "languages": ["English", "Yoruba", "Igbo", "Hausa", "Pidgin English"],
    "timezone": "WAT (UTC+1)",
    "power_standard": "Type D/G plug, 240V 50Hz — backup generators essential",
    "visa_info": "Most nationalities require a visa. Business visa or specific filming permits needed for production work. Nigerian Immigration Service handles applications."
  }'::jsonb,

  production_guide_url = NULL

WHERE slug = 'nigeria';
