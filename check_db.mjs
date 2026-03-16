import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log("Listing all tables in the public schema...");
  
  // This is a common way to check for tables in Supabase via RPC or querying a known table
  // But since we don't have a direct "list tables" method in the client, 
  // we'll try to probe both singular and plural names.
  
  const names = ['newsletter_subscriptions', 'newsletter_subscription'];
  
  for (const name of names) {
    console.log(`\nProbing table: ${name}...`);
    const { data, error } = await supabase.from(name).select('*').limit(0);
    
    if (error) {
      console.log(`❌ ${name}: ${error.message} (${error.code})`);
    } else {
      console.log(`✅ ${name}: Found and accessible.`);
      
      // Test insert on the found table
      const testEmail = `test-${Date.now()}@example.com`;
      console.log(`Testing insert into ${name} with ${testEmail}...`);
      const { error: insertError } = await supabase.from(name).insert([{ email: testEmail }]);
      
      if (insertError) {
        console.log(`❌ Insert into ${name} failed: ${insertError.message} (${insertError.code})`);
      } else {
        console.log(`✅ Insert into ${name} succeeded!`);
        await supabase.from(name).delete().eq('email', testEmail);
      }
    }
  }
}

listTables();
