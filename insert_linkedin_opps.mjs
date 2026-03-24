/**
 * One-off script to insert opportunities from Doro Szekely's LinkedIn post
 * (UK-focused April development opportunities, labs, and grants)
 *
 * Usage:
 *   node insert_linkedin_opps.mjs              # insert
 *   node insert_linkedin_opps.mjs --dry-run    # preview only
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

// ─── Opportunities from LinkedIn post by Doro Szekely ─────────────────────────

const opportunities = [
  {
    title: 'IDFA – IBF Europe Minority Co-Production Fund',
    'What Is It?': 'Production funding (€40,000) for feature-length documentaries with European minority co-producers and filmmakers from Africa, Asia, Eastern Europe, Latin America, the Caribbean, and Oceania. Part of the International Documentary Film Festival Amsterdam (IDFA).',
    'For Films or Series?': 'Feature-length documentaries',
    'What Do You Get If Selected?': '€40,000 production funding',
    'Cost': 'Free',
    'Next Deadline': '1 April 2026',
    'Apply:': 'https://lnkd.in/ezi3vXng',
    'Who Can Apply / Eligibility': 'Filmmakers from Africa, Asia, Eastern Europe, Latin America, the Caribbean, and Oceania with European minority co-producers',
    'What to Submit': 'Check application guidelines on IDFA website',
    'Strongest Submission Tips': 'Ensure you have a European minority co-producer attached before applying.',
    'CALENDAR REMINDER:': 'Deadline: 1 April 2026',
    category: 'Funds & Grants',
    deadline_date: '2026-04-01',
    application_status: 'closing_soon',
  },
  {
    title: 'The Writers Lab International',
    'What Is It?': 'A script and career development lab supporting women and non-binary writers over 40, open to all nationalities.',
    'For Films or Series?': 'Feature film scripts',
    'What Do You Get If Selected?': 'Script development lab with mentorship and industry access',
    'Cost': 'Free',
    'Next Deadline': '9 April 2026',
    'Apply:': 'https://lnkd.in/e9icmVYj',
    'Who Can Apply / Eligibility': 'Women and non-binary writers over 40, all nationalities',
    'What to Submit': 'Check application guidelines on Writers Lab website',
    'Strongest Submission Tips': 'Highlight your unique voice and life experience that informs your writing.',
    'CALENDAR REMINDER:': 'Deadline: 9 April 2026',
    category: 'Labs & Fellowships',
    deadline_date: '2026-04-09',
    application_status: 'closing_soon',
  },
  {
    title: 'Boomerang Fund by Euras Films',
    'What Is It?': '£30,000 development investment supporting Global Majority-led film and TV projects on the path to greenlight. Applicants must apply with a genre script and a UK-based producer.',
    'For Films or Series?': 'Film and TV (genre)',
    'What Do You Get If Selected?': '£30,000 development investment',
    'Cost': 'Free',
    'Next Deadline': '10 April 2026',
    'Apply:': 'https://lnkd.in/eHCiCcHP',
    'Who Can Apply / Eligibility': 'Global Majority-led projects with a UK-based producer attached. Must be a genre script.',
    'What to Submit': 'Genre script + UK-based producer details',
    'Strongest Submission Tips': 'Ensure you have a UK-based producer attached and that the project is clearly genre (horror, thriller, sci-fi, etc.).',
    'CALENDAR REMINDER:': 'Deadline: 10 April 2026',
    category: 'Funds & Grants',
    deadline_date: '2026-04-10',
    application_status: 'closing_soon',
  },
  {
    title: 'Sundance Institute Sandbox Fund',
    'What Is It?': 'Grants supporting science-focused, feature-length nonfiction projects worldwide. Development grants up to $40,000, production and post-production grants up to $100,000.',
    'For Films or Series?': 'Feature-length nonfiction / documentary',
    'What Do You Get If Selected?': 'Development: up to $40,000. Production/post: up to $100,000.',
    'Cost': 'Free',
    'Next Deadline': '13 April 2026',
    'Apply:': 'https://lnkd.in/eu6aRYV6',
    'Who Can Apply / Eligibility': 'Open worldwide. Projects must be science-focused feature-length nonfiction.',
    'What to Submit': 'Check Sundance Institute application portal',
    'Strongest Submission Tips': 'The science angle is key — clearly articulate the scientific story at the heart of your documentary.',
    'CALENDAR REMINDER:': 'Deadline: 13 April 2026',
    category: 'Funds & Grants',
    deadline_date: '2026-04-13',
    application_status: 'closing_soon',
  },
  {
    title: "Wscripted's 6th Cannes Screenplay List (presented by MUBI)",
    'What Is It?': 'A curated screenplay list presented at the Cannes Film Festival, open to women and non-binary screenwriters or writer-directors with a screenplay in English or French.',
    'For Films or Series?': 'Feature film screenplays',
    'What Do You Get If Selected?': 'Inclusion on the Cannes Screenplay List with industry exposure at Cannes, presented by MUBI',
    'Cost': 'Check website',
    'Next Deadline': '15 April 2026',
    'Apply:': 'https://lnkd.in/euhewV9G',
    'Who Can Apply / Eligibility': 'Women and non-binary screenwriters or writer-directors. Screenplay must be in English or French.',
    'What to Submit': 'Feature film screenplay in English or French',
    'Strongest Submission Tips': 'Strong, original voice and a polished screenplay are essential for this high-profile list.',
    'CALENDAR REMINDER:': 'Deadline: 15 April 2026',
    category: 'Markets & Pitching',
    deadline_date: '2026-04-15',
    application_status: 'closing_soon',
  },
  {
    title: 'Listening Pitch 2026 (Aesthetica x Audible)',
    'What Is It?': 'Two grants of up to £10,000 each to support new documentary projects across all styles, presented by Aesthetica Short Film Festival and Audible.',
    'For Films or Series?': 'Documentary (all styles)',
    'What Do You Get If Selected?': 'Up to £10,000 grant',
    'Cost': 'Free',
    'Next Deadline': '20 April 2026',
    'Apply:': 'https://lnkd.in/ejspF7tB',
    'Who Can Apply / Eligibility': 'Open to documentary filmmakers — check Aesthetica guidelines for full eligibility',
    'What to Submit': 'Documentary project pitch',
    'Strongest Submission Tips': 'Think broadly about documentary form — the fund supports all styles.',
    'CALENDAR REMINDER:': 'Deadline: 20 April 2026',
    category: 'Funds & Grants',
    deadline_date: '2026-04-20',
    application_status: 'open',
  },
  {
    title: 'Pop Up Film Residency – Eurimages Programme',
    'What Is It?': 'A film residency programme for experienced women filmmakers from Eurimages member countries who have written or directed at least two feature films.',
    'For Films or Series?': 'Feature films',
    'What Do You Get If Selected?': 'Film residency with development support',
    'Cost': 'Free',
    'Next Deadline': '20 April 2026',
    'Apply:': 'https://lnkd.in/er63gPzr',
    'Who Can Apply / Eligibility': 'Women filmmakers from Eurimages member countries who have written or directed at least 2 feature films',
    'What to Submit': 'Check Pop Up Film Residency application guidelines',
    'Strongest Submission Tips': 'You must have at least two feature credits (writer or director) to be eligible.',
    'CALENDAR REMINDER:': 'Deadline: 20 April 2026',
    category: 'Labs & Fellowships',
    deadline_date: '2026-04-20',
    application_status: 'open',
  },
  {
    title: "Lunar Pictures' Producer Network Initiative",
    'What Is It?': 'Supporting authored short films with producer and EP support. Encouraging applications from Global Majority, Working Class, Queer, Disabled, Neurodivergent, and regionally based filmmakers.',
    'For Films or Series?': 'Short films',
    'What Do You Get If Selected?': 'Producer and Executive Producer support for your short film',
    'Cost': 'Free',
    'Next Deadline': 'Open / rolling',
    'Apply:': 'https://lnkd.in/eCQH2BhE',
    'Who Can Apply / Eligibility': 'Open to all, with particular encouragement for Global Majority, Working Class, Queer, Disabled, Neurodivergent, and regionally based filmmakers',
    'What to Submit': 'Short film project details — check Lunar Pictures for full guidelines',
    'Strongest Submission Tips': 'Emphasise the authored, personal nature of your short film project.',
    'CALENDAR REMINDER:': 'Open now — no fixed deadline',
    category: 'Labs & Fellowships',
    deadline_date: null,
    application_status: 'open',
  },
  {
    title: 'European Showrunner Programme',
    'What Is It?': 'A six-month, part-time training and mentoring programme for experienced European series writers.',
    'For Films or Series?': 'TV series',
    'What Do You Get If Selected?': 'Six-month training and mentoring programme',
    'Cost': 'Free',
    'Next Deadline': '30 March 2026',
    'Apply:': 'https://lnkd.in/etqGc3QQ',
    'Who Can Apply / Eligibility': 'Experienced European series writers',
    'What to Submit': 'Check programme application guidelines',
    'Strongest Submission Tips': 'Demonstrate substantial series writing experience and a clear vision for the programme.',
    'CALENDAR REMINDER:': 'Deadline: 30 March 2026',
    category: 'Labs & Fellowships',
    deadline_date: '2026-03-30',
    application_status: 'closing_soon',
  },
  {
    title: "Cassandra Johnson-Bekoe's Development Sprint",
    'What Is It?': 'A six-week development consultancy for mid- to senior-level writers and writing teams seeking high-level editorial support to take a project over the finish line.',
    'For Films or Series?': 'Film and TV scripts',
    'What Do You Get If Selected?': 'Six-week intensive development consultancy with high-level editorial support',
    'Cost': 'Check website',
    'Next Deadline': '30 March 2026',
    'Apply:': 'https://lnkd.in/eZuDeT4h',
    'Who Can Apply / Eligibility': 'Mid- to senior-level writers and writing teams',
    'What to Submit': 'Project details and writing samples — check website for full requirements',
    'Strongest Submission Tips': 'Best suited for writers who have a near-complete project that needs final editorial push.',
    'CALENDAR REMINDER:': 'Deadline: 30 March 2026',
    category: 'Labs & Fellowships',
    deadline_date: '2026-03-30',
    application_status: 'closing_soon',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== LinkedIn Opportunity Import (Doro Szekely) ===\n');

  const existing = await getExistingTitles();
  console.log(`Existing opportunities in DB: ${existing.size}`);
  console.log(`Opportunities to import: ${opportunities.length}\n`);

  let inserted = 0, skipped = 0;

  for (const opp of opportunities) {
    const norm = opp.title.toLowerCase().trim();
    if (existing.has(norm)) {
      console.log(`  ⏭ SKIP (duplicate): ${opp.title}`);
      skipped++;
      continue;
    }

    const item = { ...opp, status: 'pending', votes: 0 };

    if (DRY_RUN) {
      console.log(`  [DRY] Would insert: ${opp.title}`);
      console.log(`         Deadline: ${opp.deadline_date || 'Rolling'} | Category: ${opp.category}`);
    } else {
      try {
        await supabaseInsert('opportunities', item);
        console.log(`  ✅ Inserted: ${opp.title}`);
        inserted++;
      } catch (err) {
        console.log(`  ❌ Failed: ${opp.title} — ${err.message}`);
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Mode:     ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (inserted > 0) console.log(`\n💡 Remember to review and approve these in /admin`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
