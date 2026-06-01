import { DollarSign, GraduationCap, Target, Film, Sparkles, CalendarClock, LayoutGrid } from 'lucide-react';

// Public Directory taxonomy — driven by opportunities.directory_destination.
// This is the source of truth for the /directory hub, its filter chips, the
// nav dropdown, and (Phase 2) the dedicated per-category pages.

export interface DirectoryCategory {
  key: string;        // matches opportunities.directory_destination
  slug: string;       // URL segment / ?cat= value
  label: string;      // desktop label
  shortLabel: string; // mobile chip label
  description: string;
  icon: typeof DollarSign;
  color: string;
  bg: string;
  border: string;
  borderLeft: string;
  filterActive: string;
}

export const directoryCategories: DirectoryCategory[] = [
  {
    key: 'directory_funds',
    slug: 'funds',
    label: 'Funds',
    shortLabel: 'Funds',
    description: 'Standing film funds, co-production funds, and commission financing for African projects.',
    icon: DollarSign,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    border: 'border-green-500/30',
    borderLeft: 'border-l-green-500',
    filterActive: 'from-green-600 to-emerald-600',
  },
  {
    key: 'directory_grants',
    slug: 'grants',
    label: 'Grants',
    shortLabel: 'Grants',
    description: 'Non-repayable grant programmes and awards open to African filmmakers.',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    border: 'border-emerald-500/30',
    borderLeft: 'border-l-emerald-500',
    filterActive: 'from-emerald-600 to-teal-600',
  },
  {
    key: 'directory_festivals',
    slug: 'festivals',
    label: 'Festivals',
    shortLabel: 'Festivals',
    description: 'Film festivals with cash prizes or material awards for selected films.',
    icon: Film,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    border: 'border-rose-500/30',
    borderLeft: 'border-l-rose-500',
    filterActive: 'from-rose-600 to-pink-600',
  },
  {
    key: 'directory_labs_fellowships',
    slug: 'labs-fellowships',
    label: 'Labs & Fellowships',
    shortLabel: 'Labs',
    description: 'Labs, fellowships, residencies, workshops, accelerators, and training programmes.',
    icon: GraduationCap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    border: 'border-blue-500/30',
    borderLeft: 'border-l-blue-500',
    filterActive: 'from-blue-600 to-cyan-600',
  },
  {
    key: 'directory_markets_pitching',
    slug: 'markets-pitching',
    label: 'Markets & Pitching',
    shortLabel: 'Markets',
    description: 'Co-production markets, pitch competitions, and industry financing forums.',
    icon: Target,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    border: 'border-amber-500/30',
    borderLeft: 'border-l-amber-500',
    filterActive: 'from-amber-600 to-orange-600',
  },
  {
    key: 'directory_ai',
    slug: 'ai',
    label: 'AI & Emerging Tech',
    shortLabel: 'AI',
    description: 'AI and emerging-technology opportunities for filmmakers and storytellers.',
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    border: 'border-purple-500/30',
    borderLeft: 'border-l-purple-500',
    filterActive: 'from-purple-600 to-violet-600',
  },
  {
    key: 'directory_calls',
    slug: 'calls',
    label: 'Calls & Deadlines',
    shortLabel: 'Calls',
    description: 'Time-bound open calls, festival call-for-entries, commissions, and bursaries.',
    icon: CalendarClock,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    border: 'border-teal-500/30',
    borderLeft: 'border-l-teal-500',
    filterActive: 'from-teal-600 to-cyan-600',
  },
];

export const PUBLIC_DIRECTORY_KEYS = directoryCategories.map((c) => c.key);

const bySlug = new Map(directoryCategories.map((c) => [c.slug, c]));
const byKey = new Map(directoryCategories.map((c) => [c.key, c]));

export function getDirectoryCategoryBySlug(slug?: string | null): DirectoryCategory | undefined {
  if (!slug) return undefined;
  return bySlug.get(slug);
}

export const defaultDirectoryStyle: DirectoryCategory = {
  key: 'uncategorised',
  slug: 'uncategorised',
  label: 'Uncategorised',
  shortLabel: 'Other',
  description: '',
  icon: LayoutGrid,
  color: 'text-foreground/40',
  bg: 'bg-white/5 border-white/10',
  border: 'border-white/10',
  borderLeft: 'border-l-white/20',
  filterActive: 'from-primary to-blue-600',
};

export function getDirectoryStyle(dest?: string | null): DirectoryCategory {
  if (!dest) return defaultDirectoryStyle;
  return byKey.get(dest) || defaultDirectoryStyle;
}
