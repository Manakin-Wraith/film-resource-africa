# CIPC — Film SPCV Setup, MOI & Compliance — Reference

CIPC (Companies and Intellectual Property Commission) is the company-law authority — separate from SARS (the tax authority). Most film-SPCV mistakes at the SARS layer trace back to a sloppy CIPC layer: a half-customised MOI that locks the waterfall in shareholders' agreement only; a beneficial-ownership filing missed at incorporation; a Public Interest Score (PIS) that quietly crosses the audit threshold mid-production. This file covers the CIPC mechanics that materially affect downstream tax structuring, financier diligence, and audit posture.

For tax mechanics (CIT, s24F, ring-fencing, IP-holding decisions) see `spv-corporate-tax.md`. For VAT see `vat-film-production.md`. This file stops at CIPC's boundary and points back across.

## Scope

In scope:
- Vehicle choice (Pty Ltd default for film SPCVs; why not CC / NPC / PLC)
- Incorporation mechanics (name reservation, CoR14.1, fees, timeline, online vs Bizportal vs swift-co route)
- Memorandum of Incorporation (MOI) — Standard (CoR15.1A/B) vs Customised (CoR15.1C/D); decision points for film SPCVs
- Director rules — s66, foreign directors, POEM crossover
- Beneficial Ownership regime (post-May 2023, hard-stop since 1 July 2024)
- Public Interest Score (Reg 26) and audit / independent-review consequences
- Annual return (CoR30.1) — fees by turnover band, deregistration cascade
- Director / share / MOI changes during the production lifecycle
- CIPC ↔ SARS boundary (what auto-registers, what needs separate action)

**Out of scope** (refuse if asked, redirect to qualified attorney):
- Drafting actual MOI clauses, shareholders' agreements, or director resolutions. This reference identifies decision points; clause drafting requires a corporate-law attorney with film-finance experience.
- Choosing between SPCV-domicile jurisdictions outside SA (Mauritius, Isle of Man, etc.). Cross-border vehicle choice is a tax + exchange-control + corporate-law triangle requiring multi-jurisdictional advice.
- Litigation, business rescue, or wind-down post-deregistration.

## Vehicle choice — why Pty (Ltd)

For a single-film SPCV, the **Private Company (Pty) Ltd** under the Companies Act 71 of 2008 is the only credible default. Brief reasoning:

- **Close Corporation (CC)** — cannot be newly incorporated since 1 May 2011 (Companies Act commencement). Existing CCs continue but cannot be created for a new production.
- **Non-Profit Company (NPC)** — wrong vehicle for a commercial film with a recoupment waterfall, even if some funders push for the structure. NPCs have asset-lockup rules incompatible with investor recoupment.
- **Public Company (Ltd)** — vastly heavier disclosure, audit, and share-transfer regime than any single-film SPCV needs. Reserved for slate companies pursuing public capital markets.
- **Personal Liability Company (Inc)** — directors are jointly and severally liable for company debts. Misaligned with the ring-fencing purpose of an SPCV.
- **External Company (foreign-incorporated registered as branch)** — relevant only when a foreign producer wants to operate in SA without an SA entity. The SPCV pattern usually defeats this need; see `cross-border-treaty.md` § Permanent establishment.

If a producer arrives with a CC inherited from a previous production, treat with caution: CCs do not have an MOI (they have a Founding Statement), the financier-diligence vocabulary differs, and conversion to a Pty Ltd is possible but adds 4–8 weeks. Default recommendation is to incorporate a fresh Pty Ltd for each film, even where the producer has a multi-film CC.

## Incorporation mechanics

### Step 1 — Name reservation (CoR9.1)

- Form CoR9.1 lodged via CIPC eServices. Up to four name choices listed in order of preference.
- Filing fee: **R50** (May 2026). Approval typically 1–2 business days.
- Reserved name is valid for **6 months**. Extensible once for a further 60 days on request.
- Pre-check via the CIPC name-search tool before lodgement to reduce rejection risk on identical or confusingly similar names.

