'use server';

import type { ProducerProfile, VettingKind } from '@/lib/afx/types';
import { persistProfile } from '@/lib/afx/server/producerStore';
import { submitForVetting, withdrawVetting, type SubmitResult } from '@/lib/afx/server/vettingStore';

export async function persistProfileAction(profile: ProducerProfile): Promise<void> {
  await persistProfile(profile);
}

export async function submitForVettingAction(input: { kind: VettingKind; targetId?: string }): Promise<SubmitResult> {
  return submitForVetting(input);
}

export async function withdrawVettingAction(input: { submissionId: string }): Promise<{ ok: boolean; error?: string }> {
  return withdrawVetting(input);
}
