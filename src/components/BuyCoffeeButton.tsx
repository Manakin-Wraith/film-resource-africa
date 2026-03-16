'use client';

import { useState } from 'react';
import { Coffee, Heart, X } from 'lucide-react';

export default function BuyCoffeeButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip */}
      {showTooltip && (
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl max-w-[260px] animate-in slide-in-from-bottom-2 fade-in duration-300">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            <X size={14} />
          </button>
          <p className="text-sm text-foreground/80 leading-relaxed pr-4">
            We&apos;re a small team keeping this resource free for African filmmakers.
          </p>
          <p className="text-xs text-foreground/50 mt-2 flex items-center gap-1">
            Every coffee keeps us going <Heart size={10} className="text-red-400 fill-red-400" />
          </p>
          <a
            href="https://pay.yoco.com/celebration-house-entertainment"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            <Coffee size={16} />
            Buy us a coffee
          </a>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3 rounded-full shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105 ${
          isHovered ? 'px-5 pr-6' : 'px-3.5'
        }`}
        aria-label="Buy the team a coffee"
      >
        <Coffee size={20} className="shrink-0" />
        <span
          className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isHovered ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          Buy the team a coffee
        </span>
      </button>
    </div>
  );
}
