import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { resolveStaff } from '@/lib/afx/server/staffAccess';
import { loadProducerState } from '@/lib/afx/server/producerStore';
import ProducerProfileClient from './ProducerProfileClient';
import AccessWall from './AccessWall';

export default async function AfxProducerPage() {
  const user = await getSessionUser();
  if (!user) redirect('/afx/login');

  const state = await loadProducerState();
  if (!state) return <AccessWall />; // authenticated but not invited

  const staff = await resolveStaff();
  return <ProducerProfileClient initial={state.profile} initialSubmissions={state.submissions} staffRole={staff?.role ?? null} />;
}
