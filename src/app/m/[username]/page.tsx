import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ChevronRight } from 'lucide-react';
import { getFoundingMemberCount } from '@/app/actions';
import { toAbsoluteUrl, looksLikeImageUrl, toEmbedUrl, detectReelHost } from '@/lib/mediaUrls';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const FOUNDING_CAP = 100;

const PAYFAST_LINKS = {
  individualMonthly: process.env.PAYFAST_INDIVIDUAL_MONTHLY_URL ?? '#',
  individualAnnual:  process.env.PAYFAST_INDIVIDUAL_ANNUAL_URL  ?? '#',
  businessMonthly:   process.env.PAYFAST_BUSINESS_MONTHLY_URL   ?? '#',
  businessAnnual:    process.env.PAYFAST_BUSINESS_ANNUAL_URL    ?? '#',
};

type MemberRow = {
  id: string;
  full_name: string;
  username: string;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  cover_backdrop: boolean;
  logo_backdrop: boolean;
  tier: 'individual' | 'business';
  status: string;
  availability: string;
  disciplines: string[];
  country: string | null;
  location_city: string | null;
  company_name: string | null;
  company_tagline: string | null;
  company_description: string | null;
  website: string | null;
  reel_url: string | null;
  founding_member_lock: boolean;
  joined_at: string;
  credits: { year: number; title: string; role: string; type: string }[];
  recognition: { year: number; award: string }[];
};

