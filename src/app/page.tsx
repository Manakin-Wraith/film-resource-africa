import { getOpportunities, getClosingSoonOpportunities, getOpenOpportunities, getNews, getTrailers, getNewWaveOpportunities, getJustAddedOpportunities, getApprovedPartners, getActivePlacements, getCountriesWithOpportunityCounts } from './actions';
import DirectoryClient from '@/components/DirectoryClient';
import OpportunityRow from '@/components/OpportunityRow';
import NewsSection from '@/components/NewsSection';
import NewsletterCTA from '@/components/NewsletterCTA';
import HomeClient from '@/components/HomeClient';
import SponsorTicker from '@/components/SponsorTicker';
import { HomepageFaqJsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [opportunities, closingSoon, openNow, news, trailers, newWave, justAdded, partners, placements, countriesWithCounts] = await Promise.all([
    getOpportunities(),
    getClosingSoonOpportunities(),
    getOpenOpportunities(),
    getNews(),
    getTrailers(),
    getNewWaveOpportunities(),
    getJustAddedOpportunities(),
    getApprovedPartners(),
    getActivePlacements(),
    getCountriesWithOpportunityCounts(),
  ]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <HomepageFaqJsonLd />
      <div className="relative z-10 container mx-auto px-4 py-12 space-y-16">
        {/* Hero — animated gradient mesh + Kente pattern */}
        <header className="relative text-center space-y-6 py-8 -mx-4 px-4 overflow-hidden">
          <div className="absolute inset-0 hero-mesh pointer-events-none"></div>
          <div className="absolute inset-0 pattern-kente pointer-events-none"></div>
          <h1 className="relative text-5xl md:text-7xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            African Film Opportunities
          </h1>
          <p className="relative text-xl opacity-80 max-w-2xl mx-auto">
            A curated directory of global screenwriting labs, co-production funds, and pitch forums for African creators.
          </p>
          <div id="newsletter-hero" className="relative pt-2">
            <NewsletterCTA variant="hero" />
          </div>
        </header>

        {/* Sponsor Ticker */}
        <SponsorTicker partners={partners} />

        {/* Closing Soon */}
        <HomeClient
          closingSoon={closingSoon}
          openNow={openNow}
          newWave={newWave}
          justAdded={justAdded}
          news={news}
          trailers={trailers}
          allOpportunities={opportunities}
          placements={placements}
          countriesWithCounts={countriesWithCounts}
        />
      </div>
    </main>
  );
}
