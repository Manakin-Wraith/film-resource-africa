/**
 * Curious Refuge AI Film School Opportunity
 * Extracted from Hollywood Reporter article:
 * https://www.hollywoodreporter.com/movies/movie-features/curious-refuge-ai-film-school-hollywood-1236546505/
 * 
 * For insertion into FRA opportunities database
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

const DRY_RUN = process.argv.includes('--dry-run');
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function supabaseInsert(table, item) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`INSERT failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getExistingTitles() {
  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?select=title`, { headers });
  const data = await res.json();
  return new Set(data.map(o => o.title.toLowerCase().trim()));
}

// Curious Refuge AI Film School opportunity
const curiousRefugeOpportunity = {
  title: 'Curious Refuge AI Film School',
  'What Is It?': 'An online AI film school founded by Shelby and Caleb Ward, offering curated courses in AI filmmaking, advertising, screenwriting, VFX, and documentary. The school provides a "safe space" for creators to learn AI storytelling and production techniques, with coursework involving video tutorials, AI tool training, and creating AI-generated short films as final projects. Backed by parent company Promise (supported by Google, Peter Chernin\'s North Road, and Michael Ovitz\'s Crossbeam).',
  'For Films or Series?': 'AI filmmaking training applicable to all formats',
  'What Do You Get If Selected?': 'Access to curated AI filmmaking curriculum, video tutorials, assignments, and community. Graduates receive certification and job placement assistance through parent company Promise. The program helps professionals integrate AI into their filmmaking workflow.',
  'Cost': '$749 per course + $200-500 for recommended AI tools (for a 10-minute professional-quality short film)',
  'Next Deadline': 'Rolling admissions (courses start regularly)',
  'Apply:': 'https://www.curiousrefuge.com',
  'Who Can Apply / Eligibility': 'Professionals in entertainment/ad industries (95% of current students), filmmakers, screenwriters, VFX artists, and creatives looking to integrate AI into their workflow. Open to all experience levels.',
  'What to Submit': 'Application through website (no portfolio required for most courses)',
  'Strongest Submission Tips': 'Highlight your professional background in film/TV/advertising. Demonstrate curiosity about AI and willingness to learn new tools. Mention specific AI applications you\'re interested in (VFX, screenwriting, documentary, etc.).',
  'CALENDAR REMINDER:': 'Rolling admissions - apply anytime',
  category: 'Training & Education',
  deadline_date: null, // Rolling admissions
  application_status: 'open',

};

async function main() {
  console.log('=== Curious Refuge AI Film School Opportunity ===\n');
  
  // Check if already exists
  const existingTitles = await getExistingTitles();
  const normalizedTitle = curiousRefugeOpportunity.title.toLowerCase().trim();
  
  if (existingTitles.has(normalizedTitle)) {
    console.log(`Opportunity "${curiousRefugeOpportunity.title}" already exists in database.`);
    return;
  }
  
  console.log('Opportunity to insert:');
  console.log(JSON.stringify(curiousRefugeOpportunity, null, 2));
  
  if (DRY_RUN) {
    console.log('\n--- DRY RUN - Would insert above opportunity ---');
    return;
  }
  
  try {
    console.log('\nInserting opportunity...');
    const result = await supabaseInsert('opportunities', curiousRefugeOpportunity);
    console.log('✅ Successfully inserted opportunity:', result[0].id);
    console.log('Title:', result[0].title);
    console.log('Category:', result[0].category);
    
    // Also tag with relevant countries (AI training is globally relevant)
    console.log('\nTagging with relevant countries...');
    const countries = await fetch(`${supabaseUrl}/rest/v1/countries?select=id,name`, { headers });
    const countryData = await countries.json();
    
    const africanCountries = countryData.filter(c => 
      ['Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Tanzania', 'Ethiopia']
      .includes(c.name)
    );
    
    for (const country of africanCountries) {
      try {
        await supabaseInsert('opportunity_countries', {
          opportunity_id: result[0].id,
          country_id: country.id
        });
        console.log(`  ✅ Linked to: ${country.name}`);
      } catch (err) {
        console.log(`  ⚠️  Could not link to ${country.name}: ${err.message}`);
      }
    }
    
    console.log('\n=== Opportunity Successfully Added ===');
    console.log(`Title: ${curiousRefugeOpportunity.title}`);
    console.log(`Category: ${curiousRefugeOpportunity.category}`);
    console.log(`Cost: ${curiousRefugeOpportunity['Cost']}`);
    console.log(`Apply: ${curiousRefugeOpportunity['Apply:']}`);
    console.log(`Status: ${curiousRefugeOpportunity.application_status}`);
    
  } catch (error) {
    console.error('❌ Error inserting opportunity:', error.message);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { curiousRefugeOpportunity };