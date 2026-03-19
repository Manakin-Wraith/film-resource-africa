'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem } from '@/app/actions';
import { Clapperboard, Play, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRelativeDate } from '@/lib/dateUtils';

interface NowScreeningSectionProps {
  trailers: NewsItem[];
}

export default function NowScreeningSection({ trailers }: NowScreeningSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!trailers.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/20">
            <Clapperboard size={20} className="text-pink-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading">Now Screening</h2>
            <p className="text-sm text-foreground/40 mt-0.5">Trailers & first looks from African cinema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} className="text-foreground/60" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} className="text-foreground/60" />
          </button>
          <Link
            href="/news?filter=trailer"
            className="hidden sm:inline-flex text-sm font-semibold text-pink-400 hover:text-pink-300 transition-colors items-center gap-1 ml-2"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {trailers.map((item) => {
          const href = item.slug ? `/news/${item.slug}` : '#';

          return (
            <Link
              key={item.id}
              href={href}
              className="flex-shrink-0 w-[300px] md:w-[320px] glass-card rounded-[1.25rem] border border-pink-500/10 hover:border-pink-500/20 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(236,72,153,0.2)] transition-all duration-300 group flex flex-col overflow-hidden"
            >
              {/* 16:9 thumbnail with play overlay */}
              <div className="relative w-full aspect-video overflow-hidden">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    sizes="320px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 to-purple-900/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-pink-500/80 backdrop-blur-sm flex items-center justify-center border border-pink-400/30 group-hover:scale-110 group-hover:bg-pink-500/90 transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                    <Play size={20} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 border border-pink-500/30 text-pink-300 backdrop-blur-sm">
                    <Clapperboard size={10} />
                    Trailer
                  </span>
                </div>
              </div>

              {/* Text content */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-sm font-bold font-heading leading-snug group-hover:text-pink-400 transition-colors line-clamp-2 mb-2">
                  {item.title}
                </h3>
                <span className="text-foreground/30 text-xs mt-auto">
                  {formatRelativeDate(item.published_at)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
