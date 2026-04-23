'use client';

import { useState, useEffect } from 'react';
import { Home, Database, Newspaper, Building2, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/#directory', label: 'Directory', icon: Database },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/call-sheet', label: 'Call Sheet', icon: Clapperboard },
  { href: '/industry', label: 'Industry', icon: Building2 },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const hidden = pathname.startsWith('/admin') || pathname.startsWith('/login');

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return pathname === '/';
    return pathname.startsWith(href);
  };

  if (hidden) return null;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div
        className="border-t border-white/[0.12]"
        style={{
          background: 'var(--surface)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-1 py-1">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 min-w-[60px] min-h-[52px] transition-all duration-200 ${
                  active
                    ? 'text-foreground'
                    : 'text-foreground/35 active:text-foreground/60'
                }`}
              >
                <div className="relative">
                  {active && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-primary rounded-full" />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    active ? 'text-primary' : ''
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
