import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function main() {
  console.log("Starting database migration...");
  
  try {
    // 1. Create the table
    console.log("Creating table schema...");
    await sql`
      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        "What Is It?" TEXT,
        "For Films or Series?" TEXT,
        "What Do You Get If Selected?" TEXT,
        "Cost" TEXT,
        "Next Deadline" TEXT,
        "Apply:" TEXT,
        "Who Can Apply / Eligibility" TEXT,
        "What to Submit" TEXT,
        "Strongest Submission Tips" TEXT,
        "CALENDAR REMINDER:" TEXT,
        logo TEXT,
        status TEXT DEFAULT 'approved'
      );
    `;
    console.log("Table created.");

    // 2. Read the local JSON file
    const dataFile = path.join(__dirname, 'data.json');
    const rawData = await fs.readFile(dataFile, 'utf-8');
    const ops = JSON.parse(rawData);
    
    console.log(`Found ${ops.length} records. Beginning insertion...`);

    // 3. Insert each record one by one
    let inserted = 0;
    for (const opp of ops) {
      await sql`
        INSERT INTO opportunities (
          title, 
          "What Is It?", 
          "For Films or Series?", 
          "What Do You Get If Selected?", 
          "Cost", 
          "Next Deadline", 
          "Apply:", 
          "Who Can Apply / Eligibility", 
          "What to Submit", 
          "Strongest Submission Tips", 
          "CALENDAR REMINDER:",
          logo,
          status
        ) VALUES (
          ${opp.title},
          ${opp["What Is It?"] || ''},
          ${opp["For Films or Series?"] || ''},
          ${opp["What Do You Get If Selected?"] || ''},
          ${opp["Cost"] || ''},
          ${opp["Next Deadline"] || ''},
          ${opp["Apply:"] || ''},
          ${opp["Who Can Apply / Eligibility"] || ''},
          ${opp["What to Submit"] || ''},
          ${opp["Strongest Submission Tips"] || ''},
          ${opp["CALENDAR REMINDER:"] || ''},
          ${opp.logo || ''},
          ${opp.status || 'approved'}
        )
      `;
      inserted++;
      process.stdout.write(`\rInserted: ${inserted}/${ops.length}`);
    }
    
    console.log("\nMigration completed successfully.");
    
  } catch (error) {
    console.error("\nMigration failed:", error);
  }
}

main();
