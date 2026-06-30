# AFX Producer Profile — Data Requirements (Design Spec)

**Date:** 2026-06-30
**Status:** Approved in brainstorm; ready for implementation planning.
**Scope:** Defines *what data the producer profile requires* and where each field comes from. This is the field-inventory + requirements layer. The intake *UX* (screen-by-screen flow) and the rating *engine* are separate specs.

---

## 1. Context & purpose

AFX is the producer-only finance layer behind FRA. A producer's profile is their **investable asset**: funders screen and compare it on the Deal Display. For the profile to be a credible finance instrument (not a brochure), we must be deliberate about what data we collect, where it comes from, how trustworthy it is, and what it unlocks.

The defining insight: **a profile is built backwards from the producer's track record.** We auto-draft their *past projects* first — these act as **case studies that vet experience and credibility** and drive the initial Producer Rating. Only then does the producer add *new live projects* (the actual asks) to raise on. A producer can be rated on track record yet have nothing screenable until they add a live project.

## 2. Core model: one Project, two purposes

Past work and live deals are the **same `Project` entity distinguished by a lifecycle status** — not two separate types. A live project that wraps **graduates** into a case study (its outcome fields get filled in), so track record compounds over time.

| Status | Purpose | Dominant fields |
|---|---|---|
| `case_study` | **Vet experience** (track record). Drives the rating. | Outcomes: role, budget band, recoupment outcome, bond used, distribution/buyers secured, festival/awards |
| `live` | **The ask** (screenable deal). Drives deal flow. | Forward: capital stack, funding secured, packaging + status, commercial path, jurisdiction; AFX overlays incentive + signals |
| `archived` | Hidden/retired. | — |

Shared by all: title, format, genre, producer's role, dates, jurisdiction(s), budget band.
**Graduation:** `live → case_study` on wrap — the producer fills outcome fields; the deal's ask fields freeze as historical.

### 2.1 The producer's journey — two explicit phases (must be unmistakable in the UI)

The producer must never be confused about which kind of project they're adding or why. The profile presents the work as **two clearly separated, labelled zones**, and onboarding walks them in order:

- **Phase 1 — Build your track record.** *"Let's start with the work you've already done."* Link-first auto-draft populates past projects as **case studies**; the producer confirms them and adds outcomes. This phase is framed as **establishing credibility** — it produces the Producer Rating. There is **no fundraising ask** here.
- **Phase 2 — Add what you're raising on.** Once rated, *"Now add a project you're seeking finance for."* A live project is an explicitly **different action**, with a **different form** (the ask: budget, gap, packaging, jurisdiction, capital stack) and a **different audience** (funders screening you).

The two zones are never blended on the page:

| Zone | Label | What it is | Empty-state copy |
|---|---|---|---|
| Track Record | **"Track Record"** (case studies) | Your proof — judged for experience | "Add your past projects — these are the case studies funders use to judge your experience." |
| Live Slate | **"Live Slate"** (raising now) | Your active asks — screened by funders | "You're rated on your track record. Add a live project to start raising — you're 1 project from going live." |

This separation is a **hard requirement**, not styling: the labels, the ordering (track record first), and the distinct empty states are what make the case-study-vs-live-deal distinction self-evident to the producer.

## 3. Intake spine: link-first auto-draft

The producer pastes ≥1 public link (IMDb / IMDbPro / LinkedIn / company site). AFX auto-drafts everything externally knowable — identity, past projects (as case studies), credits, festivals/awards, distribution relationships — and returns a populated profile + a provisional rating + a "here's the gap to the next band" list in ~10 seconds (the "magic moment"). The producer's job is then **confirm/correct** the draft and **supply what no external source has** (sensitive financials) — not type everything. CV/deck upload and "start blank" are fallbacks.

Everything auto-drafted lands as **self-reported** provenance until the producer attests (→ confirmed) or it is audited (→ verified).

## 4. Field inventory

Tags — **Source:** 🔗 auto-drafted (producer confirms) · ✍️ producer supplies · ⚙️ AFX overlays/derives · ∑ computed roll-up. **Tier:** Create / Go-live / Optional (rating enricher).

### Group 1 — Operator Identity *(who you are)*
| Field | Source | Tier |
|---|---|---|
| ≥1 public link (IMDb/LinkedIn/site) | ✍️ | Create |
| Producer name | 🔗 confirm | Create |
| Contact email (private) | ✍️ | Create |
| Short bio | 🔗 confirm | Go-live |
| Base location (city, country) | 🔗/✍️ | Go-live |
| Headshot, company/banner, languages/regions | 🔗 | Optional |
| Career stage (Emerging → Institutional) | ∑ derived | — |

### Group 2 — Track Record / Case Studies *(projects with status `case_study`)*
The financial spine and the rating's foundation. Per case study:
- **Identity (mostly 🔗):** title, year, format, genre, **producer's role** (producer/EP/co-pro/line)
- **Outcomes (✍️ bands only):** budget band, **recoupment outcome** (Fully / Partial / No / Under NDA), completion bond used? (Y/N + bonder)
- **Reach (🔗/✍️):** distribution/buyers secured, festival selections / awards
Case studies are optional to *go live* but heavily **rating-linked**. Role-credit accuracy and chain-of-title are verification-deferred (see Gates).

### Group 3 — Relationships *(who you work with)*
Distribution / buyer / financier contacts — each with **type** (distributor / streamer / broadcaster / sales agent / financier) and **nature** (output / library / one-off). 🔗 where derivable, ✍️ otherwise. Optional, rating-linked.

