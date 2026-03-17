'use client';

import { useState } from 'react';
import { GraduationCap, Users, Camera, Film, Megaphone, Building2, Handshake, ArrowRight, Crown, CheckCircle2 } from 'lucide-react';
import ContactModal from './ContactModal';
import type { InquiryType, Partner } from '@/app/actions';

const placeholders = [
  { icon: GraduationCap, label: 'Your Film School Here', color: 'text-blue-400/30' },
  { icon: Users,          label: 'Your Crewing Agency Here', color: 'text-green-400/30' },
  { icon: Camera,         label: 'Your Gear House Here', color: 'text-purple-400/30' },
  { icon: Film,           label: 'Your Post House Here', color: 'text-amber-400/30' },
  { icon: Megaphone,      label: 'Your Distribution Co. Here', color: 'text-red-400/30' },
  { icon: Building2,      label: 'Your Studio Here', color: 'text-teal-400/30' },
];

interface SponsorTickerProps {
  partners?: Partner[];
}

export default function SponsorTicker({ partners = [] }: SponsorTickerProps) {
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Fill remaining slots with placeholders so ticker always looks full
  const remainingSlots = Math.max(0, placeholders.length - partners.length);
  const placeholderItems = placeholders.slice(0, remainingSlots);

  // Build the ticker items: real partners first, then placeholders, then CTA
  const buildItems = () => {
    const items: React.ReactNode[] = [];

    // Real partners — large, glowing, prominent
    partners.forEach((p) => {
      const isSponsor = p.tier === 'sponsor';
      const tile = (
        <a
          key={`partner-${p.id}`}
          href={p.website || '#'}
          target={p.website ? '_blank' : undefined}
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-6 py-3.5 mx-2.5 rounded-2xl border-2 backdrop-blur-md whitespace-nowrap transition-all duration-300 hover:scale-110 flex-shrink-0 relative ${
            isSponsor
              ? 'sponsor-chip-shimmer bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border-amber-400/40 hover:border-amber-400/60'
              : 'partner-chip-glow bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-400/30 hover:border-blue-400/50'
          }`}
        >
          <div className={`rounded-lg overflow-hidden flex-shrink-0 ring-2 ${
            isSponsor
              ? 'w-9 h-9 bg-amber-500/15 ring-amber-400/30'
              : 'w-8 h-8 bg-white/10 ring-blue-400/20'
          }`}>
            <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
          </div>
          <span className={`font-bold ${
            isSponsor ? 'text-sm text-amber-200' : 'text-[13px] text-foreground/90'
          }`}>
            {p.name}
          </span>
          {isSponsor ? (
            <Crown size={14} className="text-amber-400" />
          ) : (
            <CheckCircle2 size={13} className="text-blue-400/70" />
          )}
        </a>
      );
      items.push(tile);
    });

    // Placeholder slots — ghost chips, dashed border, small and faded
    placeholderItems.forEach((item, i) => {
      items.push(
        <button
          key={`placeholder-${i}`}
          onClick={() => setIsContactOpen(true)}
          className="flex items-center gap-2 px-4 py-2 mx-2 rounded-xl border border-dashed border-white/10 whitespace-nowrap transition-all duration-300 hover:border-white/25 hover:bg-white/5 flex-shrink-0 opacity-50 hover:opacity-80"
        >
          <item.icon size={14} className={item.color} />
          <span className="text-[11px] font-medium text-foreground/25">{item.label}</span>
        </button>
      );
    });

    // CTA tile
    items.push(
      <button
        key="cta"
        onClick={() => setIsContactOpen(true)}
        className="flex items-center gap-2 px-5 py-3 mx-2 rounded-2xl border-2 border-primary/30 bg-primary/10 backdrop-blur-sm whitespace-nowrap transition-all duration-300 hover:scale-105 hover:bg-primary/20 hover:border-primary/50 flex-shrink-0"
      >
        <Handshake size={16} className="text-primary" />
        <span className="text-xs font-bold text-primary">Partner With Us</span>
        <ArrowRight size={14} className="text-primary/60" />
      </button>
    );

    return items;
  };

  const tickerItems = buildItems();

  return (
    <>
      <div className="relative -mx-4 md:mx-0 overflow-hidden py-2">
        {/* Label */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Handshake size={14} className="text-foreground/20" />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/20">
            Industry Partners
          </span>
          <span className="text-foreground/10">•</span>
          <button
            onClick={() => setIsContactOpen(true)}
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition-colors"
          >
            Become a Partner
          </button>
        </div>

        {/* Ticker track */}
        <div className="group relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex items-center animate-ticker group-hover:[animation-play-state:paused]">
            {/* First set */}
            {tickerItems}
            {/* Duplicate for seamless loop */}
            {tickerItems}
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        inquiryType={'partner' as InquiryType}
      />
    </>
  );
}
