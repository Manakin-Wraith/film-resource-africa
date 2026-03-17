'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Globe, ExternalLink, Star, CheckCircle2, Clock, DollarSign, Users, LayoutGrid, Plus } from 'lucide-react';
import Link from 'next/link';
import { DirectoryListing, voteDirectoryListing } from '@/app/actions';
import DirectoryListingModal from './DirectoryListingModal';
import { directoryTypes, getDirectoryType, getCategoriesForType } from '@/lib/industryDirectoryConfig';

const availabilityConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  busy: { label: 'Busy', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  selective: { label: 'Selective', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
};

export default function IndustryDirectoryClient({ initialData }: { initialData: DirectoryListing[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [selected, setSelected] = useState<DirectoryListing | null>(null);
  const [listings, setListings] = useState<DirectoryListing[]>(initialData);

  // Get unique countries from data
  const countries = Array.from(new Set(listings.map(l => l.country))).sort();

  // Get categories for current type filter
  const categories = typeFilter === 'all'
    ? Array.from(new Set(listings.map(l => l.category))).sort()
    : getCategoriesForType(typeFilter).map(c => c.value);

  // Reset category when type changes
  useEffect(() => {
    setCategoryFilter('all');
  }, [typeFilter]);

  const filteredData = listings.filter((l) => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      l.name.toLowerCase().includes(term) ||
      l.description.toLowerCase().includes(term) ||
      l.category.toLowerCase().includes(term) ||
      l.country.toLowerCase().includes(term) ||
      (l.city || '').toLowerCase().includes(term) ||
      (l.role || '').toLowerCase().includes(term) ||
      (l.speciality || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (typeFilter !== 'all' && l.directory_type !== typeFilter) return false;
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (countryFilter !== 'all' && l.country !== countryFilter) return false;

    return true;
  });

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-8 relative z-20 max-w-2xl mx-auto">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            placeholder="Search companies, crew, services, schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-13 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/30 backdrop-blur-md"
            style={{ paddingLeft: '3.25rem' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors text-sm font-medium">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-10 space-y-3 relative z-20">
        {/* Type chips */}
        <div className="flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin snap-x snap-mandatory">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm whitespace-nowrap snap-start flex-shrink-0 transition-all duration-300 border backdrop-blur-md ${
              typeFilter === 'all'
                ? 'bg-gradient-to-r from-primary to-blue-600 text-white border-transparent shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-foreground/70 hover:text-foreground'
            }`}
          >
            <LayoutGrid size={16} className={typeFilter === 'all' ? 'text-white' : 'text-foreground/40'} />
            All
          </button>
          {Object.entries(directoryTypes).map(([key, dt]) => {
            const Icon = dt.icon;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm whitespace-nowrap snap-start flex-shrink-0 transition-all duration-300 border backdrop-blur-md ${
                  typeFilter === key
                    ? `bg-gradient-to-r ${dt.gradient} text-white border-transparent shadow-lg`
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-foreground/70 hover:text-foreground'
                }`}
              >
                <Icon size={16} className={typeFilter === key ? 'text-white' : dt.color} />
                <span className="hidden md:inline">{dt.label}</span>
                <span className="md:hidden">{dt.label.split(' ')[0]}</span>
              </button>
            );
          })}

          <div className="w-[1px] h-8 bg-white/15 mx-1 hidden md:flex self-center flex-shrink-0"></div>

          <Link
            href="/industry/submit"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border backdrop-blur-md bg-accent/10 hover:bg-accent/20 border-accent/20 text-accent hover:scale-105 flex-shrink-0"
          >
            <Plus size={16} />
            <span>Add Listing</span>
          </Link>
        </div>

        {/* Category + Country filters + result count */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-foreground/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {countries.length > 1 && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-foreground/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <span className="text-foreground/30 text-xs md:text-sm">{filteredData.length} results</span>
        </div>
      </div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence>
          {filteredData.map((listing) => {
            const dt = getDirectoryType(listing.directory_type);
            const DtIcon = dt.icon;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
                key={listing.id}
                onClick={() => setSelected(listing)}
                className={`glass-card rounded-[1.5rem] p-6 flex flex-col hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(59,130,246,0.25)] transition-all duration-300 group cursor-pointer border border-white/10 overflow-hidden relative`}
              >
                {/* Top row: badges */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${dt.bg} ${dt.color}`}>
                      <DtIcon size={12} />
                      {dt.label.split(' ')[0]}
                    </span>
                    {listing.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold border bg-blue-500/20 border-blue-500/30 text-blue-400">
                        <CheckCircle2 size={10} />
                      </span>
                    )}
                    {listing.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold border bg-amber-500/20 border-amber-500/30 text-amber-400">
                        <Star size={10} />
                      </span>
                    )}
                  </div>
                  {/* Crew availability badge */}
                  {listing.directory_type === 'crew' && listing.availability && (() => {
                    const av = availabilityConfig[listing.availability];
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${av.bg} ${av.color}`}>
                        <Clock size={10} />
                        {av.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Name + Logo */}
                <div className="flex items-center gap-3 mb-2">
                  {listing.logo_url ? (
                    <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 overflow-hidden flex-shrink-0">
                      <img src={listing.logo_url} alt={listing.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                      <DtIcon size={20} className={`${dt.color} opacity-50`} />
                    </div>
                  )}
                  <h2 className="text-xl font-bold font-heading group-hover:text-primary transition-colors leading-tight">
                    {listing.name}
                  </h2>
                </div>

                {/* Category + Location */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs text-foreground/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg font-medium">
                    {listing.category}
                  </span>
                  <span className="text-xs text-foreground/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                    <MapPin size={10} />
                    {listing.city ? `${listing.city}, ` : ''}{listing.country}
                  </span>
                </div>

                {/* Description */}
                <p className="text-foreground/60 text-sm line-clamp-2 flex-grow mb-4 leading-relaxed">
                  {listing.description}
                </p>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 text-sm">
                    {listing.website && (
                      <span className="flex items-center gap-1 text-primary/70">
                        <Globe size={14} /> Website
                      </span>
                    )}
                    {listing.role && (
                      <span className="flex items-center gap-1 text-foreground/50">
                        <Users size={14} /> {listing.role}
                      </span>
                    )}
                  </div>
                  <ExternalLink size={16} className="text-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
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
              <h3 className="text-xl font-heading font-bold mb-2">No listings found</h3>
              <p className="text-foreground/60 mb-6">Try adjusting your filters or search terms.</p>
              <Link
                href="/industry/submit"
                className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg text-sm"
              >
                <Plus size={16} /> Add the first listing
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <DirectoryListingModal listing={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
