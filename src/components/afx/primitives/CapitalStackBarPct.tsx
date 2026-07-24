import type { CapitalStackInput } from '@/lib/afx/types';
import { ACCENT } from './bands';

const SEGMENTS: { key: keyof CapitalStackInput; label: string }[] = [
  { key: 'equityPct', label: 'Equity' },
  { key: 'softPct', label: 'Soft' },
  { key: 'debtPct', label: 'Debt' },
  { key: 'gapPct', label: 'Gap' },
];

const PALETTE: Record<string, string> = {
  Equity: '#1C1D21', Soft: '#52555E', Debt: '#9A9CA3', Gap: ACCENT,
};

const GAP_STRIPE = `repeating-linear-gradient(45deg,${ACCENT},${ACCENT} 5px,#4F57D6 5px,#4F57D6 10px)`;

/** Compact Equity/Soft/Debt/Gap bar for the funder marketplace — percentages
 *  only, no dollar figures (none are funder-visible for live asks). */
export default function CapitalStackBarPct({ stack }: { stack: CapitalStackInput }) {
  const segments = SEGMENTS.filter((s) => stack[s.key] > 0);
  if (segments.length === 0) return null;

  return (
    <div>
      <div style={{ display: 'flex', height: 26, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--afx-border)' }}>
        {segments.map((s) => {
          const pct = stack[s.key];
          const isGap = s.label === 'Gap';
          return (
            <div
              key={s.label}
              style={{
                width: `${pct}%`,
                background: isGap ? GAP_STRIPE : PALETTE[s.label],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRight: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {pct >= 10 ? <span style={{ fontSize: 9.5, fontWeight: 700, color: '#fff' }}>{pct}%</span> : null}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
        {segments.map((s) => (
          <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--afx-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, flex: 'none', background: s.label === 'Gap' ? GAP_STRIPE : PALETTE[s.label] }} />
            {s.label} {stack[s.key]}%
          </span>
        ))}
      </div>
    </div>
  );
}
