'use client';

import { useRef, useState } from 'react';
import type { AfxDocument, DocumentCategory } from '@/lib/afx/types';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--afx-body)', fontSize: 13, color: '#1C1D21',
  border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none',
};

interface Props {
  caseStudyId: string;
  docs: AfxDocument[];
  onAdd: (doc: AfxDocument) => void;
  onUpdate: (id: string, patch: { category: DocumentCategory }) => void;
  onRemove: (id: string) => void;
}

function prettySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AfxDocumentUpload({ caseStudyId, docs, onAdd, onUpdate, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setError('');
    if (!ALLOWED_DOC_TYPES.includes(file.type)) { setError('Unsupported type (PDF, PNG, JPEG, DOCX, XLSX only)'); return; }
    if (file.size > MAX_DOC_BYTES) { setError(`File is ${prettySize(file.size)} — max is 25 MB`); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caseStudyId', caseStudyId);
      fd.append('category', 'other');
      const res = await fetch('/api/afx/documents/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? `Upload failed (${res.status})`);
      else onAdd(json.doc as AfxDocument);
    } catch (e) {
      setError(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — check your connection');
    } finally {
      setBusy(false);
    }
  }

  async function view(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: doc.path }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch {
      setError('Could not open document');
    }
  }

  async function remove(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: doc.path }),
      });
      if (res.ok) onRemove(doc.id);
      else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Could not remove document');
      }
    } catch {
      setError('Could not remove document');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {docs.map((d) => (
        <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>{prettySize(d.sizeBytes)}</div>
          </div>
          <select value={d.category} onChange={(e) => onUpdate(d.id, { category: e.target.value as DocumentCategory })} style={{ ...inputStyle, cursor: 'pointer', minWidth: 140 }}>
            {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{DOCUMENT_CATEGORY_LABELS[c]}</option>)}
          </select>
          <button onClick={() => view(d)} style={linkBtn}>View</button>
          <button onClick={() => remove(d)} aria-label="Remove document" style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, width: 30, height: 30, color: '#9A9CA3', fontSize: 15, lineHeight: 1 }}>×</button>
        </div>
      ))}

      <button onClick={() => inputRef.current?.click()} disabled={busy}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8, border: '1px solid #D6D8F5', background: '#fff', color: 'var(--afx-accent)' }}>
        {busy ? 'Uploading…' : '+ Upload document'}
      </button>
      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}

      <input ref={inputRef} type="file"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7,
  padding: '6px 10px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066',
};
