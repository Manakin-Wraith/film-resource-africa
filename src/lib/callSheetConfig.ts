import { Camera, Pen, Film, Sparkles, Handshake, Megaphone, HelpCircle } from 'lucide-react';

export interface CallSheetCategoryStyle {
  label: string;
  icon: typeof Camera;
  color: string;
  bg: string;
  border: string;
  borderLeft: string;
  filterActive: string;
}

export const callSheetCategories: Record<string, CallSheetCategoryStyle> = {
  'Key Crew': {
    label: 'Key Crew',
    icon: Camera,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    border: 'border-teal-500/30',
    borderLeft: 'border-l-teal-500',
    filterActive: 'from-teal-600 to-cyan-600',
  },
  "Writers' Room": {
    label: "Writers' Room",
    icon: Pen,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    border: 'border-indigo-500/30',
    borderLeft: 'border-l-indigo-500',
    filterActive: 'from-indigo-600 to-violet-600',
  },
  'Post & VFX': {
    label: 'Post & VFX',
    icon: Film,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    border: 'border-cyan-500/30',
    borderLeft: 'border-l-cyan-500',
    filterActive: 'from-cyan-600 to-sky-600',
  },
  'Emerging Talent': {
    label: 'Emerging Talent',
    icon: Sparkles,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    border: 'border-amber-500/30',
    borderLeft: 'border-l-amber-500',
    filterActive: 'from-amber-600 to-orange-600',
  },
  'Co-Production Partners': {
    label: 'Co-Production Partners',
    icon: Handshake,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    border: 'border-emerald-500/30',
    borderLeft: 'border-l-emerald-500',
    filterActive: 'from-emerald-600 to-green-600',
  },
  'Festival & Market Reps': {
    label: 'Festival & Market Reps',
    icon: Megaphone,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    border: 'border-rose-500/30',
    borderLeft: 'border-l-rose-500',
    filterActive: 'from-rose-600 to-pink-600',
  },
};

export const defaultCallSheetCategory: CallSheetCategoryStyle = {
  label: 'Uncategorised',
  icon: HelpCircle,
  color: 'text-foreground/40',
  bg: 'bg-white/5 border-white/10',
  border: 'border-white/10',
  borderLeft: 'border-l-white/20',
  filterActive: 'from-teal-600 to-cyan-600',
};

export function getCallSheetCategoryStyle(category?: string | null): CallSheetCategoryStyle {
  if (!category) return defaultCallSheetCategory;
  return callSheetCategories[category] || defaultCallSheetCategory;
}

export const projectStageLabels: Record<string, string> = {
  development: 'Development',
  'pre-production': 'Pre-Production',
  production: 'Production',
  'post-production': 'Post-Production',
};

export const compensationTypeLabels: Record<string, string> = {
  paid: 'Paid',
  stipend: 'Stipend',
  'deferred+paid': 'Deferred + Paid',
};
