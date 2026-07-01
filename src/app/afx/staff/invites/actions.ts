'use server';

import { createInvite, revokeInvite } from '@/lib/afx/server/staffInvites';

export async function createInviteAction(email: string) { return createInvite(email); }
export async function revokeInviteAction(id: string) { return revokeInvite(id); }
