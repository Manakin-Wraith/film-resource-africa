import type { LucideIcon } from 'lucide-react';
import { cw, type Colorway } from '@/lib/colorways';

type BadgeVariant = 'category' | 'status' | 'meta';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  /** Category colorway; omit (or 'neutral') for the white-alpha meta look */
  colorway?: Colorway;
  /**
   * category — soft /10 fill + /20 border (taxonomy pills)
   * status   — stronger /20 fill + /30 border (open/closing/featured)
   * meta     — neutral white-alpha chip regardless of colorway text
   */
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const sizeClasses: Record<BadgeSize, string> = {
  // text-xs (12px) is the floor — no 10/11px badge text
  sm: 'px-2.5 py-1 rounded-lg text-xs gap-1',
  md: 'px-3 py-1.5 rounded-xl text-xs gap-1.5',
};

const iconSizes: Record<BadgeSize, number> = { sm: 11, md: 12 };

// status fills per colorway — stronger than the category /10+/20 pair
const statusFill: Partial<Record<Colorway, string>> = {
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  teal: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  neutral: 'bg-foreground/[0.04] text-foreground/50 border-line',
};

export default function Badge({
  children,
  icon: Icon,
  colorway = 'neutral',
  variant = 'category',
  size = 'md',
  className = '',
}: BadgeProps) {
  const k = cw(colorway);
  const look =
    variant === 'status'
      ? (statusFill[colorway] ?? statusFill.neutral)
      : variant === 'meta'
        ? `bg-foreground/[0.04] border-line ${colorway === 'neutral' ? 'text-foreground/60' : k.text}`
        : `${k.bg} ${k.text}`;

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider border ${look} ${sizeClasses[size]} ${className}`}
    >
      {Icon && <Icon size={iconSizes[size]} aria-hidden />}
      {children}
    </span>
  );
}
