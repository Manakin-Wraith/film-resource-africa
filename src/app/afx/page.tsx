import Link from 'next/link';

export default function AfxIndexPage() {
  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '64px 28px 96px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 36 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'var(--afx-ink)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: '-0.5px',
          }}
        >
          A
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>AFX</span>
          <span
            style={{
              fontFamily: 'var(--afx-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--afx-faint)',
            }}
          >
            Finance layer · prototype
          </span>
        </div>
      </div>

      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: '-0.9px' }}>
        Two seats, one set of facts.
      </h1>
      <p style={{ margin: '12px 0 40px', fontSize: 15, color: 'var(--afx-muted)', maxWidth: 620, lineHeight: 1.55 }}>
        Producers manage their investable asset; funders screen and compare deal flow. Both read the
        same verified data — what a producer edits in the cockpit is exactly what a funder sees on the
        screening floor.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18 }}>
        <SurfaceCard
          href="/afx/producer"
          eyebrow="Producer"
          title="Producer Cockpit"
          body="Manage identity, slate, bands and verification. Watch your Producer Rating move as you confirm claims and add projects."
        />
        <SurfaceCard
          href="/afx/marketplace"
          eyebrow="Funder"
          title="Deal Screening"
          body="Rank producers, projects and slates by deal signal. Drill into incentives and capital stacks; compare 2–4 side by side."
        />
      </div>
    </main>
  );
}

function SurfaceCard({
  href,
  eyebrow,
  title,
  body,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        background: 'var(--afx-surface)',
        border: '1px solid var(--afx-border)',
        borderRadius: 16,
        padding: '24px 24px 26px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--afx-mono)',
          fontSize: 9.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--afx-accent)',
        }}
      >
        {eyebrow}
      </span>
      <h2 style={{ margin: '10px 0 8px', fontSize: 21, fontWeight: 700, letterSpacing: '-0.4px' }}>
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--afx-muted)', lineHeight: 1.5 }}>{body}</p>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 18,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--afx-accent)',
        }}
      >
        Open <span style={{ fontSize: 15 }}>›</span>
      </span>
    </Link>
  );
}
