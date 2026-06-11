# Design Character Plan — making FRA look designed, not generated

**Date:** 2026-06-11 · **Status:** Draft for discussion
**Goal:** Simplify the UI and give it a distinct editorial character so the site reads as deliberately designed for African film — not as a generic AI-generated dark-mode SaaS template.

---

## 1. The honest diagnosis: why it currently reads "AI-designed"

These are the specific tells **on our site** (not generic advice). Each one is fixable.

| # | Tell | Where it shows |
|---|---|---|
| T1 | **The default-AI palette.** Blue `#3b82f6` primary on zinc-black `#09090b` is the out-of-the-box look of every AI tool. The category rainbow (blue/green/amber/purple/teal/rose) spreads color evenly instead of committing to a signature. | Everywhere |
| T2 | **The default-AI fonts.** Inter body + geometric sans display (Outfit) is the single most common AI font pairing. | Everywhere |
| T3 | **Badge overload.** Cards carry 2–5 uppercase pills at once (status + category + NEW + Free + countdown). Uppercase letter-spaced microlabels on nearly every element. | Directory, homepage cards, modals |
| T4 | **Card-grid sameness.** Almost every surface is the same rounded-xl bordered card with a hover-lift, in a uniform 3-column grid. No asymmetry, no rhythm change, nothing breaks the grid. | Homepage, directory, industry, news |
| T5 | **Icon-everywhere.** A 12px icon in front of nearly every label, badge, and meta row. | All cards/modals |
| T6 | **Gradient/glow tells.** Shimmer placements, glow shadows, gradient CTAs, gradient mastheads. | Sponsored cards, partners, modals |
| T7 | **Emoji as UI.** 🌍 🌐 📍 in geo pills. | Cards, modals |
| T8 | **Outlined-boxes-on-black.** The "1px border on dark surface" treatment is the whole spatial language — depth comes only from borders, never from layout, scale, or photography. | Everywhere |

## 2. What is already ours — keep and amplify

The remediation surfaced genuinely distinctive equity. The plan builds **from** these, not over them:

- The **editorial anatomy**: section rule + uppercase rubric + big headline + live count. This is a real editorial idea — it just needs better type to carry it.
- **Mono datelines** and deadline-driven copy — the "trade paper" conceit.
- The **cinematic photographic backdrop** and film-grain texture.
- The names: *The Call Sheet*, *Tech-Pulse*, *New This Week* — the site already wants to be a **film-industry trade journal**. The design should commit to that.

## 3. The direction (decision required)

**Recommended: adopt and finish the existing in-repo concept** (`fra-redesign-concept.html`) — it was explored for exactly this reason and is the strongest antidote to T1/T2:

- Warm brown-black base (`#0b0907`) and warm ink (`#f6efe6`) instead of cool zinc — the room feels like a screening room, not a dashboard.
- **Ochre `#e8b057`** as the single signature accent (replacing blue), with ember/moss/indigo used sparingly and semantically.
- **Fraunces** (a characterful serif) for display type over a refined sans body — instantly kills the AI-font tell and matches the editorial identity.
- Warm-tinted hairlines, 56px rule stubs, and a designed **light theme variant** already sketched.

One sentence to align everyone: **"A contemporary African film trade paper — warm, typographic, photographic — not a tech dashboard."**

*(Alternative directions, if the concept is rejected: brutalist/typographic poster style; or photographic-first magazine. Either still follows the same plan below — only Phase B's token values change.)*

## 4. The plan

The remediation built the machinery that makes this cheap: one token sheet (`@theme`), one category-color file (`colorways.ts`), shared primitives (`Button/Badge/Card/Modal/Input/FilterChip`), and the PRS/tech-pulse silos already aliased to the tokens. **A reskin is now a token-and-primitives edit, not a 50-page rebuild.**

### Phase A — Simplify by subtraction (no rebrand yet, lowest risk)
Remove the tells that are about *excess*, independent of any palette decision:
1. **Badge budget: max 2 pills per card.** Status keeps a pill; category becomes a small colored text label (no box); NEW becomes a dot; Free moves into the meta line. (One change in `Badge`/card templates.)
2. **Icon diet.** Icons only where they do work (status, actions). Labels stand on typography.
3. **Kill the glow/gradient tells**: sponsored shimmer → flat tint; glow shadows → none; gradient CTAs → solid.
4. **Emoji → typography**: geo pills use the country name / small flag asset, not emoji glyphs.
5. **Whitespace pass**: fewer boxes — let some sections sit directly on the page (rule + headline + list), reserving cards for true card content.

*Exit test: a screenshot of the directory shows ≤2 pills per card and at least one section that is not a bordered box.*

### Phase B — The character swap (tokens + type)
1. Load **Fraunces** via `next/font`, map to `--font-heading`; body stays a quiet sans.
2. Swap `@theme` values to the warm set (bg/surfaces/ink/lines/ochre/ember/moss/indigo) — flows through every primitive, the PRS funnel, and tech-pulse automatically.
3. Collapse the category rainbow in `colorways.ts` to **ochre + 3 supporting hues** used semantically (urgent=ember, open=moss, special=indigo), neutrals elsewhere.
4. Re-shoot the cinematic backdrop treatment for the warm scrim.
5. One reviewed screenshot pass across the 14-page checklist (same gate as the remediation).

*Exit test: no blue anywhere; serif display on every headline; palette is one signature + accents, not a rainbow.*

### Phase C — Editorial layout moments (the "designed by a person" proof)
Generic AI design is uniform; human design has opinionated moments. Add three:
1. **Front-page masthead**: homepage top reworked as a trade-paper front page — oversized serif headline, dateline, lead story with photo, ruled column of "closing soon" entries (a list, not cards).
2. **Asymmetric featured rows**: directory/news lead item spans wide with photography; the rest follow in a denser ruled list. Break the 3-col card monotony.
3. **Tabular deadlines**: where the data is a table (deadlines, call sheet), design it as a beautiful ruled table with mono figures — trade-paper, not card grid.

### Phase D — Craft details + guardrail
1. Texture and print details: hairline double-rules, folio-style footers, the existing drop-cap extended deliberately, restrained motion (one staged page-load reveal beats scattered hovers).
2. **The AI-tell scorecard becomes a standing review gate**: T1–T8 checked on every new surface before merge. This is how the site *stays* designed.

### Sequencing & risk
- A is shippable alone and improves the current look immediately.
- B is one deliberate, fully reversible commit (token values + one font module) thanks to the foundation.
- C is the only real design labor — do it per-surface (homepage first), each independently shippable.
- The **members area follow-up should be built directly in the new direction** (don't reskin it twice).

## 5. How we'll know it worked

- **Scorecard**: T1–T8 all cleared on the public site.
- **The squint test**: side-by-side homepage screenshots, before/after — the after should be identifiable as FRA with the logo covered.
- **The provenance test**: show the site to 3–5 industry people and ask "does this feel like a film publication or a tech product?" — we want the former.

---

*Inputs: `fra-redesign-concept.html` (direction), `fra-x-afx-spec.docx` + `Design_*.md` briefs (members surfaces), `docs/ui-design-issues-2026-06-11.md` (foundation now in place).*
