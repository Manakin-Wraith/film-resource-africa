import { DollarSign, GraduationCap, Target, Film, Sparkles, CalendarClock, LayoutGrid } from 'lucide-react';
import { cw, type Colorway } from './colorways';

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

// Colorway → the style fields this taxonomy carries
function styleOf(c: Colorway) {
  const k = cw(c);
  return { color: k.text, bg: k.bg, border: k.border, borderLeft: k.borderLeft, filterActive: k.filterActive };
}

export const directoryCategories: DirectoryCategory[] = [
  {
    key: 'directory_funds',
    slug: 'funds',
    label: 'Funds',
    shortLabel: 'Funds',
    description: 'Standing film funds, co-production funds, and commission financing for African projects.',
    icon: DollarSign,
    ...styleOf('green'),
  },
  {
    key: 'directory_grants',
    slug: 'grants',
    label: 'Grants',
    shortLabel: 'Grants',
    description: 'Non-repayable grant programmes and awards open to African filmmakers.',
    icon: DollarSign,
    ...styleOf('emerald'),
  },
  {
    key: 'directory_festivals',
    slug: 'festivals',
    label: 'Festivals',
    shortLabel: 'Festivals',
    description: 'Film festivals with cash prizes or material awards for selected films.',
    icon: Film,
    ...styleOf('rose'),
  },
  {
    key: 'directory_labs_fellowships',
    slug: 'labs-fellowships',
    label: 'Labs & Fellowships',
    shortLabel: 'Labs',
    description: 'Labs, fellowships, residencies, workshops, accelerators, and training programmes.',
    icon: GraduationCap,
    ...styleOf('blue'),
  },
  {
    key: 'directory_markets_pitching',
    slug: 'markets-pitching',
    label: 'Markets & Pitching',
    shortLabel: 'Markets',
    description: 'Co-production markets, pitch competitions, and industry financing forums.',
    icon: Target,
    ...styleOf('amber'),
  },
  {
    key: 'directory_ai',
    slug: 'ai',
    label: 'AI & Emerging Tech',
    shortLabel: 'AI',
    description: 'AI and emerging-technology opportunities for filmmakers and storytellers.',
    icon: Sparkles,
    ...styleOf('purple'),
  },
  {
    key: 'directory_calls',
    slug: 'calls',
    label: 'Calls & Deadlines',
    shortLabel: 'Calls',
    description: 'Time-bound open calls, festival call-for-entries, commissions, and bursaries.',
    icon: CalendarClock,
    ...styleOf('teal'),
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
  ...styleOf('neutral'),
};

export function getDirectoryStyle(dest?: string | null): DirectoryCategory {
  if (!dest) return defaultDirectoryStyle;
  return byKey.get(dest) || defaultDirectoryStyle;
}
