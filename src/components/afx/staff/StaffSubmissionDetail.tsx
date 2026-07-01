'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SubmissionDetail } from '@/lib/afx/server/staffReview';
import type { VerifyField } from '@/lib/afx/server/staffReview';
import type { Provenance } from '@/lib/afx/types';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
import { startReviewAction, verifyFieldAction, revertFieldAction, decideAction } from '@/app/afx/staff/actions';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';

const mono = 'var(--afx-mono)';

export default function StaffSubmissionDetail({ detail }: { detail: SubmissionDetail }) {
  const router = useRouter();
  const { submission, producer, project } = detail;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const m = VETTING_STATUS_META[submission.status];
  const underReview = submission.status === 'under_review';
  const open = submission.status === 'submitted' || submission.status === 'under_review';

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    if (busy) return;
    setBusy(true); setError(null);
    try { const res = await fn(); if (res.ok) router.refresh(); else setError(res.error ?? 'Action failed'); }
    catch { setError('Action failed — please try again'); }
    finally { setBusy(false); }
  }

  async function view(path: string) {
    setError(null);
    try {
      const res = await fetch('/api/afx/staff/documents/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: submission.id, path }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) window.open(json.url as string, '_blank', 'noopener');
      else setError(json.error ?? 'Could not open document');
    } catch { setError('Could not open document'); }
  }

  const fields: { field: VerifyField; label: string; value: string; provenance: Provenance }[] = [];
  if (project) {
    fields.push({ field: 'budgetBand', label: 'Budget band', value: project.budgetBand.value, provenance: project.budgetBand.provenance });
    const o = project.outcomes;
    if (o) {
      fields.push({ field: 'recoupment', label: 'Recoupment', value: o.recoupment.value, provenance: o.recoupment.provenance });
      fields.push({ field: 'bondUsed', label: 'Completion bond', value: o.bondUsed.value, provenance: o.bondUsed.provenance });
      o.distribution.forEach((d, i) => fields.push({ field: `distribution:${i}` as VerifyField, label: `Distribution — ${d.name || d.type}`, value: `${d.name} (${d.type})`, provenance: d.provenance }));
    }
  }
  const docs = project ? (project.docs ?? []) : (producer.entityDocs ?? []);

  const ex = project?.exact;
  const exactRows: { label: string; value: string }[] = [];
  if (ex) {
    const money = (m?: { amount: number; currency: string }) => (m ? `${m.currency} ${m.amount.toLocaleString('en-US')}` : null);
    const push = (label: string, m?: { amount: number; currency: string }) => { const v = money(m); if (v) exactRows.push({ label, value: v }); };
    push('Total budget', ex.budget);
    push('Funding secured', ex.fundingSecured);
    push('Capital stack — Equity', ex.capitalStack?.equity);
    push('Capital stack — Soft', ex.capitalStack?.soft);
    push('Capital stack — Debt', ex.capitalStack?.debt);
    push('Capital stack — Gap', ex.capitalStack?.gap);
  }

  const cardStyle: React.CSSProperties = { border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
  const btn = (bg: string, bd: string, fg: string): React.CSSProperties => ({ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 15px', borderRadius: 8, border: `1px solid ${bd}`, background: bg, color: fg });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{submission.kind === 'entity' ? `${producer.company} — company vetting` : (project?.title || 'Case study')}</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', marginTop: 3 }}>{producer.name} · {producer.company}{producer.entityVerifiedAt ? ' · ✓ verified company' : ''}</div>
          </div>
          <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: m.ink, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 999, padding: '3px 10px' }}>{m.label}</span>
        </div>
        {submission.reviewerNotes ? <div style={{ fontSize: 12.5, color: 'var(--afx-muted)' }}>Notes: {submission.reviewerNotes}</div> : null}
      </div>

      {project ? (
        <div style={cardStyle}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Claims</div>
          {fields.map((f) => (
            <div key={f.field} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: 'var(--afx-muted)' }}>{f.value || '—'}</div>
              </div>
              <ProvenanceBadge provenance={f.provenance} size="sm" />
              {underReview ? (
                f.provenance === 'verified'
                  ? <button disabled={busy} onClick={() => run(() => revertFieldAction(submission.id, f.field))} style={btn('#fff', 'var(--afx-border)', 'var(--afx-muted)')}>Revert</button>
                  : <button disabled={busy} onClick={() => run(() => verifyFieldAction(submission.id, f.field))} style={btn('#F2FBF4', '#CDEAD5', '#2E7D46')}>Verify</button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {exactRows.length > 0 ? (
        <div style={{ ...cardStyle, border: '1px solid #E3B6AE', background: '#FDF7F5' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A2E2E' }}>NDA figures — confidential</div>
            <div style={{ fontSize: 11, color: 'var(--afx-faint)' }}>Verify claims against these. Never shared with funders.</div>
          </div>
          {exactRows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontFamily: mono, fontSize: 13, color: 'var(--afx-ink)' }}>{r.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div style={cardStyle}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faintest)' }}>Proof documents</div>
        {docs.length === 0 ? <div style={{ fontSize: 12.5, color: 'var(--afx-faint)' }}>None attached.</div> : docs.map((d) => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename} <span style={{ color: 'var(--afx-faint)' }}>· {d.category}</span></div>
            <button disabled={busy} onClick={() => view(d.path)} style={btn('#fff', 'var(--afx-border)', 'var(--afx-muted)')}>View</button>
          </div>
        ))}
      </div>

      {open ? (
        <div style={cardStyle}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer notes (shown to the producer when requesting changes)"
            style={{ fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid var(--afx-border)', borderRadius: 8, padding: '9px 11px', minHeight: 70, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {submission.status === 'submitted' ? <button disabled={busy} onClick={() => run(() => startReviewAction(submission.id))} style={btn('var(--afx-ink)', 'var(--afx-ink)', '#fff')}>Start review</button> : null}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button disabled={busy} onClick={() => run(() => decideAction(submission.id, 'request_changes', notes))} style={btn('#fff', '#E3B6AE', '#7A2E2E')}>Request changes</button>
              <button disabled={busy} onClick={() => run(() => decideAction(submission.id, 'approve'))} style={btn('#1C4E80', '#1C4E80', '#fff')}>Approve</button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <div style={{ fontSize: 12, color: '#c0392b' }}>{error}</div> : null}
    </div>
  );
}
