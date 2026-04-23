import { getPublishedSpotlights } from '@/app/actions';
import { Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs';
import SpotlightSubmitForm from './SpotlightSubmitForm';

export const dynamic = 'force-dynamic';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function CommunitySpotlightPage() {
  const spotlights = await getPublishedSpotlights();

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-14">

        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'News', href: '/news' },
            { name: 'Community Spotlight', href: '/community-spotlight' },
          ]}
        />

        {/* Editorial header */}
        <header>
          <div className="section-rule section-rule-accent" />
          <span className="section-rubric">Community</span>
          <div className="flex items-baseline justify-between">
            <h1 className="text-[26px] md:text-[38px] font-bold font-heading leading-tight text-foreground">
              Community Spotlight
            </h1>
            {spotlights.length > 0 && (
              <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
                {spotlights.length} {spotlights.length === 1 ? 'story' : 'stories'}
              </span>
            )}
          </div>
          <p className="mt-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--foreground-secondary)' }}>
            Celebrating the achievements of African filmmakers — awards, selections, funding wins, and career milestones.
          </p>
        </header>

        {/* Published Stories */}
        {spotlights.length > 0 && (
          <section>
            <div className="h-px mb-5" style={{ background: 'var(--border)' }} />
            <h2 className="text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--foreground-tertiary)' }}>
              Featured Stories
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spotlights.map((item) => {
                const href = item.slug ? `/news/${item.slug}` : '#';
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="rounded-xl border border-white/[0.08] hover:border-white/[0.16] transition-all group flex flex-col overflow-hidden"
                    style={{ background: 'var(--surface)' }}
                  >
                    {item.image_url && (
                      <div className="relative w-full h-44 overflow-hidden">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="editorial-label text-amber-400">
                          <Star size={10} className="inline mr-1" />
                          Spotlight
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--foreground-tertiary)' }}>
                          {formatDate(item.published_at)}
                        </span>
                      </div>

                      <h3 className="text-[16px] font-bold font-heading leading-snug text-foreground group-hover:text-amber-400 transition-colors mb-2">
                        {item.title}
                      </h3>

                      {item.project_name && (
                        <p className="text-[12px] font-medium mb-2 text-amber-400/70">{item.project_name}</p>
                      )}

                      <p className="text-[13px] leading-relaxed flex-grow mb-4 line-clamp-3" style={{ color: 'var(--foreground-secondary)' }}>
                        {item.summary}
                      </p>

                      {item.submitted_by_name && (
                        <p className="text-[11px] mb-3" style={{ color: 'var(--foreground-tertiary)' }}>
                          By {item.submitted_by_name}
                        </p>
                      )}

                      <span className="inline-flex items-center gap-1.5 text-amber-400 text-[13px] font-semibold mt-auto group-hover:gap-2.5 transition-all">
                        Read story <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {spotlights.length === 0 && (
          <div className="text-center py-14 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface)' }}>
            <Star size={28} className="text-amber-400/50 mx-auto mb-4" />
            <h3 className="text-[17px] font-bold font-heading mb-2">No stories yet</h3>
            <p className="text-[14px]" style={{ color: 'var(--foreground-secondary)' }}>
              Be the first to share your story with the African film community.
            </p>
          </div>
        )}

        {/* Submit Form */}
        <section id="submit">
          <div className="h-px mb-5" style={{ background: 'var(--border)' }} />
          <span className="section-rubric">Submit</span>
          <h2 className="text-[22px] md:text-[28px] font-bold font-heading leading-tight text-foreground mb-2">
            Share Your Story
          </h2>
          <p className="text-[14px] mb-8" style={{ color: 'var(--foreground-secondary)' }}>
            Won an award? Selected for a festival? Got your film funded? Tell us about it.
          </p>
          <SpotlightSubmitForm />
        </section>

      </div>
    </main>
  );
}
