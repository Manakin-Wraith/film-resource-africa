export const NDA_VERSION = '2026-07-23';

// Adapted from the tri-partite Mutual NDA (Mostert / Weinek / Roberts, 23 June 2026)
// into a bilateral Producer <-> FRA form. Clauses 1-12 kept substantively verbatim; clause 4A added 2026-07-23.
// {{producerName}}, {{company}}, {{date}}, {{fraSignatories}} are interpolated by renderNda.
// WORKING DRAFT — not legal advice; to be reviewed by a qualified attorney before reliance.
export const NDA_BODY = `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into and effective as of {{date}} (the "Effective Date") by and between:

1. Film Resource Africa (registration no. 2010/149237/23), represented by {{fraSignatories}} ("FRA"); and

2. {{producerName}}, for and on behalf of {{company}} ("Producer").

Each of FRA and the Producer is a "Party" and together they are the "Parties". In relation to any particular item of Confidential Information, the Party disclosing it is the "Disclosing Party" and the Party receiving it is the "Receiving Party".

1. Background and Purpose. The Parties wish to explore and evaluate a possible collaboration in relation to the financing, structuring and production of one or more film and television projects, including the assembly of a production slate and the presentation of project information to vetted investors on the AFX marketplace platform (the "Purpose"). For this Purpose the Parties will exchange commercially sensitive information, including production budgets and actuals, financing structures, cashflow schedules, recoupment and waterfall terms, risk analyses, investor and counterparty terms, slate plans and related materials. This Agreement governs the disclosure and protection of that information.

2. Definition of Confidential Information. "Confidential Information" means any information disclosed by or on behalf of a Disclosing Party to a Receiving Party, before or after the Effective Date, in any form (written, oral, electronic, visual or otherwise), that relates to the Purpose or to a Disclosing Party's business, and that is either marked or identified as confidential or that, by its nature or the circumstances of disclosure, ought reasonably to be treated as confidential. Without limitation, it includes:
   (a) production budgets, actuals, cost reports and financial models;
   (b) financing and capital structures, cashflow schedules and funding sources;
   (c) recoupment positions, waterfall terms, return hurdles and exposure limits;
   (d) risk assessments, sales estimates and projections;
   (e) investor, financier, distributor and other counterparty identities and terms;
   (f) scripts, treatments, slate plans, project pipelines and strategy; and
   (g) the existence and contents of the discussions between the Parties.

3. Exclusions. Confidential Information does not include information that the Receiving Party can demonstrate, by written record:
   (a) was already lawfully in its possession, without obligation of confidence, before disclosure;
   (b) is or becomes public knowledge other than through a breach of this Agreement;
   (c) is lawfully received from a third party entitled to disclose it without obligation of confidence; or
   (d) is independently developed by the Receiving Party without use of the Confidential Information.

4. Obligations of the Receiving Party. Each Receiving Party undertakes to:
   (a) use the Confidential Information solely for the Purpose and for no other purpose whatsoever;
   (b) keep the Confidential Information strictly confidential and not disclose it to any third party without the prior written consent of the Disclosing Party;
   (c) disclose the Confidential Information only to its directors, employees, professional advisers or agents who have a genuine need to know it for the Purpose, and who are bound by confidentiality obligations no less strict than these (the Receiving Party remaining responsible for their compliance);
   (d) apply at least the same degree of care to protect the Confidential Information as it applies to its own confidential information, and in no event less than a reasonable degree of care;
   (e) not copy or reproduce the Confidential Information except as reasonably necessary for the Purpose; and
   (f) not use the Confidential Information to circumvent any Party, or to compete with, or solicit the financiers, investors or counterparties of, any Disclosing Party in respect of a project disclosed under this Agreement.

4A. Authorised Disclosure to Vetted Investors. Notwithstanding clause 4(b) above, the Producer authorises FRA to present a de-identified projection of the Producer's project information (the "Investor View") to vetted third-party investors and financiers admitted to the AFX marketplace by invitation (each, an "Authorised Investor"), subject to the following conditions:
   (a) the Producer has enabled the transparency and reporting consent gate in the AFX platform, which constitutes the Producer's written consent to this limited disclosure;
   (b) each Authorised Investor has entered into a separate written confidentiality agreement with FRA covering the Investor View before any access is granted;
   (c) the Investor View is generated by the AFX platform's automated boundary controls and contains no exact budget figures, production cost reports, financing or distribution contracts, soft-funding amounts, or individual counterparty identities — only banded ranges, packaging status indicators, and provenance signals; and
   (d) the Producer may withdraw this authorisation at any time by disabling the transparency consent gate in the AFX platform, which will remove the Producer's projects from the investor marketplace with immediate effect, without prejudice to any disclosures lawfully made prior to withdrawal.

5. Compelled Disclosure. If a Receiving Party is required by law, regulation or court order to disclose any Confidential Information, it may do so, but shall (to the extent legally permitted) promptly notify the Disclosing Party in advance so that the Disclosing Party may seek protective measures, and shall disclose only that portion legally required.

6. No Licence, No Representation. All Confidential Information remains the property of the Disclosing Party. Nothing in this Agreement transfers or grants any intellectual property right, licence or interest. No Party makes any warranty as to the accuracy or completeness of Confidential Information, and no liability arises from reliance on it. Nothing in this Agreement obliges any Party to disclose information or to proceed with any transaction.

7. Return or Destruction. On written request of a Disclosing Party, or on termination of discussions, each Receiving Party shall promptly return or destroy (and on request certify the destruction of) all Confidential Information of that Disclosing Party, save for one copy that may be retained solely for legal or compliance record-keeping, which remains subject to this Agreement.

8. Term. This Agreement commences on the Effective Date and continues for two (2) years, unless terminated earlier by written agreement of the Parties. The confidentiality obligations in respect of any Confidential Information already disclosed survive termination and continue for a further three (3) years, and indefinitely in respect of trade secrets.

9. No Partnership. This Agreement does not create any partnership, joint venture, agency or exclusive relationship between the Parties. Any collaboration will be governed by a separate written agreement.

10. Breach and Remedies. The Parties acknowledge that damages alone may not be an adequate remedy for breach, and that a Disclosing Party shall be entitled to seek interdictory (injunctive) relief in addition to any other remedy available in law.

11. General. This Agreement constitutes the entire agreement between the Parties as to its subject matter and supersedes all prior understandings on confidentiality. No variation is effective unless in writing and signed by the Parties. No relaxation or indulgence by a Party constitutes a waiver. If any provision is found unenforceable, the remaining provisions continue in force. This Agreement may be signed in counterparts (including by electronic signature), each of which is an original and all of which together constitute one agreement.

12. Governing Law and Jurisdiction. This Agreement is governed by the laws of the Republic of South Africa, and the Parties submit to the non-exclusive jurisdiction of the High Court of South Africa.

By signing below, the Producer confirms that they have read, understood and agree to be bound by this Agreement as of {{date}}.

FRA — Film Resource Africa (2010/149237/23)
Represented by {{fraSignatories}}

Producer — {{producerName}} ({{company}})
Signed electronically via the Film Resource Africa platform on {{date}}.`;

/** Interpolate the per-producer fields into the versioned NDA body. */
export function renderNda(p: { producerName: string; company?: string; date: string }): string {
  return NDA_BODY
    .replaceAll('{{producerName}}', p.producerName || '—')
    .replaceAll('{{company}}', (p.company && p.company.trim()) || 'an independent capacity')
    .replaceAll('{{date}}', p.date)
    .replaceAll('{{fraSignatories}}', 'Gerhard Mostert');
}
