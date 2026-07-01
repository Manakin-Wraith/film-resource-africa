'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { InviteRow } from '@/lib/afx/inviteFunnel';
import { createInviteAction, revokeInviteAction } from '@/app/afx/staff/invites/actions';

const mono = 'var(--afx-mono)';

export default function StaffInvites({ rows }: { rows: InviteRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const pending = rows.filter((r) => r.status === 'pending').length;
  const activated = rows.length - pending;

  async function invite() {
    if (busy || !email.trim()) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const res = await createInviteAction(email);
      if (res.ok) { setNote(res.note ?? `Invited ${email.trim()}.`); setEmail(''); router.refresh(); }
      else setError(res.error ?? 'Could not invite.');
    } catch { setError('Could not invite — please try again.'); }
    finally { setBusy(false); }
  }

  async function revoke(id: string) {
    if (busy) return;
    setBusy(true); setError(null); setNote(null); setConfirmId(null);
    try {
      const res = await revokeInviteAction(id);
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Could not revoke.');
    } catch { setError('Could not revoke — please try again.'); }
    finally { setBusy(false); }
  }

  const cardStyle: React.CSSProperties = { border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
  const btn = (bg: string, bd: string, fg: string): React.CSSProperties => ({ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 15px', borderRadius: 8, border: `1px solid ${bd}`, background: bg, color: fg });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Producer invites</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Invite a producer</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="producer@example.com"
            onKeyDown={(e) => { if (e.key === 'Enter') invite(); }}
            style={{ flex: 1, fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid var(--afx-border)', borderRadius: 8, padding: '9px 11px' }} />
          <button disabled={busy} onClick={invite} style={btn('var(--afx-ink)', 'var(--afx-ink)', '#fff')}>Invite producer</button>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--afx-faint)' }}>They&apos;ll get an email with a link to the AFX login.</div>
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
              {isPending ? (
                confirmId === r.id ? (
                  <button disabled={busy} onClick={() => revoke(r.id)} style={btn('#fff', '#E3B6AE', '#7A2E2E')}>Confirm?</button>
                ) : (
                  <button disabled={busy} onClick={() => setConfirmId(r.id)} style={btn('#fff', 'var(--afx-border)', 'var(--afx-muted)')}>Revoke</button>
                )
              ) : null}
            </div>
          );
        })}
      </div>

      {note ? <div style={{ fontSize: 12, color: 'var(--afx-muted)' }}>{note}</div> : null}
      {error ? <div style={{ fontSize: 12, color: '#c0392b' }}>{error}</div> : null}
    </div>
  );
}
