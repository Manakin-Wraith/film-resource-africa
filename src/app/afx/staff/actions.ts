'use server';

import { startReview, verifyField, revertField, decide, type VerifyField } from '@/lib/afx/server/staffReview';

export async function startReviewAction(id: string) { return startReview(id); }
export async function verifyFieldAction(id: string, field: VerifyField) { return verifyField(id, field); }
export async function revertFieldAction(id: string, field: VerifyField) { return revertField(id, field); }
export async function decideAction(id: string, decision: 'approve' | 'request_changes', notes?: string) { return decide(id, decision, notes); }
