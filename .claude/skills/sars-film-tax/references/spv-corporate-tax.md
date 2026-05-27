# SPV / SPCV Corporate Tax — Reference

## What an SPV is, for film purposes

A Special Purpose Vehicle (in dtic / NFVF terminology, a **Special Purpose Corporate Vehicle / SPCV**) is a company incorporated under the **Companies Act 71 of 2008** whose sole purpose is the production (and, in some structures, the exploitation) of a single film or television project.

Even outside the now-closed 12O / dtic rebate regimes, the SPV remains the standard structuring vehicle because it:

- Ring-fences production liabilities (completion, E&O, crew claims) from the parent producer's balance sheet.
- Gives co-producers, financiers, and gap lenders a clean security interest in a defined asset pool.
- Isolates the chain-of-title and the IP holding so distribution waterfalls can be enforced.
- Makes VAT, PAYE, and CIT reporting attributable to a single production for audit and recoupment purposes.

## Incorporation and registrations

> **See also: `cipc-spcv-setup.md`** — full CIPC-side detail on vehicle choice, MOI customisation decision points, foreign-director / POEM crossover, Beneficial Ownership regime, Public Interest Score thresholds, and annual return obligations. This section summarises the registration touchpoints; the CIPC reference covers the company-law decisions that sit underneath them.

| Step | Authority | Notes |
|---|---|---|
| Incorporate Pty (Ltd) | CIPC | Standard MOI for founder-only SPCVs; **Customised MOI (CoR15.1C/D)** for any SPCV taking outside equity — covers waterfall-aligned share classes, reserved matters, pre-emptive rights, share-transfer restrictions. See `cipc-spcv-setup.md` § MOI decision points |
| Income Tax registration | SARS (auto on CIPC) | Verify IT reference number issued; do not rely on auto-registration without confirmation |
| VAT registration | SARS | See `vat-film-production.md`. Compulsory at R1m turnover in any 12-month period; voluntary from R50,000 |
| PAYE / SDL / UIF | SARS / Dept of Labour | Required once first salaried employee or in-scope crew payment is made |
| Workmens' Compensation (COIDA) | Compensation Commissioner | Required for any employee on set |
| Beneficial ownership filing | CIPC | **Within 10 business days of incorporation; annual thereafter**; mandatory since 1 May 2023; hard-stop on AR filing since 1 July 2024. See `cipc-spcv-setup.md` § Beneficial Ownership regime |

## Corporate Income Tax (CIT)

- Standard CIT rate: **27%** (since years of assessment commencing on or after 1 April 2022).
- Small Business Corporation (SBC) sliding scale (s12E) is generally **not available** to film SPVs because of the "personal service" and shareholder-count restrictions; do not assume SBC eligibility without checking s12E(4) line by line.
- Production expenditure is deductible under **s11(a)** read with **s23** to the extent incurred in the production of income and not of a capital nature. The capital/revenue line for development costs (script, option, packaging) is fact-specific — default treatment is capital unless the SPV is in the trade of producing and exploiting multiple films.
- Provisional tax: SPVs are provisional taxpayers. First and second provisional returns (IRP6) due 6 months into and at end of the year of assessment respectively; third (top-up) within 6/7 months after year-end.

## Ring-fencing of assessed losses

- s20A (ring-fencing) generally targets natural persons, not companies, but s20(1)(a) limits the carry-forward of assessed losses for companies to **80% of taxable income** in any subsequent year (since 1 April 2022). Plan distribution timing accordingly — large exploitation income years may not fully absorb prior production losses in one period.

## IP holding structures

Two common patterns:

1. **Single SPV holds both production activity and IP.** Simpler; CIT and exploitation income flow through the same entity. Suitable for single-film, founder-controlled productions.
2. **Production SPV + IP HoldCo.** The IP HoldCo licenses rights to the production SPV (or to distributors directly). Allows separation of production-phase risk from long-tail exploitation. Watch transfer pricing (s31) on the licence fee — must be arm's length and documented.

For foreign-financed productions, the IP HoldCo is sometimes placed offshore. This raises:
- **Place of effective management (POEM)** risk — an offshore HoldCo managed from SA is SA-resident and SA-taxable on worldwide income.
- **Controlled Foreign Company (CFC)** rules (s9D) for SA shareholders.
- **Royalties withholding tax (s49A–D)** at 15% on royalties paid out of SA to a foreign HoldCo, subject to DTA relief.

Do not recommend offshore IP HoldCo structures without explicit treaty analysis and practitioner sign-off.

## Dividends and shareholder returns

- Dividends Tax: **20%** withholding on dividends paid to SA-resident individuals and most foreign shareholders; reduced under most DTAs to typically 5–15%.
- Beware deemed dividends (s64E(4)) on shareholder loans at below-official-rate interest.

## Year-end & filing

- Year of assessment: SPVs typically align with parent producer's year-end; February year-end is most common but not required. Confirm at incorporation.
- ITR14 (CIT return) filing window: 12 months after year-end.
- IT14SD (supplementary declaration) on request.

## Primary sources

- Income Tax Act 58 of 1962, ss11(a), 20, 20A, 23, 31, 64D–N, 9D
- Companies Act 71 of 2008
- SARS published rate tables (current year)
- Tax Administration Act 28 of 2011 for provisional tax, returns, penalties

## Valid as at

2026-05-18. Verify CIT rate, dividends WHT rate, and provisional tax dates against the latest SARS rate table before issuing any deliverable.
