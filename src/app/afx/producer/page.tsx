import { focusProducer, assertFocusProducerHasProjects } from '@/lib/afx/seed';
import ProducerProfileClient from './ProducerProfileClient';

export default function AfxProducerPage() {
  // dev-only invariant: focus producer must own ≥1 active project
  if (process.env.NODE_ENV !== 'production') assertFocusProducerHasProjects();
  return <ProducerProfileClient initial={focusProducer} />;
}
