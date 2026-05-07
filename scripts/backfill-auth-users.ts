/**
 * Backfill: Create Supabase Auth users for active members who don't have one.
 * Also sends onboarding emails to any member whose onboarding is incomplete.
 *
 * Usage:
 *   npx tsx scripts/backfill-auth-users.ts
 *   npx tsx scripts/backfill-auth-users.ts --dry-run
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey   = process.env.RESEND_API_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
if (dryRun) console.log('--- DRY RUN — no changes will be made ---\n');

const authHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

async function getExistingAuthEmails(): Promise<Set<string>> {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=100`, {
    headers: authHeaders,
  });
  if (!res.ok) throw new Error(`Failed to list auth users: ${await res.text()}`);
  const data = await res.json();
  return new Set((data.users ?? []).map((u: any) => u.email.toLowerCase()));
}

async function createAuthUser(email: string): Promise<boolean> {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, email_confirm: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes('already been registered')) return true; // already exists, not an error
    console.error(`  ✗ Failed to create auth user for ${email}: ${text}`);
    return false;
  }
  return true;
}

async function sendOnboardingEmail(member: {
  email: string;
  full_name: string;
  tier: string;
  onboarding_token: string;
}) {
  if (!resendKey) {
    console.log(`  ⚠  No RESEND_API_KEY — skipping email for ${member.email}`);
    return;
  }

  const onboardingUrl = `https://film-resource-africa.com/members/onboarding?token=${member.onboarding_token}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Film Resource Africa <hello@film-resource-africa.com>',
      to: member.email,
      subject: `Welcome to Film Resource Africa — set up your profile`,
      html: `
        <p>Hi ${member.full_name || 'there'},</p>
        <p>You're in. Your founding member spot is confirmed and your price is locked for life.</p>
        <p>Next step — set up your profile so the industry can find you:</p>
        <p><a href="${onboardingUrl}" style="display:inline-block;padding:14px 24px;background:#3b82f6;color:#fff;font-weight:700;border-radius:10px;text-decoration:none;">Complete your profile →</a></p>
        ${member.tier === 'individual' ? "<p>You'll also review and accept your membership agreement (MOU) as part of this step.</p>" : ''}
        <p>Your profile will be live on the FRA Members Directory as soon as it's complete.</p>
        <p>I'll be in touch personally within 24 hours.</p>
        <p>— Gerhard<br/>Film Resource Africa</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:12px;color:#999;">This link is unique to you — don't share it. If you have questions, reply to this email or contact hello@film-resource-africa.com</p>
      `,
    }),
  });

  if (!res.ok) {
    console.error(`  ✗ Email failed for ${member.email}: ${await res.text()}`);
  } else {
    console.log(`  ✓ Onboarding email sent → ${member.email}`);
  }
}

async function main() {
  console.log('=== Backfill: Auth Users + Onboarding Emails ===\n');

  // 1. Fetch all active members without completed onboarding
  const membersRes = await fetch(
    `${supabaseUrl}/rest/v1/members?status=eq.active&select=id,email,full_name,tier,onboarding_token,onboarding_completed_at&order=joined_at.asc`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  if (!membersRes.ok) throw new Error(`Failed to fetch members: ${await membersRes.text()}`);
  const members: any[] = await membersRes.json();

  console.log(`Found ${members.length} active members.\n`);

  // 2. Get existing auth users
  const existingAuthEmails = await getExistingAuthEmails();
  console.log(`Existing auth users: ${[...existingAuthEmails].join(', ')}\n`);

  // 3. Process each member
  for (const member of members) {
    const email = member.email.toLowerCase();
    const hasAuth = existingAuthEmails.has(email);
    const needsOnboarding = !member.onboarding_completed_at && member.onboarding_token;

    console.log(`── ${member.full_name || email} (${email})`);

    if (!hasAuth) {
      if (dryRun) {
        console.log('  [dry-run] Would create auth user');
      } else {
        const ok = await createAuthUser(email);
        if (ok) console.log('  ✓ Auth user created');
      }
    } else {
      console.log('  ✓ Auth user already exists');
    }

    if (needsOnboarding) {
      const onboardingUrl = `https://film-resource-africa.com/members/onboarding?token=${member.onboarding_token}`;
      if (dryRun) {
        console.log(`  [dry-run] Would send onboarding email`);
        console.log(`  Onboarding URL: ${onboardingUrl}`);
      } else {
        await sendOnboardingEmail(member);
      }
    } else if (member.onboarding_completed_at) {
      console.log('  ✓ Onboarding already completed');
    } else {
      console.log('  ⚠  No onboarding_token — email skipped');
    }

    console.log();
  }

  console.log('=== Done ===');
}

main().catch(err => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
