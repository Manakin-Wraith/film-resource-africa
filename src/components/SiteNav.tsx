'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

interface SiteNavProps {
  stats: { total: number; closingSoon: number; open: number };
}

const HIDDEN_ROUTES = ['/admin', '/login'];

export default function SiteNav({ stats }: SiteNavProps) {
  const pathname = usePathname();
  const hidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));

  if (hidden) return null;

  return <Header stats={stats} />;
}
