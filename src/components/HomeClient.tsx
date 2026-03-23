'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, Sparkles, Plus } from 'lucide-react';
import { Opportunity, NewsItem, trackSponsoredClick } from '@/app/actions';
import type { InquiryType, SponsoredPlacement } from '@/app/actions';
import OpportunityRow from './OpportunityRow';
import NewsSection from './NewsSection';
import NowScreeningSection from './NowScreeningSection';
import NewsletterCTA from './NewsletterCTA';
import DirectoryClient from './DirectoryClient';
import OpportunityModal from './OpportunityModal';
import PartnersSection from './PartnersSection';
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
      {/* Just Added Section — Blue/fresh theme */}
      {justAdded.length > 0 && (
        <section
          id="just-added"
          className="relative rounded-3xl bg-gradient-to-b from-blue-500/[0.07] to-transparent border border-blue-500/10 p-6 md:p-8 -mx-4 md:mx-0 overflow-hidden"
        >
          <div className="absolute inset-0 pattern-dots pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
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

      {/* Closing Soon Section — Red/urgent theme */}
      {closingSoon.length > 0 && (
        <section
          id="closing-soon"
          className="relative rounded-3xl bg-gradient-to-b from-red-500/[0.07] to-transparent border border-red-500/10 p-6 md:p-8 -mx-4 md:mx-0 overflow-hidden"
        >
          <div className="absolute inset-0 pattern-diamonds pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
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

      {/* Open Now Section — Green/go theme */}
      {openNow.length > 0 && (
        <section
          id="open-now"
          className="relative rounded-3xl bg-gradient-to-b from-green-500/[0.07] to-transparent border border-green-500/10 p-6 md:p-8 -mx-4 md:mx-0 overflow-hidden"
        >
          <div className="absolute inset-0 pattern-crosshatch pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
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

      {/* New Wave Section — Purple/innovation theme */}
      {newWave.length > 0 && (
        <section
          id="new-wave"
          className="relative rounded-3xl bg-gradient-to-b from-purple-500/[0.07] to-transparent border border-purple-500/10 p-6 md:p-8 -mx-4 md:mx-0 overflow-hidden"
        >
          <div className="absolute inset-0 pattern-circles pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
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
          className="relative rounded-3xl bg-gradient-to-b from-pink-500/[0.05] to-transparent border border-pink-500/10 p-6 md:p-8 -mx-4 md:mx-0 overflow-hidden"
        >
          <div className="absolute inset-0 pattern-zigzag pointer-events-none"></div>
          <div className="absolute top-0 right-1/4 w-80 h-64 bg-pink-500/8 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>
          <NowScreeningSection trailers={trailers} />
        </section>
      )}

      {/* News Section — Warm/amber theme */}
      <section
        id="news"
        className="relative rounded-3xl bg-gradient-to-b from-amber-500/[0.05] to-transparent border border-amber-500/10 p-6 md:p-8 -mx-4 md:mx-0 overflow-hidden"
      >
        <div className="absolute inset-0 pattern-zigzag pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 w-80 h-64 bg-amber-500/8 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <NewsSection
          news={news}
          placements={placementsBySection('Latest News')}
          onSponsoredClaim={handleSponsoredClaim}
        />
      </section>

      {/* Newsletter Banner CTA */}
      <NewsletterCTA
        variant="banner"
        heading="Stay ahead of every deadline"
        subtext="Weekly alerts on new funds, closing deadlines, and industry shifts — delivered to your inbox."
      />

      {/* Browse by Country */}
      <BrowseByCountry countries={countriesWithCounts} />

      {/* Partners & Industry Network */}
      <PartnersSection />

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
