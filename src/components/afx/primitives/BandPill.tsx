interface Props {
  label: string;
  value: string;
  /** Render the "— not provided" missing-data treatment. */
  missing?: boolean;
  children?: React.ReactNode;
}

/** Generic banded-value pill (budget tier, recoupment, % secured, etc.). */
export default function BandPill({ label, value, missing, children }: Props) {
  if (missing) {
    return (
      <div
        style={{
          border: '1px dashed #CFCCC4', borderRadius: 8, padding: '9px 11px',
          background: 'repeating-linear-gradient(135deg,#FBFAF7,#FBFAF7 5px,#F4F2ED 5px,#F4F2ED 10px)',
        }}
      >
        <div style={{ fontFamily: 'var(--afx-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: '#A7A99F', fontStyle: 'italic' }}>— not provided</div>
      </div>
    );
  }
  return (
    <div style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 9, padding: '11px 13px' }}>
      <div style={{ fontFamily: 'var(--afx-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
        {children}
      </div>
    </div>
  );
}
