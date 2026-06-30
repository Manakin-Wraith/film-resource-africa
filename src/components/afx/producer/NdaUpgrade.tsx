'use client';

import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

export default function NdaUpgrade({ signed, onToggle }: { signed: boolean; onToggle: () => void }) {
  return (
    <SectionCard title="Confidentiality (NDA)" hint="optional upgrade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 13.5, color: '#5E6066', lineHeight: 1.5 }}>
            Sign the FRA↔producer NDA to add <strong>exact figures</strong> to your bands. Exact numbers stay private —
            funders still see only bands — but they lift your confidence from self-reported to confirmed and raise your rating.
          </div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: signed ? 'var(--afx-prov-verified)' : '#9A9CA3', marginTop: 8 }}>
            {signed ? '✓ NDA signed — exact-figure entry unlocked (USD or ZAR) on every budget, capital-stack and funding field' : 'Not signed — bands only'}
          </div>
        </div>
        <button
          onClick={onToggle}
          style={{
            cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9,
            border: `1px solid ${signed ? '#E4E2DC' : '#1C1D21'}`, background: signed ? '#fff' : '#1C1D21', color: signed ? '#5E6066' : '#fff',
          }}
        >
          {signed ? 'Withdraw NDA' : 'Sign NDA'}
        </button>
      </div>
    </SectionCard>
  );
}
