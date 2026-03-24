/**
 * FRA Community Spotlight Mailer — Send Script
 *
 * Sends the community spotlight email to all subscribers via Resend.
 *
 * Usage:
 *   node send_community_spotlight.mjs              # send to all subscribers
 *   node send_community_spotlight.mjs --dry-run    # save to DB as draft, don't send
 *   node send_community_spotlight.mjs --resend-to-new  # resend latest spotlight to subscribers who missed it
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   RESEND_API_KEY, NEXT_PUBLIC_SITE_URL
 */

import { readFileSync } from 'fs';

// ─── Config ──────────────────────────────────────────────────────────────────

const envFile = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const resendApiKey = env.RESEND_API_KEY;
const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://film-resource-africa.com';

if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env vars'); process.exit(1); }
if (!resendApiKey) { console.error('Missing RESEND_API_KEY'); process.exit(1); }

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RESEND_TO_NEW = args.includes('--resend-to-new');
const FROM_EMAIL = 'Film Resource Africa <hello@film-resource-africa.com>';
const SEND_DELAY_MS = 600;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function supabaseGet(table, query) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`Supabase GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePost(table, body) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase POST ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, match, body) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${match}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${table} failed: ${res.status} ${await res.text()}`);
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ─── Resend to new subscribers ───────────────────────────────────────────────

