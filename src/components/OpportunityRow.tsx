'use client';

import { Opportunity } from '@/app/actions';
import { Calendar, DollarSign, ExternalLink, AlertTriangle, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { isNewListing, isUpdatedListing, formatDeadline } from '@/lib/dateUtils';
import { decodeHtmlEntities } from '@/lib/textUtils';
import SponsoredCard from './SponsoredCard';
import { trackOpportunityClick } from '@/lib/analytics';
import type { SponsoredPlacement } from '@/app/actions';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: Clock },
  closing_soon: { label: 'Closing Soon', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: AlertTriangle },
  upcoming: { label: 'Upcoming', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', icon: Calendar },
  closed: { label: 'Closed', color: 'text-foreground/40', bg: 'bg-white/5 border-white/10', icon: Clock },
};

interface OpportunityRowProps {
  opportunities: Opportunity[];
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onSelect: (opp: Opportunity) => void;
  defaultVariant?: 'minimal' | 'branded';
  placements?: SponsoredPlacement[];
  onSponsoredClaim?: (placement: SponsoredPlacement | null, section: string) => void;
  onSponsoredImpression?: (placement: SponsoredPlacement) => void;
}

export default function OpportunityRow({ opportunities, title, subtitle, icon, onSelect, defaultVariant = 'minimal', placements = [], onSponsoredClaim }: OpportunityRowProps) {
  if (!opportunities.length && !onSponsoredClaim) return null;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-2xl md:text-3xl font-bold font-heading">{title}</h2>
          <span className="text-foreground/40 text-sm font-medium ml-auto">{opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}</span>
        </div>
        {subtitle && (
          <p className="text-foreground/40 text-sm pl-[52px]">{subtitle}</p>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory -mx-4 px-4">
        {/* Sponsored card — 1st position */}
        {onSponsoredClaim && (
          <SponsoredCard
            key="sponsored-0"
            placement={placements[0] || null}
            sectionLabel={title}
            defaultVariant={defaultVariant}
            slotsAvailable={placements.length > 0 ? 0 : 1}
            onClaim={(p) => onSponsoredClaim(p, title)}
          />
        )}

        {opportunities.map((opp) => {
          const status = statusConfig[opp.application_status || 'open'];
          const StatusIcon = status.icon;
          const catStyle = getCategoryStyle(opp.category);
          const CatIcon = catStyle.icon;
          const isFree = /free/i.test(opp["Cost"] || '');
          const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;

          return (
            <div
              key={opp.id}
              onClick={() => { trackOpportunityClick(opp.title, opp.category || '', title); onSelect(opp); }}
              className={`glass-card rounded-[1.5rem] p-6 min-w-[320px] max-w-[360px] flex-shrink-0 snap-start cursor-pointer border border-white/10 hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(59,130,246,0.25)] transition-all duration-300 group flex flex-col border-l-[3px] ${catStyle.borderLeft}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${status.bg} ${status.color}`}>
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                  {isNewListing(opp.created_at, opp.id) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-purple-500/30 text-purple-300 animate-pulse">
                      <Sparkles size={10} />
                      NEW
                    </span>
                  )}
                  {!isNewListing(opp.created_at, opp.id) && isUpdatedListing(opp.created_at, opp.updated_at, opp.id) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-amber-500/20 border-amber-500/30 text-amber-300">
                      <RefreshCw size={10} />
                      UPDATED
                    </span>
                  )}
                </div>
                {deadline && deadline.urgency !== 'passed' && deadline.urgency !== 'normal' && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border whitespace-nowrap ${
                    deadline.urgency === 'critical'
                      ? 'bg-red-500/20 border-red-500/30 text-red-400'
                      : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  }`}>
                    <AlertTriangle size={10} />
                    {deadline.countdownText}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold font-heading mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                {opp.title}
              </h3>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium border ${catStyle.bg} ${catStyle.color}`}>
                  <CatIcon size={10} />
                  {catStyle.label}
                </span>
                {isFree && (
                  <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                    <DollarSign size={10} /> Free
                  </span>
                )}
              </div>

              <p className="text-foreground/60 text-sm line-clamp-2 flex-grow mb-4">
                {decodeHtmlEntities(opp["What Is It?"])}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-accent text-sm font-medium">
                  <Calendar size={14} />
                  <span className="truncate max-w-[200px]">{opp["Next Deadline"]?.substring(0, 40) || "Check website"}</span>
                </div>
                <ExternalLink size={16} className="text-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
