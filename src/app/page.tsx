import {
  getOpportunities,
  getClosingSoonOpportunities,
  getOpenOpportunities,
  getNewWaveOpportunities,
  getJustAddedOpportunities,
  getNews,
  getTrailers,
  getActivePlacements,
  getCountriesWithOpportunityCounts,
} from './actions';
import HomeClient from '@/components/HomeClient';
import NewsletterCTA from '@/components/NewsletterCTA';

export const dynamic = 'force-dynamic';

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
    getCountriesWithOpportunityCounts(),
  ]);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 pt-8 pb-0 md:pt-12">
        {/* ── Masthead (matches v3 redesign mockup: single "African film, funded.") ── */}
        <header className="pt-4 md:pt-6 pb-10 md:pb-14">
          <h1 className="font-heading font-semibold leading-[1.02] tracking-[-0.02em] text-[clamp(44px,6vw,84px)] max-w-[12ch] text-foreground">
            African film,{' '}
            <em className="italic font-normal bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-urgent)] bg-clip-text text-transparent">
              funded.
            </em>
          </h1>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-12 border-y border-line mt-8 md:mt-10 py-5">
            <p className="text-[15px] md:text-base leading-relaxed max-w-[52ch]" style={{ color: 'var(--foreground-secondary)' }}>
              Screenwriting labs, co-production funds, and pitch forums — every live opportunity for African creators, verified and tracked to deadline.
            </p>
            <div className="w-full md:w-auto md:min-w-[360px] md:flex-shrink-0">
              <NewsletterCTA variant="hero" />
            </div>
          </div>
        </header>

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
