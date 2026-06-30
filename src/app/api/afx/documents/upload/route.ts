import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess } from '@/lib/afx/server/documentAccess';
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES, DOCUMENT_CATEGORIES } from '@/lib/afx/documents';
import type { AfxDocument, DocumentCategory } from '@/lib/afx/types';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const caseStudyId = form.get('caseStudyId') as string | null;
  const category = form.get('category') as string | null;

  if (!file || !caseStudyId || !category) {
    return NextResponse.json({ error: 'Missing file, caseStudyId or category' }, { status: 400 });
  }
  if (!(DOCUMENT_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!access.ndaSigned) return NextResponse.json({ error: 'NDA must be signed to upload documents' }, { status: 403 });

  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type (PDF, PNG, JPEG, DOCX, XLSX only)' }, { status: 400 });
  }
  if (file.size > MAX_DOC_BYTES) {
    return NextResponse.json({ error: 'File must be under 25 MB' }, { status: 400 });
  }

  const docId = crypto.randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${access.producerId}/${caseStudyId}/${docId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const doc: AfxDocument = {
    id: docId, path, filename: file.name, category: category as DocumentCategory,
    sizeBytes: file.size, contentType: file.type, uploadedAt: new Date().toISOString(),
  };
  return NextResponse.json({ doc });
}
