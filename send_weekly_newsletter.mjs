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
    'status=eq.approved&application_status=eq.closing_soon&order=deadline_date.asc&limit=5'
  );
}

async function fetchNewlyOpen() {
  // Opportunities with application_status = 'open', most recent first
  return supabaseGet(
    'opportunities',
    'status=eq.approved&application_status=eq.open&order=id.desc&limit=5'
  );
}

async function fetchJustAdded() {
  // Opportunities added in the last 14 days
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const dateStr = twoWeeksAgo.toISOString();
  return supabaseGet(
    'opportunities',
    `status=eq.approved&created_at=gte.${dateStr}&order=created_at.desc&limit=5`
  );
}

async function fetchRecentNews() {
  // Fetch a larger pool, then prioritise Africa-focused stories
  const pool = await supabaseGet('news', 'order=published_at.desc&limit=30');
  const africaRe = /africa|nigeria|kenya|south.afric|ghana|ethiopi|senegal|morocco|egypt|congo|tanzania|rwanda|sudan|cameroon|uganda|mozambi|zimbabwe|namibia|botswana|burkina|mali[^c]|ivory.coast|côte.d.ivoire|algeri|tunis|zanzibar|nairobi|lagos|johannesburg|joburg|accra|addis|dakar|casablanca|luanda|nollywood|fespaco|showmax|multichoice|canal\+|dstv|nfvf|safta|amaa|durban|fame.week|cape.town|hubert.bals|idfa.bertha|realness|docubox|wunmi.mosaku|michaela.coel|haile.gerima/i;
  const africa = pool.filter(n => africaRe.test(`${n.title} ${n.summary || ''}`));
  const other = pool.filter(n => !africaRe.test(`${n.title} ${n.summary || ''}`));
  // Lead with up to 3 Africa stories, fill remaining slots with general news
  const MAX_NEWS = 5;
  const picked = africa.slice(0, MAX_NEWS);
  if (picked.length < MAX_NEWS) {
    picked.push(...other.slice(0, MAX_NEWS - picked.length));
  }
  return picked;
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

async function fetchPartners() {
  return supabaseGet('partners', 'status=eq.approved&order=sort_order.asc&limit=10');
}

async function fetchSubscribers() {
  return supabaseGet('newsletter_subscriptions', 'select=id,email,unsubscribe_token&unsubscribed=eq.false&order=created_at.asc');
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

/**
 * Wrap a URL through the click-tracking redirect endpoint.
 * Uses {{NEWSLETTER_ID}} and {{SEND_ID}} placeholders that are replaced
 * per-subscriber at send time for individual attribution.
 * Tracks ALL links (internal + external) unlike the old UTM-only approach.
 *
 * @param {string} url - Destination URL (internal or external)
 * @param {string} label - Human-readable link label for analytics (e.g. 'closing_soon', 'news', 'partner_cta')
 * @returns {string} Tracking URL that redirects through /api/track/click
 */
function trackUrl(url, label = '') {
  const encoded = encodeURIComponent(url);
  let trackingUrl = `${siteUrl}/api/track/click?url=${encoded}&nid={{NEWSLETTER_ID}}&sid={{SEND_ID}}&c=weekly_digest`;
  if (label) trackingUrl += `&label=${encodeURIComponent(label)}`;
  return trackingUrl;
}

function buildOpportunityRow(opp, tagColor, tagLabel) {
  const title = escapeHtml(opp.title);
  const deadline = opp.deadline_date ? formatDate(opp.deadline_date) : (opp['Next Deadline'] ? escapeHtml(truncate(opp['Next Deadline'], 60)) : '');
  const desc = escapeHtml(truncate(opp['What Is It?'], 100));
  const cost = escapeHtml(opp.Cost || '');
  const applyLink = opp['Apply:'] || '';
  const linkMatch = applyLink.match(/(https?:\/\/[^\s|]+|[\w.-]+\.[a-z]{2,}[^\s|]*)/i);
  const rawUrl = linkMatch ? (linkMatch[0].startsWith('http') ? linkMatch[0] : `https://${linkMatch[0]}`) : `${siteUrl}/#directory`;
  const url = trackUrl(rawUrl, tagLabel || 'opportunity');
  const tag = tagLabel ? `<span style="display:inline-block;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${tagColor};background:${tagColor}12;padding:2px 8px;border-radius:4px;margin-right:6px;">${tagLabel}</span>` : '';

  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
        ${tag}${deadline ? `<span style="color:#8c8c8c;font-size:12px;">${deadline}</span>` : ''}
        <br/><a href="${escapeHtml(url)}" style="color:#37352f;font-weight:600;font-size:15px;text-decoration:none;line-height:1.5;">${title}</a>
        ${desc ? `<br/><span style="color:#787774;font-size:13px;line-height:1.5;">${desc}</span>` : ''}
        ${cost && cost !== 'Free' ? `<br/><span style="color:#787774;font-size:12px;">${cost}</span>` : ''}
      </td>
    </tr>`;
}

function buildSectionHeading(title, subtitle) {
  return `
    <tr>
      <td style="padding:32px 16px 8px 16px;">
        <h2 style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#37352f;">
          ${escapeHtml(title)}
        </h2>
        ${subtitle ? `<p style="margin:2px 0 0;font-size:12px;color:#9b9a97;">${escapeHtml(subtitle)}</p>` : ''}
      </td>
    </tr>`;
}

function buildNewsletterHtml({ closingSoon, newlyOpen, justAdded, news, proTip, weekLabel, callSheetListings, communitySpotlights, partners, episodeNumber }) {
  // Deduplicate: if an opp appears in closingSoon, don't show it again in newlyOpen or justAdded
  const closingIds = new Set(closingSoon.map(o => o.id));
  const openIds = new Set(newlyOpen.map(o => o.id));
  const filteredOpen = newlyOpen.filter(o => !closingIds.has(o.id));
  const filteredAdded = justAdded.filter(o => !closingIds.has(o.id) && !openIds.has(o.id));

  let sections = '';

  // ── Section 1: Closing Soon ──
  if (closingSoon.length > 0) {
    sections += buildSectionHeading('Closing Soon', `${closingSoon.length} deadline${closingSoon.length !== 1 ? 's' : ''} approaching`);
    sections += '<tr><td style="padding:0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">';
    for (const opp of closingSoon) {
      sections += buildOpportunityRow(opp, '#eb5757', 'closing');
    }
    sections += '</table></td></tr>';
  }

  // ── Section 2: Open Now ──
  if (filteredOpen.length > 0) {
    sections += buildSectionHeading('Open for Applications');
    sections += '<tr><td style="padding:0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">';
    for (const opp of filteredOpen) {
      sections += buildOpportunityRow(opp, '#0f7b6c', 'open');
    }
    sections += '</table></td></tr>';
  }

  // ── Section 3: Just Added ──
  if (filteredAdded.length > 0) {
    sections += buildSectionHeading('Just Added');
    sections += '<tr><td style="padding:0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">';
    for (const opp of filteredAdded) {
      sections += buildOpportunityRow(opp, '#2f80ed', 'new');
    }
    sections += '</table></td></tr>';
  }

  // ── Mid-newsletter: Support the team ──
  sections += `
      <tr>
        <td style="padding:28px 16px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;text-align:center;">
                <p style="margin:0 0 4px;font-size:14px;color:#37352f;font-weight:600;">Support the team &#9749;</p>
                <p style="margin:0 0 12px;font-size:13px;color:#787774;line-height:1.5;">We keep this free for African filmmakers. Every contribution helps.</p>
                <a href="https://pay.yoco.com/celebration-house-entertainment" style="display:inline-block;background:#37352f;color:#ffffff;font-weight:600;font-size:13px;text-decoration:none;padding:8px 20px;border-radius:6px;">Buy the team a coffee</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

  // ── Section 4: News ──
  if (news.length > 0) {
    sections += buildSectionHeading('Industry News');
    sections += '<tr><td style="padding:0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">';
    for (const item of news) {
      const slug = item.slug || '';
      const newsUrl = trackUrl(slug ? `${siteUrl}/news/${slug}` : `${siteUrl}/news`, 'news');
      const catLabel = (item.category || '').replace(/_/g, ' ');
      sections += `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
            ${catLabel ? `<span style="display:inline-block;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9b9a97;background:#f7f6f3;padding:2px 8px;border-radius:4px;">${escapeHtml(catLabel)}</span><br/>` : ''}
            <a href="${escapeHtml(newsUrl)}" style="color:#37352f;font-weight:600;font-size:15px;text-decoration:none;line-height:1.5;">${escapeHtml(item.title)}</a>
            ${item.summary ? `<br/><span style="color:#787774;font-size:13px;line-height:1.5;">${escapeHtml(truncate(item.summary, 120))}</span>` : ''}
          </td>
        </tr>`;
    }
    sections += '</table></td></tr>';
  }

  // ── Section 5: Pro Tip ──
  if (proTip) {
    sections += `
      <tr>
        <td style="padding:28px 16px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf3dd;border-radius:8px;border-left:3px solid #f0c75e;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#b8860b;">Pro Tip</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#37352f;">${escapeHtml(proTip.tip_text)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  // ── Section 6: Call Sheet ──
  if (callSheetListings && callSheetListings.length > 0) {
    sections += buildSectionHeading('The Call Sheet', 'Paid roles on African productions');
    sections += '<tr><td style="padding:0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">';
    for (const listing of callSheetListings) {
      const mentorBadge = listing.mentorship_included
        ? ' <span style="display:inline-block;background:#e8deee;color:#6b3fa0;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;">MENTORSHIP</span>'
        : '';
      sections += `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
            <a href="${trackUrl(`${siteUrl}/call-sheet`, 'call_sheet')}" style="color:#37352f;font-weight:600;font-size:15px;text-decoration:none;">${escapeHtml(listing.title)}</a>${mentorBadge}
            <br/><span style="color:#787774;font-size:13px;">${escapeHtml(listing.production_title)} &middot; ${escapeHtml(listing.production_company)}</span>
            <br/><span style="color:#0f7b6c;font-size:13px;font-weight:600;">${escapeHtml(listing.compensation)}</span>
            <span style="color:#9b9a97;font-size:12px;"> &middot; ${escapeHtml(listing.location)}</span>
          </td>
        </tr>`;
    }
    sections += '</table></td></tr>';
    sections += `<tr><td style="padding:8px 16px 0;" align="center"><a href="${trackUrl(`${siteUrl}/call-sheet`, 'call_sheet_cta')}" style="color:#2f80ed;font-size:13px;font-weight:600;text-decoration:none;">View all crew calls &rarr;</a></td></tr>`;
  }

  // ── Section 7: Community Spotlight ──
  if (communitySpotlights && communitySpotlights.length > 0) {
    sections += buildSectionHeading('Community Spotlight', 'Stories from the FRA community');
    sections += '<tr><td style="padding:0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">';
    for (const item of communitySpotlights) {
      const slug = item.slug || '';
      const spotlightUrl = trackUrl(slug ? `${siteUrl}/news/${slug}` : `${siteUrl}/news`, 'spotlight');
      sections += `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
            <a href="${escapeHtml(spotlightUrl)}" style="color:#37352f;font-weight:600;font-size:15px;text-decoration:none;">${escapeHtml(item.title)}</a>
            ${item.submitted_by_name ? `<br/><span style="color:#9b9a97;font-size:12px;">by ${escapeHtml(item.submitted_by_name)}</span>` : ''}
            ${item.summary ? `<br/><span style="color:#787774;font-size:13px;">${escapeHtml(truncate(item.summary, 140))}</span>` : ''}
          </td>
        </tr>`;
    }
    sections += '</table></td></tr>';
    sections += `<tr><td style="padding:8px 16px 0;" align="center"><a href="${trackUrl(`${siteUrl}/community-spotlight`, 'spotlight_cta')}" style="color:#2f80ed;font-size:13px;font-weight:600;text-decoration:none;">Share your story &rarr;</a></td></tr>`;
  }

  // ── Empty state ──
  if (!closingSoon.length && !filteredOpen.length && !filteredAdded.length && !news.length) {
    sections += `
      <tr>
        <td style="padding:24px 16px;font-size:15px;color:#787774;line-height:1.6;">
          No major updates this week — but keep an eye on the directory. New opportunities land all the time.
        </td>
      </tr>`;
  }

  const totalOpps = closingSoon.length + filteredOpen.length + filteredAdded.length;

  // ── Build dynamic headline ──
  // Lead with the top news story if available, otherwise use a curated feel
  let headline = 'New doors opening for African filmmakers';
  let subline = `${totalOpps} curated opportunities inside — plus the news that matters this week.`;
  if (news.length > 0) {
    // Use first news headline as the hook
    const leadTitle = news[0].title || '';
    if (leadTitle.length > 10) {
      headline = leadTitle.length > 70 ? leadTitle.slice(0, 67).replace(/\s+\S*$/, '') + '...' : leadTitle;
      const extras = [];
      if (totalOpps > 0) extras.push(`${totalOpps} opportunities`);
      if (closingSoon.length > 0) extras.push(`${closingSoon.length} deadline${closingSoon.length !== 1 ? 's' : ''} closing soon`);
      subline = extras.length > 0 ? `Plus ${extras.join(' and ')} inside.` : 'Read on for what matters this week.';
    }
  }

  // ── Partners / Sponsors section ──
  let partnersSection = '';
  if (partners && partners.length > 0) {
    const sponsors = partners.filter(p => p.tier === 'sponsor' || p.bundle === 'headline');
    const regularPartners = partners.filter(p => p.tier !== 'sponsor' && p.bundle !== 'headline');

    // Headline sponsor banners
    for (const s of sponsors) {
      const sUrl = s.cta_url || s.website || siteUrl;
      const sName = escapeHtml(s.name);
      const sAbout = escapeHtml(s.about || '').replace(/\n/g, '<br/>');
      const sCta = escapeHtml(s.cta_text || 'Learn More');
      const sFeatured = s.featured_image_url;
      const sLogo = s.logo_url;

      partnersSection += `
          <tr><td style="padding:24px 24px 0;"><div style="border-top:1px solid #e8e8e8;"></div></td></tr>
          <tr>
            <td style="padding:16px 24px 4px;">
              <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9b9a97;">Sponsored by</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #e8e8e8;">
                ${sFeatured ? `<tr>
                  <td>
                    <a href="${escapeHtml(sUrl)}" style="text-decoration:none;">
                      <img src="${escapeHtml(sFeatured)}" alt="${sName}" width="592" style="width:100%;height:auto;display:block;border-radius:12px 12px 0 0;" />
                    </a>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        ${sLogo ? `<td style="width:52px;vertical-align:top;padding-right:16px;">
                          <a href="${escapeHtml(sUrl)}" style="text-decoration:none;">
                            <img src="${escapeHtml(sLogo)}" alt="${sName}" width="48" height="48" style="width:48px;height:48px;border-radius:10px;object-fit:contain;display:block;" />
                          </a>
                        </td>` : ''}
                        <td style="vertical-align:top;">
                          <a href="${escapeHtml(sUrl)}" style="color:#37352f;font-weight:700;font-size:17px;text-decoration:none;line-height:1.3;">${sName}</a>
                          <p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:#787774;">${sAbout}</p>
                        </td>
                      </tr>
                    </table>
                    <div style="padding-top:16px;text-align:center;">
                      <a href="${escapeHtml(sUrl)}" style="display:inline-block;background:#37352f;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:10px 28px;border-radius:8px;">${sCta} &rarr;</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
    }

    // Regular partners (small cards)
    if (regularPartners.length > 0) {
      let partnerCards = '';
      for (const p of regularPartners) {
        const pUrl = p.website || siteUrl;
        const pLogo = p.logo_url;
        const pName = escapeHtml(p.name);
        partnerCards += `
                <tr>
                  <td style="padding:12px 20px;${regularPartners.indexOf(p) < regularPartners.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : ''}">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        ${pLogo ? `<td style="width:48px;vertical-align:middle;"><a href="${escapeHtml(pUrl)}" style="text-decoration:none;"><img src="${escapeHtml(pLogo)}" alt="${pName}" width="44" height="44" style="width:44px;height:44px;border-radius:8px;object-fit:contain;display:block;" /></a></td>` : ''}
                        <td style="${pLogo ? 'padding-left:14px;' : ''}vertical-align:middle;">
                          <a href="${escapeHtml(pUrl)}" style="color:#37352f;font-weight:600;font-size:14px;text-decoration:none;">${pName}</a>
                          <br/><span style="color:#9b9a97;font-size:12px;">${escapeHtml(pUrl.replace('https://', '').replace(/\/$/, ''))}</span>
                        </td>
                        <td style="width:60px;vertical-align:middle;text-align:right;">
                          <a href="${escapeHtml(pUrl)}" style="display:inline-block;font-size:12px;font-weight:600;color:#2f80ed;text-decoration:none;border:1px solid #e8e8e8;padding:4px 10px;border-radius:6px;">Visit</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
      }
      partnersSection += `
          <tr><td style="padding:20px 24px 0;"><div style="border-top:1px solid #e8e8e8;"></div></td></tr>
          <tr>
            <td style="padding:20px 24px 8px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#37352f;">Our Partners</p>
              <p style="margin:0;font-size:12px;color:#9b9a97;">Organisations supporting African filmmakers</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">
                ${partnerCards}
              </table>
            </td>
          </tr>`;
    }
  }

  // ── Full email ──
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FRA Weekly — ${weekLabel}</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans',Helvetica,Arial,sans-serif;color:#37352f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f3;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:12px;border:1px solid #e8e8e8;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 24px 0;">
              <img src="${siteUrl}/logo_FRA.png" alt="Film Resource Africa" width="80" style="width:80px;display:block;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 24px 0;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#37352f;">Film Resource Africa</p>
              <p style="margin:4px 0 0;font-size:12px;color:#9b9a97;">Weekly Digest #${episodeNumber} &middot; ${escapeHtml(weekLabel)}</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:24px 24px 4px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#37352f;line-height:1.3;">${escapeHtml(headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px;">
              <p style="margin:0;font-size:14px;color:#787774;line-height:1.5;">${escapeHtml(subline)}</p>
            </td>
          </tr>

          <!-- Sponsor banner (headline sponsors) -->
          ${partnersSection}

          <!-- Divider -->
          <tr><td style="padding:0 24px;"><div style="border-top:1px solid #e8e8e8;"></div></td></tr>

          <!-- Dynamic sections -->
          ${sections}

          <!-- CTA -->
          <tr>
            <td style="padding:28px 16px 12px;" align="center">
              <a href="${trackUrl(`${siteUrl}/#directory`, 'browse_cta')}" style="display:inline-block;background-color:#37352f;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">
                Browse all opportunities &rarr;
              </a>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:20px 24px;font-size:14px;line-height:1.6;color:#787774;">
              Spotted an opportunity we're missing? Just reply to this email.<br/><br/>
              Until next week,<br/>
              <strong style="color:#37352f;">Film Resource Africa</strong>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 24px 28px;font-size:11px;color:#9b9a97;line-height:1.6;border-top:1px solid #e8e8e8;">
              Made with passion in Africa &#127757;<br/>
              You're receiving this because you subscribed at ${siteUrl.replace('https://', '')}<br/>
              <a href="${trackUrl(siteUrl, 'footer')}" style="color:#2f80ed;text-decoration:none;">${siteUrl.replace('https://', '')}</a><br/><br/>
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

  // 1. Find the latest sent weekly newsletter (exclude midweek Hot News editions)
  const latest = await supabaseGet('newsletters', 'status=eq.sent&subject=ilike.FRA%20Weekly*&order=sent_at.desc&limit=1');
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

  // 2. Calculate episode number from previously sent WEEKLY newsletters only (exclude midweek Hot News)
  const sentWeeklies = await supabaseGet('newsletters', 'status=eq.sent&subject=ilike.FRA%20Weekly*&select=id');
  const episodeNumber = sentWeeklies.length + 1;
  console.log(`\nEpisode: #${episodeNumber}`);

  // 3. Fetch content from Supabase
  console.log('Fetching content...');
  const [closingSoon, newlyOpen, justAdded, news, proTip, callSheetListings, communitySpotlights, partners] = await Promise.all([
    fetchClosingSoon(),
    fetchNewlyOpen(),
    fetchJustAdded(),
    fetchRecentNews(),
    fetchProTip(),
    fetchCallSheetListings(),
    fetchCommunitySpotlights(),
    fetchPartners(),
  ]);

  console.log(`  Closing soon: ${closingSoon.length}`);
  console.log(`  Open now: ${newlyOpen.length}`);
  console.log(`  Just added: ${justAdded.length}`);
  console.log(`  News items: ${news.length}`);
  console.log(`  Pro tip: ${proTip ? 'yes' : 'none'}`);
  console.log(`  Call sheet: ${callSheetListings.length}`);
  console.log(`  Community spotlights: ${communitySpotlights.length}`);
  console.log(`  Partners: ${partners.length}`);

  // 3. Generate newsletter HTML
  const data = { closingSoon, newlyOpen, justAdded, news, proTip, weekLabel, callSheetListings, communitySpotlights, partners, episodeNumber };
  const html = buildNewsletterHtml(data);
  const plainText = buildPlainText(data);
  // Dynamic subject line — lead with the hook, not just stats
  let subject;
  if (news.length > 0 && news[0].title) {
    const shortTitle = news[0].title.length > 50 ? news[0].title.slice(0, 47).replace(/\s+\S*$/, '') + '...' : news[0].title;
    subject = `FRA Weekly: ${shortTitle}`;
  } else if (closingSoon.length > 0) {
    subject = `FRA Weekly: ${closingSoon.length} deadline${closingSoon.length !== 1 ? 's' : ''} closing — don't miss out`;
  } else {
    subject = `FRA Weekly: What's new for African filmmakers — ${weekLabel}`;
  }

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

  // 6. Send to all subscribers (with per-subscriber click tracking)
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
