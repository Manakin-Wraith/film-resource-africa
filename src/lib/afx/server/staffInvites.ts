import 'server-only';
import { afxAdmin } from '@/lib/afx/server/documentAccess';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { toInviteRow, sortInvites, inviteOutcome, type InviteRow, type RawInvite } from '@/lib/afx/inviteFunnel';
import { validateEmail } from '@/lib/afx/staffAdminGuards';

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://film-resource-africa.com';

export type InviteResult = { ok: boolean; error?: string; note?: string };

/** Invite a producer by email: create the afx_invites row + email them the AFX
 *  login link. Any staff. Idempotent for an already-invited/redeemed email. */
export async function createInvite(email: string): Promise<InviteResult> {
  if (!(await resolveStaff())) return { ok: false, error: 'Not authorized' };
  const valid = validateEmail(email);
  if (!valid.ok) return valid;
  const addr = email.trim().toLowerCase();

  const { data: existingRows } = await afxAdmin.from('afx_invites').select('redeemed_at').eq('email', addr).limit(1);
  const existing = (existingRows ?? [])[0] as { redeemed_at: string | null } | undefined;
  const outcome = inviteOutcome(existing ?? null);
  if (outcome === 'already_producer') return { ok: true, note: 'Already an AFX producer.' };
  if (outcome === 'already_invited') return { ok: true, note: 'Already invited.' };

  const { error: insErr } = await afxAdmin.from('afx_invites').insert({ email: addr });
  if (insErr) return { ok: false, error: 'Could not create the invite.' };

  const emailFailedNote = 'Invited, but the email failed to send — follow up manually.';
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Resend resolves with { error } for API-level failures (unverified domain,
    // suppressed recipient, missing key) instead of throwing — check it, don't
    // hide it behind a bare { ok: true }.
    const { error: sendErr } = await resend.emails.send({
      from: 'FRA System <hello@film-resource-africa.com>',
      to: addr,
      subject: "You're invited to AFX",
      html: `<p>You&apos;ve been invited to <strong>AFX</strong>, the Film Resource Africa finance layer for producers.</p>
<p>Sign in with <strong>this email address</strong> to get started:</p>
<p><a href="${SITE_URL}/afx/login" style="display:inline-block;padding:10px 18px;border-radius:9px;background:#1C1D21;color:#fff;text-decoration:none;font-weight:700">Sign in to AFX &rarr;</a></p>
<p style="color:#5E6066;font-size:13px">Or open ${SITE_URL}/afx/login and enter this email.</p>`,
      text: `You've been invited to AFX, the Film Resource Africa finance layer for producers.\n\nSign in with this email address at ${SITE_URL}/afx/login to get started.`,
    });
    if (sendErr) return { ok: true, note: emailFailedNote };
  } catch {
    return { ok: true, note: emailFailedNote };
  }
  return { ok: true };
}

/** Revoke a still-pending invite. Any staff. Activated invites are untouched. */
export async function revokeInvite(id: string): Promise<InviteResult> {
  if (!(await resolveStaff())) return { ok: false, error: 'Not authorized' };
  const { data, error } = await afxAdmin.from('afx_invites').delete().eq('id', id).is('redeemed_at', null).select('id');
  if (error) return { ok: false, error: 'Could not revoke the invite.' };
  if (!data || data.length === 0) return { ok: false, error: "Already activated — can't revoke." };
  return { ok: true };
}
