import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';
import DirectoryClient from './DirectoryClient';

export const metadata: Metadata = {
  title: 'The Room | Film Resource Africa',
  description: 'The members directory — active filmmakers, production companies, and creative businesses across Africa.',
};

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function MembersDirectoryPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect('/members');

  const { data: members } = await supabase
    .from('members')
    .select(`
      id, username, full_name, tagline, tier, availability,
      disciplines, location_city, country, joined_at, founding_member_lock,
      avatar_url, company_name, company_tagline, company_founded_year,
      company_logo_url, company_specialisms
    `)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  return <DirectoryClient members={members ?? []} />;
}
