import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';
import { ReportFree, ReportMember, type JournalEntry } from '@/components/prs/Report';
import type { Assessment, PrsTier } from '@/lib/prs/types';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isStale(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() > 30 * 86400000;
}

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 60) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

async function fetchAssessment(token: string): Promise<Assessment | null> {
  const { data } = await serviceClient.from('assessments').select('*').eq('token', token).maybeSingle();
  return (data as Assessment) ?? null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> },
): Promise<Metadata> {
  const { token } = await params;
  const a = await fetchAssessment(token);
  if (!a) return { title: 'Diagnosis not found' };
  return {
    title: `${a.project_title} — Project Readiness Diagnosis`,
    description: `FRA Project Readiness Score for ${a.project_title}.`,
    robots: { index: false }, // private report
  };
}

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await fetchAssessment(token);
  if (!a) notFound();

  // Not yet scored (pending) or scoring errored (failed) → send to the processing
  // screen, which re-triggers scoring on the existing row. This prevents a
  // transient failure from dead-ending a free submitter (whose email is otherwise
  // locked by the one-free-per-email index).
  if (a.status !== 'scored' || !a.diagnosis) {
    if (a.status === 'pending' || a.status === 'failed') {
      redirect(`/assess/processing?token=${token}`);
    }
    notFound();
  }

  const project = { title: a.project_title, format: a.format, genre: a.genre, country: a.country };
  const meta = {
    scoredAt: a.scored_at ? relative(a.scored_at) : 'recently',
    submittedAt: fmtDate(a.submitted_at),
  };
  const stale = isStale(a.scored_at);

  // Member view only when the viewer is the active member who owns this assessment.
  let isOwnerMember = false;
  if (a.member_id) {
    const user = await getSessionUser();
    if (user?.email) {
      const { data: member } = await serviceClient
        .from('members').select('id').eq('email', user.email.toLowerCase()).eq('status', 'active').maybeSingle();
      if (member && member.id === a.member_id) isOwnerMember = true;
    }
  }

  if (!isOwnerMember) {
    return <ReportFree project={project} diagnosis={a.diagnosis} stale={stale} meta={meta} />;
  }

  // Build journal from all of this member's diagnoses, newest first.
  const { data: rows } = await serviceClient
    .from('assessments')
    .select('token, tier, score, submitted_at')
    .eq('member_id', a.member_id)
    .order('submitted_at', { ascending: false });

  const journal: JournalEntry[] = (rows ?? []).map((r) => ({
    token: r.token as string,
    date: fmtDate(r.submitted_at as string),
    tier: (r.tier as PrsTier | null),
    score: (r.score as number | null),
    current: r.token === token,
    age: relative(r.submitted_at as string),
  }));

  return (
    <ReportMember
      project={project} diagnosis={a.diagnosis} stale={stale} meta={meta}
      journal={journal} token={token}
    />
  );
}
