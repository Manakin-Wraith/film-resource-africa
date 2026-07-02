'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { StaffQueueItem } from '@/lib/afx/server/staffReview';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';

const mono = 'var(--afx-mono)';

export default function StaffQueue({ open, decided }: { open: StaffQueueItem[]; decided: StaffQueueItem[] }) {
  const [tab, setTab] = useState<'open' | 'decided'>('open');
  const rows = tab === 'open' ? open : decided;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['open', 'decided'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ cursor: 'pointer', fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '7px 13px', borderRadius: 8, border: '1px solid var(--afx-border)',
              background: tab === t ? 'var(--afx-ink)' : '#fff', color: tab === t ? '#fff' : 'var(--afx-muted)' }}>
            {t} ({t === 'open' ? open.length : decided.length})
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--afx-faint)', padding: '20px 0' }}>Nothing here.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const m = VETTING_STATUS_META[r.submission.status];
            return (
              <Link key={r.submission.id} href={`/afx/staff/${r.submission.id}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)' }}>
                    {r.submission.kind === 'entity'
                      ? `${r.company} — company vetting`
                      : r.submission.kind === 'individual'
                      ? `${r.producerName} — individual vetting`
                      : (r.targetTitle || 'Untitled case study')}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)', marginTop: 3 }}>
                    {r.producerName} · {r.company} · submitted {r.submission.submittedAt.slice(0, 10)}
                  </div>
                </div>
                <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: m.ink, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 999, padding: '3px 10px' }}>{m.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
