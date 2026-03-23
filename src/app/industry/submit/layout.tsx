import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Add Your Listing — Industry Directory | Film Resource Africa',
  description: 'Get discovered by filmmakers and producers. Add your production company, crew profile, service, or training program to the African film industry directory.',
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
