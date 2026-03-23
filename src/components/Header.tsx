'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Database, Newspaper, Plus, Globe, Clapperboard, Building2, Star } from 'lucide-react';
import Link from 'next/link';
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
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
              href="/film-opportunities"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Globe size={14} className="text-emerald-400" />
              Countries
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
              href="/film-opportunities"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Globe size={16} className="text-emerald-400" />
              Countries
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
