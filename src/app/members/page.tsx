import { Metadata } from 'next';
import Link from 'next/link';
import { Lock, ChevronRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getFoundingMemberCount } from '@/app/actions';
import { getSessionUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Members',
  description: 'Join FRA as an Individual or Business member. Permanent directory listing, project readiness scoring, and representation for African filmmakers.',
};

const FOUNDING_CAP = 100;

/* ── Founding counter ─────────────────────────────────────────────── */
function FoundingCounter({ count }: { count: number }) {
  const pct = Math.min(100, (count / FOUNDING_CAP) * 100);
  const remaining = FOUNDING_CAP - count;

  return (
    <div
      className="rounded-xl border border-line p-6 md:p-8"
      style={{ background: 'var(--surface-raised)' }}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
          <span className="section-rubric mb-0">Founding Members</span>
          <div className="flex items-baseline gap-3">
            <span className="font-heading font-extrabold text-[56px] md:text-[72px] leading-none text-foreground">
              {count}
            </span>
            <span className="text-[28px] font-bold font-heading" style={{ color: 'var(--foreground-tertiary)' }}>
              / {FOUNDING_CAP}
            </span>
          </div>
          <p className="text-[14px]" style={{ color: 'var(--foreground-secondary)' }}>
            founding spots taken · price locked for life
          </p>
        </div>

        <div className="md:min-w-[280px] space-y-2.5">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: 'repeating-linear-gradient(45deg, #f59e0b 0 6px, #d97706 6px 12px)',
              }}
            />
          </div>
          <p className="text-[13px] text-right font-semibold" style={{ color: '#f59e0b' }}>
            {remaining} {remaining === 1 ? 'spot' : 'spots'} remaining
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Tier comparison ──────────────────────────────────────────────── */

const PAYFAST_LINKS = {
  individualMonthly: process.env.PAYFAST_INDIVIDUAL_MONTHLY_URL ?? '#',
  individualAnnual:  process.env.PAYFAST_INDIVIDUAL_ANNUAL_URL  ?? '#',
  businessMonthly:   process.env.PAYFAST_BUSINESS_MONTHLY_URL   ?? '#',
  businessAnnual:    process.env.PAYFAST_BUSINESS_ANNUAL_URL    ?? '#',
};

