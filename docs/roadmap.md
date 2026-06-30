# FRA × AFX — Roadmap

*The African film industry's discovery layer, powered by its finance-ready marketplace.*

**Last updated:** 4 June 2026
**Reference specs:** [`FRA-x-AFX-spec.md`](../../../OBSIDIAN_app/OBSIDIAN_vault/PI_Brain/projects/Film-Resource-Africa/FRA-x-AFX-spec.md) · [`rebate-calculator-spec.docx`](../rebate-calculator-spec.docx) · [FRA × AFX Google Doc](https://docs.google.com/document/d/1QbgijOc18HFSw25H3lOVXCQMRd6GLrSsfm1ERdokHks/edit)

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

## Discovery engine backlog (FRA scanner / opportunity verification)

*Engineering backlog for the automated opportunity/news pipeline (`scan_opportunities.mjs`). Separate from the business phases above. Shipped to date: enrichment + Readability/Wayback, completeness + mandatory-deadline insert gate, Phase-C re-verification cadence, anti-invention rail + non-canonical-source block, human-keep lock, email review digest, freshness/countdown badges, news Africa-relevance gate, and cycle-history capture.*

**Opportunity lifecycle "Phase 2" — cyclical intelligence:**
- [x] **Stage 1 — cycle_history capture** (shipped 2026-06-04, PR #7). `opportunities.cycle_history` jsonb records every cycle's deadline on insert/reopen/close/shift; 109 rows backfilled.
- [ ] **Stage 2 — seasonal reopen prediction.** Once a programme has ≥2 recorded cycles, infer its typical reopen/deadline month and gate dormant re-verify polling to that window (weekly in-window; ~quarterly safety-net otherwise) instead of blind monthly checks. *Note: mostly inert until programmes log a 2nd cycle (months out), since the backfill only captured 1 cycle each.*
- [x] **Stage 3 — roll-forward triggers** (shipped 2026-06-04). A scan's "now open" signals (opportunity leads + news, opening-keyword-filtered) are matched to existing closed/expired programmes by own-domain (excluding generic platforms) or distinctive multi-token name, and forced into the Phase-C re-verify batch immediately. Reopen stays admin-gated, so a false match only costs one scrape.

**Other discovery-engine items:**
- [ ] **Apply-link rot remediation.** Code fix shipped 2026-06-15 (`getApplyUrl` extracts the first real URL from freeform `Apply:` fields; was rendering `about:blank#blocked` when the field was prose). A full scan of all 278 opportunities then surfaced link-rot in the *destinations* themselves. Find current official URLs and patch:
  - **Open/upcoming, user-facing (priority):** `acp-eu-culture-programme` [44] (domain dead), `runway-hundred-film-fund` [50] (404), `1-billion-followers-summit` [52] (domain dead), `mip-africa`/`fameweekafrica` [56] (expired SSL cert), `carthage-film-festival-jcc` [60] (domain dead), `west-african-funding-summit` [137] (domain dead), `afac-nacp` [130] (cert chain, news link).
  - **Data error:** `jumpstart` [33] — `Apply:` has domains mid-string (not at start) so none is extracted; field reads "If re-launched…" — confirm programme still runs. `dfm-access` [32] — `Apply:` field holds eligibility text, not a URL (closed, so no button shows).
  - ~15 more dead destinations sit on **closed/rejected** opps where no Apply button renders — lower priority.
- [ ] News relevance is keyword-based; consider an LLM relevance pass for edge cases (e.g. SA-specific acronyms like SABC/ANC the keyword list misses).
- [ ] Admin: when an admin approves/keeps a flagged opp, set `review_locked_at` so future re-verify never re-flags it (currently approved-status is the implicit lock).
- [ ] PDF opportunity pages: dedicated `pdf-parse` enrichment pass (Playwright can't read PDF bodies).

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
- [`FRA-x-AFX-spec.md`](../../../OBSIDIAN_app/OBSIDIAN_vault/PI_Brain/projects/Film-Resource-Africa/FRA-x-AFX-spec.md) — the strategic one-pager
- [`rebate-calculator-spec.docx`](../rebate-calculator-spec.docx) — the Phase 1 wedge, fully scoped
- [`fra-redesign-concept.html`](../fra-redesign-concept.html) — UI direction for the FRA layer
