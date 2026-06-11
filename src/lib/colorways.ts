// Single source of truth for category colorways.
//
// Every category-color map in the app (directory, opportunity categories,
// industry types, call-sheet, news, partners) composes from these entries
// instead of hardcoding Tailwind color utilities. All values are complete
// string literals — Tailwind's JIT only generates classes it can see verbatim,
// so never build these strings dynamically.
//
// A config may override a single field where its surface genuinely diverges
// (e.g. call-sheet's emerald gradient) — spread cw(...) first, then override.

export type Colorway =
  | 'blue'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'amber'
  | 'yellow'
  | 'red'
  | 'neutral';

export interface ColorwayClasses {
  /** Foreground accent, e.g. badge/icon text */
  text: string;
  /** Tinted fill + soft border (composite, as used by badge/pill `bg` fields) */
  bg: string;
  /** Stronger standalone border */
  border: string;
  /** 3px category spine on cards */
  borderLeft: string;
  /** Active filter-chip / CTA gradient */
  filterActive: string;
  /** Card visual-header wash */
  headerGradient: string;
  /** Hover glow shadow */
  glow: string;
  /** Deep gradient for image-less news cards */
  imageFallback: string;
}

export const colorways: Record<Colorway, ColorwayClasses> = {
  blue: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    border: 'border-blue-500/30',
    borderLeft: 'border-l-blue-500',
    filterActive: 'from-blue-600 to-cyan-600',
    headerGradient: 'from-blue-500/15 via-cyan-500/10 to-sky-500/5',
    glow: 'group-hover:shadow-blue-500/10',
    imageFallback: 'from-blue-900/60 to-blue-950/80',
  },
  green: {
    text: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    border: 'border-green-500/30',
    borderLeft: 'border-l-green-500',
    filterActive: 'from-green-600 to-emerald-600',
    headerGradient: 'from-green-500/15 via-emerald-500/10 to-teal-500/5',
    glow: 'group-hover:shadow-green-500/10',
    imageFallback: 'from-green-900/60 to-green-950/80',
  },
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    border: 'border-emerald-500/30',
    borderLeft: 'border-l-emerald-500',
    filterActive: 'from-emerald-600 to-teal-600',
    headerGradient: 'from-emerald-500/15 via-teal-500/10 to-green-500/5',
    glow: 'group-hover:shadow-emerald-500/10',
    imageFallback: 'from-emerald-900/60 to-emerald-950/80',
  },
  teal: {
    text: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    border: 'border-teal-500/30',
    borderLeft: 'border-l-teal-500',
    filterActive: 'from-teal-600 to-cyan-600',
    headerGradient: 'from-teal-500/15 via-cyan-500/10 to-emerald-500/5',
    glow: 'group-hover:shadow-teal-500/10',
    imageFallback: 'from-teal-900/60 to-teal-950/80',
  },
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    border: 'border-cyan-500/30',
    borderLeft: 'border-l-cyan-500',
    filterActive: 'from-cyan-600 to-sky-600',
    headerGradient: 'from-cyan-500/15 via-sky-500/10 to-blue-500/5',
    glow: 'group-hover:shadow-cyan-500/10',
    imageFallback: 'from-cyan-900/60 to-cyan-950/80',
  },
  indigo: {
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    border: 'border-indigo-500/30',
    borderLeft: 'border-l-indigo-500',
    filterActive: 'from-indigo-600 to-violet-600',
    headerGradient: 'from-indigo-500/15 via-violet-500/10 to-purple-500/5',
    glow: 'group-hover:shadow-indigo-500/10',
    imageFallback: 'from-indigo-900/60 to-indigo-950/80',
  },
  purple: {
    text: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    border: 'border-purple-500/30',
    borderLeft: 'border-l-purple-500',
    filterActive: 'from-purple-600 to-violet-600',
    headerGradient: 'from-purple-500/15 via-violet-500/10 to-indigo-500/5',
    glow: 'group-hover:shadow-purple-500/10',
    imageFallback: 'from-purple-900/60 to-purple-950/80',
  },
  pink: {
    text: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
    border: 'border-pink-500/30',
    borderLeft: 'border-l-pink-500',
    filterActive: 'from-pink-600 to-rose-600',
    headerGradient: 'from-pink-500/15 via-rose-500/10 to-fuchsia-500/5',
    glow: 'group-hover:shadow-pink-500/10',
    imageFallback: 'from-pink-900/60 to-pink-950/80',
  },
  rose: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    border: 'border-rose-500/30',
    borderLeft: 'border-l-rose-500',
    filterActive: 'from-rose-600 to-pink-600',
    headerGradient: 'from-rose-500/15 via-pink-500/10 to-fuchsia-500/5',
    glow: 'group-hover:shadow-rose-500/10',
    imageFallback: 'from-rose-900/60 to-rose-950/80',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    border: 'border-amber-500/30',
    borderLeft: 'border-l-amber-500',
    filterActive: 'from-amber-600 to-orange-600',
    headerGradient: 'from-amber-500/15 via-orange-500/10 to-yellow-500/5',
    glow: 'group-hover:shadow-amber-500/10',
    imageFallback: 'from-amber-900/60 to-amber-950/80',
  },
  yellow: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    border: 'border-yellow-500/30',
    borderLeft: 'border-l-yellow-500',
    filterActive: 'from-yellow-600 to-amber-600',
    headerGradient: 'from-yellow-500/15 via-amber-500/10 to-orange-500/5',
    glow: 'group-hover:shadow-yellow-500/10',
    imageFallback: 'from-yellow-900/60 to-yellow-950/80',
  },
  red: {
    text: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    border: 'border-red-500/30',
    borderLeft: 'border-l-red-500',
    filterActive: 'from-red-600 to-rose-600',
    headerGradient: 'from-red-500/15 via-rose-500/10 to-orange-500/5',
    glow: 'group-hover:shadow-red-500/10',
    imageFallback: 'from-red-900/60 to-red-950/80',
  },
  neutral: {
    text: 'text-foreground/40',
    bg: 'bg-white/5 border-white/10',
    border: 'border-white/10',
    borderLeft: 'border-l-white/20',
    filterActive: 'from-primary to-blue-600',
    headerGradient: 'from-white/10 via-white/5 to-transparent',
    glow: 'group-hover:shadow-white/10',
    imageFallback: 'from-zinc-900/60 to-zinc-950/80',
  },
};

export function cw(c: Colorway): ColorwayClasses {
  return colorways[c] ?? colorways.neutral;
}
