'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, Plus, ExternalLink } from 'lucide-react';
import type { SponsoredPlacement } from '@/app/actions';

// ─── Value props per section (used for ghost fallback) ───────────────────────
const sectionValueProps: Record<string, string> = {
  'Just Added': 'Introduce your brand to filmmakers discovering new opportunities',
  'Closing Soon': 'Reach filmmakers before the deadline — highest-intent placement',
  'Open Now': 'Be seen alongside live, actively open opportunities',
  'The New Wave: AI Filmmaking': 'Align your brand with the future of African film',
  'Latest News': 'Be part of the industry conversation',
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface SponsoredCardProps {
  placement: SponsoredPlacement | null;  // null = unsold ghost slot
  sectionLabel: string;
  defaultVariant: 'minimal' | 'branded';
  slotsAvailable: number;
  onClaim: (placement: SponsoredPlacement | null) => void;
  onImpression?: (placement: SponsoredPlacement) => void;
}

interface NewsSponsoredCardProps {
  placement: SponsoredPlacement | null;
  sectionLabel: string;
  defaultVariant: 'minimal' | 'branded';
  slotsAvailable: number;
  onClaim: (placement: SponsoredPlacement | null) => void;
  onImpression?: (placement: SponsoredPlacement) => void;
}

// ─── Opportunity Row Card (horizontal scroll) ────────────────────────────────

export default function SponsoredCard({
  placement,
  sectionLabel,
  defaultVariant,
  slotsAvailable,
  onClaim,
  onImpression,
}: SponsoredCardProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (placement && onImpression && !tracked.current) {
      tracked.current = true;
      onImpression(placement);
    }
  }, [placement, onImpression]);

  // ── Branded partner card ──
  if (placement) {
    const variant = placement.variant || defaultVariant;

    if (variant === 'branded') {
      return (
        <div
          onClick={() => onClaim(placement)}
          className="ghost-card-branded relative rounded-[1.5rem] min-w-[320px] max-w-[360px] flex-shrink-0 snap-start cursor-pointer border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(245,158,11,0.2)]"
        >
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border bg-amber-500/15 border-amber-500/25 text-amber-400">
              Sponsored
            </span>
          </div>

          <div className="h-[88px] ghost-card-shimmer flex items-center justify-center border-b border-amber-500/10">
            {placement.partner_logo_url ? (
              <Image
                src={placement.partner_logo_url}
                alt={placement.partner_name}
                width={120}
                height={40}
                className="object-contain max-h-[40px]"
              />
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-[3px] text-amber-500/40">
                {placement.partner_name}
              </span>
            )}
          </div>

          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-lg font-bold font-heading mb-1 text-amber-400/80 group-hover:text-amber-400 transition-colors">
              {placement.partner_name}
            </h3>
            <p className="text-foreground/40 text-sm leading-relaxed flex-grow mb-4">
              {placement.cta_text || sectionValueProps[sectionLabel] || 'Partner with Film Resource Africa'}
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
              <span className="text-[11px] font-medium text-foreground/30">
                Sponsored
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {placement.cta_text || 'Learn More'} <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </div>
      );
    }

    // minimal variant for a sold placement
    return (
      <div
        onClick={() => onClaim(placement)}
        className="ghost-card-minimal relative rounded-[1.5rem] min-w-[320px] max-w-[360px] flex-shrink-0 snap-start cursor-pointer border-2 border-dashed border-amber-500/15 hover:border-amber-500/30 transition-all duration-300 group flex flex-col items-center justify-center text-center p-8 opacity-70 hover:opacity-100 hover:shadow-[0_16px_32px_-10px_rgba(245,158,11,0.12)]"
        style={{ minHeight: 220 }}
      >
        {placement.partner_logo_url ? (
          <Image
            src={placement.partner_logo_url}
            alt={placement.partner_name}
            width={80}
            height={30}
            className="object-contain max-h-[30px] mb-4 opacity-50 group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/15 group-hover:border-amber-500/40 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-amber-500/5">
            <span className="text-[10px] font-bold text-foreground/30 group-hover:text-amber-400 transition-colors">AD</span>
          </div>
        )}

        <h3 className="text-sm font-bold font-heading text-foreground/40 group-hover:text-amber-400/80 transition-colors mb-1">
          {placement.partner_name}
        </h3>
        <p className="text-foreground/25 text-xs leading-relaxed max-w-[200px] mb-3 group-hover:text-foreground/40 transition-colors">
          {placement.cta_text || sectionValueProps[sectionLabel] || 'Partner with Film Resource Africa'}
        </p>
        <span className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          {placement.cta_text || 'Learn More'} <ArrowRight size={10} />
        </span>
        <span className="absolute bottom-4 right-4 text-[10px] text-foreground/15">
          Sponsored
        </span>
      </div>
    );
  }

  // ── Unsold ghost slot (fallback) ──
  if (defaultVariant === 'branded') {
    return (
      <div
        onClick={() => onClaim(null)}
        className="ghost-card-branded relative rounded-[1.5rem] min-w-[320px] max-w-[360px] flex-shrink-0 snap-start cursor-pointer border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(245,158,11,0.2)]"
      >
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border bg-amber-500/15 border-amber-500/25 text-amber-400">
            Available
          </span>
        </div>
        <div className="h-[88px] ghost-card-shimmer flex items-center justify-center border-b border-amber-500/10">
          <span className="text-[11px] font-bold uppercase tracking-[3px] text-amber-500/25">Your Logo</span>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold font-heading mb-1 text-amber-400/80 group-hover:text-amber-400 transition-colors">
            Your Brand Here
          </h3>
          <p className="text-foreground/40 text-sm leading-relaxed flex-grow mb-4">
            {sectionValueProps[sectionLabel] || 'Partner with Film Resource Africa'}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
            <span className="text-[11px] font-medium text-foreground/30">{slotsAvailable} of 3 spots available</span>
            <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Claim <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // minimal ghost fallback
  return (
    <div
      onClick={() => onClaim(null)}
      className="ghost-card-minimal relative rounded-[1.5rem] min-w-[320px] max-w-[360px] flex-shrink-0 snap-start cursor-pointer border-2 border-dashed border-white/10 hover:border-amber-500/30 transition-all duration-300 group flex flex-col items-center justify-center text-center p-8 opacity-60 hover:opacity-100 hover:shadow-[0_16px_32px_-10px_rgba(245,158,11,0.12)]"
      style={{ minHeight: 220 }}
    >
      <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/15 group-hover:border-amber-500/40 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-amber-500/5">
        <Plus size={20} className="text-foreground/20 group-hover:text-amber-400 transition-colors" />
      </div>
      <h3 className="text-sm font-bold font-heading text-foreground/30 group-hover:text-amber-400/80 transition-colors mb-1">
        Your Brand Here
      </h3>
      <p className="text-foreground/20 text-xs leading-relaxed max-w-[200px] mb-3 group-hover:text-foreground/40 transition-colors">
        {sectionValueProps[sectionLabel] || 'Partner with Film Resource Africa'}
      </p>
      <span className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        Become a Partner <ArrowRight size={10} />
      </span>
      <span className="absolute bottom-4 right-4 text-[10px] text-foreground/15 group-hover:text-foreground/30 transition-colors">
        {slotsAvailable}/3
      </span>
    </div>
  );
}

// ─── News Grid Card (2-col layout) ───────────────────────────────────────────

export function NewsSponsoredCard({
  placement,
  sectionLabel,
  defaultVariant,
  slotsAvailable,
  onClaim,
  onImpression,
}: NewsSponsoredCardProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (placement && onImpression && !tracked.current) {
      tracked.current = true;
      onImpression(placement);
    }
  }, [placement, onImpression]);

  // ── Company Profile Card (Growth/Headline bundles) ──
  if (placement && placement.partner_about && (placement.partner_bundle === 'growth' || placement.partner_bundle === 'headline')) {
    const services = placement.partner_services ? placement.partner_services.split(',').map(s => s.trim()).filter(Boolean) : [];
    const ctaUrl = placement.partner_cta_url || '#';
    const ctaText = placement.cta_text || 'Visit Website';

    return (
      <div className="rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>
        {/* Featured image or logo banner */}
        <div className="relative w-full h-44 overflow-hidden">
          {placement.partner_featured_image_url ? (
            <>
              <Image
                src={placement.partner_featured_image_url}
                alt={placement.partner_name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/10 via-amber-500/5 to-purple-600/10 flex items-center justify-center">
              {placement.partner_logo_url ? (
                <Image src={placement.partner_logo_url} alt={placement.partner_name} width={120} height={40} className="object-contain max-h-[40px] opacity-60" />
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-[3px] text-purple-400/40">{placement.partner_name}</span>
              )}
            </div>
          )}
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border bg-purple-500/15 border-purple-500/25 text-purple-400 backdrop-blur-sm">
              Partner Profile
            </span>
          </div>
          {/* Logo overlay on featured image */}
          {placement.partner_featured_image_url && placement.partner_logo_url && (
            <div className="absolute bottom-3 left-4 z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden flex items-center justify-center">
                <Image src={placement.partner_logo_url} alt={placement.partner_name} width={32} height={32} className="object-contain" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold font-heading mb-2 text-foreground group-hover:text-purple-400 transition-colors leading-snug">
            {placement.partner_name}
          </h3>
          <p className="text-foreground/60 text-sm leading-relaxed mb-4">
            {placement.partner_about}
          </p>

          {/* Service tags */}
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {services.slice(0, 5).map(s => (
                <span key={s} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/10 border border-purple-500/15 text-purple-400">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
            <span className="text-[11px] text-foreground/25">Sponsored</span>
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                onClaim(placement);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400 text-xs font-bold hover:bg-purple-500/25 transition-all"
            >
              {ctaText} <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Branded partner card (news grid) — no profile data ──
  if (placement) {
    const variant = placement.variant || defaultVariant;

    if (variant === 'branded') {
      return (
        <div
          onClick={() => onClaim(placement)}
          className="ghost-card-branded rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group flex flex-col overflow-hidden cursor-pointer"
          style={{ background: 'var(--surface)' }}
        >
          <div className="relative w-full h-44 ghost-card-shimmer flex items-center justify-center overflow-hidden">
            {placement.partner_logo_url ? (
              <Image
                src={placement.partner_logo_url}
                alt={placement.partner_name}
                width={140}
                height={50}
                className="object-contain max-h-[50px]"
              />
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-[3px] text-amber-500/25">
                {placement.partner_name}
              </span>
            )}
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border bg-amber-500/15 border-amber-500/25 text-amber-400 backdrop-blur-sm">
                Sponsored
              </span>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-lg font-bold font-heading mb-2 text-amber-400/80 group-hover:text-amber-400 transition-colors leading-snug">
              {placement.partner_name}
            </h3>
            <p className="text-foreground/40 text-sm leading-relaxed flex-grow mb-4">
              {placement.cta_text || sectionValueProps[sectionLabel] || 'Partner with Film Resource Africa'}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[11px] text-foreground/25">Sponsored</span>
              <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold group-hover:gap-3 transition-all">
                {placement.cta_text || 'Learn More'} <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      );
    }

    // minimal sold placement (news)
    return (
      <div
        onClick={() => onClaim(placement)}
        className="ghost-card-minimal rounded-xl border-2 border-dashed border-amber-500/15 hover:border-amber-500/30 transition-all duration-300 group flex flex-col items-center justify-center text-center cursor-pointer opacity-70 hover:opacity-100 overflow-hidden"
        style={{ minHeight: 320, background: 'var(--surface)' }}
      >
        <div className="p-8 flex flex-col items-center justify-center flex-grow">
          {placement.partner_logo_url ? (
            <Image
              src={placement.partner_logo_url}
              alt={placement.partner_name}
              width={100}
              height={40}
              className="object-contain max-h-[40px] mb-5 opacity-50 group-hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/15 group-hover:border-amber-500/40 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-amber-500/5">
              <span className="text-xs font-bold text-foreground/30 group-hover:text-amber-400 transition-colors">AD</span>
            </div>
          )}
          <h3 className="text-base font-bold font-heading text-foreground/40 group-hover:text-amber-400/80 transition-colors mb-2">
            {placement.partner_name}
          </h3>
          <p className="text-foreground/25 text-xs leading-relaxed max-w-[220px] mb-4 group-hover:text-foreground/40 transition-colors">
            {placement.cta_text || sectionValueProps[sectionLabel] || 'Partner with Film Resource Africa'}
          </p>
          <span className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            {placement.cta_text || 'Learn More'} <ArrowRight size={10} />
          </span>
          <span className="absolute bottom-4 right-4 text-[10px] text-foreground/15">Sponsored</span>
        </div>
      </div>
    );
  }

  // ── Unsold ghost slot (news grid) ──
  if (defaultVariant === 'branded') {
    return (
      <div
        onClick={() => onClaim(null)}
        className="ghost-card-branded rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group flex flex-col overflow-hidden cursor-pointer"
        style={{ background: 'var(--surface)' }}
      >
        <div className="relative w-full h-44 ghost-card-shimmer flex items-center justify-center overflow-hidden">
          <span className="text-[11px] font-bold uppercase tracking-[3px] text-amber-500/25">Your Logo</span>
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
            {sectionValueProps[sectionLabel] || 'Partner with Film Resource Africa'}
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

  // minimal ghost fallback (news) — bold, premium CTA card
  return (
    <div
      onClick={() => onClaim(null)}
      className="relative rounded-xl border border-amber-500/25 hover:border-amber-500/50 transition-all duration-300 group flex flex-col overflow-hidden cursor-pointer"
      style={{ background: 'var(--surface)' }}
    >
      {/* Shimmer top banner */}
      <div className="relative w-full h-44 ghost-card-shimmer overflow-hidden flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/25 transition-all duration-300">
            <Plus size={28} className="text-amber-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[4px] text-amber-400/50 group-hover:text-amber-400/80 transition-colors">
            Your Logo Here
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold font-heading mb-2 text-amber-400">
          Get Your Brand Seen
        </h3>
        <p className="text-foreground/50 text-sm leading-relaxed mb-5">
          Reach thousands of African filmmakers, producers & creators right here — where they discover opportunities.
        </p>
        <div className="mt-auto">
          <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors">
            Become a Partner <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
