'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, Sparkles, Plus } from 'lucide-react';
import { Opportunity, NewsItem } from '@/app/actions';
import OpportunityRow from './OpportunityRow';
import NewsSection from './NewsSection';
import NewsletterCTA from './NewsletterCTA';
import DirectoryClient from './DirectoryClient';
import OpportunityModal from './OpportunityModal';
import PartnersSection from './PartnersSection';

interface HomeClientProps {
  closingSoon: Opportunity[];
  openNow: Opportunity[];
  newWave: Opportunity[];
  justAdded: Opportunity[];
  news: NewsItem[];
  allOpportunities: Opportunity[];
}

export default function HomeClient({ closingSoon, openNow, newWave, justAdded, news, allOpportunities }: HomeClientProps) {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

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

      {/* News Section — Warm/amber theme */}
      <section
        id="news"
        className="relative rounded-3xl bg-gradient-to-b from-amber-500/[0.05] to-transparent border border-amber-500/10 p-6 md:p-8 -mx-4 md:mx-0 overflow-hidden"
      >
        <div className="absolute inset-0 pattern-zigzag pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 w-80 h-64 bg-amber-500/8 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <NewsSection news={news} />
      </section>

      {/* Newsletter Banner CTA */}
      <NewsletterCTA
        variant="banner"
        heading="Stay ahead of every deadline"
        subtext="Weekly alerts on new funds, closing deadlines, and industry shifts — delivered to your inbox."
      />

      {/* Partners & Industry Network */}
      <PartnersSection />

      {/* Full Directory */}
      <section id="directory" className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold font-heading text-center">Full Directory</h2>
        <DirectoryClient initialData={allOpportunities} />
      </section>

      {/* Shared Modal */}
      <OpportunityModal selectedOpp={selectedOpp} onClose={() => setSelectedOpp(null)} />
    </>
  );
}
