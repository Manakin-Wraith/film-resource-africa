'use client';

import type { ProducerProfile, Project, Provenance, ExactMoney, AfxCurrency } from '@/lib/afx/types';
import { caseStudies } from '@/lib/afx/aggregates';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { SectionCard } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onOutcomeField: (projectId: string, field: 'recoupment' | 'bondUsed' | 'budget', value: string) => void;
  /** Keyed `${projectId}:${field}` → the prior provenance an edit dropped from. */
  reverted: Record<string, Provenance>;
  onExact: (projectId: string, field: 'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap', value: ExactMoney | undefined) => void;
  ndaSigned: boolean;
  defaultCurrency: AfxCurrency;
}

export default function TrackRecordZone({ draft, onOutcomeField, reverted, onExact, ndaSigned, defaultCurrency }: Props) {
  void onExact; void ndaSigned; void defaultCurrency;
  const studies = caseStudies(draft);
  return (
    <SectionCard title="Track Record" hint="case studies — your proof, judged for experience">
      {studies.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
          {studies.map((s) => (
            <CaseStudyCard key={s.id} study={s} onField={(f, v) => onOutcomeField(s.id, f, v)} reverted={reverted} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function Empty() {
  return (
    <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed #DAD7D0', borderRadius: 10 }}>
      <div style={{ fontSize: 13.5, color: '#5E6066' }}>Add your past projects — these are the case studies funders use to judge your experience.</div>
    </div>
  );
}

function CaseStudyCard({ study, onField, reverted }: { study: Project; onField: (f: 'recoupment' | 'bondUsed' | 'budget', v: string) => void; reverted: Record<string, Provenance> }) {
  const o = study.outcomes;
  return (
    <div style={{ border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{study.title}</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>{study.year} · {study.format} · {study.role}</div>
      </div>

      <OutcomeRow label="Budget" value={study.budgetBand.value} provenance={study.budgetBand.provenance} revertedFrom={reverted[`${study.id}:budget`]} onChange={(v) => onField('budget', v)} />
      {o ? (
        <>
          <OutcomeRow label="Recoupment" value={o.recoupment.value} provenance={o.recoupment.provenance} revertedFrom={reverted[`${study.id}:recoupment`]} onChange={(v) => onField('recoupment', v)} />
          <OutcomeRow label="Completion bond" value={o.bondUsed.value} provenance={o.bondUsed.provenance} revertedFrom={reverted[`${study.id}:bondUsed`]} onChange={(v) => onField('bondUsed', v)} />
          <div>
            <Tag label="Distribution" />
            <div style={{ fontSize: 12.5, color: '#5E6066', marginTop: 4 }}>{o.distribution.map((d) => d.name).join(', ') || '—'}</div>
          </div>
          {o.festivalsAwards.length > 0 ? (
            <div>
              <Tag label="Festivals / awards" />
              <div style={{ fontSize: 12.5, color: '#5E6066', marginTop: 4 }}>{o.festivalsAwards.join(' · ')}</div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>{label}</span>;
}

function OutcomeRow({ label, value, provenance, revertedFrom, onChange }: { label: string; value: string; provenance: Provenance; revertedFrom?: Provenance; onChange: (v: string) => void }) {
  return (
    <div>
      <Tag label={label} />
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', fontFamily: 'var(--afx-body)', fontSize: 12.5, border: '1px solid #E4E2DC', borderRadius: 7, padding: '6px 9px', background: '#fff', outline: 'none', marginTop: 4 }} />
      <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={provenance} revertedFrom={revertedFrom} size="sm" /></div>
    </div>
  );
}
