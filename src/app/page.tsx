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
      <div className="container mx-auto px-4 pt-8 pb-0 md:pt-12">
        {/* ── Masthead ────────────────────────────────────────────── */}
        <header className="pb-10 md:pb-14">
          {/* Top rule + rubric */}
          <div className="border-t border-white/[0.16] pt-4 flex items-center justify-between mb-3">
            <span className="section-rubric mb-0">Film Resource Africa</span>
            <span className="section-rubric mb-0 hidden md:block">est. 2024</span>
          </div>
          {/* Accent rule */}
          <div className="h-[2px] bg-accent mb-8 md:mb-10" />

          {/* Headline + body — stacked on mobile, split on desktop */}
          <div className="md:grid md:grid-cols-[1fr_320px] md:gap-16 md:items-end">
            <h1 className="text-[52px] leading-[1.02] md:text-[88px] font-extrabold font-heading tracking-tight text-foreground mb-8 md:mb-0">
              African Film<br />Opportunities.
            </h1>
            <div className="md:pb-1">
              <p className="text-[15px] md:text-base leading-relaxed mb-6" style={{ color: 'var(--foreground-secondary)' }}>
                Screenwriting labs, co-production funds, and pitch forums — curated for African creators worldwide.
              </p>
              <NewsletterCTA variant="hero" />
            </div>
          </div>

          {/* Bottom rule */}
          <div className="h-[1px] mt-10 md:mt-12" style={{ background: 'var(--border)' }} />
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
