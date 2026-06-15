import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions — Film Resource Africa',
  description:
    'Terms and Conditions governing use of the Film Resource Africa platform, membership tiers, commission structure, and payment terms.',
  alternates: { canonical: 'https://film-resource-africa.com/terms' },
};

export const dynamic = 'force-static';

const LAST_UPDATED = '7 May 2026';
const EFFECTIVE_DATE = '7 May 2026';

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 pt-10 pb-20 max-w-3xl">
        {/* Header */}
        <div className="border-t border-line-mid pt-4 mb-3">
          <span className="section-rubric mb-0">Legal</span>
        </div>
        <div className="h-[2px] bg-accent mb-8" />

        <h1 className="text-4xl md:text-5xl font-extrabold font-heading tracking-tight text-foreground mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--foreground-tertiary)' }}>
          Last updated: {LAST_UPDATED} &nbsp;·&nbsp; Effective: {EFFECTIVE_DATE}
        </p>

        <div className="prose prose-invert prose-sm max-w-[70ch] space-y-10" style={{ color: 'var(--foreground-secondary)' }}>

          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. About Film Resource Africa</h2>
            <p>
              Celebration House Entertainment CC (Registration No. 2010/149237/23), trading as{' '}
              <strong className="text-foreground">Film Resource Africa</strong> ("FRA", "we", "us",
              or "our"), operates the website at{' '}
              <strong className="text-foreground">film-resource-africa.com</strong> and all associated
              subdomains (the "Platform"). FRA is a translation layer between African creative supply
              and global business demand — a two-sided marketplace connecting African film talent,
              crew, and service providers with project opportunities and international financiers.
            </p>
            <p className="mt-3">
              FRA is registered in the Republic of South Africa as a Close Corporation. These Terms
              and Conditions ("Terms") are governed by South African law, including the{' '}
              <em>Electronic Communications and Transactions Act 25 of 2002</em> (ECTA) and the{' '}
              <em>Consumer Protection Act 68 of 2008</em> (CPA).
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Acceptance of Terms</h2>
            <p>
              By accessing the Platform, registering for a membership, or completing a payment, you
              ("Member", "User", or "you") agree to be bound by these Terms and our{' '}
              <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
              If you do not agree, do not use the Platform.
            </p>
            <p className="mt-3">
              If you are accepting these Terms on behalf of a legal entity, you warrant that you have
              authority to bind that entity, and references to "you" include that entity.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Membership Tiers</h2>

            <h3 className="font-semibold text-foreground mt-5 mb-2">3.1 Individual Membership</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Monthly subscription: R99 per month (ZAR, VAT inclusive).</li>
              <li>Annual subscription: R990 per year (ZAR, VAT inclusive).</li>
              <li>Available to individual natural persons. Sole traders qualify.</li>
              <li>
                FRA actively represents Individual Members in relevant applications, submissions,
                and introductions on their behalf.
              </li>
              <li>
                A <strong className="text-foreground">10% commission</strong> is payable to FRA on
                the gross value of any successful placement that FRA facilitates for an Individual
                Member (see clause 6).
              </li>
            </ul>

            <h3 className="font-semibold text-foreground mt-5 mb-2">3.2 Business Membership</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Monthly subscription: R225 per month (ZAR, VAT inclusive).</li>
              <li>
                Available to registered legal entities only (companies, close corporations, trusts,
                NPOs). Sole traders are not eligible for Business Membership.
              </li>
              <li>
                Business Members access the Platform directly, manage their own relationships, and
                own every client and counterparty relationship they initiate through the Platform.
              </li>
              <li>No placement commission applies to Business Members.</li>
            </ul>

            <h3 className="font-semibold text-foreground mt-5 mb-2">3.3 Founding Members</h3>
            <p>
              The first 100 members to subscribe under either tier ("Founding Members") receive a
              lifetime price lock at the subscription rate applicable at the time of their initial
              payment. This lock applies to the tier originally subscribed; switching tiers resets
              the rate to the current published price.
            </p>

            <h3 className="font-semibold text-foreground mt-5 mb-2">3.4 Membership Benefits</h3>
            <p>
              All members receive access to the members-only directory, project listings, PRS
              (Project Readiness Score) pathway guidance, and curated matching to opportunities and
              counterparties at FRA's discretion. Specific features may be added or modified over
              time; FRA will provide reasonable notice of material changes.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Registration and Account</h2>
            <p>
              To become a member you must provide accurate, complete, and current information during
              registration. You are responsible for maintaining the confidentiality of any login
              credentials and for all activity that occurs under your account.
            </p>
            <p className="mt-3">
              You must promptly notify FRA at{' '}
              <a href="mailto:hello@film-resource-africa.com" className="text-accent hover:underline">
                hello@film-resource-africa.com
              </a>{' '}
              of any unauthorised use of your account or any security breach.
            </p>
            <p className="mt-3">
              FRA reserves the right to suspend or terminate any account that contains false
              information, violates these Terms, or compromises the integrity of the Platform.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Payment and Billing</h2>
            <p>
              All payments are processed through <strong className="text-foreground">PayFast</strong>,
              a PCI-DSS-compliant payment gateway regulated in South Africa. By subscribing, you
              authorise recurring billing at the applicable tier rate on your chosen billing cycle.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-3">
              <li>
                All prices are quoted in South African Rand (ZAR) and are VAT inclusive where
                applicable.
              </li>
              <li>
                Subscriptions renew automatically unless cancelled at least 48 hours before the
                renewal date.
              </li>
              <li>
                FRA reserves the right to adjust pricing on 30 days' written notice, except for
                Founding Members whose rates are locked per clause 3.3.
              </li>
              <li>
                Failed payments may result in suspension of access pending resolution.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Placement Commission (Individual Members)</h2>
            <p>
              A <strong className="text-foreground">placement</strong> occurs when FRA facilitates
              a commercial engagement (including, without limitation, a contract, collaboration,
              funding award, or paid opportunity) for an Individual Member through the Platform or
              FRA's direct representation activities.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-3">
              <li>
                Commission of 10% of the gross placement value is payable to FRA within 14 days of
                the Individual Member receiving payment from the counterparty.
              </li>
              <li>
                FRA will issue a tax invoice for commission amounts. The Member is responsible for
                any taxes applicable to the placement income.
              </li>
              <li>
                Commission obligations survive termination of membership for any placement that was
                introduced or facilitated by FRA prior to termination.
              </li>
              <li>
                FRA will maintain a placement log accessible to the Member via their profile, showing
                placements attributed to FRA's facilitation.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Cancellation and Refunds</h2>
            <p>
              You may cancel your subscription at any time from your account dashboard or by
              contacting{' '}
              <a href="mailto:hello@film-resource-africa.com" className="text-accent hover:underline">
                hello@film-resource-africa.com
              </a>.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-3">
              <li>
                Cancellation takes effect at the end of the current billing period; access continues
                until that date.
              </li>
              <li>
                Monthly subscriptions: no refund for the current period upon cancellation.
              </li>
              <li>
                Annual subscriptions: a pro-rata refund of the unused whole months may be requested
                within 30 days of the renewal date. No refund is available after 30 days.
              </li>
              <li>
                Nothing in this clause limits your statutory rights under the CPA, including the
                right to cancel within five business days of concluding a distance agreement.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Project Readiness Score (PRS)</h2>
            <p>
              The PRS is a proprietary scoring framework (0–25) developed by FRA to assess narrative
              and compliance readiness of film projects submitted to the Platform. PRS scores are
              indicative only and do not constitute a guarantee of funding, distribution, or any
              other commercial outcome.
            </p>
            <p className="mt-3">
              FRA reserves the right to update the PRS methodology at any time. Members are
              responsible for keeping their project information current; FRA is not liable for scores
              based on outdated or incomplete submissions.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Intellectual Property</h2>
            <p>
              All content on the Platform created by FRA — including but not limited to text, design,
              code, scoring systems, and editorial content — is the intellectual property of FRA and
              protected under South African copyright law.
            </p>
            <p className="mt-3">
              By submitting content to the Platform (including profile information, project details,
              and materials), you grant FRA a non-exclusive, royalty-free, worldwide licence to use,
              display, and distribute that content for the purposes of operating the Platform and
              promoting your profile or project to relevant counterparties. You retain ownership of
              your content and may revoke this licence by removing the content or terminating your
              membership.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Member Conduct</h2>
            <p>Members must not:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Submit false, misleading, or fraudulent information to the Platform.</li>
              <li>Use the Platform to harass, defame, or harm any other person or entity.</li>
              <li>Circumvent any payment or commission obligation arising from a Platform-facilitated placement.</li>
              <li>Scrape, reproduce, or commercially exploit Platform content without written consent from FRA.</li>
              <li>Use the members-only directory for unsolicited commercial communications.</li>
              <li>Attempt to gain unauthorised access to other Members' accounts or Platform infrastructure.</li>
            </ul>
            <p className="mt-3">
              Breach of this clause may result in immediate suspension or termination of membership
              without refund, and FRA reserves the right to pursue legal remedies.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">11. Disclaimer and Limitation of Liability</h2>
            <p>
              The Platform and all services are provided "as is" and "as available." FRA does not
              warrant that the Platform will be error-free, uninterrupted, or free of harmful
              components.
            </p>
            <p className="mt-3">
              FRA is not a party to any contract concluded between Members or between Members and
              counterparties (e.g., financiers, producers, or distributors). FRA's role is that of
              facilitator only. FRA accepts no liability for any loss arising from:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>A counterparty's failure to perform.</li>
              <li>Inaccuracies in PRS scores or opportunity listings.</li>
              <li>Reliance on information displayed in the members-only directory.</li>
              <li>Interruption of access to the Platform.</li>
            </ul>
            <p className="mt-3">
              To the fullest extent permitted by law, FRA's total aggregate liability to any Member
              shall not exceed the total subscription fees paid by that Member in the 12 months
              immediately preceding the event giving rise to the claim.
            </p>
            <p className="mt-3">
              Nothing in these Terms limits liability for fraud, gross negligence, or any liability
              that cannot be excluded under the CPA.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">12. Third-Party Services</h2>
            <p>
              The Platform integrates third-party services including PayFast (payments), Supabase
              (database hosting), Resend (email delivery), and Vercel (infrastructure). Use of these
              services is subject to their respective terms. FRA is not responsible for the acts or
              omissions of third-party providers.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">13. Amendments</h2>
            <p>
              FRA may amend these Terms at any time by publishing updated Terms on the Platform and
              notifying Members by email at least 14 days before changes take effect. Continued use
              of the Platform after the effective date constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">14. Governing Law and Disputes</h2>
            <p>
              These Terms are governed by the laws of the Republic of South Africa. Any dispute
              arising from these Terms shall first be referred to mediation. If mediation fails, the
              dispute shall be resolved by binding arbitration in accordance with the rules of the
              Arbitration Foundation of Southern Africa (AFSA), in Johannesburg, unless both parties
              agree otherwise in writing.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">15. Contact</h2>
            <p>
              For any questions regarding these Terms, please contact:
            </p>
            <address className="not-italic mt-3 space-y-1 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
              <p><strong className="text-foreground">Celebration House Entertainment CC</strong></p>
              <p>Trading as: Film Resource Africa</p>
              <p>Registration No.: 2010/149237/23</p>
              <p>62 Roeland Street, 3rd Floor, Gardens, Cape Town, Western Cape, 8001</p>
              <p>Attention: Gerhard Mostert</p>
              <p>
                Email:{' '}
                <a href="mailto:hello@film-resource-africa.com" className="text-accent hover:underline">
                  hello@film-resource-africa.com
                </a>
              </p>
              <p>Website: <Link href="/" className="text-accent hover:underline">film-resource-africa.com</Link></p>
            </address>
          </section>

          {/* Footer nav */}
          <div className="border-t border-line pt-8 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
            <Link href="/" className="hover:text-foreground" style={{ color: 'var(--foreground-tertiary)' }}>← Back to Home</Link>
          </div>

        </div>
      </div>
    </main>
  );
}
