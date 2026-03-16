export function buildWelcomeEmailHtml(siteUrl: string): string {
  return `
<!DOCTYPE html>
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

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${siteUrl}/icon.png" alt="Film Resource Africa" width="48" height="48" style="border-radius:12px;" />
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding-bottom:16px;">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">
                Welcome to Film Resource Africa.
              </h1>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding-bottom:32px;font-size:16px;line-height:1.6;color:#b0b0b0;">
              You just joined a growing community of African filmmakers, screenwriters, and producers who refuse to miss another deadline.
            </td>
          </tr>

          <!-- What to expect -->
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

          <!-- CTA Section -->
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

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:24px;">
              <div style="border-top:1px solid #1a1a1a;"></div>
            </td>
          </tr>

          <!-- Mission -->
          <tr>
            <td style="padding-bottom:32px;font-size:14px;line-height:1.7;color:#888;font-style:italic;">
              We built this because African creators deserve the same access to funding information that filmmakers in LA, London, and Paris take for granted. Every opportunity in our directory is verified and deadline-tracked.
            </td>
          </tr>

          <!-- Support -->
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

          <!-- Sign-off -->
          <tr>
            <td style="padding-bottom:32px;font-size:15px;line-height:1.6;color:#b0b0b0;">
              Spotted an opportunity we're missing? Just reply to this email.<br/><br/>
              Talk soon,<br/>
              <strong style="color:#ffffff;">Film Resource Africa</strong><br/>
              <a href="${siteUrl}" style="color:#3b82f6;text-decoration:none;font-size:14px;">${siteUrl.replace('https://', '')}</a>
            </td>
          </tr>

          <!-- Footer -->
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
</html>`.trim();
}
