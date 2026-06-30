import type { StackSegment } from '@/lib/afx/types';
import { fmtUSD } from '@/lib/afx/format';
import { ACCENT } from './bands';

const mono = 'var(--afx-mono)';

const PALETTE: Record<StackSegment['label'], string> = {
  Equity: '#1C1D21',
  Soft: '#52555E',
  Debt: '#9A9CA3',
  Gap: ACCENT,
};

interface Props {
  stack: StackSegment[];
  /** Render the "the ask · unfunded gap" callout below the legend. */
  showAsk?: boolean;
}

/** Horizontal capital-stack bar with Equity / Soft / Debt / Gap (gap elevated). */
export default function CapitalStackBar({ stack, showAsk = true }: Props) {
  const gap = stack.find((s) => s.label === 'Gap');
  const gapPct = gap ? gap.pct : 0;
  const gapUsd = gap ? gap.usd : 0;

  return (
    <div>
      <div style={{ display: 'flex', height: 46, borderRadius: 9, overflow: 'hidden', border: '1px solid #EAE8E3' }}>
        {stack.filter((s) => s.pct > 0).map((s) => {
          const isGap = s.label === 'Gap';
          const textColor = s.label === 'Equity' || s.label === 'Soft' || isGap ? '#fff' : '#1C1D21';
          return (
            <div
              key={s.label}
              style={{
                width: `${s.pct}%`,
                background: isGap
                  ? `repeating-linear-gradient(45deg,${ACCENT},${ACCENT} 6px,#4F57D6 6px,#4F57D6 12px)`
                  : PALETTE[s.label],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRight: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: textColor }}>{s.pct}%</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 14 }}>
        {stack.map((s) => {
          const isGap = s.label === 'Gap';
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12, height: 12, borderRadius: 3, flex: 'none',
                  background: isGap ? `repeating-linear-gradient(45deg,${ACCENT},${ACCENT} 3px,#4F57D6 3px,#4F57D6 6px)` : PALETTE[s.label],
                }}
              />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: '#9A9CA3' }}>{fmtUSD(s.usd)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {showAsk && gap ? (
        <div style={{ marginTop: 16, background: 'var(--afx-accent-soft)', border: '1px solid #D6D8F5', borderRadius: 10, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 4, height: 30, background: ACCENT, borderRadius: 2 }} />
          <div>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT }}>The ask · unfunded gap</div>
            <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 600, letterSpacing: '-0.5px', color: 'var(--afx-accent-deep)', marginTop: 3 }}>
              {fmtUSD(gapUsd)} <span style={{ fontSize: 13, color: '#5E6066' }}>/ {gapPct}% of budget</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
