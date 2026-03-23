const SITE_URL = 'https://film-resource-africa.com';
const SITE_NAME = 'Film Resource Africa';
const SITE_LOGO = `${SITE_URL}/logo_FRA.png`;

/** Organization + WebSite schemas — rendered once in the root layout */
export function OrganizationJsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    description:
      'A curated directory of screenwriting labs, co-production funds, grants, fellowships, and pitch forums for African filmmakers and producers.',
    sameAs: [
      'https://x.com/FilmResAfrica',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE_URL}`,
    },
  };

  const webSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'A curated directory of screenwriting labs, co-production funds, grants, fellowships, and pitch forums for African filmmakers and producers.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_LOGO },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }}
      />
    </>
  );
}

/** FAQ schema — for the homepage */
export function HomepageFaqJsonLd() {
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Film Resource Africa?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Film Resource Africa is a curated directory connecting African filmmakers to grants, funding opportunities, festivals, screenwriting labs, co-production funds, fellowships, and pitch forums across the continent and internationally.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I find film grants for African filmmakers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Browse our directory of 125+ opportunities filtered by category including grants, fellowships, labs, and festivals. Each listing includes eligibility requirements, deadlines, and direct application links.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Film Resource Africa free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Film Resource Africa is completely free to browse. You can access all opportunity listings, news, and industry resources without any subscription or payment.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I submit an opportunity to Film Resource Africa?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can submit new opportunities through our submission form. All submissions are reviewed and verified by our team before being published to the directory.',
        },
      },
      {
        '@type': 'Question',
        name: 'What types of opportunities are listed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We list grants, fellowships, screenwriting labs, co-production funds, pitch forums, film festivals, residencies, and training programs relevant to African filmmakers and producers.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
    />
  );
}

/** BreadcrumbList schema — pass an array of {name, href} items */
export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
    />
  );
}

/** ItemList schema — for listing pages (opportunities, news) */
export function ItemListJsonLd({
  name,
  description,
  items,
}: {
  name: string;
  description: string;
  items: { name: string; url: string }[];
}) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
    />
  );
}
