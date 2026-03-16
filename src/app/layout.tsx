import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { getHeaderStats } from './actions';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'African Film Opportunities Directory',
  description: 'Global programmes for African writers and producers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Film Resource Africa',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
  themeColor: '#3b82f6',
};

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BuyCoffeeButton from '@/components/BuyCoffeeButton';
import MobileTabBar from '@/components/MobileTabBar';

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getHeaderStats();

  return (
    <html lang="en" className="touch-manipulation">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-foreground bg-background film-grain`}>
        <Header stats={stats} />
        <div className="flex flex-col min-h-screen pt-[100px] pb-[72px] md:pb-0">
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </div>
        <BuyCoffeeButton />
        <MobileTabBar />
      </body>
    </html>
  );
}