Naming conventions for SPCVs vary. Financiers tend to prefer **single-purpose naming** that includes the production title or a recognisable abbreviation (e.g. *"AOS Productions (Pty) Ltd"*, *"Assault on Soweto Films (Pty) Ltd"*) so chain-of-title and bank-account records align with the film. Generic names invite confusion across the producer's slate.

### Step 2 — Notice of Incorporation (CoR14.1) and MOI

- Form CoR14.1 lodged with the chosen MOI form (CoR15.1A/B/C/D — see MOI section below).
- Filing fee: **R125** (online) / **R175** (manual) for a private company (May 2026). Some filing agents charge an additional service fee.
- CIPC auto-pushes the income tax registration to SARS on incorporation. **Verify the SARS IT reference is issued** before relying on the auto-registration — see `spv-corporate-tax.md` § Incorporation and registrations.
- Standard processing: 2–5 business days online, longer if name-conflict or director-FICA issues surface.

### Step 3 — Bizportal vs direct CIPC eServices

- **Bizportal** is the government's one-stop incorporation channel (CIPC + SARS + UIF + Compensation Fund + bank account in one application). Useful for first-time founders incorporating a simple Pty Ltd with a Standard MOI.
- **CIPC eServices direct** is required if a Customised MOI is used (Bizportal only supports the standard CoR15.1A short-form). Film SPCVs that need waterfall-aligned reserved matters, pre-emptive-rights customisation, or share-transfer restrictions **must** route via CIPC eServices direct, not Bizportal.
- **Swift co-route** (filing agents like InfoDocs, Statucor, AfroTools, BlueSky, etc.) — adds R200–R1,500 service fee but handles forms, FICA on directors, and Customised MOI uploads. Worth the spend on a financed production. Verify the agent is CIPC-recognised; check their compliance history.

### Total cost & timeline — Pty (Ltd) with Customised MOI

| Step | Cost | Days |
|---|---|:-:|
| Name reservation (CoR9.1) | R50 | 1–2 |
| Notice of Incorporation (CoR14.1) + Customised MOI | R175 (online) | 2–5 |
| Beneficial-ownership filing (within 10 business days of incorporation) | R0 | 1–3 |
| Filing-agent service fee (optional but recommended) | R200–R1,500 | — |
| **Total CIPC-side** | **R225–R1,725** | **~7 business days end-to-end** |

This excludes SARS VAT/PAYE/SDL/UIF registrations (those run in parallel to incorporation and have their own timeline — see `spv-corporate-tax.md` § Incorporation and registrations).

## Memorandum of Incorporation (MOI) — film-SPCV decision points

The MOI is the company's constitution. Standard CIPC MOIs (CoR15.1A short-form, CoR15.1B long-form) cover the Companies Act defaults and are appropriate for a simple founder-controlled Pty Ltd with no outside capital. A film SPCV that takes external equity, gap financing, or co-producer capital almost always needs a **Customised MOI (CoR15.1C/D)** — or, at minimum, a robust shareholders' agreement layered on top of a standard MOI.

The high-level question: **what goes in the MOI vs. the Shareholders' Agreement?** Material differences:

- **MOI is public** (filed with CIPC; accessible by third parties on application). Shareholders' Agreement is private.
- **MOI binds the company and all shareholders**, present and future, automatically. Shareholders' Agreement only binds signatories — a new shareholder is not bound unless they sign a deed of adherence.
- **MOI prevails** in any inconsistency with the Shareholders' Agreement (Companies Act s15(7)).
- **Some matters can only live in the MOI** — e.g. supermajority requirements for ordinary resolutions, pre-emptive-rights modifications, share-transfer restrictions binding on the company.

For a financier-grade SPCV, the working rule is: **put statutory-level protections in the MOI; put commercial detail in the Shareholders' Agreement.**

### MOI decision points for film SPCVs

The MOI should be considered for customisation in the following areas. **This is a decision-point list, not a drafting template** — engage a corporate-law attorney with film-finance experience to draft the actual clauses.

