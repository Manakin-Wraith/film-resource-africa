import type { LucideIcon } from 'lucide-react';
import { Home, Newspaper, Clapperboard, Compass, Users } from 'lucide-react';
import { directoryCategories } from './directoryConfig';

/**
 * Single source of truth for site navigation.
 * Consumed by Header (desktop nav + mobile menu), MobileTabBar, and Footer —
 * change labels or structure here and all three stay in sync.
 *
 * Labels are wayfinding only: page H1s keep their editorial titles
 * ("The Call Sheet", "Industry Directory") and no URLs change.
 */

export interface NavLink {
  href: string;
  label: string;
  /** Renders a separator above this item in dropdown menus */
  dividerBefore?: boolean;
}

export interface NavGroup extends NavLink {
  /** Compact label for tight contexts (mobile tab bar) */
  shortLabel?: string;
  /** Present → desktop dropdown / indented mobile group */
  children?: NavLink[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Opportunities',
    href: '/directory',
    children: [
      ...directoryCategories.map((c) => ({ href: `/directory?cat=${c.slug}`, label: c.label })),
      { href: '/film-opportunities', label: 'By Country', dividerBefore: true },
      { href: '/projects', label: 'Projects in Development' },
    ],
  },
  { label: 'News', href: '/news' },
  { label: 'Crew & Jobs', href: '/call-sheet', shortLabel: 'Jobs' },
  { label: 'Companies', href: '/industry' },
  {
    label: 'Community',
    href: '/members',
    children: [
      { href: '/members', label: 'Members' },
      { href: '/community-spotlight', label: 'Spotlight' },
    ],
  },
];

/** Footer-only links — pages that left the top nav but stay live, plus submit */
export const footerExtras: NavLink[] = [
  { href: '/tech-pulse', label: 'Tech-Pulse' },
  { href: '/rebate-calculator', label: 'Rebate Calculator' },
  { href: '/submit', label: 'Submit an Opportunity' },
];

export interface MobileTab extends NavLink {
  icon: LucideIcon;
}

export const mobileTabs: MobileTab[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/directory', label: 'Opportunities', icon: Compass },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/call-sheet', label: 'Jobs', icon: Clapperboard },
  { href: '/members', label: 'Members', icon: Users },
];
