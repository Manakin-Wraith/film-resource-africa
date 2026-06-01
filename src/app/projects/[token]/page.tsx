import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicProjectByToken } from '@/app/actions';
import Breadcrumbs from '@/components/Breadcrumbs';

export const dynamic = 'force-dynamic';

const TIER_BADGE: Record<'early' | 'developing' | 'ready', { label: string; color: string; bg: string }> = {
  early: { label: 'Early Concept', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  developing: { label: 'Developing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ready: { label: 'Funding Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> },
): Promise<Metadata> {
  const { token } = await params;
  const p = await getPublicProjectByToken(token);
  if (!p) return { title: 'Project not found | Film Resource Africa' };
  const desc = p.logline ?? `${[p.format, p.genre].filter(Boolean).join(' · ')} — a project on Film Resource Africa.`;
  return {
    title: `${p.title} — African film in development | Film Resource Africa`,
    description: desc,
    openGraph: { title: p.title, description: desc, siteName: 'Film Resource Africa' },
    twitter: { card: 'summary', title: p.title, description: desc },
    alternates: { canonical: `https://film-resource-africa.com/projects/${token}` },
  };
}

export default async function PublicProjectPage(
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const p = await getPublicProjectByToken(token);
  if (!p) notFound();

  const badge = p.tier ? TIER_BADGE[p.tier] : null;
  const metaLine = [p.format, p.genre, p.stage].filter(Boolean).join(' · ');
  const mailSubject = encodeURIComponent(`Inbound — "${p.title}"${p.member_name ? ` by ${p.member_name}` : ''} (via FRA)`);
  const mailBody = encodeURIComponent(`I'd like to get in touch about "${p.title}" — I saw it on the Film Resource Africa Projects directory.`);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Projects', href: '/projects' },
            { name: p.title, href: `/projects/${token}` },
          ]}
        />

        <header>
          <div className="section-rule section-rule-accent" />
          <span className="section-rubric">Project in development</span>

          {metaLine && (
            <div className="text-xs uppercase tracking-wide mt-2" style={{ color: 'var(--foreground-tertiary)' }}>
              {metaLine}
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mt-1.5">
            <h1 className="text-[28px] md:text-[40px] font-bold font-heading leading-tight text-foreground">
              {p.title}
            </h1>
            {badge && (
              <span
                className="shrink-0 mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap"
                style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.color}33` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
                {badge.label}
              </span>
            )}
          </div>

          {p.country && (
            <div className="text-sm mt-3" style={{ color: 'var(--foreground-secondary)' }}>📍 {p.country}</div>
          )}
        </header>

        {p.logline && (
          <section>
            <div className="section-rubric mb-2">Logline</div>
            <p className="text-[19px] leading-relaxed text-foreground" style={{ maxWidth: '60ch' }}>
              {p.logline}
            </p>
          </section>
        )}

        {p.seeking.length > 0 && (
          <section>
            <div className="section-rubric mb-2.5">Seeking</div>
            <div className="flex flex-wrap gap-2">
              {p.seeking.map((s) => (
                <span
                  key={s}
                  className="text-[13px] font-semibold rounded-lg px-3 py-1.5"
                  style={{ color: 'var(--foreground-secondary)', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Attribution + contact */}
        <section
          className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(180deg, rgba(59,130,246,0.07), transparent 70%), rgba(255,255,255,0.02)' }}
        >
          <div className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
            {p.member_username ? (
              <>
                by{' '}
                <Link href={`/members/${p.member_username}`} className="font-semibold" style={{ color: '#93c5fd' }}>
                  {p.member_name ?? 'a member'} →
                </Link>
              </>
            ) : (
              <>by {p.member_name ?? 'a Film Resource Africa member'}</>
            )}
          </div>
          <a
            href={`mailto:hello@film-resource-africa.com?subject=${mailSubject}&body=${mailBody}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 h-12 font-bold text-[15px] text-white shrink-0"
            style={{ background: '#3b82f6' }}
          >
            ✉ Contact via FRA
          </a>
        </section>

        <p className="text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
          Shared by a Film Resource Africa member. <Link href="/projects" className="underline">Browse all projects →</Link>
        </p>
      </div>
    </main>
  );
}
