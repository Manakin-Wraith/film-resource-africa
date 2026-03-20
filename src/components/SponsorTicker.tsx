'use client';

import { useState } from 'react';
import { GraduationCap, Users, Camera, Film, Megaphone, Building2, Handshake, ArrowRight, Crown, CheckCircle2 } from 'lucide-react';
import ContactModal from './ContactModal';
import { trackSponsoredClick } from '@/app/actions';
import type { InquiryType, Partner } from '@/app/actions';

const placeholders = [
  { icon: GraduationCap, label: 'Your Film School', color: 'text-amber-400/50', borderColor: 'border-amber-400/15' },
  { icon: Users,          label: 'Your Crew Agency', color: 'text-amber-400/50', borderColor: 'border-amber-400/15' },
  { icon: Camera,         label: 'Your Gear House', color: 'text-amber-400/50', borderColor: 'border-amber-400/15' },
  { icon: Film,           label: 'Your Post House', color: 'text-amber-400/50', borderColor: 'border-amber-400/15' },
  { icon: Megaphone,      label: 'Your Distributor', color: 'text-amber-400/50', borderColor: 'border-amber-400/15' },
  { icon: Building2,      label: 'Your Studio', color: 'text-amber-400/50', borderColor: 'border-amber-400/15' },
];

interface SponsorTickerProps {
  partners?: Partner[];
}

export default function SponsorTicker({ partners = [] }: SponsorTickerProps) {
  const [isContactOpen, setIsContactOpen] = useState(false);

  const remainingSlots = Math.max(0, placeholders.length - partners.length);
  const placeholderItems = placeholders.slice(0, remainingSlots);

  const buildTickerItems = () => {
    const items: React.ReactNode[] = [];

    // Real partners — large, glowing, prominent
    partners.forEach((p) => {
      const isSponsor = p.tier === 'sponsor';
      items.push(
        <a
          key={`partner-${p.id}`}
          href={p.website || '#'}
          target={p.website ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={() => trackSponsoredClick(null, String(p.id), 'ticker', null)}
          className={`flex items-center gap-3 px-7 py-4 mx-3 rounded-2xl border-2 backdrop-blur-md whitespace-nowrap transition-all duration-300 hover:scale-105 flex-shrink-0 relative ${
            isSponsor
              ? 'sponsor-chip-shimmer bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border-amber-400/40 hover:border-amber-400/60'
              : 'partner-chip-glow bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-400/30 hover:border-blue-400/50'
          }`}
        >
          <div className={`rounded-xl overflow-hidden flex-shrink-0 ring-2 ${
            isSponsor
              ? 'w-10 h-10 bg-amber-500/15 ring-amber-400/30'
              : 'w-10 h-10 bg-white/10 ring-blue-400/20'
          }`}>
            <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
          </div>
          <span className={`font-bold ${
            isSponsor ? 'text-base text-amber-200' : 'text-sm text-foreground/90'
          }`}>
            {p.name}
          </span>
          {isSponsor ? (
            <Crown size={16} className="text-amber-400" />
          ) : (
            <CheckCircle2 size={14} className="text-blue-400/70" />
          )}
        </a>
      );
    });

    // Ghost placeholder slots — visible, enticing, clickable
    placeholderItems.forEach((item, i) => {
      items.push(
        <button
          key={`placeholder-${i}`}
          onClick={() => setIsContactOpen(true)}
          className={`ghost-placeholder-shimmer flex items-center gap-3 px-6 py-4 mx-3 rounded-2xl border-2 border-dashed ${item.borderColor} whitespace-nowrap transition-all duration-300 hover:border-amber-400/40 hover:bg-amber-500/10 flex-shrink-0 group/ghost`}
        >
          <div className="w-10 h-10 rounded-xl border border-dashed border-amber-400/20 flex items-center justify-center bg-amber-500/5 group-hover/ghost:bg-amber-500/10 transition-colors">
            <item.icon size={18} className={item.color} />
          </div>
          <span className="text-sm font-semibold text-foreground/30 group-hover/ghost:text-amber-400/70 transition-colors">{item.label}</span>
          <ArrowRight size={14} className="text-foreground/15 group-hover/ghost:text-amber-400/60 transition-colors" />
        </button>
      );
    });

    return items;
  };

  const tickerItems = buildTickerItems();

  return (
    <>
      <div className="relative -mx-4 md:mx-0 rounded-3xl overflow-hidden border border-amber-500/15 bg-gradient-to-b from-amber-500/[0.04] via-transparent to-amber-500/[0.02]">
        {/* Top section: heading + stats + CTA */}
        <div className="px-6 pt-7 pb-5 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            {/* Left: heading + value prop */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
                  <Handshake size={18} className="text-amber-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-heading text-foreground/90">Industry Partners</h2>
              </div>
              <p className="text-sm text-foreground/40 md:pl-[46px]">
                Get your brand in front of Africa&apos;s film community — every week, on every page.
              </p>
            </div>

            {/* Right: CTA button */}
            <button
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] whitespace-nowrap self-start md:self-center"
            >
              <Handshake size={18} />
              Become a Partner
              <ArrowRight size={16} />
            </button>
          </div>

        </div>

        {/* Divider */}
        <div className="mx-6 md:mx-10 border-t border-amber-500/10" />

        {/* Ticker track */}
        <div className="py-5 relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="group relative">
            <div className="flex items-center animate-ticker group-hover:[animation-play-state:paused]">
              {tickerItems}
              {tickerItems}
            </div>
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
