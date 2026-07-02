import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, isOwnedDocPath } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';

export async function POST(req: NextRequest) {
  const { submissionId, path } = await req.json().catch(() => ({} as { submissionId?: string; path?: string }));
  if (typeof submissionId !== 'string' || submissionId === '' || typeof path !== 'string' || path === '') {
    return NextResponse.json({ error: 'Missing submissionId or path' }, { status: 400 });
  }
  if (!(await resolveStaff())) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { data: sub } = await afxAdmin.from('afx_vetting_submissions')
    .select('kind, producer_id, target_id').eq('id', submissionId)
    .maybeSingle<{ kind: string; producer_id: string; target_id: string | null }>();
  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  // The path must belong to THIS submission's producer + target.
  const expectedSegment = sub.kind === 'entity' ? 'entity' : sub.kind === 'individual' ? 'individual' : sub.target_id;
  if (!expectedSegment || !isOwnedDocPath(path, sub.producer_id) || path.split('/')[1] !== expectedSegment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data, error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).createSignedUrl(path, 60);
  if (error) {
    console.error('[afx-staff-docs] storage error:', error.message);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
