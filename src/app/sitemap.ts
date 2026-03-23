import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const baseUrl = 'https://film-resource-africa.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/call-sheet`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/industry`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/community-spotlight`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/call-sheet/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/industry/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Dynamic news article pages
  let newsPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: articles } = await supabase
      .from('news')
      .select('slug, published_at')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .order('published_at', { ascending: false });

    if (articles) {
      newsPages = articles.map((article) => ({
        url: `${baseUrl}/news/${article.slug}`,
        lastModified: new Date(article.published_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Sitemap: failed to fetch news articles', error);
  }

  // Country / location pages
  let countryPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: countries } = await supabase
      .from('countries')
      .select('slug, updated_at')
      .order('name');

    if (countries) {
      countryPages = [
        {
          url: `${baseUrl}/film-opportunities`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        },
        ...countries.map((c) => ({
          url: `${baseUrl}/film-opportunities/${c.slug}`,
          lastModified: new Date(c.updated_at),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })),
      ];
    }
  } catch (error) {
    console.error('Sitemap: failed to fetch countries', error);
  }

  return [...staticPages, ...newsPages, ...countryPages];
}
