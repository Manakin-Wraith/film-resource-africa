import { NextRequest, NextResponse } from 'next/server';
import { AFX_DOCS_BUCKET, afxAdmin, resolveDocAccess, UUID_RE, hasOpenSubmission } from '@/lib/afx/server/documentAccess';
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES, DOCUMENT_CATEGORIES, ENTITY_DOCUMENT_CATEGORIES, INDIVIDUAL_DOCUMENT_CATEGORIES } from '@/lib/afx/documents';
import type { AfxDocument, DocumentCategory, EntityDocumentCategory, IndividualDocumentCategory } from '@/lib/afx/types';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const scope = (form.get('scope') as string | null) ?? 'case_study';
  const caseStudyId = form.get('caseStudyId') as string | null;
  const category = form.get('category') as string | null;

  if (!file || !category) {
    return NextResponse.json({ error: 'Missing file or category' }, { status: 400 });
  }
  if (scope !== 'case_study' && scope !== 'entity' && scope !== 'individual') {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }
  const allowedCats = scope === 'entity' ? ENTITY_DOCUMENT_CATEGORIES
    : scope === 'individual' ? INDIVIDUAL_DOCUMENT_CATEGORIES
    : DOCUMENT_CATEGORIES;
  if (!(allowedCats as readonly string[]).includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const access = await resolveDocAccess();
  if (!access) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (scope !== 'individual' && !access.ndaSigned) return NextResponse.json({ error: 'NDA must be signed to upload documents' }, { status: 403 });

  // Resolve the path segment + enforce the edit-lock for this target.
  let segment: string;
  if (scope === 'entity') {
    if (!access.individualVerifiedAt) {
      return NextResponse.json({ error: 'Complete individual vetting before uploading company documents' }, { status: 403 });
    }
    if (await hasOpenSubmission(access.producerId, 'entity', null)) {
      return NextResponse.json({ error: 'Entity is locked for review — withdraw to edit' }, { status: 409 });
    }
    segment = 'entity';
  } else if (scope === 'individual') {
    if (await hasOpenSubmission(access.producerId, 'individual', null)) {
      return NextResponse.json({ error: 'Individual profile is locked for review — withdraw to edit' }, { status: 409 });
    }
    segment = 'individual';
  } else {
    if (!caseStudyId || !UUID_RE.test(caseStudyId)) {
      return NextResponse.json({ error: 'Invalid caseStudyId' }, { status: 400 });
    }
    if (await hasOpenSubmission(access.producerId, 'case_study', caseStudyId)) {
      return NextResponse.json({ error: 'Case study is locked for review — withdraw to edit' }, { status: 409 });
    }
    segment = caseStudyId;
  }

  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type (PDF, PNG, JPEG, DOCX, XLSX only)' }, { status: 400 });
  }
  if (file.size > MAX_DOC_BYTES) {
    return NextResponse.json({ error: 'File must be under 25 MB' }, { status: 400 });
  }

  const docId = crypto.randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${access.producerId}/${segment}/${docId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await afxAdmin.storage.from(AFX_DOCS_BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    console.error('[afx-docs] storage error:', error.message);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }

  const doc: AfxDocument = {
    id: docId, path, filename: file.name, category: category as DocumentCategory | EntityDocumentCategory | IndividualDocumentCategory,
    sizeBytes: file.size, contentType: file.type, uploadedAt: new Date().toISOString(),
  };
  return NextResponse.json({ doc });
}
