'use client';

import type { ProducerProfile, ProfileProject } from '@/lib/afx/types';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import RatingBandPill from '@/components/afx/primitives/RatingBand';
import RiskFlag from '@/components/afx/primitives/RiskFlag';
import { SectionCard, GhostButton } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onAddProject: () => void;
  onArchive: (id: string) => void;
}

export default function SlateProjects({ draft, onAddProject, onArchive }: Props) {
  const active = draft.projects.filter((p) => !p.archived);
  const archived = draft.projects.filter((p) => p.archived);
  const singleProject = active.length === 1;

  return (
    <SectionCard
      title="Slate / Projects"
      hint="the centre of gravity"
      action={<GhostButton onClick={onAddProject} tone="accent">+ Add project</GhostButton>}
    >
      {singleProject ? (
        <div style={{ marginBottom: 14 }}>
          <RiskFlag label="Single project sorts lower — add projects to diversify and climb the default sort." />
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {active.map((p) => (
          <ProjectCard key={p.id} project={p} onArchive={() => onArchive(p.id)} isLastActive={singleProject} />
        ))}
      </div>

      {archived.length > 0 ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 8 }}>Archived</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {archived.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px dashed #DAD7D0', borderRadius: 8, color: '#9A9CA3' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</span>
                <span style={{ fontSize: 11.5 }}>· archived</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

function ProjectCard({ project, onArchive, isLastActive }: { project: ProfileProject; onArchive: () => void; isLastActive: boolean }) {
  return (
    <div style={{ border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{project.title}</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>{project.format} · {project.stage}</div>
        </div>
        <RatingBandPill band={project.prsBand} size="sm" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, color: '#5E6066', background: '#F7F5F1', border: '1px solid #ECEAE4', padding: '3px 9px', borderRadius: 20 }}>{project.securedPctBand}</span>
        {project.riskFlag ? <RiskFlag label={project.riskFlag} /> : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2 }}>
        <ProvenanceBadge provenance={project.provenance} size="sm" />
        <GhostButton onClick={onArchive} tone={isLastActive ? 'danger' : 'neutral'}>Archive</GhostButton>
      </div>
    </div>
  );
}
