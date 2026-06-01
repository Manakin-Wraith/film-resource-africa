import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Owner-gated prefill for re-assessment. Returns a prior assessment's intake
 * answers + title, but ONLY to the active member who owns it.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: member } = await serviceClient
    .from('members')
    .select('id')
    .eq('email', user.email.toLowerCase())
    .eq('status', 'active')
    .maybeSingle();
  if (!member) return NextResponse.json({ error: 'not a member' }, { status: 403 });

  const { data: row } = await serviceClient
    .from('assessments')
    .select('member_id, project_title, intake_data')
    .eq('token', token)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (row.member_id !== member.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  return NextResponse.json({
    project_title: row.project_title,
    answers: row.intake_data ?? {},
  });
}
