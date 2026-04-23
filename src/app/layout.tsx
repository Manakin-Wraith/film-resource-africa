import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';
import SiteNav from '@/components/SiteNav';
import MobileTabBar from '@/components/MobileTabBar';
import { getHeaderStats } from './actions';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'African Film Opportunities Directory',
  description: 'Global programmes for African writers and producers',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getHeaderStats();

  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-foreground bg-background`}>
        <SiteNav stats={stats} />
        <div className="flex flex-col min-h-screen pt-[64px] pb-[72px] md:pb-0">
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </div>
        <MobileTabBar />
      </body>
    </html>
  );
}
