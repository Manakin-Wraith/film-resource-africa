import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json(null);

  const { data } = await serviceClient
    .from('members')
    .select('id, full_name, username, avatar_url, tier, status')
    .eq('email', user.email.toLowerCase())
    .eq('status', 'active')
    .maybeSingle();

  return NextResponse.json(data);
}
