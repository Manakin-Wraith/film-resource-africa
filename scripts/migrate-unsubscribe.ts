/**
 * Migration: Add unsubscribe support to newsletter_subscriptions
 *
 * Adds columns: unsubscribed (bool), unsubscribed_at (timestamp), unsubscribe_token (uuid)
 * Backfills unsubscribe_token for all existing subscribers.
 *
 * Usage:
 *   npx tsx scripts/migrate-unsubscribe.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers: Record<string, string> = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

async function runSQL(sql: string) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  });

  // If exec_sql RPC doesn't exist, fall back to raw REST
  if (!res.ok) {
    const text = await res.text();
    if (text.includes('exec_sql') || text.includes('not found')) {
      console.warn('exec_sql RPC not available — using Supabase Management API or manual approach.');
      return null;
    }
    throw new Error(`SQL exec failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('=== Unsubscribe Migration ===\n');

  // Step 1: Try to add columns via SQL RPC
  console.log('1. Attempting to add columns via SQL...');
  const migrationSQL = `
    ALTER TABLE newsletter_subscriptions
      ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid();

    CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_unsubscribe_token
      ON newsletter_subscriptions (unsubscribe_token);
  `;

  const sqlResult = await runSQL(migrationSQL);

  if (sqlResult === null) {
    console.log('\n⚠️  Could not run SQL automatically.');
    console.log('Please run this SQL in your Supabase SQL Editor:\n');
    console.log(migrationSQL);
    console.log('\nThen re-run this script with --backfill-only to backfill tokens.\n');

    if (!process.argv.includes('--backfill-only')) {
      process.exit(0);
    }
  } else {
    console.log('✓ Columns added successfully.\n');
  }

  // Step 2: Backfill unsubscribe_token for any rows where it's null
  console.log('2. Backfilling unsubscribe_token for existing subscribers...');

  const fetchRes = await fetch(
    `${supabaseUrl}/rest/v1/newsletter_subscriptions?select=id,email,unsubscribe_token&order=id.asc`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );

  if (!fetchRes.ok) {
    const errText = await fetchRes.text();
    // If column doesn't exist yet, prompt user to run SQL first
    if (errText.includes('unsubscribe_token')) {
      console.error('\n❌ The unsubscribe_token column does not exist yet.');
      console.log('Run the SQL above in Supabase SQL Editor first, then re-run with --backfill-only');
      process.exit(1);
    }
    throw new Error(`Fetch failed: ${fetchRes.status} ${errText}`);
  }

  const subscribers = await fetchRes.json();
  const needsToken = subscribers.filter((s: any) => !s.unsubscribe_token);

  if (needsToken.length === 0) {
    console.log('✓ All subscribers already have tokens. Nothing to backfill.\n');
  } else {
    console.log(`  Found ${needsToken.length} subscribers without tokens. Backfilling...`);

    for (const sub of needsToken) {
      const token = crypto.randomUUID();
      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/newsletter_subscriptions?id=eq.${sub.id}`,
        {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify({ unsubscribe_token: token }),
        }
      );
      if (!patchRes.ok) {
        console.error(`  ❌ Failed to patch subscriber ${sub.email}: ${await patchRes.text()}`);
      } else {
        console.log(`  ✓ ${sub.email} → ${token}`);
      }
    }
    console.log('✓ Backfill complete.\n');
  }

  // Step 3: Verify
  console.log('3. Verification...');
  const verifyRes = await fetch(
    `${supabaseUrl}/rest/v1/newsletter_subscriptions?select=id,email,unsubscribe_token,unsubscribed&limit=5`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const sample = await verifyRes.json();
  console.log(`  Sample (first 5):`);
  for (const s of sample) {
    console.log(`    ${s.email} | token: ${s.unsubscribe_token?.slice(0, 8)}... | unsubscribed: ${s.unsubscribed}`);
  }

  console.log('\n=== Migration complete ===');
}

main().catch(err => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
