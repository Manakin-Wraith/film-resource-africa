import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getCurrentMember } from '@/app/actions';
import SubmitOpportunityForm from '@/components/SubmitOpportunityForm';
import JoinToContributeCTA from '@/components/JoinToContributeCTA';

export const dynamic = 'force-dynamic';

export default async function SubmitPage() {
  const member = await getCurrentMember();

  return (
    <main className="min-h-screen relative z-10 p-4 md:p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex flex-col items-center text-center">
          <Link href="/directory" className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium mb-6 transition-colors self-start md:self-auto">
            <ArrowLeft size={18} /> Back to Directory
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-balance">
            Promote your opportunity
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl text-balance">
            Put your fund, festival, brief, or call in front of filmmakers across the continent.
          </p>
        </div>

        {!member && (
          <JoinToContributeCTA />
        )}

        {member && member.tier !== 'business' && (
          <div className="max-w-xl mx-auto rounded-2xl p-10 md:p-12 text-center border border-line mt-4" style={{ background: 'var(--surface)' }}>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-4 text-balance">
              Promoting opportunities is a Business benefit
            </h2>
            <p className="text-[15px] leading-relaxed mb-8 text-balance" style={{ color: 'var(--foreground-secondary)' }}>
              Your Individual membership lets you list and diagnose your own projects. Upgrade to Business to promote opportunities, briefs, and crew calls to the FRA audience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/members" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-xl font-semibold transition-colors">
                Upgrade to Business <ArrowRight size={18} />
              </Link>
              <Link href="/assess" className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold border border-line-mid hover:bg-foreground/[0.04] transition-colors text-foreground">
                Assess a project
              </Link>
            </div>
          </div>
        )}

        {member && member.tier === 'business' && (
          <SubmitOpportunityForm memberName={member.full_name} />
        )}
      </div>
    </main>
  );
}
