'use client';

import { Newspaper, AlertTriangle, Sparkles, Lightbulb, Star, Clapperboard } from 'lucide-react';

const newsCategoryGradients: Record<string, { gradient: string; color: string; icon: typeof Newspaper }> = {
  industry_news: { gradient: 'from-blue-900/60 to-blue-950/80', color: 'text-blue-400', icon: Newspaper },
  deadline_alert: { gradient: 'from-red-900/60 to-red-950/80', color: 'text-red-400', icon: AlertTriangle },
  new_opportunity: { gradient: 'from-green-900/60 to-green-950/80', color: 'text-green-400', icon: Sparkles },
  tip: { gradient: 'from-amber-900/60 to-amber-950/80', color: 'text-amber-400', icon: Lightbulb },
  community_spotlight: { gradient: 'from-yellow-900/60 to-yellow-950/80', color: 'text-yellow-400', icon: Star },
  trailer: { gradient: 'from-pink-900/60 to-pink-950/80', color: 'text-pink-400', icon: Clapperboard },
  industry_analysis: { gradient: 'from-blue-900/60 to-blue-950/80', color: 'text-blue-400', icon: Newspaper },
  opportunities: { gradient: 'from-green-900/60 to-green-950/80', color: 'text-green-400', icon: Sparkles },
};

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
  const config = newsCategoryGradients[category] || newsCategoryGradients.industry_news;
  const Icon = config.icon;

  // Deterministic pattern from title
  const seed = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rotation = (seed % 6) * 30;
  const dotSize = 10 + (seed % 6);

  return (
    <div className={`relative w-full ${className} overflow-hidden bg-linear-to-br ${config.gradient}`}>
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
