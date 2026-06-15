import type { Opportunity } from '@/app/actions';
import LeadStory from './LeadStory';
import ClosingThisWeek from './ClosingThisWeek';

export default function FrontPageGrid({ lead, closing }: { lead: Opportunity | null; closing: Opportunity[] }) {
  if (!lead) {
    return (
      <section className="mt-10">
        <ClosingThisWeek opportunities={closing} />
      </section>
    );
  }
  return (
    <section className="grid md:grid-cols-[1.4fr_1fr] gap-10 md:gap-0 mt-10">
      <LeadStory opp={lead} />
      <ClosingThisWeek opportunities={closing} />
    </section>
  );
}
