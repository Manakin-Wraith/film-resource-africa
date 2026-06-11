'use client';

import { getNewsCategory } from '@/lib/newsCategoryConfig';

interface NewsImageFallbackProps {
  category: string;
  title: string;
  className?: string;
}

/**
 * Gradient + watermark fallback for news cards when image_url is null.
 * Mirrors the Tier 4 pattern from CardVisualHeader for visual consistency.
 */
export default function NewsImageFallback({ category, title, className = 'h-36' }: NewsImageFallbackProps) {
  const config = getNewsCategory(category);
  const Icon = config.icon;

  // Deterministic pattern from title
  const seed = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rotation = (seed % 6) * 30;
  const dotSize = 10 + (seed % 6);

  return (
    <div className={`relative w-full ${className} overflow-hidden bg-linear-to-br ${config.imageFallback}`}>
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
          backgroundSize: `${dotSize}px ${dotSize}px`,
          transform: `rotate(${rotation}deg)`,
        }}
      />
      {/* Watermark icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon size={48} className={`${config.color} opacity-15`} />
      </div>
    </div>
  );
}
