# FRA × AFX — Roadmap

*The African film industry's discovery layer, powered by its finance-ready marketplace.*

**Last updated:** 20 April 2026
**Reference specs:** [`fra-x-afx-spec.docx`](../fra-x-afx-spec.docx) · [`rebate-calculator-spec.docx`](../rebate-calculator-spec.docx) · [FRA × AFX Google Doc](https://docs.google.com/document/d/1QbgijOc18HFSw25H3lOVXCQMRd6GLrSsfm1ERdokHks/edit)

---

## Vision

FRA is the pan-African directory that filmmakers trust. AFX is the South Africa–first marketplace that turns verified, compliance-ready projects into deal flow for funders, studios, and institutional capital. **One funnel, two layers, one thesis: we are the translation layer between story and finance.**

## Product architecture

| | **FRA — Discovery Layer (free)** | **AFX — Finance Layer (paid)** |
|---|---|---|
| **Position** | Top of funnel · Pan-African | Bottom of funnel · SA first |
| **Audience** | Filmmakers, producers, writers | Funders, studios, sales agents, co-pros |
| **Surfaces** | Directory, News, Spotlight, Country pages, Call Sheet, Industry Directory, Rebate Calculator (public), Digest | Verified Project Cards, Finance-Ready checklist, QSAPE/B-BBEE math, Compliance vault, Funder dashboard |
| **Goal** | Audience, trust, SEO, creator capture | Deal flow, revenue, moat |

Both layers share accounts, project data model, and brand — AFX is the paywalled workspace sitting behind FRA.

## Geographic strategy

- **FRA** — pan-African from day one. All 54 countries, with depth where we have partner/editorial traction.
- **AFX v1** — SA-only compliance stack (QSAPE, B-BBEE, DTIC rebate, SARS tax, CIPC chain of title, 14-day shoot check, 25% skin-in-the-game proof).
- **AFX Year 1** — Nigeria and Kenya rebate modules as country plug-ins against the same data model.

## Business model

| Stream | Who pays | Price | When |
|---|---|---|---|
| Listing & Readiness | Creators | $15 / project | Months 1–3 |
| High-Signal Discovery | Studios, funds, sales agents | $250 / mo | Months 4–9 |
| Success Fees | Both sides on closed deals | 1–2% | Year 1+ |
| Data / B2G Licensing | Governments, institutions (Afreximbank, NFVF, DTIC) | Bespoke | Year 1+ |

---

## Phase 1 — Manual Matchmaker (next 30 days)

**Goal:** one closed introduction between a verified project and an enquiring SA studio.

- [ ] Ship public **Rebate & Net Exposure Calculator** (SA) at `/rebate-calculator` — standalone, shareable, SEO-optimized. First AFX-flavored wedge on FRA. Full spec: [`rebate-calculator-spec.docx`](../rebate-calculator-spec.docx).
  - **v1 (14 days):** DTIC SAFPRI + NFVF + Western Cape. Result Card + email-gated PDF.
  - **v1.1 (30 days):** KZN + Gauteng. Shareable `/r/{slug}`. Save to Project Workspace.
  - **v1.2 (60 days):** Nigeria + Kenya modules. Co-pro treaty math. Embeddable widget.
  - **Blocker:** verify current DTIC SAFPRI rate structure post-2024 restructuring.
- [ ] Airtable intake for Finance-Ready checklist (script sample, producer/director CVs, CIPC, SARS, B-BBEE cert, budget top-sheet, 25% skin proof).
- [ ] Manual verification pass by Gerhard / freelance line producer.
- [ ] Manual outbound to the "dominant SA studios" already enquiring.
- [ ] Track: applications submitted, verified, and matched.

## Phase 2 — SaaS Automation (next 90 days)

**Goal:** self-serve readiness + first paying studio subscribers.

- [ ] Project Workspace inside the Next.js app — creator creates a project once, drives everything downstream.
- [ ] Package Builder v1 — logline/synopsis sheet, director's statement, budget top-sheet (SA line items), exportable to PDF.
- [ ] Verified badge flow with line-producer auditor in the loop.
- [ ] First paid Studio subscribers ($250/mo). Handshake contracts.
- [ ] Shortlist + deadline nudges + personalized digest (FRA engagement engine feeding AFX signups).
- [ ] Editorial: "What This Fund Actually Wants" briefs for the top 20 African funds (SEO + trust).
- [ ] FRA Glossary — 80 finance terms in plain English, with African context.

## Phase 3 — Institutional Engine (Year 1+)

**Goal:** AFX becomes the default deal-flow surface for African production capital.

- [ ] Nigeria + Kenya rebate modules.
- [ ] Funder dashboard with due-diligence UX — saved searches, filtered deal flow, structured project cards.
- [ ] Success-fee infrastructure (contracts, tracking, collection).
- [ ] B2G conversations — NFVF, DTIC, Afreximbank/CANEX.
- [ ] Funded Here outcome database published as annual report.
- [ ] Regional expansion: Morocco, Egypt, Ghana rebate modules.

---

## North Star Metric

**Dollars of production financing won by FRA-registered projects.** Not subscribers, not listings — funded output. Reported publicly once a year as the proof of positioning.

**Phase 1 proxy:** # of projects verified + # of qualified intros to studios.
**Phase 2 proxy:** # paid studio subs + $ in ARR.
**Phase 3 proxy:** $ in deals closed through AFX + # institutional contracts.

## Open items

- [ ] Validate the "dominant SA studios already enquiring" relationship — need names, strength of signal, willingness to sign.
- [ ] Research the DTIC incentive schedule and confirm capital-deployment timing (see spec: *"They are getting their act together, now is the time."* — verify this window).
- [ ] Decide pricing test for Listing Fee ($15 flat vs. free + Premium verification upsell).
- [ ] Identify first freelance Line Producer / Verification Auditor.
- [ ] Brand architecture: "FRA powered by AFX" vs. "AFX — by FRA" — decide visible lockup.

## Reference

- [AFX executive summary (Google Doc)](https://docs.google.com/document/d/1QbgijOc18HFSw25H3lOVXCQMRd6GLrSsfm1ERdokHks/edit)
- [`fra-x-afx-spec.docx`](../fra-x-afx-spec.docx) — the strategic one-pager
- [`rebate-calculator-spec.docx`](../rebate-calculator-spec.docx) — the Phase 1 wedge, fully scoped
- [`fra-redesign-concept.html`](../fra-redesign-concept.html) — UI direction for the FRA layer
