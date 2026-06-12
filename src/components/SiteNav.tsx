'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

const HIDDEN_ROUTES = ['/admin', '/login'];

export default function SiteNav() {
  const pathname = usePathname();
  const hidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));

  if (hidden) return null;

  return <Header />;
}
