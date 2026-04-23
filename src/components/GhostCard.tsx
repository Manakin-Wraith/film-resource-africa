'use client';

import { Plus, ArrowRight } from 'lucide-react';

export type GhostCardVariant = 'minimal' | 'branded';

interface GhostCardProps {
  variant: GhostCardVariant;
  sectionLabel?: string;
  valueProp?: string;
  slotsAvailable?: number;
  onClaim: () => void;
}

const sectionValueProps: Record<string, string> = {
  'Just Added': 'Introduce your brand to filmmakers discovering new opportunities',
  'Closing Soon': 'Reach filmmakers before the deadline — highest-intent placement',
  'Open Now': 'Be seen alongside live, actively open opportunities',
  'The New Wave: AI Filmmaking': 'Align your brand with the future of African film',
  'Latest News': 'Be part of the industry conversation',
};

export default function GhostCard({ variant, sectionLabel, valueProp, slotsAvailable = 3, onClaim }: GhostCardProps) {
  const resolvedValueProp = valueProp || (sectionLabel ? sectionValueProps[sectionLabel] : 'Partner with Film Resource Africa');

  if (variant === 'branded') {
    return (
      <div
        onClick={onClaim}
        className="ghost-card-branded relative rounded-[1.5rem] min-w-[320px] max-w-[360px] flex-shrink-0 snap-start cursor-pointer border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(245,158,11,0.2)]"
      >
        {/* Available ribbon */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border bg-amber-500/15 border-amber-500/25 text-amber-400">
            Available
          </span>
        </div>

        {/* Hatched image area */}
        <div className="h-[88px] ghost-card-shimmer flex items-center justify-center border-b border-amber-500/10">
          <span className="text-[11px] font-bold uppercase tracking-[3px] text-amber-500/25">
            Your Logo
          </span>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold font-heading mb-1 text-amber-400/80 group-hover:text-amber-400 transition-colors">
            Your Brand Here
          </h3>
          <p className="text-foreground/40 text-sm leading-relaxed flex-grow mb-4">
            {resolvedValueProp}
          </p>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
            <span className="text-[11px] font-medium text-foreground/30">
              {slotsAvailable} of 3 spots available
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Claim <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // variant === 'minimal'
  return (
    <div
      onClick={onClaim}
      className="ghost-card-minimal relative rounded-[1.5rem] min-w-[320px] max-w-[360px] flex-shrink-0 snap-start cursor-pointer border-2 border-dashed border-white/10 hover:border-amber-500/30 transition-all duration-300 group flex flex-col items-center justify-center text-center p-8 opacity-60 hover:opacity-100 hover:shadow-[0_16px_32px_-10px_rgba(245,158,11,0.12)]"
      style={{ minHeight: 220 }}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/15 group-hover:border-amber-500/40 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-amber-500/5">
        <Plus size={20} className="text-foreground/20 group-hover:text-amber-400 transition-colors" />
      </div>

      <h3 className="text-sm font-bold font-heading text-foreground/30 group-hover:text-amber-400/80 transition-colors mb-1">
        Your Brand Here
      </h3>

      <p className="text-foreground/20 text-xs leading-relaxed max-w-[200px] mb-3 group-hover:text-foreground/40 transition-colors">
        {resolvedValueProp}
      </p>

      {/* CTA — reveals on hover */}
      <span className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        Become a Partner <ArrowRight size={10} />
      </span>

      {/* Slot counter */}
      <span className="absolute bottom-4 right-4 text-[10px] text-foreground/15 group-hover:text-foreground/30 transition-colors">
        {slotsAvailable}/3
      </span>
    </div>
  );
}

export function NewsGhostCard({ variant, sectionLabel, valueProp, slotsAvailable = 3, onClaim }: GhostCardProps) {
  const resolvedValueProp = valueProp || (sectionLabel ? sectionValueProps[sectionLabel] : 'Partner with Film Resource Africa');

  if (variant === 'branded') {
    return (
      <div
        onClick={onClaim}
        className="ghost-card-branded rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group flex flex-col overflow-hidden cursor-pointer"
        style={{ background: 'var(--surface)' }}
      >
        {/* Shimmer image area */}
        <div className="relative w-full h-44 ghost-card-shimmer flex items-center justify-center overflow-hidden">
          <span className="text-[11px] font-bold uppercase tracking-[3px] text-amber-500/25">
            Your Logo
          </span>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border bg-amber-500/15 border-amber-500/25 text-amber-400 backdrop-blur-sm">
              Available
            </span>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold font-heading mb-2 text-amber-400/80 group-hover:text-amber-400 transition-colors leading-snug">
            Your Brand Here
          </h3>
          <p className="text-foreground/40 text-sm leading-relaxed flex-grow mb-4">
            {resolvedValueProp}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[11px] text-foreground/25">{slotsAvailable}/3 spots</span>
            <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold group-hover:gap-3 transition-all">
              Claim this spot <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // minimal variant for news
  return (
    <div
      onClick={onClaim}
      className="ghost-card-minimal rounded-xl border-2 border-dashed border-white/10 hover:border-amber-500/30 transition-all duration-300 group flex flex-col items-center justify-center text-center cursor-pointer opacity-60 hover:opacity-100 overflow-hidden"
      style={{ minHeight: 320, background: 'var(--surface)' }}
    >
      <div className="p-8 flex flex-col items-center justify-center flex-grow">
        <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/15 group-hover:border-amber-500/40 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-amber-500/5">
          <Plus size={24} className="text-foreground/20 group-hover:text-amber-400 transition-colors" />
        </div>

        <h3 className="text-base font-bold font-heading text-foreground/30 group-hover:text-amber-400/80 transition-colors mb-2">
          Your Brand Here
        </h3>

        <p className="text-foreground/20 text-xs leading-relaxed max-w-[220px] mb-4 group-hover:text-foreground/40 transition-colors">
          {resolvedValueProp}
        </p>

        <span className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          Become a Partner <ArrowRight size={10} />
        </span>

        <span className="absolute bottom-4 right-4 text-[10px] text-foreground/15 group-hover:text-foreground/30 transition-colors">
          {slotsAvailable}/3
        </span>
      </div>
    </div>
  );
}
