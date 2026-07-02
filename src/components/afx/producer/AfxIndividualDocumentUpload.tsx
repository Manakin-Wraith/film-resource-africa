'use client';

import { useRef, useState } from 'react';
import type { AfxDocument, IndividualDocumentCategory } from '@/lib/afx/types';
import { INDIVIDUAL_DOCUMENT_CATEGORIES, INDIVIDUAL_DOCUMENT_CATEGORY_LABELS, missingRequiredIndividualDocs, ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';
const linkBtn: React.CSSProperties = { cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 10px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066' };

interface Props {
  docs: AfxDocument[];
  locked: boolean;
  onAdd: (doc: AfxDocument) => void;
  onUpdate: (id: string, patch: { category: IndividualDocumentCategory }) => void;
  onRemove: (id: string) => void;
}

function prettySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AfxIndividualDocumentUpload({ docs, locked, onAdd, onUpdate, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hasCv = docs.some((d) => d.category === 'cv');

  async function upload(file: File) {
    setError('');
    if (!ALLOWED_DOC_TYPES.includes(file.type)) { setError('Unsupported type (PDF, PNG, JPEG, DOCX, XLSX only)'); return; }
    if (file.size > MAX_DOC_BYTES) { setError(`File is ${prettySize(file.size)} — max is 25 MB`); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('scope', 'individual');
      fd.append('category', hasCv ? 'other' : 'cv');
      const res = await fetch('/api/afx/documents/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? `Upload failed (${res.status})`);
      else onAdd(json.doc as AfxDocument);
    } catch (e) {
      setError(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — check your connection');
    } finally { setBusy(false); }
  }

  async function view(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  async function remove(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }) });
      if (res.ok) onRemove(doc.id);
      else { const json = await res.json().catch(() => ({})); setError(json.error ?? 'Could not remove document'); }
    } catch { setError('Could not remove document'); }
  }

  const ready = missingRequiredIndividualDocs(docs).length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1 }}>
      <div style={{ border: `1px solid ${ready ? '#CDEAD5' : '#F0DCA8'}`, background: ready ? '#F2FBF4' : '#FDF8EC', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: ready ? '#2E7D46' : '#9A6B1E' }}>{ready ? '✓ CV attached' : 'A CV / résumé is required'}</div>
      </div>
      {docs.map((d) => (
        <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>{prettySize(d.sizeBytes)}</div>
          </div>
          <select value={d.category} onChange={(e) => onUpdate(d.id, { category: e.target.value as IndividualDocumentCategory })} style={{ fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', cursor: 'pointer', minWidth: 120 }}>
            {INDIVIDUAL_DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{INDIVIDUAL_DOCUMENT_CATEGORY_LABELS[c]}</option>)}
          </select>
          <button onClick={() => view(d)} style={linkBtn}>View</button>
          <button onClick={() => remove(d)} aria-label="Remove document" style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, width: 30, height: 30, color: '#9A9CA3', fontSize: 15, lineHeight: 1 }}>×</button>
        </div>
      ))}
      <button onClick={() => inputRef.current?.click()} disabled={busy} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8, border: '1px solid #D6D8F5', background: '#fff', color: 'var(--afx-accent)' }}>
        {busy ? 'Uploading…' : hasCv ? '+ Add supporting document' : '+ Upload CV'}
      </button>
      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}
