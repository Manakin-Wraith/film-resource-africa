'use client';

import Link from 'next/link';
import type { InviteRow } from '@/lib/afx/inviteFunnel';

const mono = 'var(--afx-mono)';

export default function StaffInvites({ rows }: { rows: InviteRow[] }) {
  const pending = rows.filter((r) => r.status === 'pending').length;
  const activated = rows.length - pending;
  const cardStyle: React.CSSProperties = { border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Producer invites</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>
          Pending ({pending}) · Activated ({activated})
        </div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--afx-faint)' }}>No invites yet.</div>
        ) : rows.map((r) => {
          const isPending = r.status === 'pending';
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)' }}>
                  {isPending ? 'not activated yet' : ([r.producerName, r.company].filter(Boolean).join(' · ') || '—')}
                </div>
              </div>
              <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '3px 10px',
                color: isPending ? '#9A6B1E' : '#2E7D46', background: isPending ? '#FBF3E4' : '#F2FBF4', border: `1px solid ${isPending ? '#E6D3A8' : '#CDEAD5'}` }}>
                {isPending ? 'Pending' : 'Activated'}
              </span>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)', textAlign: 'right', minWidth: 150 }}>
                <div>invited {r.invitedAt.slice(0, 10)}</div>
                {!isPending ? <div>activated {r.activatedAt ? r.activatedAt.slice(0, 10) : '—'}</div> : null}
                {!isPending ? <div>last active {r.lastActiveAt ? r.lastActiveAt.slice(0, 10) : '—'}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
