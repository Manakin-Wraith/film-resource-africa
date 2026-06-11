'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, DollarSign, ExternalLink, Plus, Heart, Clock, AlertTriangle, LayoutGrid, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Opportunity, voteOpportunity } from '@/app/actions';
import OpportunityModal from './OpportunityModal';
import { directoryCategories, getDirectoryStyle, getDirectoryCategoryBySlug, PUBLIC_DIRECTORY_KEYS } from '@/lib/directoryConfig';
import { formatDeadline, isNewListing } from '@/lib/dateUtils';
import { decodeHtmlEntities } from '@/lib/textUtils';
import CardVisualHeader from './CardVisualHeader';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import FilterChip, { FilterChipRow } from '@/components/ui/FilterChip';
import type { Colorway } from '@/lib/colorways';

const statusConfig: Record<string, { label: string; colorway: Colorway; icon: typeof Clock }> = {
  open: { label: 'Open', colorway: 'green', icon: Clock },
  closing_soon: { label: 'Closing Soon', colorway: 'red', icon: AlertTriangle },
  upcoming: { label: 'Upcoming', colorway: 'blue', icon: Calendar },
  closed: { label: 'Closed', colorway: 'neutral', icon: Clock },
};

export default function DirectoryClient({ initialData, counts = {} }: { initialData: Opportunity[]; counts?: Record<string, number> }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  // filter holds either 'All' or a directory_destination key
  const [filter, setFilter] = useState('All');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialData);
  const [votedIds, setVotedIds] = useState<number[]>([]);

  // Deep-link support: /directory?cat=festivals pre-selects that category
  useEffect(() => {
    const slug = searchParams.get('cat');
    const match = getDirectoryCategoryBySlug(slug);
    setFilter(match ? match.key : 'All');
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem('film_resource_votes');
    if (saved) {
      setVotedIds(JSON.parse(saved));
    }
  }, []);

  const handleVote = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (votedIds.includes(id)) return;

    const updatedVoted = [...votedIds, id];
    setVotedIds(updatedVoted);
    localStorage.setItem('film_resource_votes', JSON.stringify(updatedVoted));

    // Optimistic update
    setOpportunities(prev => prev.map(opp => 
      opp.id === id ? { ...opp, votes: (opp.votes || 0) + 1 } : opp
    ));

    try {
      await voteOpportunity(id);
    } catch (error) {
      console.error("Failed to vote", error);
      // Rollback on failure
      setOpportunities(prev => prev.map(opp => 
        opp.id === id ? { ...opp, votes: Math.max(0, (opp.votes || 0) - 1) } : opp
      ));
      setVotedIds(votedIds);
      localStorage.setItem('film_resource_votes', JSON.stringify(votedIds));
    }
  };

  // Chip model: 'All' + the 7 public Directory categories
  const filterChips = [
    { key: 'All', label: 'All', shortLabel: 'All', icon: LayoutGrid, color: 'text-foreground/40', filterActive: 'from-primary to-blue-600' },
    ...directoryCategories.map((c) => ({
      key: c.key,
      label: c.label,
      shortLabel: c.shortLabel,
      icon: c.icon,
      color: c.color,
      filterActive: c.filterActive,
    })),
  ];

  const filteredData = opportunities.filter((opp) => {
    if (opp.application_status === 'closed') return false;
    // Public Directory only — exclude omit / members / null destinations
    if (!opp.directory_destination || !PUBLIC_DIRECTORY_KEYS.includes(opp.directory_destination)) return false;

    const term = search.toLowerCase();
    const formatStr = (opp["For Films or Series?"] || "").toLowerCase();
    const categoryStr = (opp.category || "").toLowerCase();

    const matchesSearch = !term ||
      opp.title.toLowerCase().includes(term) ||
      opp["What Is It?"].toLowerCase().includes(term) ||
      formatStr.includes(term) ||
      categoryStr.includes(term);

    if (!matchesSearch) return false;
    if (filter === 'All') return true;

    return opp.directory_destination === filter;
  }).sort((a, b) => b.id - a.id);

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-8 relative z-20 max-w-2xl mx-auto">
        <Input
          type="text"
          placeholder="Search opportunities, funds, labs, festivals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={Search}
          onClear={() => setSearch('')}
        />
      </div>

      {/* Filters & Sort */}
      <div className="mb-10 space-y-3 relative z-20">
        {/* Category chips — horizontal scroll on mobile, wrap on desktop */}
        <FilterChipRow>
          {filterChips.map((f) => (
            <FilterChip
              key={f.key}
              active={filter === f.key}
              onClick={() => {
                setFilter(f.key);
                setTimeout(() => {
                  document.getElementById('directory-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
              label={f.label}
              shortLabel={f.shortLabel}
              icon={f.icon}
              iconClass={f.color}
              count={f.key === 'All' ? undefined : counts[f.key]}
            />
          ))}

          <div className="w-[1px] h-8 bg-white/15 mx-1 hidden md:flex self-center flex-shrink-0"></div>

          <Link
            href="/submit"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors border border-line-mid hover:border-line-strong flex-shrink-0"
            style={{ background: 'var(--surface)', color: 'var(--foreground-secondary)' }}
          >
            <Plus size={16} />
            <span>Submit</span>
          </Link>
        </FilterChipRow>

        {/* Result count */}
        <div className="flex items-center justify-center">
          <span className="text-foreground/50 text-xs md:text-sm">{filteredData.length} results</span>
        </div>
      </div>

      {/* Grid */}
      <motion.div 
        layout 
        id="directory-grid"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10"
      >
        <AnimatePresence>
          {filteredData.map((opp) => {
            const status = statusConfig[opp.application_status || 'open'] || statusConfig.open;
            const StatusIcon = status.icon;
            const catStyle = getDirectoryStyle(opp.directory_destination);
            const CatIcon = catStyle.icon;
            const isFree = /free/i.test(opp["Cost"] || '');

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
                key={opp.id}
                onClick={() => setSelectedOpp(opp)}
                className={`rounded-xl flex flex-col hover:border-white/[0.16] transition-all duration-300 group cursor-pointer border border-white/[0.08] overflow-hidden relative border-l-[3px] ${catStyle.borderLeft}`}
                style={{ background: 'var(--surface)' }}
              >
                <CardVisualHeader
                  logo={opp.logo}
                  ogImage={opp.og_image_url}
                  category={opp.category}
                  title={opp.title}
                  geoScope={opp.geo_scope}
                  countryIso={opp.country_iso}
                  countryName={opp.country_name}
                />

                <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <Badge variant="status" colorway={status.colorway} icon={StatusIcon}>
                      {status.label}
                    </Badge>
                    {isNewListing(opp.created_at, opp.id) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-purple-500/30 text-purple-300 animate-pulse">
                        <Sparkles size={10} />
                        NEW
                      </span>
                    )}
                  </div>
                  {(() => {
                    const raw = opp["Next Deadline"];
                    const parsed = raw ? new Date(raw) : null;
                    const isValidDate = parsed && !isNaN(parsed.getTime()) && parsed.getFullYear() > 2000;
                    if (isValidDate) {
                      const dl = formatDeadline(raw!);
                      const urgencyColor = dl.urgency === 'critical' ? 'text-red-400' : dl.urgency === 'warning' ? 'text-amber-400' : 'text-foreground/50';
                      const urgencyBg = dl.urgency === 'critical' ? 'bg-red-500/10 border-red-500/20' : dl.urgency === 'warning' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10';
                      return (
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${urgencyBg} ${urgencyColor}`}>
                          <Clock size={12} />
                          {dl.urgency === 'passed' ? 'Closed' : dl.countdownText}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                <h2 className="text-xl font-bold font-heading group-hover:text-primary transition-colors leading-tight mb-3 relative z-10">
                  {opp.title}
                </h2>

                <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
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

                <p className="text-foreground/60 text-sm line-clamp-2 flex-grow mb-4 relative z-10 leading-relaxed">
                  {decodeHtmlEntities(opp["What Is It?"])}
                </p>

                {opp.member_name && (
                  <p className="text-[12px] mb-3 relative z-10 flex items-center gap-1.5" style={{ color: 'var(--foreground-tertiary)' }}>
                    <span className="inline-block w-1 h-1 rounded-full bg-primary" />
                    Added by <span className="font-medium text-foreground/70">{opp.member_name}</span>
                  </p>
                )}

                <div className="mt-auto relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-accent text-sm font-medium">
                    <Calendar size={14} />
                    <span className="truncate max-w-[200px]">{opp["Next Deadline"]?.substring(0, 40) || "Check website"}</span>
                  </div>
                  <ExternalLink size={16} className="text-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                </div>
              </motion.div>
            );
          })}
          {filteredData.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full text-center py-20 rounded-xl border border-white/[0.06]"
              style={{ background: 'var(--surface)' }}
            >
              <Search className="w-12 h-12 text-primary/50 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold mb-2">No matches found</h3>
              <p className="text-foreground/60">Try adjusting your filters or search terms.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <OpportunityModal selectedOpp={selectedOpp} onClose={() => setSelectedOpp(null)} />
    </div>
  );
}
