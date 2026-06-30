'use server';

import type { ProducerProfile } from '@/lib/afx/types';
import { persistProfile } from '@/lib/afx/server/producerStore';

export async function persistProfileAction(profile: ProducerProfile): Promise<void> {
  await persistProfile(profile);
}
