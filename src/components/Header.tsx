'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { navGroups, type NavGroup } from '@/lib/navConfig';

type MemberSession = {
  full_name: string;
  username: string | null;
  avatar_url: string | null;
} | null;

export default function Header() {
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

  const isGroupActive = (group: NavGroup) =>
    isActive(group.href) ||
    (group.children ?? []).some((c) => isActive(c.href.split('?')[0]));

  const firstName = member?.full_name?.split(' ')[0] ?? '';

  // Logged-in members land on the members directory instead of the join page
  const resolveHref = (href: string) => (member && href === '/members' ? '/members/directory' : href);
  const groups: NavGroup[] = navGroups.map((g) => ({
    ...g,
    href: resolveHref(g.href),
    children: g.children?.map((c) => ({ ...c, href: resolveHref(c.href) })),
  }));

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-line" style={{ background: 'var(--surface)' }}>
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
            {groups.map((group) => {
              const active = isGroupActive(group);
              if (group.children) {
                return <NavDropdown key={group.label} group={group} active={active} />;
              }
              return (
                <Link
                  key={group.label}
                  href={group.href}
                  className={`px-3.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
                    active ? 'text-foreground font-semibold' : 'hover:text-foreground'
                  }`}
                  style={active ? undefined : { color: 'var(--foreground-secondary)' }}
                >
                  {group.label}
                </Link>
              );
            })}
          </div>

          {/* Auth CTA — desktop only */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Assess Your Project — hidden for now
            <Link
              href="/assess"
              className={`flex items-center px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                isActive('/assess') ? 'text-primary' : ''
              }`}
              style={isActive('/assess') ? undefined : { color: 'var(--primary)' }}
            >
              Assess Your Project
            </Link>
            */}
            {member ? (
              /* Logged-in state */
              <div className="flex items-center gap-2">
                <Link
                  href={member.username ? `/members/${member.username}` : '/members/onboarding'}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-foreground/[0.04]"
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-line-strong" />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-primary/20 border border-primary/30 text-blue-300">
                      {firstName.charAt(0)}
                    </div>
                  )}
                  <span className="text-[13px] font-semibold">{firstName}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[12px] px-3 py-1.5 rounded-lg transition-colors hover:bg-foreground/[0.04]"
                  style={{ color: 'var(--foreground-tertiary)' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              /* Logged-out state */
              <Link
                href="/login"
                className="flex items-center px-4 py-2 text-[13px] font-semibold border border-line-strong text-foreground hover:bg-foreground/[0.04] rounded-lg transition-all"
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
        <div className={`md:hidden transition-all duration-200 ${menuOpen ? 'max-h-[calc(100dvh-var(--header-h))] opacity-100 overflow-y-auto overscroll-contain' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {/* bottom padding clears the fixed mobile tab bar so the last item (login) stays reachable */}
          <div className="border-t border-line container mx-auto px-4 py-2 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.5rem)]">
            {/* Assess Your Project — hidden for now
            <Link
              href="/assess"
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3.5 text-sm font-semibold border-b border-line transition-colors min-h-[44px]"
              style={{ color: 'var(--primary)' }}
            >
              Assess Your Project
            </Link>
            */}

            {groups.map((group) =>
              group.children ? (
                <div key={group.label}>
                  <Link
                    href={group.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center py-3.5 text-sm font-semibold border-b border-line transition-colors min-h-[44px] text-foreground"
                  >
                    {group.label}
                  </Link>
                  {group.children.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center pl-4 py-3 text-[13px] font-medium border-b border-line transition-colors hover:text-foreground min-h-[44px]"
                      style={{ color: 'var(--foreground-tertiary)' }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={group.label}
                  href={group.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center py-3.5 text-sm font-medium border-b border-line transition-colors hover:text-foreground min-h-[44px]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  {group.label}
                </Link>
              )
            )}

            {member ? (
              <div className="flex gap-2 mt-3 mb-2">
                <Link
                  href={member.username ? `/members/${member.username}` : '/members/onboarding'}
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 flex items-center justify-center py-3.5 text-sm font-semibold border border-line-strong text-foreground hover:bg-foreground/[0.04] rounded-lg min-h-[48px]"
                >
                  My profile
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut(); }}
                  className="px-4 py-3.5 text-sm font-medium rounded-lg border border-line-mid min-h-[48px]"
                  style={{ color: 'var(--foreground-tertiary)' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center mt-3 mb-2 py-3.5 text-sm font-semibold border border-line-strong text-foreground hover:bg-foreground/[0.04] rounded-lg min-h-[48px] transition-all"
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

function NavDropdown({ group, active }: { group: NavGroup; active: boolean }) {
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
      onBlur={(e) => {
        // close when focus leaves the whole dropdown (keyboard navigation)
        if (ref.current && !ref.current.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Link
        href={group.href}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex items-center gap-1 px-3.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
          active ? 'text-foreground font-semibold' : 'hover:text-foreground'
        }`}
        style={active ? undefined : { color: 'var(--foreground-secondary)' }}
        onClick={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            (ref.current?.querySelector('[role="menuitem"]') as HTMLElement | null)?.focus();
          }
        }}
      >
        {group.label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Link>

      {open && (
        <div
          className="absolute top-full left-0 pt-1 z-50"
          role="menu"
        >
          <div
            className="min-w-[220px] rounded-xl border border-line-mid p-1.5 shadow-xl"
            style={{ background: 'var(--surface)' }}
          >
            {(group.children ?? []).map(({ href, label, dividerBefore }) => (
              <div key={href}>
                {dividerBefore && <div className="my-1 h-px bg-line" />}
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
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
