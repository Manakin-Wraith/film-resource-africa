'use client';

import type { LucideIcon } from 'lucide-react';

/* The one filter chip used by all listing surfaces (directory, industry,
   call-sheet). Canonical behaviors: 44px target, snap-start for the mobile
   scroll row, category-colored icon when inactive, neutral icon when active. */

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  /** Compact label for mobile chips; defaults to label */
  shortLabel?: string;
  icon?: LucideIcon;
  /** Icon color class while inactive (category colorway text) */
  iconClass?: string;
  count?: number;
}

export default function FilterChip({
  active,
  onClick,
  label,
  shortLabel,
  icon: Icon,
  iconClass = 'text-foreground/40',
  count,
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm whitespace-nowrap snap-start flex-shrink-0 transition-all border ${
        active
          ? 'border-line-strong text-foreground bg-surface-raised'
          : 'border-line text-foreground/60 hover:border-line-mid hover:text-foreground bg-surface'
      }`}
    >
      {Icon && <Icon size={16} className={active ? 'text-foreground' : iconClass} aria-hidden />}
      <span className="md:hidden">{shortLabel ?? label}</span>
      <span className="hidden md:inline">{label}</span>
      {count !== undefined && <span className="text-[11px] font-bold opacity-50">{count}</span>}
    </button>
  );
}

/** Canonical scrollable chip row (mobile horizontal scroll w/ edge fade, wraps on desktop) */
export function FilterChipRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin snap-x snap-mandatory scroll-fade-x ${className}`}>
      {children}
    </div>
  );
}
