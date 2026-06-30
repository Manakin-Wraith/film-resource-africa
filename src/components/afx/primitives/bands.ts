import type { RatingBand } from '@/lib/afx/types';

export const ACCENT = '#3D46C9';

/** Band chip color map shared by SignalChip + RatingBand. */
export const BAND_CHIP: Record<RatingBand, React.CSSProperties> = {
  A: { background: '#1C1D21', color: '#fff', border: '1px solid #1C1D21' },
  B: { background: '#52555E', color: '#fff', border: '1px solid #52555E' },
  C: { background: '#EAE8E3', color: '#1C1D21', border: '1px solid #DAD7D0' },
  D: { background: '#fff', color: '#9A9CA3', border: '1px dashed #C9C6BF' },
};

export const PIPS_ON: Record<RatingBand, number> = { A: 4, B: 3, C: 2, D: 1 };

export function chipStyle(b: RatingBand, big = false): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
    borderRadius: big ? 12 : 9, width: big ? 52 : 40, height: big ? 52 : 40,
    fontSize: big ? 24 : 18, letterSpacing: '-1px', flex: 'none',
    ...BAND_CHIP[b],
  };
}
