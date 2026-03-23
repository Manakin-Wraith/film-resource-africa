'use client';

import { trackOutboundClick } from '@/lib/analytics';

/**
 * Wrapper for external <a> tags that fires an outbound_click event.
 * Renders as a normal anchor — tracking is fire-and-forget.
 */
export default function TrackOutboundLink({
  href,
  context,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { context: string }) {
  return (
    <a
      href={href}
      {...props}
      onClick={(e) => {
        if (href) trackOutboundClick(href, context);
        props.onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
