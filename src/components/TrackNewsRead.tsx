'use client';

import { useEffect, useRef } from 'react';
import { trackNewsArticleRead } from '@/lib/analytics';

/** Drop into a news article server page to fire a read event once on mount. */
export default function TrackNewsRead({ slug, category }: { slug: string; category: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      trackNewsArticleRead(slug, category);
    }
  }, [slug, category]);
  return null;
}
