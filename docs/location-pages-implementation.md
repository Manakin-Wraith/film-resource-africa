# Location Pages Implementation Guide
## Technical Implementation for Film Resource Africa

**Created:** March 21, 2026  
**Tech Stack:** Next.js 14 + Supabase + TypeScript  
**Objective:** Quick implementation of location-specific SEO pages

---

## 1. Database Schema Updates

### Add Country Metadata Table
```sql
-- Create countries table
CREATE TABLE countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  iso_code CHAR(2),
  region TEXT,
  film_industry_size TEXT, -- small/medium/large
  annual_productions INTEGER,
  major_studios TEXT[],
  notable_filmmakers TEXT[],
  filming_permit_info TEXT,
  tax_incentives TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add country_id to opportunities table
ALTER TABLE opportunities 
ADD COLUMN country_id UUID REFERENCES countries(id);

-- Create index for performance
CREATE INDEX idx_opportunities_country_id ON opportunities(country_id);
CREATE INDEX idx_countries_slug ON countries(slug);
```

### Add Country-Opportunity Relationship Table
```sql
-- For opportunities that span multiple countries
CREATE TABLE opportunity_countries (
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, country_id)
);
```

## 2. Next.js Page Structure

### File Structure
```
src/
├── app/
│   ├── film-opportunities/
│   │   ├── [country]/
│   │   │   ├── page.tsx          # Main country page
│   │   │   ├── layout.tsx        # Country-specific layout
│   │   │   └── loading.tsx       # Loading state
│   │   └── page.tsx              # Countries index page
├── components/
│   ├── location/
│   │   ├── CountryHero.tsx       # Country hero section
│   │   ├── OpportunityGrid.tsx   # Filtered opportunities
│   │   ├── SuccessStories.tsx    # Local success stories
│   │   └── CountryStats.tsx      # Industry statistics
└── lib/
    └── countries.ts              # Country data utilities
```

### Dynamic Route Page (`/film-opportunities/[country]/page.tsx`)
```typescript
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CountryHero from '@/components/location/CountryHero';
import OpportunityGrid from '@/components/location/OpportunityGrid';
import SuccessStories from '@/components/location/SuccessStories';
import CountryStats from '@/components/location/CountryStats';

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { country } = await params;
  const countryData = await getCountryData(country);
  
  if (!countryData) {
    return {
      title: 'Country Not Found | Film Resource Africa',
      description: 'Film opportunities directory for African countries',
    };
  }

  return {
    title: `Film Opportunities in ${countryData.name} | Film Resource Africa`,
    description: `Comprehensive guide to film festivals, grants, labs, and industry resources in ${countryData.name}. Updated ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`,
    openGraph: {
      title: `Film Opportunities in ${countryData.name}`,
      description: `Find film festivals, funding, and resources in ${countryData.name}`,
      images: [`/api/og/country/${countryData.slug}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Film Opportunities in ${countryData.name}`,
      description: `Your guide to filmmaking in ${countryData.name}`,
    },
  };
}

async function getCountryData(slug: string) {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching country:', error);
    return null;
  }

  return data;
}

async function getCountryOpportunities(countryId: string) {
  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      opportunity_countries!inner(country_id)
    `)
    .eq('opportunity_countries.country_id', countryId)
    .eq('status', 'open')
    .order('deadline', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }

  return data;
}

export default async function CountryPage({ params }: PageProps) {
  const { country } = await params;
  const countryData = await getCountryData(country);
  
  if (!countryData) {
    notFound();
  }

  const opportunities = await getCountryOpportunities(countryData.id);

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Film Opportunities in ${countryData.name}`,
            description: `Film resource directory for ${countryData.name}`,
            address: {
              '@type': 'PostalAddress',
              addressCountry: countryData.name,
            },
            url: `https://film-resource-africa.com/film-opportunities/${countryData.slug}`,
            potentialAction: {
              '@type': 'SearchAction',
              target: `https://film-resource-africa.com/search?country=${countryData.slug}`,
              'query-input': 'required name=search_term',
            },
          }),
        }}
      />

      <CountryHero country={countryData} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <OpportunityGrid 
              opportunities={opportunities} 
              country={countryData.name}
            />
          </div>
          
          <div className="space-y-8">
            <CountryStats country={countryData} />
            <SuccessStories countryId={countryData.id} />
            
            {/* Newsletter Signup */}
            <div className="bg-primary/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">
                Get {countryData.name} Film Updates
              </h3>
              <p className="text-foreground/60 mb-4">
                Receive deadline alerts and new opportunities for {countryData.name}.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                />
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  Subscribe to {countryData.name} Updates
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static paths for top countries
export async function generateStaticParams() {
  const { data: countries } = await supabase
    .from('countries')
    .select('slug')
    .limit(20);

  return countries?.map((country) => ({
    country: country.slug,
  })) || [];
}
```

## 3. Country Hero Component

```typescript
// components/location/CountryHero.tsx
interface CountryHeroProps {
  country: {
    name: string;
    iso_code?: string;
    region?: string;
    film_industry_size?: string;
  };
}

