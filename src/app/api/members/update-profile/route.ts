import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('members')
    .select('id, tier')
    .eq('email', sessionUser.email.toLowerCase())
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const body = await req.json();
  const isBusiness = member.tier === 'business';

  const update: Record<string, unknown> = {
    tagline:       body.tagline ?? null,
    cover_url:     body.cover_url || null,
    website:       body.website || null,
    location_city: body.location_city || null,
    country:       body.country || null,
    credits:       Array.isArray(body.credits) ? body.credits : [],
    updated_at:    new Date().toISOString(),
  };

  if (isBusiness) {
    Object.assign(update, {
      company_name:         body.company_name || null,
      company_tagline:      body.tagline ?? null,
      company_description:  body.bio || null,
      company_logo_url:     body.avatar_url || null,
      company_founded_year: body.company_founded_year ?? null,
      company_specialisms:  Array.isArray(body.company_specialisms) ? body.company_specialisms : [],
      company_looking_for:  body.company_looking_for || null,
      recognition:          Array.isArray(body.recognition) ? body.recognition : [],
    });
  } else {
    Object.assign(update, {
      bio:                body.bio || null,
      avatar_url:         body.avatar_url || null,
      availability:       body.availability || 'available',
      disciplines:        Array.isArray(body.disciplines) ? body.disciplines : [],
      languages:          Array.isArray(body.languages) ? body.languages : [],
      travel_willingness: body.travel_willingness || null,
      guilds:             body.guilds || null,
      reel_url:           body.reel_url || null,
    });
  }

  const { error } = await supabase
    .from('members')
    .update(update)
    .eq('id', member.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
