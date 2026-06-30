'use client';

import { useEffect, useRef } from 'react';
import type { ProducerProfile } from '@/lib/afx/types';

/** Persist `draft` ~`delay`ms after the last change. Skips the initial mount
 *  (the loaded value is already in the DB) so hydration doesn't trigger a write. */
export function useDebouncedAutosave(
  draft: ProducerProfile,
  save: (p: ProducerProfile) => Promise<void>,
  delay = 800,
): void {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { void save(draft); }, delay);
    return () => clearTimeout(t);
  }, [draft, save, delay]);
}
