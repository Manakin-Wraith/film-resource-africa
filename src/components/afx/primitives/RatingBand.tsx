import type { RatingBand as Band } from '@/lib/afx/types';
import { BAND_CHIP } from './bands';

interface Props {
  band: Band;
  careerStage?: string;
  size?: 'sm' | 'md';
}

/** Rating band pill (A/B/C/D) with optional career-stage descriptor. */
export default function RatingBand({ band, careerStage, size = 'md' }: Props) {
  return (
    <div>
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700,
          fontSize: size === 'sm' ? 11.5 : 12.5, padding: size === 'sm' ? '3px 8px' : '4px 9px',
          borderRadius: 7, ...BAND_CHIP[band],
        }}
      >
        {band}
      </div>
      {careerStage ? (
        <div style={{ fontSize: 10.5, color: '#9A9CA3', marginTop: 6, lineHeight: 1.2 }}>{careerStage}</div>
      ) : null}
    </div>
  );
}
