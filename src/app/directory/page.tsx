import { Metadata } from 'next';
import { Suspense } from 'react';
import { getDirectoryOpportunities, getDirectoryCounts } from '@/app/actions';
import DirectoryClient from '@/components/DirectoryClient';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterCTA from '@/components/NewsletterCTA';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Directory — Film Funds, Grants & Festivals in Africa',
  description:
    'The Film Resource Africa Directory: film funds, grants, festivals, labs & fellowships, markets, AI opportunities, and open calls for African filmmakers — all in one place.',
  openGraph: {
    title: 'Directory — Film Funds, Grants & Festivals in Africa | Film Resource Africa',
    description:
      'Browse film funds, grants, festivals, labs, markets, and open calls for African filmmakers.',
    siteName: 'Film Resource Africa',
  },
  twitter: {
    card: 'summary',
    title: 'Directory — Film Funds, Grants & Festivals in Africa',
    description: 'Browse film funds, grants, festivals, labs, markets, and open calls for African filmmakers.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/directory',
  },
};

export default async function DirectoryPage() {
  const [opportunities, counts] = await Promise.all([
    getDirectoryOpportunities(),
    getDirectoryCounts(),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Directory', href: '/directory' },
          ]}
        />

        {/* Editorial header */}
        <header>
          <div className="section-rule section-rule-success" />
          <span className="section-rubric">The Directory</span>
          <div className="flex items-baseline justify-between">
            <h1 className="text-[26px] md:text-[38px] font-bold font-heading leading-tight text-foreground">
              Funds, Grants &amp; Festivals for African Film
            </h1>
            <span className="text-sm font-medium ml-4 shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
              {total} listings
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--foreground-secondary)' }}>
            Every standing fund, grant, festival, lab, market, and open call we track for filmmakers across the continent — browse by category or search.
          </p>
        </header>

        <Suspense fallback={null}>
          <DirectoryClient initialData={opportunities} counts={counts} />
        </Suspense>

        <NewsletterCTA
          variant="banner"
          heading="Never miss a deadline"
          subtext="Weekly funding, festival, and open-call alerts for African filmmakers — straight to your inbox."
        />
      </div>
    </main>
  );
}