export default function CountryHero({ country }: CountryHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
      <div className="absolute inset-0 pattern-africa opacity-10"></div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            {country.iso_code && (
              <div className="text-4xl">
                {getFlagEmoji(country.iso_code)}
              </div>
            )}
            <div>
              <h1 className="text-5xl md:text-7xl font-bold font-heading mb-2">
                Film Opportunities in {country.name}
              </h1>
              <div className="flex items-center gap-4 text-foreground/60">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {country.region}
                </span>
                <span className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  {country.film_industry_size || 'Growing'} Film Industry
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-xl text-foreground/80 mb-8">
            Your comprehensive guide to film festivals, funding opportunities, 
            training programs, and industry resources in {country.name}. 
            Updated daily with new opportunities and deadlines.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a
              href="#festivals"
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              🎬 Festivals
            </a>
            <a
              href="#funding"
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
            >
              💰 Funding
            </a>
            <a
              href="#training"
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              🎓 Training
            </a>
            <a
              href="#resources"
              className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors"
            >
              🏢 Resources
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
```

## 4. Supabase Functions for Data Management

```typescript
// lib/countries.ts
import { supabase } from './supabase';

export interface Country {
  id: string;
  name: string;
  slug: string;
  iso_code: string;
  region: string;
  film_industry_size: 'small' | 'medium' | 'large';
  annual_productions: number;
  major_studios: string[];
  notable_filmmakers: string[];
  filming_permit_info: string;
  tax_incentives: string;
  created_at: string;
  updated_at: string;
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching country:', error);
    return null;
  }

  return data;
}

export async function getCountriesWithOpportunities(): Promise<Array<{
  country: Country;
  opportunity_count: number;
}>> {
  const { data, error } = await supabase
    .from('countries')
    .select(`
      *,
      opportunity_countries(count)
    `)
    .order('name');

  if (error) {
    console.error('Error fetching countries:', error);
    return [];
  }

  return data.map(country => ({
    country,
    opportunity_count: country.opportunity_countries?.[0]?.count || 0,
  }));
}

export async function updateCountryOpportunities(
  countryId: string,
  opportunityIds: string[]
): Promise<void> {
  // Clear existing relationships
  await supabase
    .from('opportunity_countries')
    .delete()
    .eq('country_id', countryId);

  // Add new relationships
  if (opportunityIds.length > 0) {
    const relationships = opportunityIds.map(oppId => ({
      opportunity_id: oppId,
      country_id: countryId,
    }));

    await supabase
      .from('opportunity_countries')
      .insert(relationships);
  }
}
```

## 5. SEO Optimization Components

### Breadcrumb Navigation
```typescript
// components/location/Breadcrumbs.tsx
interface BreadcrumbsProps {
  country: {
    name: string;
    slug: string;
  };
}

