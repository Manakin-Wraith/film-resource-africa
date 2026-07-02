'use client';

import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

/** Company producers whose individual vetting is not yet verified see this in
 *  place of the working entity panel. Entity vetting is hard-gated behind the
 *  individual marker (also enforced server-side) — no upload/submit controls
 *  until FRA verifies the individual. Sibling to EntityVerifiedCard. */
export default function EntityVettingLockedCard() {
  return (
    <SectionCard title="Company / Entity Vetting" hint="locked">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#F6F5F2', border: '1px solid #E4E2DC' }}>
        <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: '#9A9CA3', letterSpacing: 0.4 }}>LOCKED</span>
        <span style={{ fontSize: 12.5, color: '#5E6066' }}>Complete individual vetting first to unlock company vetting.</span>
      </div>
    </SectionCard>
  );
}
