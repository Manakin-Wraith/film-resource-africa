import { Newspaper, AlertTriangle, Sparkles, Lightbulb, Star, Clapperboard } from 'lucide-react';
import { cw, type Colorway } from './colorways';

// News category taxonomy — the single source for /news, /news/[slug], and
// NewsImageFallback (previously three duplicated inline maps).

export interface NewsCategoryStyle {
  label: string;
  icon: typeof Newspaper;
  colorway: Colorway;
  color: string;        // badge/icon text
  bg: string;           // badge fill + border
  imageFallback: string; // deep gradient for image-less cards
}

function entry(label: string, icon: typeof Newspaper, c: Colorway): NewsCategoryStyle {
  const k = cw(c);
  return { label, icon, colorway: c, color: k.text, bg: k.bg, imageFallback: k.imageFallback };
}

export const newsCategories: Record<string, NewsCategoryStyle> = {
  industry_news: entry('Industry News', Newspaper, 'blue'),
  deadline_alert: entry('Deadline Alert', AlertTriangle, 'red'),
  new_opportunity: entry('New Opportunity', Sparkles, 'green'),
  tip: entry('Pro Tip', Lightbulb, 'amber'),
  community_spotlight: entry('Community Spotlight', Star, 'yellow'),
  trailer: entry('Trailer', Clapperboard, 'pink'),
  industry_analysis: entry('Industry Analysis', Newspaper, 'blue'),
  opportunities: entry('Opportunities', Sparkles, 'green'),
};

export function getNewsCategory(category?: string | null): NewsCategoryStyle {
  if (!category) return newsCategories.industry_news;
  return newsCategories[category] || newsCategories.industry_news;
}
