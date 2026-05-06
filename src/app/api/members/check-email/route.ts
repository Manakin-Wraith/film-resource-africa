import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') ?? '').toLowerCase().trim();
  if (!email) return NextResponse.json({ active: false });

  const { data } = await supabase
    .from('members')
    .select('id')
    .eq('email', email)
    .eq('status', 'active')
    .maybeSingle();

  return NextResponse.json({ active: !!data });
}
