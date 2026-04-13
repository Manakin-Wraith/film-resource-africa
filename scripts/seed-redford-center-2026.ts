/**
 * Seed script: Insert the 2026 Redford Center Grant as an opportunity
 *
 * Usage:
 *   npx tsx scripts/seed-redford-center-2026.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const redfordCenter2026 = {
  title: 'The 2026 Redford Center Grants — $40,000 for Environmental Documentary Filmmakers',

  'What Is It?':
    'The Redford Center Grants is a cohort-based grant programme offering **$40,000 per project** (increased for 2026) to environmental documentary filmmakers. It operates as a 12-month fellowship model that combines funding with community, mentorship, and long-term support to help filmmakers realise their vision. Selected projects join a community of passionate filmmakers applying their storytelling craft to shift culture, influence power, and change systems for good.',

  'For Films or Series?': 'Documentary (feature or short)',

  'What Do You Get If Selected?':
    '- **$40,000 grant** per project\n' +
    '- A **cohort of peers** working across the environmental documentary field\n' +
    '- Support from **advisors, industry experts, and mentorship** throughout the 12-month programme\n' +
    '- **Travel support** to attend the Fellowship Summit in 2027\n' +
    '- A **pathway to additional funding** in 2027',

  Cost: 'Free to apply',

  'Next Deadline': '14 May 2026',

  'Apply:': 'https://redfordcenter.org/grants',

  'Who Can Apply / Eligibility':
    'Environmental documentary filmmakers working on projects that explore **solutions to intersectional environmental issues**. The programme is open to filmmakers internationally — projects addressing climate, water, land rights, extractive industries, environmental justice, and related themes are encouraged.',

  'What to Submit':
    'Visit [redfordcenter.org/grants](https://redfordcenter.org/grants) for full application requirements. Typically includes a project description, filmmaker statement, work sample, and budget outline. Check the official site for 2026-specific submission details.',

  'Strongest Submission Tips':
    'The Redford Center looks for **solutions-oriented storytelling** — not just documenting the problem but illuminating pathways to change. Projects that demonstrate intersectional thinking (connecting environmental issues to social justice, equity, and community resilience) tend to stand out. Show that your project can shift culture and influence systems, not just raise awareness.',

  'CALENDAR REMINDER:': 'Applications close 14 May 2026 — start early and allow time for work sample preparation.',

  category: 'Funds & Grants',
  deadline_date: '2026-05-14',
  application_status: 'open' as const,
  geo_scope: 'international' as const,
  status: 'pending' as const,
  votes: 0,
};

async function main() {
  console.log('Inserting Redford Center 2026 opportunity...');

  const { data, error } = await supabase
    .from('opportunities')
    .insert([redfordCenter2026])
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`✓ Inserted with id=${data.id}`);
  console.log(JSON.stringify(data, null, 2));
}

main();
