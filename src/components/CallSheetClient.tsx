'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, DollarSign, Clock, ExternalLink, Plus, Sparkles, LayoutGrid, Building2 } from 'lucide-react';
import Link from 'next/link';
import { CallSheetListing } from '@/app/actions';
import CallSheetModal from './CallSheetModal';
import { callSheetCategories, getCallSheetCategoryStyle, projectStageLabels, compensationTypeLabels } from '@/lib/callSheetConfig';

export default function CallSheetClient({ initialData }: { initialData: CallSheetListing[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedListing, setSelectedListing] = useState<CallSheetListing | null>(null);

  const filters = ['All', ...Object.keys(callSheetCategories)];

  const mobileLabels: Record<string, string> = {
    'All': 'All',
    'Key Crew': 'Crew',
    "Writers' Room": 'Writers',
    'Post & VFX': 'Post',
    'Emerging Talent': 'Emerging',
    'Co-Production Partners': 'Co-Prod',
    'Festival & Market Reps': 'Reps',
  };

  const filteredData = initialData.filter((listing) => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      listing.title.toLowerCase().includes(term) ||
      listing.production_title.toLowerCase().includes(term) ||
      listing.production_company.toLowerCase().includes(term) ||
      listing.description.toLowerCase().includes(term) ||
      listing.location.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (filter === 'All') return true;
    return listing.category === filter;
  });

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-8 relative z-20 max-w-2xl mx-auto">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            placeholder="Search roles, productions, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-13 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-foreground placeholder:text-foreground/30 backdrop-blur-md"
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

      {/* Filters */}
      <div className="mb-10 space-y-3 relative z-20">
        <div className="flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin snap-x snap-mandatory">
          {filters.map((f) => {
            const catStyle = f === 'All' ? null : callSheetCategories[f];
            const Icon = catStyle ? catStyle.icon : LayoutGrid;
            const activeGradient = catStyle ? catStyle.filterActive : 'from-teal-600 to-cyan-600';

            return (
              <button
                key={f}
                className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm whitespace-nowrap snap-start flex-shrink-0 transition-all duration-300 border backdrop-blur-md ${
                  filter === f
                    ? `bg-gradient-to-r ${activeGradient} text-white border-transparent shadow-lg`
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-foreground/70 hover:text-foreground'
                }`}
                onClick={() => setFilter(f)}
              >
                <Icon size={16} className={filter === f ? 'text-white' : (catStyle?.color || 'text-foreground/40')} />
                <span className="md:hidden">{mobileLabels[f]}</span>
                <span className="hidden md:inline">{f}</span>
              </button>
            );
          })}

          <div className="w-[1px] h-8 bg-white/15 mx-1 hidden md:flex self-center flex-shrink-0"></div>

          <Link
            href="/call-sheet/submit"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border backdrop-blur-md bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20 text-teal-400 hover:scale-105 flex-shrink-0"
          >
            <Plus size={16} />
            <span>Post a Listing</span>
          </Link>
        </div>

        {/* Count */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-foreground/30 text-xs md:text-sm">{filteredData.length} listing{filteredData.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10"
      >
        <AnimatePresence>
          {filteredData.map((listing) => {
            const catStyle = getCallSheetCategoryStyle(listing.category);
            const CatIcon = catStyle.icon;
            const stageLabel = projectStageLabels[listing.project_stage] || listing.project_stage;
            const compTypeLabel = compensationTypeLabels[listing.compensation_type] || listing.compensation_type;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, type: 'spring', bounce: 0.3 }}
                key={listing.id}
                onClick={() => setSelectedListing(listing)}
                className={`glass-card rounded-[1.5rem] p-6 flex flex-col hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(13,148,136,0.25)] transition-all duration-300 group cursor-pointer border border-white/10 overflow-hidden relative border-l-[3px] ${catStyle.borderLeft}`}
              >
                {/* Badges row */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.color}`}>
                      <CatIcon size={12} />
                      {catStyle.label}
                    </span>
                    {listing.mentorship_included && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-amber-500/10 border-amber-500/20 text-amber-400">
                        <Sparkles size={10} />
                        Mentorship
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-white/5 border-white/10 text-foreground/50 flex-shrink-0">
                    <Clock size={12} />
                    {stageLabel}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold font-heading group-hover:text-teal-400 transition-colors leading-tight mb-1 relative z-10">
                  {listing.title}
                </h2>
                <p className="text-sm text-teal-400/80 font-medium mb-3 relative z-10">
                  {listing.production_title}
                </p>

                {/* Company + Location */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-foreground/50 relative z-10">
                  <span className="flex items-center gap-1">
                    <Building2 size={11} />
                    {listing.production_company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    {listing.location}
                  </span>
                </div>

                {/* Description */}
                <p className="text-foreground/60 text-sm line-clamp-2 flex-grow mb-4 relative z-10 leading-relaxed">
                  {listing.description}
                </p>

                {/* Footer: Compensation + arrow */}
                <div className="mt-auto relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-teal-400 text-sm font-bold">
                      <DollarSign size={14} />
                      {listing.compensation}
                    </span>
                    <span className="text-foreground/30 text-xs">({compTypeLabel})</span>
                  </div>
                  <ExternalLink size={16} className="text-foreground/30 group-hover:text-teal-400 transition-colors flex-shrink-0" />
                </div>
              </motion.div>
            );
          })}

          {filteredData.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-24 glass-card rounded-[2rem] border border-white/5"
            >
              <Search className="w-12 h-12 text-teal-500/50 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold mb-2">No listings yet</h3>
              <p className="text-foreground/60 mb-6">Be the first to post — productions are looking for talent like you.</p>
              <Link
                href="/call-sheet/submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-teal-500/20"
              >
                <Plus size={18} />
                Post a Listing
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CallSheetModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
    </div>
  );
}
