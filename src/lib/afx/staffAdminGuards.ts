import type { StaffAccess } from '@/lib/afx/server/staffAccess';

export type Result = { ok: boolean; error?: string };

/** Only an admin may manage the roster. */
export function requireAdmin(staff: StaffAccess | null): Result {
  return staff?.role === 'admin' ? { ok: true } : { ok: false, error: 'Not authorized' };
}

/** Reject a blank add-by-email input before any lookup. */
export function validateEmail(email: string): Result {
  return email.trim() ? { ok: true } : { ok: false, error: 'Enter an email.' };
}

/** Guard a removal: no self-removal, no removing an admin, target must exist.
 *  `targetRole` is null when the user id is not on the team. */
export function canRemove(
  staff: StaffAccess,
  targetUserId: string,
  targetRole: 'reviewer' | 'admin' | null,
): Result {
  if (targetUserId === staff.userId) return { ok: false, error: "You can't remove yourself." };
  if (targetRole === null) return { ok: false, error: 'Not on the team.' };
  if (targetRole === 'admin') return { ok: false, error: "Admins can't be removed here." };
  return { ok: true };
}
