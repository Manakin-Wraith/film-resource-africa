---
type: pim-template
project: FRA
title: PIM Tax Appendix Pack
status: v1.0 — first exercised on AoS PIM v0.4 (2026-05-18)
created: 2026-05-18
parent: project-investment-memo.md
skill_source: ../../../../film_resource_africa/film-directory/.claude/skills/sars-film-tax/
first_use: ../members/gumbi/pim-assault-on-soweto.md (Appendices A / B / C)
---

# PIM Tax Appendix Pack — Template

> A bundled drop-in template for the three investor-facing tax appendices that complete the tax-side of a Project Investment Memo. Composes:
>
> - **Appendix A** — Investor Tax Structure Memo (from skill `templates/investor-tax-memo.md`)
> - **Appendix B** — Crew & Talent Payment Decision Tree (from skill `templates/crew-payment-decision-tree.md`)
> - **Appendix C** — SPV First-Year Compliance Checklist (from skill `templates/spv-compliance-checklist.md`)
>
> Use this pack whenever a PIM needs financier-grade tax structuring as appendices. First exercised end-to-end on AoS PIM v0.4 (2026-05-18).

---

## How to use this template

1. **Read the skill first** — `film_resource_africa/film-directory/.claude/skills/sars-film-tax/SKILL.md` and the underlying references: `spv-corporate-tax.md`, `vat-film-production.md`, `paye-crew-talent.md`, `cross-border-treaty.md`, `fact-checklist.md`. This pack is a packaging convenience; the substance comes from the references.

2. **Gather the minimum fact set** in `fact-checklist.md` before populating. If a fact is missing, flag inline as `**confirm with {PRODUCER}**` rather than guessing.

3. **Substitute the placeholders** below. Placeholders use `{CURLY_BRACES}`. If a section does not apply to the production (e.g. no Pathway B, no foreign cast), keep the section header and write a one-line "Not applicable in {PATHWAY}; if {TRIGGER} engages, populate per `cross-border-treaty.md`."

4. **Preserve every "Valid as at" date, every practitioner-boundary disclaimer, every "What we did not address" section, and every primary-source footer.** These are the skill's non-negotiable discipline.

5. **Refuse to insert** any of the following, regardless of producer/investor request:
   - s12O modelled as a live planning incentive (sunset 1 Jan 2022)
   - DTIC SAFPRI / Foreign Film Incentive as a financial assumption (administrative freeze since late 2023)
   - Headline ROI %, "guaranteed returns" framing, point estimates without a primary-source range
   - Aggressive avoidance schemes that may trigger GAAR (s80A–L) or reportable arrangements (s34–39 TAA)

6. **Cite primary sources for every substantive claim.** Reference the Income Tax Act / VAT Act section, SARS Interpretation Note, Binding General Ruling, or published SARS guide.

7. **Cross-reference the PIM's own SPCV Tax Profile and Setup Checklist sections** where they exist (typical numbering: §1A / §1B) instead of duplicating the static-tax-position table.

---

## Placeholder index

| Placeholder | What goes here | Fact-checklist category |
|---|---|---|
| `{TITLE}` | Production title in italics | Universal |
| `{PRODUCER}` | Producer / production company legal name + entity type | Universal |
| `{SPV_NAME}` | SPCV legal name (or "to be incorporated as single-film SPCV") | Universal |
| `{SPV_YEAR_END}` | YOA / financial year-end of the SPCV (typically Feb) | Universal |
| `{BUDGET_BAND}` | Budget range in production currency + USD equivalent | Universal |
| `{TERRITORY}` | Principal-photography territory | Universal |
| `{DATE}` | Memo date in YYYY-MM-DD | Universal |
| `{PATHWAY_A_INBOUND_LIST}` | Counterparties paying the SPCV under Pathway A | Universal |
| `{PATHWAY_A_OUTBOUND_LIST}` | Counterparties paid by the SPCV under Pathway A | Universal |
| `{PATHWAY_B_TRIGGER}` | What event triggers Pathway B (e.g. "UK/IE co-pro restructure", "US service-production engagement") | Cross-border |
| `{ROLES_TABLE_PATHWAY_A}` | Per-role crew table — populate from production's crew list | Crew/talent |
| `{ROLES_TABLE_PATHWAY_B}` | Per-role foreign crew table — populate or mark "scaffold" | Cross-border |
| `{PIM_TAX_PROFILE_REF}` | Cross-ref to the PIM's static-tax-position section (e.g. "§1A") | n/a |
| `{PIM_SETUP_CHECKLIST_REF}` | Cross-ref to the PIM's incorporation/setup checklist (e.g. "§1B") | n/a |

