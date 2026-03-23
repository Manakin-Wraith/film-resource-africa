import { getPublishedSpotlights } from '@/app/actions';
import { Star, ArrowLeft, ArrowRight, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SpotlightSubmitForm from './SpotlightSubmitForm';

export const dynamic = 'force-dynamic';

function RelativeDate({ date }: { date: string }) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return <span>Today</span>;
  if (diffDays === 1) return <span>Yesterday</span>;
  if (diffDays < 7) return <span>{diffDays} days ago</span>;
  if (diffDays < 30) return <span>{Math.floor(diffDays / 7)}w ago</span>;
  return <span>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>;
}

export default async function CommunitySpotlightPage() {
  const spotlights = await getPublishedSpotlights();

  return (
    <main className="min-h-screen bg-background relative z-10 p-4 md:p-8 pt-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <Link href="/news" className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-medium mb-6 transition-colors self-start md:self-auto">
            <ArrowLeft size={18} /> Back to News
          </Link>
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 border border-yellow-500/30">
            <Star size={32} className="text-yellow-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-balance bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-400">
            Community Spotlight
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl text-balance">
            Celebrating the achievements of African filmmakers — awards, selections, funding wins, and career milestones.
          </p>
        </div>

        {/* Published Stories Grid */}
        {spotlights.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/20">
                <Star size={20} className="text-yellow-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold font-heading">Featured Stories</h2>
              <span className="text-foreground/40 text-sm font-medium ml-auto">{spotlights.length} {spotlights.length === 1 ? 'story' : 'stories'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spotlights.map((item) => {
                const href = item.slug ? `/news/${item.slug}` : '#';
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="glass-card rounded-[1.5rem] border border-white/10 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(234,179,8,0.2)] transition-all duration-300 group flex flex-col overflow-hidden"
                  >
                    {item.image_url && (
                      <div className="relative w-full h-48 overflow-hidden">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                          <Star size={12} />
                          Spotlight
                        </span>
                        <span className="text-foreground/40 text-xs whitespace-nowrap flex items-center gap-1">
                          <Clock size={12} />
                          <RelativeDate date={item.published_at} />
                        </span>
                      </div>

                      <h3 className="text-xl font-bold font-heading mb-2 group-hover:text-yellow-400 transition-colors leading-snug">
                        {item.title}
                      </h3>

                      {item.project_name && (
                        <p className="text-xs text-yellow-400/60 font-medium mb-2">{item.project_name}</p>
                      )}

                      <p className="text-foreground/60 text-sm leading-relaxed flex-grow mb-4">
                        {item.summary}
                      </p>

                      {item.submitted_by_name && (
                        <p className="text-xs text-foreground/30 mb-3">By {item.submitted_by_name}</p>
                      )}

                      <span className="inline-flex items-center gap-2 text-yellow-400 text-sm font-semibold mt-auto group-hover:gap-3 transition-all">
                        Read story <ArrowRight size={14} />
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
          <div className="text-center py-12 mb-12 glass-card rounded-[2rem] border border-white/10">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
              <Star size={28} className="text-yellow-400/60" />
            </div>
            <h3 className="text-xl font-bold font-heading mb-2">No stories yet</h3>
            <p className="text-foreground/50 max-w-md mx-auto">Be the first to share your story with the African film community.</p>
          </div>
        )}

        {/* Submit Form Section */}
        <section id="submit" className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/20">
              <Plus size={20} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-heading">Share Your Story</h2>
              <p className="text-foreground/50 text-sm">Won an award? Selected for a festival? Got your film funded? Tell us about it.</p>
            </div>
          </div>

          <SpotlightSubmitForm />
        </section>
      </div>
    </main>
  );
}
