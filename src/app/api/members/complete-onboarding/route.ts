import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function splitToArray(val: string): string[] {
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, mouAccepted, ...form } = body;

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const { data: member } = await supabase
    .from('members')
    .select('id, tier, email, full_name')
    .eq('onboarding_token', token)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });

  const username = (form.username ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (username.length < 3) return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });

  /* Check username not taken by someone else */
  const { data: clash } = await supabase
    .from('members')
    .select('id')
    .eq('username', username)
    .neq('id', member.id)
    .maybeSingle();
  if (clash) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });

  const now = new Date().toISOString();
  const isIndividual = member.tier === 'individual';

  const update: Record<string, unknown> = {
    username,
    tagline:            form.tagline || null,
    bio:                isIndividual ? (form.bio || null) : null,
    avatar_url:         isIndividual ? (form.avatar_url || null) : null,
    cover_url:          form.cover_url || null,
    location_city:      form.location_city || null,
    country:            form.country || null,
    website:            form.website || null,
    onboarding_completed_at: now,
    profile_completed_at:    now,
    ...(isIndividual ? {
      availability:       form.availability || 'available',
      disciplines:        splitToArray(form.disciplines ?? ''),
      languages:          splitToArray(form.languages ?? ''),
      travel_willingness: form.travel_willingness || null,
      guilds:             form.guilds || null,
      reel_url:           form.reel_url || null,
      mou_signed_at:      mouAccepted ? now : null,
    } : {
      company_name:         form.company_name || member.full_name,
      company_tagline:      form.company_tagline || null,
      company_description:  form.company_description || null,
      company_founded_year: form.company_founded_year ? parseInt(form.company_founded_year) : null,
      company_specialisms:  splitToArray(form.company_specialisms ?? ''),
      company_looking_for:  form.company_looking_for || null,
      company_logo_url:     form.company_logo_url || null,
      languages:            splitToArray(form.languages ?? ''),
    }),
  };

  const { error } = await supabase
    .from('members')
    .update(update)
    .eq('id', member.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  /* Notify Gerhard that a member has completed their profile */
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'FRA System <hello@film-resource-africa.com>',
      to: 'g.mostertpot@gmail.com',
      subject: `FRA member profile live — ${member.full_name}`,
      html: `
        <p><strong>${member.full_name}</strong> has completed their onboarding.</p>
        <p><strong>Profile:</strong> https://film-resource-africa.com/members/${username}</p>
        <p><strong>Tier:</strong> ${member.tier}</p>
        ${isIndividual && mouAccepted ? '<p><strong>MOU:</strong> Accepted ✓</p>' : ''}
      `,
    });
  } catch {
    /* Non-fatal */
  }

  return NextResponse.json({ ok: true, username });
}
