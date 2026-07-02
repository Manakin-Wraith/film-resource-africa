'use client';

import type { AfxDocument, IndividualDocumentCategory, ProducerProfile, VettingSubmission } from '@/lib/afx/types';
import { isIndividualVettingReady } from '@/lib/afx/documents';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
import { SectionCard } from './cockpitUi';
import AfxIndividualDocumentUpload from './AfxIndividualDocumentUpload';
import IndividualVerifiedCard from './IndividualVerifiedCard';

const mono = 'var(--afx-mono)';
type Links = NonNullable<ProducerProfile['individualLinks']>;

interface Props {
  draft: ProducerProfile;
  submission?: VettingSubmission;
  locked: boolean;
  busy?: boolean;
  onAddDoc: (doc: AfxDocument) => void;
  onUpdateDoc: (id: string, patch: { category: IndividualDocumentCategory }) => void;
  onRemoveDoc: (id: string) => void;
  onLinks: (patch: Partial<Links>) => void;
  onSubmit: () => void;
  onWithdraw: () => void;
}

export default function IndividualVettingPanel({ draft, submission, locked, busy, onAddDoc, onUpdateDoc, onRemoveDoc, onLinks, onSubmit, onWithdraw }: Props) {
  const verifiedAt = draft.individualVerifiedAt;
  const docs = draft.individualDocs ?? [];
  const links = draft.individualLinks ?? {};
  const ready = isIndividualVettingReady({ entityK2: draft.entityK2, individualDocs: docs });
  const showBadge = submission && submission.status !== 'withdrawn';

  return (
    <SectionCard title="Individual Vetting" hint={verifiedAt ? 'verified · read-only' : 'producer + FRA only'}>
      {verifiedAt ? (
        <IndividualVerifiedCard verifiedAt={verifiedAt} docs={docs} links={links} />
      ) : (
        <>
          {showBadge ? (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: VETTING_STATUS_META[submission!.status].bg, border: `1px solid ${VETTING_STATUS_META[submission!.status].border}`, color: VETTING_STATUS_META[submission!.status].ink, fontSize: 12.5 }}>
              <strong style={{ fontWeight: 700 }}>{VETTING_STATUS_META[submission!.status].label}</strong>
              {locked ? ' — read-only while FRA reviews. Withdraw to edit.' : ''}
              {submission!.status === 'changes_requested' && submission!.reviewerNotes ? <div style={{ marginTop: 4 }}>{submission!.reviewerNotes}</div> : null}
            </div>
          ) : null}

          {!draft.entityK2 ? (
            <div style={{ marginBottom: 10, fontFamily: mono, fontSize: 11, color: '#9A6B1E' }}>
              Turn on the <strong>K2 — Individual / professional standing</strong> gate (Account &amp; Visibility) to make your profile vetting-ready.
            </div>
          ) : null}

          <AfxIndividualDocumentUpload docs={docs} locked={locked} onAdd={onAddDoc} onUpdate={onUpdateDoc} onRemove={onRemoveDoc} />

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, pointerEvents: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1 }}>
            <LinkField label="IMDb" value={links.imdb ?? ''} onChange={(v) => onLinks({ imdb: v })} />
            <LinkField label="LinkedIn" value={links.linkedin ?? ''} onChange={(v) => onLinks({ linkedin: v })} />
            <LinkField label="Portfolio / site" value={links.portfolio ?? ''} onChange={(v) => onLinks({ portfolio: v })} />
          </div>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            {locked ? (
              <button onClick={onWithdraw} disabled={busy} style={{ cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 8, border: '1px solid #9A6B1E', background: '#fff', color: '#9A6B1E', opacity: busy ? 0.6 : 1 }}>Withdraw submission</button>
            ) : (
              <button onClick={onSubmit} disabled={!ready || busy} title={ready ? '' : 'Standing gate on + a CV'} style={{ cursor: busy ? 'wait' : ready ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 8, border: '1px solid #1C4E80', background: ready ? '#1C4E80' : '#A8B6C8', color: '#fff' }}>Submit for vetting</button>
            )}
          </div>
        </>
      )}
    </SectionCard>
  );
}

function LinkField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{label}</span>
      <input value={value} placeholder="https://" onChange={(e) => onChange(e.target.value)} style={{ width: '100%', fontFamily: 'var(--afx-body)', fontSize: 13, border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none' }} />
    </label>
  );
}
