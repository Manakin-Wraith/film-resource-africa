/**
 * Preview the partnership outreach email in a local browser.
 * 
 * Usage:
 *   node preview_partnership_email.mjs                    # write HTML to file + serve
 *   node preview_partnership_email.mjs --stdout            # print HTML to stdout
 */
import { readFileSync, writeFileSync } from 'fs';
import http from 'http';

const siteUrl = 'https://www.film-resource-africa.com';
const cleanUrl = siteUrl.replace(/\/$/, '');
const displayUrl = cleanUrl.replace('https://', '');

// ── Email params (edit these for each send) ──
const recipientName = 'Omorinsojo';
const recipientOrg = 'NIF Summit';
const senderName = 'Gerhard Mostert';
const senderPosition = 'Founder';
const senderLinkedin = 'https://www.linkedin.com/in/gerhard-mostert-96334948/';

// ── Build HTML (inline copy of template to avoid TS compilation) ──
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Partnership Enquiry — Film Resource Africa</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e0e0e0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${cleanUrl}" style="text-decoration:none;">
                <img src="${cleanUrl}/icon.png" alt="Film Resource Africa" width="48" height="48" style="border-radius:12px;" />
              </a>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-bottom:24px;font-size:16px;line-height:1.7;color:#b0b0b0;">
              Hi ${recipientName},
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:24px;font-size:16px;line-height:1.7;color:#b0b0b0;">
              I hope you're doing well.
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding-bottom:24px;font-size:16px;line-height:1.7;color:#b0b0b0;">
              My name is ${senderName}, and I\u2019m reaching out from
              <a href="${cleanUrl}" style="color:#3b82f6;text-decoration:none;font-weight:600;">Film Resource Africa</a>.
              We're building a platform focused on connecting filmmakers to opportunities across the continent &mdash; including grants, funding, festivals, and industry news &mdash; while also fostering a strong, collaborative community.
            </td>
          </tr>

          <!-- Traction -->
          <tr>
            <td style="padding-bottom:24px;font-size:16px;line-height:1.7;color:#b0b0b0;">
              In a short time, we've begun growing an engaged base of African filmmakers and creatives who are actively looking for access, visibility, and meaningful industry connections.
            </td>
          </tr>

          <!-- Highlights bar -->
          <tr>
            <td style="padding-bottom:28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #1e1e1e;">
                <tr>
                  <td width="33%" align="center" style="padding:20px 8px;">
                    <div style="font-size:24px;font-weight:700;color:#3b82f6;line-height:1;">125+</div>
                    <div style="font-size:12px;color:#888;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">Opportunities</div>
                  </td>
                  <td width="33%" align="center" style="padding:20px 8px;border-left:1px solid #1e1e1e;border-right:1px solid #1e1e1e;">
                    <div style="font-size:24px;font-weight:700;color:#22c55e;line-height:1;">120+</div>
                    <div style="font-size:12px;color:#888;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">News Articles</div>
                  </td>
                  <td width="33%" align="center" style="padding:20px 8px;">
                    <div style="font-size:24px;font-weight:700;color:#f59e0b;line-height:1;">Growing</div>
                    <div style="font-size:12px;color:#888;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">Community</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ask -->
          <tr>
            <td style="padding-bottom:24px;font-size:16px;line-height:1.7;color:#b0b0b0;">
              I'd love to explore potential partnership opportunities with
              <strong style="color:#ffffff;">${recipientOrg}</strong>
              and see how we might collaborate in a way that adds value to both your audience and ours &mdash; whether through visibility, content, community engagement, or aligned initiatives.
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:28px;font-size:16px;line-height:1.7;color:#b0b0b0;">
              Please let me know a convenient time to connect, or feel free to share any next steps from your side.
            </td>
          </tr>

          <!-- Browse button -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${cleanUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:10px;">
                Visit Film Resource Africa &rarr;
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:24px;">
              <div style="border-top:1px solid #1a1a1a;"></div>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding-bottom:32px;font-size:15px;line-height:1.7;color:#b0b0b0;">
              Looking forward to hearing from you.<br/><br/>
              Warm regards,<br/>
              <strong style="color:#ffffff;">${senderName}</strong><br/>
              <span style="color:#888;font-size:14px;">${senderPosition}</span><br/>
              <strong style="color:#ffffff;">Film Resource Africa</strong><br/>
              <a href="${cleanUrl}" style="color:#3b82f6;text-decoration:none;font-size:14px;">${displayUrl}</a><br/>
              <a href="${senderLinkedin}" style="color:#3b82f6;text-decoration:none;font-size:13px;">LinkedIn Profile</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;border-top:1px solid #1a1a1a;font-size:11px;color:#555;line-height:1.6;">
              Made with passion in Africa &#127757;
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

if (process.argv.includes('--stdout')) {
  console.log(html);
  process.exit(0);
}

// Write to file
writeFileSync('/tmp/fra-partnership-email-preview.html', html);
console.log('✅ Written to /tmp/fra-partnership-email-preview.html');

// Serve on port 3099
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});
server.listen(3099, () => {
  console.log('🌐 Preview at http://localhost:3099');
  console.log('   Press Ctrl+C to stop');
});