---

## Appendix A — Investor Tax Structure Memo

> **Production:** *{TITLE}*
> **Producer:** {PRODUCER}
> **SPV:** {SPV_NAME}
> **Prepared for:** {AUDIENCE — equity-financier / co-producer / NFVF panel / etc.}
> **Date:** {DATE} — Valid as at {DATE}
> **Status:** Draft for discussion with a registered SARS tax practitioner. Not tax advice.
> **Source skill:** `.claude/skills/sars-film-tax/templates/investor-tax-memo.md`

### A.1 Executive position

{One paragraph, ≤120 words. State the structure, the tax characterisation, and the key certainty points. No headline percentages unless drawn directly from statute or a SARS ruling, and only as ranges. Reference whether s24F is the primary deduction mechanic and confirm s12O / DTIC are explicitly not assumed.}

### A.2 Structure

```
{HOLDCO_OR_PARENT}
        │  {OWNERSHIP_DESCRIPTION}
        ▼
{SPV_NAME} (Pty Ltd)
    ├── Inbound:   {PATHWAY_A_INBOUND_LIST}
    ├── Outbound:  {PATHWAY_A_OUTBOUND_LIST}
    └── Holds:     {IP_HOLDING_DESCRIPTION}
```

{One paragraph: single-vehicle vs. Production SPV + IP HoldCo rationale. If offshore IP HoldCo is being considered, flag the POEM, CFC (s9D), royalty WHT (s49), and exchange-control risks and refuse to recommend without practitioner sign-off.}

### A.3 South African tax treatment

#### A.3.1 Corporate income tax

The SPCV is an SA-resident company taxable on worldwide income at the prevailing CIT rate (currently 27% for years of assessment commencing on or after 1 April 2022). Production expenditure incurred in the production of income and not of a capital nature is deductible under **s11(a)** read with **s23**, with the timing mechanics of **s24F** governing production-cost spend specifically (cross-reference {PIM_TAX_PROFILE_REF}). Pre-completion development costs default to capital unless the SPCV is in the trade of producing and exploiting multiple films — for a single-film SPCV, treat development as capital absent specific facts. Assessed losses carried forward are limited under **s20(1)(a)** to 80% of taxable income in any subsequent year. SBC eligibility under **s12E** is not assumed.

#### A.3.2 VAT

The SPCV will register for VAT. {STATE THRESHOLD POSITION — voluntary day-one or compulsory once R2.3M threshold met (raised effective 1 April 2026 from R1M).}

Three flows are material:

1. **Local supplies** ({LIST LOCAL FLOWS}): 15% standard rate where in scope. (Grants are typically outside scope of VAT — confirm per grant agreement.)
2. **International rights exports** ({LIST INTERNATIONAL FLOWS}): **zero-rated under s11(2)(l)** of the VAT Act where the foreign principal is not in SA at the time of supply and the supply is not directly connected with movable property situated in SA (cross-reference {PIM_TAX_PROFILE_REF}).
3. **Input VAT on production spend**: claimable in full to the extent the SPCV's outputs are taxable (including zero-rated). The SPCV will likely run a persistent refund position; **Category C monthly returns** should be requested at registration to accelerate refunds.

> **Operating discipline — non-negotiable:** every zero-rated invoice must be supported by the documentary file required by SARS **Binding General Ruling 11** and **Interpretation Note 31**: written contract naming a non-SA principal address, proof of principal's absence from SA at supply, proof of foreign-currency receipt through SA banking system, and tax invoice marked "Zero-rated — s11(2)(l)". Build from day one. SARS has, in audits, recharacterised production-services exports as connected to SA-situated personnel or equipment — the documentary file is the audit defence.

