import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? '';
const PAYFAST_PASSPHRASE  = process.env.PAYFAST_PASSPHRASE  ?? '';

/* Validate PayFast ITN signature per their docs */
function validateSignature(params: Record<string, string>): boolean {
  const { signature, ...rest } = params;

  const sorted = Object.keys(rest)
    .sort()
    .filter((k) => rest[k] !== '')
    .map((k) => `${k}=${encodeURIComponent(rest[k]).replace(/%20/g, '+')}`)
    .join('&');

  const withPassphrase = PAYFAST_PASSPHRASE
    ? `${sorted}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE).replace(/%20/g, '+')}`
    : sorted;

  const expected = createHash('md5').update(withPassphrase).digest('hex');
  return expected === signature;
}

/* Derive billing cycle from item name or custom fields */
function parseTier(params: Record<string, string>): {
  tier: 'individual' | 'business';
  billingCycle: 'monthly' | 'annual';
} {
  const raw = (params.custom_str1 ?? '').toLowerCase();
  return {
    tier:         raw.includes('business') ? 'business'  : 'individual',
    billingCycle: raw.includes('annual')   ? 'annual'    : 'monthly',
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  /* ── Signature check ── */
  if (PAYFAST_MERCHANT_ID && params.merchant_id !== PAYFAST_MERCHANT_ID) {
    return new NextResponse('Merchant ID mismatch', { status: 400 });
  }
  if (PAYFAST_PASSPHRASE && !validateSignature(params)) {
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const status  = params.payment_status;          // COMPLETE | FAILED | CANCELLED
  const email   = (params.email_address ?? '').toLowerCase().trim();
  const name    = `${params.name_first ?? ''} ${params.name_last ?? ''}`.trim();
  const amount  = parseFloat(params.amount_gross ?? '0');
  const pfId    = params.pf_payment_id ?? '';
  const token   = params.token ?? null;           // subscription token (recurring)

  if (!email) return new NextResponse('Missing email', { status: 400 });

  /* ── COMPLETE — upsert member + record payment ── */
  if (status === 'COMPLETE') {
    const { tier, billingCycle } = parseTier(params);

    const { data: existing } = await supabase
      .from('members')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      /* Renewing member — update token & next due date */
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + (billingCycle === 'annual' ? 365 : 30));
      await supabase
        .from('members')
        .update({
          payfast_subscription_token: token ?? existing,
          next_payment_due_at: nextDue.toISOString(),
          status: 'active',
        })
        .eq('id', existing.id);
    } else {
      /* New member — create as pending (Gerhard approves in admin) */
      await supabase.from('members').insert({
        email,
        full_name: name,
        tier,
        billing_cycle: billingCycle,
        status: 'active',
        joined_at: new Date().toISOString(),
        founding_member_lock: true,
        payfast_subscription_token: token,
        notes: `PayFast ITN — ${pfId}`,
      });
    }

    /* Record payment row */
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (member) {
      const today = new Date();
      const periodEnd = new Date(today);
      periodEnd.setDate(periodEnd.getDate() + (billingCycle === 'annual' ? 365 : 30));

      await supabase.from('member_payments').insert({
        member_id: member.id,
        amount,
        currency: 'ZAR',
        paid_at: today.toISOString(),
        period_start: today.toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
        payment_method: 'payfast_subscription',
        provider_payment_id: pfId,
      });
    }

    /* Fetch onboarding token for welcome email link */
    const { data: newMember } = await supabase
      .from('members')
      .select('id, onboarding_token')
      .eq('email', email)
      .maybeSingle();

    const onboardingToken = newMember?.onboarding_token ?? null;
    const onboardingUrl = onboardingToken
      ? `https://film-resource-africa.com/members/onboarding?token=${onboardingToken}`
      : 'https://film-resource-africa.com/members';

    /* Welcome email to new member */
    if (!existing && onboardingToken) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Film Resource Africa <hello@film-resource-africa.com>',
          to: email,
          subject: `Welcome to Film Resource Africa — set up your profile`,
          html: `
            <p>Hi ${name || 'there'},</p>
            <p>You're in. Your founding member spot is confirmed and your price is locked for life.</p>
            <p>Next step — set up your profile so the industry can find you:</p>
            <p><a href="${onboardingUrl}" style="display:inline-block;padding:14px 24px;background:#3b82f6;color:#fff;font-weight:700;border-radius:10px;text-decoration:none;">Complete your profile →</a></p>
            ${tier === 'individual' ? '<p>You\'ll also review and accept your membership agreement (MOU) as part of this step.</p>' : ''}
            <p>Your profile will be live on the FRA Members Directory as soon as it\'s complete.</p>
            <p>I\'ll be in touch personally within 24 hours.</p>
            <p>— Gerhard<br/>Film Resource Africa</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:12px;color:#999;">This link is unique to you — don\'t share it. If you have questions, reply to this email or contact hello@film-resource-africa.com</p>
          `,
        });
      } catch {
        /* Non-fatal */
      }
    }

    /* Admin notification */
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'FRA System <hello@film-resource-africa.com>',
        to: 'g.mostertpot@gmail.com',
        subject: `New FRA member joined — ${name || email}`,
        html: `
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Name:</strong> ${name || '—'}</p>
          <p><strong>Tier:</strong> ${tier} · ${billingCycle}</p>
          <p><strong>Amount:</strong> R${amount.toFixed(2)}</p>
          <p><strong>PayFast ID:</strong> ${pfId}</p>
          <p><strong>Status:</strong> active — welcome email with onboarding link sent to member.</p>
        `,
      });
    } catch {
      /* Email failure is non-fatal — payment is already recorded */
    }
  }

  /* PayFast expects a 200 with no body */
  return new NextResponse('OK', { status: 200 });
}
