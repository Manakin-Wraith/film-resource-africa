'use client';

import type { ProducerProfile, Project, ExactMoney, AfxCurrency } from '@/lib/afx/types';
import { liveProjects } from '@/lib/afx/aggregates';
import { meetsCorePackaging } from '@/lib/afx/constants';
import { afxSeed } from '@/lib/afx/seed';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import ConfidenceMarker from '@/components/afx/primitives/ConfidenceMarker';
import RiskFlag from '@/components/afx/primitives/RiskFlag';
import { SectionCard, GhostButton } from './cockpitUi';
import ExactFigureInput from '@/components/afx/primitives/ExactFigureInput';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onAddProject: () => void;
  onArchive: (id: string) => void;
  onExact: (projectId: string, field: 'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap', value: ExactMoney | undefined) => void;
  ndaSigned: boolean;
  defaultCurrency: AfxCurrency;
}

export default function LiveSlateZone({ draft, onAddProject, onArchive, onExact, ndaSigned, defaultCurrency }: Props) {
  const live = liveProjects(draft);
  const screenable = live.filter(meetsCorePackaging);
  return (
    <SectionCard title="Live Slate" hint="raising now — screened by funders" action={<GhostButton onClick={onAddProject} tone="accent">+ Add live project</GhostButton>}>
      {live.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed #DAD7D0', borderRadius: 10 }}>
          <div style={{ fontSize: 13.5, color: '#5E6066' }}>You're rated on your track record. Add a live project to start raising — you're 1 project from going live.</div>
        </div>
      ) : (
        <>
          {screenable.length === 1 ? (
            <div style={{ marginBottom: 14 }}><RiskFlag label="Single screenable project sorts lower — add another to diversify." /></div>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {live.map((p) => (
              <LiveProjectCard key={p.id} project={p} onArchive={() => onArchive(p.id)}
                lastScreenable={screenable.length <= 1 && meetsCorePackaging(p)}
                onExact={(field, v) => onExact(p.id, field, v)} ndaSigned={ndaSigned} defaultCurrency={defaultCurrency} />
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}

type LiveExactField = 'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap';
function LiveProjectCard({ project, onArchive, lastScreenable, onExact, ndaSigned, defaultCurrency }: { project: Project; onArchive: () => void; lastScreenable: boolean; onExact: (field: LiveExactField, v: ExactMoney | undefined) => void; ndaSigned: boolean; defaultCurrency: AfxCurrency }) {
  const ask = project.ask;
  const deal = project.dealRef ? afxSeed.projects.find((d) => d.id === project.dealRef) : undefined;
  const screenable = meetsCorePackaging(project);
  return (
    <div style={{ border: '1px solid #EAE8E3', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{project.title}</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>{project.format}{ask ? ` · ${ask.stage}` : ''}</div>
        </div>
        {!screenable ? <RiskFlag label="Not screenable yet" /> : null}
      </div>

      {ask ? (
        <>
          <div style={{ fontSize: 12.5, color: '#5E6066', lineHeight: 1.4 }}>{ask.logline}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: '#5E6066', background: '#F7F5F1', border: '1px solid #ECEAE4', padding: '3px 9px', borderRadius: 20 }}>{ask.fundingSecuredBand}</span>
            <span style={{ fontSize: 11.5, color: '#5E6066', background: '#F7F5F1', border: '1px solid #ECEAE4', padding: '3px 9px', borderRadius: 20 }}>{ask.commercialPath}</span>
          </div>
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Packaging</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5 }}>
              {ask.packaging.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 70, flex: 'none', color: '#9A9CA3' }}>{a.role}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontSize: 10.5, color: '#5E6066' }}>{({ signed: 'Signed', 'soft-hold': 'Soft-hold', wishlist: 'Wishlist' } as const)[a.status]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* AFX-overlaid incentive (read-only) */}
      {deal && deal.rebatePct != null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--afx-accent-soft)', border: '1px solid #D6D8F5', borderRadius: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-accent)' }}>AFX incentive</span>
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{deal.rebatePct}%</span>
          <ConfidenceMarker confidence={deal.rebateConf} showLabel />
        </div>
      ) : null}

      {ndaSigned ? (
        <div style={{ borderTop: '1px dashed #ECEAE4', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-accent)' }}>Exact figures (NDA)</span>
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Budget</span>
            <ExactFigureInput value={project.exact?.budget} onCommit={(v) => onExact('budget', v)} gated={ndaSigned} label="budget" defaultCurrency={defaultCurrency}
              confirmHint={project.budgetBand.provenance === 'confirmed' ? '→ confirmed' : undefined} />
          </div>
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Funding secured</span>
            <ExactFigureInput value={project.exact?.fundingSecured} onCommit={(v) => onExact('fundingSecured', v)} gated={ndaSigned} label="funding" defaultCurrency={defaultCurrency} />
          </div>
          <div>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>Capital stack</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 14px', marginTop: 2 }}>
              {(['equity', 'soft', 'debt', 'gap'] as const).map((leg) => (
                <div key={leg}>
                  <span style={{ fontSize: 11, color: '#9A9CA3', textTransform: 'capitalize' }}>{leg}</span>
                  <ExactFigureInput value={project.exact?.capitalStack?.[leg]} onCommit={(v) => onExact(leg, v)} gated={ndaSigned} label={leg} defaultCurrency={defaultCurrency} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2 }}>
        <ProvenanceBadge provenance={project.budgetBand.provenance} size="sm" />
        <GhostButton onClick={onArchive} tone={lastScreenable ? 'danger' : 'neutral'}>Archive</GhostButton>
      </div>
    </div>
  );
}
