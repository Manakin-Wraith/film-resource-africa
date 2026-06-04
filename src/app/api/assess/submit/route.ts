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
  let body: { email?: string; answers?: IntakeAnswers; honeypot?: string; reassessToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const honeypotTripped = typeof body.honeypot === 'string' && body.honeypot.trim() !== '';

  const answers = body.answers ?? {};
  const missing = validateIntake(answers);
  if (missing.length > 0) {
    return NextResponse.json({ error: 'Missing required answers', missing }, { status: 422 });
  }
  if (str(answers, 25) !== 'Yes') {
    return NextResponse.json({ error: 'Consent (Q25) is required to submit.' }, { status: 422 });
  }

  // Honeypot is advisory, not blocking: a submission that passes full validation
  // (all 25 required answers + consent) is almost certainly a real human whose
  // browser/extension autofilled the hidden field — not a bot, which would skip
  // the required questions and have been bounced by the 422 above. Log it for
  // visibility instead of rejecting and locking the user out.
  if (honeypotTripped) {
    console.warn('[PRS submit] honeypot tripped on a fully-valid submission (likely autofill, allowing)', {
      email: (body.email ?? '').toLowerCase().trim(),
      honeypotLength: body.honeypot!.trim().length,
    });
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

  // Re-assessment: if the caller owns the source project, the new diagnosis joins
  // that project_group as a fresh version and inherits its visibility. Otherwise a
  // brand-new project (DB default generates a fresh project_group; visibility=private).
  //
  // The new version takes over the source row's token so the member's /p/<token>
  // card URL stays stable across every re-score. Since `token` is unique, we first
  // hand the stable token off by re-tokening the prior version (which is retained
  // as history), then insert the new version with the freed stable token. A failed
  // insert is compensated by handing the stable token back to the prior version.
  let projectGroup: string | undefined;
  let inheritedVisibility: string | undefined;
  let stableToken: string | undefined;
  let sourceId: string | undefined;
  if (memberId && body.reassessToken) {
    const { data: source } = await serviceClient
      .from('assessments')
      .select('id, project_group, visibility, member_id')
      .eq('token', body.reassessToken)
      .maybeSingle();
    if (source && source.member_id === memberId) {
      projectGroup = source.project_group as string;
      inheritedVisibility = source.visibility as string;
      sourceId = source.id as string;
      stableToken = body.reassessToken;

      // Free up the stable token by archiving the prior version onto a new token.
      const { error: retokenError } = await serviceClient
        .from('assessments')
        .update({ token: genToken() })
        .eq('id', sourceId);
      if (retokenError) {
        console.error('[PRS submit] re-token of prior version failed', retokenError);
        return NextResponse.json({ error: 'Could not save submission' }, { status: 500 });
      }
    }
  }

  // Re-assessment reuses the now-freed stable token; a fresh project mints one.
  const token = stableToken ?? genToken();
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
    ...(projectGroup ? { project_group: projectGroup } : {}),
    ...(inheritedVisibility ? { visibility: inheritedVisibility } : {}),
  });

  if (error) {
    // Compensate: hand the stable token back to the prior version so the card URL
    // is never left orphaned by a failed re-assessment insert.
    if (stableToken && sourceId) {
      await serviceClient.from('assessments').update({ token: stableToken }).eq('id', sourceId);
    }
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
