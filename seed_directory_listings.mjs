#!/usr/bin/env node
/**
 * Reusable seed script for directory listings.
 *
 * Usage:
 *   node seed_directory_listings.mjs                     # seed all countries in DATA
 *   node seed_directory_listings.mjs --country "Kenya"   # seed only Kenya
 *   node seed_directory_listings.mjs --dry-run            # preview without inserting
 *
 * Add new countries by appending to the DATA array below.
 * Reads Supabase credentials from .env.local (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY or ANON_KEY).
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Listing data ────────────────────────────────────────────
// Each entry follows the directory_listings schema.
// directory_type: company | crew | service | training | agency
// status defaults to 'approved' so listings appear immediately.

const DATA = [
  // ============ SOUTH AFRICA — Companies ============
  { name: 'Triggerfish Animation Studios', directory_type: 'company', category: 'Animation', description: "Africa's leading animation studio. Produced Netflix and Disney projects. Pioneered remote collaboration across the continent.", country: 'South Africa', city: 'Cape Town', website: 'https://www.triggerfishstudios.com', speciality: 'Animation, Feature Film, Series', notable_projects: 'Seal Team, Khumba, Mama K\'s Team 4 (Netflix)', year_founded: 1996, company_size: 'major' },
  { name: 'Film Afrika Worldwide', directory_type: 'company', category: 'Line Production', description: "One of Africa's largest service production companies. Full-service line production for international features, commercials, and series.", country: 'South Africa', city: 'Johannesburg', website: 'https://www.filmafrika.com', speciality: 'Line Production, Service Production, Commercial', notable_projects: 'Avengers: Age of Ultron, The Woman King, Blood Diamond', year_founded: 1990, company_size: 'major' },
  { name: 'Videovision Entertainment', directory_type: 'company', category: 'Fiction', description: 'Leading South African production company behind award-winning local and international features and television.', country: 'South Africa', city: 'Durban', website: 'https://www.videovision.co.za', speciality: 'Feature Film, Television, Documentary', notable_projects: 'Tsotsi (Academy Award), Yesterday, Zulu Love Letter', year_founded: 1990, company_size: 'major' },
  { name: 'Moonlighting Films', directory_type: 'company', category: 'Commercial', description: 'Premier commercial production company. Award-winning work across advertising, branded content, and music videos.', country: 'South Africa', city: 'Cape Town', website: 'https://www.moonlighting.co.za', speciality: 'Commercial, Branded Content, Music Video', notable_projects: 'Multiple Cannes Lions, Loeries Grand Prix campaigns', year_founded: 1997, company_size: 'major' },
  { name: 'Urucu Media', directory_type: 'company', category: 'Fiction', description: 'Independent production company focused on authentic African stories for local and international audiences.', country: 'South Africa', city: 'Cape Town', website: 'https://www.urucumedia.com', speciality: 'Feature Film, Series, Documentary', notable_projects: 'Five Fingers for Marseilles, This Is Not a Burial It\'s a Resurrection', year_founded: 2012, company_size: 'mid' },
  { name: 'Gambit Films', directory_type: 'company', category: 'Fiction', description: 'Award-winning production company creating bold South African cinema. Known for socially relevant narratives.', country: 'South Africa', city: 'Johannesburg', website: 'https://www.gambitfilms.com', speciality: 'Feature Film, Documentary, Series', notable_projects: 'Of Good Report, Inxeba (The Wound)', year_founded: 2009, company_size: 'mid' },
  { name: 'Chocolate Tribe', directory_type: 'company', category: 'VFX & CGI', description: 'Visual effects and animation studio delivering world-class VFX for local and international productions.', country: 'South Africa', city: 'Cape Town', website: 'https://www.chocolatetribe.com', speciality: 'VFX, CGI, Animation, Motion Graphics', notable_projects: 'Blood & Water (Netflix), Raised by Wolves', year_founded: 2005, company_size: 'mid' },
  { name: 'Cape Town Film Studios', directory_type: 'company', category: 'Studio / Facility', description: "Africa's first custom-built Hollywood-style film studio. 4 sound stages, backlot, workshops, and full production infrastructure.", country: 'South Africa', city: 'Cape Town', website: 'https://www.capetownfilmstudios.co.za', speciality: 'Sound Stages, Backlot, Production Facilities', notable_projects: 'Maze Runner, Black Sails, Blood Drive', year_founded: 2010, company_size: 'major' },
  { name: 'Known Associates Entertainment', directory_type: 'company', category: 'Fiction', description: 'Dynamic production company creating premium local content for South African and international broadcasters.', country: 'South Africa', city: 'Johannesburg', website: 'https://www.knownassociates.co.za', speciality: 'Television Series, Feature Film', notable_projects: 'Reyka (M-Net/Fremantle), Blood Psalms', year_founded: 2015, company_size: 'mid' },
  { name: 'Cinga Films', directory_type: 'company', category: 'Co-Production', description: 'Boutique co-production company specialising in South-South and European co-productions with African talent.', country: 'South Africa', city: 'Cape Town', speciality: 'Co-Production, Feature Film, Documentary', notable_projects: 'Multiple Africa-Europe co-productions', year_founded: 2014, company_size: 'indie' },

  // ============ SOUTH AFRICA — Services ============
  { name: 'Media Film Service', directory_type: 'service', category: 'Gear House', description: "One of South Africa's largest camera and lighting rental houses. ARRI, RED, Sony, and full grip packages.", country: 'South Africa', city: 'Cape Town', website: 'https://www.mediafilmservice.com', service_type: 'Camera Rental, Lighting, Grip', pricing_tier: 'premium' },
  { name: 'Panalux South Africa', directory_type: 'service', category: 'Gear House', description: 'International lighting rental company with full South African operations. LED, HMI, tungsten, and rigging.', country: 'South Africa', city: 'Cape Town', website: 'https://www.panalux.com', service_type: 'Lighting Rental, Rigging', pricing_tier: 'premium' },
  { name: 'Panavision Cape Town', directory_type: 'service', category: 'Gear House', description: 'World-renowned camera rental house with Cape Town facility. Full Panavision and ARRI camera systems.', country: 'South Africa', city: 'Cape Town', website: 'https://www.panavision.com', service_type: 'Camera Rental, Lenses, Accessories', pricing_tier: 'premium' },
  { name: 'Digital Film', directory_type: 'service', category: 'Gear House', description: 'Full-service camera, lighting, and grip rental. Specialises in RED, ARRI, and Sony camera systems for features and commercials.', country: 'South Africa', city: 'Cape Town', website: 'https://www.digitalfilm.co.za', service_type: 'Camera Rental, Lighting, Grip', pricing_tier: 'mid' },
  { name: 'Blade Films', directory_type: 'service', category: 'Aerial & Drone', description: 'Aerial cinematography specialists. Licensed drone and helicopter filming for features, commercials, and documentaries.', country: 'South Africa', city: 'Cape Town', website: 'https://www.bladefilms.co.za', service_type: 'Aerial Cinematography, Drone, Helicopter', pricing_tier: 'premium' },
  { name: 'Refinery Post Production', directory_type: 'service', category: 'Post-Production', description: 'Full post-production facility: offline/online editing, color grading, VFX, and sound design for film and TV.', country: 'South Africa', city: 'Johannesburg', website: 'https://www.refinerypost.co.za', service_type: 'Editing, Color Grading, VFX, Sound', pricing_tier: 'premium' },
  { name: 'Studio 52', directory_type: 'service', category: 'Sound Studio', description: 'Dolby-certified sound mixing and recording studio. ADR, Foley, sound design, and 5.1/7.1 mixing for cinema.', country: 'South Africa', city: 'Johannesburg', service_type: 'Sound Mixing, ADR, Foley, Sound Design', pricing_tier: 'premium' },
  { name: 'The Blowfish Agency', directory_type: 'service', category: 'Location Services', description: 'Full-service location scouting and management across South Africa. Specialises in international productions needing diverse SA locations.', country: 'South Africa', city: 'Cape Town', website: 'https://www.blowfish.co.za', service_type: 'Location Scouting, Location Management', pricing_tier: 'mid' },
  { name: 'Panda Post', directory_type: 'service', category: 'DCP & Deliverables', description: 'Digital cinema mastering, DCP creation, and deliverables preparation for festival and theatrical distribution.', country: 'South Africa', city: 'Cape Town', service_type: 'DCP, Mastering, Deliverables, QC', pricing_tier: 'mid' },
  { name: 'Cape Casting', directory_type: 'service', category: 'Casting', description: 'Established casting agency for film, TV, and commercials. Extensive talent database across all demographics.', country: 'South Africa', city: 'Cape Town', service_type: 'Casting, Talent Search', pricing_tier: 'mid' },

  // ============ SOUTH AFRICA — Agencies ============
  { name: 'Artists International Group (AIG)', directory_type: 'agency', category: 'Talent Agency', description: 'Leading South African talent agency representing actors, presenters, and performers for film, TV, and stage.', country: 'South Africa', city: 'Johannesburg' },
  { name: 'Gaenor Artiste Management', directory_type: 'agency', category: 'Talent Agency', description: 'Boutique talent agency representing top South African actors and performers for local and international work.', country: 'South Africa', city: 'Cape Town' },
  { name: 'MoB Agency', directory_type: 'agency', category: 'Crew Agency', description: 'Creative crew booking agency connecting international productions with experienced South African crew members.', country: 'South Africa', city: 'Cape Town' },
  { name: 'Lew Gillenson & Associates', directory_type: 'agency', category: 'Sales Agent', description: 'South African sales agent handling international distribution for African feature films and documentaries.', country: 'South Africa', city: 'Johannesburg' },
  { name: 'Cinephil (SA Rep)', directory_type: 'agency', category: 'Sales Agent', description: 'International sales agent with strong African film catalogue. Handles festival strategy and global distribution for SA films.', country: 'South Africa', city: 'Cape Town', website: 'https://www.cinephil.com' },

  // ============ SOUTH AFRICA — Training ============
  { name: 'AFDA', directory_type: 'training', category: 'Film School', description: "South Africa's leading film school with campuses in JHB, CPT, DBN, and PE. Offers BA and Honours degrees in film.", country: 'South Africa', city: 'Johannesburg', website: 'https://www.afda.co.za', program_type: 'school', duration: '3-4 years (degree)', cost: 'R60,000-R90,000/year' },
  { name: 'Big Fish School of Digital Filmmaking', directory_type: 'training', category: 'Film School', description: 'Hands-on digital filmmaking school offering 1-2 year diplomas. Focus on practical production skills.', country: 'South Africa', city: 'Cape Town', website: 'https://www.bigfish.co.za', program_type: 'school', duration: '1-2 years (diploma)', cost: 'R40,000-R70,000/year' },
  { name: 'Realness Institute', directory_type: 'training', category: 'Incubator', description: 'Pan-African creative residency and development lab for emerging filmmakers. Script development, directing, and producing labs.', country: 'South Africa', city: 'Johannesburg', website: 'https://www.realness.institute', program_type: 'mentorship', duration: '2-12 weeks (residency)', cost: 'Fully funded' },
  { name: 'The Animation School', directory_type: 'training', category: 'Film School', description: 'Specialised animation training with 2D, 3D, and stop-motion programs. Produces industry-ready animators for Africa.', country: 'South Africa', city: 'Cape Town', website: 'https://www.theanimationschool.co.za', program_type: 'school', duration: '1-3 years', cost: 'R50,000-R80,000/year' },
  { name: 'Wits School of Arts — Film & Television', directory_type: 'training', category: 'Film School', description: 'University of the Witwatersrand film department. BA, Honours, and MA in Film & Television.', country: 'South Africa', city: 'Johannesburg', website: 'https://www.wits.ac.za/wsoa', program_type: 'school', duration: '3-4 years (degree)', cost: 'Varies (subsidised)' },

  // ============ NIGERIA — Companies ============
  { name: 'EbonyLife Studios', directory_type: 'company', category: 'Fiction', description: 'Founded by Mo Abudu. Premium film and TV production powerhouse with a Netflix deal and EbonyLife Place entertainment complex.', country: 'Nigeria', city: 'Lagos', website: 'https://www.ebonylifetv.com', speciality: 'Feature Film, Television Series, Streaming', notable_projects: 'Chief Daddy, Castle & Castle, Blood Sisters (Netflix)', year_founded: 2013, company_size: 'major' },
  { name: 'Inkblot Productions', directory_type: 'company', category: 'Fiction', description: 'Leading commercial film production company. Consistent box office hits that blend Nollywood storytelling with global production values.', country: 'Nigeria', city: 'Lagos', website: 'https://www.inkblotproductions.com', speciality: 'Feature Film, Cinema Release', notable_projects: 'The Wedding Party, New Money, The Set Up', year_founded: 2010, company_size: 'major' },
  { name: 'Kunle Afolayan Productions (KAP)', directory_type: 'company', category: 'Fiction', description: 'Award-winning studio founded by Kunle Afolayan. Known for high-quality Nigerian features with international festival pedigree.', country: 'Nigeria', city: 'Lagos', website: 'https://www.kunleafolayan.com', speciality: 'Feature Film, Documentary, Series', notable_projects: 'October 1, Citation, Anikulapo (Netflix)', year_founded: 2005, company_size: 'major' },
  { name: 'FilmOne Entertainment', directory_type: 'company', category: 'Distribution', description: "Nigeria's leading film distribution and production company. Dominates Nollywood theatrical distribution.", country: 'Nigeria', city: 'Lagos', website: 'https://www.filmoneng.com', speciality: 'Distribution, Production, Cinema Exhibition', notable_projects: 'Distributed 60%+ of Nigerian box office hits', year_founded: 2008, company_size: 'major' },
  { name: 'Anthill Studios', directory_type: 'company', category: 'Animation', description: "Nigeria's leading animation and VFX studio. Creating world-class animated content from Africa for global audiences.", country: 'Nigeria', city: 'Abuja', website: 'https://www.anthillstudios.com', speciality: 'Animation, VFX, Gaming', notable_projects: 'Ladybug (animated series), VFX for Nollywood features', year_founded: 2014, company_size: 'mid' },
  { name: 'Nemsia Films', directory_type: 'company', category: 'Fiction', description: 'Independent production company led by Kemi Adetiba. Creates culturally impactful Nigerian stories with mainstream appeal.', country: 'Nigeria', city: 'Lagos', speciality: 'Feature Film, Television', notable_projects: 'King of Boys, King of Boys: The Return of the King (Netflix)', year_founded: 2015, company_size: 'mid' },
  { name: 'Natives Media', directory_type: 'company', category: 'Documentary', description: 'Documentary and unscripted content company telling untold Nigerian and African stories. Festival and streaming focus.', country: 'Nigeria', city: 'Lagos', speciality: 'Documentary, Unscripted, Short Film', notable_projects: 'Multiple AFRIFF and iREP selections', year_founded: 2016, company_size: 'indie' },
  { name: 'Temple Productions', directory_type: 'company', category: 'Fiction', description: "Young, dynamic production company behind some of Nollywood's recent critically acclaimed features.", country: 'Nigeria', city: 'Lagos', speciality: 'Feature Film, Series, Short Film', notable_projects: "The Milkmaid (Nigeria's Oscar submission), Voiceless", year_founded: 2014, company_size: 'mid' },
  { name: 'Play Network Studios', directory_type: 'company', category: 'Fiction', description: 'Fast-growing Nollywood production company creating commercial features and streaming content.', country: 'Nigeria', city: 'Lagos', website: 'https://www.playnetworkstudios.com', speciality: 'Feature Film, Streaming Content', notable_projects: 'Progressive Tailors Club, Passport', year_founded: 2018, company_size: 'mid' },
  { name: 'Trino Studios', directory_type: 'company', category: 'Co-Production', description: 'Lagos-based co-production company facilitating Nigeria-Europe and Nigeria-South Africa collaborations.', country: 'Nigeria', city: 'Lagos', speciality: 'Co-Production, Feature Film', notable_projects: 'Multiple cross-border African co-productions', year_founded: 2017, company_size: 'indie' },

  // ============ NIGERIA — Services ============
  { name: 'Whiteplain Agency', directory_type: 'service', category: 'Gear House', description: 'Leading equipment rental house in Lagos. Camera, lighting, grip, and production vehicle hire.', country: 'Nigeria', city: 'Lagos', website: 'https://www.whiteplainagency.com', service_type: 'Camera Rental, Lighting, Grip, Vehicles', pricing_tier: 'mid' },
  { name: 'C & I Studios Lagos', directory_type: 'service', category: 'Studio Space', description: 'Multi-purpose studio facility in Lagos with sound stages, green screen, and production offices.', country: 'Nigeria', city: 'Lagos', service_type: 'Sound Stage, Green Screen, Production Office', pricing_tier: 'mid' },
  { name: 'Mainland Studios', directory_type: 'service', category: 'Studio Space', description: 'Modern studio facility on Lagos Mainland offering affordable stage space for Nollywood and commercial productions.', country: 'Nigeria', city: 'Lagos', service_type: 'Sound Stage, Production Space', pricing_tier: 'budget' },
  { name: 'Jungle Filmworks Post', directory_type: 'service', category: 'Post-Production', description: 'Full post-production services: editing, color grading, sound design, and VFX for Nigerian features and series.', country: 'Nigeria', city: 'Lagos', service_type: 'Editing, Color Grading, Sound Design, VFX', pricing_tier: 'mid' },
  { name: 'Mettlepost', directory_type: 'service', category: 'Post-Production', description: 'Boutique post-production house offering color grading, online editing, and visual effects for premium Nollywood content.', country: 'Nigeria', city: 'Lagos', service_type: 'Color Grading, Online Edit, VFX', pricing_tier: 'mid' },
  { name: 'SoundCity Studios', directory_type: 'service', category: 'Sound Studio', description: 'Professional recording and sound mixing studio. ADR, Foley, and mixing for film and music productions.', country: 'Nigeria', city: 'Lagos', service_type: 'Sound Recording, ADR, Mixing', pricing_tier: 'mid' },
  { name: 'Lagos Locations', directory_type: 'service', category: 'Location Services', description: 'Location scouting and management across Lagos and South-West Nigeria. Permit facilitation and logistics.', country: 'Nigeria', city: 'Lagos', service_type: 'Location Scouting, Permits, Logistics', pricing_tier: 'mid' },
  { name: 'Nile Casting', directory_type: 'service', category: 'Casting', description: 'Professional casting service for film and TV productions in Nigeria. Extensive actor and extras database.', country: 'Nigeria', city: 'Lagos', service_type: 'Casting, Extras, Talent Search', pricing_tier: 'mid' },
  { name: 'Kritica Productions', directory_type: 'service', category: 'Permits & Fixers', description: 'Production fixing and permit facilitation for international productions shooting in Nigeria.', country: 'Nigeria', city: 'Lagos', service_type: 'Fixing, Permits, Production Logistics', pricing_tier: 'mid' },

  // ============ NIGERIA — Agencies ============
  { name: 'Temple Management Company (TMC)', directory_type: 'agency', category: 'Talent Agency', description: "Nigeria's largest talent management and booking agency. Represents A-list Nollywood actors and entertainers.", country: 'Nigeria', city: 'Lagos', website: 'https://www.templecompany.com' },
  { name: 'Urban Vision Agency', directory_type: 'agency', category: 'Talent Agency', description: 'Talent representation agency for actors, models, and on-screen talent in the Nigerian entertainment industry.', country: 'Nigeria', city: 'Lagos' },
  { name: 'BluePrint Agency', directory_type: 'agency', category: 'Crew Agency', description: 'Crew booking and production staffing agency. Connects international productions with experienced Nigerian crew.', country: 'Nigeria', city: 'Lagos' },
  { name: 'FilmKontrol', directory_type: 'agency', category: 'Sales Agent', description: 'Nigerian-focused sales agency handling international distribution, festival strategy, and streaming deals for Nollywood films.', country: 'Nigeria', city: 'Lagos' },
  { name: 'Nollywood Bridge', directory_type: 'agency', category: 'Co-Production Facilitator', description: 'Co-production facilitation company connecting Nigerian filmmakers with European and South African partners.', country: 'Nigeria', city: 'Lagos' },

  // ============ NIGERIA — Training ============
  { name: 'Del-York Creative Academy', directory_type: 'training', category: 'Film School', description: "Nigeria's premier film academy offering intensive filmmaking programs. Partnerships with New York Film Academy.", country: 'Nigeria', city: 'Lagos', website: 'https://www.delyorkcreativeacademy.com', program_type: 'school', duration: '3-12 months', cost: 'N500,000-N2,000,000' },
  { name: 'MultiChoice Talent Factory (West Africa)', directory_type: 'training', category: 'Incubator', description: 'Pan-African film training academy funded by MultiChoice. 12-month immersive program for emerging West African filmmakers.', country: 'Nigeria', city: 'Lagos', website: 'https://www.multichoicetalentfactory.com', program_type: 'school', duration: '12 months', cost: 'Fully funded' },
  { name: 'EbonyLife Creative Academy', directory_type: 'training', category: 'Short Course', description: 'Industry-led workshops and masterclasses in screenwriting, directing, and producing. Run by EbonyLife Studios team.', country: 'Nigeria', city: 'Lagos', program_type: 'workshop', duration: '1-4 weeks', cost: 'Varies' },
  { name: 'AFRIFF Talent Hub', directory_type: 'training', category: 'Masterclass', description: 'Annual masterclass program during the Africa International Film Festival. World-class instructors and industry mentorship.', country: 'Nigeria', city: 'Lagos', website: 'https://www.afriff.com', program_type: 'masterclass', duration: '5 days (annual)', cost: 'Included with AFRIFF pass' },
  { name: 'National Film Institute (NFI)', directory_type: 'training', category: 'Film School', description: 'Federal government film training institution. Offers ND and HND in film production, cinematography, and editing.', country: 'Nigeria', city: 'Jos', website: 'https://www.nfi.gov.ng', program_type: 'school', duration: '2-4 years (diploma/degree)', cost: 'Subsidised' },
];

// ─── CLI ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const countryIdx = args.indexOf('--country');
const countryFilter = countryIdx !== -1 ? args[countryIdx + 1] : null;

async function main() {
  let listings = DATA;

  if (countryFilter) {
    listings = listings.filter(l => l.country.toLowerCase() === countryFilter.toLowerCase());
    console.log(`Filtering to country: ${countryFilter} (${listings.length} listings)`);
  }

  console.log(`\nTotal listings to seed: ${listings.length}`);

  if (dryRun) {
    console.log('\n--- DRY RUN ---');
    const byType = {};
    for (const l of listings) {
      const key = `${l.country} / ${l.directory_type}`;
      byType[key] = (byType[key] || 0) + 1;
    }
    for (const [key, count] of Object.entries(byType).sort()) {
      console.log(`  ${key}: ${count}`);
    }
    console.log('\nNo data inserted. Remove --dry-run to execute.');
    return;
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const listing of listings) {
    // Check for duplicate by name + country
    const { data: existing } = await supabase
      .from('directory_listings')
      .select('id')
      .eq('name', listing.name)
      .eq('country', listing.country)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      process.stdout.write(`\r  Inserted: ${inserted} | Skipped: ${skipped} | Failed: ${failed}`);
      continue;
    }

    const { error } = await supabase
      .from('directory_listings')
      .insert({ ...listing, status: 'approved' });

    if (error) {
      failed++;
      console.error(`\n  ✗ ${listing.name}: ${error.message}`);
    } else {
      inserted++;
    }
    process.stdout.write(`\r  Inserted: ${inserted} | Skipped: ${skipped} | Failed: ${failed}`);
  }

  console.log(`\n\nDone! Inserted: ${inserted}, Skipped (duplicates): ${skipped}, Failed: ${failed}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
