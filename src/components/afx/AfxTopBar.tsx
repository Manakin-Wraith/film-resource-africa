import Link from 'next/link';
import AfxNavSwitcher from './AfxNavSwitcher';
import AfxSignOutButton from './AfxSignOutButton';

interface Props {
  subtitle: string;
  staffRole?: 'reviewer' | 'admin' | null;
  right?: React.ReactNode;
}

const mono = 'var(--afx-mono)';

/** Sticky AFX masthead shared by the cockpit and the deal display. */
export default function AfxTopBar({ subtitle, staffRole, right }: Props) {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(250,249,247,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #EAE8E3',
      }}
    >
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/afx" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#1C1D21', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, letterSpacing: '-0.5px' }}>A</div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>AFX</span>
            <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A9CA3' }}>{subtitle}</span>
          </div>
        </Link>
        {staffRole ? <AfxNavSwitcher role={staffRole} /> : null}
        <div style={{ flex: 1 }} />
        {right}
        <AfxSignOutButton />
      </div>
    </header>
  );
}
