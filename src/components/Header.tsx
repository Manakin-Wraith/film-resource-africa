'use client';

import { useState, useEffect } from 'react';
import { Menu, X, AlertTriangle, Clock, Database, Newspaper, Plus, Globe, Clapperboard, Building2, Star } from 'lucide-react';
import Link from 'next/link';
import { getUserTimezone } from '@/lib/dateUtils';

interface HeaderProps {
  stats: {
    total: number;
    closingSoon: number;
    open: number;
  };
}

export default function Header({ stats }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tz, setTz] = useState('');
  const [localDate, setLocalDate] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    setTz(getUserTimezone());
    setLocalDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
      {/* Stats Strip */}
      <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'}`}>
        <div className="bg-primary/10 backdrop-blur-md border-b border-white/5">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-6 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-foreground/60">
              <Database size={12} className="text-primary" />
              <strong className="text-foreground/90">{stats.total}</strong> Opportunities
            </span>
            <span className="w-[1px] h-3 bg-white/15"></span>
            {stats.closingSoon > 0 && (
              <>
                <span className="flex items-center gap-1.5 text-red-400">
                  <AlertTriangle size={12} />
                  <strong>{stats.closingSoon}</strong> Closing Soon
                </span>
                <span className="w-[1px] h-3 bg-white/15"></span>
              </>
            )}
            <span className="flex items-center gap-1.5 text-green-400">
              <Clock size={12} />
              <strong>{stats.open}</strong> Open Now
            </span>
            {tz && (
              <>
                <span className="w-[1px] h-3 bg-white/15 hidden sm:block"></span>
                <span className="flex items-center gap-1.5 text-foreground/40 hidden sm:block">
                  <Globe size={10} className="inline" />
                  {localDate} · {tz}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <nav className="glass-panel backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden p-1.5 group-hover:scale-110 transition-transform shadow-md">
              <img 
                src="/icon.png" 
                alt="Film Resource Africa" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-white hidden sm:block">
              Film Resource Africa
            </span>
            <span className="font-heading font-bold text-lg tracking-tight text-white sm:hidden">
              FRA
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/#directory"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Database size={14} className="text-primary" />
              Directory
            </Link>
            <Link
              href="/news"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Newspaper size={14} className="text-accent" />
              News
            </Link>
            <Link
              href="/call-sheet"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Clapperboard size={14} className="text-teal-400" />
              Call Sheet
            </Link>
            <Link
              href="/industry"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Building2 size={14} className="text-purple-400" />
              Industry
            </Link>
            <Link
              href="/community-spotlight"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Star size={14} className="text-yellow-400" />
              Spotlight
            </Link>
            <Link
              href="/submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Plus size={14} className="text-green-400" />
              Submit
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="container mx-auto px-4 pb-4 space-y-1">
            <Link
              href="/#directory"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Database size={16} className="text-primary" />
              Directory
            </Link>
            <Link
              href="/news"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Newspaper size={16} className="text-accent" />
              News
            </Link>
            <Link
              href="/call-sheet"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Clapperboard size={16} className="text-teal-400" />
              Call Sheet
            </Link>
            <Link
              href="/industry"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Building2 size={16} className="text-purple-400" />
              Industry Directory
            </Link>
            <Link
              href="/community-spotlight"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Star size={16} className="text-yellow-400" />
              Community Spotlight
            </Link>
            <Link
              href="/submit"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Plus size={16} className="text-green-400" />
              Submit Opportunity
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
