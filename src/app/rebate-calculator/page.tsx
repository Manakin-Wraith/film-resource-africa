import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterCTA from '@/components/NewsletterCTA';
import { Calculator, FileCheck2, TrendingUp, ShieldCheck, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SA Film Rebate & Net Exposure Calculator — Film Resource Africa',
  description:
    "Estimate your DTIC film rebate, bonus uplifts and net exposure in seconds. Built on the 2025/26 Incentive Schemes Guide. Status-aware — we tell you when a programme is paused before the numbers.",
  openGraph: {
    title: 'SA Film Rebate & Net Exposure Calculator',
    description:
      'Estimate your DTIC film rebate and net exposure against the verified 2025/26 rate card. Status-aware, source-cited, producer-ready.',
    siteName: 'Film Resource Africa',
    type: 'website',
    url: 'https://film-resource-africa.com/rebate-calculator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SA Film Rebate & Net Exposure Calculator',
    description:
      'Estimate your DTIC rebate and net exposure in seconds — verified against the 2025/26 Incentive Schemes Guide.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/rebate-calculator',
  },
};

export const dynamic = 'force-static';

const features = [
  {
    icon: Calculator,
    title: 'Instant rebate estimate',
    description: 'Enter your total budget and qualifying SA expenditure — get your DTIC rebate, applicable caps, and net exposure in seconds.',
  },
  {
    icon: FileCheck2,
    title: 'Verified 2025/26 rate card',
    description: 'Every rate is sourced from the official DTIC Incentive Schemes Guide and versioned. You always know exactly what the number is based on.',
  },
  {
    icon: ShieldCheck,
    title: 'Status-aware',
    description: 'Each incentive programme is tagged with a live status. We flag paused or backlogged schemes before you plan your schedule around them.',
  },
  {
    icon: TrendingUp,
    title: 'Bonus uplift modelling',
    description: 'See how B-BBEE level, SA shoot days, and co-production status affect your bonus rate — and model different scenarios side by side.',
  },
  {
    icon: Layers,
    title: 'Full incentive stack',
    description: 'SA Production, Co-Production, Emerging Black Filmmakers, and Foreign Film programmes — all in one place, with eligibility gates applied automatically.',
  },
];

export default function RebateCalculatorPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-12">

        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Rebate Calculator', href: '/rebate-calculator' },
          ]}
        />

        {/* Editorial header */}
        <header>
          <div className="section-rule section-rule-accent" />
          <span className="section-rubric">Tools</span>
          <h1 className="text-[26px] md:text-[38px] font-bold font-heading leading-tight text-foreground mb-4">
            SA Film Rebate & Net Exposure Calculator
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[12px] font-bold uppercase tracking-wider mb-5">
            <Calculator size={13} />
            Coming Soon
          </div>
          <p className="text-[16px] md:text-[18px] leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
            A free, producer-ready tool for estimating your DTIC film rebate, bonus uplifts, and net exposure — built on the verified 2025/26 Incentive Schemes Guide.
          </p>
        </header>

        {/* What it does */}
        <section>
          <div className="h-px mb-6" style={{ background: 'var(--border)' }} />
          <p className="text-[13px] font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--foreground-tertiary)' }}>
            What the calculator does
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.08]"
                style={{ background: 'var(--surface)' }}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={16} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Context note */}
        <section
          className="rounded-xl p-5 border-l-4 border-amber-400/60 border border-white/[0.08]"
          style={{ background: 'var(--surface)' }}
        >
          <p className="text-[13px] font-semibold text-foreground mb-2">A note on DTIC programme status</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
            The DTIC film incentives are rate-current but payout-delayed. As of early 2026 there is a public backlog of over R473M in approved-but-unpaid claims. The Foreign Film and TV Production Incentive has been under an administrative freeze since late 2023. The calculator will flag these statuses clearly so you can treat the DTIC layer as a contingent line item when planning.
          </p>
        </section>

        {/* Newsletter CTA */}
        <NewsletterCTA
          variant="banner"
          heading="Get notified when it launches"
          subtext="Subscribe to the FRA newsletter and we'll let you know the moment the rebate calculator goes live."
        />

      </div>
    </main>
  );
}