1. **Reserved matters requiring supermajority or financier consent.** Default Companies Act resolution thresholds are 50%+1 (ordinary) and 75% (special). The MOI can raise these for specific decisions — typically: changes to the recoupment waterfall, issue of new shares, encumbrance of the chain-of-title, change of director, key-person departure, MOI amendment. List the financier-protected matters explicitly.
2. **Pre-emptive rights on share issues (s39).** Default is statutory pre-emption for existing shareholders pro rata. The MOI can disapply, modify, or extend this — relevant where a financier wants the right to maintain percentage holdings on dilution.
3. **Restrictions on share transfers.** Companies Act default is that share transfers are subject to whatever the MOI says. For an SPCV holding chain-of-title security to a lender, share-transfer restrictions are non-negotiable — lender wants advance approval over any change in ownership during the loan period.
4. **Director appointment and removal mechanics.** Default is appointment by ordinary resolution, removal by ordinary resolution on notice. The MOI can reserve specific board seats to specific shareholders (e.g. financier-nominated director), require supermajority for removal, or require independent-director representation.
5. **Dividend distribution alignment with the recoupment waterfall.** Companies Act dividends are paid by class of share, pro rata to holding within class. To enforce a recoupment waterfall (priority returns to certain investors before others), use **different share classes** in the MOI with class-specific economic and voting rights. Alternative is to keep one share class and enforce the waterfall in the Shareholders' Agreement — but this is weaker against a non-signatory new shareholder.
6. **Anti-dilution and ratchet mechanics.** Where a financier wants protection against a down-round, ratchet mechanics live in the MOI via the share-class rights schedule. Decision: full-ratchet vs weighted-average. Commercial and tax consequences differ.
7. **Drag-along and tag-along.** Commercial provisions; can live in MOI or Shareholders' Agreement. MOI placement makes the right bind future shareholders automatically. Common for film-finance structures where a majority investor wants the right to drag minority into a sale (e.g. acquisition of the completed film by a distributor or studio).
8. **Auditor-selection clause if PIS crosses the audit threshold.** See PIS section below. Where a financier expects the SPCV to cross PIS 350 (typical for productions ≥ R25–30M), the MOI can pre-name an auditor or pre-specify the auditor-selection mechanism.
9. **Quorum and conduct of board / shareholder meetings.** Where directors are spread across SA and a foreign co-pro jurisdiction (Pathway B), the MOI should address quorum, video-meeting validity, and — critically — **where the board is deemed to meet**. This is where MOI structure intersects with POEM (see below).
10. **Reserved matters on IP encumbrance or disposal.** Chain-of-title is the SPCV's principal asset. Any encumbrance (security to gap lender, distribution-pledge to sales agent) or disposal (assignment to a distributor) should require supermajority or specific-investor consent. Bake into reserved-matters schedule.

### When a Standard MOI is enough

A Standard CoR15.1A or CoR15.1B is sufficient where:
- The producer holds 100% of the shares with no outside equity.
- All financing is debt (loan or grant), not equity.
- No financier requires director-board representation.
- The producer is willing to use a Shareholders' Agreement instead of the MOI for any cross-shareholder commercials (acknowledging the weaker enforceability against future shareholders).

Document the choice — standard or customised — and the reasoning, in the SPCV's file from incorporation.

## Director rules

**Minimum directors (s66(2)):** one director for a private company. (Public companies: minimum three.) A single-director SPCV is statutorily valid; in practice, financiers usually require at least two and often three.

**Director qualifications (s69):** a director must consent to act and meet the disqualification tests in s69(8) — not under 18, not an unrehabilitated insolvent, not under a disqualification order, etc.

**Foreign directors:** the Companies Act imposes **no SA-residency requirement** on directors. A film SPCV can have a 100% foreign-resident board. However:

- **POEM crossover** — if the foreign-resident directors make the key management and commercial decisions from outside SA, the company's *place of effective management* may be deemed to be outside SA, with major tax consequences. The Companies Act position (no residency requirement) does not bypass the Income Tax Act's POEM test in s1 "resident" definition. See SARS Interpretation Note 6 and `cross-border-treaty.md` § Permanent establishment risk.
- **FICA / KYC** — banks opening the SPCV's bank account will require KYC on every director, including notarised passport copies and proof-of-address for foreign directors. Build 2–4 additional weeks into the timeline for foreign-director KYC.
- **Beneficial-ownership filing** — foreign directors are not automatically beneficial owners (the BO test is economic interest or control, not directorship), but if a foreign director also holds shares above the 5% threshold, both filings apply.