export default function Breadcrumbs({ country }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-foreground/60 mb-8">
      <a href="/" className="hover:text-foreground transition-colors">
        Home
      </a>
      <span>/</span>
      <a 
        href="/film-opportunities" 
        className="hover:text-foreground transition-colors"
      >
        Film Opportunities
      </a>
      <span>/</span>
      <span className="text-foreground font-medium">
        {country.name}
      </span>
      
      {/* JSON-LD Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://film-resource-africa.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Film Opportunities',
                item: 'https://film-resource-africa.com/film-opportunities',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: country.name,
                item: `https://film-resource-africa.com/film-opportunities/${country.slug}`,
              },
            ],
          }),
        }}
      />
    </nav>
  );
}
```

### FAQ Schema Component
```typescript
// components/location/CountryFAQ.tsx
interface FAQItem {
  question: string;
  answer: string;
}

interface CountryFAQProps {
  countryName: string;
  faqs: FAQItem[];
}

export default function CountryFAQ({ countryName, faqs }: CountryFAQProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Frequently Asked Questions about Filming in {countryName}
      </h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white/5 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
            <p className="text-foreground/60">{faq.answer}</p>
          </div>
        ))}
      </div>
      
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq, index) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
```

## 6. Sitemap Generation

```typescript
// app/sitemap.ts
import { supabase } from '@/lib/supabase';

export default async function sitemap() {
  const baseUrl = 'https://film-resource-africa.com';
  
  // Fetch all countries
  const { data: countries } = await supabase
    .from('countries')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false });

  const countryUrls = countries?.map(country => ({
    url: `${baseUrl}/film-opportunities/${country.slug}`,
    lastModified: country.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/film-opportunities`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...countryUrls,
  ];
}
```

## 7. Robots.txt Configuration

```txt
# app/robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/

Sitemap: https://film-resource-africa.com/sitemap.xml

# Country pages should be indexed
User-agent: Googlebot
Allow: /film-opportunities/

# Social media crawlers
User-agent: Twitterbot
Allow: /
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /
Crawl-delay: 2
```

## 8. Implementation Checklist

### Phase 1: Database & Backend (Day 1-2)
- [ ] Create countries table in Supabase
- [ ] Add country_id to opportunities table
- [ ] Create opportunity_countries junction table
- [ ] Set up indexes for performance
- [ ] Create seed data for Tier 1 countries
- [ ] Write Supabase functions for data management

### Phase 2: Frontend Components (Day 3-4)
- [ ] Create dynamic route `/film-opportunities/[country]`
- [ ] Build CountryHero component with flag and stats
- [ ] Create OpportunityGrid with country filtering
- [ ] Build SuccessStories component
- [ ] Create CountryStats display
- [ ] Implement Breadcrumb navigation
- [ ] Build CountryFAQ component with schema

### Phase 3: SEO Implementation (Day 5)
- [ ] Add JSON-LD structured data templates
- [ ] Implement generateMetadata for each country
- [ ] Create sitemap.xml generator
- [ ] Add robots.txt configuration
- [ ] Set up Open Graph and Twitter Card meta
- [ ] Implement generateStaticParams for SSG

### Phase 4: Content Creation (Day 6-7)
- [ ] Research and write content for Nigeria
- [ ] Research and write content for South Africa
- [ ] Research and write content for Kenya
- [ ] Research and write content for Ghana
- [ ] Add country-specific FAQs
- [ ] Create success stories for each country

### Phase 5: Testing & Launch (Day 8-10)
- [ ] Test all country pages for mobile responsiveness
- [ ] Verify structured data with Google Rich Results Test
- [ ] Check page speed with Lighthouse
- [ ] Test internal linking between pages
- [ ] Verify sitemap.xml generation
- [ ] Set up Google Search Console monitoring
- [ ] Launch first 4 country pages
- [ ] Monitor initial traffic and rankings

## 9. Quick Start Commands

### Database Setup
```bash
# Run SQL migrations
psql -h YOUR_SUPABASE_URL -d postgres -f supabase/migrations/001_countries.sql

# Seed initial data
node scripts/seed-countries.js
```

### Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### SEO Testing
```bash
# Check structured data
npx structured-data-testing-tool https://film-resource-africa.com/film-opportunities/nigeria

# Generate sitemap
npm run generate-sitemap

# Submit to Google
npx sitemap-submitter --url https://film-resource-africa.com/sitemap.xml
```

## 10. Monitoring & Analytics

### Google Analytics Setup
```typescript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  );
}
```

### Performance Monitoring
```typescript
// lib/analytics.ts
export function trackCountryPageView(countrySlug: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: `Film Opportunities in ${countrySlug}`,
      page_location: window.location.href,
      page_path: `/film-opportunities/${countrySlug}`,
    });
  }
}

export function trackOpportunityClick(
  opportunityId: string, 
  countrySlug: string
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'select_content', {
      content_type: 'opportunity',
      content_id: opportunityId,
      country: countrySlug,
    });
  }
}
```

## 11. Maintenance Scripts

### Opportunity Sync Script
```javascript
// scripts/sync-country-opportunities.js
const { supabase } = require('../lib/supabase');

async function syncCountryOpportunities() {
  console.log('Syncing country opportunities...');
  
  // Get all opportunities
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, description');
  
  // Simple country detection from title/description
  for (const opp of opportunities) {
    const detectedCountries = detectCountries(opp.title + ' ' + opp.description);
    
    if (detectedCountries.length > 0) {
      await updateCountryRelationships(opp.id, detectedCountries);
    }
  }
  
  console.log('Sync completed');
}

function detectCountries(text) {
  const countries = [
    { name: 'Nigeria', keywords: ['nigeria', 'nigerian', 'lagos', 'nollywood'] },
    { name: 'South Africa', keywords: ['south africa', 'south african', 'cape town', 'johannesburg'] },
    // Add more countries...
  ];
  
  const detected = [];
  const lowerText = text.toLowerCase();
  
  for (const country of countries) {
    if (country.keywords.some(keyword => lowerText.includes(keyword))) {
      detected.push(country.name);
    }
  }
  
  return detected;
}
```

### Content Update Script
```javascript
// scripts/update-country-content.js
const { supabase } = require('../lib/supabase');
const { updateCountryData } = require('../lib/countries');

async function updateAllCountries() {
  const { data: countries } = await supabase
    .from('countries')
    .select('id, name, slug');
  
  for (const country of countries) {
    console.log(`Updating ${country.name}...`);
    
    // Fetch latest opportunities
    const opportunities = await getLatestOpportunities(country.id);
    
    // Update country page
    await updateCountryPage(country.slug, {
      opportunity_count: opportunities.length,
      last_updated: new Date().toISOString(),
    });
    
    // Generate new content if needed
    if (opportunities.length > 0) {
      await generateCountrySummary(country, opportunities);
    }
  }
}
```

## 12. Success Metrics Dashboard

Create a simple dashboard to track performance:

```typescript
// app/dashboard/countries/page.tsx
import { getCountriesWithStats } from '@/lib/analytics';

export default async function CountriesDashboard() {
  const countries = await getCountriesWithStats();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Country Pages Performance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {countries.map(country => (
          <div key={country.id} className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-2">{country.name}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-foreground/60">Visits</span>
                <span className="font-bold">{country.visits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Opportunities</span>
                <span className="font-bold">{country.opportunity_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Avg. Time</span>
                <span className="font-bold">{Math.round(country.avg_time)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Bounce Rate</span>
                <span className="font-bold">{country.bounce_rate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 13. Next Steps After Implementation

### Week 2-4:
1. **Expand to Tier 2 countries** (12 more countries)
2. **Implement advanced filtering** by opportunity type, deadline, etc.
3. **Add comparison features** between countries
4. **Create regional pages** (West Africa, East Africa, etc.)

### Month 2-3:
5. **Add user-generated content** (filmmaker reviews, tips)
6. **Implement AI-powered recommendations**
7. **Create downloadable resources** (filming permit guides, etc.)
8. **Build email automation** for country-specific updates

### Ongoing:
9. **Weekly content updates** for new opportunities
10. **Monthly performance reviews** and optimization
11. **Quarterly content refreshes** based on analytics
12. **Continuous SEO improvement** based on search trends

---

## Support & Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Schema.org Reference](https://schema.org/docs/full.html)

### Tools
- **SEO Testing:** [Google Rich Results Test](https://search.google.com/test/rich-results)
- **Performance:** [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- **Analytics:** [Google Search Console](https://search.google.com/search-console)

### Contact
For implementation support:
- **Technical Issues:** dev@film-resource-africa.com
- **Content Questions:** content@film-resource-africa.com
- **SEO Strategy:** seo@film-resource-africa.com

---

**Implementation Timeline:** 10 days for MVP (4 countries)  
**Expected Traffic Increase:** 200-500% within 3 months  
**ROI Timeline:** 6 months for full strategy implementation

*Last Updated: March 21, 2026*  
*Next Review: After MVP Launch*