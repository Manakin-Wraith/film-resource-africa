import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';
import { validateIntake, type IntakeAnswers } from '@/lib/prs/questions';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function genToken(): string {
  const rand = Math.random().toString(36).slice(2, 6);
  const rand2 = Math.random().toString(36).slice(2, 6);
  return `srs-${rand}${rand2}`;
}

function str(answers: IntakeAnswers, id: number): string {
  const v = answers[id];
  return Array.isArray(v) ? v.join(', ') : (v ?? '').toString();
}

export async function POST(req: NextRequest) {
  let body: { email?: string; answers?: IntakeAnswers; honeypot?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields. Trim to avoid extensions/autofill
  // accidentally injecting whitespace and tripping the trap for real users.
  if (typeof body.honeypot === 'string' && body.honeypot.trim() !== '') {
    return NextResponse.json({ error: 'Rejected' }, { status: 400 });
  }

  const answers = body.answers ?? {};
  const missing = validateIntake(answers);
  if (missing.length > 0) {
    return NextResponse.json({ error: 'Missing required answers', missing }, { status: 422 });
  }
  if (str(answers, 25) !== 'Yes') {
    return NextResponse.json({ error: 'Consent (Q25) is required to submit.' }, { status: 422 });
  }

  // Determine identity: a logged-in active member submits as a member (exempt
  // from one-free-per-email and can resubmit). Otherwise use the typed email.
  const user = await getSessionUser();
  let memberId: string | null = null;
  let email = (body.email ?? '').toLowerCase().trim();

  if (user?.email) {
    const { data: member } = await serviceClient
      .from('members')
      .select('id, email')
      .eq('email', user.email.toLowerCase())
      .eq('status', 'active')
      .maybeSingle();
    if (member) {
      memberId = member.id;
      email = member.email.toLowerCase();
    }
  }

  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 422 });
  }

  // Non-members get one free report, lifetime.
  if (!memberId) {
    const { data: existingFree } = await serviceClient
      .from('assessments')
      .select('token')
      .eq('email', email)
      .is('member_id', null)
      .maybeSingle();
    if (existingFree) {
      return NextResponse.json(
        { error: 'free_used', token: existingFree.token },
        { status: 409 },
      );
    }
  }

  const token = genToken();
  const { error } = await serviceClient.from('assessments').insert({
    token,
    email,
    member_id: memberId,
    project_title: str(answers, 4) || 'Untitled project',
    format: str(answers, 5) || null,
    genre: str(answers, 6) || null,
    country: str(answers, 13) || null,
    intake_data: answers,
    status: 'pending',
  });

  if (error) {
    // Unique-violation race on the one-free index.
    if (error.code === '23505') {
      const { data } = await serviceClient
        .from('assessments').select('token').eq('email', email).is('member_id', null).maybeSingle();
      return NextResponse.json({ error: 'free_used', token: data?.token }, { status: 409 });
    }
    console.error('[PRS submit] insert failed', error);
    return NextResponse.json({ error: 'Could not save submission' }, { status: 500 });
  }

  return NextResponse.json({ token });
}
