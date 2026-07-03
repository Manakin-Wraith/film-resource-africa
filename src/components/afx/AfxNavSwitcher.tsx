'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mono = 'var(--afx-mono)';

export type ActiveTop = 'producer' | 'funder' | 'review' | null;

/** Which top-level seat a path belongs to. `/afx/staff` is checked before
 *  `/afx/marketplace` so `/afx/staff/marketplace` (the internal review surface)
 *  reads as 'review', not the funder seat. Pure. */
export function activeTop(pathname: string): ActiveTop {
  if (pathname.startsWith('/afx/producer')) return 'producer';
  if (pathname.startsWith('/afx/staff')) return 'review';
  if (pathname.startsWith('/afx/marketplace')) return 'funder';
  return null;
}

const REVIEW_ITEMS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: '/afx/staff', label: 'Queue' },
  { href: '/afx/staff/marketplace', label: 'Marketplace review' },
  { href: '/afx/staff/nda', label: 'NDA log' },
  { href: '/afx/staff/invites', label: 'Invites' },
  { href: '/afx/staff/team', label: 'Manage team', adminOnly: true },
];

function topStyle(active: boolean): React.CSSProperties {
  return {
    fontFamily: mono, fontSize: 11, fontWeight: 700, textDecoration: 'none',
    padding: '6px 11px', borderRadius: 8,
    border: `1px solid ${active ? 'var(--afx-ink)' : 'transparent'}`,
    background: active ? 'var(--afx-ink)' : 'transparent',
    color: active ? '#fff' : 'var(--afx-muted)',
  };
}

export default function AfxNavSwitcher({ role }: { role: 'reviewer' | 'admin' }) {
  const pathname = usePathname() ?? '';
  const active = activeTop(pathname);
  const [open, setOpen] = useState(false);
  const items = REVIEW_ITEMS.filter((it) => !it.adminOnly || role === 'admin');

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Link href="/afx/producer" style={topStyle(active === 'producer')}>Producer</Link>
      <Link href="/afx/marketplace" style={topStyle(active === 'funder')}>Funder</Link>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ ...topStyle(active === 'review'), cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          FRA review <span style={{ fontSize: 8 }}>{open ? '▲' : '▼'}</span>
        </button>
        {open ? (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 41, background: '#fff', border: '1px solid var(--afx-border)', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.10)', padding: 5, minWidth: 190, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.map((it) => {
                const isCurrent = pathname === it.href;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    style={{ fontFamily: mono, fontSize: 11.5, fontWeight: 600, textDecoration: 'none', padding: '8px 11px', borderRadius: 7, color: isCurrent ? 'var(--afx-ink)' : 'var(--afx-muted)', background: isCurrent ? '#F1EFEA' : 'transparent' }}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </nav>
  );
}
