/**
 * FRA Mid-Week Hot News — Automated Send Script
 *
 * Pulls the latest published news from Supabase, generates a branded
 * news-focused HTML email, and sends to all subscribers via Resend.
 *
 * Distinct from the Monday weekly digest: news-only, no opportunities,
 * short punchy format — "what happened this week in African film".
 *
 * Usage:
 *   node send_midweek_news.mjs                 # generate + send
 *   node send_midweek_news.mjs --dry-run       # generate only, no send
 *   node send_midweek_news.mjs --preview        # write HTML to stdout
 *   node send_midweek_news.mjs --resend-to-new  # resend latest edition to subscribers who missed it
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
const RESEND_TO_NEW = args.includes('--resend-to-new');
const FROM_EMAIL = 'Film Resource Africa <hello@film-resource-africa.com>';
const SEND_DELAY_MS = 600; // Resend free tier: ~2/sec
const MIN_NEWS_ITEMS = 3; // Don't send if fewer than this

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

function getLastMonday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

async function fetchNewsSinceMonday() {
  const monday = getLastMonday();
  return supabaseGet(
    'news',
    `status=eq.published&published_at=gte.${monday}&order=published_at.desc&limit=8`
  );
}

async function fetchPartners() {
  return supabaseGet('partners', 'active=eq.true&order=created_at.asc&limit=10');
}

async function fetchSubscribers() {
  return supabaseGet('newsletter_subscriptions', 'select=id,email,unsubscribe_token&unsubscribed=eq.false&order=created_at.asc');
}

async function fetchOpportunityStats() {
  const closing = await supabaseGet('opportunities', 'status=eq.approved&application_status=eq.closing_soon&select=id');
  const total = await supabaseGet('opportunities', 'status=eq.approved&select=id');
  return { closingSoon: closing.length, total: total.length };
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDateLabel() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getMidweekId() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNo).padStart(2, '0')}-mid`;
}

// ─── HTML helpers ────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str, maxLen = 140) {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function getCategoryStyle(category) {
  const styles = {
    industry_news: { color: '#2f80ed', label: 'Industry News' },
    deadline_alert: { color: '#eb5757', label: 'Deadline Alert' },
    new_opportunity: { color: '#0f7b6c', label: 'New Opportunity' },
    tip: { color: '#d9730d', label: 'Pro Tip' },
    community_spotlight: { color: '#dfab01', label: 'Community Spotlight' },
  };
  return styles[category] || styles.industry_news;
}

// ─── HTML Template ───────────────────────────────────────────────────────────

function buildHotNewsHtml({ news, partners, dateLabel, oppStats, editionNumber }) {
  const lead = news[0];
  const inBrief = news.slice(1);
  const leadCat = getCategoryStyle(lead.category);
  const leadUrl = lead.slug ? `${siteUrl}/news/${lead.slug}` : `${siteUrl}/news`;
  const leadImage = lead.image_url || '';

  // Lead story
  let leadSection = `
          <tr>
            <td style="padding:0 24px 20px;">
              ${leadImage ? `
              <a href="${escapeHtml(leadUrl)}" style="text-decoration:none;">
                <img src="${escapeHtml(leadImage)}" alt="${escapeHtml(lead.title)}" width="592" style="width:100%;max-width:592px;height:auto;border-radius:10px;display:block;margin-bottom:16px;" />
              </a>` : ''}
              <span style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${leadCat.color};background:${leadCat.color}12;padding:3px 10px;border-radius:4px;">${escapeHtml(leadCat.label)}</span>
              <h2 style="margin:8px 0 6px;font-size:22px;font-weight:700;line-height:1.3;">
                <a href="${escapeHtml(leadUrl)}" style="color:#37352f;text-decoration:none;">${escapeHtml(lead.title)}</a>
              </h2>
              <p style="margin:0 0 12px;font-size:15px;color:#787774;line-height:1.6;">${escapeHtml(truncate(lead.summary, 200))}</p>
              <a href="${escapeHtml(leadUrl)}" style="display:inline-block;font-size:13px;font-weight:600;color:#2f80ed;text-decoration:none;">Read more &rarr;</a>
            </td>
          </tr>`;

  // In Brief section
  let inBriefSection = '';
  if (inBrief.length > 0) {
    let rows = '';
    for (const item of inBrief) {
      const cat = getCategoryStyle(item.category);
      const itemUrl = item.slug ? `${siteUrl}/news/${item.slug}` : `${siteUrl}/news`;
      rows += `
              <tr>
                <td style="padding:14px 20px;${inBrief.indexOf(item) < inBrief.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : ''}">
                  <span style="display:inline-block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:${cat.color};margin-bottom:2px;">${escapeHtml(cat.label)}</span>
                  <br/><a href="${escapeHtml(itemUrl)}" style="color:#37352f;font-weight:600;font-size:15px;text-decoration:none;line-height:1.4;">${escapeHtml(item.title)}</a>
                  ${item.summary ? `<br/><span style="color:#787774;font-size:13px;line-height:1.5;">${escapeHtml(truncate(item.summary, 120))}</span>` : ''}
                </td>
              </tr>`;
    }

    inBriefSection = `
          <tr><td style="padding:0 24px;"><div style="border-top:1px solid #e8e8e8;"></div></td></tr>
          <tr>
            <td style="padding:20px 24px 8px;">
              <h3 style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#37352f;">In Brief</h3>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">
                ${rows}
              </table>
            </td>
          </tr>`;
  }

  // Partners section
  let partnersSection = '';
  if (partners && partners.length > 0) {
    let partnerLogos = '';
    for (const p of partners) {
      const pUrl = p.website_url || siteUrl;
      const pLogo = p.logo_url;
      const pName = escapeHtml(p.name);
      if (pLogo) {
        partnerLogos += `
                <td style="padding:8px 10px;text-align:center;">
                  <a href="${escapeHtml(pUrl)}" style="text-decoration:none;">
                    <img src="${escapeHtml(pLogo)}" alt="${pName}" width="44" height="44" style="width:44px;height:44px;border-radius:8px;object-fit:contain;display:inline-block;" />
                  </a>
                </td>`;
      }
    }
    if (partnerLogos) {
      partnersSection = `
          <tr><td style="padding:20px 24px 0;"><div style="border-top:1px solid #e8e8e8;"></div></td></tr>
          <tr>
            <td style="padding:16px 24px 4px;">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#9b9a97;text-align:center;">Our Partners</p>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 24px 12px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>${partnerLogos}</tr>
              </table>
            </td>
          </tr>`;
    }
  }

  // Opportunity stats CTA
  const oppCta = oppStats.total > 0
    ? `Browse ${oppStats.total}+ opportunities${oppStats.closingSoon > 0 ? ` (${oppStats.closingSoon} closing soon)` : ''}`
    : 'Browse all opportunities';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FRA Hot News — ${dateLabel}</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans',Helvetica,Arial,sans-serif;color:#37352f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f3;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:12px;border:1px solid #e8e8e8;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:28px 24px 0;">
              <img src="${siteUrl}/logo_FRA.png" alt="Film Resource Africa" width="60" style="width:60px;display:block;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:10px 24px 0;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#37352f;">Film Resource Africa</p>
              <p style="margin:3px 0 0;font-size:11px;color:#9b9a97;text-transform:uppercase;letter-spacing:0.8px;">Hot News #${editionNumber} &middot; ${escapeHtml(dateLabel)}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:16px 24px 0;"><div style="border-top:1px solid #e8e8e8;"></div></td></tr>

          <!-- Lead Story -->
          <tr>
            <td style="padding:20px 24px 4px;">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#eb5757;">Top Story</p>
            </td>
          </tr>
          ${leadSection}

          <!-- In Brief -->
          ${inBriefSection}

          <!-- CTA -->
          <tr>
            <td style="padding:28px 24px 12px;" align="center">
              <a href="${siteUrl}/#directory" style="display:inline-block;background-color:#37352f;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">
                ${escapeHtml(oppCta)} &rarr;
              </a>
            </td>
          </tr>

          <!-- Partners -->
          ${partnersSection}

          <!-- Sign-off -->
          <tr>
            <td style="padding:20px 24px;font-size:13px;line-height:1.6;color:#787774;">
              Got a news tip? Just reply to this email.<br/><br/>
              Stay sharp,<br/>
              <strong style="color:#37352f;">Film Resource Africa</strong>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 24px 24px;font-size:11px;color:#9b9a97;line-height:1.6;border-top:1px solid #e8e8e8;">
              Made with passion in Africa &#127757;<br/>
              You're receiving this because you subscribed at ${siteUrl.replace('https://', '')}<br/>
              <a href="${siteUrl}" style="color:#2f80ed;text-decoration:none;">${siteUrl.replace('https://', '')}</a><br/><br/>
              <a href="{{UNSUBSCRIBE_URL}}" style="color:#9b9a97;text-decoration:underline;font-size:11px;">Unsubscribe</a>
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

function buildPlainText({ news, dateLabel, oppStats }) {
  let text = `FILM RESOURCE AFRICA — HOT NEWS\n${dateLabel}\n\n`;

  if (news.length > 0) {
    const lead = news[0];
    text += `=== TOP STORY ===\n\n`;
    text += `${lead.title}\n`;
    if (lead.summary) text += `${lead.summary}\n`;
    if (lead.slug) text += `Read more: ${siteUrl}/news/${lead.slug}\n`;
    text += '\n';

    const inBrief = news.slice(1);
    if (inBrief.length > 0) {
      text += `=== IN BRIEF ===\n\n`;
      for (const item of inBrief) {
        text += `* ${item.title}`;
        if (item.slug) text += `\n  ${siteUrl}/news/${item.slug}`;
        text += '\n';
      }
      text += '\n';
    }
  }

  text += `Browse ${oppStats.total}+ opportunities: ${siteUrl}/#directory\n\n`;
  text += `—\nFilm Resource Africa\n${siteUrl}\n`;

  return text;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function resendToNew() {
  console.log('=== FRA Mid-Week Hot News — Resend to New Subscribers ===\n');

  // 1. Find the latest sent midweek newsletter
  const latest = await supabaseGet('newsletters', 'status=eq.sent&subject=ilike.FRA%20Hot%20News*&order=sent_at.desc&limit=1');
  if (latest.length === 0) {
    console.log('No sent midweek newsletter found. Nothing to resend.');
    return;
  }
  const newsletter = latest[0];
  console.log(`Latest midweek edition: ${newsletter.subject}`);
  console.log(`  Sent at: ${newsletter.sent_at}\n`);

  // 2. Get all subscribers
  const allSubs = await fetchSubscribers();

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

async function main() {
  // Handle --resend-to-new flag
  if (RESEND_TO_NEW) {
    return resendToNew();
  }

  console.log('=== FRA Mid-Week Hot News ===\n');

  const dateLabel = getDateLabel();
  const midweekId = getMidweekId();
  console.log(`Edition date: ${dateLabel} (${midweekId})`);

  // 1. Check if a midweek newsletter was already sent this week
  const lastMonday = getLastMonday();
  const existing = await supabaseGet(
    'newsletters',
    `edition_date=gte.${lastMonday.split('T')[0]}&status=eq.sent&subject=ilike.FRA%20Hot%20News*&limit=1`
  );
  if (existing.length > 0 && !DRY_RUN && !PREVIEW) {
    console.log('\nMid-week news already sent this week. Skipping.');
    console.log(`  Sent: ${existing[0].sent_at}`);
    console.log(`  Subject: ${existing[0].subject}`);
    return;
  }

  // 2. Fetch news since Monday
  console.log('Fetching news since Monday...');
  const news = await fetchNewsSinceMonday();
  console.log(`  News items found: ${news.length}`);

  if (news.length < MIN_NEWS_ITEMS) {
    console.log(`\nOnly ${news.length} news item(s) since Monday — minimum is ${MIN_NEWS_ITEMS}. Skipping.`);
    return;
  }

  // 3. Fetch supporting data
  const [partners, oppStats] = await Promise.all([
    fetchPartners(),
    fetchOpportunityStats(),
  ]);
  console.log(`  Partners: ${partners.length}`);
  console.log(`  Opportunities: ${oppStats.total} total, ${oppStats.closingSoon} closing soon`);

  // 4. Calculate edition number (count previous midweek editions)
  const sentMidweek = await supabaseGet('newsletters', 'status=eq.sent&subject=ilike.FRA%20Hot%20News*&select=id');
  const editionNumber = sentMidweek.length + 1;
  console.log(`\nEdition: Hot News #${editionNumber}`);

  // 5. Generate HTML
  const data = { news, partners, dateLabel, oppStats, editionNumber };
  const html = buildHotNewsHtml(data);
  const plainText = buildPlainText(data);

  // Dynamic subject line — lead with the top story
  const leadTitle = news[0].title || 'What happened this week in African film';
  const shortTitle = leadTitle.length > 55 ? leadTitle.slice(0, 52).replace(/\s+\S*$/, '') + '...' : leadTitle;
  const subject = `FRA Hot News: ${shortTitle}`;

  if (PREVIEW) {
    process.stdout.write(html);
    return;
  }

  console.log(`\nSubject: ${subject}`);
  console.log(`HTML size: ${(html.length / 1024).toFixed(1)} KB`);
  console.log(`Stories: 1 lead + ${news.length - 1} in brief`);

  // 6. Fetch subscribers
  const subscribers = await fetchSubscribers();
  console.log(`Subscribers: ${subscribers.length}`);

  if (subscribers.length === 0) {
    console.log('No subscribers found. Exiting.');
    return;
  }

  // 7. Store newsletter in Supabase
  const [newsletter] = await supabasePost('newsletters', {
    subject,
    body_html: html,
    body_plain: plainText,
    edition_date: new Date().toISOString().split('T')[0],
    status: DRY_RUN ? 'draft' : 'sending',
    recipient_count: subscribers.length,
    metadata: {
      edition_type: 'midweek',
      news_count: news.length,
      midweek_id: midweekId,
      lead_story: news[0].slug || news[0].title,
    },
  });

  console.log(`\nNewsletter stored: ${newsletter.id}`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — not sending emails ---');
    console.log(`Draft saved with id: ${newsletter.id}`);
    const previewFile = `midweek_preview_${midweekId}.html`;
    writeFileSync(previewFile, html);
    console.log(`Preview written to: ${previewFile}`);
    return;
  }

  // 8. Send to all subscribers
  console.log('\nSending emails...\n');
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      const unsubscribeUrl = sub.unsubscribe_token
        ? `${siteUrl}/api/unsubscribe?token=${sub.unsubscribe_token}`
        : `${siteUrl}`;
      const personalHtml = html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);
      const result = await sendEmail(sub.email, subject, personalHtml);

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

  // 9. Update newsletter status
  const finalStatus = failed === subscribers.length ? 'failed' : 'sent';
  await supabasePatch('newsletters', `id=eq.${newsletter.id}`, {
    status: finalStatus,
    sent_at: new Date().toISOString(),
    recipient_count: sent,
  });

  // 10. Summary
  console.log(`\n=== Done ===`);
  console.log(`  Sent: ${sent}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total subscribers: ${subscribers.length}`);
  console.log(`  Newsletter ID: ${newsletter.id}`);
  console.log(`  Status: ${finalStatus}`);
  console.log(`  Lead story: ${news[0].title}`);
}

main().catch(err => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
