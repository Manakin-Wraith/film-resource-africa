'use server';

import type { NdaSignature, ProducerProfile, VettingKind } from '@/lib/afx/types';
import { persistProfile } from '@/lib/afx/server/producerStore';
import { submitForVetting, withdrawVetting, type SubmitResult } from '@/lib/afx/server/vettingStore';
import { signNda, withdrawNda } from '@/lib/afx/server/ndaStore';

export async function persistProfileAction(profile: ProducerProfile): Promise<void> {
  await persistProfile(profile);
}

export async function submitForVettingAction(input: { kind: VettingKind; targetId?: string }): Promise<SubmitResult> {
  return submitForVetting(input);
}

export async function withdrawVettingAction(input: { submissionId: string }): Promise<{ ok: boolean; error?: string }> {
  return withdrawVetting(input);
}

export async function signNdaAction(input: { name: string }): Promise<{ ok: boolean; signature?: NdaSignature; error?: string }> {
  return signNda(input);
}

export async function withdrawNdaAction(input: { lastSignerName?: string }): Promise<{ ok: boolean; error?: string }> {
  return withdrawNda(input);
}
