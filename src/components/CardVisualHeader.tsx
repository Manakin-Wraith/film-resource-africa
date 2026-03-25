'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getCategoryStyle, type CategoryStyle } from '@/lib/categoryConfig';

interface CardVisualHeaderProps {
  logo?: string | null;
  ogImage?: string | null;
  category?: string | null;
  title: string;
}

/**
 * Visual header zone for opportunity cards.
 *
 * Rendering priority:
 *   1. OG image as full-bleed hero + logo pill overlay (if both exist)
 *   2. OG image as full-bleed hero + category icon overlay (if OG but no logo)
 *   3. Logo centered on category gradient (if logo but no OG image)
 *   4. Generative pattern fallback — category gradient with decorative icon watermark
 */
export default function CardVisualHeader({ logo, ogImage, category, title }: CardVisualHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const catStyle = getCategoryStyle(category);
  const CatIcon = catStyle.icon;

  // Deterministic seed for the pattern based on title
  const seed = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const patternRotation = (seed % 6) * 30;
  const patternScale = 0.8 + (seed % 4) * 0.15;

  // Tier 1 & 2: OG image hero
  if (ogImage && !imgError) {
    return (
      <div className="relative h-36 overflow-hidden bg-black/20">
        <Image
          src={ogImage}
          alt=""
          fill
          sizes="360px"
          className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          onError={() => setImgError(true)}
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* Logo pill in bottom-left corner */}
        {logo && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-lg px-2 py-1.5 border border-white/10">
            <Image
              src={logo}
              alt=""
              width={20}
              height={20}
              className="object-contain max-w-[20px] max-h-[20px]"
            />
          </div>
        )}
        {/* Category pill in bottom-right corner */}
        <div className="absolute bottom-2.5 right-3">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/10 ${catStyle.color}`}>
            <CatIcon size={10} />
            {catStyle.label}
          </span>
        </div>
      </div>
    );
  }

  // Tier 3: Logo on category gradient
  if (logo) {
    return (
      <div className={`relative h-20 flex items-center justify-center bg-gradient-to-br ${catStyle.headerGradient} border-b border-white/5 overflow-hidden`}>
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 50%, currentColor 1px, transparent 1px)`,
            backgroundSize: `${12 + (seed % 8)}px ${12 + (seed % 8)}px`,
            transform: `rotate(${patternRotation}deg) scale(${patternScale})`,
          }}
        />
        <Image
          src={logo}
          alt=""
          width={96}
          height={36}
          className="object-contain max-h-[36px] opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-sm relative z-10"
        />
      </div>
    );
  }

  // Tier 4: Generative pattern fallback — category gradient + decorative watermark
  return (
    <div className={`relative h-20 flex items-center justify-center bg-gradient-to-br ${catStyle.headerGradient} border-b border-white/5 overflow-hidden`}>
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
          backgroundSize: `${10 + (seed % 6)}px ${10 + (seed % 6)}px`,
          transform: `rotate(${patternRotation}deg) scale(${patternScale})`,
        }}
      />
      {/* Large watermark icon */}
      <CatIcon size={40} className={`${catStyle.color} opacity-15 relative z-10`} />
    </div>
  );
}
