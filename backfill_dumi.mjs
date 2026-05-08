/**
 * Backfill member: Dumi Gumbi (The Ergo Company)
 * PayFast Business p/m subscription paid 2026-05-07 15:19 UTC
 * ITN did not fire — same pattern as Akande/Sheffy (custom subscription button)
 *
 * Creates:
 *   1. auth.users entry (email_confirm: true so first login = magic link)
 *   2. members row (business / monthly / active / founding lock)
 *   3. member_payments row (R225, payfast_subscription)
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ENV_PATH = '/sessions/compassionate-dreamy-cori/mnt/film-directory/.env.local';
const env = Object.fromEntries(
  readFileSync(ENV_PATH, 'utf-8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL = 'dumi@theergocompany.com';
const NAME = 'Dumi Gumbi';
const PAID_AT = '2026-05-07T15:19:13Z';
const AMOUNT = 225;
const TIER = 'business';
const BILLING = 'monthly';

async function main() {
  console.log(`Backfilling ${NAME} <${EMAIL}>\n`);

  // 1. auth.users — admin createUser, email_confirm=true
  console.log('1. Auth user…');
  const { data: existingAuth, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const matched = existingAuth.users.find((u) => (u.email ?? '').toLowerCase() === EMAIL);
  let authUserId;
  if (matched) {
    console.log(`   ↳ already exists: ${matched.id}`);
    authUserId = matched.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      email_confirm: true,
      user_metadata: { full_name: NAME, tier: TIER, billing_cycle: BILLING, source: 'payfast_backfill' },
    });
    if (error) throw error;
    authUserId = data.user.id;
    console.log(`   ↳ created: ${authUserId}`);
  }

  // 2. members row — match the ITN handler shape exactly
  console.log('\n2. Member row…');
  const { data: existingMember } = await supabase
    .from('members')
    .select('id, status')
    .eq('email', EMAIL)
    .maybeSingle();

  let memberId;
  if (existingMember) {
    console.log(`   ↳ already exists: ${existingMember.id} — updating to active`);
    const nextDue = new Date(PAID_AT);
    nextDue.setDate(nextDue.getDate() + 30);
    await supabase
      .from('members')
      .update({
        status: 'active',
        next_payment_due_at: nextDue.toISOString(),
        founding_member_lock: true,
      })
      .eq('id', existingMember.id);
    memberId = existingMember.id;
  } else {
    const nextDue = new Date(PAID_AT);
    nextDue.setDate(nextDue.getDate() + 30);
    const { data: inserted, error } = await supabase
      .from('members')
      .insert({
        email: EMAIL,
        full_name: NAME,
        tier: TIER,
        billing_cycle: BILLING,
        status: 'active',
        joined_at: PAID_AT,
        next_payment_due_at: nextDue.toISOString(),
        founding_member_lock: true,
        country: 'South Africa',
        location_city: 'Johannesburg',
        company_name: 'The Ergo Company',
        notes:
          'PayFast — FRA-Membership-Business-p-m(Dumi) — backfilled 2026-05-07. ' +
          'ITN did NOT fire (same custom-subscription-button pattern as Akande/Sheffy/Vanessa). ' +
          'Notify URL likely missing on the Business p/m product in PayFast dashboard. ' +
          'Inbound from PRS diagnostic (Assault on Soweto, 19/25). ' +
          'Co-runs The Ergo Company with Cati Weinek (40+ yrs combined). ' +
          'Notable: The Tokoloshe (2018), Headspace (2023), Old Righteous Blues (2024 Oscars submission).',
      })
      .select('id, onboarding_token')
      .single();
    if (error) throw error;
    memberId = inserted.id;
    console.log(`   ↳ created: ${memberId}`);
    console.log(`   ↳ onboarding_token: ${inserted.onboarding_token}`);
  }

  // 3. payment row
  console.log('\n3. Payment row…');
  const periodStart = PAID_AT.slice(0, 10);
  const periodEnd = (() => {
    const d = new Date(PAID_AT);
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  })();
  const { data: existingPayment } = await supabase
    .from('member_payments')
    .select('id')
    .eq('member_id', memberId)
    .eq('paid_at', PAID_AT)
    .maybeSingle();
  if (existingPayment) {
    console.log(`   ↳ payment already recorded: ${existingPayment.id}`);
  } else {
    const { data: paymentInserted, error } = await supabase
      .from('member_payments')
      .insert({
        member_id: memberId,
        amount: AMOUNT,
        currency: 'ZAR',
        paid_at: PAID_AT,
        period_start: periodStart,
        period_end: periodEnd,
        payment_method: 'payfast_subscription',
        provider_payment_id: 'payfast_m_payment_id:FRA-Membership-Business-p-m(Dumi)',
      })
      .select('id')
      .single();
    if (error) throw error;
    console.log(`   ↳ created: ${paymentInserted.id}`);
  }

  // 4. fetch onboarding token for welcome email link
  const { data: final } = await supabase
    .from('members')
    .select('id, email, full_name, tier, billing_cycle, status, joined_at, founding_member_lock, onboarding_token, country, location_city, company_name')
    .eq('id', memberId)
    .single();

  console.log('\n────────────────────────────────────────────────');
  console.log('BACKFILL COMPLETE');
  console.log('────────────────────────────────────────────────');
  console.log(JSON.stringify(final, null, 2));
  console.log(
    `\nOnboarding URL: https://film-resource-africa.com/members/onboarding?token=${final.onboarding_token}`
  );
}

main().catch((e) => {
  console.error('\n✗ FAILED:', e.message ?? e);
  process.exit(1);
});
