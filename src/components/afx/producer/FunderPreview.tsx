'use client';

import type { FunderView } from '@/lib/afx/funderView';
import { afxSeed } from '@/lib/afx/seed';
import { fmtUSD } from '@/lib/afx/format';
import { deriveVisibility, VISIBILITY_META, RATING_BAND_LABEL, meetsCorePackaging } from '@/lib/afx/constants';
import { liveProjects, computeAggregates } from '@/lib/afx/aggregates';
import { chipStyle } from '@/components/afx/primitives/bands';
import SignalChip from '@/components/afx/primitives/SignalChip';
import ConfidenceMarker from '@/components/afx/primitives/ConfidenceMarker';
import RiskFlag from '@/components/afx/primitives/RiskFlag';

const mono = 'var(--afx-mono)';

/**
 * Read-only render of the producer exactly as a funder sees it on the
 * screening floor: bands (never raw figures), provenance badges, risk flags.
 * Reads from the FunderView projection passed by the cockpit, so it reflects live edits.
 */
export default function FunderPreview({ view }: { view: FunderView }) {
  // `view` is a FunderView: every project is Omit<Project,'exact'>, so the
  // exact-figure invariant is enforced by the compiler here — `.exact` cannot
  // be referenced, and the projection deleted it at runtime too.
  const visibility = deriveVisibility(view);
  const vMeta = VISIBILITY_META[visibility];
  const live = liveProjects(view).filter(meetsCorePackaging);
  const agg = computeAggregates(view);
  const marketEntity = afxSeed.producers.find((e) => e.id === view.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--afx-accent-soft)', border: '1px solid #D6D8F5', borderRadius: 10 }}>
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-accent)' }}>Funder preview</span>
        <span style={{ fontSize: 12.5, color: '#5E6066' }}>This is exactly what funders see — figures appear as bands, every claim shows its provenance.</span>
      </div>

      {/* producer header card */}
      <div style={{ background: 'var(--afx-surface)', border: '1px solid #EAE8E3', borderRadius: 14, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={chipStyle(view.ratingBand, true)}>{view.ratingBand}</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>{view.name}</div>
            <div style={{ fontFamily: mono, fontSize: 11.5, color: '#9A9CA3', marginTop: 3 }}>{view.ratingBand} · {RATING_BAND_LABEL[view.ratingBand]} · {view.careerStage}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: vMeta.tone }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#5E6066' }}>{vMeta.label}</span>
          </div>
        </div>

        {visibility !== 'live' ? (
          <div style={{ marginTop: 14 }}>
            <RiskFlag label={visibility === 'one-away' ? 'Single-project slate — higher risk, sorts lower' : 'Not yet screenable — hidden from funders'} />
          </div>
        ) : null}

        {/* bands as funders see them */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginTop: 16 }}>
          {[
            ['Budget tier', agg.budgetTier],
            ['Raised (lifetime)', agg.capitalRaised],
            ['Recoupment', agg.recoupmentRecord],
            ['Bond history', agg.bondHistory],
          ].map(([label, value]) => (
            <div key={label} style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 9, padding: '11px 13px' }}>
              <div style={{ fontFamily: 'var(--afx-mono)', fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* slate as deal rows */}
      <div style={{ background: 'var(--afx-surface)', border: '1px solid #EAE8E3', borderRadius: 14, padding: '18px 22px' }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 12 }}>Slate — as screened</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {live.map((p) => {
            const entity = afxSeed.projects.find((e) => e.id === (p.dealRef ?? p.id));
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 14, alignItems: 'center', padding: '14px 16px', border: '1px solid #F2F0EB', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>{p.format} · {p.ask?.stage ?? ''}</div>
                </div>
                {entity ? (
                  <SignalChip band={entity.ratingBand} score={entity.score} benchmark={entity.benchmark} style="bar" entity="projects" />
                ) : (
                  <span style={{ fontSize: 12, color: '#9A9CA3' }}>—</span>
                )}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 600 }}>{entity ? fmtUSD(entity.budgetUSD) : '—'}</div>
                  <div style={{ fontSize: 11, color: '#9A9CA3', marginTop: 2 }}>{p.ask?.fundingSecuredBand ?? '—'}</div>
                </div>
                <div>
                  {entity && entity.rebatePct != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontFamily: mono, fontSize: 15, fontWeight: 600 }}>{entity.rebatePct}%</span>
                      <ConfidenceMarker confidence={entity.rebateConf} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#A7A99F', fontStyle: 'italic' }}>— not provided</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {marketEntity ? (
        <div style={{ fontSize: 11.5, color: '#9A9CA3', textAlign: 'center' }}>
          On the screening floor this producer ranks with Deal Signal {marketEntity.score} (median {marketEntity.benchmark}).
        </div>
      ) : null}
    </div>
  );
}
