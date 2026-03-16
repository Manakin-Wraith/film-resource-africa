import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Starting Supabase data migration...");
  
  try {
    const dataFile = path.join(__dirname, 'data.json');
    const rawData = await fs.readFile(dataFile, 'utf-8');
    const ops = JSON.parse(rawData);
    
    console.log(`Found ${ops.length} records. Beginning insertion...`);

    let inserted = 0;
    for (const opp of ops) {
      const { error } = await supabase
        .from('opportunities')
        .insert({
          title: opp.title,
          "What Is It?": opp["What Is It?"] || '',
          "For Films or Series?": opp["For Films or Series?"] || '',
          "What Do You Get If Selected?": opp["What Do You Get If Selected?"] || '',
          "Cost": opp["Cost"] || '',
          "Next Deadline": opp["Next Deadline"] || '',
          "Apply:": opp["Apply:"] || '',
          "Who Can Apply / Eligibility": opp["Who Can Apply / Eligibility"] || '',
          "What to Submit": opp["What to Submit"] || '',
          "Strongest Submission Tips": opp["Strongest Submission Tips"] || '',
          "CALENDAR REMINDER:": opp["CALENDAR REMINDER:"] || '',
          logo: opp.logo || '',
          status: opp.status || 'approved'
        });
        
      if (error) {
        console.error(`\nFailed to insert ${opp.title}:`, error.message);
      } else {
        inserted++;
        process.stdout.write(`\rInserted: ${inserted}/${ops.length}`);
      }
    }
    
    console.log("\nMigration completed successfully.");
    
  } catch (error) {
    console.error("\nMigration failed:", error);
  }
}

main();