/* ── Metadata ─────────────────────────────────────────────────────── */

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  const { data } = await supabase
    .from('members')
    .select('full_name, tagline, disciplines, avatar_url, tier, company_name')
    .eq('username', username)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return { title: 'Member' };

  const name = data.tier === 'business' ? (data.company_name ?? data.full_name) : data.full_name;
  const desc = data.tagline
    ?? (data.disciplines?.length ? `${data.disciplines.join(', ')} — FRA Founding Member` : 'FRA Founding Member');

  return {
    title: `${name} — FRA Founding Member`,
    description: desc,
    openGraph: {
      title: `${name} — FRA Founding Member`,
      description: desc,
      ...(data.avatar_url ? { images: [{ url: data.avatar_url, width: 400, height: 400 }] } : {}),
    },
  };
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default async function MemberShowcasePage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const [{ data: member }, foundingCount] = await Promise.all([
    supabase
      .from('members')
      .select('*')
      .eq('username', username)
      .eq('status', 'active')
      .maybeSingle(),
    getFoundingMemberCount(),
  ]);

  if (!member) notFound();

  const m = member as MemberRow;
  const remaining = FOUNDING_CAP - foundingCount;
  const pct = Math.min(100, (foundingCount / FOUNDING_CAP) * 100);
  const avatarSrc = looksLikeImageUrl(m.avatar_url) ? toAbsoluteUrl(m.avatar_url) : null;
  const location = [m.location_city, m.country].filter(Boolean).join(', ');
  const displayName = m.tier === 'business' ? (m.company_name ?? m.full_name) : m.full_name;
  const firstName = m.full_name.split(' ')[0];
  const credits = Array.isArray(m.credits) ? m.credits : [];
  const reelEmbed = toEmbedUrl(m.reel_url);
  const reelHost = detectReelHost(m.reel_url);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 pt-8 pb-20 md:pt-12 max-w-3xl">

        {/* ── Breadcrumb ────────────────────────────────────── */}
        <div className="text-[13px] mb-8" style={{ color: 'rgba(250,250,250,0.55)' }}>
          <Link href="/" style={{ color: 'inherit' }}>Home</Link>
          {' / '}
          <Link href="/members" style={{ color: 'inherit' }}>Members</Link>
          {' / '}
          <span style={{ color: 'var(--foreground)' }}>{displayName}</span>
        </div>

        {/* ── Founding Member Spotlight label ────────────────── */}
        <div className="mb-6">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: 'rgba(245,158,11,0.10)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#f59e0b',
            }}
          >
            ★ Founding Member Spotlight
          </span>
        </div>

        {/* ── Profile hero ──────────────────────────────────── */}
        <section
          className="rounded-2xl border border-line p-6 md:p-8"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Avatar */}
            {avatarSrc && (
              <div
                className="shrink-0 rounded-2xl overflow-hidden border border-line-mid"
                style={{
                  width: '140px', height: '140px',
                  background: m.logo_backdrop ? '#f5f5f5' : 'var(--surface-raised)',
                  padding: m.logo_backdrop ? '16px' : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <img
                  src={avatarSrc}
                  alt={displayName}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: m.logo_backdrop ? 'contain' : 'cover',
                  }}
                />
              </div>
            )}

            {/* Name + disciplines */}
            <div className="flex-1 min-w-0">
              <h1
                className="font-heading font-extrabold leading-[1.02] tracking-tight text-foreground"
                style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
              >
                {displayName}
              </h1>

              {m.tagline && (
                <p className="text-[15px] mt-2 italic" style={{ color: 'rgba(250,250,250,0.55)' }}>
                  {m.tagline}
                </p>
              )}

              {m.disciplines && m.disciplines.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {m.disciplines.map((d, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        border: '1px solid rgba(59,130,246,0.25)',
                        color: '#93c5fd',
                        background: 'rgba(59,130,246,0.10)',
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {location && (
                <p className="text-[13px] mt-3" style={{ color: 'rgba(250,250,250,0.45)' }}>
                  📍 {location}
                </p>
              )}

              {m.founding_member_lock && (
                <p className="text-[12px] mt-2 font-semibold" style={{ color: '#f59e0b' }}>
                  Founding member · Joined {new Date(m.joined_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {m.bio && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(250,250,250,0.65)' }}>
                {m.bio}
              </p>
            </div>
          )}

          {/* Selected credits */}
          {credits.length > 0 && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(250,250,250,0.35)' }}>
                Selected Credits
              </p>
              <div className="space-y-2">
                {credits.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-baseline gap-3 text-[14px]">
                    <span className="font-mono text-[12px] shrink-0" style={{ color: '#f59e0b' }}>{c.year}</span>
                    <span className="font-heading font-bold">{c.title}</span>
                    <span className="text-[12px]" style={{ color: 'rgba(250,250,250,0.45)' }}>{c.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reel embed */}
          {reelEmbed && reelHost !== 'unknown' && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(250,250,250,0.35)' }}>
                Reel
              </p>
              <div
                className="rounded-xl overflow-hidden border border-line"
                style={{ aspectRatio: '16/9', position: 'relative' }}
              >
                <iframe
                  src={reelEmbed}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {m.website && (
              <a
                href={m.website.startsWith('http') ? m.website : `https://${m.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors border border-line-mid hover:bg-foreground/[0.04]"
                style={{ color: '#93c5fd' }}
              >
                Website ↗
              </a>
            )}
            {m.reel_url && (
              <a
                href={m.reel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors border border-line-mid hover:bg-foreground/[0.04]"
                style={{ color: 'rgba(250,250,250,0.65)' }}
              >
                Watch reel ↗
              </a>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* ── Membership CTA section ─────────────────────── */}
        {/* ═══════════════════════════════════════════════════ */}

        <section className="mt-10 md:mt-14">
          {/* Connective copy */}
          <div
            className="rounded-2xl border p-6 md:p-8 text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(245,158,11,0.06) 0%, var(--surface) 60%)',
              borderColor: 'rgba(245,158,11,0.20)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#f59e0b' }}>
              Founding Members
            </p>
            <h2 className="font-heading font-extrabold text-[28px] md:text-[36px] leading-tight text-foreground">
              Join {firstName}.
            </h2>
            <p className="text-[15px] mt-3 max-w-md mx-auto" style={{ color: 'var(--foreground-secondary)' }}>
              Subscribers read about opportunities. Members act on them.
              Get your profile in the directory, submit projects for PRS scoring, and let FRA represent you.
            </p>

            {/* Founding counter */}
            <div className="mt-8 max-w-sm mx-auto">
              <div className="flex items-baseline justify-center gap-3">
                <span className="font-heading font-extrabold text-[48px] leading-none text-foreground">
                  {foundingCount}
                </span>
                <span className="text-[22px] font-bold font-heading" style={{ color: 'var(--foreground-tertiary)' }}>
                  / {FOUNDING_CAP}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mt-3" style={{ background: 'var(--surface)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: 'repeating-linear-gradient(45deg, #f59e0b 0 6px, #d97706 6px 12px)',
                  }}
                />
              </div>
              <p className="text-[13px] text-center font-semibold mt-2" style={{ color: '#f59e0b' }}>
                {remaining} founding {remaining === 1 ? 'spot' : 'spots'} remaining · price locked for life
              </p>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <a
                href={PAYFAST_LINKS.individualAnnual}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-blue-600 text-white font-bold text-[14px] rounded-xl transition-colors"
              >
                Individual — R990/yr
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/20">2 months free</span>
              </a>
              <a
                href={PAYFAST_LINKS.businessAnnual}
                className="flex items-center justify-center gap-2 px-6 py-4 font-bold text-[14px] rounded-xl transition-colors border border-amber-500/40 hover:bg-amber-500/10"
                style={{ color: '#f59e0b' }}
              >
                Business — R2,250/yr
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20">2 months free</span>
              </a>
            </div>

            {/* Monthly fallback */}
            <p className="text-[12px] mt-4" style={{ color: 'var(--foreground-tertiary)' }}>
              or{' '}
              <a href={PAYFAST_LINKS.individualMonthly} className="underline hover:no-underline" style={{ color: 'var(--foreground-secondary)' }}>
                R99/mo individual
              </a>
              {' · '}
              <a href={PAYFAST_LINKS.businessMonthly} className="underline hover:no-underline" style={{ color: 'var(--foreground-secondary)' }}>
                R225/mo business
              </a>
            </p>

            {/* Learn more */}
            <div className="mt-6">
              <Link
                href="/members"
                className="inline-flex items-center gap-1 text-[13px] font-semibold transition-colors hover:underline"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                Learn more about membership <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Value props (brief) ─────────────────────────── */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Directory listing',
              desc: 'Permanent profile with filmography — be found by producers, funders, and collaborators across Africa.',
              accent: 'rgba(59,130,246,0.15)',
              border: 'rgba(59,130,246,0.20)',
            },
            {
              title: 'PRS scoring',
              desc: 'Submit your projects for a Project Readiness Score. Get matched with the right opportunities and financiers.',
              accent: 'rgba(245,158,11,0.10)',
              border: 'rgba(245,158,11,0.20)',
            },
            {
              title: 'Representation',
              desc: 'FRA applies on your behalf — to labs, funds, and co-production markets. 10% commission only on successful placement.',
              accent: 'rgba(34,197,94,0.10)',
              border: 'rgba(34,197,94,0.20)',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border p-5"
              style={{ background: item.accent, borderColor: item.border }}
            >
              <h3 className="font-heading font-bold text-[15px] text-foreground">{item.title}</h3>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
}
