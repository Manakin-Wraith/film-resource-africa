import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Film Resource Africa',
  description:
    'Privacy Policy for Film Resource Africa. Explains how we collect, use, and protect your personal information under POPIA.',
  alternates: { canonical: 'https://film-resource-africa.com/privacy' },
};

export const dynamic = 'force-static';

const LAST_UPDATED = '7 May 2026';
const EFFECTIVE_DATE = '7 May 2026';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 pt-10 pb-20 max-w-3xl">
        {/* Header */}
        <div className="border-t border-white/16 pt-4 mb-3">
          <span className="section-rubric mb-0">Legal</span>
        </div>
        <div className="h-[2px] bg-accent mb-8" />

        <h1 className="text-4xl md:text-5xl font-extrabold font-heading tracking-tight text-foreground mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--foreground-tertiary)' }}>
          Last updated: {LAST_UPDATED} &nbsp;·&nbsp; Effective: {EFFECTIVE_DATE}
        </p>

        <div className="prose prose-invert prose-sm max-w-[70ch] space-y-10" style={{ color: 'var(--foreground-secondary)' }}>

          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Introduction</h2>
            <p>
              Celebration House Entertainment CC (Registration No. 2010/149237/23), trading as{' '}
              <strong className="text-foreground">Film Resource Africa</strong> ("FRA", "we", "us",
              or "our"), is committed to protecting your personal information. This Privacy Policy
              explains how we collect, use, store, and disclose your personal information when you
              use the Platform at{' '}
              <strong className="text-foreground">film-resource-africa.com</strong>.
            </p>
            <p className="mt-3">
              This policy is published in compliance with the{' '}
              <em>Protection of Personal Information Act 4 of 2013</em> (POPIA) of the Republic of
              South Africa. By using the Platform, you consent to the processing of your personal
              information as described here.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Information Officer</h2>
            <p>FRA's Information Officer, as required under POPIA, is:</p>
            <address className="not-italic mt-3 space-y-1 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
              <p><strong className="text-foreground">Gerhard Mostert</strong></p>
              <p>Celebration House Entertainment CC, trading as Film Resource Africa</p>
              <p>62 Roeland Street, 3rd Floor, Gardens, Cape Town, Western Cape, 8001</p>
              <p>Information Regulator Registration No.: 2026-013234</p>
              <p>Appointment Date: 13 March 2026</p>
              <p>
                Email:{' '}
                <a href="mailto:hello@film-resource-africa.com" className="text-accent hover:underline">
                  hello@film-resource-africa.com
                </a>
              </p>
            </address>
            <p className="mt-3">
              You may contact our Information Officer for any queries, complaints, or requests
              relating to your personal information.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. What Information We Collect</h2>

            <h3 className="font-semibold text-foreground mt-4 mb-2">3.1 Information you provide directly</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Name, surname, and professional title.</li>
              <li>Email address and phone number.</li>
              <li>Country of residence or registration.</li>
              <li>Company or organisation name (Business Members).</li>
              <li>Company registration number (Business Members).</li>
              <li>Profile information: biography, skills, portfolio links, filmography, showreel URLs.</li>
              <li>Project information: title, synopsis, genre, budget range, PRS submission data.</li>
              <li>Payment information (processed by PayFast; FRA does not store card details).</li>
              <li>Communications you send to FRA (email, contact form, support requests).</li>
            </ul>

            <h3 className="font-semibold text-foreground mt-5 mb-2">3.2 Information collected automatically</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>IP address and approximate geographic location.</li>
              <li>Browser type, device type, and operating system.</li>
              <li>Pages visited, links clicked, and time spent on the Platform (via Vercel Analytics).</li>
              <li>Referral source (how you arrived at the Platform).</li>
            </ul>

            <h3 className="font-semibold text-foreground mt-5 mb-2">3.3 Information from third parties</h3>
            <p>
              We may receive information about you from payment providers (PayFast) confirming
              successful or failed transactions. We do not purchase or acquire personal information
              from data brokers.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. How We Use Your Information</h2>
            <p>We process your personal information for the following lawful purposes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-3">
              <li>
                <strong className="text-foreground">Service delivery:</strong> to create and manage
                your membership account, process payments, and provide access to the Platform.
              </li>
              <li>
                <strong className="text-foreground">Representation and matching:</strong> to represent
                Individual Members in applications, match Members to relevant opportunities and
                counterparties, and facilitate introductions.
              </li>
              <li>
                <strong className="text-foreground">Communication:</strong> to send transactional
                emails (receipts, placement notifications, account updates) and, with your consent,
                newsletters and editorial content.
              </li>
              <li>
                <strong className="text-foreground">PRS scoring:</strong> to calculate and display
                Project Readiness Scores based on your project submissions.
              </li>
              <li>
                <strong className="text-foreground">Directory:</strong> to display your profile in
                the members-only directory visible to other verified Members.
              </li>
              <li>
                <strong className="text-foreground">Commission tracking:</strong> to record and
                invoice placements for Individual Members under clause 6 of the Terms.
              </li>
              <li>
                <strong className="text-foreground">Legal compliance:</strong> to comply with
                applicable laws, including tax, financial record-keeping, and POPIA obligations.
              </li>
              <li>
                <strong className="text-foreground">Platform improvement:</strong> to analyse
                aggregate usage patterns and improve the Platform.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Legal Basis for Processing</h2>
            <p>Under POPIA, we process your personal information on the following grounds:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-3">
              <li><strong className="text-foreground">Contractual necessity:</strong> to fulfil our obligations under your membership agreement.</li>
              <li><strong className="text-foreground">Consent:</strong> for marketing communications (which you may withdraw at any time).</li>
              <li><strong className="text-foreground">Legal obligation:</strong> where required by South African law.</li>
              <li><strong className="text-foreground">Legitimate interest:</strong> for Platform analytics, fraud prevention, and security.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share it with:</p>

            <h3 className="font-semibold text-foreground mt-4 mb-2">6.1 Service operators (operators under POPIA)</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Supabase Inc.</strong> — database hosting (USA; EU Standard Contractual Clauses apply).</li>
              <li><strong className="text-foreground">Resend Inc.</strong> — transactional email delivery.</li>
              <li><strong className="text-foreground">PayFast (Pty) Ltd</strong> — payment processing (South Africa, PCI-DSS compliant).</li>
              <li><strong className="text-foreground">Vercel Inc.</strong> — web hosting and analytics (USA; adequacy safeguards apply).</li>
            </ul>
            <p className="mt-3">
              Each operator is bound by data processing agreements and may only process your
              information on our instructions for the purposes described in this policy.
            </p>

            <h3 className="font-semibold text-foreground mt-4 mb-2">6.2 Other Members and counterparties</h3>
            <p>
              Your profile information (as configured by you) is visible to other verified Members
              in the members-only directory. Project information with PRS scores may be shared with
              financiers and other counterparties as part of the marketplace matching function,
              subject to your visibility settings.
            </p>

            <h3 className="font-semibold text-foreground mt-4 mb-2">6.3 Legal and regulatory disclosures</h3>
            <p>
              We may disclose your information where required by law, a court order, or a competent
              regulatory authority.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Cross-Border Transfers</h2>
            <p>
              Some of our service operators are based outside South Africa. Where personal
              information is transferred across borders, FRA ensures that the recipient country or
              operator provides an adequate level of protection as required by POPIA section 72,
              through standard contractual clauses or other approved mechanisms.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Data Retention</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong className="text-foreground">Active members:</strong> we retain your personal
                information for as long as your membership is active and for seven years thereafter
                for financial record-keeping purposes (as required by SARS).
              </li>
              <li>
                <strong className="text-foreground">Newsletter subscribers:</strong> retained until
                you unsubscribe.
              </li>
              <li>
                <strong className="text-foreground">Usage logs:</strong> anonymised after 90 days.
              </li>
              <li>
                <strong className="text-foreground">Placement records:</strong> retained for seven
                years from the date of placement for commission and tax purposes.
              </li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Your Rights Under POPIA</h2>
            <p>As a data subject under POPIA, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-3">
              <li>
                <strong className="text-foreground">Access:</strong> request a copy of the personal
                information we hold about you.
              </li>
              <li>
                <strong className="text-foreground">Correction:</strong> request correction of
                inaccurate or incomplete information.
              </li>
              <li>
                <strong className="text-foreground">Deletion:</strong> request deletion of your
                personal information, subject to our legal retention obligations.
              </li>
              <li>
                <strong className="text-foreground">Objection:</strong> object to the processing of
                your information on grounds of legitimate interest.
              </li>
              <li>
                <strong className="text-foreground">Withdraw consent:</strong> withdraw marketing
                consent at any time without affecting the lawfulness of prior processing.
              </li>
              <li>
                <strong className="text-foreground">Complain:</strong> lodge a complaint with the
                Information Regulator of South Africa if you believe we have violated POPIA.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact our Information Officer at{' '}
              <a href="mailto:hello@film-resource-africa.com" className="text-accent hover:underline">
                hello@film-resource-africa.com
              </a>.
              We will respond within 30 days as required by POPIA.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Information Regulator</h2>
            <p>
              You have the right to lodge a complaint with the Information Regulator of South Africa:
            </p>
            <address className="not-italic mt-3 space-y-1 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
              <p><strong className="text-foreground">The Information Regulator (South Africa)</strong></p>
              <p>JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
              <p>
                Email:{' '}
                <a href="mailto:inforeg@justice.gov.za" className="text-accent hover:underline">
                  inforeg@justice.gov.za
                </a>
              </p>
            </address>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">11. Security</h2>
            <p>
              FRA implements appropriate technical and organisational measures to protect your
              personal information against unauthorised access, loss, or disclosure, including
              encrypted data transmission (TLS), access controls, and regular security reviews.
            </p>
            <p className="mt-3">
              In the event of a security compromise that is likely to result in a risk to your
              rights and freedoms, we will notify you and the Information Regulator as required
              by POPIA.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">12. Cookies and Analytics</h2>
            <p>
              We use Vercel Analytics, a privacy-friendly analytics tool, which does not use cookies
              and does not track users across websites. Aggregate usage data is used solely to
              improve the Platform. No third-party advertising cookies are placed on the Platform.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">13. Children</h2>
            <p>
              The Platform is not directed at persons under the age of 18. We do not knowingly
              collect personal information from minors. If you believe a minor has provided us with
              personal information, please contact us immediately.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">14. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you by email and
              publish the updated policy on the Platform. The "Last updated" date at the top of this
              page reflects the most recent revision. Continued use of the Platform after the
              effective date of changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">15. Contact</h2>
            <address className="not-italic space-y-1 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
              <p><strong className="text-foreground">Gerhard Mostert — Information Officer</strong></p>
              <p>Celebration House Entertainment CC (Reg. No. 2010/149237/23)</p>
              <p>Trading as: Film Resource Africa</p>
              <p>62 Roeland Street, 3rd Floor, Gardens, Cape Town, Western Cape, 8001</p>
              <p>Information Regulator Reg. No.: 2026-013234</p>
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
          <div className="border-t border-white/[0.08] pt-8 flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-accent hover:underline">Terms &amp; Conditions</Link>
            <Link href="/" className="hover:text-foreground" style={{ color: 'var(--foreground-tertiary)' }}>← Back to Home</Link>
          </div>

        </div>
      </div>
    </main>
  );
}
