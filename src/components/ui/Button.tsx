'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a next/link (or <a> with external) instead of <button> */
  href?: string;
  /** With href: opens in a new tab with rel safety attrs */
  external?: boolean;
  /** Canonical loading state: spinner replaces left icon, button disabled */
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  iconSize?: number;
}

export type ButtonProps = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps>;

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary-hover text-white font-semibold',
  outline: 'border border-line-strong text-foreground font-semibold hover:bg-foreground/[0.06]',
  ghost: 'text-foreground/60 font-medium hover:text-foreground hover:bg-foreground/[0.06]',
  soft: 'bg-foreground/[0.04] border border-line text-foreground font-medium hover:border-line-mid hover:bg-foreground/[0.08]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px] rounded-lg min-h-[36px] gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl min-h-[44px] gap-2',
  lg: 'px-7 py-3.5 text-sm rounded-xl min-h-[48px] gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  external,
  loading = false,
  fullWidth,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconSize = 15,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center transition-colors cursor-pointer',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    loading ? 'opacity-70 pointer-events-none' : '',
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {loading ? (
        <span className="w-4 h-4 border-2 border-foreground/30 border-t-current rounded-full animate-spin" aria-hidden />
      ) : (
        LeftIcon && <LeftIcon size={iconSize} aria-hidden />
      )}
      {children}
      {RightIcon && <RightIcon size={iconSize} aria-hidden />}
    </>
  );

  if (href) {
    const anchorRest = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...anchorRest}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} disabled={disabled || loading} {...buttonRest}>
      {content}
    </button>
  );
}
