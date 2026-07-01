import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { requireAdmin, validateEmail, canRemove, type Result } from '@/lib/afx/staffAdminGuards';

export interface StaffMember {
  userId: string;
  email: string;
  role: 'reviewer' | 'admin';
  createdAt: string;
}

const PER_PAGE = 1000;

/** uuid → email map from the auth admin API, paging until exhausted.
 *  `failed` is true if any page errored — callers must distinguish a genuine
 *  "not found" from a transient auth-API failure (an empty map means both). */
async function emailMap(): Promise<{ map: Map<string, string>; failed: boolean }> {
  const map = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await afxAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data) return { map, failed: true };
    for (const u of data.users) if (u.email) map.set(u.id, u.email);
    if (data.users.length < PER_PAGE) break;
  }
  return { map, failed: false };
}

/** Resolve an email (case-insensitive) to an auth user id. `failed` signals a
 *  transient lookup failure (distinct from `userId: null` = no such account). */
async function resolveUserIdByEmail(email: string): Promise<{ userId: string | null; failed: boolean }> {
  const target = email.trim().toLowerCase();
  if (!target) return { userId: null, failed: false };
  const { map, failed } = await emailMap();
  if (failed) return { userId: null, failed: true };
  for (const [id, mail] of map) if (mail.toLowerCase() === target) return { userId: id, failed: false };
  return { userId: null, failed: false };
}

/** Roster for the admin team page. Admin-only; [] for anyone else. */
export async function listStaff(): Promise<StaffMember[]> {
  const staff = await resolveStaff();
  if (!requireAdmin(staff).ok) return [];
  const { data } = await afxAdmin.from('afx_staff').select('user_id, role, created_at');
  const rows = (data ?? []) as { user_id: string; role: 'reviewer' | 'admin'; created_at: string }[];
  if (rows.length === 0) return [];
  const { map: emails } = await emailMap();
  return rows
    .map((r) => ({ userId: r.user_id, email: emails.get(r.user_id) ?? '—', role: r.role, createdAt: r.created_at }))
    .sort((a, b) => (a.role === b.role ? a.createdAt.localeCompare(b.createdAt) : a.role === 'admin' ? -1 : 1));
}

/** Add a reviewer by email. Admin-only. Idempotent for an already-present user. */
export async function addStaffByEmail(email: string): Promise<Result> {
  const staff = await resolveStaff();
  const gate = requireAdmin(staff);
  if (!gate.ok) return gate;
  const valid = validateEmail(email);
  if (!valid.ok) return valid;
  const { userId, failed } = await resolveUserIdByEmail(email);
  if (failed) return { ok: false, error: 'Could not verify the email right now — please retry.' };
  if (!userId) return { ok: false, error: 'No account for that email — they must sign in to FRA at least once first.' };
  const { error } = await afxAdmin
    .from('afx_staff')
    .upsert({ user_id: userId, role: 'reviewer' }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) return { ok: false, error: 'Could not add reviewer.' };
  return { ok: true };
}

/** Remove a reviewer. Admin-only; the admin row and self are protected. */
export async function removeStaff(userId: string): Promise<Result> {
  const staff = await resolveStaff();
  const gate = requireAdmin(staff);
  if (!gate.ok || !staff) return { ok: false, error: 'Not authorized' };
  const { data: row } = await afxAdmin
    .from('afx_staff').select('role').eq('user_id', userId)
    .maybeSingle<{ role: 'reviewer' | 'admin' }>();
  const allowed = canRemove(staff, userId, row?.role ?? null);
  if (!allowed.ok) return allowed;
  const { error } = await afxAdmin.from('afx_staff').delete().eq('user_id', userId);
  if (error) return { ok: false, error: 'Could not remove reviewer.' };
  return { ok: true };
}
