import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scoreIntake } from '@/lib/prs/scoring';
import type { IntakeAnswers } from '@/lib/prs/questions';

// Scoring calls the model and can take >60s; allow up to 5 min on Vercel.
export const maxDuration = 300;

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  let token: string | undefined;
  try {
    ({ token } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const { data: row, error } = await serviceClient
    .from('assessments')
    .select('id, status, intake_data')
    .eq('token', token)
    .maybeSingle();

  if (error || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Idempotent: already scored → return current state.
  if (row.status === 'scored') return NextResponse.json({ status: 'scored' });

  try {
    const diagnosis = await scoreIntake(row.intake_data as IntakeAnswers);
    await serviceClient
      .from('assessments')
      .update({
        status: 'scored',
        tier: diagnosis.tier,
        score: diagnosis.score,
        diagnosis,
        scored_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    return NextResponse.json({ status: 'scored', tier: diagnosis.tier });
  } catch (e) {
    console.error('[PRS score] failed', e);
    await serviceClient.from('assessments').update({ status: 'failed' }).eq('id', row.id);
    return NextResponse.json({ error: 'Scoring failed', status: 'failed' }, { status: 500 });
  }
}
