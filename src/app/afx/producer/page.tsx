import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { loadProducerState } from '@/lib/afx/server/producerStore';
import ProducerProfileClient from './ProducerProfileClient';
import AccessWall from './AccessWall';

export default async function AfxProducerPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/afx/producer');

  const state = await loadProducerState();
  if (!state) return <AccessWall />; // authenticated but not invited

  return <ProducerProfileClient initial={state.profile} />;
}
