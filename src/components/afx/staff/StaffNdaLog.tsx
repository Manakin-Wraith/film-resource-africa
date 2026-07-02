'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NdaProducerEntry, NdaStatus } from '@/lib/afx/ndaLog';

const mono = 'var(--afx-mono)';

const STATUS_META: Record<NdaStatus, { label: string; ink: string; bg: string; border: string }> = {
  signed: { label: 'Signed', ink: '#2E7D46', bg: '#F2FBF4', border: '#CDEAD5' },
  legacy: { label: 'Signed · legacy', ink: '#5E9A6E', bg: '#F4F8F5', border: '#D8E6DC' },
  withdrawn: { label: 'Withdrawn', ink: '#9A6B1E', bg: '#FBF6EC', border: '#EAD9BE' },
  none: { label: 'Not signed', ink: 'var(--afx-faint)', bg: '#F6F5F2', border: 'var(--afx-border)' },
};

function EventBadge({ action }: { action: 'signed' | 'withdrawn' }) {
  const s = action === 'signed' ? STATUS_META.signed : STATUS_META.withdrawn;
  return <span style={{ fontFamily: mono, fontSize: 9.5, fontWeight: 700, color: s.ink, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '2px 8px' }}>{action}</span>;
}

export default function StaffNdaLog({ entries }: { entries: NdaProducerEntry[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--afx-ink)', margin: 0 }}>NDA signatures</h1>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
      </div>
      {entries.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--afx-faint)', padding: '20px 0' }}>No NDA activity yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e) => {
            const m = STATUS_META[e.status];
            const isOpen = !!open[e.producerId];
            return (
              <div key={e.producerId} style={{ border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)' }}>{e.producerName}{e.company ? <span style={{ color: 'var(--afx-faint)', fontWeight: 400 }}> · {e.company}</span> : null}</div>
                    <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)', marginTop: 3 }}>
                      {e.current ? `by ${e.current.signerName} · ${e.current.at.slice(0, 10)} · NDA v${e.current.version}` : e.status === 'legacy' ? 'signed before the audit log existed' : '—'}
                    </div>
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: m.ink, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 999, padding: '3px 10px' }}>{m.label}</span>
                  {e.events.length > 0 ? (
                    <button onClick={() => setOpen((o) => ({ ...o, [e.producerId]: !o[e.producerId] }))}
                      style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--afx-border)', borderRadius: 7, padding: '5px 10px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: 'var(--afx-muted)' }}>
                      {isOpen ? '▾' : '▸'} {e.events.length} event{e.events.length === 1 ? '' : 's'}
                    </button>
                  ) : null}
                </div>
                {isOpen && e.events.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--afx-border)' }}>
                    {e.events.map((ev) => (
                      <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <EventBadge action={ev.action} />
                        <span style={{ fontSize: 12.5, color: 'var(--afx-ink)' }}>{ev.signerName}</span>
                        <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginLeft: 'auto' }}>NDA v{ev.docVersion} · {ev.at.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
