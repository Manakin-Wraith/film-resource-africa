import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/members';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      /* AFX logins should always land at their intended destination; skip the
         members-table override so an AFX invite that also happens to be an FRA
         member isn't hijacked into member onboarding. */
      const isAfxLogin = next.startsWith('/afx');

      if (!isAfxLogin) {
        /* Redirect to their profile if they have one */
        const { data: member } = await serviceClient
          .from('members')
          .select('username, onboarding_completed_at, onboarding_token')
          .eq('email', data.user.email.toLowerCase())
          .eq('status', 'active')
          .maybeSingle();

        if (member) {
          if (!member.onboarding_completed_at && member.onboarding_token) {
            /* Onboarding not done yet — send them there */
            return NextResponse.redirect(
              `${origin}/members/onboarding?token=${member.onboarding_token}`
            );
          }
          if (member.username) {
            /* Use the `next` param if it's a safe relative URL, otherwise fall back to profile */
            const safeNext = next && next.startsWith('/') ? next : `/members/${member.username}`;
            return NextResponse.redirect(`${origin}${safeNext}`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  /* Send AFX login failures back to the AFX login page, not the Member login page. */
  const errorDest = next.startsWith('/afx') ? '/afx/login' : '/login';
  return NextResponse.redirect(`${origin}${errorDest}?error=auth_failed`);
}
