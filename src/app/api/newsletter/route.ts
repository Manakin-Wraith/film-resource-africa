import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { buildWelcomeEmailHtml } from '@/lib/welcomeEmail';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Newsletter API] Missing Supabase env vars');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Insert new subscription
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert([{ email }]);

    if (error) {
      console.error('[Newsletter API] Insert error:', error.message, error.code);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send emails via Resend (non-blocking)
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const { Resend } = await import('resend');
        const resend = new Resend(apiKey);

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://film-resource-africa.com';

        // Send welcome email to subscriber + admin notification in parallel
        const [welcomeResult] = await Promise.allSettled([
          resend.emails.send({
            from: 'Film Resource Africa <hello@film-resource-africa.com>',
            to: [email],
            subject: 'Welcome to Film Resource Africa — your first deadline alert is inside',
            html: buildWelcomeEmailHtml(siteUrl),
          }),
          resend.emails.send({
            from: 'Film Resource Africa <hello@film-resource-africa.com>',
            to: ['hello@film-resource-africa.com'],
            subject: `New Newsletter Subscriber: ${email}`,
            html: `<p>New subscriber: <strong>${email}</strong></p>`,
          }),
        ]);

        // Track welcome email status in Supabase
        if (welcomeResult.status === 'fulfilled') {
          await supabase
            .from('newsletter_subscriptions')
            .update({ welcome_email_sent: true, welcome_email_sent_at: new Date().toISOString() })
            .eq('email', email);
        } else {
          console.error('[Newsletter API] Welcome email failed:', welcomeResult.reason);
        }
      }
    } catch (emailError) {
      console.error('[Newsletter API] Non-critical email error:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Newsletter API] Unhandled error:', err.message);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
