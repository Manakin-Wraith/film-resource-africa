import type { Metadata } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import Footer from '@/components/Footer';
import SiteNav from '@/components/SiteNav';
import MobileTabBar from '@/components/MobileTabBar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], axes: ['opsz'], style: ['normal', 'italic'], variable: '--font-fraunces' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  metadataBase: new URL('https://film-resource-africa.com'),
  title: {
    default: 'Film Resource Africa — African Film Opportunities Directory',
    template: '%s | Film Resource Africa',
  },
  description: 'Discover grants, festivals, labs, and funding for African filmmakers. The most comprehensive directory of opportunities for writers, directors, and producers across the continent.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Film Resource Africa',
    title: 'Film Resource Africa — African Film Opportunities Directory',
    description: 'Discover grants, festivals, labs, and funding for African filmmakers. The most comprehensive directory of opportunities for writers, directors, and producers across the continent.',
    url: 'https://film-resource-africa.com',
    images: [
      {
        url: '/African_continent_logo_for_linkedin_fbb39651bb.jpeg',
        width: 1200,
        height: 630,
        alt: 'Film Resource Africa — African Film Opportunities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Film Resource Africa — African Film Opportunities Directory',
    description: 'Discover grants, festivals, labs, and funding for African filmmakers.',
    images: ['/African_continent_logo_for_linkedin_fbb39651bb.jpeg'],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-sans antialiased text-foreground bg-background film-grain`}>
        {/* React hoists this preload to <head> for fast first paint of the bg image */}
        <link rel="preload" as="image" href="/bg/site-cinematic.jpg" />
        <div className="site-bg" aria-hidden="true" />
        <SiteNav />
        <div className="relative z-10 flex flex-col min-h-screen pt-(--header-h) pb-(--tabbar-h) md:pb-0">
          <div className="grow">
            {children}
          </div>
          <Footer />
        </div>
        <MobileTabBar />
        <Analytics />
      </body>
    </html>
  );
}
