import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const { data } = await serviceClient
    .from('assessments')
    .select('status, tier')
    .eq('token', token)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ status: data.status, tier: data.tier });
}