**Director changes (CoR39):** must be lodged within 10 business days of the change. Director identity is public information on the CIPC register.

**Public Officer:** *not* a CIPC concept — it is a SARS Tax Administration Act requirement (s246 TAA). One Public Officer must be appointed and notified to SARS within one month of incorporation. The Public Officer must ordinarily reside in SA. This is a SARS-side step; see `spv-corporate-tax.md` § Incorporation and registrations.

## Beneficial Ownership regime (post-May 2023)

Following the General Laws (Anti-Money Laundering and Combating Terrorism Financing) Amendment Act 22 of 2022, CIPC introduced a mandatory Beneficial Ownership (BO) register from **1 May 2023**. Every company (except co-operatives) must file BO information. Material elements:

- **Beneficial owner definition:** a natural person who ultimately owns or controls a company, directly or indirectly, by holding a beneficial interest of **≥5%** in the company or share class, or by exercising significant influence over the management of the company.
- **Initial filing window:** **within 10 business days of incorporation** for new companies; pre-existing companies had migration-period deadlines that have now passed.
- **Annual update:** alongside the Annual Return (see below). Since **1 July 2024** CIPC has hard-stopped Annual Return filings where BO is not current — you cannot file the AR without first filing or confirming BO.
- **Change-trigger update:** any change to BO information (new beneficial owner, change of percentage, exit) must be filed within 10 business days of the change.
- **Documents required:**
  - Mandate to Lodge Beneficial Ownership (Ordinary Resolution of the board)
  - Register of Beneficial Owners (Register of Beneficial Interest)
  - Register of Shareholders/Members
  - Beneficial Ownership Diagram (Disclosure Form CoR42 — ownership chain up to the natural person)
  - Verified / certified ID or passport copies of each beneficial owner

- **Penalties for non-compliance:** the Companies Act allows CIPC to issue a compliance notice and impose an administrative penalty. More material: a missed BO filing blocks the AR filing, which after two consecutive misses puts the company into the deregistration process.

For a film SPCV, the BO register typically captures:
- The producer or producers as natural persons holding the SPCV equity (if held directly).
- Where the producer holds via a holding company (e.g. Ergo Holdco → SPCV), the ownership chain must trace up to the natural person(s) controlling the holdco.
- Any equity financier holding ≥5%. Foreign-resident financiers are still beneficial owners; foreign passport and address required on the register.
- Lender or grant funder — generally not a beneficial owner unless the loan has equity-conversion features that cross the 5% test.

**Common SPCV BO errors:**
1. Filing on incorporation but not updating on a subsequent equity round.
2. Treating a holdco-level shareholder as the beneficial owner without tracing up to the natural person.
3. Missing the 10-business-day window after incorporation.
4. Forgetting that the SPCV is blocked from AR filing until BO is current (post-1 July 2024).

## Public Interest Score (PIS) and audit / review consequences

The PIS is calculated annually under **Regulation 26 of the Companies Regulations, 2011**, made under the Companies Act 71 of 2008. The score determines whether the company needs an audit, an independent review, or just compiled financials.

### PIS calculation

| Component | Points |
|---|---|
| Average number of employees during the financial year | 1 point per employee |
| Annual turnover | 1 point per R1 million (or part thereof) |
| Third-party liabilities at year-end | 1 point per R1 million (or part thereof) |
| Individual shareholders at year-end | 1 point per individual |

(Where shares are held by a trust or company, that holder counts as one — not the underlying beneficiaries / shareholders.)

### Audit / review consequences

