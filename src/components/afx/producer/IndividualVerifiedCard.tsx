'use client';

import { useState } from 'react';
import type { AfxDocument, IndividualDocumentCategory, ProducerProfile } from '@/lib/afx/types';
import { INDIVIDUAL_DOCUMENT_CATEGORY_LABELS } from '@/lib/afx/documents';
import { safeHttpUrl } from '@/lib/afx/links';

const mono = 'var(--afx-mono)';
type Links = NonNullable<ProducerProfile['individualLinks']>;

/** Read-only confirmation once FRA has verified the individual. CV + links, View only. */
export default function IndividualVerifiedCard({ verifiedAt, docs, links }: { verifiedAt: string; docs: AfxDocument[]; links: Links }) {
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

  const linkEntries = (['imdb', 'linkedin', 'portfolio'] as const).map((k) => [k, links[k]] as const).filter((e): e is readonly [typeof e[0], string] => !!e[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#F2FBF4', border: '1px solid #CDEAD5' }}>
        <span aria-hidden style={{ fontSize: 15, color: '#2E7D46' }}>✓</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#2E7D46' }}>Individual verified</span>
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
                <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3' }}>{INDIVIDUAL_DOCUMENT_CATEGORY_LABELS[d.category as IndividualDocumentCategory] ?? d.category}</div>
              </div>
              <button onClick={() => view(d)} style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 12px', fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#5E6066' }}>View</button>
            </div>
          ))}
        </div>
      )}

      {linkEntries.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {linkEntries.map(([k, v]) => {
            const href = safeHttpUrl(v);
            return href ? (
              <a key={k} href={href} target="_blank" rel="noopener noreferrer" style={{ fontFamily: mono, fontSize: 11, color: '#1C4E80', textDecoration: 'none', border: '1px solid #C4D8EF', borderRadius: 999, padding: '4px 11px', textTransform: 'capitalize' }}>{k}</a>
            ) : null;
          })}
        </div>
      ) : null}

      {error ? <span style={{ fontSize: 11.5, color: '#c0392b' }}>{error}</span> : null}
    </div>
  );
}
