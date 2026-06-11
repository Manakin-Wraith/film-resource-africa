import { Camera, Pen, Film, Sparkles, Handshake, Megaphone, HelpCircle } from 'lucide-react';
import { cw, type Colorway } from './colorways';

export interface CallSheetCategoryStyle {
  label: string;
  icon: typeof Camera;
  color: string;
  bg: string;
  border: string;
  borderLeft: string;
  filterActive: string;
}

// Colorway → the style fields this taxonomy carries
function styleOf(c: Colorway) {
  const k = cw(c);
  return { color: k.text, bg: k.bg, border: k.border, borderLeft: k.borderLeft, filterActive: k.filterActive };
}

export const callSheetCategories: Record<string, CallSheetCategoryStyle> = {
  'Key Crew': { label: 'Key Crew', icon: Camera, ...styleOf('teal') },
  "Writers' Room": { label: "Writers' Room", icon: Pen, ...styleOf('indigo') },
  'Post & VFX': { label: 'Post & VFX', icon: Film, ...styleOf('cyan') },
  'Emerging Talent': { label: 'Emerging Talent', icon: Sparkles, ...styleOf('amber') },
  'Co-Production Partners': {
    label: 'Co-Production Partners',
    icon: Handshake,
    ...styleOf('emerald'),
    // call-sheet's emerald pairs with green, not the directory's teal
    filterActive: 'from-emerald-600 to-green-600',
  },
  'Festival & Market Reps': { label: 'Festival & Market Reps', icon: Megaphone, ...styleOf('rose') },
};

export const defaultCallSheetCategory: CallSheetCategoryStyle = {
  label: 'Uncategorised',
  icon: HelpCircle,
  ...styleOf('neutral'),
  // call-sheet surface defaults to its teal accent gradient
  filterActive: cw('teal').filterActive,
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
