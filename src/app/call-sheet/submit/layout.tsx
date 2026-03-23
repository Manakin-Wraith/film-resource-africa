import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Post a Listing — The Call Sheet | Film Resource Africa',
  description: 'Post paid crew calls, writing rooms, and co-production opportunities for African film productions.',
};

export default function CallSheetSubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'The Call Sheet', href: '/call-sheet' },
          { name: 'Post a Listing', href: '/call-sheet/submit' },
        ]} />
      </div>
      {children}
    </>
  );
}
