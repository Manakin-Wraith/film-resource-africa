# AFX Track Record Capture — Design Spec

**Date:** 2026-06-30
**Status:** Approved in brainstorm; ready for implementation planning.
**Scope:** Make the cockpit's **Track Record fully producer-buildable** — add, edit, and remove case studies through a side drawer, capturing every comprehensive field including tagged evidence links. The *self-build* half of the producer journey's first vetting gate. No FRA vetting, no DB migration, no new server code.

---

## 1. Context: where this fits

AFX S1 Foundation (shipped, PR #18) gave an invited producer a real, persisted, private profile — but the cockpit can only **add live projects**, not case studies, and the Track Record card only edits a thin slice of fields (budget band, recoupment, bond). A real producer starting from an empty slate sees "Add your past projects…" with no way to act on it.

This slice closes that gap. In the producer journey:

```
PRODUCER
▼ Build Track Record (identity + case studies + evidence links)   ← THIS SLICE (self-build)
├── submit for producer vetting ──▶  FRA vets producer/company + case studies   (S2, later)
```

Case studies feed **credibility / rating + the lifetime aggregates** (`computeAggregates`), NOT the funder go-live gate (which is driven by live projects via `meetsGoLive`). So Track Record capture is about experience/rating, decoupled from the live-slate visibility path.

**Everything a producer enters is provenance `'self'` until vetted.** Promotion to `confirmed`/`verified` is S2's job.

## 2. Goal & success criteria

**Goal:** a producer can fully build their Track Record from empty — add a case study, fill in all comprehensive fields, attach tagged evidence links, edit it later, and remove it — and it all persists via the existing autosave.

**Done when:**
1. The Track Record zone shows a **"+ Add case study"** action (and a working CTA in the empty state).
2. Add / Edit opens a **right-side drawer** with the full comprehensive form; the Track Record list stays visible behind it.
3. The drawer edits a **local buffer**; **Save** commits to the profile (and autosaves), **Cancel** discards with no write.
4. A producer can capture: title, format, genre, year, role, jurisdiction; budget band + optional NDA exact budget; recoupment; completion bond; multiple distribution rows (name + type); festivals/awards; and a tagged evidence-link list.
5. A producer can **remove** a case study (with a confirm).
6. Saved case studies persist across reload (existing autosave + RLS) and appear in the lifetime aggregates and the Funder Preview.
7. The NDA `exact.budget` privacy boundary is unchanged — exact still isolated; evidence is non-exact and rides `body`.

## 3. Data model additions (types only — NO migration)

Because each project's non-exact data persists in the `afx_projects.body` JSONB column, this slice needs **no database migration**. The new evidence list and the newly-editable fields ride along in `body` (the `profileToRows` mapper already routes everything except `exact` there).

Extend `src/lib/afx/types.ts`:

```ts
/** What a piece of evidence substantiates, for the tagged evidence list. */
export type EvidenceClaim = 'budget' | 'recoupment' | 'bond' | 'distribution' | 'festival' | 'other';

export interface EvidenceLink {
  id: string;          // crypto.randomUUID()
  url: string;         // stored as entered
  supports: EvidenceClaim;
}
```

Add to `Project`:

```ts
  /** Producer-attached supporting links, each tagged to the claim it backs.
   *  Non-exact (shareable proof) — persisted in body, NOT in the NDA `exact` column. */
  evidence?: EvidenceLink[];
```

**Fields the drawer makes editable** (all already exist on `Project`/`ProjectOutcomes`; today they are display-only or unreachable for producer-created studies):
`title`, `format`, `genre`, `year`, `role`, `jurisdiction[]`, `budgetBand` (`Provenanced<string>`), `outcomes.recoupment` (`Provenanced<string>`), `outcomes.bondUsed` (`Provenanced<string>`), `outcomes.distribution[]` (`{ name; type; provenance }`), `outcomes.festivalsAwards[]` (`string[]`), plus the NDA-gated `exact.budget` (`ExactMoney`).

## 4. The drawer + save model

**`CaseStudyDrawer.tsx`** — a right-side panel, reusing the marketplace drill-down overlay's slide-in + Esc-to-close + focus handling + `z-index ~90`. It edits a **local buffer copy** of one case study, never `draft` directly:

- **Add** → blank buffer: `crypto.randomUUID()`, `status: 'case_study'`, all `Provenanced` fields `'self'`, empty `outcomes` (recoupment/bond empty `'self'`, `distribution: []`, `festivalsAwards: []`), `evidence: []`, no `exact`.
- **Edit** → `structuredClone` of the selected study into the buffer.
- **Save** → upsert the buffer into `draft.slate` by `id` → the existing debounced autosave persists it.
- **Cancel / Esc / backdrop** → discard the buffer; `draft` untouched.

This buffer-then-commit model is the reason for a drawer: a half-typed case study never autosaves partial data — only a deliberate **Save** writes.

**Inputs:**
- Dropdowns: **format** (Feature / Documentary / Series / Short), **recoupment** (Fully recouped / Partially recouped / Not recouped / Under NDA), **completion bond** (Bonded / Not bonded; optional financier free-text when Bonded), **distribution type** (Theatrical / SVOD / TVOD / AVOD / Broadcast / Festival).
- Free-text: **title** (required), **year**, **role**, **genre**, distribution **name**, festival/award entries.
- Multi-select chips: **jurisdiction** (ZA / NG / KE / SN / … from the existing jurisdiction set).
- **Tagged evidence list:** rows of `URL` + a `supports` dropdown (Budget / Recoupment / Bond / Distribution / Festival / Other) + remove; an "+ add link" button.
- **NDA budget:** the existing `ExactFigureInput` primitive (gated by `ndaSigned`), wired to `exact.budget`.

Provenance badges render on the `Provenanced` fields (budget band, recoupment, bond) using the existing `ProvenanceBadge`; producer edits keep/return them to `'self'` via the existing revert helper.

## 5. Component structure

- **New `src/components/afx/producer/CaseStudyDrawer.tsx`** — the comprehensive form (the bulk of the work). Props: the buffer study, change callbacks (or a single `onChange(next: Project)`), `onSave`, `onCancel`, `onRemove?`, `ndaSigned`, `defaultCurrency`.
- **New option constants in `src/lib/afx/constants.ts`** — `CASE_STUDY_FORMATS`, `RECOUPMENT_OPTIONS`, `BOND_OPTIONS`, `DISTRIBUTION_TYPES`, `EVIDENCE_CLAIM_LABELS` — so dropdowns/badges stay in lockstep.
- **Modify `src/components/afx/producer/TrackRecordZone.tsx`** — add the **"+ Add case study"** button; make each card a richer **read-only summary** (title, year·format·role, budget band, recoupment/bond chips, distribution + festival counts, evidence-link count) that opens the drawer on click / an Edit affordance; wire the empty-state CTA. The cramped inline inputs are removed — the drawer owns editing now.
- **Modify `src/app/afx/producer/ProducerProfileClient.tsx`** — drawer open/close + buffer state; handlers:
  - `onAddCaseStudy()` — open drawer with a blank case-study buffer.
  - `onEditCaseStudy(id)` — open drawer with a clone of that study.
  - `onSaveCaseStudy(study)` — upsert into `draft.slate` (by id), close drawer.
  - `onRemoveCaseStudy(id)` — confirm (reuse the `ConfirmArchive`-style modal), then drop from `draft.slate`.

The old `onOutcomeField` inline-edit path in `TrackRecordZone` is superseded by the drawer. `onExact` stays (now invoked from inside the drawer).

## 6. Validation & provenance

- **Required to save:** a non-empty **title** only. Everything else is optional and fillable over time (low friction — stub a title, return later). Save is disabled / no-ops when title is blank.
- **Provenance:** every producer-entered field starts and stays `'self'`; the existing provenance-revert behavior carries over. S2 vetting is what promotes to `confirmed`/`verified`.
- **URLs:** evidence URLs stored as entered; light validation only (non-empty, basic URL shape) — no fetching, no preview, no link-liveness check.
- **IDs:** new case studies and evidence links use `crypto.randomUUID()` (satisfies the server's UUID guard; consistent with live-project ids).

## 7. Out of scope (later slices)

- **FRA vetting / rating** of case studies, the `verified` tier, the FRA admin surface → S2.
- **Funder visibility of evidence links** — evidence sits in `body` (so it is technically in the funder-view shape today), but whether/how funders see proof links is a publish-slice decision; this slice does not add a separate funder gate for evidence. Exact budget remains NDA-isolated regardless.
- **File uploads** — links only, no asset storage.
- **Auto-draft / "magic fill-in"** of case studies from external sources.
- **Per-field evidence inline** and **untagged link lists** — rejected in favor of the tagged list.

## 8. Risks & decisions

- **Buffer vs live-bind:** the drawer edits a buffer and commits on Save, specifically to avoid the autosave persisting half-typed case studies. Accepted.
- **No migration:** evidence + newly-editable fields live in `body` JSONB; verified safe because the persistence mappers already round-trip arbitrary `body` content and `exact` stays isolated. If a future slice needs to *query* case studies by an evidence/outcome field, that field gets promoted to a column then — not now (YAGNI).
- **TrackRecordZone rewrite:** moving from inline inputs to read-only-card + drawer is a deliberate replacement of the current edit path, not an additive change; the `onOutcomeField` prop is retired.

## 9. Open questions

- None blocking. Future (S2): whether editing a vetted case study materially (e.g. changing budget band) auto-reverts it to `self` and re-queues vetting, or flags it for re-review.
