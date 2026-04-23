'use client';

import { useState } from 'react';
import { Opportunity, NewsItem, trackSponsoredClick } from '@/app/actions';
import type { InquiryType, SponsoredPlacement } from '@/app/actions';
import JustAddedSection from './JustAddedSection';
import OpenNowSection from './OpenNowSection';
import NewWaveSection from './NewWaveSection';
import NewsSection from './NewsSection';
import NowScreeningSection from './NowScreeningSection';
import NewsletterShowcase from './NewsletterShowcase';
import ClosingSoonSection from './ClosingSoonSection';
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
      {/* Just Added — 2-col editorial grid */}
      <JustAddedSection opportunities={justAdded} onSelect={setSelectedOpp} />

      {/* Closing Soon — editorial featured section */}
      <ClosingSoonSection opportunities={closingSoon} onSelect={setSelectedOpp} />

      {/* Open Now — cleaned snap carousel */}
      <OpenNowSection opportunities={openNow} onSelect={setSelectedOpp} />

      {/* New Wave — editorial list */}
      <NewWaveSection opportunities={newWave} onSelect={setSelectedOpp} />

      {/* Now Screening — Trailers & First Looks */}
      {trailers.length > 0 && (
        <div className="mt-14 md:mt-20">
          <NowScreeningSection trailers={trailers} />
        </div>
      )}

      {/* News — featured + secondary grid */}
      <NewsSection
        news={news}
        placements={placementsBySection('Latest News')}
        onSponsoredClaim={handleSponsoredClaim}
      />

      {/* Newsletter Showcase CTA */}
      <div className="mt-14 md:mt-20">
        <NewsletterShowcase />
      </div>

      {/* Browse by Country */}
      <BrowseByCountry countries={countriesWithCounts} />

      {/* Full Directory */}
      <section id="directory" className="mt-14 md:mt-20">
        <div className="section-rule section-rule-muted" />
        <span className="section-rubric">Full Directory</span>
        <h2 className="text-[26px] md:text-[34px] font-bold font-heading leading-tight text-foreground mb-6 md:mb-8">
          All Opportunities
        </h2>
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
