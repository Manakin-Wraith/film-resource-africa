'use client';

import type { ProducerProfile } from '@/lib/afx/types';
import { computeAggregates } from '@/lib/afx/aggregates';
import NdaNote from '@/components/afx/primitives/NdaNote';
import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

export default function AggregatesPanel({ draft }: { draft: ProducerProfile }) {
  const a = computeAggregates(draft);
  const fields: { label: string; value: string }[] = [
    { label: 'Typical budget tier', value: a.budgetTier },
    { label: 'Capital raised (lifetime)', value: a.capitalRaised },
    { label: 'Recoupment record', value: a.recoupmentRecord },
    { label: 'Completion-bond history', value: a.bondHistory },
  ];
  return (
    <SectionCard title="Financial Aggregates" hint="computed from your track record — not separately entered">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        {fields.map((f) => (
          <div key={f.label} style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 10, padding: '13px 15px' }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 7 }}>{f.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{f.value}</div>
          </div>
        ))}
      </div>
      <NdaNote>These roll up from your case studies. Sign the NDA to back them with exact figures and raise confidence.</NdaNote>
    </SectionCard>
  );
}
