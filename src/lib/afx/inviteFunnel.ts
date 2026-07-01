/** A raw afx_invites row as selected by the data layer. */
export interface RawInvite {
  id: string;
  email: string;
  created_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
}

/** One funnel row for the staff invites view. */
export interface InviteRow {
  id: string;
  email: string;
  status: 'pending' | 'activated';
  invitedAt: string;
  activatedAt: string | null;
  producerName: string | null;
  company: string | null;
  lastActiveAt: string | null;
}

/** Project a raw invite into a funnel row. Producer identity + last-active are
 *  folded in only for activated invites; pending/unresolved fields stay null. */
export function toInviteRow(
  raw: RawInvite,
  producer: { name?: string; company?: string } | null,
  lastActiveAt: string | null,
): InviteRow {
  const activated = raw.redeemed_at != null;
  return {
    id: raw.id,
    email: raw.email,
    status: activated ? 'activated' : 'pending',
    invitedAt: raw.created_at,
    activatedAt: raw.redeemed_at,
    producerName: activated ? (producer?.name || null) : null,
    company: activated ? (producer?.company || null) : null,
    lastActiveAt: activated ? lastActiveAt : null,
  };
}

/** Pending first (oldest invite first); then activated (most recently activated first).
 *  Returns a new array — does not mutate the input. */
export function sortInvites(rows: InviteRow[]): InviteRow[] {
  return [...rows].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    if (a.status === 'pending') return a.invitedAt.localeCompare(b.invitedAt);
    return (b.activatedAt ?? '').localeCompare(a.activatedAt ?? '');
  });
}
