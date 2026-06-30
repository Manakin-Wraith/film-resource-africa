'use client';

import type { ProducerProfile, Project } from '@/lib/afx/types';
import { caseStudies } from '@/lib/afx/aggregates';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { SectionCard, GhostButton } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export default function TrackRecordZone({ draft, onAdd, onEdit }: Props) {
  const studies = caseStudies(draft);
  return (
    <SectionCard title="Track Record" hint="case studies — your proof, judged for experience"
      action={<GhostButton onClick={onAdd} tone="accent">+ Add case study</GhostButton>}>
      {studies.length === 0 ? (
        <Empty onAdd={onAdd} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
          {studies.map((s) => <SummaryCard key={s.id} study={s} onEdit={() => onEdit(s.id)} />)}
        </div>
      )}
    </SectionCard>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed #DAD7D0', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 13.5, color: '#5E6066' }}>Add your past projects — these are the case studies funders use to judge your experience.</div>
      <GhostButton onClick={onAdd} tone="accent">+ Add your first case study</GhostButton>
    </div>
  );
}

function SummaryCard({ study, onEdit }: { study: Project; onEdit: () => void }) {
  const o = study.outcomes;
  const distCount = o?.distribution.length ?? 0;
  const festCount = o?.festivalsAwards.filter((f) => f.trim() !== '').length ?? 0;
  const evCount = study.evidence?.length ?? 0;
  return (
    <button onClick={onEdit}
      style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{study.title || 'Untitled case study'}</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>
          {[study.year, study.format, study.role].filter(Boolean).join(' · ')}
        </div>
      </div>

      <Row label="Budget" value={study.budgetBand.value || '—'} badge={<ProvenanceBadge provenance={study.budgetBand.provenance} size="sm" />} />
      {o ? <Row label="Recoupment" value={o.recoupment.value || '—'} badge={<ProvenanceBadge provenance={o.recoupment.provenance} size="sm" />} /> : null}
      {o ? <Row label="Bond" value={o.bondUsed.value || '—'} /> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
        {distCount > 0 ? <Chip>{distCount} distribution</Chip> : null}
        {festCount > 0 ? <Chip>{festCount} festival{festCount > 1 ? 's' : ''}</Chip> : null}
        {evCount > 0 ? <Chip>{evCount} link{evCount > 1 ? 's' : ''}</Chip> : null}
      </div>

      <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-accent)', marginTop: 2 }}>Edit →</span>
    </button>
  );
}

function Row({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div>
      <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
        <span style={{ fontSize: 12.5, color: '#5E6066' }}>{value}</span>
        {badge}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.04em', color: '#5E6066', background: '#F2F0EB', border: '1px solid #EAE8E3', borderRadius: 999, padding: '2px 8px' }}>{children}</span>;
}