function TierComparison() {
  return (
    <section id="pricing" className="mt-14 md:mt-20">
      <div className="section-rule section-rule-accent" />
      <span className="section-rubric">Choose your tier</span>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

        {/* ── Individual ── */}
        <div
          className="rounded-xl border border-line p-7 flex flex-col gap-5"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border bg-primary/10 border-primary/20 text-[color:var(--color-primary-text)]">
              Individual
            </span>
          </div>

          <div>
            <h2 className="font-heading font-bold text-[26px] text-foreground leading-tight">The maker.</h2>
            <p className="text-[14px] mt-1" style={{ color: 'var(--foreground-secondary)' }}>
              Directors, writers, crew, designers — anyone with a credit list.
            </p>
          </div>

          <ul className="space-y-2.5 grow">
            {[
              'Permanent profile + filmography in the directory',
              'Submit your projects to PRS scoring',
              'FRA represents you in applications',
              'Mediated enquiries — we filter, you focus on the work',
              '10% commission on placement only — nothing if you don\'t get placed',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'var(--foreground-secondary)' }}>
                <ChevronRight size={14} className="text-[color:var(--color-primary-text)] mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* Annual CTA — primary */}
          <a
            href={PAYFAST_LINKS.individualAnnual}
            className="flex items-center justify-between gap-3 px-5 py-4 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl transition-colors min-h-[56px]"
          >
            <span>Annual — R990/yr</span>
            <span className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/20">2 months free</span>
              <ChevronRight size={16} />
            </span>
          </a>

          {/* Monthly CTA — secondary */}
          <a
            href={PAYFAST_LINKS.individualMonthly}
            className="flex items-center justify-between gap-3 px-5 py-3.5 font-semibold text-sm rounded-xl transition-colors min-h-[48px] border border-line-mid hover:bg-foreground/[0.04]"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            <span>Monthly — R99/mo</span>
            <ChevronRight size={15} style={{ color: 'var(--foreground-tertiary)' }} />
          </a>
        </div>

        {/* ── Business ── */}
        <div
          className="rounded-xl border border-amber-500/30 p-7 flex flex-col gap-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(245,158,11,0.08) 0%, var(--surface) 50%)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border bg-amber-500/10 border-amber-500/20 text-amber-700">
              Business
            </span>
          </div>

          <div>
            <h2 className="font-heading font-bold text-[26px] text-foreground leading-tight">The house.</h2>
            <p className="text-[14px] mt-1" style={{ color: 'var(--foreground-secondary)' }}>
              Production companies, post houses, studios, fixers — registered businesses with a logo and a team.
            </p>
          </div>

          <ul className="space-y-2.5 grow">
            {[
              'Company profile with services and productions showcase',
              'Submit projects to PRS scoring',
              'Direct contact — own every relationship, no intermediary',
              'Apply to opportunities directly',
              'No commission, ever',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'var(--foreground-secondary)' }}>
                <ChevronRight size={14} className="text-amber-700 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* Annual CTA — primary */}
          <a
            href={PAYFAST_LINKS.businessAnnual}
            className="flex items-center justify-between gap-3 px-5 py-4 font-bold text-sm rounded-xl transition-colors min-h-[56px] border border-amber-500/40 hover:bg-amber-500/10"
            style={{ color: '#f59e0b' }}
          >
            <span>Annual — R2,250/yr</span>
            <span className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20">2 months free</span>
              <ChevronRight size={16} />
            </span>
          </a>

          {/* Monthly CTA — secondary */}
          <a
            href={PAYFAST_LINKS.businessMonthly}
            className="flex items-center justify-between gap-3 px-5 py-3.5 font-semibold text-sm rounded-xl transition-colors min-h-[48px] border border-line hover:bg-foreground/[0.04]"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            <span>Monthly — R225/mo</span>
            <ChevronRight size={15} style={{ color: 'var(--foreground-tertiary)' }} />
          </a>
        </div>

      </div>
    </section>
  );
}

/* ── FAQ accordion ───────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Individual or Business — which one am I?',
    a: 'If you have a personal credit list — director, writer, DoP, editor, sound, designer — you\'re an Individual. If you have a logo, invoice under a company name, or a team behind you (production house, post house, studio, fixer, services co.) — you\'re Business. When in doubt, your invoices answer it.',
  },
  {
    q: 'Can I have both?',
    a: 'Yes. Many founders run a personal Individual profile and their company\'s Business profile. They\'re linked but distinct — your filmography lives on the Individual; your services and productions live on the Business.',
  },
  {
    q: 'Why is enquiry mediated for Individuals but direct for Business?',
    a: 'Individuals get noise — agents, students, cold-pitches. We filter and forward only the real ones, within 48 hours. Business members own their inbox: producers, funders, and clients reach you directly. Two different relationships, two different channels.',
  },
  {
    q: 'What is the PRS?',
    a: 'The Project Readiness Score is FRA\'s two-gate scoring system for projects. Every project you list is scored 0–25: Gate 1 · Narrative (story, theme, market — 0–13) and Gate 2 · Compliance (rights, budget, team, locations — 0–12). The total puts you in a band — Production Ready, Funding Ready, Development, or Early Concept — and that\'s what financiers see first.',
  },
  {
    q: 'Who sees my PRS score?',
    a: 'The score band and number are visible to all logged-in members. The full diagnostic breakdown, pitch deck, and chain-of-title are visible only to you and to verified financiers you\'ve granted access. Guests see nothing until they join.',
  },
  {
    q: 'Can my score change?',
    a: 'Yes — re-submit at any time. If you lock chain-of-title, attach a DoP, or close a budget gap, your Compliance score moves and you may jump bands. Financiers are notified when a project they\'re tracking moves up.',
  },
  {
    q: 'What does it cost?',
    a: 'R99/month for Individual, R225/month for Business. Founding members lock the founding rate for life — that price never goes up for them, even when the public price does.',
  },
];

function FAQ() {
  return (
    <section className="mt-14 md:mt-20">
      <div className="section-rule section-rule-muted" />
      <span className="section-rubric">Frequently asked</span>

      <div className="mt-4 space-y-2">
        {FAQS.map((item, i) => (
          <details
            key={i}
            className="group rounded-xl border border-line overflow-hidden"
            style={{ background: 'var(--surface)' }}
          >
            <summary
              className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none hover:bg-foreground/[0.04] transition-colors"
            >
              <span className="text-[14px] font-semibold font-heading text-foreground leading-snug">
                {item.q}
              </span>
              <span
                className="text-[22px] font-bold shrink-0 transition-transform duration-200 group-open:rotate-45"
                style={{ color: '#f59e0b', lineHeight: 1, fontFamily: 'var(--font-fraunces)' }}
              >
                +
              </span>
            </summary>
            <div
              className="px-5 pb-5 text-[14px] leading-relaxed"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── PRS explainer (A1 — two-gate cards) ─────────────────────────── */
