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
    <main className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-12 space-y-12">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'The Call Sheet', href: '/call-sheet' }]} />
        <ItemListJsonLd
          name="The Call Sheet — African Film Crew Calls"
          description="Paid crew calls, writing rooms, and co-production opportunities for African film productions."
          items={listings.slice(0, 50).map((l) => ({ name: l.title, url: `/call-sheet#listing-${l.id}` }))}
        />
        {/* Hero */}
        <header className="relative text-center space-y-5 py-6 -mx-4 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-teal-500/[0.05] to-transparent pointer-events-none rounded-3xl"></div>
          <div className="absolute top-0 left-1/2 w-96 h-64 bg-teal-500/8 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          <h1 className="relative text-5xl md:text-7xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
            The Call Sheet
          </h1>
          <p className="relative text-xl opacity-80 max-w-2xl mx-auto">
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
