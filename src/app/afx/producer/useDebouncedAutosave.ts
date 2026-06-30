'use client';
import { useEffect, useRef, useState } from 'react';
import type { ProducerProfile } from '@/lib/afx/types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Persist `draft` ~`delay`ms after the last change. Skips the initial mount.
 *  Returns a status the UI can surface so a failed save is never silent. */
export function useDebouncedAutosave(
  draft: ProducerProfile,
  save: (p: ProducerProfile) => Promise<void>,
  delay = 800,
): SaveStatus {
  const first = useRef(true);
  const [status, setStatus] = useState<SaveStatus>('idle');
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      setStatus('saving');
      save(draft).then(
        () => setStatus('saved'),
        (e) => { console.error('[afx] autosave failed', e); setStatus('error'); },
      );
    }, delay);
    return () => clearTimeout(t);
  }, [draft, save, delay]);
  return status;
}
