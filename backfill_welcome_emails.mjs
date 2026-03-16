import { readFileSync } from 'fs';

// Load .env.local manually (no dotenv dependency needed)
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
if (env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Using service role key (bypasses RLS)\n');
} else {
  console.warn('Warning: No SUPABASE_SERVICE_ROLE_KEY found, using anon key (may be blocked by RLS)\n');
}
if (!resendApiKey) { console.error('Missing RESEND_API_KEY'); process.exit(1); }

// Supabase REST helpers
async function supabaseGet(table, query) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) throw new Error(`Supabase GET failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, match, body) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${match}`, {
    method: 'PATCH',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase PATCH failed: ${res.status} ${await res.text()}`);
}

// Resend REST helper
async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Film Resource Africa <hello@film-resource-africa.com>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend failed (${res.status}): ${err}`);
  }
  return res.json();
}

// Inline the welcome email HTML (same as src/lib/welcomeEmail.ts)
function buildWelcomeEmailHtml(siteUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Film Resource Africa</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e0e0e0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${siteUrl}/icon.png" alt="Film Resource Africa" width="48" height="48" style="border-radius:12px;" />
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">
                Welcome to Film Resource Africa.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;font-size:16px;line-height:1.6;color:#b0b0b0;">
              You just joined a growing community of African filmmakers, screenwriters, and producers who refuse to miss another deadline.
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:8px;">
              <h2 style="margin:0;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#ffffff;">
                Here's what you'll get every week
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;font-size:15px;line-height:1.5;">
                    <span style="color:#ef4444;">&#9679;</span>&nbsp;&nbsp;<strong style="color:#ffffff;">Deadline alerts</strong><br/>
                    <span style="color:#888;font-size:14px;">Funds and labs closing soon &mdash; so you never discover them a day too late</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;font-size:15px;line-height:1.5;">
                    <span style="color:#22c55e;">&#9679;</span>&nbsp;&nbsp;<strong style="color:#ffffff;">New opportunities</strong><br/>
                    <span style="color:#888;font-size:14px;">Grants, co-production funds, screenwriting labs, pitch forums</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;font-size:15px;line-height:1.5;">
                    <span style="color:#3b82f6;">&#9679;</span>&nbsp;&nbsp;<strong style="color:#ffffff;">Industry shifts</strong><br/>
                    <span style="color:#888;font-size:14px;">Platform changes, new funds, and market moves that affect your career</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;font-size:15px;line-height:1.5;">
                    <span style="color:#f59e0b;">&#9679;</span>&nbsp;&nbsp;<strong style="color:#ffffff;">Pro tips</strong><br/>
                    <span style="color:#888;font-size:14px;">Financing strategies, application advice, and market navigation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:8px;">
              <h2 style="margin:0;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#ffffff;">
                Don't wait until next week &mdash; start now
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:12px;padding-top:16px;" align="center">
              <a href="${siteUrl}/#directory" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:14px 32px;border-radius:12px;">
                Browse Open Opportunities &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;padding-top:8px;" align="center">
              <a href="${siteUrl}/news" style="font-size:14px;color:#3b82f6;text-decoration:underline;">
                Read the latest industry news
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <div style="border-top:1px solid #1a1a1a;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;font-size:14px;line-height:1.7;color:#888;font-style:italic;">
              We built this because African creators deserve the same access to funding information that filmmakers in LA, London, and Paris take for granted. Every opportunity in our directory is verified and deadline-tracked.
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:15px;color:#ffffff;font-weight:700;">
                      &#9749; Support the team
                    </p>
                    <p style="margin:0 0 16px;font-size:13px;color:#888;line-height:1.5;">
                      We're a small team keeping this resource free for African filmmakers. Every coffee keeps us going.
                    </p>
                    <a href="https://pay.yoco.com/celebration-house-entertainment" style="display:inline-block;background-color:#f59e0b;color:#000000;font-weight:700;font-size:14px;text-decoration:none;padding:10px 24px;border-radius:10px;">
                      Buy the team a coffee &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;font-size:15px;line-height:1.6;color:#b0b0b0;">
              Spotted an opportunity we're missing? Just reply to this email.<br/><br/>
              Talk soon,<br/>
              <strong style="color:#ffffff;">Film Resource Africa</strong><br/>
              <a href="${siteUrl}" style="color:#3b82f6;text-decoration:none;font-size:14px;">${siteUrl.replace('https://', '')}</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;border-top:1px solid #1a1a1a;font-size:11px;color:#555;line-height:1.6;">
              Made with passion in Africa &#127757;<br/>
              You're receiving this because you subscribed at ${siteUrl.replace('https://', '')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function main() {
  // 1. Fetch all subscribers who haven't received a welcome email
  console.log('Fetching subscribers who need a welcome email...\n');

  const subscribers = await supabaseGet(
    'newsletter_subscriptions',
    'select=id,email,welcome_email_sent,created_at&or=(welcome_email_sent.is.null,welcome_email_sent.eq.false)&order=created_at.asc'
  );

  if (!subscribers || subscribers.length === 0) {
    console.log('All subscribers have already received their welcome email. Nothing to do.');
    return;
  }

  console.log(`Found ${subscribers.length} subscriber(s) to email:\n`);
  subscribers.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.email} (subscribed: ${s.created_at})`);
  });
  console.log('');

  // 2. Send welcome emails with a small delay between each (Resend rate limits)
  const html = buildWelcomeEmailHtml(siteUrl);
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      await sendEmail(
        sub.email,
        'Welcome to Film Resource Africa — your first deadline alert is inside',
        html
      );

      // Mark as sent in Supabase
      await supabasePatch(
        'newsletter_subscriptions',
        `id=eq.${sub.id}`,
        { welcome_email_sent: true, welcome_email_sent_at: new Date().toISOString() }
      );

      sent++;
      console.log(`  ✅ Sent to ${sub.email}`);

      // Small delay to respect rate limits (Resend free tier: 2/sec)
      if (sent < subscribers.length) {
        await new Promise(r => setTimeout(r, 600));
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed for ${sub.email}:`, err.message || err);
    }
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}, Total: ${subscribers.length}`);
}

main();
