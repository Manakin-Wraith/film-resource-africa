import type { Metadata } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import SiteShell from '@/components/SiteShell';

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
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-foreground bg-background">
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
