import type { Metadata } from 'next';
import IntakeForm from '@/components/prs/IntakeForm';

export const metadata: Metadata = {
  title: 'Assess Your Project — Project Readiness Score',
  description:
    "A written diagnosis of your film project, scored across concept, market, commercial logic, South African alignment, and execution readiness — plus the SA funding pathways your project might fit. Free, ~10 minutes.",
  openGraph: {
    title: 'Assess Your Project — FRA Project Readiness Score',
    description:
      'Twenty-five questions, seven sections, about ten minutes. Get a specialist read on where your film project actually stands.',
  },
};

export default function AssessPage() {
  return (
    <div className="prs-root">
      <IntakeForm />
    </div>
  );
}
