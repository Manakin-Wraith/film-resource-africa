'use client';

import { useCallback, useState } from 'react';
import { Share2, Check } from 'lucide-react';

/**
 * Share button for detail pages: native share sheet where available,
 * clipboard fallback elsewhere. Shares the canonical page URL.
 */
export default function ShareButton({ title, className = '' }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const shareData = {
      title,
      text: `Check out this opportunity: ${title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${title} — ${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  }, [title]);

  return (
    <button
      onClick={handleShare}
      className={`w-10 h-10 md:w-12 md:h-12 bg-foreground/[0.06] hover:bg-foreground/[0.10] rounded-full flex items-center justify-center transition-colors border border-line backdrop-blur-md ${className}`}
      aria-label="Share this opportunity"
    >
      {copied ? <Check size={18} className="text-success" /> : <Share2 size={18} />}
    </button>
  );
}
