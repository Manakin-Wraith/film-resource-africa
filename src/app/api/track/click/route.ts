import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Newsletter Click Tracker
 *
 * URL format:
 *   /api/track/click?url=ENCODED_URL&nid=NEWSLETTER_ID&sid=SEND_ID&label=LINK_LABEL&c=CAMPAIGN
 *
 * Logs the click to `newsletter_clicks`, updates `newsletter_sends.clicked_at`,
 * and 302-redirects the user to the destination URL.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const url = searchParams.get('url');
  const newsletterId = searchParams.get('nid');
  const sendId = searchParams.get('sid');
  const label = searchParams.get('label');
  const campaign = searchParams.get('c') || 'newsletter';

  // Always redirect — even if tracking fails
  const destination = url || 'https://film-resource-africa.com';

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const userAgent = req.headers.get('user-agent') || null;
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

      // 1. Log the click
      await supabase.from('newsletter_clicks').insert([{
        newsletter_id: newsletterId || null,
        send_id: sendId || null,
        link_url: url || destination,
        link_label: label || null,
        campaign,
        user_agent: userAgent,
        ip_address: ip,
      }]);

      // 2. Update the newsletter_sends record to mark as clicked (first click only)
      if (sendId) {
        await supabase
          .from('newsletter_sends')
          .update({ status: 'clicked', clicked_at: new Date().toISOString() })
          .eq('id', sendId)
          .in('status', ['sent', 'opened']); // Only upgrade, don't downgrade
      }

      // 3. Increment click_count on the newsletter
      if (newsletterId) {
        const { data: nl } = await supabase
          .from('newsletters')
          .select('click_count')
          .eq('id', newsletterId)
          .single();

        if (nl) {
          await supabase
            .from('newsletters')
            .update({ click_count: (nl.click_count || 0) + 1 })
            .eq('id', newsletterId);
        }
      }
    }
  } catch (err) {
    // Tracking should never block the redirect
    console.error('[Click Tracker] Error:', err);
  }

  // 302 redirect to the actual destination
  return NextResponse.redirect(destination, { status: 302 });
}
