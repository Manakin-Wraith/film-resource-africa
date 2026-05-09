import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/members/onboarding/prefill?token=...
 *
 * Looks up the onboarding member, then searches `directory_listings` for an
 * approved row matching the member's email or company name. Returns the
 * subset of fields the onboarding form can pre-fill.
 *
 * Drives Item 4 of the intake-form hardening sprint (2026-05-08): members
 * who already have an approved directory listing shouldn't have to re-enter
 * (and re-upload) data we already hold.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const { data: member } = await supabase
    .from('members')
    .select('id, email, company_name, full_name')
    .eq('onboarding_token', token)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const email = member.email?.toLowerCase() ?? null;
  const companyName: string | null = member.company_name ?? null;

  /* Build an OR filter against directory_listings. Prefer email match
   * (more reliable identity) but fall back to name/company-name match. */
  const orClauses: string[] = [];
  if (email) {
    orClauses.push(`email.eq.${email}`);
    orClauses.push(`submitted_by_email.eq.${email}`);
  }
  if (companyName) {
    /* PostgREST .or() doesn't escape commas; safe here because company
     * names with literal commas are uncommon and would just miss the match. */
    const safe = companyName.replace(/,/g, '');
    orClauses.push(`name.ilike.${safe}`);
  }

  if (orClauses.length === 0) {
    return NextResponse.json({ prefill: null });
  }

  const { data: listings } = await supabase
    .from('directory_listings')
    .select('id, logo_url, bio, country, city, website')
    .eq('status', 'approved')
    .or(orClauses.join(','))
    .order('updated_at', { ascending: false })
    .limit(1);

  const hit = listings?.[0];
  if (!hit) {
    return NextResponse.json({ prefill: null });
  }

  return NextResponse.json({
    prefill: {
      logo_url: hit.logo_url ?? null,
      bio: hit.bio ?? null,
      country: hit.country ?? null,
      city: hit.city ?? null,
      website: hit.website ?? null,
      source_listing_id: hit.id,
    },
  });
}
