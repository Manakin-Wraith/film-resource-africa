'use client';

import Link from 'next/link';
import { cw, type Colorway } from '@/lib/colorways';

type CardPadding = 'none' | 'sm' | 'md';

interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'className'> {
  /** Renders a next/link wrapper */
  href?: string;
  /** Hover affordance: border strengthen + canonical -translate-y-0.5 lift */
  interactive?: boolean;
  /** none — consumer owns padding (e.g. visual-header cards); sm = p-4; md = p-5 */
  padding?: CardPadding;
  /** 3px colored category spine on the left edge */
  accent?: Colorway;
  className?: string;
  children: React.ReactNode;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
};

export default function Card({
  href,
  interactive = false,
  padding = 'none',
  accent,
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    'block rounded-xl border border-line bg-surface overflow-hidden',
    interactive ? 'hover:border-line-strong hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group' : '',
    accent ? `border-l-[3px] ${cw(accent).borderLeft}` : '',
    paddingClasses[padding],
    className,
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