async function resendToNew() {
  console.log('=== FRA Community Spotlight — Resend to New Subscribers ===\n');

  // 1. Find the latest sent community spotlight newsletter
  const latest = await supabaseGet('newsletters', 'status=eq.sent&subject=ilike.*Community%20Spotlight*&order=sent_at.desc&limit=1');
  if (latest.length === 0) {
    console.log('No sent community spotlight found. Nothing to resend.');
    return;
  }
  const newsletter = latest[0];
  console.log(`Latest spotlight: ${newsletter.subject}`);
  console.log(`  Sent at: ${newsletter.sent_at}\n`);

  // 2. Get all subscribers
  const allSubs = await supabaseGet('newsletter_subscriptions', 'select=id,email&order=created_at.asc');

  // 3. Get emails that already received this edition
  const alreadySent = await supabaseGet(
    'newsletter_sends',
    `newsletter_id=eq.${newsletter.id}&status=in.(sent,opened,clicked)&select=subscriber_email`
  );
  const sentEmails = new Set(alreadySent.map(s => s.subscriber_email));

  // 4. Filter to only new subscribers who missed it
  const newSubs = allSubs.filter(s => !sentEmails.has(s.email));

  if (newSubs.length === 0) {
    console.log('All subscribers have already received this edition. Nothing to do.');
    return;
  }

  console.log(`Subscribers who missed this edition: ${newSubs.length}`);
  newSubs.forEach((s, i) => console.log(`  ${i + 1}. ${s.email}`));
  console.log('');

  // 5. Send
  let sent = 0;
  let failed = 0;

  for (const sub of newSubs) {
    try {
      const result = await sendEmail(sub.email, newsletter.subject, newsletter.body_html);

      await supabasePost('newsletter_sends', {
        newsletter_id: newsletter.id,
        subscriber_email: sub.email,
        status: 'sent',
        resend_message_id: result.id || null,
        sent_at: new Date().toISOString(),
      });

      sent++;
      console.log(`  ✅ ${sub.email}`);

      if (sent < newSubs.length) {
        await new Promise(r => setTimeout(r, SEND_DELAY_MS));
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ ${sub.email}: ${err.message}`);

      try {
        await supabasePost('newsletter_sends', {
          newsletter_id: newsletter.id,
          subscriber_email: sub.email,
          status: 'failed',
          error_message: err.message,
        });
      } catch (_) { /* silent */ }
    }
  }

  // 6. Update recipient count
  await supabasePatch('newsletters', `id=eq.${newsletter.id}`, {
    recipient_count: (newsletter.recipient_count || 0) + sent,
  });

  console.log(`\n=== Done ===`);
  console.log(`  Sent: ${sent}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Newsletter: ${newsletter.subject}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (RESEND_TO_NEW) {
    return resendToNew();
  }

  console.log('=== FRA Community Spotlight Mailer ===\n');

  // 1. Read the HTML template
  const html = readFileSync('community_spotlight_preview.html', 'utf-8');
  console.log(`HTML loaded: ${(html.length / 1024).toFixed(1)} KB`);

  const subject = '✨ Community Spotlight: The People Building Africa\'s Film Future';

  // 2. Build plain text fallback
  const plainText = `FILM RESOURCE AFRICA — Community Spotlight
March 2026

The People Building Africa's Film Future

Every month we spotlight the creators, platforms, and initiatives pushing African cinema forward.

01 — EVERBRIGHT
Open Air Screening initiative launching in Dar es Salaam, June/July 2026.
Backed by EFM – Berlinale funding. Sourcing feature films (60-90 min).
Read more: ${siteUrl}/news/community-everbright-a-producerdistributor-based-in-dar-es-salaam-tanzania-is-currently-so-mn3gskcu

02 — MEDIA PLAY
Open call for fiction series and documentary projects in development.
Deadline: 17 April 2026. Selected projects presented 27-29 May.
Read more: ${siteUrl}/news/community-open-call-for-projects-media-play-is-launching-an-open-call-for-projects-in-deve-mn3a4j5x

03 — WATCHROOM
"Social Cinema" distribution infrastructure. 10,000+ synchronized viewers.
80/20 revenue split. Selecting 3 pilot partners for Q2 2026.
Read more: ${siteUrl}/news/community-watchroom-launches-social-cinema-infrastructure-for-african-creators-mn34gzyn

04 — FILM ACCESS AFRICA
Grant application dashboard for producers, writers, and creators.
Read more: ${siteUrl}/news/community-film-access-africa-mn2zchxv

---
Want your project featured? Submit your story at ${siteUrl}/community-spotlight

Support the team: https://pay.yoco.com/celebration-house-entertainment

Film Resource Africa
${siteUrl}
`;

  console.log(`Subject: ${subject}`);

  // 3. Fetch subscribers
  const subscribers = await supabaseGet('newsletter_subscriptions', 'select=id,email&order=created_at.asc');
  console.log(`Subscribers: ${subscribers.length}`);

  if (subscribers.length === 0) {
    console.log('No subscribers found. Exiting.');
    return;
  }

  // 4. Store newsletter in Supabase
  const [newsletter] = await supabasePost('newsletters', {
    subject,
    body_html: html,
    body_plain: plainText,
    edition_date: new Date().toISOString().split('T')[0],
    status: DRY_RUN ? 'draft' : 'sending',
    recipient_count: subscribers.length,
    metadata: {
      type: 'community_spotlight',
      edition: 'March 2026',
    },
  });

  console.log(`Newsletter stored: ${newsletter.id}`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — not sending emails ---');
    console.log(`Draft saved with id: ${newsletter.id}`);
    return;
  }

  // 5. Send to all subscribers
  console.log('\nSending emails...\n');
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      const result = await sendEmail(sub.email, subject, html);

      await supabasePost('newsletter_sends', {
        newsletter_id: newsletter.id,
        subscriber_email: sub.email,
        status: 'sent',
        resend_message_id: result.id || null,
        sent_at: new Date().toISOString(),
      });

      sent++;
      console.log(`  ✅ ${sub.email}`);

      if (sent < subscribers.length) {
        await new Promise(r => setTimeout(r, SEND_DELAY_MS));
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ ${sub.email}: ${err.message}`);

      try {
        await supabasePost('newsletter_sends', {
          newsletter_id: newsletter.id,
          subscriber_email: sub.email,
          status: 'failed',
          error_message: err.message,
        });
      } catch (_) { /* silent */ }
    }
  }

  // 6. Update newsletter status
  const finalStatus = failed === subscribers.length ? 'failed' : 'sent';
  await supabasePatch('newsletters', `id=eq.${newsletter.id}`, {
    status: finalStatus,
    sent_at: new Date().toISOString(),
    recipient_count: sent,
  });

  console.log(`\n=== Done ===`);
  console.log(`  Sent: ${sent}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total subscribers: ${subscribers.length}`);
  console.log(`  Newsletter ID: ${newsletter.id}`);
  console.log(`  Status: ${finalStatus}`);
}

main().catch(err => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
