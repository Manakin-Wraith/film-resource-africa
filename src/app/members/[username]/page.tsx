import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';
import IndividualProfile from './IndividualProfile';
import BusinessProfile from './BusinessProfile';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type Credit = {
  year: number;
  title: string;
  role: string;
  type: 'feature' | 'series' | 'short' | 'doc' | 'other';
  imdb_url?: string;
  trailer_url?: string;
  other_url?: string;
};

export type Recognition = {
  year: number;
  award: string;
};

export type MemberProfile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  cover_backdrop: boolean;
  logo_backdrop: boolean;
  tier: 'individual' | 'business';
  status: string;
  availability: 'available' | 'busy' | 'selective';
  disciplines: string[];
  languages: string[];
  travel_willingness: string | null;
  guilds: string | null;
  reel_url: string | null;
  website: string | null;
  location_city: string | null;
  country: string | null;
  credits: Credit[];
  joined_at: string;
  founding_member_lock: boolean;
  company_name: string | null;
  company_tagline: string | null;
  company_description: string | null;
  company_founded_year: number | null;
  company_specialisms: string[];
  company_looking_for: string | null;
  company_logo_url: string | null;
  productions_count: number | null;
  recognition: Recognition[];
};

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  const { data } = await supabase
    .from('members')
    .select('full_name, tagline, tier, company_name')
    .eq('username', username)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return { title: 'Member | Film Resource Africa' };

  const name = data.tier === 'business' ? (data.company_name ?? data.full_name) : data.full_name;
  return {
    title: `${name} | Film Resource Africa`,
    description: data.tagline ?? undefined,
  };
}

export default async function MemberProfilePage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const [{ data: member }, sessionUser] = await Promise.all([
    supabase.from('members').select('*').eq('username', username).eq('status', 'active').maybeSingle(),
    getSessionUser(),
  ]);

  if (!member) notFound();

  const m = member as MemberProfile;
  const isOwner = !!sessionUser?.email && sessionUser.email.toLowerCase() === m.email.toLowerCase();
  const isLoggedIn = !!sessionUser?.email;

  return m.tier === 'business'
    ? <BusinessProfile member={m} isOwner={isOwner} isLoggedIn={isLoggedIn} />
    : <IndividualProfile member={m} isOwner={isOwner} isLoggedIn={isLoggedIn} />;
}
