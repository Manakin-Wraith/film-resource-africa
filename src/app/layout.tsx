import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { getHeaderStats } from './actions';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Film Resource Africa — African Film Opportunities',
  description: 'A curated directory of screenwriting labs, co-production funds, grants, fellowships, and pitch forums for African filmmakers and producers.',
  metadataBase: new URL('https://film-resource-africa.com'),
  manifest: '/manifest.json',
  openGraph: {
    title: 'Film Resource Africa — African Film Opportunities',
    description: 'A curated directory of screenwriting labs, co-production funds, grants, fellowships, and pitch forums for African filmmakers and producers.',
    url: 'https://film-resource-africa.com',
    siteName: 'Film Resource Africa',
    images: [
      {
        url: '/logo_FRA.png',
        width: 424,
        height: 378,
        alt: 'Film Resource Africa',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Film Resource Africa — African Film Opportunities',
    description: 'A curated directory of screenwriting labs, co-production funds, grants, fellowships, and pitch forums for African filmmakers and producers.',
    images: ['/logo_FRA.png'],
  },
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
import { OrganizationJsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getHeaderStats();

  return (
    <html lang="en" className="touch-manipulation">
      <head>
        <OrganizationJsonLd />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-foreground bg-background film-grain`}>
        <Header stats={stats} />
        <div className="flex flex-col min-h-screen pt-[64px] pb-[72px] md:pb-0">
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </div>
        <BuyCoffeeButton />
        <MobileTabBar />
        <Analytics />
      </body>
    </html>
  );
}