### Group 4 — Live Slate *(projects with status `live` — the screenable unit)*
**Producer supplies (deal facts):**
- Title, format + genre, **logline/synopsis**, **stage** (dev/pre/prod/post/delivered)
- **Total budget** (band)
- **Jurisdiction(s)** — where it shoots/spends *(drives the incentive overlay)*
- **Capital stack** — equity / soft / debt / **gap** (bands)
- **Commercial path** (theatrical / streamer / broadcaster / festival)
- **Packaging** — director · lead cast · writer · sales agent/distributor, each tagged **signed / soft-hold / wishlist**
- Comparable titles *(optional enricher)*

**AFX overlays / derives (never producer-entered):**
- **Incentive & Rebate hero** — rebate %/scheme/confidence/payout/freshness, keyed off jurisdiction(s) from AFX's **incentive registry** (the credibility moat)
- **PRS band**, **deal signal**, **risk decomposition**, **risk flags** (e.g. single-project)

**Go-live threshold per project = core deal facts + packaging** (minimum: director/writer attached + a funding plan/capital stack).

### Group 5 — Sensitive Aggregates *(computed) + NDA upgrade*
- Typical budget tier · Capital raised (lifetime) · Recoupment record · Bond history → **∑ rolled up from Group 2 case studies**, never separately typed.
- **NDA upgrade (optional):** the producer e-signs the **FRA↔producer NDA**, which unlocks entering **exact figures** on any band field (case-study or live). Exact numbers are held confidentially — **funders still see only bands** — but they bump provenance self→**confirmed**, lift the rating, and are the precondition for formal verification. Echoes FRA's existing member MOU process.

### Group 6 — Entity & Consent *(knockout gates)*
- **K2 Legal entity** — entity name, country of incorporation, structure type (reg # optional). **Go-live**; caps rating until verified.
- **K4 Transparency/reporting consent** — one toggle. **Go-live**.
- **K1 Chain of title** (per live project) & **K3 Clean record** (litigation/insolvency/bond-claim) — verification-deferred; they **cap** the rating band until cleared but do **not** block go-live.

## 5. Cross-cutting: provenance & rating linkage

Every claim carries a provenance badge:
- **self-reported** (amber) — auto-drafted or producer-typed
- **confirmed** (blue) — producer attests a specific item, or supplies an exact figure under NDA
- **verified** (green) — FRA / line-producer audit

**Edit rule:** editing a confirmed/verified field reverts it to self-reported (shown before save). The rating moves on: case-study depth + recoupment record, lifetime raise, bond history, slate funding-readiness (criterion C3), and the K1–K4 gates. Withholding rating-linked data is allowed but visibly costs band position.

## 6. Requirement tiers (the three thresholds)

| Threshold | Requires |
|---|---|
| **Create a profile** | ≥1 public link + producer name + contact email (auto-draft fills the rest) |
| **Go live to funders** | bio · location · K2 entity · K4 consent · **≥1 `live` project meeting core + packaging** |
| **Climb the rating** | per-case-study financials · NDA exact-figure upgrade · verification · slate depth (≥2 projects) · clear K1/K3 |

A producer with rich case studies but no live project is **rated but not screenable** (visibility = `one-away`/`hidden`).

## 7. Data-model direction (evolves the prototype)

The prototype (`src/lib/afx/types.ts`) currently splits `ProducerProfile` (cockpit), `ProfileProject`, and `DealEntity` (marketplace). This spec converges them onto a **unified `Project` with `status`**:

```ts
type ProjectStatus = 'case_study' | 'live' | 'archived';

interface Project {
  id: string;
  status: ProjectStatus;
  // shared
  title: string; format: Format; genre?: string; role: string;
  year?: number; jurisdiction: string[];
  budgetBand: Provenanced<string>;           // bands only; exact figure NDA-gated
  // case_study outcomes (status === 'case_study')
  outcomes?: {
    recoupment: Provenanced<string>;
    bondUsed: Provenanced<string>;
    distribution: { name: string; type: string; provenance: Provenance }[];
    festivalsAwards?: string[];
  };
  // live ask (status === 'live')
  ask?: {
    logline: string; stage: Stage; commercialPath: string;
    capitalStack: { equity: number; soft: number; debt: number; gap: number }; // bands/%
    packaging: { role: string; name: string; status: 'signed'|'soft-hold'|'wishlist' }[];
    comps?: { title: string; note: string }[];
  };
  // AFX-derived/overlaid (live) — NOT producer-entered
  derived?: { incentive: Incentive; prsBand: RatingBand; dealSignal: number; riskFlags: string[] };
}

interface ProducerProfile {
  // Group 1 identity + Group 6 entity/consent + Group 3 relationships
  // bands aggregates are COMPUTED from projects where status==='case_study'
  projects: Project[]; // both case studies and live, distinguished by status
  ndaSigned: boolean;  // unlocks exact-figure entry
}
```
Exact figures (post-NDA) live in a private field that never serializes to the funder-facing view — only the derived band does.

## 8. Out of scope (separate specs)
- Intake screen-by-screen UX / wizard flow.
- The Producer-Rating and PRS scoring engines (this spec defines *inputs*, not the formula).
- The incentive registry's own data pipeline (freshness/watch-log).
- Verification workflow mechanics (audit queue, line-producer tooling).
- The NDA's legal text and e-sign integration.

## 9. Open questions
- None blocking. Future: whether case-study financials can be partially auto-inferred from public box-office/sales data (would change Group 2 sources from ✍️ toward 🔗).
