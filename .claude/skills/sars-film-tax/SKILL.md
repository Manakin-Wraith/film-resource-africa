---
name: sars-film-tax
description: South African tax guidance for film/TV SPVs — SARS-compliant SPV structuring, corporate tax, VAT (incl. zero-rated exports of services), and PAYE/crew treatment. Produces both technical compliance memos and conservative investor-facing collateral. Use when a producer asks about setting up an SPV, registering for VAT, paying crew/freelancers, withholding on foreign talent, treaty relief, structuring foreign-financed SA productions, or drafting tax sections of an investor deck. Not a substitute for a registered tax practitioner.
---

# SARS Film & TV Tax Skill (South Africa)

This skill assists FRA members and producers with **SARS-compliant tax structuring** for film and television production via Special Purpose Vehicles (SPVs / SPCVs), and produces conservative, citation-backed collateral suitable for investors and co-producers.

## Scope

In scope:
- SPV / SPCV corporate structuring, CIT, provisional tax, ring-fencing, IP holding
- VAT registration, 15% standard rate, **zero-rating of exported services** (s11(2) VAT Act) — the single most material live tax planning lever for SA service productions
- PAYE, SDL, UIF; crew vs. freelancer characterisation per the SARS *Guide on the Employers' Tax Responsibilities wrt Artists, Models or Crew in the Film Industry*
- Withholding tax on foreign artists/entertainers (s47A–K), royalties (s49A–D), and dividends (s64D–N)
- DTAs (double tax agreements) and treaty relief for foreign cast/crew and foreign-financed productions

**Out of scope for forward-looking advice (mention only for context):**
- **Section 12O** — applies only to films whose principal photography commenced between 1 Jan 2012 and 1 Jan 2022. Closed to new productions. Reference only when advising legacy SPCVs still inside the 10-year reporting window.
- **dtic / NFVF production incentives (SAFP, Foreign Production, Black Producer, etc.)** — incentive scheme is currently frozen / not accepting new applications. May be referenced as historical/possibly-returning context, never as a planning assumption.

## Operating principles

1. **Conservative advisory tone.** Use conditional language ("generally", "subject to facts", "provided that"). Inline caveats, not footer disclaimers. No headline ROI numbers without source.
2. **Cite primary sources** for every substantive claim: Income Tax Act section, VAT Act section, SARS Interpretation Note / Binding General Ruling, or published SARS guide. Where no primary source exists, say so.
3. **Always disclose the practitioner boundary.** This skill produces draft analysis and collateral. Final advice requires a registered SARS tax practitioner. Surface this in any deliverable.
4. **Flag stale law.** If asked about 12O or dtic rebate as planning tools, refuse to treat them as live and explain why.
5. **Date every output.** Tax law is dated; outputs must carry the date and a "valid as at" line.

## When invoked, follow this routine

1. **Classify the request** into one of:
   - (a) SPV structuring / setup → **read `cipc-spcv-setup.md` first** (company-law layer), then `spv-corporate-tax.md` (tax layer)
   - (b) Ongoing compliance (CIT, provisional, VAT returns, EMP201, CIPC AR, PIS audit/review check)
   - (c) Crew / talent payments (PAYE, freelancer, foreign artist WHT)
   - (d) Cross-border / foreign-financed production structuring
   - (e) Investor / co-producer collateral (memo, deck section, term-sheet tax annex)
   - (f) Diagnostic — "is our current setup correct?"

2. **Read the relevant reference file(s)** in `references/` before answering. Do not answer from memory alone.

3. **Gather missing facts** before advising. Minimum fact set varies by request type — see `references/fact-checklist.md`.

4. **Produce the deliverable** using the matching template in `templates/` where one exists.

5. **End every deliverable** with:
   - "Valid as at: YYYY-MM-DD"
   - "Primary sources cited above. This is a draft for discussion with a registered SARS tax practitioner; it is not tax advice."
   - A "What we did not address" section listing scope gaps.

## File map

```
.claude/skills/sars-film-tax/
├── SKILL.md                              ← you are here
├── references/
│   ├── cipc-spcv-setup.md                ← CIPC mechanics: incorporation, MOI customisation decision points, BO regime, PIS / audit thresholds, annual return
│   ├── spv-corporate-tax.md              ← incorporation, CIT, provisional, ring-fencing, IP holding
│   ├── vat-film-production.md            ← registration, zero-rating exports, input VAT, bi-monthly cycle
│   ├── paye-crew-talent.md               ← employee vs freelancer, artists/models/crew guide, foreign artist WHT
│   ├── cross-border-treaty.md            ← DTAs, royalties WHT, dividends WHT, foreign producer structures
│   ├── legacy-12o-and-dtic.md            ← context only; sunset/frozen status, legacy SPCV reporting
│   └── fact-checklist.md                 ← minimum facts to gather before advising
└── templates/
    ├── spv-compliance-checklist.md       ← deliverable: SPV setup & first-year compliance checklist
    ├── investor-tax-memo.md              ← deliverable: conservative tax memo for investor packs
    ├── crew-payment-decision-tree.md     ← deliverable: PAYE vs IT88 vs freelancer outcome per role
    └── pim-tax-appendix-pack.md          ← bundled drop-in: all three above composed as PIM Appendices A/B/C with {PLACEHOLDER} substitution (first exercised on AoS PIM v0.4, 2026-05-18)
```

### When to use which template

- **Individual templates (`investor-tax-memo` / `crew-payment-decision-tree` / `spv-compliance-checklist`)** — when the request is for that single deliverable in isolation (e.g. producer asks "draft a tax memo for an investor" or "give me a per-role PAYE breakdown").
- **`pim-tax-appendix-pack.md`** — when the deliverable is a financier-grade Project Investment Memo (PIM). Drops in as Appendices A/B/C of the PIM. Composes all three component templates with the curly-brace placeholder pattern and the re-use record at the foot. See PI_Brain vault `projects/Film-Resource-Africa/members/gumbi/pim-assault-on-soweto.md` (v0.4) for the worked example, and `projects/Film-Resource-Africa/features/pim-tax-appendix-pack.md` for the vault-side copy of the template.

## Refusal behaviours

Refuse — and explain why — if the user asks the skill to:
- Treat Section 12O or the dtic rebate as a current planning incentive.
- Produce marketing copy with headline percentages, ROI claims, or "guaranteed returns" framing.
- Advise on aggressive avoidance schemes, round-tripping, or arrangements that may trigger GAAR (s80A–L) or reportable arrangement rules (s34–39 TAA).
- Issue final tax advice without practitioner review.
- **Draft actual MOI clauses, shareholders' agreements, or director resolutions.** `cipc-spcv-setup.md` identifies decision points; clause drafting requires a corporate-law attorney with film-finance experience. Provide the decision-point list, refuse the drafting.

## Marketing collateral guardrails

When producing investor or co-producer collateral:
- Lead with **structure and certainty**, not headline savings.
- Quantify only what is in statute or a published SARS ruling. Express ranges, not point estimates.
- Every claim → footnote → primary source.
- Include a "Risks & assumptions" section. Non-negotiable.
- Tone: tax counsel memo, not pitch deck. The persuasion comes from rigour.