| PIS | Consequence |
|---|---|
| **≥ 350** | **Audit required** (Companies Reg 28(2)(c)(i)) |
| **100–349, internally compiled** | Audit required |
| **100–349, independently compiled, non-owner-managed** | **Independent review** by a registered auditor only (not by a CA(SA) in general practice — Reg 29(4)) |
| **100–349, independently compiled, owner-managed** | No audit or review required (statements still required) |
| **< 100, non-owner-managed** | Independent review (can be performed by a CA(SA), not necessarily a registered auditor) |
| **< 100, owner-managed** | No audit or review required |

"Owner-managed" means every shareholder is also a director — common in founder-only SPCVs, rare once external financiers attach.

### Typical PIS for a film SPCV

PIS arithmetic against an AoS-scale production (R15–50M budget, SA-resident producer, ~50–80 crew employees for ~3 months of production, modest financier base):

| Component | AoS-typical | Points |
|---|---|---|
| Employees (average across the YOA, including production crew on PAYE) | 20–40 | 20–40 |
| Turnover (production-year inflows: grants + broadcaster + equity + distribution MGs) | R20–50M | 20–50 |
| Third-party liabilities (gap loan if any; deferred fees; trade creditors at year-end) | R5–15M | 5–15 |
| Individual shareholders | 2–5 | 2–5 |
| **Total** | | **47–110** |

**Implication:** a mid-budget SA film SPCV typically lands around the **100-point boundary** in the production year. Independent review is the realistic floor; audit is triggered if employee count + turnover + liabilities together cross 350 (more common at R50M+ productions or where deferred-fee liabilities are large).

**Pathway B (foreign co-pro at $5M+):** turnover comfortably exceeds R90M, third-party liabilities (international gap, sales-agent advances) push higher, employee count larger. PIS **routinely ≥ 350 → audit mandatory**. Build audit fees into the budget from day one for Pathway B.

**Operating discipline:** the PIS calculation should be run **annually** at year-end, before financial statements are finalised. Independent review costs typically R15–60k; full audit R60k–R250k for a single-film SPCV. The MOI should pre-name the auditor where audit is expected, to avoid a financier-objected selection mid-production.

## Annual Return (CoR30.1)

Distinct from the SARS ITR14 corporate income tax return. The CIPC Annual Return is a confirmation that the company is still trading and is the trigger for CIPC's record-update on directors, registered address, etc.

### Filing window

- **Within 30 business days** of the anniversary date of incorporation, every year.
- Hard-stopped on BO compliance since 1 July 2024 — see Beneficial Ownership above.

### Fee scale (May 2026, private companies)

| Annual turnover | On-time fee | Late fee |
|---|---|---|
| Under R1m | R100 | R150 |
| R1m – R10m | R450 | R600 |
| R10m – R25m | R2,000 | R2,500 |
| Above R25m | R3,000 | R4,000 |

For a single-film SPCV at the AoS budget band (R15–50M), the on-time AR fee is **R2,000–R3,000** depending on which side of R25M the production-year turnover falls. Late fees are de minimis on absolute Rand value but the bigger risk is the deregistration cascade.

### Deregistration cascade

| Status | Trigger |
|---|---|
| **AR Deregistration Process** | Two consecutive missed Annual Returns |
| **Final Deregistration** | A further period of non-filing after the process status |

AR-deregistration is recoverable cheaply (catch-up ARs + R200 reinstatement). Final deregistration requires a High Court reinstatement order — meaningful legal cost and 3–6 months of delay. **A deregistered SPCV cannot transact** — the bank account is frozen, distribution receipts cannot be collected, and SARS-side compliance becomes a separate problem.

For a film SPCV that has finished principal photography and entered the long-tail exploitation phase, the AR is the single most common compliance miss — the company stops feeling "live" to the producer but is still receiving SVOD residuals, AVOD aggregator quarterly statements, festival fees, and (eventually) reportable income that triggers SARS interest. Calendar the AR anniversary date as a non-negotiable.

## Other ongoing CIPC-side compliance

