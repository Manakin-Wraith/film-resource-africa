import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Submit an Opportunity — Film Resource Africa',
  description: 'Submit a new film opportunity, grant, fellowship, or festival to the Film Resource Africa directory.',
  openGraph: {
    title: 'Submit an Opportunity — Film Resource Africa',
    description: 'Submit a new film opportunity, grant, fellowship, or festival to the Film Resource Africa directory.',
    siteName: 'Film Resource Africa',
  },
  twitter: {
    card: 'summary',
    title: 'Submit an Opportunity — Film Resource Africa',
    description: 'Submit a new film opportunity, grant, fellowship, or festival to the Film Resource Africa directory.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/submit',
  },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Submit Opportunity', href: '/submit' }]} />
      </div>
      {children}
    </>
  );
}
