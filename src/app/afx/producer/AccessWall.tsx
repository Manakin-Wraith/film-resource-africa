export default function AccessWall() {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '80px 28px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--afx-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--afx-accent)', marginBottom: 12 }}>AFX — invite only</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', margin: '0 0 12px' }}>AFX is in invite-only beta</h1>
      <p style={{ fontSize: 14.5, color: '#5E6066', lineHeight: 1.55 }}>
        Your account isn't on the AFX producer list yet. If you're an FRA producer and want
        access to the finance layer, request an invite and we'll be in touch.
      </p>
      <a href="mailto:hello@film-resource-africa.com?subject=AFX%20producer%20access"
         style={{ display: 'inline-block', marginTop: 22, fontFamily: 'var(--afx-body)', fontSize: 13.5, fontWeight: 600, padding: '10px 18px', borderRadius: 9, border: '1px solid #1C1D21', background: '#1C1D21', color: '#fff', textDecoration: 'none' }}>
        Request access
      </a>
    </main>
  );
}
