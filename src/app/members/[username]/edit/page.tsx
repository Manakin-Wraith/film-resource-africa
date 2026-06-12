import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';
import EditProfileClient from './EditProfileClient';
import { MemberProfile } from '../page';

export const metadata = { title: 'Edit Profile' };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const sessionUser = await getSessionUser();

  if (!sessionUser?.email) redirect(`/login?next=/members/${username}/edit`);

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('username', username)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) notFound();

  if (member.email.toLowerCase() !== sessionUser.email.toLowerCase()) {
    redirect(`/members/${username}`);
  }

  return <EditProfileClient member={member as MemberProfile} />;
}
