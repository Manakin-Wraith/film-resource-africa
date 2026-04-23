'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Globe, ExternalLink, Star, CheckCircle2, Clock, Users, LayoutGrid, Plus } from 'lucide-react';
import Link from 'next/link';
import { DirectoryListing, voteDirectoryListing } from '@/app/actions';
import DirectoryListingModal from '@/components/DirectoryListingModal';
import { directoryTypes, getDirectoryType, getCategoriesForType } from '@/lib/industryDirectoryConfig';

const availabilityConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  busy: { label: 'Busy', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  selective: { label: 'Selective', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
};

interface CountryDirectoryProps {
  listings: DirectoryListing[];
  countryName: string;
}

export default function CountryDirectory({ listings, countryName }: CountryDirectoryProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<DirectoryListing | null>(null);

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
      (l.city || '').toLowerCase().includes(term) ||
      (l.role || '').toLowerCase().includes(term) ||
      (l.speciality || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (typeFilter !== 'all' && l.directory_type !== typeFilter) return false;
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;

    return true;
  });

  // Count listings per type for badges
  const typeCounts: Record<string, number> = { all: listings.length };
  for (const l of listings) {
    typeCounts[l.directory_type] = (typeCounts[l.directory_type] || 0) + 1;
  }

  if (listings.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
            <Globe size={20} className="text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading">Film Services Directory</h2>
        </div>

        <div className="rounded-xl p-10 border border-white/[0.08] text-center" style={{ background: 'var(--surface)' }}>
          <Globe className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <h3 className="text-xl font-heading font-bold mb-2">No listings yet for {countryName}</h3>
          <p className="text-foreground/50 mb-6 max-w-md mx-auto">
            Know a production company, crew member, or service provider in {countryName}? Help build the directory.
          </p>
          <Link
            href="/industry/submit"
            className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg text-sm"
          >
            <Plus size={16} /> Add the first listing
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
          <Globe size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading">Film Services Directory</h2>
          <p className="text-foreground/40 text-sm">{listings.length} listing{listings.length !== 1 ? 's' : ''} in {countryName}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
        <input
          type="text"
          placeholder={`Search services in ${countryName}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/30 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors text-xs font-medium">
            Clear
          </button>
        )}
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl font-semibold text-xs whitespace-nowrap transition-all duration-300 border ${
            typeFilter === 'all'
              ? 'border-white/[0.2] text-foreground'
              : 'border-white/[0.08] hover:border-white/[0.16] text-foreground/60 hover:text-foreground'
          }`}
        >
          <LayoutGrid size={14} />
          All
          <span className="text-[10px] opacity-70">{typeCounts.all}</span>
        </button>
        {Object.entries(directoryTypes).map(([key, dt]) => {
          const count = typeCounts[key] || 0;
          if (count === 0) return null;
          const Icon = dt.icon;
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl font-semibold text-xs whitespace-nowrap transition-all duration-300 border ${
                typeFilter === key
                  ? 'border-white/[0.2] text-foreground'
                  : 'border-white/[0.08] hover:border-white/[0.16] text-foreground/60 hover:text-foreground'
              }`}
            >
              <Icon size={14} className={typeFilter === key ? 'text-white' : dt.color} />
              {dt.label}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Category sub-filter */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-foreground/30 text-xs">{filteredData.length} result{filteredData.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Listing cards */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                transition={{ duration: 0.3, type: 'spring', bounce: 0.3 }}
                key={listing.id}
                onClick={() => setSelected(listing)}
                className="rounded-xl p-5 flex flex-col hover:border-white/[0.16] transition-all duration-200 group cursor-pointer border border-white/[0.08] overflow-hidden"
                style={{ background: 'var(--surface)' }}
              >
                {/* Badges */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${dt.bg} ${dt.color}`}>
                      <DtIcon size={10} />
                      {dt.label.split(' ')[0]}
                    </span>
                    {listing.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border bg-blue-500/20 border-blue-500/30 text-blue-400">
                        <CheckCircle2 size={10} />
                      </span>
                    )}
                    {listing.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border bg-amber-500/20 border-amber-500/30 text-amber-400">
                        <Star size={10} />
                      </span>
                    )}
                  </div>
                  {listing.directory_type === 'crew' && listing.availability && (() => {
                    const av = availabilityConfig[listing.availability];
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border ${av.bg} ${av.color}`}>
                        <Clock size={10} />
                        {av.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Name + Logo */}
                <div className="flex items-center gap-3 mb-2">
                  {listing.logo_url ? (
                    <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 overflow-hidden flex-shrink-0">
                      <img src={listing.logo_url} alt={listing.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                      <DtIcon size={18} className={`${dt.color} opacity-50`} />
                    </div>
                  )}
                  <h3 className="text-lg font-bold font-heading group-hover:text-primary transition-colors leading-tight line-clamp-1">
                    {listing.name}
                  </h3>
                </div>

                {/* Category + City */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[10px] text-foreground/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg font-medium">
                    {listing.category}
                  </span>
                  {listing.city && (
                    <span className="text-[10px] text-foreground/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1">
                      <MapPin size={8} />
                      {listing.city}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-foreground/60 text-xs line-clamp-2 flex-grow mb-3 leading-relaxed">
                  {listing.description}
                </p>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs">
                    {listing.website && (
                      <span className="flex items-center gap-1 text-primary/70">
                        <Globe size={12} /> Website
                      </span>
                    )}
                    {listing.role && (
                      <span className="flex items-center gap-1 text-foreground/50">
                        <Users size={12} /> {listing.role}
                      </span>
                    )}
                  </div>
                  <ExternalLink size={14} className="text-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </motion.div>
            );
          })}

          {filteredData.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full text-center py-12 rounded-xl border border-white/[0.06]"
              style={{ background: 'var(--surface)' }}
            >
              <Search className="w-10 h-10 text-primary/50 mx-auto mb-3" />
              <h3 className="text-lg font-heading font-bold mb-1">No matches</h3>
              <p className="text-foreground/60 text-sm">Try adjusting your search or filters.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Suggest a listing CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl p-5 border border-white/[0.08]" style={{ background: 'var(--surface)' }}>
        <div>
          <p className="font-bold font-heading text-sm">Know someone in {countryName}&apos;s film industry?</p>
          <p className="text-foreground/50 text-xs">Help grow the directory — add a company, crew member, or service.</p>
        </div>
        <Link
          href="/industry/submit"
          className="inline-flex items-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent font-semibold py-2.5 px-5 rounded-xl transition-all text-sm whitespace-nowrap"
        >
          <Plus size={16} /> Add Listing
        </Link>
      </div>

      {/* View full directory link */}
      <div className="text-center">
        <Link
          href="/industry"
          className="text-primary hover:text-blue-400 text-sm font-medium transition-colors"
        >
          View the full Africa-wide Industry Directory &rarr;
        </Link>
      </div>

      <DirectoryListingModal listing={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
