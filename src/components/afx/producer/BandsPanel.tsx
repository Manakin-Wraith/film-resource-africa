'use client';

import type { ProducerProfile, ProducerBands } from '@/lib/afx/types';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import NdaNote from '@/components/afx/primitives/NdaNote';
import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

type BandKey = keyof ProducerBands;

const BAND_FIELDS: { key: BandKey; label: string }[] = [
  { key: 'budgetTier', label: 'Typical budget tier' },
  { key: 'amountRaised', label: 'Amount raised (lifetime)' },
  { key: 'recoupment', label: 'Recoupment outcomes' },
  { key: 'completionBond', label: 'Completion-bond history' },
];

interface Props {
  draft: ProducerProfile;
  onBand: (key: BandKey, value: string) => void;
  reverted: Record<string, boolean>; // key `band:${key}`
}

export default function BandsPanel({ draft, onBand, reverted }: Props) {
  return (
    <SectionCard title="Bands" hint="confidential · rating-linked">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
        {BAND_FIELDS.map(({ key, label }) => {
          const band = draft.bands[key];
          return (
            <div key={key} style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 10, padding: '14px 15px' }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 8 }}>{label}</div>
              <input
                value={band.value}
                onChange={(e) => onBand(key, e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--afx-body)', fontSize: 14, fontWeight: 600, border: '1px solid #E4E2DC', borderRadius: 7, padding: '7px 10px', background: '#fff', outline: 'none' }}
              />
              <div style={{ marginTop: 8 }}>
                <ProvenanceBadge provenance={band.provenance} reverted={!!reverted[`band:${key}`]} size="sm" />
              </div>
              <NdaNote />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
