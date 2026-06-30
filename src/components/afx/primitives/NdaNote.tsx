interface Props {
  children?: React.ReactNode;
}

/** Inline confidentiality note shown beneath sensitive band fields. */
export default function NdaNote({ children }: Props) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8,
        fontSize: 11, color: '#9A9CA3', lineHeight: 1.4,
      }}
    >
      <span aria-hidden style={{ flex: 'none', marginTop: 1 }}>🔒</span>
      <span>
        {children ??
          'Confidential. Used only to compute your rating. Shown to funders as a band, never as a raw figure. NDA-protected.'}
      </span>
    </div>
  );
}
