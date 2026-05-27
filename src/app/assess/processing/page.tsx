import { Suspense } from 'react';
import ProcessingScreen from '@/components/prs/ProcessingScreen';

export const metadata = { title: 'Scoring your project…', robots: { index: false } };

export default function ProcessingPage() {
  return (
    <Suspense fallback={null}>
      <ProcessingScreen />
    </Suspense>
  );
}
