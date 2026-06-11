import { DollarSign, GraduationCap, Target, Film, Sparkles, HelpCircle } from 'lucide-react';
import { cw, type Colorway } from './colorways';

export interface CategoryStyle {
  label: string;
  icon: typeof DollarSign;
  color: string;
  bg: string;
  border: string;
  borderLeft: string;
  filterActive: string;
  headerGradient: string;
}

// Colorway → the style fields this taxonomy carries
function styleOf(c: Colorway) {
  const k = cw(c);
  return {
    color: k.text,
    bg: k.bg,
    border: k.border,
    borderLeft: k.borderLeft,
    filterActive: k.filterActive,
    headerGradient: k.headerGradient,
  };
}

export const categoryConfig: Record<string, CategoryStyle> = {
  'Funds & Grants': { label: 'Funds & Grants', icon: DollarSign, ...styleOf('green') },
  'Labs & Fellowships': { label: 'Labs & Fellowships', icon: GraduationCap, ...styleOf('blue') },
  'Markets & Pitching': { label: 'Markets & Pitching', icon: Target, ...styleOf('amber') },
  'Festivals': { label: 'Festivals', icon: Film, ...styleOf('rose') },
  'AI & Emerging Tech': { label: 'AI & Emerging Tech', icon: Sparkles, ...styleOf('purple') },
  'Labs & Workshops': { label: 'Labs & Workshops', icon: GraduationCap, ...styleOf('blue') },
  'Labs & Residencies': { label: 'Labs & Residencies', icon: GraduationCap, ...styleOf('blue') },
  'Funding & Grants': { label: 'Funding & Grants', icon: DollarSign, ...styleOf('green') },
  'Training & Education': { label: 'Training & Education', icon: GraduationCap, ...styleOf('blue') },
};

export const defaultCategory: CategoryStyle = {
  label: 'Uncategorised',
  icon: HelpCircle,
  ...styleOf('neutral'),
};

export function getCategoryStyle(category?: string | null): CategoryStyle {
  if (!category) return defaultCategory;
  return categoryConfig[category] || defaultCategory;
}
