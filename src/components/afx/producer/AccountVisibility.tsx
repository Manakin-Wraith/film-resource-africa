'use client';

import type { ProducerProfile } from '@/lib/afx/types';
import { deriveVisibility, VISIBILITY_META, producerTypeOf, operatorGateLabel } from '@/lib/afx/constants';
import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onToggleK2: () => void;
  onToggleK4: () => void;
}

export default function AccountVisibility({ draft, onToggleK2, onToggleK4 }: Props) {
  const visibility = deriveVisibility(draft);
  const vMeta = VISIBILITY_META[visibility];
  const k2 = operatorGateLabel(producerTypeOf(draft));

  return (
    <SectionCard title="Account & Visibility" hint="knockout gates">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Gate
          code="K2"
          title={k2.title}
          note={k2.note}
          on={draft.entityK2}
          onToggle={onToggleK2}
        />
        <Gate
          code="K4"
          title="Transparency / reporting consent"
          note="One tap. Required to become visible to funders."
          on={draft.consentK4}
          onToggle={onToggleK4}
        />
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 10, background: '#FCFBF9', border: '1px solid #EFEDE8' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: vMeta.tone }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{vMeta.label}</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginLeft: 'auto' }}>
          {visibility === 'live' ? 'appears in Deal Display' : visibility === 'one-away' ? 'add a project to go live' : 'private — not screenable'}
        </span>
      </div>
    </SectionCard>
  );
}

function Gate({ code, title, note, on, onToggle }: { code: string; title: string; note: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: '1px solid #F2F0EB', borderRadius: 10 }}>
      <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: on ? '#1C1D21' : '#9A9CA3', width: 26, flex: 'none' }}>{code}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: '#9A9CA3', marginTop: 2 }}>{note}</div>
      </div>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        style={{
          flex: 'none', width: 46, height: 26, borderRadius: 20, border: 'none', cursor: 'pointer', position: 'relative',
          background: on ? 'var(--afx-prov-verified)' : '#D2CFC8', transition: 'background 0.15s',
        }}
      >
        <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
}
