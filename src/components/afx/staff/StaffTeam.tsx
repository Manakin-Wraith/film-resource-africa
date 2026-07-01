'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { StaffMember } from '@/lib/afx/server/staffAdmin';
import { addStaffAction, removeStaffAction } from '@/app/afx/staff/team/actions';

const mono = 'var(--afx-mono)';

export default function StaffTeam({ members, selfUserId }: { members: StaffMember[]; selfUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function add() {
    if (busy || !email.trim()) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const res = await addStaffAction(email);
      if (res.ok) { setNote(`${email.trim()} is on the team.`); setEmail(''); router.refresh(); }
      else setError(res.error ?? 'Could not add reviewer.');
    } catch { setError('Could not add reviewer — please try again.'); }
    finally { setBusy(false); }
  }

  async function remove(userId: string) {
    if (busy) return;
    setBusy(true); setError(null); setNote(null); setConfirmId(null);
    try {
      const res = await removeStaffAction(userId);
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Could not remove reviewer.');
    } catch { setError('Could not remove reviewer — please try again.'); }
    finally { setBusy(false); }
  }

  const cardStyle: React.CSSProperties = { border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
  const btn = (bg: string, bd: string, fg: string): React.CSSProperties => ({ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 15px', borderRadius: 8, border: `1px solid ${bd}`, background: bg, color: fg });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Review team</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Add reviewer</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="reviewer@example.com"
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            style={{ flex: 1, fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid var(--afx-border)', borderRadius: 8, padding: '9px 11px' }} />
          <button disabled={busy} onClick={add} style={btn('var(--afx-ink)', 'var(--afx-ink)', '#fff')}>Add reviewer</button>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--afx-faint)' }}>They must have signed in to FRA at least once.</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Team ({members.length})</div>
        {members.map((mbr) => {
          const isAdmin = mbr.role === 'admin';
          const isSelf = mbr.userId === selfUserId;
          return (
            <div key={mbr.userId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mbr.email}{isSelf ? ' (you)' : ''}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)' }}>joined {mbr.createdAt.slice(0, 10)}</div>
              </div>
              <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '3px 10px',
                color: isAdmin ? '#1C4E80' : 'var(--afx-muted)', background: isAdmin ? '#EAF1F8' : '#F4F4F2', border: `1px solid ${isAdmin ? '#C3D6EA' : 'var(--afx-border)'}` }}>{mbr.role}</span>
              {isAdmin ? (
                <span title="Admin — manage via Dashboard" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faintest)' }}>🔒</span>
              ) : confirmId === mbr.userId ? (
                <button disabled={busy} onClick={() => remove(mbr.userId)} style={btn('#fff', '#E3B6AE', '#7A2E2E')}>Confirm?</button>
              ) : (
                <button disabled={busy} onClick={() => setConfirmId(mbr.userId)} style={btn('#fff', 'var(--afx-border)', 'var(--afx-muted)')}>Remove</button>
              )}
            </div>
          );
        })}
      </div>

      {note ? <div style={{ fontSize: 12, color: 'var(--afx-muted)' }}>{note}</div> : null}
      {error ? <div style={{ fontSize: 12, color: '#c0392b' }}>{error}</div> : null}
    </div>
  );
}
