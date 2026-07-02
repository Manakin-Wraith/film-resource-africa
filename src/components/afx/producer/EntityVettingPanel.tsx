'use client';

import type { AfxDocument, EntityDocumentCategory, ProducerProfile, VettingSubmission } from '@/lib/afx/types';
import { isEntityVettingReady } from '@/lib/afx/documents';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
import { SectionCard } from './cockpitUi';
import AfxEntityDocumentUpload from './AfxEntityDocumentUpload';
import EntityVerifiedCard from './EntityVerifiedCard';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  submission?: VettingSubmission;   // latest entity submission (for badge)
  locked: boolean;                  // open entity submission exists
  ndaSigned: boolean;
  busy?: boolean;
  onAddDoc: (doc: AfxDocument) => void;
  onUpdateDoc: (id: string, patch: { category: EntityDocumentCategory }) => void;
  onRemoveDoc: (id: string) => void;
  onSubmit: () => void;
  onWithdraw: () => void;
}

export default function EntityVettingPanel({ draft, submission, locked, ndaSigned, busy, onAddDoc, onUpdateDoc, onRemoveDoc, onSubmit, onWithdraw }: Props) {
  const docs = draft.entityDocs ?? [];
  const ready = isEntityVettingReady({ entityK2: draft.entityK2, entityDocs: docs });
  const showBadge = submission && submission.status !== 'withdrawn';

  const verifiedAt = draft.entityVerifiedAt;

  return (
    <SectionCard title="Company / Entity Vetting" hint={verifiedAt ? 'verified · read-only' : 'producer + FRA only'}>
      {verifiedAt ? (
        <EntityVerifiedCard verifiedAt={verifiedAt} docs={docs} />
      ) : (
        <>
          {showBadge ? (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10,
              background: VETTING_STATUS_META[submission!.status].bg, border: `1px solid ${VETTING_STATUS_META[submission!.status].border}`,
              color: VETTING_STATUS_META[submission!.status].ink, fontSize: 12.5 }}>
              <strong style={{ fontWeight: 700 }}>{VETTING_STATUS_META[submission!.status].label}</strong>
              {locked ? ' — read-only while FRA reviews. Withdraw to edit.' : ''}
              {submission!.status === 'changes_requested' && submission!.reviewerNotes ? <div style={{ marginTop: 4 }}>{submission!.reviewerNotes}</div> : null}
            </div>
          ) : null}

          {!ndaSigned ? (
            <div style={{ fontSize: 12.5, color: '#9A9CA3', border: '1px dashed #DAD7D0', borderRadius: 8, padding: '12px 14px' }}>
              Sign the FRA NDA to attach confidential company documents (registration, director ID, tax registration).
            </div>
          ) : (
            <>
              {!draft.entityK2 ? (
                <div style={{ marginBottom: 10, fontFamily: mono, fontSize: 11, color: '#9A6B1E' }}>
                  Turn on the <strong>K2 — Legal entity</strong> gate (Account &amp; Visibility) to make the entity vetting-ready.
                </div>
              ) : null}
              <AfxEntityDocumentUpload docs={docs} locked={locked} onAdd={onAddDoc} onUpdate={onUpdateDoc} onRemove={onRemoveDoc} />
            </>
          )}

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            {locked ? (
              <button onClick={onWithdraw} disabled={busy} style={{ cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 8, border: '1px solid #9A6B1E', background: '#fff', color: '#9A6B1E', opacity: busy ? 0.6 : 1 }}>Withdraw entity submission</button>
            ) : (
              <button onClick={onSubmit} disabled={!ready || busy} title={ready ? '' : 'K2 on + all required company documents'}
                style={{ cursor: busy ? 'wait' : ready ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 8, border: '1px solid #1C4E80', background: ready ? '#1C4E80' : '#A8B6C8', color: '#fff' }}>
                Submit entity for vetting
              </button>
            )}
          </div>
        </>
      )}
    </SectionCard>
  );
}
