'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { directoryCategories } from '@/lib/directoryConfig';

interface HeaderProps {
  stats: {
    total: number;
    closingSoon: number;
    open: number;
  };
}

type MemberSession = {
  full_name: string;
  username: string | null;
  avatar_url: string | null;
} | null;

// Flat top-level links (Directory is rendered separately as a dropdown parent).
const NAV_LINKS_BASE = [
  { href: '/news', label: 'News' },
  { href: '/call-sheet', label: 'Call Sheet' },
  { href: '/industry', label: 'Industry' },
  { href: '/rebate-calculator', label: 'Rebate' },
  { href: '/community-spotlight', label: 'Spotlight' },
];

// Directory dropdown children: the 7 public categories + By Country.
const DIRECTORY_CHILDREN = [
  ...directoryCategories.map((c) => ({ href: `/directory?cat=${c.slug}`, label: c.label })),
  { href: '/film-opportunities', label: 'By Country' },
  { href: '/projects', label: 'Projects in Development' },
];

export default function Header({ stats }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [member, setMember] = useState<MemberSession>(undefined as unknown as MemberSession);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function loadMember() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMember(null); return; }
      const res = await fetch('/api/members/me');
      const data = await res.json();
      setMember(data);
    }

    loadMember();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadMember();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMember(null);
    router.push('/');
    router.refresh();
  }

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/';
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const firstName = member?.full_name?.split(' ')[0] ?? '';
  const membersHref = member ? '/members/directory' : '/members';
  const navLinks = [
    NAV_LINKS_BASE[0], // News
    { href: membersHref, label: 'Members' },
    { href: '/tech-pulse', label: 'Tech-Pulse' },
    ...NAV_LINKS_BASE.slice(1),
  ];
  const directoryActive = pathname.startsWith('/directory') || pathname.startsWith('/film-opportunities') || pathname.startsWith('/projects');

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-white/[0.08]" style={{ background: 'var(--surface)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-8">

          {/* Publication wordmark */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <Image src="/icon.png" alt="" width={24} height={24} className="object-contain opacity-90" />
            <span className="font-heading font-bold text-[15px] tracking-tight text-foreground">
              Film Resource Africa
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0 flex-1">
            <DirectoryDropdown active={directoryActive} />
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

          {/* Auth CTA — desktop only */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Link
              href="/assess"
              className={`flex items-center px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                isActive('/assess') ? 'text-primary' : ''
              }`}
              style={isActive('/assess') ? undefined : { color: 'var(--primary)' }}
            >
              Assess Your Project
            </Link>
            {member ? (
              /* Logged-in state */
              <div className="flex items-center gap-2">
                <Link
                  href={member.username ? `/members/${member.username}` : '/members/onboarding'}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" style={{ border: '1px solid rgba(255,255,255,0.16)' }} />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                      {firstName.charAt(0)}
                    </div>
                  )}
                  <span className="text-[13px] font-semibold">{firstName}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[12px] px-3 py-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
                  style={{ color: 'var(--foreground-tertiary)' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              /* Logged-out state */
              <Link
                href="/login"
                className="flex items-center px-4 py-2 text-[13px] font-semibold border border-white/[0.2] text-foreground hover:bg-white/[0.06] rounded-lg transition-all"
              >
                Member login
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
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
        <div className={`md:hidden overflow-hidden transition-all duration-200 ${menuOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-white/[0.06] container mx-auto px-4 py-2">
            <Link
              href="/assess"
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3.5 text-sm font-semibold border-b border-white/[0.06] transition-colors min-h-[44px]"
              style={{ color: 'var(--primary)' }}
            >
              Assess Your Project
            </Link>

            {/* Directory group */}
            <Link
              href="/directory"
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3.5 text-sm font-semibold border-b border-white/[0.06] transition-colors min-h-[44px] text-foreground"
            >
              Directory
            </Link>
            {DIRECTORY_CHILDREN.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center pl-4 py-3 text-[13px] font-medium border-b border-white/[0.06] transition-colors hover:text-foreground min-h-[40px]"
                style={{ color: 'var(--foreground-tertiary)' }}
              >
                {label}
              </Link>
            ))}

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
            {member ? (
              <div className="flex gap-2 mt-3 mb-2">
                <Link
                  href={member.username ? `/members/${member.username}` : '/members/onboarding'}
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 flex items-center justify-center py-3.5 text-sm font-semibold border border-white/[0.2] text-foreground hover:bg-white/[0.06] rounded-lg min-h-[48px]"
                >
                  My profile
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut(); }}
                  className="px-4 py-3.5 text-sm font-medium rounded-lg border border-white/[0.1] min-h-[48px]"
                  style={{ color: 'var(--foreground-tertiary)' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center mt-3 mb-2 py-3.5 text-sm font-semibold border border-white/[0.2] text-foreground hover:bg-white/[0.06] rounded-lg min-h-[48px] transition-all"
              >
                Member login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function DirectoryDropdown({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/directory"
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex items-center gap-1 px-3.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
          active ? 'text-foreground font-semibold' : 'hover:text-foreground'
        }`}
        style={active ? undefined : { color: 'var(--foreground-secondary)' }}
        onClick={() => setOpen(false)}
      >
        Directory
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Link>

      {open && (
        <div
          className="absolute top-full left-0 pt-1 z-50"
          role="menu"
        >
          <div
            className="min-w-[220px] rounded-xl border border-white/[0.1] p-1.5 shadow-xl"
            style={{ background: 'var(--surface)' }}
          >
            {DIRECTORY_CHILDREN.map(({ href, label }, i) => (
              <div key={href}>
                {i === directoryCategories.length && (
                  <div className="my-1 h-px bg-white/[0.08]" />
                )}
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  {label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
