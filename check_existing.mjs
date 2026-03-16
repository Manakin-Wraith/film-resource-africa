import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkExisting() {
  console.log("Fetching all existing opportunities from Supabase...\n");
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, status')
    .order('id', { ascending: true });

  if (error) {
    console.error("Error fetching opportunities:", error.message);
    process.exit(1);
  }

  console.log(`Total opportunities in database: ${data.length}\n`);
  console.log("ID | Title | Status");
  console.log("---|-------|-------");
  for (const row of data) {
    console.log(`${row.id} | ${row.title} | ${row.status}`);
  }

  // Now check which of the new opportunities already exist
  const newTitles = [
    "NEXT NARRATIVE AFRICA FUND (NNAF)",
    "AFAC DOCUMENTARY FILM PROGRAM (Arab Fund for Arts & Culture)",
    "NFVF PRODUCTION & DEVELOPMENT FUNDING (National Film and Video Foundation, South Africa)",
    "DOHA FILM INSTITUTE (DFI) GRANTS PROGRAMME",
    "SUNDANCE DOCUMENTARY FUND",
    "ITVS OPEN CALL (Independent Television Service / PBS)",
    "FESPACO (Pan-African Film and Television Festival of Ouagadougou)",
    "DOCUBOX — EAST AFRICAN DOCUMENTARY FILM FUND",
    "AFRIFF (Africa International Film Festival, Lagos)",
    "ACP-EU CULTURE PROGRAMME",
    "MULTICHOICE TALENT FACTORY (MTF)",
    "CPH:FORUM (CPH:DOX Copenhagen Documentary Festival)",
    "AFRICA NO FILTER / KEKERE STORYTELLERS FUND",
    "MERCK FOUNDATION FILM AWARDS 2026"
  ];

  const existingTitlesLower = data.map(d => d.title.toLowerCase().trim());

  console.log("\n\n=== DUPLICATE CHECK ===\n");
  
  for (const title of newTitles) {
    // Exact match
    const exactMatch = existingTitlesLower.includes(title.toLowerCase().trim());
    
    // Partial match - check if any existing title contains or is contained by the new title
    const partialMatches = data.filter(d => {
      const existLow = d.title.toLowerCase();
      const newLow = title.toLowerCase();
      // Check if significant keywords overlap
      const newWords = newLow.split(/[\s\-—()/,]+/).filter(w => w.length > 3);
      const matchCount = newWords.filter(w => existLow.includes(w)).length;
      return matchCount >= 2 && (matchCount / newWords.length) > 0.3;
    });

    if (exactMatch) {
      console.log(`❌ EXACT DUPLICATE: "${title}"`);
    } else if (partialMatches.length > 0) {
      console.log(`⚠️  POSSIBLE DUPLICATE: "${title}"`);
      for (const m of partialMatches) {
        console.log(`   → Matches existing: "${m.title}" (ID: ${m.id})`);
      }
    } else {
      console.log(`✅ NEW (safe to insert): "${title}"`);
    }
  }
}

checkExisting();
