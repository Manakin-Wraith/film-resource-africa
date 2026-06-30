import type { Metadata } from 'next';
import { Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './afx.css';

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--afx-font-body',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--afx-font-mono',
});

export const metadata: Metadata = {
  title: 'AFX — Deal Screening',
  description: 'AFX finance layer — producer cockpit and funder deal screening.',
  robots: { index: false, follow: false },
};

export default function AfxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${hanken.variable} ${plexMono.variable} afx-root`}>
      {children}
    </div>
  );
}
