/**
 * FRA Weekly Newsletter — Automated Send Script
 *
 * Pulls opportunities from Supabase, generates a branded HTML newsletter,
 * and sends to all subscribers via Resend.
 *
 * Usage:
 *   node send_weekly_newsletter.mjs                 # generate + send
 *   node send_weekly_newsletter.mjs --dry-run       # generate only, no send
 *   node send_weekly_newsletter.mjs --preview        # write HTML to stdout
 *   node send_weekly_newsletter.mjs --resend-to-new  # resend latest edition to subscribers who missed it
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

async function fetchClosingSoon() {
  // Opportunities with application_status = 'closing_soon', ordered by deadline
  return supabaseGet(
    'opportunities',
    'status=eq.approved&application_status=eq.closing_soon&order=deadline_date.asc&limit=10'
  );
}

async function fetchNewlyOpen() {
  // Opportunities with application_status = 'open', most recent first
  return supabaseGet(
    'opportunities',
    'status=eq.approved&application_status=eq.open&order=id.desc&limit=10'
  );
}

async function fetchJustAdded() {
  // Opportunities added in the last 14 days
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const dateStr = twoWeeksAgo.toISOString();
  return supabaseGet(
    'opportunities',
    `status=eq.approved&created_at=gte.${dateStr}&order=created_at.desc&limit=10`
  );
}

async function fetchRecentNews() {
  // Latest 3 news items
  return supabaseGet('news', 'order=published_at.desc&limit=3');
}

async function fetchProTip() {
  // Get the least-used pro tip
  const tips = await supabaseGet(
    'newsletter_pro_tips',
    'order=used_count.asc,last_used_at.asc.nullsfirst&limit=1'
  );
  if (tips.length > 0) {
    // Mark as used
    await supabasePatch(
      'newsletter_pro_tips',
      `id=eq.${tips[0].id}`,
      { used_count: (tips[0].used_count || 0) + 1, last_used_at: new Date().toISOString() }
    );
    return tips[0];
  }
  return null;
}

async function fetchCallSheetListings() {
  // Approved call sheet listings from the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const dateStr = oneWeekAgo.toISOString();
  return supabaseGet(
    'call_sheet_listings',
    `status=eq.approved&created_at=gte.${dateStr}&order=created_at.desc&limit=5`
  );
}

async function fetchCommunitySpotlights() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const dateStr = oneWeekAgo.toISOString();
  return supabaseGet(
    'news',
    `category=eq.community_spotlight&status=eq.published&published_at=gte.${dateStr}&order=published_at.desc&limit=3`
  );
}

async function fetchSubscribers() {
  return supabaseGet('newsletter_subscriptions', 'select=id,email&order=created_at.asc');
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getWeekLabel() {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleDateString('en-GB', { month: 'long' });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

function getISOWeek() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─── HTML Template ───────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str, maxLen = 120) {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function buildOpportunityRow(opp, accentColor) {
  const title = escapeHtml(opp.title);
  const deadline = opp.deadline_date ? formatDate(opp.deadline_date) : (opp['Next Deadline'] ? escapeHtml(truncate(opp['Next Deadline'], 60)) : '');
  const desc = escapeHtml(truncate(opp['What Is It?'], 100));
  const cost = escapeHtml(opp.Cost || '');
  const applyLink = opp['Apply:'] || '';
  // Extract first URL-ish thing from the apply field
  const linkMatch = applyLink.match(/(https?:\/\/[^\s|]+|[\w.-]+\.[a-z]{2,}[^\s|]*)/i);
  const url = linkMatch ? (linkMatch[0].startsWith('http') ? linkMatch[0] : `https://${linkMatch[0]}`) : `${siteUrl}/#directory`;

  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #1a1a1a;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;width:8px;padding-top:5px;">
              <span style="color:${accentColor};font-size:10px;">&#9679;</span>
            </td>
            <td style="padding-left:10px;">
              <a href="${escapeHtml(url)}" style="color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;">${title}</a>
              ${deadline ? `<br/><span style="color:${accentColor};font-size:12px;font-weight:600;">Deadline: ${deadline}</span>` : ''}
              ${cost ? `<span style="color:#888;font-size:12px;"> &middot; ${cost}</span>` : ''}
              ${desc ? `<br/><span style="color:#888;font-size:13px;line-height:1.5;">${desc}</span>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildSectionHeading(emoji, title) {
  return `
    <tr>
      <td style="padding:28px 0 8px 0;">
        <h2 style="margin:0;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#ffffff;">
          ${emoji}&nbsp;&nbsp;${escapeHtml(title)}
        </h2>
      </td>
    </tr>`;
}

function buildNewsletterHtml({ closingSoon, newlyOpen, justAdded, news, proTip, weekLabel, callSheetListings, communitySpotlights }) {
  // Deduplicate: if an opp appears in closingSoon, don't show it again in newlyOpen or justAdded
  const closingIds = new Set(closingSoon.map(o => o.id));
  const openIds = new Set(newlyOpen.map(o => o.id));
  const filteredOpen = newlyOpen.filter(o => !closingIds.has(o.id));
  const filteredAdded = justAdded.filter(o => !closingIds.has(o.id) && !openIds.has(o.id));

  // Build sections
  let sections = '';

  // Section 1: Closing Soon (red)
  if (closingSoon.length > 0) {
    sections += buildSectionHeading('&#128308;', 'Deadlines Closing Soon');
    sections += '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
    for (const opp of closingSoon) {
      sections += buildOpportunityRow(opp, '#ef4444');
    }
    sections += '</table></td></tr>';
  }

  // Section 2: Open Now (green)
  if (filteredOpen.length > 0) {
    sections += buildSectionHeading('&#128994;', 'Open for Applications');
    sections += '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
    for (const opp of filteredOpen) {
      sections += buildOpportunityRow(opp, '#22c55e');
    }
    sections += '</table></td></tr>';
  }

  // Section 3: Just Added (blue)
  if (filteredAdded.length > 0) {
    sections += buildSectionHeading('&#128309;', 'Just Added');
    sections += '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
    for (const opp of filteredAdded) {
      sections += buildOpportunityRow(opp, '#3b82f6');
    }
    sections += '</table></td></tr>';
  }

  // Section 4: News (if any)
  if (news.length > 0) {
    sections += buildSectionHeading('&#128240;', 'Industry News');
    sections += '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
    for (const item of news) {
      const slug = item.slug || '';
      const newsUrl = slug ? `${siteUrl}/news/${slug}` : `${siteUrl}/news`;
      sections += `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
            <a href="${escapeHtml(newsUrl)}" style="color:#3b82f6;font-weight:600;font-size:14px;text-decoration:none;">${escapeHtml(item.title)}</a>
            ${item.summary ? `<br/><span style="color:#888;font-size:13px;">${escapeHtml(truncate(item.summary, 120))}</span>` : ''}
          </td>
        </tr>`;
    }
    sections += '</table></td></tr>';
  }

  // Section 5: Pro Tip (amber)
  if (proTip) {
    sections += `
      <tr>
        <td style="padding:28px 0 12px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#f59e0b;">
                  &#128161; Pro Tip of the Week
                </p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#b0b0b0;">
                  ${escapeHtml(proTip.tip_text)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  // Section 6: Call Sheet listings (teal)
  if (callSheetListings && callSheetListings.length > 0) {
    sections += `
      <tr>
        <td style="padding:28px 0 8px 0;">
          <h2 style="margin:0;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#ffffff;">
            &#127916;&nbsp;&nbsp;The Call Sheet — Crew Calls
          </h2>
          <p style="margin:4px 0 0;font-size:12px;color:#888;">Paid roles on African productions</p>
        </td>
      </tr>`;
    sections += '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
    for (const listing of callSheetListings) {
      const mentorBadge = listing.mentorship_included
        ? '<span style="display:inline-block;background:#f59e0b20;color:#f59e0b;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-left:6px;">MENTORSHIP</span>'
        : '';
      sections += `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
            <a href="${siteUrl}/call-sheet" style="color:#2dd4bf;font-weight:700;font-size:15px;text-decoration:none;">${escapeHtml(listing.title)}</a>${mentorBadge}
            <br/><span style="color:#888;font-size:13px;">${escapeHtml(listing.production_title)} &middot; ${escapeHtml(listing.production_company)}</span>
            <br/><span style="color:#2dd4bf;font-size:13px;font-weight:600;">${escapeHtml(listing.compensation)}</span>
            <span style="color:#555;font-size:12px;"> &middot; ${escapeHtml(listing.location)}</span>
          </td>
        </tr>`;
    }
    sections += '</table></td></tr>';
    sections += `
      <tr>
        <td style="padding:12px 0 0;" align="center">
          <a href="${siteUrl}/call-sheet" style="color:#2dd4bf;font-size:13px;font-weight:600;text-decoration:none;">View all crew calls &rarr;</a>
        </td>
      </tr>`;
  }

  // Section 7: Community Spotlight (yellow)
  if (communitySpotlights && communitySpotlights.length > 0) {
    sections += `
      <tr>
        <td style="padding:28px 0 8px 0;">
          <h2 style="margin:0;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#ffffff;">
            &#11088;&nbsp;&nbsp;Community Spotlight
          </h2>
          <p style="margin:4px 0 0;font-size:12px;color:#888;">Stories from the FRA community</p>
        </td>
      </tr>`;
    sections += '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
    for (const item of communitySpotlights) {
      const slug = item.slug || '';
      const spotlightUrl = slug ? `${siteUrl}/news/${slug}` : `${siteUrl}/news`;
      sections += `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
            <a href="${escapeHtml(spotlightUrl)}" style="color:#eab308;font-weight:700;font-size:15px;text-decoration:none;">${escapeHtml(item.title)}</a>
            ${item.submitted_by_name ? `<br/><span style="color:#888;font-size:12px;">Submitted by ${escapeHtml(item.submitted_by_name)}</span>` : ''}
            ${item.summary ? `<br/><span style="color:#888;font-size:13px;">${escapeHtml(truncate(item.summary, 140))}</span>` : ''}
          </td>
        </tr>`;
    }
    sections += '</table></td></tr>';
    sections += `
      <tr>
        <td style="padding:12px 0 0;" align="center">
          <a href="${siteUrl}/community-spotlight" style="color:#eab308;font-size:13px;font-weight:600;text-decoration:none;">Share your story &rarr;</a>
        </td>
      </tr>`;
  }

  // Empty state
  if (!closingSoon.length && !filteredOpen.length && !filteredAdded.length && !news.length) {
    sections += `
      <tr>
        <td style="padding:24px 0;font-size:15px;color:#888;line-height:1.6;">
          No major updates this week — but keep an eye on the directory. New opportunities land all the time.
        </td>
      </tr>`;
  }

  // Stats line
  const totalOpps = closingSoon.length + filteredOpen.length + filteredAdded.length;

  // Full email
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FRA Weekly — ${weekLabel}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e0e0e0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${siteUrl}/icon.png" alt="Film Resource Africa" width="48" height="48" style="border-radius:12px;" />
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding-bottom:8px;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
                Weekly Opportunities Digest
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#888;">
                Week of ${escapeHtml(weekLabel)} &middot; ${totalOpps} opportunities highlighted
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding-bottom:4px;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr>

          <!-- Dynamic sections -->
          ${sections}

          <!-- CTA -->
          <tr>
            <td style="padding:28px 0 12px 0;" align="center">
              <a href="${siteUrl}/#directory" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:14px 32px;border-radius:12px;">
                Browse All Opportunities &rarr;
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:24px 0;"><div style="border-top:1px solid #1a1a1a;"></div></td></tr>

          <!-- Coffee CTA -->
          <tr>
            <td style="padding-bottom:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:15px;color:#ffffff;font-weight:700;">
                      &#9749; Support the team
                    </p>
                    <p style="margin:0 0 12px;font-size:13px;color:#888;line-height:1.5;">
                      We keep this resource free for African filmmakers. Every coffee helps.
                    </p>
                    <a href="https://pay.yoco.com/celebration-house-entertainment" style="display:inline-block;background-color:#f59e0b;color:#000000;font-weight:700;font-size:14px;text-decoration:none;padding:10px 24px;border-radius:10px;">
                      Buy the team a coffee &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding-bottom:24px;font-size:14px;line-height:1.6;color:#b0b0b0;">
              Spotted an opportunity we're missing? Just reply to this email.<br/><br/>
              Until next week,<br/>
              <strong style="color:#ffffff;">Film Resource Africa</strong>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;border-top:1px solid #1a1a1a;font-size:11px;color:#555;line-height:1.6;">
              Made with passion in Africa &#127757;<br/>
              You're receiving this because you subscribed at ${siteUrl.replace('https://', '')}<br/>
              <a href="${siteUrl}" style="color:#3b82f6;text-decoration:none;">${siteUrl.replace('https://', '')}</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Plain text fallback generator ───────────────────────────────────────────

function buildPlainText({ closingSoon, newlyOpen, justAdded, news, proTip, weekLabel, callSheetListings }) {
  let text = `FILM RESOURCE AFRICA — Weekly Opportunities Digest\nWeek of ${weekLabel}\n\n`;

  if (closingSoon.length > 0) {
    text += '--- DEADLINES CLOSING SOON ---\n\n';
    for (const opp of closingSoon) {
      text += `* ${opp.title}`;
      if (opp.deadline_date) text += ` — Deadline: ${formatDate(opp.deadline_date)}`;
      if (opp.Cost) text += ` | ${opp.Cost}`;
      text += '\n';
    }
    text += '\n';
  }

  if (newlyOpen.length > 0) {
    text += '--- OPEN FOR APPLICATIONS ---\n\n';
    for (const opp of newlyOpen) {
      text += `* ${opp.title}`;
      if (opp.Cost) text += ` | ${opp.Cost}`;
      text += '\n';
    }
    text += '\n';
  }

  if (justAdded.length > 0) {
    text += '--- JUST ADDED ---\n\n';
    for (const opp of justAdded) {
      text += `* ${opp.title}\n`;
    }
    text += '\n';
  }

  if (news.length > 0) {
    text += '--- INDUSTRY NEWS ---\n\n';
    for (const item of news) {
      text += `* ${item.title}\n`;
    }
    text += '\n';
  }

  if (proTip) {
    text += `--- PRO TIP OF THE WEEK ---\n\n${proTip.tip_text}\n\n`;
  }

  if (callSheetListings && callSheetListings.length > 0) {
    text += '--- THE CALL SHEET — CREW CALLS ---\n\n';
    for (const listing of callSheetListings) {
      text += `* ${listing.title} — ${listing.production_title}`;
      text += `\n  ${listing.compensation} | ${listing.location}`;
      if (listing.mentorship_included) text += ' | Mentorship Included';
      text += '\n';
    }
    text += `\nView all crew calls: ${siteUrl}/call-sheet\n\n`;
  }

  text += `Browse all opportunities: ${siteUrl}/#directory\n\n`;
  text += `Support the team: https://pay.yoco.com/celebration-house-entertainment\n\n`;
  text += `—\nFilm Resource Africa\n${siteUrl}\n`;

  return text;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function resendToNew() {
  console.log('=== FRA Newsletter — Resend to New Subscribers ===\n');

  // 1. Find the latest sent newsletter
  const latest = await supabaseGet('newsletters', 'status=eq.sent&order=sent_at.desc&limit=1');
  if (latest.length === 0) {
    console.log('No sent newsletter found. Nothing to resend.');
    return;
  }
  const newsletter = latest[0];
  console.log(`Latest newsletter: ${newsletter.subject}`);
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

  console.log('=== FRA Weekly Newsletter ===\n');

  // 1. Check if a newsletter was already sent this week
  const weekId = getISOWeek();
  const weekLabel = getWeekLabel();
  console.log(`Edition: ${weekLabel} (${weekId})`);

  const existing = await supabaseGet(
    'newsletters',
    `edition_date=gte.${new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0]}&status=eq.sent&limit=1`
  );
  if (existing.length > 0 && !DRY_RUN && !PREVIEW) {
    console.log('\nNewsletter already sent this week. Skipping.');
    console.log(`  Sent: ${existing[0].sent_at}`);
    console.log(`  Subject: ${existing[0].subject}`);
    return;
  }

  // 2. Fetch content from Supabase
  console.log('\nFetching content...');
  const [closingSoon, newlyOpen, justAdded, news, proTip, callSheetListings, communitySpotlights] = await Promise.all([
    fetchClosingSoon(),
    fetchNewlyOpen(),
    fetchJustAdded(),
    fetchRecentNews(),
    fetchProTip(),
    fetchCallSheetListings(),
    fetchCommunitySpotlights(),
  ]);

  console.log(`  Closing soon: ${closingSoon.length}`);
  console.log(`  Open now: ${newlyOpen.length}`);
  console.log(`  Just added: ${justAdded.length}`);
  console.log(`  News items: ${news.length}`);
  console.log(`  Pro tip: ${proTip ? 'yes' : 'none'}`);
  console.log(`  Call sheet: ${callSheetListings.length}`);
  console.log(`  Community spotlights: ${communitySpotlights.length}`);

  // 3. Generate newsletter HTML
  const data = { closingSoon, newlyOpen, justAdded, news, proTip, weekLabel, callSheetListings, communitySpotlights };
  const html = buildNewsletterHtml(data);
  const plainText = buildPlainText(data);
  const subject = `FRA Weekly: ${closingSoon.length} deadline${closingSoon.length !== 1 ? 's' : ''} closing soon — ${weekLabel}`;

  if (PREVIEW) {
    process.stdout.write(html);
    return;
  }

  console.log(`\nSubject: ${subject}`);
  console.log(`HTML size: ${(html.length / 1024).toFixed(1)} KB`);

  // 4. Fetch subscribers
  const subscribers = await fetchSubscribers();
  console.log(`Subscribers: ${subscribers.length}`);

  if (subscribers.length === 0) {
    console.log('No subscribers found. Exiting.');
    return;
  }

  // 5. Store newsletter in Supabase
  const [newsletter] = await supabasePost('newsletters', {
    subject,
    body_html: html,
    body_plain: plainText,
    edition_date: new Date().toISOString().split('T')[0],
    status: DRY_RUN ? 'draft' : 'sending',
    recipient_count: subscribers.length,
    metadata: {
      closing_soon_count: closingSoon.length,
      open_count: newlyOpen.length,
      just_added_count: justAdded.length,
      news_count: news.length,
      pro_tip_id: proTip?.id || null,
      week_id: weekId,
    },
  });

  console.log(`\nNewsletter stored: ${newsletter.id}`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — not sending emails ---');
    console.log(`Draft saved with id: ${newsletter.id}`);
    // Save preview file
    writeFileSync(`newsletter_preview_${weekId}.html`, html);
    console.log(`Preview written to: newsletter_preview_${weekId}.html`);
    return;
  }

  // 6. Send to all subscribers
  console.log('\nSending emails...\n');
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      const result = await sendEmail(sub.email, subject, html);

      // Log individual send
      await supabasePost('newsletter_sends', {
        newsletter_id: newsletter.id,
        subscriber_email: sub.email,
        status: 'sent',
        resend_message_id: result.id || null,
        sent_at: new Date().toISOString(),
      });

      sent++;
      console.log(`  ✅ ${sub.email}`);

      // Rate limit delay
      if (sent < subscribers.length) {
        await new Promise(r => setTimeout(r, SEND_DELAY_MS));
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ ${sub.email}: ${err.message}`);

      // Log failure
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

  // 7. Update newsletter status
  const finalStatus = failed === subscribers.length ? 'failed' : 'sent';
  await supabasePatch('newsletters', `id=eq.${newsletter.id}`, {
    status: finalStatus,
    sent_at: new Date().toISOString(),
    recipient_count: sent,
  });

  // 8. Summary
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
