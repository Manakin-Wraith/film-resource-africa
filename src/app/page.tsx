import {
  getOpportunities,
  getClosingSoonOpportunities,
  getOpenOpportunities,
  getNewWaveOpportunities,
  getJustAddedOpportunities,
  getNews,
  getTrailers,
  getActivePlacements,
  getApprovedPartners,
  getCountriesWithOpportunityCounts,
} from './actions';
import HomeClient from '@/components/HomeClient';
import NewsletterCTA from '@/components/NewsletterCTA';
import SponsorTicker from '@/components/SponsorTicker';

export default async function Home() {
  const [
    allOpportunities,
    closingSoon,
    openNow,
    newWave,
    justAdded,
    news,
    trailers,
    placements,
    partners,
    countriesWithCounts,
  ] = await Promise.all([
    getOpportunities(),
    getClosingSoonOpportunities(),
    getOpenOpportunities(),
    getNewWaveOpportunities(),
    getJustAddedOpportunities(),
    getNews(),
    getTrailers(),
    getActivePlacements(),
    getApprovedPartners(),
    getCountriesWithOpportunityCounts(),
  ]);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <header className="text-center space-y-6 py-8 -mx-4 px-4">
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight text-foreground">
            African Film Opportunities
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--foreground-secondary)' }}>
            A curated directory of global screenwriting labs, co-production funds, and pitch forums for African creators.
          </p>
          <NewsletterCTA variant="hero" />
        </header>

        <SponsorTicker partners={partners} />

        <HomeClient
          closingSoon={closingSoon}
          openNow={openNow}
          newWave={newWave}
          justAdded={justAdded}
          news={news}
          trailers={trailers}
          allOpportunities={allOpportunities}
          placements={placements}
          countriesWithCounts={countriesWithCounts}
        />
      </div>
    </main>
  );
}
