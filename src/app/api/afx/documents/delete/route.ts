import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess, isOwnedDocPath, hasOpenSubmission } from '@/lib/afx/server/documentAccess';

export async function POST(req: NextRequest) {
  const { path } = await req.json().catch(() => ({} as { path?: string }));
  if (typeof path !== 'string' || path === '') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!isOwnedDocPath(path, access.producerId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // path = producerId/<segment>/docId.ext — segment is 'entity' or a case-study uuid.
  const segment = path.split('/')[1];
  const locked = segment === 'entity'
    ? await hasOpenSubmission(access.producerId, 'entity', null)
    : await hasOpenSubmission(access.producerId, 'case_study', segment);
  if (locked) {
    return NextResponse.json({ error: 'Locked for review — withdraw to edit' }, { status: 409 });
  }
  const { error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).remove([path]);
  if (error) {
    console.error('[afx-docs] storage error:', error.message);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
