import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Is this email on the AFX invite list (pending or already redeemed)?
 *  Unauthenticated + service-role, mirroring /api/members/check-email.
 *  Reveals invite status by design (enumeration accepted for the invite-only beta). */
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') ?? '').toLowerCase().trim();
  if (!email) return NextResponse.json({ invited: false });
  const { data } = await supabase
    .from('afx_invites')
    .select('id')
    .eq('email', email)
    .limit(1);
  return NextResponse.json({ invited: (data ?? []).length > 0 });
}
