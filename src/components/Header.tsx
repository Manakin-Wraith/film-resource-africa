'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  stats: {
    total: number;
    closingSoon: number;
    open: number;
  };
}

const navLinks = [
  { href: '/#directory', label: 'Directory' },
  { href: '/film-opportunities', label: 'Countries' },
  { href: '/news', label: 'News' },
  { href: '/call-sheet', label: 'Call Sheet' },
  { href: '/industry', label: 'Industry' },
  { href: '/rebate-calculator', label: 'Rebate' },
  { href: '/community-spotlight', label: 'Spotlight' },
];

export default function Header({ stats }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/';
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-white/[0.08]" style={{ background: 'var(--surface)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-8">

          {/* Publication wordmark */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img
              src="/icon.png"
              alt=""
              className="w-6 h-6 object-contain opacity-90"
            />
            <span className="font-heading font-bold text-[15px] tracking-tight text-foreground">
              Film Resource Africa
            </span>
          </Link>

          {/* Desktop nav — text only, no icons */}
          <div className="hidden md:flex items-center gap-0 flex-1">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
                    active ? 'text-foreground font-semibold' : 'hover:text-foreground'
                  }`}
                  style={active ? undefined : { color: 'var(--foreground-secondary)' }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Submit CTA — desktop only */}
          <Link
            href="/submit"
            className="hidden md:flex items-center px-4 py-2 text-[13px] font-semibold bg-primary hover:bg-blue-600 text-white rounded-lg transition-all flex-shrink-0"
          >
            Submit
          </Link>

          {/* Mobile: Menu toggle — icon only, no pill background */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -mr-2 transition-colors"
            style={{ color: menuOpen ? 'var(--foreground)' : 'var(--foreground-secondary)' }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-200 ${
            menuOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div
            className="border-t border-white/[0.06] container mx-auto px-4 py-2"
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center py-3.5 text-sm font-medium border-b border-white/[0.06] last:border-0 transition-colors hover:text-foreground min-h-[44px]"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/submit"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center mt-3 mb-2 py-3.5 text-sm font-semibold bg-primary text-white rounded-lg min-h-[48px] transition-all hover:bg-blue-600"
            >
              Submit an Opportunity
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
