/**
 * FRA "Last Minute" Mailer — Friday Deadline Reminder
 *
 * Sends a high-urgency, visually distinct email every Friday (4–5 PM)
 * featuring opportunities closing within 1–5 days from the current date.
 *
 * Design: Dark theme, amber/red urgency palette — intentionally different
 * from the clean Notion-style weekly digest.
 *
 * Usage:
 *   node send_last_minute_mailer.mjs               # generate + send
 *   node send_last_minute_mailer.mjs --dry-run      # save to DB as draft, no send
 *   node send_last_minute_mailer.mjs --preview       # write HTML to stdout
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   RESEND_API_KEY, NEXT_PUBLIC_SITE_URL
 */

import { readFileSync, writeFileSync } from 'fs';

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
const PREVIEW = args.includes('--preview');
const FROM_EMAIL = 'Film Resource Africa <hello@film-resource-africa.com>';
const SEND_DELAY_MS = 600;

// ─── Supabase REST helpers ───────────────────────────────────────────────────

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

// ─── Resend helper ───────────────────────────────────────────────────────────

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

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchClosingWithinDays(days = 5) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const future = new Date(now);
  future.setDate(future.getDate() + days);
  const futureDate = future.toISOString().split('T')[0];

  // Opportunities with a deadline_date between today and today+5 days, approved
  return supabaseGet(
    'opportunities',
    `status=eq.approved&deadline_date=gte.${today}&deadline_date=lte.${futureDate}&order=deadline_date.asc`
  );
}

