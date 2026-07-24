'use client';

import type { ProducerProfile } from '@/lib/afx/types';
import { deriveVisibility, VISIBILITY_META, nextBestActions, deriveVettingStatus, VETTING_STATUS_META } from '@/lib/afx/constants';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  previewMode: 'data' | 'funder';
  onSetPreview: (m: 'data' | 'funder') => void;
}

export default function StatusHeader({ draft, previewMode, onSetPreview }: Props) {
  const visibility = deriveVisibility(draft);
  const vMeta = VISIBILITY_META[visibility];
  const vettingStatus = deriveVettingStatus(draft);
  const vsMeta = VETTING_STATUS_META[vettingStatus];
  const actions = nextBestActions(draft);

  return (
    <div
      style={{
        position: 'sticky', top: 58, zIndex: 20,
        background: 'var(--afx-surface)', border: '1px solid #EAE8E3', borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, flexWrap: 'wrap' }}>
        {/* vetting status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: vsMeta.tone, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
            {vettingStatus === 'fully_vetted' ? '✓' : vettingStatus === 'individual_verified' ? '½' : '—'}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 4 }}>Vetting status</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>{vsMeta.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: vMeta.tone }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#5E6066' }}>{vMeta.label}</span>
            </div>
          </div>
        </div>

        <div style={{ width: 1, alignSelf: 'stretch', background: '#EAE8E3' }} />

        {/* next-best actions */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 8 }}>Next steps to get vetted</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {actions.map((a, i) => (
              <li key={i} style={{ fontSize: 12.5, color: '#5E6066', lineHeight: 1.4 }}>{a}</li>
            ))}
          </ol>
        </div>

        {/* My Data ⇄ Funder Preview toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>View as</span>
          <div style={{ display: 'flex', background: '#F1EFEA', border: '1px solid #EAE8E3', borderRadius: 9, padding: 3, gap: 2 }}>
            {(['data', 'funder'] as const).map((m) => {
              const active = previewMode === m;
              return (
                <button
                  key={m}
                  onClick={() => onSetPreview(m)}
                  style={{
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12, fontWeight: 600,
                    padding: '6px 13px', borderRadius: 7,
                    background: active ? '#fff' : 'transparent', color: active ? '#1C1D21' : '#7C7E84',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.12s',
                  }}
                >
                  {m === 'data' ? 'My Data' : 'Funder Preview'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
