'use client';

import Image from 'next/image';
import { Handshake, Crown, ExternalLink } from 'lucide-react';
import { trackSponsoredClick } from '@/app/actions';
import type { Partner } from '@/app/actions';

interface SponsorTickerProps {
  partners?: Partner[];
}

/* ── Featured card for 1-3 partners ─────────────────────────────────────────── */
function PartnerCard({ partner }: { partner: Partner }) {
  const isSponsor = partner.tier === 'sponsor';
  const services = partner.services ? partner.services.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <a
      href={partner.website || '#'}
      target={partner.website ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={() => trackSponsoredClick(null, String(partner.id), 'ticker', null)}
      className={`group relative flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${
        isSponsor
          ? 'sponsor-chip-shimmer bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-yellow-500/5 border-amber-400/25 hover:border-amber-400/50 hover:shadow-[0_12px_40px_-10px_rgba(245,158,11,0.2)]'
          : 'partner-chip-glow bg-gradient-to-br from-blue-500/8 via-cyan-500/5 to-blue-600/5 border-blue-400/20 hover:border-blue-400/40 hover:shadow-[0_12px_40px_-10px_rgba(59,130,246,0.15)]'
      }`}
    >
      {/* Logo */}
      <div className={`flex-shrink-0 rounded-2xl overflow-hidden flex items-center justify-center ${
        isSponsor
          ? 'w-20 h-20 bg-amber-500/10 ring-2 ring-amber-400/20'
          : 'w-20 h-20 bg-white/10 ring-2 ring-white/10'
      }`}>
        <Image
          src={partner.logo_url}
          alt={partner.name}
          width={64}
          height={64}
          className="w-16 h-16 object-contain"
        />
      </div>

      {/* Info */}
      <div className="flex-grow text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2.5 mb-1.5">
          <h3 className={`text-lg font-bold font-heading ${
            isSponsor ? 'text-amber-200' : 'text-foreground/90'
          }`}>
            {partner.name}
          </h3>
          {isSponsor ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/20 text-amber-400">
              <Crown size={10} /> Sponsor
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 border border-blue-500/20 text-blue-400">
              Partner
            </span>
          )}
        </div>

        {partner.about && (
          <p className="text-sm text-foreground/50 leading-relaxed mb-3 max-w-lg">{partner.about}</p>
        )}

        {services.length > 0 && (
          <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
            {services.slice(0, 5).map(s => (
              <span key={s} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                isSponsor
                  ? 'bg-amber-500/10 border border-amber-500/15 text-amber-400/80'
                  : 'bg-blue-500/10 border border-blue-500/15 text-blue-400/80'
              }`}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Visit link */}
      {partner.website && (
        <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold opacity-60 group-hover:opacity-100 transition-opacity ${
          isSponsor ? 'text-amber-400' : 'text-blue-400'
        }`}>
          Visit <ExternalLink size={12} />
        </div>
      )}
    </a>
  );
}

/* ── Compact chip for carousel (4+ partners) ────────────────────────────────── */
function PartnerChip({ partner }: { partner: Partner }) {
  const isSponsor = partner.tier === 'sponsor';

  return (
    <a
      href={partner.website || '#'}
      target={partner.website ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={() => trackSponsoredClick(null, String(partner.id), 'ticker', null)}
      className={`flex items-center gap-3.5 px-6 py-3.5 rounded-2xl border backdrop-blur-md whitespace-nowrap transition-all duration-300 hover:scale-[1.03] flex-shrink-0 group ${
        isSponsor
          ? 'sponsor-chip-shimmer bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-400/30 hover:border-amber-400/50'
          : 'partner-chip-glow bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-blue-400/20 hover:border-blue-400/40'
      }`}
    >
      <div className={`rounded-xl overflow-hidden flex-shrink-0 ${
        isSponsor ? 'w-9 h-9 bg-amber-500/10 ring-1 ring-amber-400/20' : 'w-9 h-9 bg-white/10 ring-1 ring-white/10'
      }`}>
        <Image src={partner.logo_url} alt={partner.name} width={36} height={36} className="w-full h-full object-contain" />
      </div>
      <span className={`font-semibold text-sm ${isSponsor ? 'text-amber-200' : 'text-foreground/80'}`}>
        {partner.name}
      </span>
      {isSponsor ? (
        <Crown size={14} className="text-amber-400" />
      ) : (
        <ExternalLink size={12} className="text-foreground/30 group-hover:text-foreground/60 transition-colors" />
      )}
    </a>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */
export default function SponsorTicker({ partners = [] }: SponsorTickerProps) {
  if (partners.length === 0) return null;

  const useCarousel = partners.length >= 4;

  return (
    <div className="relative -mx-4 md:mx-0 rounded-3xl overflow-hidden border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/15">
            <Handshake size={16} className="text-amber-400" />
          </div>
          <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Our Partners</h2>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 md:mx-10 border-t border-white/5" />

      {/* Partner display */}
      <div className="py-6 px-6 md:px-10 relative">
        {useCarousel ? (
          <>
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <div className="group relative -mx-6 md:-mx-10">
              <div className="flex items-center gap-4 animate-ticker group-hover:[animation-play-state:paused]">
                {partners.map((p) => <PartnerChip key={`a-${p.id}`} partner={p} />)}
                {partners.map((p) => <PartnerChip key={`b-${p.id}`} partner={p} />)}
              </div>
            </div>
          </>
        ) : (
          /* Featured cards for 1-3 partners */
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-2xl mx-auto">
            {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