#### A.3.3 Withholding taxes

Address only flows actually present in the deal:

- **Dividends to non-resident shareholders** — {APPLICABLE? If yes: 20% under s64D–N, DTA-reducible to typically 5–15%. If no: state "not applicable in {PATHWAY}".}
- **Royalties paid by SPCV to non-resident IP owner** — {APPLICABLE? If yes: 15% under s49A–D, DTA-reducible. If no: state "not applicable in {PATHWAY}".}
- **Foreign artists/entertainers performing in SA** — {APPLICABLE? If yes: 15% final WHT under s47A–K; SPCV is withholding agent. DTA relief narrowly available. If no: state "not currently applicable; no foreign cast attached" and cross-reference Appendix B for scaffold.}
- **Foreign WHT on inbound international revenue** — opposite-direction mechanic: foreign jurisdictions withhold tax on payments to the SA SPCV. SA relief via **s6quat foreign tax credit** on the SPCV's SA CIT liability. Producer cash receipt is gross minus foreign withholding (15% standard, DTA-reduced).

#### A.3.4 PAYE, SDL, UIF

The SPCV will operate PAYE on employees and on freelancers who fail the Fourth Schedule independent-trader tests. The SARS *Guide on the Employers' Tax Responsibilities wrt Artists, Models or Crew in the Film Industry* (LAPD-IT-G05) governs the characterisation of on-camera talent and crew. SDL at 1% applies if annual payroll exceeds R500,000. UIF at 1%+1% (capped). COIDA per Compensation Commissioner tariff for film/TV. Per-role characterisation in **Appendix B**.

### A.4 Incentive environment — current position

- **Section 12O** does not apply: the exemption sunset on 1 January 2022. {TITLE} principal photography post-dates the cut-off. The much-cited "10-year tax-free film income" exemption is unavailable. **No financial assumption in this memo or in the financial model relies on s12O.**
- **DTIC SAFPRI / Foreign Film Incentive** is not accepting new applications at the date of this memo (administrative freeze since late 2023; adjudication panel last met March 2024; zero approvals in FY2024/25 + FY2025/26). **No financial assumption in this memo or in the financial model treats DTIC as a planning input.** {Where applicable, note DTIC line shown as contingent receivable in italics for transparency only.}
- **{LIST LIVE GRANT/EQUITY INSTRUMENTS — NFVF, GFC, IDC Media, KZNFC, WCFC, etc.}** remain live and are addressed in {PIM_RECOUPMENT_SECTION_REF}. Treated as grants/equity rather than tax incentives.

### A.5 Cross-border position

**Pathway A ({DESCRIPTION}):** {Describe the cross-border flow profile. Most SA-anchored productions are limited to inbound foreign-WHT on streaming/aggregator revenue + outbound zero-rated supplies. State whether any DTA article is currently relied upon and whether any TRC is held.}

**Pathway B ({PATHWAY_B_TRIGGER} — scaffold, open items):**

| Flow | DTA article | SA mechanic | Open items |
|---|---|---|---|
| {Co-pro producer fee paid to SPCV by foreign co-producer} | Art. 7 business profits | Zero-rated supply (s11(2)(l)) on VAT; ordinary SA-source trading income on CIT | Confirm contracting structure; collect TRC of co-producer |
| {Royalty / licence flowing SPCV → foreign IP HoldCo (if structure routes IP offshore)} | Art. 12 royalties | s49 WHT 15%, DTA-reducible | **Do not assume offshore IP HoldCo without practitioner sign-off** — POEM, CFC (s9D), and exchange-control risks |
| {Foreign lead actor performing in SA} | Art. 17 entertainers (most DTAs preserve source taxation) | s47A–K 15% final WHT | Identify foreign cast; confirm DTA Art. 17 wording per treaty |
| {Foreign HOD/crew brought into SA shoot} | Art. 14/15 dependent personal services | DTA short-stay (typically 183 days) may exempt from SA PAYE | TRC per individual; day-count tracking discipline |
| {Outbound dividend to foreign equity} | Art. 10 dividends | s64D–N 20%, DTA-reducible to 5–15% | Ownership-threshold review per DTA |
| {Transfer pricing on any inter-company service / licence} | s31 + DTA arm's-length article | Cost-plus mark-up survivable by benchmarking; pure cost-recovery (0% margin) will be challenged | Documentation thresholds (master file / local file) depend on group revenue |

