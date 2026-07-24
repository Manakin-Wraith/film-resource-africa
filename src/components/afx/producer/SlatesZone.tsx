'use client';

import type { ProducerProfile, Slate } from '@/lib/afx/types';
import { SectionCard, GhostButton } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onAddSlate: () => void;
  onOpenSlate: (id: string) => void;
}

export default function SlatesZone({ draft, onAddSlate, onOpenSlate }: Props) {
  const slates = draft.slates ?? [];
  return (
    <SectionCard title="Portfolios" hint="group live projects into a diversified pitch" action={<GhostButton onClick={onAddSlate} tone="accent">+ New slate</GhostButton>}>
      {slates.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9A9CA3' }}>
          Group live projects into a portfolio to pitch funders diversification, not a single bet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {slates.map((s) => <SlateCard key={s.id} slate={s} onOpen={() => onOpenSlate(s.id)} />)}
        </div>
      )}
    </SectionCard>
  );
}

function SlateCard({ slate, onOpen }: { slate: Slate; onOpen: () => void }) {
  return (
    <div style={{ border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{slate.name || 'Untitled portfolio'}</div>
      <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3' }}>{[slate.genreStrategy, `${slate.projectIds.length} film${slate.projectIds.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</div>
      <span style={{ alignSelf: 'flex-start', fontFamily: mono, fontSize: 10, fontWeight: 700, color: '#1C1D21', background: '#F6F5F2', border: '1px solid #EAE8E3', borderRadius: 6, padding: '2px 7px' }}>{slate.stage}</span>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <GhostButton onClick={onOpen} tone="accent">Edit</GhostButton>
      </div>
    </div>
  );
}
