import type { Provenance } from '@/lib/afx/types';
import { PROVENANCE_META } from '@/lib/afx/constants';

interface Props {
  provenance: Provenance;
  /** Show a "reverted" hint when an edit dropped a verified/confirmed field. */
  reverted?: boolean;
  size?: 'sm' | 'md';
}

/** self-reported (amber) / confirmed (blue) / verified (green) badge. */
export default function ProvenanceBadge({ provenance, reverted, size = 'md' }: Props) {
  const meta = PROVENANCE_META[provenance];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--afx-mono)', fontSize: size === 'sm' ? 9 : 9.5,
          letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
          color: meta.varName, background: meta.bg,
          border: `1px solid ${meta.varName}`, padding: '2px 7px', borderRadius: 5,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.varName }} />
        {meta.label}
      </span>
      {reverted ? (
        <span style={{ fontSize: 10.5, fontStyle: 'italic', color: 'var(--afx-prov-self)' }}>
          was verified → now self-reported
        </span>
      ) : null}
    </span>
  );
}
