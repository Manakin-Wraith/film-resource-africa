'use client';

import Image from 'next/image';
import { trackSponsoredClick } from '@/app/actions';
import type { Partner } from '@/app/actions';

interface SponsorTickerProps {
  partners?: Partner[];
}

/* ── Editorial logo + wordmark ──────────────────────────────────────────────── */
function PartnerChip({ partner }: { partner: Partner }) {
  return (
    <a
      href={partner.website || '#'}
      target={partner.website ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={() => trackSponsoredClick(null, String(partner.id), 'ticker', null)}
      className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group opacity-70 hover:opacity-100 transition-opacity duration-200"
    >
      <Image
        src={partner.logo_url}
        alt={partner.name}
        width={32}
        height={32}
        className="w-8 h-8 object-contain shrink-0"
      />
      <span className="font-medium text-sm text-foreground/80 group-hover:text-foreground transition-colors">
        {partner.name}
      </span>
    </a>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */
export default function SponsorTicker({ partners = [] }: SponsorTickerProps) {
  if (partners.length === 0) return null;

  const useCarousel = partners.length >= 4;

  return (
    <div className="relative py-5">
      <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
        <h2 className="text-[11px] font-semibold text-foreground/50 uppercase tracking-[0.2em] whitespace-nowrap shrink-0">
          In partnership with
        </h2>
        <div className="flex-1 min-w-0 relative">
          {useCarousel ? (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />
              <div className="group overflow-hidden">
                <div className="flex items-center gap-10 animate-ticker group-hover:[animation-play-state:paused]">
                  {partners.map((p) => <PartnerChip key={`a-${p.id}`} partner={p} />)}
                  {partners.map((p) => <PartnerChip key={`b-${p.id}`} partner={p} />)}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-8 flex-wrap">
              {partners.map((p) => <PartnerChip key={p.id} partner={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
