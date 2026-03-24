import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Add Your Listing — Industry Directory | Film Resource Africa',
  description: 'Get discovered by filmmakers and producers. Add your production company, crew profile, service, or training program to the African film industry directory.',
  openGraph: {
    title: 'Add Your Listing — Industry Directory | Film Resource Africa',
    description: 'Get discovered by filmmakers and producers. Add your production company, crew profile, service, or training program to the African film industry directory.',
    siteName: 'Film Resource Africa',
  },
  twitter: {
    card: 'summary',
    title: 'Add Your Listing — Industry Directory | Film Resource Africa',
    description: 'Add your production company, crew profile, or service to the African film industry directory.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/industry/submit',
  },
};

export default function IndustrySubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Industry Directory', href: '/industry' },
          { name: 'Add Listing', href: '/industry/submit' },
        ]} />
      </div>
      {children}
    </>
  );
}
