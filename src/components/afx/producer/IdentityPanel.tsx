'use client';

import type { ProducerProfile, ProducerType } from '@/lib/afx/types';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { producerTypeOf } from '@/lib/afx/constants';
import { AFRICAN_COUNTRIES } from '@/lib/afx/countries';
import { SectionCard, InlineEdit, InlineSelect } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onIdentity: (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location' | 'producerType' | 'country'>>) => void;
}

export default function IdentityPanel({ draft, onIdentity }: Props) {
  const type = producerTypeOf(draft);

  return (
    <SectionCard title="Operator Identity" hint="who you are">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['company', 'individual'] as const).map((t: ProducerType) => {
          const active = type === t;
          return (
            <button key={t} onClick={() => onIdentity({ producerType: t })}
              style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, padding: '7px 14px', borderRadius: 8,
                border: `1px solid ${active ? 'var(--afx-ink)' : '#E4E2DC'}`, background: active ? 'var(--afx-ink)' : '#fff', color: active ? '#fff' : '#5E6066' }}>
              {t === 'company' ? 'Company / entity' : 'Individual / freelance'}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        <InlineEdit label={type === 'individual' ? 'Producer name' : 'Producer / company'} value={draft.name} onChange={(v) => onIdentity({ name: v })} />
        {type === 'company' ? (
          <InlineEdit label="Legal entity" value={draft.company} onChange={(v) => onIdentity({ company: v })} />
        ) : (
          <div />
        )}
        <InlineSelect label="Country" value={draft.country ?? ''} onChange={(v) => onIdentity({ country: v })} options={AFRICAN_COUNTRIES} placeholder="Select country" />
        <InlineEdit label="City / base" value={draft.location ?? ''} onChange={(v) => onIdentity({ location: v })} />
        <div style={{ gridColumn: '1 / -1' }}>
          <InlineEdit label="Bio" value={draft.bio} onChange={(v) => onIdentity({ bio: v })} multiline />
        </div>
      </div>

      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 10 }}>Distribution &amp; finance relationships</div>
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
