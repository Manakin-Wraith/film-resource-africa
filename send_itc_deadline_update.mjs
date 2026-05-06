/**
 * FRA One-off Mailer — ITC Deadline Extension
 *
 * Sends a short alert to all subscribers (or a single test address) notifying
 * them that the ITC film mentorship deadline has been extended to 9 May 2026.
 *
 * Usage:
 *   node send_itc_deadline_update.mjs --test-send=email@example.com
 *   node send_itc_deadline_update.mjs
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
const TEST_SEND_EMAIL = (args.find(a => a.startsWith('--test-send=')) || '').split('=')[1] || null;
const FROM_EMAIL = 'Film Resource Africa <hello@film-resource-africa.com>';
const SEND_DELAY_MS = 600;

const ITC_DOC_URL = 'https://docs.google.com/document/d/1rd9sb79VnYs-3cm6ahIeg-8DHuVdQbmz1qfk0FRCNKQ/edit?tab=t.0';
const ITC_APPLY_EMAIL = 'youthandtrade@intracen.org';
const NEW_DEADLINE = '9 May 2026';

// ─── Supabase helpers ────────────────────────────────────────────────────────

const sbHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function supabaseGet(table, query) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(`Supabase GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePost(table, body) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase POST ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, match, body) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${match}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${table} failed: ${res.status} ${await res.text()}`);
}

// ─── Resend helper ───────────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// ─── HTML ────────────────────────────────────────────────────────────────────

function buildHtml(unsubscribeUrl) {
  const mailtoUrl = `mailto:${ITC_APPLY_EMAIL}?subject=Expression%20of%20Interest%20%E2%80%94%20ITC%20Film%20Mentorship`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ITC Deadline Extended — FRA Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans',Helvetica,Arial,sans-serif;color:#37352f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f3;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;border:1px solid #e8e8e8;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 24px 0;">
              <img src="${siteUrl}/logo_FRA.png" alt="Film Resource Africa" width="64" style="width:64px;display:block;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:10px 24px 0;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#37352f;">Film Resource Africa</p>
              <p style="margin:4px 0 0;font-size:11px;color:#9b9a97;text-transform:uppercase;letter-spacing:1px;">Quick Update</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:20px 24px 0;"><div style="border-top:1px solid #e8e8e8;"></div></td></tr>

          <!-- Alert banner -->
          <tr>
            <td style="padding:24px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#fff8e6;border:1px solid #f0c75e;border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px 8px;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#b8860b;">
                      &#128197; Deadline Extended
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 16px;">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#37352f;line-height:1.3;">
                      ITC Film Mentorship — new deadline: <span style="color:#b8860b;">${NEW_DEADLINE}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 24px 0;font-size:14px;line-height:1.7;color:#37352f;">
              <p style="margin:0 0 14px;">
                Good news — the International Trade Centre (ITC) has extended the expression-of-interest deadline for their
                <strong>Film Mentorship &amp; Plenary Positions</strong> to <strong>${NEW_DEADLINE}</strong>.
                If you missed the original window, you still have time.
              </p>
              <p style="margin:0 0 14px;">There are <strong>11 paid positions</strong> available across:</p>
              <ul style="margin:0 0 14px;padding-left:20px;color:#37352f;font-size:14px;line-height:1.9;">
                <li>Writing for Film Mentorship &amp; Plenary Sessions</li>
                <li>Budgeting for Film Mentorship</li>
                <li>Pitch Deck Development Mentorship</li>
                <li>Marketing &amp; Distribution</li>
                <li>Pitching for Film</li>
                <li>Vertical Series Mentorship</li>
                <li>AI for Film Mentorship</li>
                <li>Co-Productions, Finance Plan &amp; ROI</li>
              </ul>
              <p style="margin:0 0 6px;">
                <strong>Rate:</strong> $30–45/hr &nbsp;&middot;&nbsp;
                <strong>Format:</strong> Remote + in-person (Kampala, Oct 2026)
              </p>
              <p style="margin:0 0 6px;">
                <strong>To apply:</strong> Email your EOI + CV + financial quotation + portfolio/links to
                <a href="mailto:${ITC_APPLY_EMAIL}" style="color:#2f80ed;font-weight:600;">${ITC_APPLY_EMAIL}</a>
              </p>

              <!-- Org-only note -->
              <p style="margin:16px 0 0;padding:12px 16px;background:#fdf3f3;border-left:3px solid #eb5757;border-radius:0 6px 6px 0;font-size:13px;color:#5c2b2b;line-height:1.6;">
                <strong>&#9888;&#65039; Please note:</strong> Applications are open to <strong>organisations only</strong> — individual applicants will not be considered directly by ITC.
              </p>
            </td>
          </tr>

          <!-- FRA membership assist -->
          <tr>
            <td style="padding:20px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#f0f7ff;border:1px solid #c3d8f8;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px 6px;">
                    <p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2f6be8;">
                      &#127775; Are you an individual filmmaker?
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 20px 16px;">
                    <p style="margin:0 0 10px;font-size:14px;color:#1a3a6e;line-height:1.65;">
                      Since ITC requires an organisational applicant, <strong>Film Resource Africa can submit on your behalf</strong> — connecting you directly with the programme under our umbrella.
                    </p>
                    <p style="margin:0 0 14px;font-size:13px;color:#3a5a8a;line-height:1.6;">
                      This is a benefit available to <strong>FRA members</strong>. Membership gives you access to application support, co-submission opportunities, and a growing network of African film professionals.
                    </p>
                    <a href="mailto:hello@film-resource-africa.com?subject=FRA%20Membership%20%E2%80%94%20ITC%20Application%20Support"
                      style="display:inline-block;background:#2f6be8;color:#ffffff;font-weight:600;font-size:13px;text-decoration:none;padding:9px 20px;border-radius:6px;">
                      Get in touch about membership &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA buttons -->
          <tr>
            <td style="padding:20px 24px 28px;" align="center">
              <a href="${ITC_DOC_URL}"
                style="display:inline-block;background:#37352f;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:11px 26px;border-radius:8px;margin-right:10px;">
                View all 11 positions &rarr;
              </a>
              <a href="mailto:${ITC_APPLY_EMAIL}?subject=Expression%20of%20Interest%20%E2%80%94%20ITC%20Film%20Mentorship"
                style="display:inline-block;color:#37352f;font-weight:600;font-size:14px;text-decoration:none;padding:11px 0;">
                Email to apply
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 24px;"><div style="border-top:1px solid #e8e8e8;"></div></td></tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:20px 24px 8px;font-size:14px;line-height:1.6;color:#787774;">
              Good luck — we hope to see African filmmakers across many of these positions.<br/><br/>
              <strong style="color:#37352f;">Film Resource Africa</strong>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 24px 28px;font-size:11px;color:#9b9a97;line-height:1.6;">
              Made with passion in Africa &#127757;<br/>
              <a href="${siteUrl}" style="color:#2f80ed;text-decoration:none;">${siteUrl.replace('https://', '')}</a><br/><br/>
              <a href="${unsubscribeUrl}" style="color:#9b9a97;text-decoration:underline;font-size:11px;">Unsubscribe</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== FRA — ITC Deadline Extension Alert ===\n');

  const subject = `FRA Alert: ITC Film Mentorship deadline extended to ${NEW_DEADLINE}`;

  let subscribers;
  if (TEST_SEND_EMAIL) {
    console.log(`--- TEST SEND — sending only to ${TEST_SEND_EMAIL} ---\n`);
    subscribers = [{ email: TEST_SEND_EMAIL, unsubscribe_token: null }];
  } else {
    subscribers = await supabaseGet(
      'newsletter_subscriptions',
      'select=id,email,unsubscribe_token&unsubscribed=eq.false&order=created_at.asc'
    );
    console.log(`Subscribers: ${subscribers.length}`);
    if (subscribers.length === 0) {
      console.log('No subscribers. Exiting.');
      return;
    }
  }

  // Store in newsletters table (skip for test)
  let newsletterId = 'test-preview';
  if (!TEST_SEND_EMAIL) {
    const sampleHtml = buildHtml(`${siteUrl}/api/unsubscribe`);
    const [rec] = await supabasePost('newsletters', {
      subject,
      body_html: sampleHtml,
      body_plain: `ITC Film Mentorship deadline extended to ${NEW_DEADLINE}.\nView positions: ${ITC_DOC_URL}\nApply: ${ITC_APPLY_EMAIL}`,
      edition_date: new Date().toISOString().split('T')[0],
      status: 'sending',
      recipient_count: subscribers.length,
      metadata: { type: 'itc_deadline_alert', new_deadline: NEW_DEADLINE },
    });
    newsletterId = rec.id;
    console.log(`Newsletter stored: ${newsletterId}\n`);
  }

  console.log('Sending...\n');
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      const unsubscribeUrl = sub.unsubscribe_token
        ? `${siteUrl}/api/unsubscribe?token=${sub.unsubscribe_token}`
        : `${siteUrl}`;

      const html = buildHtml(unsubscribeUrl);
      const result = await sendEmail(sub.email, subject, html);

      if (!TEST_SEND_EMAIL) {
        await supabasePost('newsletter_sends', {
          newsletter_id: newsletterId,
          subscriber_email: sub.email,
          status: 'sent',
          resend_message_id: result.id || null,
          sent_at: new Date().toISOString(),
        });
      }

      sent++;
      console.log(`  ✅ ${sub.email}`);

      if (sent < subscribers.length) {
        await new Promise(r => setTimeout(r, SEND_DELAY_MS));
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ ${sub.email}: ${err.message}`);

      if (!TEST_SEND_EMAIL) {
        try {
          await supabasePost('newsletter_sends', {
            newsletter_id: newsletterId,
            subscriber_email: sub.email,
            status: 'failed',
            error_message: err.message,
          });
        } catch (_) { /* silent */ }
      }
    }
  }

  if (!TEST_SEND_EMAIL) {
    const finalStatus = failed === subscribers.length ? 'failed' : 'sent';
    await supabasePatch('newsletters', `id=eq.${newsletterId}`, {
      status: finalStatus,
      sent_at: new Date().toISOString(),
      recipient_count: sent,
    });
    console.log(`\n=== Done ===`);
    console.log(`  Sent: ${sent} | Failed: ${failed}`);
    console.log(`  Newsletter ID: ${newsletterId}`);
  } else {
    console.log(`\n=== Test Send Done ===`);
    console.log(`  Sent to: ${TEST_SEND_EMAIL} — ${sent === 1 ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    console.log(`\n  Run without --test-send= to send to all subscribers.`);
  }
}

main().catch(err => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