async function fetchSubscribers() {
  return supabaseGet('newsletter_subscriptions', 'select=id,email,unsubscribe_token&unsubscribed=eq.false&order=created_at.asc');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str, maxLen = 120) {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function daysLabel(days) {
  if (days === null || days === undefined) return '';
  if (days <= 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  return `${days} DAYS LEFT`;
}

function urgencyColor(days) {
  if (days === null || days === undefined) return { bg: '#f59e0b', text: '#ffffff' };
  if (days <= 1) return { bg: '#ef4444', text: '#ffffff' }; // red — critical
  if (days <= 3) return { bg: '#f97316', text: '#ffffff' }; // orange — urgent
  return { bg: '#f59e0b', text: '#1a1a1a' };                // amber — closing
}

/**
 * Wrap a URL through the click-tracking redirect endpoint.
 * Uses {{NEWSLETTER_ID}} and {{SEND_ID}} placeholders that are replaced
 * per-subscriber at send time for individual attribution.
 *
 * @param {string} url - Destination URL (internal or external)
 * @param {string} label - Human-readable link label for analytics (e.g. 'apply_0', 'browse_cta')
 * @returns {string} Tracking URL that redirects through /api/track/click
 */
function trackUrl(url, label = '') {
  const encoded = encodeURIComponent(url);
  let trackingUrl = `${siteUrl}/api/track/click?url=${encoded}&nid={{NEWSLETTER_ID}}&sid={{SEND_ID}}&c=last_minute`;
  if (label) trackingUrl += `&label=${encodeURIComponent(label)}`;
  return trackingUrl;
}

function getFridayDate() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── HTML Template — Dark + Urgency Theme ────────────────────────────────────

function buildOpportunityCard(opp, index) {
  const title = escapeHtml(opp.title);
  const days = daysUntil(opp.deadline_date);
  const label = daysLabel(days);
  const colors = urgencyColor(days);
  const deadline = opp.deadline_date ? formatDate(opp.deadline_date) : (opp['Next Deadline'] ? escapeHtml(truncate(opp['Next Deadline'], 50)) : '');
  const desc = escapeHtml(truncate(opp['What Is It?'], 100));
  const category = escapeHtml(opp.category || '');
  const cost = escapeHtml(opp.Cost || '');

  const applyLink = opp['Apply:'] || '';
  const linkMatch = applyLink.match(/(https?:\/\/[^\s|]+|[\w.-]+\.[a-z]{2,}[^\s|]*)/i);
  const rawUrl = linkMatch ? (linkMatch[0].startsWith('http') ? linkMatch[0] : `https://${linkMatch[0]}`) : `${siteUrl}/#directory`;
  const url = trackUrl(rawUrl, `last_minute_opp_${index}`);

  return `
              <tr>
                <td style="padding:0 24px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;border-radius:12px;border:1px solid #333333;overflow:hidden;">
                    <!-- Urgency badge row -->
                    <tr>
                      <td style="padding:16px 20px 0;">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:${colors.bg};color:${colors.text};font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;padding:4px 10px;border-radius:4px;">
                              &#9888; ${label}
                            </td>
                            ${category ? `<td style="padding-left:8px;"><span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#888888;background:#2a2a2a;padding:4px 8px;border-radius:4px;">${category}</span></td>` : ''}
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Title + deadline -->
                    <tr>
                      <td style="padding:12px 20px 0;">
                        <a href="${escapeHtml(url)}" style="color:#f5f5f5;font-weight:700;font-size:17px;text-decoration:none;line-height:1.4;">${title}</a>
                      </td>
                    </tr>
                    ${deadline ? `
                    <tr>
                      <td style="padding:6px 20px 0;">
                        <span style="color:#999999;font-size:12px;">&#128197; Deadline: ${deadline}</span>
                      </td>
                    </tr>` : ''}
                    ${desc ? `
                    <tr>
                      <td style="padding:8px 20px 0;">
                        <span style="color:#aaaaaa;font-size:13px;line-height:1.5;">${desc}</span>
                      </td>
                    </tr>` : ''}
                    <!-- Cost + Apply row -->
                    <tr>
                      <td style="padding:14px 20px 16px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="vertical-align:middle;">
                              ${cost ? `<span style="color:#4ade80;font-size:12px;font-weight:600;">${cost === 'Free' ? '&#10003; Free to apply' : cost}</span>` : ''}
                            </td>
                            <td style="vertical-align:middle;text-align:right;">
                              <a href="${escapeHtml(url)}" style="display:inline-block;background:${colors.bg};color:${colors.text};font-weight:700;font-size:12px;text-decoration:none;padding:8px 18px;border-radius:6px;">Apply Now &rarr;</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

function buildLastMinuteHtml(opportunities) {
  const dateLabel = getFridayDate();
  const count = opportunities.length;

  // Group by urgency for the countdown header
  const critical = opportunities.filter(o => daysUntil(o.deadline_date) <= 1).length;
  const urgent = opportunities.filter(o => { const d = daysUntil(o.deadline_date); return d > 1 && d <= 3; }).length;
  const closing = opportunities.filter(o => daysUntil(o.deadline_date) > 3).length;

  let cards = '';
  for (let i = 0; i < opportunities.length; i++) {
    cards += buildOpportunityCard(opportunities[i], i);
  }

  // Stats bar showing urgency breakdown
  let statsBar = '';
  if (critical > 0) statsBar += `<td style="padding:0 6px;"><span style="color:#ef4444;font-size:13px;font-weight:700;">${critical}</span> <span style="color:#999;font-size:12px;">today/tomorrow</span></td>`;
  if (urgent > 0) statsBar += `<td style="padding:0 6px;"><span style="color:#f97316;font-size:13px;font-weight:700;">${urgent}</span> <span style="color:#999;font-size:12px;">2-3 days</span></td>`;
  if (closing > 0) statsBar += `<td style="padding:0 6px;"><span style="color:#f59e0b;font-size:13px;font-weight:700;">${closing}</span> <span style="color:#999;font-size:12px;">4-5 days</span></td>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Last Minute — Deadlines Closing This Weekend</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans',Helvetica,Arial,sans-serif;color:#e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#141414;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">

          <!-- Urgency Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#7f1d1d 0%,#451a03 50%,#1c1917 100%);padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:28px 24px 8px;">
                    <span style="font-size:36px;">&#9200;</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 24px;">
                    <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">LAST MINUTE</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:6px 24px 0;">
                    <p style="margin:0;font-size:14px;color:#fbbf24;font-weight:600;letter-spacing:0.5px;">FRIDAY DEADLINE ALERT</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 24px 24px;">
                    <p style="margin:0;font-size:12px;color:#a8a29e;">${escapeHtml(dateLabel)} &middot; Film Resource Africa</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Countdown Stats Bar -->
          <tr>
            <td style="padding:20px 24px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;border:1px solid #2a2a2a;">
                <tr>
                  <td style="padding:14px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;">
                          <span style="font-size:24px;font-weight:800;color:#ffffff;">${count}</span>
                          <span style="font-size:13px;color:#888;"> deadline${count !== 1 ? 's' : ''} closing</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:14px 16px;text-align:right;">
                    <table role="presentation" cellpadding="0" cellspacing="0" align="right">
                      <tr>
                        ${statsBar}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro copy -->
          <tr>
            <td style="padding:16px 24px 20px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a3a3a3;">
                These opportunities close within the next 5 days. Don't let the weekend slip by without hitting submit. We've pulled the ones that matter most — act now.
              </p>
            </td>
          </tr>

          <!-- Opportunity Cards -->
          ${cards}

          <!-- Browse All CTA -->
          <tr>
            <td align="center" style="padding:8px 24px 28px;">
              <a href="${trackUrl(`${siteUrl}/#directory`, 'last_minute_browse')}" style="display:inline-block;background:#f59e0b;color:#1a1a1a;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.3px;">
                Browse All Opportunities &rarr;
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 24px;"><div style="border-top:1px solid #2a2a2a;"></div></td></tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:24px 24px 12px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#737373;">
                This is your <strong style="color:#d4d4d4;">Last Minute</strong> alert — sent every Friday at 4 PM so you never miss a closing deadline.
              </p>
              <p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#737373;">
                Spotted an opportunity we missed? Reply to this email.
              </p>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding:8px 24px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px;text-align:center;">
                    <span style="font-size:13px;color:#a3a3a3;">We keep FRA free for African filmmakers &#9749;</span>
                    <br/>
                    <a href="https://pay.yoco.com/celebration-house-entertainment" style="color:#fbbf24;font-size:12px;font-weight:600;text-decoration:none;">Buy the team a coffee &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 24px 24px;font-size:11px;color:#525252;line-height:1.6;border-top:1px solid #2a2a2a;">
              Made with passion in Africa &#127757;<br/>
              You're receiving this because you subscribed at ${siteUrl.replace('https://', '')}<br/>
              <a href="${trackUrl(siteUrl, 'footer')}" style="color:#f59e0b;text-decoration:none;">${siteUrl.replace('https://', '')}</a><br/><br/>
              <a href="{{UNSUBSCRIBE_URL}}" style="color:#525252;text-decoration:underline;font-size:11px;">Unsubscribe</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Plain text fallback ─────────────────────────────────────────────────────

function buildPlainText(opportunities) {
  let text = `⏰ LAST MINUTE — FRIDAY DEADLINE ALERT\n`;
  text += `Film Resource Africa | ${getFridayDate()}\n\n`;
  text += `${opportunities.length} deadline${opportunities.length !== 1 ? 's' : ''} closing in the next 5 days:\n\n`;

  for (const opp of opportunities) {
    const days = daysUntil(opp.deadline_date);
    const label = daysLabel(days);
    text += `[${label}] ${opp.title}`;
    if (opp.deadline_date) text += ` — ${formatDate(opp.deadline_date)}`;
    if (opp.Cost) text += ` | ${opp.Cost}`;
    text += '\n';
  }

  text += `\nBrowse all opportunities: ${siteUrl}/#directory\n\n`;
  text += `—\nFilm Resource Africa\n${siteUrl}\n`;

  return text;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // When --preview, redirect all log output to stderr so stdout is clean HTML
  const log = PREVIEW ? (...a) => console.error(...a) : console.log.bind(console);

  log('=== FRA Last Minute — Friday Deadline Alert ===\n');

  const dateLabel = getFridayDate();
  log(`Date: ${dateLabel}`);

  // 1. Fetch opportunities closing within 1-5 days
  log('Fetching opportunities closing within 5 days...');
  const closingOpps = await fetchClosingWithinDays(5);
  log(`  Found: ${closingOpps.length} opportunities`);

  if (closingOpps.length === 0) {
    log('\nNo opportunities closing in the next 5 days. Skipping send.');
    return;
  }

  // Log breakdown
  for (const opp of closingOpps) {
    const days = daysUntil(opp.deadline_date);
    log(`  - [${daysLabel(days)}] ${opp.title} (${formatDate(opp.deadline_date)})`);
  }

  // 2. Generate HTML
  const html = buildLastMinuteHtml(closingOpps);
  const plainText = buildPlainText(closingOpps);

  // Dynamic subject line
  const criticalCount = closingOpps.filter(o => daysUntil(o.deadline_date) <= 1).length;
  let subject;
  if (criticalCount > 0) {
    subject = `⏰ ${criticalCount} deadline${criticalCount !== 1 ? 's' : ''} closing TODAY — Last Minute Alert`;
  } else {
    subject = `⏰ ${closingOpps.length} deadline${closingOpps.length !== 1 ? 's' : ''} closing this weekend — Last Minute Alert`;
  }

  if (PREVIEW) {
    process.stdout.write(html);
    return;
  }

  console.log(`\nSubject: ${subject}`);
  console.log(`HTML size: ${(html.length / 1024).toFixed(1)} KB`);

  // 3. Fetch subscribers
  const subscribers = await fetchSubscribers();
  console.log(`Subscribers: ${subscribers.length}`);

  if (subscribers.length === 0) {
    console.log('No subscribers found. Exiting.');
    return;
  }

  // 4. Store newsletter record in Supabase
  const [newsletter] = await supabasePost('newsletters', {
    subject,
    body_html: html,
    body_plain: plainText,
    edition_date: new Date().toISOString().split('T')[0],
    status: DRY_RUN ? 'draft' : 'sending',
    recipient_count: subscribers.length,
    metadata: {
      type: 'last_minute',
      closing_count: closingOpps.length,
      critical_count: criticalCount,
    },
  });

  console.log(`\nNewsletter stored: ${newsletter.id}`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — not sending emails ---');
    console.log(`Draft saved with id: ${newsletter.id}`);
    const filename = `last_minute_preview_${new Date().toISOString().split('T')[0]}.html`;
    writeFileSync(filename, html);
    console.log(`Preview written to: ${filename}`);
    return;
  }

  // 5. Send to all subscribers (with per-subscriber click tracking)
  //    - Replace {{NEWSLETTER_ID}} once in the template
  //    - Pre-insert a newsletter_sends record to get the send_id
  //    - Replace {{SEND_ID}} per-subscriber so every link tracks back to them
  console.log('\nSending emails...\n');
  let sent = 0;
  let failed = 0;

  const htmlWithNid = html.replace(/\{\{NEWSLETTER_ID\}\}/g, newsletter.id);

  for (const sub of subscribers) {
    try {
      // Pre-insert send record to get its ID for tracking links
      const [sendRecord] = await supabasePost('newsletter_sends', {
        newsletter_id: newsletter.id,
        subscriber_email: sub.email,
        status: 'pending',
      });

      // Personalise HTML with this subscriber's send ID and unsubscribe link
      const unsubscribeUrl = sub.unsubscribe_token
        ? `${siteUrl}/api/unsubscribe?token=${sub.unsubscribe_token}`
        : `${siteUrl}`;
      const personalHtml = htmlWithNid
        .replace(/\{\{SEND_ID\}\}/g, sendRecord.id)
        .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);

      const result = await sendEmail(sub.email, subject, personalHtml);

      // Update send record with success
      await supabasePatch('newsletter_sends', `id=eq.${sendRecord.id}`, {
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

  // 7. Summary
  console.log(`\n=== Done ===`);
  console.log(`  Sent: ${sent}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total subscribers: ${subscribers.length}`);
  console.log(`  Newsletter ID: ${newsletter.id}`);
  console.log(`  Status: ${finalStatus}`);
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
