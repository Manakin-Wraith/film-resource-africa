'use client';

import { useState } from 'react';
import type { AfxDocument, EntityDocumentCategory } from '@/lib/afx/types';
import { ENTITY_DOCUMENT_CATEGORY_LABELS } from '@/lib/afx/documents';

const mono = 'var(--afx-mono)';

/** Read-only confirmation shown once FRA has verified the entity. No upload,
 *  no submit — the verified entity is the truth. View opens a signed URL. */
export default function EntityVerifiedCard({ verifiedAt, docs }: { verifiedAt: string; docs: AfxDocument[] }) {
  const [error, setError] = useState('');

  async function view(doc: AfxDocument) {
    setError('');
    try {
      const res = await fetch('/api/afx/documents/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: doc.path }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#F2FBF4', border: '1px solid #CDEAD5' }}>
        <span aria-hidden style={{ fontSize: 15, color: '#2E7D46' }}>✓</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#2E7D46' }}>Company verified</span>
        <span style={{ fontFamily: mono, fontSize: 10.5, color: '#5E9A6E', marginLeft: 'auto' }}>verified {verifiedAt.slice(0, 10)}</span>
      </div>

      {docs.length === 0 ? (
        <div style={{ fontSize: 12.5, color: '#9A9CA3' }}>No documents on file.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((d) => (
            <div key={d.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px', border: '1px solid #F2F0EB', borderRadius: 9 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: '#1C1D21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>
                  {ENTITY_DOCUMENT_CATEGORY_LABELS[d.category as EntityDocumentCategory] ?? d.category}
                </div>
              </div>
              <button onClick={() => view(d)} style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 12px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066' }}>View</button>
            </div>
          ))}
        </div>
      )}

      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}
    </div>
  );
}
