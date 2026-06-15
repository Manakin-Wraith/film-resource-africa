import Link from 'next/link';
import type { Opportunity } from '@/app/actions';
import { formatDeadline } from '@/lib/dateUtils';

// urgency → readable-on-light token color for the "N days" marker
const daysColor: Record<string, string> = {
  critical: 'text-urgent',
  warning: 'text-[color:var(--color-primary-text)]',
  normal: 'text-[color:var(--color-moss-text)]',
  passed: 'text-foreground/40',
};

export default function ClosingThisWeek({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <aside className="md:pl-10">
      <div className="flex items-baseline justify-between pb-3 border-b border-line-strong">
        <h3 className="font-heading font-semibold text-[19px] tracking-[-0.01em] text-foreground">Upcoming deadlines</h3>
        <Link href="/directory" className="text-xs text-foreground/50 hover:text-[color:var(--color-primary-text)] transition-colors">All deadlines →</Link>
      </div>
      {opportunities.length === 0 && (
        <p className="py-4 text-[13px]" style={{ color: 'var(--foreground-tertiary)' }}>No upcoming deadlines right now.</p>
      )}
      {opportunities.map((opp, i) => {
        const dl = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
        const last = i === opportunities.length - 1;
        return (
          <Link
            key={opp.id}
            href={`/opportunities/${opp.slug}`}
            className={`group flex items-baseline justify-between gap-3.5 py-3.5 ${last ? '' : 'border-b border-line'}`}
          >
            <span className="min-w-0">
              <span className="block font-heading font-semibold text-[15px] leading-[1.25] tracking-[-0.005em] text-foreground transition-colors group-hover:text-[color:var(--color-primary-text)]">
                {opp.title}
              </span>
              {opp.category && (
                <span className="block mt-[3px] text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--foreground-tertiary)' }}>
                  {opp.category}
                </span>
              )}
            </span>
            {dl && dl.urgency !== 'passed' && (
              <span className={`font-mono text-xs font-semibold flex-none tabular-nums ${daysColor[dl.urgency]}`}>
                {dl.daysLeft} {dl.daysLeft === 1 ? 'day' : 'days'}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