function PRSExplainer() {
  return (
    <section className="mt-14 md:mt-20">
      <div className="section-rule section-rule-primary" />
      <span className="section-rubric">The Project Readiness Score</span>

      <h2 className="text-[22px] md:text-[28px] font-bold font-heading leading-tight text-foreground mt-1 mb-2">
        List your project. Get your score. Get matched.
      </h2>
      <p className="text-[14px] mb-8" style={{ color: 'var(--foreground-secondary)' }}>
        Every project runs through two gates. Both must pass before financiers take it seriously.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gate 1 */}
        <div
          className="rounded-xl border border-line p-6 space-y-4"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center justify-between">
            <span className="section-rubric mb-0">Gate 1 · Narrative</span>
            <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--foreground-tertiary)' }}>0–13 pts</span>
          </div>
          <h3 className="font-heading font-bold text-[18px] text-foreground">Is it a story worth funding?</h3>
          <ul className="space-y-2">
            {['Logline & premise', 'Theme & character arc', 'Market / target audience', 'Distinctiveness & cultural resonance'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--foreground-secondary)' }}>
                <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Gate 2 */}
        <div
          className="rounded-xl border border-line p-6 space-y-4"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center justify-between">
            <span className="section-rubric mb-0">Gate 2 · Compliance</span>
            <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--foreground-tertiary)' }}>0–12 pts</span>
          </div>
          <h3 className="font-heading font-bold text-[18px] text-foreground">Is it ready to shoot?</h3>
          <ul className="space-y-2">
            {['Chain of title & rights', 'Budget structure & schedule', 'Key team attached', 'Locations, permits & compliance'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--foreground-secondary)' }}>
                <span className="w-1 h-1 rounded-full text-amber-700 bg-amber-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Score band legend */}
      <div className="flex flex-wrap gap-2 mt-5">
        {[
          { label: 'Production Ready', range: '20–25', tone: 'bg-green-500/10 border-green-500/20 text-green-700' },
          { label: 'Funding Ready', range: '15–19', tone: 'bg-blue-500/10 border-blue-500/20 text-blue-700' },
          { label: 'Development Stage', range: '10–14', tone: 'bg-amber-500/10 border-amber-500/20 text-amber-700' },
          { label: 'Early Concept', range: '0–9', tone: 'bg-foreground/[0.04] border-line text-foreground/40' },
        ].map(({ label, range, tone }) => (
          <span
            key={label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${tone}`}
          >
            {label}
            <span className="font-mono opacity-70">{range}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── Directory tease (A1 — blurred grid + lock) ───────────────────── */
const TEASE_MEMBERS = [
  { initials: 'NC', role: 'Director · Writer', location: 'Lagos, NG', color: 'bg-amber-500/20 text-amber-300' },
  { initials: 'JO', role: 'DoP', location: 'Cape Town, ZA', color: 'bg-rose-500/20 text-rose-300' },
  { initials: 'AM', role: 'Producer', location: 'Accra, GH', color: 'bg-green-500/20 text-green-300' },
  { initials: 'BW', role: 'Production House', location: 'Nairobi, KE', color: 'bg-blue-500/20 text-blue-300' },
  { initials: 'RD', role: 'Editor', location: 'Harare, ZW', color: 'bg-purple-500/20 text-purple-300' },
  { initials: 'SF', role: 'Post House', location: 'Cape Town, ZA', color: 'bg-sky-500/20 text-sky-300' },
];

function DirectoryTease() {
  return (
    <section className="mt-14 md:mt-20 mb-4">
      <div className="section-rule section-rule-muted" />
      <span className="section-rubric">Who's already here</span>

      <div className="relative mt-4">
        {/* Blurred grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 select-none pointer-events-none" style={{ filter: 'blur(3px)', opacity: 0.5 }}>
          {TEASE_MEMBERS.map((m, i) => (
            <div
              key={i}
              className="rounded-xl border border-line p-4 flex items-center gap-3"
              style={{ background: 'var(--surface)' }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold font-heading shrink-0 ${m.color}`}>
                {m.initials}
              </div>
              <div className="min-w-0">
                <div className="h-3 rounded w-24 mb-2" style={{ background: 'var(--border-strong)' }} />
                <p className="text-[11px] truncate" style={{ color: 'var(--foreground-tertiary)' }}>{m.role}</p>
                <p className="text-[10px]" style={{ color: 'var(--foreground-tertiary)' }}>{m.location}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400 ml-auto shrink-0" />
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl"
          style={{ background: 'rgba(9,9,11,0.72)', backdropFilter: 'blur(2px)' }}
        >
          <Lock size={28} className="text-primary/60" />
          <p className="text-[17px] font-bold font-heading text-foreground">Members only</p>
          <p className="text-[13px] text-center max-w-xs" style={{ color: 'var(--foreground-secondary)' }}>
            Join to see and be found by producers, funders, and collaborators across Africa.
          </p>
          <Link
            href="/members#pricing"
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl transition-colors"
          >
            Choose your tier
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default async function MembersPage() {
  const [foundingCount, sessionUser] = await Promise.all([
    getFoundingMemberCount(),
    getSessionUser(),
  ]);

  if (sessionUser?.email) redirect('/members/directory');

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 pt-8 pb-20 md:pt-12">

        {/* Masthead */}
        <header className="pb-10 md:pb-12">
          <div className="border-t border-line-mid pt-4 flex items-center justify-between mb-3">
            <span className="section-rubric mb-0">Members</span>
            <span className="section-rubric mb-0 hidden md:block">est. 2024</span>
          </div>
          <div className="h-[2px] bg-accent mb-8 md:mb-10" />

          <div className="md:grid md:grid-cols-[1fr_340px] md:gap-16 md:items-end">
            <h1 className="text-[48px] leading-[1.02] md:text-[80px] font-extrabold font-heading tracking-tight text-foreground mb-6 md:mb-0">
              The participant<br />
              <span className="relative inline-block">
                seat.
                <span
                  className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full"
                  style={{ background: '#f59e0b' }}
                />
              </span>
            </h1>
            <div className="md:pb-2 space-y-4">
              <p className="text-[15px] md:text-base leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                Subscribers read about opportunities.
              </p>
              <p className="text-[18px] md:text-[20px] font-semibold font-heading text-foreground leading-snug">
                Members act on them.
              </p>
            </div>
          </div>

          <div className="h-px mt-10 md:mt-12" style={{ background: 'var(--border)' }} />
        </header>

        <FoundingCounter count={foundingCount} />
        <TierComparison />
        <FAQ />
        <PRSExplainer />
        <DirectoryTease />

      </div>
    </main>
  );
}
