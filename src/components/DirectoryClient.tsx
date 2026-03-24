'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, DollarSign, ExternalLink, Plus, Heart, Clock, AlertTriangle, LayoutGrid, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Opportunity, voteOpportunity } from '@/app/actions';
import OpportunityModal from './OpportunityModal';
import { categoryConfig, getCategoryStyle } from '@/lib/categoryConfig';
import { formatDeadline, isNewListing } from '@/lib/dateUtils';
import { decodeHtmlEntities } from '@/lib/textUtils';
import CardVisualHeader from './CardVisualHeader';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: Clock },
  closing_soon: { label: 'Closing Soon', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: AlertTriangle },
  upcoming: { label: 'Upcoming', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', icon: Calendar },
  closed: { label: 'Closed', color: 'text-foreground/40', bg: 'bg-white/5 border-white/10', icon: Clock },
};

export default function DirectoryClient({ initialData }: { initialData: Opportunity[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialData);
  const [votedIds, setVotedIds] = useState<number[]>([]);

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

  const filters = ['All', 'Funds & Grants', 'Labs & Fellowships', 'Markets & Pitching', 'Festivals', 'AI & Emerging Tech'];

  // Short labels for mobile to keep chips compact
  const mobileLabels: Record<string, string> = {
    'All': 'All',
    'Funds & Grants': 'Funds',
    'Labs & Fellowships': 'Labs',
    'Markets & Pitching': 'Markets',
    'Festivals': 'Festivals',
    'AI & Emerging Tech': 'AI',
  };

  const filteredData = opportunities.filter((opp) => {
    if (opp.application_status === 'closed') return false;

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
    
    return opp.category === filter;
  }).sort((a, b) => b.id - a.id);

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-8 relative z-20 max-w-2xl mx-auto">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            placeholder="Search opportunities, funds, labs, festivals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-13 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/30 backdrop-blur-md"
            style={{ paddingLeft: '3.25rem' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors text-sm font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="mb-10 space-y-3 relative z-20">
        {/* Category chips — horizontal scroll on mobile, wrap on desktop */}
        <div className="flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin snap-x snap-mandatory">
          {filters.map((f) => {
            const catStyle = f === 'All' ? null : categoryConfig[f];
            const Icon = catStyle ? catStyle.icon : LayoutGrid;
            const activeGradient = catStyle ? catStyle.filterActive : 'from-primary to-blue-600';

            return (
              <button
                key={f}
                className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm whitespace-nowrap snap-start flex-shrink-0 transition-all duration-300 border backdrop-blur-md ${
                  filter === f 
                    ? `bg-gradient-to-r ${activeGradient} text-white border-transparent shadow-lg` 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-foreground/70 hover:text-foreground'
                }`}
                onClick={() => {
                  setFilter(f);
                  setTimeout(() => {
                    document.getElementById('directory-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
              >
                <Icon size={16} className={filter === f ? 'text-white' : (catStyle?.color || 'text-foreground/40')} />
                <span className="md:hidden">{mobileLabels[f]}</span>
                <span className="hidden md:inline">{f}</span>
              </button>
            )
          })}
          
          <div className="w-[1px] h-8 bg-white/15 mx-1 hidden md:flex self-center flex-shrink-0"></div>
          
          <Link 
            href="/submit"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border backdrop-blur-md bg-accent/10 hover:bg-accent/20 border-accent/20 text-accent hover:scale-105 flex-shrink-0"
          >
            <Plus size={16} />
            <span>Submit</span>
          </Link>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-center">
          <span className="text-foreground/30 text-xs md:text-sm">{filteredData.length} results</span>
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
            const status = statusConfig[opp.application_status || 'open'];
            const StatusIcon = status.icon;
            const catStyle = getCategoryStyle(opp.category);
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
                className={`glass-card rounded-[1.5rem] flex flex-col hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(59,130,246,0.25)] transition-all duration-300 group cursor-pointer border border-white/10 overflow-hidden relative border-l-[3px] ${catStyle.borderLeft}`}
              >
                <CardVisualHeader
                  logo={opp.logo}
                  ogImage={opp.og_image_url}
                  category={opp.category}
                  title={opp.title}
                />

                <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-4 relative z-10">
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
              className="col-span-full text-center py-24 glass-card rounded-[2rem] border border-white/5"
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
