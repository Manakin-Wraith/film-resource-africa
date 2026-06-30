'use client';

import type { ProducerProfile, FilmographyRow, Relationship } from '@/lib/afx/types';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { SectionCard, InlineEdit } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onIdentity: (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio'>>) => void;
  onFilmographyField: (rowId: string, field: 'budgetBand' | 'recoupmentBand', value: string) => void;
  reverted: Record<string, boolean>; // key `${rowId}:${field}`
}

export default function OperatorProfile({ draft, onIdentity, onFilmographyField, reverted }: Props) {
  return (
    <SectionCard title="Operator Profile" hint="identity · filmography · relationships">
      {/* identity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        <InlineEdit label="Producer / company" value={draft.name} onChange={(v) => onIdentity({ name: v })} />
        <InlineEdit label="Legal entity" value={draft.company} onChange={(v) => onIdentity({ company: v })} />
        <div style={{ gridColumn: '1 / -1' }}>
          <InlineEdit label="Bio" value={draft.bio} onChange={(v) => onIdentity({ bio: v })} multiline />
        </div>
      </div>

      {/* filmography */}
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 10 }}>Filmography</div>
      <div style={{ border: '1px solid #EFEDE8', borderRadius: 10, overflow: 'hidden', marginBottom: 22 }}>
        {draft.filmography.map((f) => (
          <FilmographyRowView
            key={f.id}
            row={f}
            onField={(field, v) => onFilmographyField(f.id, field, v)}
            revertedBudget={!!reverted[`${f.id}:budgetBand`]}
            revertedRecoup={!!reverted[`${f.id}:recoupmentBand`]}
          />
        ))}
      </div>

      {/* relationships */}
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 10 }}>Distribution & finance relationships</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {draft.relationships.map((r) => (
          <RelationshipRow key={r.id} rel={r} />
        ))}
      </div>
    </SectionCard>
  );
}

function FilmographyRowView({
  row,
  onField,
  revertedBudget,
  revertedRecoup,
}: {
  row: FilmographyRow;
  onField: (field: 'budgetBand' | 'recoupmentBand', value: string) => void;
  revertedBudget: boolean;
  revertedRecoup: boolean;
}) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F5F3EE', display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 14, alignItems: 'start' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{row.title}</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>{row.year} · {row.format} · {row.role}</div>
      </div>
      <BandEditor
        label="Budget band"
        value={row.budgetBand.value}
        provenance={row.budgetBand.provenance}
        reverted={revertedBudget}
        onChange={(v) => onField('budgetBand', v)}
      />
      <BandEditor
        label="Recoupment"
        value={row.recoupmentBand.value}
        provenance={row.recoupmentBand.provenance}
        reverted={revertedRecoup}
        onChange={(v) => onField('recoupmentBand', v)}
      />
    </div>
  );
}

function BandEditor({
  label,
  value,
  provenance,
  reverted,
  onChange,
}: {
  label: string;
  value: string;
  provenance: 'self' | 'confirmed' | 'verified';
  reverted: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 5 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', fontFamily: 'var(--afx-body)', fontSize: 12.5, border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 9px', background: '#fff', outline: 'none' }}
      />
      <div style={{ marginTop: 6 }}>
        <ProvenanceBadge provenance={provenance} reverted={reverted} size="sm" />
      </div>
    </div>
  );
}

function RelationshipRow({ rel }: { rel: Relationship }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #F2F0EB', borderRadius: 9 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, flex: 'none', minWidth: 130 }}>{rel.name}</span>
      <span style={{ fontSize: 12.5, color: '#5E6066', flex: 1 }}>{rel.role}</span>
      <ProvenanceBadge provenance={rel.provenance} size="sm" />
    </div>
  );
}
