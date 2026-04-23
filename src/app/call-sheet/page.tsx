import { getCallSheetListings } from '@/app/actions';
import CallSheetClient from '@/components/CallSheetClient';
import NewsletterCTA from '@/components/NewsletterCTA';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ItemListJsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'The Call Sheet — Film Resource Africa',
  description: 'Where African productions find their next key collaborator. Paid crew calls, writing rooms, and co-production opportunities.',
  openGraph: {
    title: 'The Call Sheet — Film Resource Africa',
    description: 'Where African productions find their next key collaborator. Paid crew calls, writing rooms, and co-production opportunities.',
    siteName: 'Film Resource Africa',
  },
  twitter: {
    card: 'summary',
    title: 'The Call Sheet — Film Resource Africa',
    description: 'Paid crew calls, writing rooms, and co-production opportunities for African productions.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/call-sheet',
  },
};

export default async function CallSheetPage() {
  const listings = await getCallSheetListings();

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'The Call Sheet', href: '/call-sheet' }]} />
        <ItemListJsonLd
          name="The Call Sheet — African Film Crew Calls"
          description="Paid crew calls, writing rooms, and co-production opportunities for African film productions."
          items={listings.slice(0, 50).map((l) => ({ name: l.title, url: `/call-sheet#listing-${l.id}` }))}
        />
        {/* Editorial header */}
        <header>
          <div className="section-rule section-rule-success" />
          <span className="section-rubric">Crew Calls</span>
          <div className="flex items-baseline justify-between">
            <h1 className="text-[26px] md:text-[38px] font-bold font-heading leading-tight text-foreground">
              The Call Sheet
            </h1>
            <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
              {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--foreground-secondary)' }}>
            Where African productions find their next key collaborator. Every listing is paid, verified, and approved.
          </p>
        </header>

        {/* Listings */}
        <CallSheetClient initialData={listings} />

        {/* Newsletter CTA */}
        <NewsletterCTA
          variant="banner"
          heading="Get crew calls in your inbox"
          subtext="New listings, deadline alerts, and industry opportunities — delivered weekly."
        />
      </div>
    </main>
  );
}
