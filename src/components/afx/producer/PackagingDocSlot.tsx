'use client';

import { useRef, useState } from 'react';
import type { AfxDocument } from '@/lib/afx/types';
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';

interface PackagingDocSlotProps {
  projectId: string;
  packagingId: string;
  category: 'talent_cv' | 'talent_contract';
  label: string;
  doc?: AfxDocument;
  onReplace: (doc: AfxDocument) => void;
  onClear: () => void;
}

function prettySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PackagingDocSlot({ projectId, packagingId, category, label, doc, onReplace, onClear }: PackagingDocSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setError('');
    if (!ALLOWED_DOC_TYPES.includes(file.type)) { setError('Unsupported type (PDF, PNG, JPEG, DOCX, XLSX)'); return; }
    if (file.size > MAX_DOC_BYTES) { setError(`File is ${prettySize(file.size)} — max 25 MB`); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caseStudyId', projectId);
      fd.append('category', category);
      fd.append('packagingId', packagingId);
      const res = await fetch('/api/afx/documents/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? `Upload failed (${res.status})`);
      else onReplace(json.doc as AfxDocument);
    } catch (e) {
      setError(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — check your connection');
    } finally {
      setBusy(false);
    }
  }

  async function view() {
    if (!doc) return;
    setError('');
    try {
      const res = await fetch('/api/afx/documents/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  async function clear() {
    if (!doc) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/afx/documents/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }),
      });
      if (res.ok) onClear();
      else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Could not remove document');
      }
    } catch { setError('Could not remove document'); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A7A99F' }}>{label}</span>
      {doc ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</span>
          <button onClick={view} style={linkBtn}>View</button>
          <button onClick={clear} disabled={busy} aria-label={`Clear ${label}`} style={{ cursor: busy ? 'wait' : 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 6, width: 26, height: 26, color: '#9A9CA3', fontSize: 14, lineHeight: 1 }}>×</button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          style={{ alignSelf: 'flex-start', cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 11.5, fontWeight: 600, padding: '5px 10px', borderRadius: 7, border: '1px solid #D6D8F5', background: '#fff', color: 'var(--afx-accent)' }}>
          {busy ? 'Uploading…' : `↑ ${label}`}
        </button>
      )}
      {error ? <span style={{ fontSize: 10.5, color: '#c0392b' }}>{error}</span> : null}
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 6,
  padding: '5px 9px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: '#5E6066',
};
