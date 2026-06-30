'use client';

import type { ProducerProfile } from '@/lib/afx/types';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { SectionCard, InlineEdit } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onIdentity: (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location'>>) => void;
}

export default function IdentityPanel({ draft, onIdentity }: Props) {
  return (
    <SectionCard title="Operator Identity" hint="who you are">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        <InlineEdit label="Producer / company" value={draft.name} onChange={(v) => onIdentity({ name: v })} />
        <InlineEdit label="Legal entity" value={draft.company} onChange={(v) => onIdentity({ company: v })} />
        <InlineEdit label="Base location" value={draft.location ?? ''} onChange={(v) => onIdentity({ location: v })} />
        <div />
        <div style={{ gridColumn: '1 / -1' }}>
          <InlineEdit label="Bio" value={draft.bio} onChange={(v) => onIdentity({ bio: v })} multiline />
        </div>
      </div>

      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 10 }}>Distribution & finance relationships</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {draft.relationships.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #F2F0EB', borderRadius: 9 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, flex: 'none', minWidth: 130 }}>{r.name}</span>
            <span style={{ fontSize: 12.5, color: '#5E6066', flex: 1 }}>{r.role}</span>
            <ProvenanceBadge provenance={r.provenance} size="sm" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
