interface Props {
  label: string;
  tone?: 'warn' | 'neutral';
}

/** Small risk-flag chip (e.g. "Single-project risk"). Uses label + pattern,
 *  never colour alone, for accessibility. */
export default function RiskFlag({ label, tone = 'warn' }: Props) {
  const warn = tone === 'warn';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
        color: warn ? '#8A6D00' : '#5E6066',
        background: warn ? '#FBF3D9' : '#F1EFEA',
        border: `1px solid ${warn ? '#EAD9A0' : '#E4E2DC'}`,
      }}
    >
      <span aria-hidden style={{ fontWeight: 800 }}>{warn ? '⚠' : '•'}</span>
      {label}
    </span>
  );
}
