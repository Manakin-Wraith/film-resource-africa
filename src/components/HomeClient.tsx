'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, Sparkles, Plus } from 'lucide-react';
import { Opportunity, NewsItem, trackSponsoredClick } from '@/app/actions';
import type { InquiryType, SponsoredPlacement } from '@/app/actions';
import OpportunityRow from './OpportunityRow';
import NewsSection from './NewsSection';
import NowScreeningSection from './NowScreeningSection';
import NewsletterShowcase from './NewsletterShowcase';
import DirectoryClient from './DirectoryClient';
import OpportunityModal from './OpportunityModal';
import ContactModal from './ContactModal';
import BrowseByCountry from './BrowseByCountry';
import type { Country } from '@/lib/countries';

interface CountryWithCount {
  country: Country;
  opportunity_count: number;
}

interface HomeClientProps {
  closingSoon: Opportunity[];
  openNow: Opportunity[];
  newWave: Opportunity[];
  justAdded: Opportunity[];
  news: NewsItem[];
  trailers: NewsItem[];
  allOpportunities: Opportunity[];
  placements?: SponsoredPlacement[];
  countriesWithCounts?: CountryWithCount[];
}

export default function HomeClient({ closingSoon, openNow, newWave, justAdded, news, trailers, allOpportunities, placements = [], countriesWithCounts = [] }: HomeClientProps) {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adSource, setAdSource] = useState<string | undefined>(undefined);

  // Group placements by section for distribution
  const placementsBySection = (section: string) =>
    placements.filter(p => p.section === section);

  const handleSponsoredClaim = (placement: SponsoredPlacement | null, section: string) => {
    // Track the click
    trackSponsoredClick(
      placement?.id || null,
      placement?.partner_id || null,
      section,
      placement?.slot_position || null
    );
    // Build source string with partner context
    const source = placement
      ? `${section} | ${placement.partner_name} | Slot ${placement.slot_position}`
      : `${section} | Ghost Card`;
    setAdSource(source);
    setIsAdModalOpen(true);
  };

  return (
    <>
      {/* Just Added Section */}
      {justAdded.length > 0 && (
        <section
          id="just-added"
          className="mt-14 md:mt-20 pt-6 pb-10 border-t border-white/[0.08] -mx-4 md:mx-0 px-4 md:px-0"
        >
          <OpportunityRow
            opportunities={justAdded}
            title="Just Added"
            subtitle="New listings added in the last 2 weeks"
            icon={
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                <Plus size={20} className="text-blue-400" />
              </div>
            }
            onSelect={setSelectedOpp}
          />
        </section>
      )}

      {/* Closing Soon Section */}
      {closingSoon.length > 0 && (
        <section
          id="closing-soon"
          className="mt-14 md:mt-20 pt-6 pb-10 border-t border-white/[0.08] -mx-4 md:mx-0 px-4 md:px-0"
        >
          <OpportunityRow
            opportunities={closingSoon}
            title="Closing Soon"
            subtitle="Deadlines approaching — apply now or miss out"
            icon={
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/20">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
            }
            onSelect={setSelectedOpp}
          />
        </section>
      )}

      {/* Open Now Section */}
      {openNow.length > 0 && (
        <section
          id="open-now"
          className="mt-14 md:mt-20 pt-6 pb-10 border-t border-white/[0.08] -mx-4 md:mx-0 px-4 md:px-0"
        >
          <OpportunityRow
            opportunities={openNow}
            title="Open Now"
            subtitle="Currently accepting applications"
            icon={
              <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/20">
                <Clock size={20} className="text-green-400" />
              </div>
            }
            onSelect={setSelectedOpp}
          />
        </section>
      )}

      {/* New Wave Section */}
      {newWave.length > 0 && (
        <section
          id="new-wave"
          className="mt-14 md:mt-20 pt-6 pb-10 border-t border-white/[0.08] -mx-4 md:mx-0 px-4 md:px-0"
        >
          <OpportunityRow
            opportunities={newWave}
            title="The New Wave: AI Filmmaking"
            subtitle="Festivals, funds, and awards for AI-powered creators"
            icon={
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20">
                <Sparkles size={20} className="text-purple-400" />
              </div>
            }
            onSelect={setSelectedOpp}
          />
        </section>
      )}

      {/* Now Screening — Trailers & First Looks */}
      {trailers.length > 0 && (
        <section
          id="now-screening"
          className="mt-14 md:mt-20 pt-6 pb-10 border-t border-white/[0.08] -mx-4 md:mx-0 px-4 md:px-0"
        >
          <NowScreeningSection trailers={trailers} />
        </section>
      )}

      {/* News Section */}
      <section
        id="news"
        className="mt-14 md:mt-20 pt-6 pb-10 border-t border-white/[0.08] -mx-4 md:mx-0 px-4 md:px-0"
      >
        <NewsSection
          news={news}
          placements={placementsBySection('Latest News')}
          onSponsoredClaim={handleSponsoredClaim}
        />
      </section>

      {/* Newsletter Showcase CTA */}
      <NewsletterShowcase />

      {/* Browse by Country */}
      <BrowseByCountry countries={countriesWithCounts} />

      {/* Full Directory */}
      <section id="directory" className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold font-heading text-center">Full Directory</h2>
        <DirectoryClient initialData={allOpportunities} />
      </section>

      {/* Shared Modal */}
      <OpportunityModal selectedOpp={selectedOpp} onClose={() => setSelectedOpp(null)} />

      {/* Sponsored / Ghost Card → Advertise inquiry modal */}
      <ContactModal
        isOpen={isAdModalOpen}
        onClose={() => { setIsAdModalOpen(false); setAdSource(undefined); }}
        inquiryType={'advertise' as InquiryType}
        source={adSource}
      />
    </>
  );
}
