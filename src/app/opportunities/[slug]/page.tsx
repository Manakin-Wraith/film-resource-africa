import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, DollarSign, FileText, ExternalLink, Target, FileCheck, CheckCircle2, Clock, Lightbulb, BadgeCheck } from 'lucide-react';
import { getOpportunityBySlug, getOpportunities } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { formatRelativeDate, formatLocalDateTime, formatDeadline } from '@/lib/dateUtils';
import Breadcrumbs from '@/components/Breadcrumbs';
import GeoIndicator from '@/components/GeoIndicator';
import OpportunityMarkdown from '@/components/OpportunityMarkdown';
import ShareButton from '@/components/ShareButton';
import NewsletterCTA from '@/components/NewsletterCTA';

export const dynamic = 'force-dynamic';

const baseUrl = 'https://film-resource-africa.com';

function metaDescription(opp: { 'What Is It?': string }): string {
  const text = decodeHtmlEntities(opp['What Is It?'] || '').replace(/[#*_`]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const opp = await getOpportunityBySlug(slug);
  if (!opp) return { title: 'Opportunity Not Found' };

  const title = decodeHtmlEntities(opp.title);
  const description = metaDescription(opp);

  return {
    // Root layout template appends "| Film Resource Africa"
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Film Resource Africa',
      ...(opp.og_image_url ? { images: [{ url: opp.og_image_url, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: opp.og_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(opp.og_image_url ? { images: [opp.og_image_url] } : {}),
    },
    alternates: {
      canonical: `${baseUrl}/opportunities/${slug}`,
    },
  };
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [opp, allOpportunities] = await Promise.all([
    getOpportunityBySlug(slug),
    getOpportunities(),
  ]);

  if (!opp) notFound();

  const title = decodeHtmlEntities(opp.title);
  const catStyle = getCategoryStyle(opp.category);
  const CatIcon = catStyle.icon;
  const isClosed = opp.application_status === 'closed';
  const deadline = opp.deadline_date ? formatDeadline(opp.deadline_date) : null;
  const applyUrl = opp['Apply:']
    ? (opp['Apply:'].startsWith('http') ? opp['Apply:'] : `https://${opp['Apply:']}`)
    : null;

  // Related: same directory category first, then same country — open listings only
  const related = allOpportunities
    .filter(o =>
      o.id !== opp.id &&
      o.application_status !== 'closed' &&
      ((opp.directory_destination && o.directory_destination === opp.directory_destination) ||
        (opp.country_id && o.country_id === opp.country_id))
    )
    .slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: metaDescription(opp),
    ...(opp.og_image_url ? { image: opp.og_image_url } : {}),
    url: `${baseUrl}/opportunities/${slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Film Resource Africa',
      url: baseUrl,
    },
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="container mx-auto px-4 py-10 max-w-3xl">

        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Opportunities', href: '/#directory' },
          { name: title, href: `/opportunities/${slug}` },
        ]} />

        {/* Hero — og image with scrim, logo chip + geo pill, share */}
        {opp.og_image_url && (
          <div className="relative h-48 md:h-72 rounded-2xl overflow-hidden border border-line mb-8">
            <Image
              src={opp.og_image_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute top-4 right-4">
              <ShareButton title={title} />
            </div>
            <div className="absolute bottom-3 left-4 md:left-6 flex items-center gap-2">
              {opp.logo && (
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-xl px-2.5 py-2 border border-white/10">
                  <Image
                    src={opp.logo}
                    alt=""
                    width={24}
                    height={24}
                    className="object-contain max-w-[24px] max-h-[24px]"
                  />
                </div>
              )}
              <GeoIndicator geoScope={opp.geo_scope} countryIso={opp.country_iso} countryName={opp.country_name} variant="overlay" />
            </div>
          </div>
        )}

        {/* Masthead */}
        <header className="pb-6 mb-6 border-b border-line">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {!opp.og_image_url && opp.logo && (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image
                  src={opp.logo}
                  alt=""
                  width={40}
                  height={40}
                  className="object-contain max-w-[32px] max-h-[32px] md:max-w-[40px] md:max-h-[40px]"
                />
              </div>
            )}
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs uppercase tracking-wider border ${catStyle.bg} ${catStyle.color}`}>
              <CatIcon size={14} />
              {catStyle.label}
            </span>
            <GeoIndicator geoScope={opp.geo_scope} countryIso={opp.country_iso} countryName={opp.country_name} variant="pill" />
            {!opp.og_image_url && <ShareButton title={title} className="ml-auto" />}
          </div>

          <h1 className="text-[28px] md:text-[42px] font-bold font-heading leading-[1.1] mb-4">
            {title}
          </h1>

          {opp.member_name && (
            <p className="text-[13px] mb-4 flex items-center gap-1.5" style={{ color: 'var(--foreground-tertiary)' }}>
              <span className="inline-block w-1 h-1 rounded-full bg-primary" />
              Added by{' '}
              {opp.member_username ? (
                <Link href={`/members/${opp.member_username}`} className="font-medium text-primary hover:underline">
                  {opp.member_name}
                </Link>
              ) : (
                <span className="font-medium text-foreground/70">{opp.member_name}</span>
              )}
            </p>
          )}

          {opp['What Is It?'] && (
            <div className="text-[15px] md:text-base leading-relaxed text-foreground/70">
              <OpportunityMarkdown text={opp['What Is It?']} />
            </div>
          )}
        </header>

        {/* Key facts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {opp['Next Deadline'] && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
              <Calendar size={16} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Deadline</p>
                <p className="text-sm font-semibold text-foreground leading-snug">{decodeHtmlEntities(opp['Next Deadline'])}</p>
                {opp.last_verified_at && (
                  <p
                    title={`Source last re-checked ${formatLocalDateTime(opp.last_verified_at)}`}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-teal-400"
                  >
                    <BadgeCheck size={12} />
                    Verified {formatRelativeDate(opp.last_verified_at)}
                  </p>
                )}
              </div>
            </div>
          )}
          {opp['Cost'] && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
              <DollarSign size={16} className="text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Cost</p>
                <p className="text-sm font-semibold text-foreground leading-snug">{decodeHtmlEntities(opp['Cost'])}</p>
              </div>
            </div>
          )}
          {opp['For Films or Series?'] && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
              <FileText size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Format</p>
                <p className="text-sm font-semibold text-foreground leading-snug">{decodeHtmlEntities(opp['For Films or Series?'])}</p>
              </div>
            </div>
          )}
          {opp['Who Can Apply / Eligibility'] && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
              <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Eligibility</p>
                <div className="text-sm font-semibold text-foreground leading-snug"><OpportunityMarkdown text={opp['Who Can Apply / Eligibility']} /></div>
              </div>
            </div>
          )}
        </div>

        {/* What You Get + What to Submit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {opp['What Do You Get If Selected?'] && (
            <section className="p-5 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--foreground-tertiary)' }}>
                <Target size={12} /> What You Get
              </h2>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                <OpportunityMarkdown text={opp['What Do You Get If Selected?']} />
              </div>
            </section>
          )}
          {opp['What to Submit'] && (
            <section className="p-5 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--foreground-tertiary)' }}>
                <FileCheck size={12} /> What to Submit
              </h2>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                <OpportunityMarkdown text={opp['What to Submit']} />
              </div>
            </section>
          )}
        </div>

        {/* Insider Tips */}
        {opp['Strongest Submission Tips'] && (
          <section className="p-5 rounded-xl border border-white/[0.08] mb-6" style={{ background: 'var(--surface-raised)' }}>
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--foreground-tertiary)' }}>
              <Lightbulb size={12} /> Insider Tips
            </h2>
            <div className="text-sm leading-relaxed italic" style={{ color: 'var(--foreground-secondary)' }}>
              <OpportunityMarkdown text={opp['Strongest Submission Tips']} />
            </div>
          </section>
        )}

        {/* Calendar Reminder */}
        {opp['CALENDAR REMINDER:'] && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-white/[0.08] mb-8" style={{ background: 'var(--surface-raised)' }}>
            <Clock size={16} className="text-accent flex-shrink-0" />
            <p className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
              {decodeHtmlEntities(opp['CALENDAR REMINDER:'])}
            </p>
          </div>
        )}

        {/* Apply band — closed listings keep the page but lose the CTA */}
        {isClosed || deadline?.urgency === 'passed' ? (
          <div className="flex items-center gap-3 px-6 py-5 rounded-2xl border border-white/[0.1] mb-12" style={{ background: 'var(--surface-raised)' }}>
            <Clock size={18} className="flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }} />
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">Applications are closed</p>
              <p className="text-[13px]" style={{ color: 'var(--foreground-tertiary)' }}>
                This opportunity is no longer accepting applications.{' '}
                <Link href="/#directory" className="text-primary hover:underline font-medium">Browse open opportunities</Link>
              </p>
            </div>
          </div>
        ) : applyUrl && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl border border-primary/25 bg-primary/10 mb-12">
            <div className="text-center md:text-left">
              {deadline && deadline.urgency !== 'normal' && (
                <p className="text-sm font-semibold text-foreground mb-0.5">{deadline.countdownText}</p>
              )}
              <p className="text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
                Verify dates and eligibility on the official website before applying.
              </p>
            </div>
            {/* Plain anchor (not ui/Button): icon components can't cross the
                server→client boundary as props */}
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-7 py-3.5 text-sm rounded-xl min-h-[48px] transition-colors"
            >
              Apply Now <ExternalLink size={15} aria-hidden />
            </a>
          </div>
        )}

        {/* Related opportunities */}
        {related.length > 0 && (
          <section className="mb-12">
            <div className="h-px mb-5" style={{ background: 'var(--border)' }} />
            <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-tertiary)' }}>
              Related Opportunities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {related.map((rel) => {
                const relCat = getCategoryStyle(rel.category);
                const relDeadline = rel.deadline_date ? formatDeadline(rel.deadline_date) : null;
                return (
                  <Link
                    key={rel.id}
                    href={`/opportunities/${rel.slug}`}
                    className="p-4 rounded-xl border border-white/8 hover:border-white/16 hover:-translate-y-0.5 transition-all group"
                    style={{ background: 'var(--surface)' }}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${relCat.color}`}>
                      {relCat.label}
                    </span>
                    <h3 className="text-[13px] font-bold font-heading text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                      {decodeHtmlEntities(rel.title)}
                    </h3>
                    {relDeadline && relDeadline.urgency !== 'passed' && (
                      <span className="text-[11px] font-medium text-accent">{relDeadline.countdownText}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <div className="mb-6">
          <NewsletterCTA
            variant="banner"
            heading="Never miss a deadline like this"
            subtext="Weekly deadline alerts, new opportunities, and industry insights for African filmmakers."
          />
        </div>

      </div>
    </main>
  );
}
