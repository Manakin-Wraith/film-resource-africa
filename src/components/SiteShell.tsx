'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import SiteNav from '@/components/SiteNav';
import MobileTabBar from '@/components/MobileTabBar';

/**
 * Wraps page content with the FRA site chrome (nav, footer, mobile tab bar,
 * film-grain texture, background gradient). AFX routes (`/afx/*`) render
 * chrome-free so the finance layer can present its own standalone shell.
 *
 * The `film-grain` class used to live on <body>; it moved here so it only
 * applies to FRA routes. Its ::before is position:fixed, so wrapping it in a
 * div doesn't change the visual result for FRA pages.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAfx = pathname?.startsWith('/afx');

  if (isAfx) {
    return <>{children}</>;
  }

  return (
    <div className="film-grain">
      <div className="site-bg" aria-hidden="true" />
      <SiteNav />
      <div className="relative z-10 flex flex-col min-h-screen pt-(--header-h) pb-(--tabbar-h) md:pb-0">
        <div className="grow">{children}</div>
        <Footer />
      </div>
      <MobileTabBar />
    </div>
  );
}
