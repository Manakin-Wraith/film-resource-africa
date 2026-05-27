import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Tracked "Request intro" / "Discuss with FRA" actions from the member report.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  let body: { token?: string; kind?: string; subject?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!body.token || !body.kind || !body.subject) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data: member } = await serviceClient
    .from('members').select('id, full_name').eq('email', user.email.toLowerCase()).eq('status', 'active').maybeSingle();
  if (!member) return NextResponse.json({ error: 'Members only' }, { status: 403 });

  const { data: assessment } = await serviceClient
    .from('assessments').select('id, project_title').eq('token', body.token).maybeSingle();
  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });

  await serviceClient.from('prs_intro_requests').insert({
    assessment_id: assessment.id,
    member_id: member.id,
    kind: body.kind,
    subject: body.subject,
    note: body.note ?? null,
  });

  // Notify Gerhard.
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'FRA System <hello@film-resource-africa.com>',
      to: 'g.mostertpot@gmail.com',
      subject: `PRS intro request — ${body.subject}`,
      html: `
        <p><strong>${member.full_name || user.email}</strong> requested: <strong>${body.kind}</strong></p>
        <p><strong>Subject:</strong> ${body.subject}</p>
        <p><strong>Project:</strong> ${assessment.project_title}</p>
        ${body.note ? `<p><strong>Note:</strong> ${body.note}</p>` : ''}
        <p><strong>Member email:</strong> ${user.email}</p>
      `,
    });
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ ok: true });
}
