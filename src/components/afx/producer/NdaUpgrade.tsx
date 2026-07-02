'use client';

import { useState } from 'react';
import { SectionCard } from './cockpitUi';
import { renderNda } from '@/lib/afx/nda';
import type { NdaSignature } from '@/lib/afx/types';

const mono = 'var(--afx-mono)';

interface Props {
  signed: boolean;
  signature: NdaSignature | null;
  producerName: string;
  company?: string;
  busy: boolean;
  onSign: (name: string) => void;
  onWithdraw: () => void;
}

export default function NdaUpgrade({ signed, signature, producerName, company, busy, onSign, onWithdraw }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const docText = renderNda({ producerName, company, date: today });
  const canSign = name.trim().length > 0 && agreed && !busy;

  const docBox = (
    <pre style={{ maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--afx-body)', fontSize: 12.5, lineHeight: 1.55, color: '#3A3B40', background: '#FAF9F6', border: '1px solid #EDEBE4', borderRadius: 10, padding: '14px 16px', margin: 0 }}>{docText}</pre>
  );

  if (signed) {
    return (
      <SectionCard title="Confidentiality (NDA)" hint="signed · read-only">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#F2FBF4', border: '1px solid #CDEAD5' }}>
          <span aria-hidden style={{ fontSize: 15, color: '#2E7D46' }}>✓</span>
          <span style={{ fontSize: 13, color: '#2E7D46' }}>
            {signature
              ? <>Signed by <strong>{signature.name}</strong> on {signature.signedAt.slice(0, 10)}</>
              : <>NDA on file <span style={{ color: '#5E9A6E' }}>(legacy record — withdraw and re-sign to add an audit signature)</span></>}
          </span>
          {signature ? <span style={{ fontFamily: mono, fontSize: 10, color: '#5E9A6E', marginLeft: 'auto' }}>NDA v{signature.version}</span> : null}
        </div>
        <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-prov-verified)', marginTop: 8 }}>
          ✓ NDA signed — exact-figure entry unlocked (USD or ZAR) on every budget, capital-stack and funding field
        </div>
        {expanded ? <div style={{ marginTop: 12 }}>{docBox}</div> : null}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={() => setExpanded((v) => !v)} style={ghost}>{expanded ? 'Hide agreement' : 'View agreement'}</button>
          <button onClick={onWithdraw} disabled={busy} style={{ ...ghost, marginLeft: 'auto', color: '#B23B3B', borderColor: '#E4C4C4' }}>Withdraw</button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Confidentiality (NDA)" hint="optional upgrade">
      <div style={{ fontSize: 13.5, color: '#5E6066', lineHeight: 1.5 }}>
        Sign the FRA↔producer NDA to add <strong>exact figures</strong> to your bands. Exact numbers stay private —
        funders still see only bands — but they lift your confidence from self-reported to confirmed and raise your rating.
      </div>
      {!expanded ? (
        <button onClick={() => setExpanded(true)} disabled={busy} style={{ ...primary, marginTop: 12 }}>Review &amp; sign NDA</button>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {docBox}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full legal name"
            style={{ fontFamily: 'var(--afx-body)', fontSize: 13.5, padding: '9px 12px', borderRadius: 9, border: '1px solid #E4E2DC' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#5E6066' }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            I have read and agree to this agreement.
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onSign(name.trim())} disabled={!canSign} style={{ ...primary, opacity: canSign ? 1 : 0.5, cursor: canSign ? 'pointer' : 'not-allowed' }}>Sign agreement</button>
            <button onClick={() => { setExpanded(false); setAgreed(false); }} disabled={busy} style={ghost}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ fontFamily: mono, fontSize: 10.5, color: '#9A9CA3', marginTop: 8 }}>Not signed — bands only</div>
    </SectionCard>
  );
}

const primary: React.CSSProperties = { cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9, border: '1px solid #1C1D21', background: '#1C1D21', color: '#fff' };
const ghost: React.CSSProperties = { cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' };
