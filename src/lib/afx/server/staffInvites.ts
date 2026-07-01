import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { toInviteRow, sortInvites, type InviteRow, type RawInvite } from '@/lib/afx/inviteFunnel';

const PER_PAGE = 1000;

/** uuid → last_sign_in_at from the auth admin API, paging until exhausted.
 *  A page error stops paging; unresolved ids simply stay absent (→ null downstream). */
async function lastActiveMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await afxAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data) break;
    for (const u of data.users) if (u.last_sign_in_at) map.set(u.id, u.last_sign_in_at);
    if (data.users.length < PER_PAGE) break;
  }
  return map;
}

/** The producer invite funnel for the staff view. Any staff; [] for anyone else. */
export async function listInvites(): Promise<InviteRow[]> {
  if (!(await resolveStaff())) return [];
  const { data } = await afxAdmin.from('afx_invites').select('id, email, created_at, redeemed_at, redeemed_by');
  const invites = (data ?? []) as RawInvite[];
  if (invites.length === 0) return [];

  const redeemedIds = [...new Set(invites.map((i) => i.redeemed_by).filter((x): x is string => !!x))];
  const producerMap = new Map<string, { name?: string; company?: string }>();
  let lastActive = new Map<string, string>();
  if (redeemedIds.length > 0) {
    const { data: producers } = await afxAdmin.from('afx_producers').select('user_id, profile').in('user_id', redeemedIds);
    for (const p of (producers ?? []) as { user_id: string; profile: { name?: string; company?: string } }[]) {
      producerMap.set(p.user_id, { name: p.profile?.name, company: p.profile?.company });
    }
    lastActive = await lastActiveMap();
  }

  const rows = invites.map((i) =>
    toInviteRow(
      i,
      i.redeemed_by ? producerMap.get(i.redeemed_by) ?? null : null,
      i.redeemed_by ? lastActive.get(i.redeemed_by) ?? null : null,
    ),
  );
  return sortInvites(rows);
}
