import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess } from '@/lib/afx/server/documentAccess';

export async function POST(req: NextRequest) {
  const { path } = await req.json().catch(() => ({} as { path?: string }));
  if (typeof path !== 'string' || path === '') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!path.startsWith(`${access.producerId}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
