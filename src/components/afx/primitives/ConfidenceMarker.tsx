import type { Confidence } from '@/lib/afx/types';
import { confMarkerStyle } from '@/lib/afx/format';

interface Props {
  confidence: Confidence | null | undefined;
  size?: number;
  showLabel?: boolean;
}

/** Rebate-confidence marker (Confirmed solid / Likely split / Aspirational dashed). */
export default function ConfidenceMarker({ confidence, size = 11, showLabel }: Props) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={confMarkerStyle(confidence, size)} />
      {showLabel ? (
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#5E6066' }}>{confidence ?? 'Aspirational'}</span>
      ) : null}
    </span>
  );
}