**Permanent establishment risk:** the SPCV structure is the canonical PE-avoidance mechanism for the foreign co-producer. It works only if the SPCV is genuinely the SA contracting party and is not a bare nominee. Flag in any Pathway B structuring memo.

**Exchange control (SARB FinSurv):** any inbound foreign equity, inbound foreign loan, or IP step touching SA development requires authorised-dealer reporting or SARB approval. Defer to a SARB-authorised dealer or exchange-control practitioner — out of scope for this memo.

### A.6 Risks and assumptions

1. **Zero-rating documentary discipline.** s11(2)(l) zero-rating on international rights exports requires the BGR 11 / IN 31 documentary file from day one. A SARS recharacterisation as a connected-property supply would re-rate the affected invoices at 15% and create a cash-flow tax liability the SPCV did not collect from the foreign principal.
2. **Assessed-loss utilisation cap.** s20(1)(a) caps carry-forward loss utilisation at 80% of taxable income in any subsequent year. The SPCV may carry a tax cost in the year of significant exploitation income notwithstanding total-life losses.
3. **s24F qualification depends on 75% local-spend tracker.** {Cross-reference PIM tax-profile item.} If post-production is sent abroad and total SA-paid prod+post costs drop below 75%, s24F treatment is lost and the deduction is forced into 10-year amortisation at 10%/year — materially worse cash position.
4. **DTIC reopening assumption — explicitly not made.** Base recoupment excludes the DTIC line.
5. **s12O reporting tail.** Not applicable to {TITLE} itself; if any of the producer's *prior* approved-SPCV films are still inside the 10-year reporting window, those reporting obligations are separate and must not be conflated with {TITLE} planning.
6. **CIT, VAT, WHT rates.** Stated as at the date of this memo. Verify against current SARS rate tables before any signature event.
7. **Pathway B is a scaffold, not advice.** Every Pathway B line in §A.5 is conditional on a specific restructure event that has not occurred. Treaty relief, transfer pricing, PE-avoidance, and offshore-IP analysis must be re-run by a registered tax practitioner against the actual restructure facts before any reliance.
8. **Treaty Principal Purpose Test (PPT).** Most SA DTAs renegotiated post-2017 include a PPT under the MLI. Any Pathway B structure must show genuine business purpose, not tax-driven.
9. {PRODUCTION-SPECIFIC RISKS — e.g. SA shoot disrupted by load-shedding affecting completion; foreign co-pro anchor not yet attached; cast contracted in non-treaty jurisdiction}

### A.7 What this memo does not address

