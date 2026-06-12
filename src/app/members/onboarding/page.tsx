import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import OnboardingClient from './OnboardingClient';

export const metadata: Metadata = {
  title: 'Complete Your Profile',
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidToken message="No onboarding token provided." />;
  }

  const { data: member } = await supabase
    .from('members')
    .select('id, full_name, email, tier, onboarding_completed_at, company_name')
    .eq('onboarding_token', token)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return <InvalidToken message="This link is invalid or has expired." />;
  }

  if (member.onboarding_completed_at) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h1 className="font-heading font-bold text-2xl">Profile already complete</h1>
          <p style={{ color: 'var(--foreground-secondary)' }}>
            You've already completed your onboarding. Your profile is live.
          </p>
          <a href="/members" className="inline-block mt-4 px-6 py-3 bg-primary text-white font-bold rounded-xl">
            Back to Members
          </a>
        </div>
      </main>
    );
  }

  return (
    <OnboardingClient
      memberId={member.id}
      token={token}
      fullName={member.full_name}
      email={member.email}
      tier={member.tier as 'individual' | 'business'}
      companyName={member.company_name}
    />
  );
}

function InvalidToken({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl">⚠</div>
        <h1 className="font-heading font-bold text-2xl">Invalid link</h1>
        <p style={{ color: 'var(--foreground-secondary)' }}>{message}</p>
        <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px' }}>
          Check your welcome email for the correct link, or contact{' '}
          <a href="mailto:hello@film-resource-africa.com" style={{ color: '#93c5fd' }}>
            hello@film-resource-africa.com
          </a>
        </p>
      </div>
    </main>
  );
}
