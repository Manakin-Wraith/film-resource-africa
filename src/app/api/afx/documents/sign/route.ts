import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess, isOwnedDocPath } from '@/lib/afx/server/documentAccess';

export async function POST(req: NextRequest) {
  const { path } = await req.json().catch(() => ({} as { path?: string }));
  if (typeof path !== 'string' || path === '') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  // Namespace boundary: a producer may only sign paths under their own id.
  if (!isOwnedDocPath(path, access.producerId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data, error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).createSignedUrl(path, 60);
  if (error) {
    console.error('[afx-docs] storage error:', error.message);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