- **Director changes (CoR39):** within 10 business days of any change.
- **Share issues:** under the Customised MOI rules + s38, s40 Companies Act. Significant equity rounds (post-incorporation share issues to bring in financiers) require board approval, shareholder approval where pre-emptive rights apply, and a share-register update. No mandatory CIPC notification for the issue itself, but the next BO filing and next AR will reflect it.
- **MOI amendments:** require a special resolution (75%) and lodgement on CoR15.2. Common triggers in the production lifecycle: new share class for an equity round; revision of reserved matters; auditor pre-naming.
- **Registered office changes:** lodge CoR21.1 within 5 business days.
- **Annual financial statements:** must be approved by the board within 6 months of year-end (s30). Distinct from the SARS ITR14 deadline (12 months from year-end).

## CIPC ↔ SARS boundary — what auto-registers, what doesn't

| Registration | Authority | Auto on CIPC incorporation? |
|---|---|---|
| Company existence + IT number | CIPC + SARS | **Yes** — but verify SARS IT reference is issued before relying |
| VAT (s23 VAT Act) | SARS | **No** — separate application required |
| PAYE / SDL / UIF (EMP201 family) | SARS / DOL | **No** — separate application required |
| UIF declaration (UI-19) | Department of Labour | **No** — separate per-employee filing |
| COIDA registration | Compensation Commissioner | **No** — separate filing |
| Beneficial Ownership (CoR42) | CIPC | **No** — must be filed within 10 business days of incorporation |
| Public Officer notification | SARS | **No** — separate notification within 1 month |
| FSP licence (if any) | FSCA | **No** — irrelevant for a film SPCV |

The most common SPCV-incorporation defect is **assuming Bizportal's one-stop covers everything**. Bizportal triggers the core registrations but does not:
- File the Beneficial Ownership return.
- Lodge a Customised MOI (it only supports the short-form standard MOI).
- Register the Public Officer with SARS.
- Open a foreign-currency banking sub-account where the SPCV expects USD/GBP/EUR receipts from international counterparties.

For a financier-grade SPCV, treat Bizportal as the wrong tool. Route via CIPC eServices direct with an experienced filing agent.

## Primary sources

- Companies Act 71 of 2008 (ss15, 36–41, 45, 50, 66, 69, 76, 80, 246 [Public Officer cross-ref to TAA])
- Companies Regulations, 2011 (Regs 26, 28, 29 — PIS and audit/review)
- General Laws (Anti-Money Laundering and Combating Terrorism Financing) Amendment Act 22 of 2022
- CIPC published fee schedule and forms (CoR9.1, CoR14.1, CoR15.1A/B/C/D, CoR15.2, CoR21.1, CoR30.1, CoR39, CoR42)
- CIPC published guidance on Beneficial Ownership filing (step-by-step guide, 2024–2026 iterations)
- Tax Administration Act 28 of 2011 (s246 Public Officer — SARS-side, cross-referenced here)
- Income Tax Act 58 of 1962 s1 "resident" definition (POEM — cross-referenced for foreign-director risk)
- SARS Interpretation Note 6 (POEM)

## Valid as at

2026-05-20. CIPC fees, beneficial-ownership filing windows, and Reg 26 PIS thresholds must be re-verified against the current CIPC fee schedule and Companies Regulations text before issuing any deliverable. CIPC has revised forms and fee scales periodically — confirm on the CIPC website (`cipc.co.za`) before quoting figures to a financier.

## What this reference does not address

- Drafting of actual MOI clauses, shareholders' agreements, or director resolutions (engage a corporate-law attorney with film-finance experience)
- Conversion of an existing CC to a Pty Ltd (Companies Act Schedule 2 procedure — engage attorney)
- Multi-class share-structure design, weighted-average anti-dilution ratchet calibration, and option-pool sizing (commercial / equity-financier negotiation)
- B-BBEE scorecard verification or scorecard arithmetic (separate skill / verification agency)
- FICA / KYC procedures for foreign directors and shareholders (bank-side / attorney-side)
- Exchange-control approvals for inbound foreign equity (SARB FinSurv — see `cross-border-treaty.md` § Exchange control)
- Litigation, business rescue (Companies Act Chapter 6), or wind-down
- IP assignment, chain-of-title clearance, or rights enforcement (entertainment-law speciality)
- Cross-jurisdictional vehicle choice (Mauritius, Isle of Man, Delaware) — multi-jurisdictional advice required
