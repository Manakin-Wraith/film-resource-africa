import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://film-resource-africa.com';

function htmlPage(title: string, message: string, success: boolean) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Film Resource Africa</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    .card{max-width:480px;width:90%;text-align:center;padding:48px 32px;border-radius:24px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:24px;font-weight:700;margin-bottom:12px;color:${success ? '#4ade80' : '#f87171'}}
    p{font-size:15px;color:#a1a1aa;line-height:1.6;margin-bottom:24px}
    a.btn{display:inline-block;padding:12px 28px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;transition:background 0.2s}
    a.btn:hover{background:#2563eb}
    .sub{font-size:12px;color:#71717a;margin-top:20px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✅' : '⚠️'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="btn" href="${siteUrl}">Back to Film Resource Africa</a>
    ${success ? '<p class="sub">Changed your mind? You can re-subscribe anytime on our website.</p>' : ''}
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return new NextResponse(
      htmlPage('Invalid Link', 'This unsubscribe link is missing a token. Please use the link from your email.', false),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Look up subscriber by token
  const { data: subscriber, error: lookupError } = await supabase
    .from('newsletter_subscriptions')
    .select('id, email, unsubscribed')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (lookupError || !subscriber) {
    return new NextResponse(
      htmlPage('Not Found', 'We couldn\'t find a subscription matching this link. It may have already been removed.', false),
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Already unsubscribed
  if (subscriber.unsubscribed) {
    return new NextResponse(
      htmlPage('Already Unsubscribed', 'You\'ve already been unsubscribed. You won\'t receive any more emails from us.', true),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Perform unsubscribe
  const { error: updateError } = await supabase
    .from('newsletter_subscriptions')
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id);

  if (updateError) {
    console.error('Unsubscribe update failed:', updateError);
    return new NextResponse(
      htmlPage('Something Went Wrong', 'We couldn\'t process your unsubscribe request. Please try again or contact hello@film-resource-africa.com.', false),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }

  console.log(`[Unsubscribe] ${subscriber.email} unsubscribed via token ${token.slice(0, 8)}...`);

  return new NextResponse(
    htmlPage('Unsubscribed', 'You\'ve been successfully unsubscribed from Film Resource Africa emails. We\'re sorry to see you go!', true),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
