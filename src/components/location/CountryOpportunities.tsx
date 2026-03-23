'use client';

import { useState } from 'react';
import { Calendar, ExternalLink, Filter, Search } from 'lucide-react';
import type { Opportunity } from '@/app/actions';

interface CountryOpportunitiesProps {
  opportunities: Opportunity[];
  countryName: string;
}

export default function CountryOpportunities({ opportunities, countryName }: CountryOpportunitiesProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', ...new Set(opportunities.map((o) => o.category).filter(Boolean))];

  const filtered = opportunities.filter((opp) => {
    const matchesSearch =
      !search ||
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      (opp['What Is It?'] || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || opp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (opportunities.length === 0) {
    return (
      <section id="opportunities">
        <h2 className="text-2xl font-bold font-heading mb-6">
          Opportunities in {countryName}
        </h2>
        <div className="glass-card rounded-[2rem] p-12 border border-white/10 text-center">
          <p className="text-foreground/50 text-lg mb-4">
            We&apos;re building our {countryName} opportunities database.
          </p>
          <p className="text-foreground/40 text-sm max-w-md mx-auto">
            New opportunities are added daily. Subscribe to our newsletter to get notified when we
            add {countryName}-specific listings.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="opportunities" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold font-heading">
          {opportunities.length} {opportunities.length === 1 ? 'Opportunity' : 'Opportunities'} in{' '}
          {countryName}
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-foreground/30"
          />
        </div>
        {categories.length > 2 && (
          <div className="relative">
            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((opp) => (
          <div
            key={opp.id}
            id={`opp-${opp.id}`}
            className="glass-card rounded-[1.5rem] p-6 border border-white/10 hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.15)] transition-all group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold font-heading text-base leading-snug group-hover:text-primary transition-colors">
                {opp.title}
              </h3>
              {opp.logo && (
                <img
                  src={opp.logo}
                  alt=""
                  className="w-10 h-10 rounded-lg object-contain flex-shrink-0 bg-white/5"
                />
              )}
            </div>

            {opp.category && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-foreground/40 bg-white/5 px-2 py-0.5 rounded-lg mb-3">
                {opp.category}
              </span>
            )}

            {opp['What Is It?'] && (
              <p className="text-sm text-foreground/50 leading-relaxed line-clamp-3 mb-4">
                {opp['What Is It?'].slice(0, 200)}
                {opp['What Is It?'].length > 200 ? '...' : ''}
              </p>
            )}

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
              {opp['Next Deadline'] && (
                <span className="flex items-center gap-1.5 text-xs text-foreground/40">
                  <Calendar size={12} />
                  {opp['Next Deadline']}
                </span>
              )}
              {opp['Apply:'] && (
                <a
                  href={opp['Apply:']}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:text-blue-400 transition-colors"
                >
                  Apply <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-foreground/40">
          No opportunities match your search. Try adjusting your filters.
        </div>
      )}
    </section>
  );
}
