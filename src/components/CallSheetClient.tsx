'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, DollarSign, Clock, ExternalLink, Plus, Sparkles, LayoutGrid, Building2 } from 'lucide-react';
import Link from 'next/link';
import { CallSheetListing } from '@/app/actions';
import CallSheetModal from './CallSheetModal';
import { callSheetCategories, getCallSheetCategoryStyle, projectStageLabels, compensationTypeLabels } from '@/lib/callSheetConfig';
import Input from '@/components/ui/Input';
import FilterChip, { FilterChipRow } from '@/components/ui/FilterChip';

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
        <Input
          type="text"
          placeholder="Search roles, productions, locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={Search}
          onClear={() => setSearch('')}
        />
      </div>

      {/* Filters */}
      <div className="mb-10 space-y-3 relative z-20">
        <FilterChipRow>
          {filters.map((f) => {
            const catStyle = f === 'All' ? null : callSheetCategories[f];
            return (
              <FilterChip
                key={f}
                active={filter === f}
                onClick={() => setFilter(f)}
                label={f}
                shortLabel={mobileLabels[f]}
                icon={catStyle ? catStyle.icon : LayoutGrid}
                iconClass={catStyle?.color || 'text-foreground/40'}
              />
            );
          })}

          <div className="w-[1px] h-8 bg-foreground/[0.08] mx-1 hidden md:flex self-center flex-shrink-0"></div>

          <Link
            href="/call-sheet/submit"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors border border-line-mid hover:border-line-strong flex-shrink-0"
            style={{ background: 'var(--surface)', color: 'var(--foreground-secondary)' }}
          >
            <Plus size={16} />
            <span>Post a Listing</span>
          </Link>
        </FilterChipRow>

        {/* Count */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-foreground/50 text-xs md:text-sm">{filteredData.length} listing{filteredData.length !== 1 ? 's' : ''}</span>
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
                className={`rounded-xl p-5 flex flex-col hover:border-line-mid transition-all group cursor-pointer border border-line overflow-hidden`}
                style={{ background: 'var(--surface)' }}
              >
                {/* Badges row */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.color}`}>
                      <CatIcon size={12} />
                      {catStyle.label}
                    </span>
                    {listing.mentorship_included && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-amber-500/10 border-amber-500/20 text-amber-700">
                        <Sparkles size={10} />
                        Mentorship
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-foreground/[0.04] border-line text-foreground/50 flex-shrink-0">
                    <Clock size={12} />
                    {stageLabel}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold font-heading group-hover:text-callsheet transition-colors leading-tight mb-1 relative z-10">
                  {listing.title}
                </h2>
                <p className="text-sm text-callsheet/80 font-medium mb-3 relative z-10">
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
                <div className="mt-auto relative z-10 flex items-center justify-between pt-4 border-t border-line">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-callsheet text-sm font-bold">
                      <DollarSign size={14} />
                      {listing.compensation}
                    </span>
                    <span className="text-foreground/50 text-xs">({compTypeLabel})</span>
                  </div>
                  <ExternalLink size={16} className="text-foreground/30 group-hover:text-callsheet transition-colors flex-shrink-0" />
                </div>
              </motion.div>
            );
          })}

          {filteredData.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-20 rounded-xl border border-line"
              style={{ background: 'var(--surface)' }}
            >
              <Search className="w-12 h-12 text-teal-500/50 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold mb-2">No listings yet</h3>
              <p className="text-foreground/60 mb-6">Be the first to post — productions are looking for talent like you.</p>
              <Link
                href="/call-sheet/submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors text-sm"
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
