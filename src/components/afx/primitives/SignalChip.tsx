import type { RatingBand, SignalStyle } from '@/lib/afx/types';
import { bandLabel } from '@/lib/afx/format';
import { ACCENT, chipStyle, PIPS_ON } from './bands';

const mono = "var(--afx-mono)";

interface Props {
  band: RatingBand;
  score: number;
  benchmark: number;
  style: SignalStyle;
  entity: 'producers' | 'projects' | 'slates';
}

/** The Deal Signal cell — three switchable renderings (band / ring / bar). */
export default function SignalChip({ band, score, benchmark, style, entity }: Props) {
  const label = bandLabel(entity, band);
  const scoreStr = String(score);
  const benchStr = 'med ' + benchmark;

  if (style === 'band') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={chipStyle(band)}>{band}</div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
          <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ width: 13, height: 4, borderRadius: 2, background: i < PIPS_ON[band] ? '#1C1D21' : '#E2E0DA' }} />
            ))}
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: '#9A9CA3', marginTop: 5 }}>{scoreStr} · {benchStr}</div>
        </div>
      </div>
    );
  }

  if (style === 'ring') {
    const ringDeg = Math.round(score * 3.6);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div
          style={{
            width: 46, height: 46, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `conic-gradient(${ACCENT} ${ringDeg}deg,#EAE8E3 ${ringDeg}deg)`,
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, letterSpacing: '-0.5px' }}>{band}</div>
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 600 }}>{scoreStr}</div>
          <div style={{ fontSize: 11, color: '#9A9CA3' }}>{label}</div>
        </div>
      </div>
    );
  }

  // bar
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 7 }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{band}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#5E6066' }}>{label}</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3', marginLeft: 'auto' }}>{scoreStr}</span>
      </div>
      <div style={{ position: 'relative', height: 7, background: '#EFEDE8', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${score}%`, background: '#1C1D21', borderRadius: 4 }} />
      </div>
      <div style={{ position: 'relative', height: 0 }}>
        <div title="benchmark median" style={{ position: 'absolute', left: `${benchmark}%`, top: -9, width: 2, height: 9, background: '#9A9CA3' }} />
      </div>
      <div style={{ fontFamily: mono, fontSize: 9, color: '#B8BAB0', marginTop: 7 }}>{benchStr}</div>
    </div>
  );
}
