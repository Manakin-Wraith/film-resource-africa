import { DollarSign, GraduationCap, Target, Film, Sparkles, HelpCircle } from 'lucide-react';

export interface CategoryStyle {
  label: string;
  icon: typeof DollarSign;
  color: string;
  bg: string;
  border: string;
  borderLeft: string;
  filterActive: string;
}

export const categoryConfig: Record<string, CategoryStyle> = {
  'Funds & Grants': {
    label: 'Funds & Grants',
    icon: DollarSign,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    border: 'border-green-500/30',
    borderLeft: 'border-l-green-500',
    filterActive: 'from-green-600 to-emerald-600',
  },
  'Labs & Fellowships': {
    label: 'Labs & Fellowships',
    icon: GraduationCap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    border: 'border-blue-500/30',
    borderLeft: 'border-l-blue-500',
    filterActive: 'from-blue-600 to-cyan-600',
  },
  'Markets & Pitching': {
    label: 'Markets & Pitching',
    icon: Target,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    border: 'border-amber-500/30',
    borderLeft: 'border-l-amber-500',
    filterActive: 'from-amber-600 to-orange-600',
  },
  'Festivals': {
    label: 'Festivals',
    icon: Film,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    border: 'border-rose-500/30',
    borderLeft: 'border-l-rose-500',
    filterActive: 'from-rose-600 to-pink-600',
  },
  'AI & Emerging Tech': {
    label: 'AI & Emerging Tech',
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    border: 'border-purple-500/30',
    borderLeft: 'border-l-purple-500',
    filterActive: 'from-purple-600 to-violet-600',
  },
};

export const defaultCategory: CategoryStyle = {
  label: 'Uncategorised',
  icon: HelpCircle,
  color: 'text-foreground/40',
  bg: 'bg-white/5 border-white/10',
  border: 'border-white/10',
  borderLeft: 'border-l-white/20',
  filterActive: 'from-primary to-blue-600',
};

export function getCategoryStyle(category?: string | null): CategoryStyle {
  if (!category) return defaultCategory;
  return categoryConfig[category] || defaultCategory;
}
