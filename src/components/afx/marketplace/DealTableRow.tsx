'use client';

import type { DealEntity, SignalStyle, EntityKind } from '@/lib/afx/types';
import { fmtUSD } from '@/lib/afx/format';
import { ACCENT } from '@/components/afx/primitives/bands';
import SignalChip from '@/components/afx/primitives/SignalChip';
import RatingBandPill from '@/components/afx/primitives/RatingBand';
import ConfidenceMarker from '@/components/afx/primitives/ConfidenceMarker';
import { ROW_GRID } from './grid';

const mono = 'var(--afx-mono)';

interface Props {
  d: DealEntity;
  entity: EntityKind;
  signalStyle: SignalStyle;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}

export default function DealTableRow({ d, entity, signalStyle, selected, onToggleSelect, onOpen }: Props) {
  const tags = d.tags.slice(0, 3);
  const moreTags = d.tags.length - 3;

  return (
    <div
      className="afx-row"
      style={{ display: 'grid', gridTemplateColumns: ROW_GRID, alignItems: 'center', padding: '20px 22px', borderBottom: '1px solid #F2F0EB', cursor: 'pointer', transition: 'background 0.12s' }}
      onClick={onOpen}
    >
      {/* checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}
      >
        <div
          style={{
            width: 18, height: 18, borderRadius: 5,
            border: selected ? `1px solid ${ACCENT}` : '1.5px solid #D2CFC8',
            background: selected ? ACCENT : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 700, transition: 'all 0.12s',
          }}
        >
          {selected ? '✓' : ''}
        </div>
      </div>

      {/* name + format + tags */}
      <div style={{ paddingRight: 18, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{d.name}</span>
          <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5E6066', background: '#F1EFEA', border: '1px solid #EAE8E3', padding: '2px 6px', borderRadius: 5 }}>{d.formatLabel}</span>
        </div>
        <div style={{ fontSize: 12, color: '#9A9CA3', marginBottom: 8, fontFamily: mono }}>{d.sub} · {d.commercialPath}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {tags.map((t) => (
            <span key={t.label} title={t.why} style={{ fontSize: 11, color: '#5E6066', background: '#F7F5F1', border: '1px solid #ECEAE4', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{t.label}</span>
          ))}
          {moreTags > 0 ? <span style={{ fontSize: 11, color: '#9A9CA3', padding: '3px 4px' }}>+{moreTags} more</span> : null}
        </div>
      </div>

      {/* deal signal */}
      <div style={{ paddingRight: 14 }}>
        <SignalChip band={d.band} score={d.score} benchmark={d.benchmark} style={signalStyle} entity={entity} />
      </div>

      {/* budget */}
      <div style={{ paddingRight: 12 }}>
        <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>{fmtUSD(d.budgetUSD)}</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginTop: 3 }}>{d.budgetLocal}</div>
      </div>

      {/* funding + gap */}
      <div style={{ paddingRight: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1, height: 6, background: '#EFEDE8', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${d.fundingPct}%`, background: '#52555E', borderRadius: 4 }} />
          </div>
          <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: '#5E6066' }}>{d.fundingPct}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 3, height: 13, background: ACCENT, borderRadius: 2 }} />
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A9CA3' }}>Gap</span>
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: ACCENT }}>{fmtUSD(d.gapUSD)}</span>
        </div>
      </div>

      {/* rebate */}
      <div style={{ paddingRight: 14 }}>
        {d.rebatePct == null ? (
          <div style={{ border: '1px dashed #CFCCC4', borderRadius: 7, padding: '7px 9px', background: 'repeating-linear-gradient(135deg,#FBFAF7,#FBFAF7 5px,#F4F2ED 5px,#F4F2ED 10px)' }}>
            <div style={{ fontSize: 12, color: '#A7A99F', fontStyle: 'italic' }}>— not provided</div>
            <div style={{ fontFamily: mono, fontSize: 9, color: '#BDBFB5', marginTop: 2 }}>no incentive on file</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 17, fontWeight: 600, letterSpacing: '-0.5px' }}>{d.rebatePct}%</span>
              <span style={{ fontSize: 10, color: '#9A9CA3' }}>blended</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <ConfidenceMarker confidence={d.rebateConf} showLabel />
            </div>
            <div style={{ fontFamily: mono, fontSize: 9.5, color: '#9A9CA3', marginTop: 4 }}>{d.payoutShort}</div>
          </div>
        )}
      </div>

      {/* rating */}
      <div style={{ paddingRight: 10 }}>
        <RatingBandPill band={d.ratingBand} careerStage={d.careerStage} />
      </div>

      {/* stage + jurisdiction + freshness */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{d.stage}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 7 }}>
          {d.juris.map((c) => (
            <span key={c} style={{ fontFamily: mono, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.05em', color: '#5E6066', background: '#F1EFEA', border: '1px solid #E4E2DC', padding: '2px 5px', borderRadius: 4 }}>{c}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', flex: 'none', background: d.stale ? '#fff' : '#1C1D21', border: d.stale ? '1px solid #B0ADA5' : '1px solid #1C1D21' }} />
          <span style={{ fontFamily: mono, fontSize: 10.5, color: d.stale ? '#A7A99F' : '#9A9CA3', fontStyle: d.stale ? 'italic' : 'normal' }}>{d.asOf}</span>
          <span className="afx-open" style={{ marginLeft: 6, opacity: 0, transform: 'translateX(-3px)', transition: 'all 0.15s', color: ACCENT, fontSize: 14, fontWeight: 700 }}>›</span>
        </div>
      </div>
    </div>
  );
}
