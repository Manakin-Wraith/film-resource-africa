import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbJsonLd, type BreadcrumbItem } from './JsonLd';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <>
      <BreadcrumbJsonLd items={items} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-foreground/50 flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight size={14} className="text-foreground/30" />}
                {isLast ? (
                  <span className="text-foreground/70 font-medium truncate max-w-[200px] md:max-w-none">
                    {index === 0 && <Home size={14} className="inline mr-1 -mt-0.5" />}
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {index === 0 && <Home size={14} className="-mt-0.5" />}
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