- Exchange control approvals and authorised-dealer reporting (SARB Currency and Exchanges Manual)
- Employment law beyond PAYE (BCEA, LRA, COIDA tariff selection)
- Chain-of-title and IP enforcement (rights clearances, music sync, errors-and-omissions insurance)
- Sales-tax treatment in jurisdictions outside SA
- B-BBEE rating mechanics and scorecard composition
- s12O legacy reporting obligations on any of the producer's prior approved-SPCV films
- Financial-model construction (cross-reference the production's tax-simulation file if one exists)
- {ADD PRODUCTION-SPECIFIC OUT-OF-SCOPE ITEMS}

---

*Primary sources: Income Tax Act 58 of 1962 (ss11(a), 20, 23, 24F, 23H, 12P, 12O[sunset], 6quat, 47A–K, 49A–D, 64D–N, 31, 9D, Fourth Schedule); Value-Added Tax Act 89 of 1991 (ss7, 11(2)(l), 14, 17, 23); Tax Administration Act 28 of 2011; SARS Interpretation Note 31 (Documentary proof for zero-rated supplies); SARS Binding General Ruling 11; SARS LAPD-IT-G05 (Film industry artists/models/crew); SARS Interpretation Note 6 (POEM); SARS Interpretation Note 59 (Government grants); SARS Interpretation Note 67 (Connected persons); applicable DTAs (per counterparty).*

*This memo is a draft for discussion with a registered SARS tax practitioner. It is not tax advice and may not be relied upon as such.*

---

## Appendix B — Crew & Talent Payment Decision Tree

> **Production:** *{TITLE}*
> **SPV:** {SPV_NAME}
> **Prepared:** {DATE} — Valid as at {DATE}
> **Status:** Draft for discussion with a registered SARS tax practitioner. Not tax advice.
> **Source skill:** `.claude/skills/sars-film-tax/templates/crew-payment-decision-tree.md`

Per role, work top to bottom. Stop at the first matching characterisation. Apply the resulting tax treatment.

### B.1 Decision steps

**Step 1 — Residence.** Is the worker a non-resident of SA for tax purposes?

- **Yes**, and the worker is **on-camera artist/entertainer performing in SA** → apply **s47A–K**, 15% final WHT on gross. SPCV withholds and remits by end of the month following payment. DTA relief only where the relevant treaty's entertainer article so provides — usually narrowly. **Stop.**
- **Yes**, and the worker is **crew (not on-camera)** present in SA → check **source rules (s9(2)(h))** plus DTA short-stay (typically 183 days) and dependent-personal-services / business-profits articles. If treaty exempts, hold TRC and proceed without SA PAYE. If not exempt, treat under Step 2.
- **No** (worker SA-resident) → continue to Step 2.

**Step 2 — Fourth Schedule independent-trader tests** (paragraph 1):

- Does the SPCV control how, when, and where the work is done?
- Does the worker work mainly on the SPCV's premises (set) at hours the SPCV sets?
- Is the worker integrated into the SPCV's call sheets and reporting lines?
- Does the worker bear no entrepreneurial risk (no risk of loss, no own clients during the engagement)?
- Does the SPCV supply the tools and equipment?

Mostly **YES** → **deemed employee**. Operate PAYE/SDL/UIF/COIDA. IRP5 at year-end. **Stop.**
Mostly **NO** → likely independent contractor; continue to Step 3.

**Step 3 — Personal service provider (PSP) check.** Is the worker invoicing through a company or trust they control?

- **Yes**: check the PSP definition (Fourth Schedule, paragraph 1). If three or fewer of the PSP exclusions apply, the entity is a PSP and the SPCV must withhold PAYE on payments to it — effectively **27% on companies, 45% on trusts**. **Stop.**
- **No** (worker invoices as natural-person sole proprietor): true independent contractor. No PAYE; the worker is a provisional taxpayer. SPCV issues no IRP5 but may need IT3(a) at year-end depending on reportable thresholds.

**Step 4 — SDL, UIF, COIDA.** Apply to any worker characterised as employee (Step 2) or PSP (Step 3). True independent contractors (Step 3 sole prop): none of the above.

**Step 5 — Allowances and per diems.** Subsistence within published SARS daily rates (in-republic / out-of-republic, with/without meals) not taxable. Above-rate amounts taxable as remuneration if worker is an employee. Travel allowances per deemed-expenditure tables; reimbursive travel treated separately.

### B.2 Per-role output — Pathway A ({DESCRIPTION})

> {ROLES_TABLE_PATHWAY_A — populate from production's crew list. If full crew not yet attached, populate by role category as in the AoS v0.4 worked example and note "confirm full crew list with {PRODUCER}".}

| Role | Step 1 | Step 2 | Step 3 | Treatment | Authority |
|---|---|---|---|---|---|
| {Producer name + role} | {SA resident / non-resident} | {N/A or test outcome} | {Invoicing entity test} | {PAYE / Indep / PSP withhold @ 27%} | {Fourth Schedule / LAPD-IT-G05} |
| {Director name + role} | … | … | … | … | … |
| {Each HOD with own kit} | SA resident | Mostly NO | Sole prop or CC | Indep contractor / non-PSP if exclusions met | Fourth Schedule |
| {Each day-rate / pool crew category} | SA resident | Mostly YES | — | PAYE + SDL + UIF + COIDA | Fourth Schedule |
| {SA-resident lead / featured talent} | SA resident | Usually YES per LAPD-IT-G05 §5 | If loan-out: PSP test pulls PAYE back | Default PAYE on talent fee | LAPD-IT-G05 §5 |
| {Extras / background} | SA resident | Usually YES | — | PAYE if above threshold; IT3(a) where appropriate | LAPD-IT-G05 |
| {Post-production house (if SA)} | SA resident entity | N/A — supplier invoice | N/A | Supplier invoice with VAT; watch s24F 75% tracker | s11(a) |

**Pathway A WHT exposure:** {"nil for s47A–K (no non-resident on-camera talent)" OR "applicable — {LIST}"}

### B.3 Per-role output — Pathway B ({PATHWAY_B_TRIGGER} — scaffold)

> {Mark "Not applicable; no Pathway B trigger anticipated" if production is SA-anchored only. Otherwise populate as scaffold pending engagement.}

| Role (scaffold) | Step 1 | Treatment (subject to facts) | Open items |
|---|---|---|---|
| Non-resident lead actor performing in SA | Non-resident entertainer | **s47A–K 15% final WHT** on gross fee; remit end of month following payment | Identify performer; confirm DTA Art. 17 wording in relevant treaty; TRC; loan-out structure |
| Non-resident director (if engaged) | Non-resident | Likely Art. 7/14 — business profits / dep services. Art. 17 if on-camera. | TRC; treaty article determination |
| Non-resident DOP / HOD brought in for SA shoot | Non-resident crew | DTA short-stay (typically 183 days) → no SA PAYE if TRC held and day count under threshold | TRC per individual; day-count tracking from arrival |
| Non-resident day-rate crew on SA shoot | Non-resident crew | As above — DTA short-stay | TRC per individual |
| SA-resident crew on foreign leg of shoot | SA resident performing abroad | SA worldwide income; SA PAYE if employee. Possible s6quat foreign tax credit | Day count abroad; foreign-jurisdiction tax position |

### B.4 What this template does not address

- Loan-out company structures where the loan-out is non-resident — additional layer of analysis required (entity-level POEM and PSP rules)
- Profit participations and deferred fees — timing of PAYE accrual on accrual not cash
- Equity participations to talent / crew — Fourth Schedule treatment of share-based payments
- Multi-territory split shoots — apportionment of remuneration between SA and other source jurisdictions
- Music sync / underlying-rights royalty payments to performers (separate from performance remuneration)
- {ADD PRODUCTION-SPECIFIC OUT-OF-SCOPE ITEMS}

---

*Primary sources: Income Tax Act 58 of 1962, Fourth Schedule (esp. para 1 definitions of "employee", "independent trader", "personal service provider"); ss9(2)(h), 47A–K; SARS LAPD-IT-G05 *Guide on the Employers' Tax Responsibilities wrt Artists, Models or Crew in the Film Industry*; Skills Development Levies Act 9 of 1999; Unemployment Insurance Contributions Act 4 of 2002; applicable DTAs (per individual); SARS published subsistence and travel rate tables.*

*This is a draft for discussion with a registered SARS tax practitioner. It is not tax advice.*

---

## Appendix C — SPV First-Year Compliance Checklist

> **Production:** *{TITLE}*
> **SPV:** {SPV_NAME}
> **Producer:** {PRODUCER}
> **Prepared:** {DATE} — Valid as at {DATE}
> **Status:** Working document. Draft for discussion with a registered SARS tax practitioner; not tax advice.
> **Source skill:** `.claude/skills/sars-film-tax/templates/spv-compliance-checklist.md`
> **Distinct from {PIM_SETUP_CHECKLIST_REF}:** that section is the *pre-operational setup* checklist (incorporation calendar). This appendix is the *first-year ongoing operational* checklist that begins once setup is complete.

### C.1 Incorporation & registrations — recap and confirmation gate

> Cross-reference {PIM_SETUP_CHECKLIST_REF}. Items below are confirmation gates after the setup steps complete.

- [ ] Pty (Ltd) incorporated at CIPC; **MOI reviewed for waterfall / reserved-matter clauses** appropriate to the recoupment waterfall
- [ ] SARS Income Tax reference issued and confirmed (do not rely on CIPC auto-registration alone)
- [ ] **VAT registration filed**, voluntary from day one if below R2.3M threshold; compulsory once threshold met
- [ ] **Category C (monthly) VAT requested** where SPCV expects persistent refund position from zero-rated exports
- [ ] PAYE / SDL / UIF registered **before first crew payment**
- [ ] COIDA registration filed (film/TV tariff)
- [ ] CIPC beneficial-ownership filing lodged (annual since 2023)
- [ ] **SPCV bank account opened in SPCV's own name** — all production funds flow through this account. **Non-negotiable for s24F documentation, zero-rating proof, and grant audit trail.**

### C.2 Documentation foundations (build from day one)

- [ ] Shareholders' agreement and waterfall schedule
- [ ] Chain-of-title file: option, writer, director, cast, music (sync + master), location releases
- [ ] {Production services agreement(s) with each grant funder} — terms; grant-payment trigger conditions
- [ ] {Distribution agreement(s)} — terms; recoupment position; minimum guarantee if any
- [ ] {Broadcaster licence agreement(s)} — licence-window scope and territory
- [ ] **SVOD / AVOD acquisition / licence agreements** — for each foreign principal: explicit non-SA address; foreign-currency payment terms; tax invoice template marked **"Zero-rated supply — s11(2)(l)"** if facts support
- [ ] **International sales agency agreement** — territorial scope; commission; expense cap; reserved-rights schedule
- [ ] **Tax Residency Certificates** collected for every non-resident counterparty paying the SPCV
- [ ] {If Pathway B engages: inter-company licence / service agreement between SPCV and foreign co-producer, drafted with arm's-length pricing memo (s31)}
- [ ] **s24F 75% local-spend tracker** initiated at production start; reviewed weekly; cumulative SA spend % flagged if approaching 75% floor
- [ ] **s23H prepayment register** maintained from day one (location deposits, equipment hire spanning YOAs, insurance premiums spanning multiple YOAs, music rights advance payments)
- [ ] BGR 11 documentary file template established and populated per zero-rated invoice

### C.3 Ongoing compliance calendar — first year

- [ ] **VAT201**: Category C monthly returns by the 25th of the following month (or 7th if eFiling debit-pull). Track refund position.
- [ ] **EMP201**: PAYE/SDL/UIF monthly by the 7th of the following month
- [ ] **EMP501**: bi-annual reconciliation — interim by end of October, final by end of May
- [ ] **Provisional tax IRP6**: first by 6-month mark of YOA, second by YOA end, third top-up within 6/7 months after year-end. SPCV year-end: {SPV_YEAR_END}
- [ ] **Withholding tax returns**: scheduled for any s47 / s49 / s50 outflows ({state Pathway A position; Pathway B per restructure})
- [ ] **ITR14** (CIT return): within 12 months of year-end
- [ ] **IT3(a)** issued to true-independent-contractor crew at May EMP501 reconciliation where reportable thresholds met
- [ ] **IRP5** issued to every employee / PSP-treated party at May EMP501 reconciliation

### C.4 Tax-sensitive operating disciplines

- [ ] **Per-diem and subsistence rate audit:** every per-diem / subsistence payment cross-checked against the SARS published rate table; above-rate excess included in remuneration where worker is employee
- [ ] **Fourth Schedule per-role assessment:** every freelancer engagement assessed against the independent-trader tests per Appendix B; outcome documented per role
- [ ] **PSP screen on every loan-out / company invoice:** company-invoiced HOD / talent engagements run through the PSP exclusion test; PAYE withheld at 27% where PSP characterisation triggered
- [ ] **Cross-border payment screen:** every payment to a non-resident screened for s47 / s49 / s50 WHT and DTA position **before payment** — not after
- [ ] **Entertainment input VAT denials applied:** no input VAT on staff/talent entertainment per s17(2)(a); on-set working catering generally allowed but documented as production-purpose
- [ ] **Motor-vehicle input VAT discipline:** no input VAT on "motor car" as defined (s17(2)(c)); light delivery vehicles, trucks, and most production vehicles fall outside the denial — confirm per invoice
- [ ] **Documentary file per zero-rated invoice held per BGR 11:** contract, payment proof, address evidence, foreign-currency receipt evidence
- [ ] **Barter / contra-deal VAT accounting:** any in-kind location / kit / talent equity recorded at open-market value with VAT consequences
- [ ] **Currency-of-receipt discipline:** foreign-principal payments routed through the SPCV's own foreign-currency account where possible; FX gain/loss accounting per IAS 21 / IFRS for SMEs

### C.5 Red flags to escalate to a practitioner immediately

- [ ] Any payment that may create a foreign PE for a co-producer
- [ ] Any offshore IP step — assignment, licence, emigration of IP, change in IP-holding entity
- [ ] Any shareholder loan, sweetheart interest rate, or value shift to/from a connected party (s64E(4) deemed-dividend trap)
- [ ] Any restructure (including Pathway-A → Pathway-B conversion) within 18 months of an exploitation event
- [ ] Any arrangement matching the reportable-arrangements list (s35 TAA)
- [ ] s24F 75% local-spend tracker drops below 78% (early-warning band — investigate post-production routing immediately before it drops to 75% trigger)
- [ ] BGR 11 documentary file gaps on any zero-rated invoice older than 30 days
- [ ] A foreign crew member's day-count exceeds 150 days in SA (early-warning band for the 183-day DTA short-stay threshold)

### C.6 What this checklist does not address

- Exchange control approvals (SARB FinSurv) for any inbound foreign equity, foreign loans, or outbound IP steps
- Employment law beyond PAYE (BCEA leave, LRA dispute resolution, employment-equity reporting)
- Industry-specific levies (SASFED, CCMA dispute fees, music-rights body collections — SAMRO/SAMPRA)
- Statutory audit threshold review (Companies Act audit / independent review classification)
- B-BBEE annual verification and scorecard maintenance
- Cash-flow and treasury management (working capital against VAT refund timing, foreign-currency hedging)
- {ADD PRODUCTION-SPECIFIC OUT-OF-SCOPE ITEMS}

---

*Primary sources: Income Tax Act 58 of 1962 (Fourth Schedule, ss11(a), 20, 23, 23H, 24F, 47A–K, 49A–D, 50A–H, 64D–N); Value-Added Tax Act 89 of 1991 (ss7, 11(2)(l), 14, 17, 23); Tax Administration Act 28 of 2011; Skills Development Levies Act 9 of 1999; Unemployment Insurance Contributions Act 4 of 2002; Companies Act 71 of 2008; SARS Interpretation Note 31; SARS Binding General Ruling 11; SARS LAPD-IT-G05; SARS published subsistence and travel rate tables (current year).*

*This is a draft for discussion with a registered SARS tax practitioner. It is not tax advice.*

---

## Re-use record

| Production | PIM Version | Date | Notes |
|---|---|---|---|
| *Assault on Soweto* (gumbi) | v0.4 | 2026-05-18 | First end-to-end exercise of this template pack. Source PIM: `../members/gumbi/pim-assault-on-soweto.md` Appendices A / B / C |
| *Russian Roulette* (McCarthy/Snyman) | | | Next candidate per `pilots/russian-roulette-pilot-2026-05-06.md` |
| *The Visit* (Hölscher) | | | Sequenced as PIM #2 per master feature note |

Append a row each time this pack is dropped into a new PIM. Captures real-world exercise patterns and surfaces template gaps for next iteration.

---

## Skill location note

The canonical home of the sars-film-tax skill is `/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory/.claude/skills/sars-film-tax/` (standard Cowork/Claude-Code project-root location). The skill itself contains the references (SPV / VAT / PAYE / cross-border / fact-checklist) and the four templates including this pack. A duplicate copy of the skill (without this pack) currently also exists at the parent level `/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/.claude/skills/sars-film-tax/` — that duplicate is a leftover from initial authoring and should be deleted to avoid drift. Run:

```bash
rm -rf "/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/.claude/skills/sars-film-tax"
```

This file (in the vault) is the working copy for Gerhard's day-to-day reference; the skill folder copy is what Cowork picks up at session start.
