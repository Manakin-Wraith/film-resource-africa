import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username') ?? '';
  const memberId = req.nextUrl.searchParams.get('memberId') ?? '';

  if (username.length < 3) {
    return NextResponse.json({ available: false, reason: 'too_short' });
  }
  if (!/^[a-z0-9-]+$/.test(username)) {
    return NextResponse.json({ available: false, reason: 'invalid_chars' });
  }

  const { data } = await supabase
    .from('members')
    .select('id')
    .eq('username', username)
    .neq('id', memberId)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
