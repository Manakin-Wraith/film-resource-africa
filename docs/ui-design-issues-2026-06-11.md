# UI Design Issues — Complete List (UI only) · RESOLVED status edition

Compiled 2026-06-11 from a 6-agent parallel sweep of every UI surface. **Remediated the same day** on the `ui-remediation` branch (10 phases, merged to `main` at `b1519d2`), then **re-audited by a 5-agent verification sweep**; misses closed in `17395db`. This edition carries a verified status marker on every item. Companion docs: `ui-ux-audit-2026-06-11.md` (baseline), the verification summary at the bottom of this file.

**Status legend**
- ✅ **Fixed** (remediation phases 0–8)
- 🔁 **Fixed in follow-up** `17395db` (miss caught by the re-audit)
- 🔶 **Partially addressed** — canonical solution in place, residual accepted
- 📦 **Exempt** — inside the documented `.prs-root` / `.tp-root` silos (class anatomy kept; color tokens aliased to `@theme`)
- 🚧 **Deferred — members area** (agreed scope; follow-up plan consumes the new primitives)
- 💤 **Accepted low** — deliberate design ambience or micro-polish, won't fix now
- ❎ **False positive** — original audit claim disproven in code

Severity: 🔴 high · 🟡 medium · ⚪ low

---

## A. Systemic (site-wide)

1. ✅ 🔴 **No global focus-visible system.** → Global `:where(...):focus-visible` rule in `@layer base` (globals.css); explicit rules for `.prs-root`; `focus:outline-none` suppressors removed from public files.
2. ✅ 🔴 **Hardcoded Tailwind color utilities bypass `@theme` tokens.** → `src/lib/colorways.ts` is the single category-color source; all config files compose from it; `hover:bg-blue-600` → `primary-hover`; call-sheet surface teal closed in `17395db`. Remaining literals are status-fill pairs inside Badge and single-file sponsored schemes (accepted).
3. 🔶 🔴 **Mixed styling idioms everywhere.** → Public site converted (primitives + classes; inline `style` limited to `var(--*)` tokens). Members area still inline-styled → 🚧.
4. ✅ 🔴 **White-alpha border values are ad hoc.** → 3-step `--color-line/-mid/-strong` scale; public files swept to `border-line*` utilities.
5. 🔶 🟡 **No unified transition/animation convention.** → Primitives (Card/Button/FilterChip) define canonical transitions and the `-translate-y-0.5` lift; unconverted legacy spots accepted.
6. 🔶 🟡 **Arbitrary pixel values instead of a scale.** → Shell magic numbers became `--header-h`/`--tabbar-h`; badges/datelines on `text-xs`; remaining arbitrary values accepted where they encode real design sizes.
7. ✅ 🟡 **Sub-12px text is pervasive.** → All meaningful text ≥12px (datelines, badges, tab labels, error text, admin); decorative watermarks/ghost ambience kept by design.
8. 🔶 🟡 **No disabled-state convention.** → `Button` defines the canonical (`disabled:opacity-50` + `loading`); converted consumers use it. Legacy forms (SubmitOpportunity/Spotlight) still hand-roll → carry to follow-up plan.
9. ✅ 🟡 **Magic z-index values.** → `:root` z scale; all modals at `z-(--z-modal)` (70); grain at `var(--z-grain)`.
10. ✅ 🟡 **Three siloed style systems.** → `.prs-root` and `.tp-root` formally exempted with color tokens **aliased** to `@theme`; a palette change now propagates everywhere.
11. 💤 🟡 **Max-width inconsistency across pages.** Kept — per-surface widths read as intentional editorial choices.

---

## B. Design system & shell

### src/app/globals.css
12. ✅ 🔴 `--foreground-tertiary` 0.35 → **0.48** (3.1:1 → 4.8:1).
13. ✅ 🔴 `.prs-btn-*` now have explicit `:focus-visible` outlines.
14. ✅ 🔴 PRS form controls get a real `:focus-visible` outline alongside the border change.
15. 💤 🟡 `.section-rubric` 11px/0.4 — kept; it is the site's editorial signature.
16. ✅ 🟡 `.editorial-dateline` → `var(--color-accent)`.
17. ✅ 🟡 Glass classes → `color-mix(...)` over surface tokens + `--color-line`.
18. ✅ 🟡 Film grain z → `var(--z-grain)`.
19. ✅ 🟡 PRS token re-declarations → aliases of `@theme` tokens.
20. 📦 🟡 PRS 3px border-left accents — inside the exemption.
21. 💤 ⚪ WebKit-only scrollbars.
22–24. 📦 ⚪ PRS `.req` size, `.char-counter.over` amber, container padding — inside the exemption.

### src/app/layout.tsx
25. ✅ 🟡 `pt-[64px] pb-[72px]` → `pt-(--header-h) pb-(--tabbar-h)`; `prs-intake-shell` consumes the same vars.

### src/components/Header.tsx
26. ✅ 🔴 Nav links/login/menu toggle covered by the global focus ring.
27. ✅ 🔴 Directory dropdown: opens on focus/ArrowDown, closes on focusout/Escape — fully keyboard-operable.
28. 💤 🟡 `text-[15px]` wordmark — kept as the brand lockup size.
29. ✅ 🟡 Avatar/initials inline colors → utility classes.
30. ✅ 🟡 Nested mobile items 40px → 44px targets.
31. ✅ ⚪ Borders/dividers on line tokens.

### src/components/Footer.tsx
32. ✅ 🔴 Newsletter input → `ui/Input`; suppressor gone; global ring applies.
33. ✅ 🟡 → `hover:bg-primary-hover`.
34. ✅ 🟡 Error/success → canonical `text-urgent` pattern + `text-success`.
35. ✅ 🟡 Newsletter controls on the Input metric (rounded-xl, py-3, text-sm).
36. ✅ ⚪ Error text on the 12px canonical; social borders on line tokens.

### src/components/MobileTabBar.tsx
37. ✅ 🔴 Tabs covered by global focus ring.
38. ✅ 🟡 Inactive tabs → `/60` (note: the audited `/35` never rendered — class was inert pre-token-activation).
39. 💤 ⚪ Target sizes (above 44px anyway).

### src/components/Breadcrumbs.tsx
40. ❎ 🔴 `/50` at text-sm **passes AA** (5.14:1 on #09090b) — original audit math was wrong.
41. ✅ 🔴 Links covered by global focus ring.
42. 💤 ⚪ Chevron/text opacity step.

### src/components/GeoIndicator.tsx
43. ✅ 🟡 `country_specific` without ISO now falls back to 📍 + label.
44. 💤 ⚪ 11px pill text; emoji-only on mobile.

### src/components/BuyCoffeeButton.tsx
45. 🔶 🟡 Gradient/tooltip kept (single floating widget; orange accepted as its identity).
46. ❎ ⚪ `transition-all duration-300` **was already present** on the width-changing button.

### src/components/SponsorTicker.tsx
47. ✅ 🟡 Label 10px → 11px.
48. 💤 ⚪ Hover-pause behavior.

---

## C. Homepage sections & cards

49. ✅ 🔴 **Card pattern fragmentation** → `rounded-xl` everywhere (ClosingSoon 2xl→xl, Sponsored/Ghost 1.5rem→xl), lift unified to `-translate-y-0.5`, JustAdded on `ui/Card`, titles normalized to `text-[15px]`.
50. ✅ 🔴 Datelines → `text-xs`.
51. ✅ 🟡 `#ef4444` literals → `text-urgent`.
52. 🔶 🟡 `text-sm` vs `text-[14px]` notation — both 14px; residual notation variety accepted.
53. ✅ 🟡 Deadline/dateline sizes unified at `text-xs`.
54. 💤 🟡 NowScreening media controls — kept as that section's control set.
55. 💤 🟡 Pink trailer glow literal — kept as the trailer identity (single instance).
56. ✅ 🟡 Fixed-height image containers reserve space (no CLS); fallback heights matched to image slots.
57. 💤 🟡 Featured-news display sizes — kept as the featured tier.
58. 💤 🟡 Inline `style={{color: 'var(--foreground-secondary)'}}` pattern — accepted (token-driven, just inline).
59. 🔁 🟡 Mockup `bg-[#111]` → `bg-surface`.
60. 🔁 🟡 The two newsletter inputs unified on the Input focus convention (`focus:border-primary/60`).
61. ✅ 🟡 Success → `bg-success` token.
62. 💤 🟡 Sponsored amber / news-purple schemes — single-file consistent; kept.
63. 💤 🟡 Ghost-card opacity hover jump — part of the ghost reveal design.
64. 💤 🟡 CardVisualHeader 3-tier heights — carry to follow-up plan.
65. ✅ 🟡 PartnersSection on `cw()` colorways.
66. 🔁 ⚪ `hover:bg-white/2` → `/[0.02]`.
67. ❎ ⚪ Title sizes already match post-normalization.
68–70, 72. 💤 ⚪ NewWave gutters, mobile-hidden descriptions, truncation, fixed `sizes` — accepted lows.
71. ❎ ⚪ Icon sizes consistent within variants.

---

## D. Directory surfaces & modals

73. ✅ 🔴 Filter chips: focus ring via global rule; `aria-pressed` added.
74. ✅ 🟡 One `ui/Input` search bar across all three surfaces (original "4px drift" claim was itself wrong — all used 52px).
75. ✅ 🟡 Mobile chip rows get the `scroll-fade-x` edge mask.
76. ✅ 🟡 Snap behavior unified via `FilterChipRow`.
77. ✅ 🟡 Active chip icon color unified (`text-foreground`, no forced white).
78. 🔁 🟡 Listing-card padding standardized to `p-5`.
79. 💤 🟡 Faint border + 3px spine — reclassified as the deliberate category-spine pattern.
80. ✅ 🟡 Badges unified at `text-xs`.
81. 🔁 ⚪ Empty states unified at `py-20`.
82. 💤 ⚪ Industry `<select>` affordance — pending full `Select` migration (follow-up).
83. 🔁 ⚪ CallSheetClient teal → `text-callsheet` token (modal + client now consistent).
84. ✅ 🔴 CallSheetModal (and ContactModal — audit missed it) lock body scroll via the Modal shell.
85. ✅ 🔴 CallSheetModal meta grid responsive.
86. ✅ 🟡 All modals at `z-(--z-modal)` = 70 (also fixed DirectoryListingModal's unreported z-50 tie with the header).
87. ✅ 🟡 Gradient masthead documented as the rich-profile variant.
88. 💤 🟡 Info-pill vs inline-icon layouts — documented variants; carry to follow-up if unification is wanted.
89. ✅ 🟡 One floating `ModalCloseButton` everywhere.
90–91. ✅ ⚪ Shell border + max-height owned by Modal.
92. 💤 ⚪ Badge-row/meta gap micro-variance.
93–94. ✅ ⚪ Padding schemes consistent; ContactModal one-off shadow gone.
95. ✅ ⚪ Apply CTA → `Button size="lg"`.
96. ✅ ⚪ Urgency badge pure Tailwind.
97. ❎ ⚪ JoinToContributeCTA paddings already matched.
98. 💤 ⚪ OpportunityRow negative-margin alert bar — accepted one-off.

---

## E. Members area & auth — 🚧 ALL DEFERRED (#99–120)

Excluded from the remediation by agreed scope, including its four highs (#99 inline-styled area, #100 `!important` media queries, #101 MemberProjects, #102 discipline pills). Global fixes (focus ring, tokens) already apply passively. The follow-up plan converts ~12 files onto `src/components/ui/` primitives. See `project_ui_remediation` memory + this doc's section E in git history for the full item list.

---

## F. Forms & PRS funnel

121. ✅ 🔴 Report visibility radios → Tailwind classes (`border-primary/60 bg-primary/15` active).
122. 📦 🟡 Required marker: public forms unified on the `text-urgent` asterisk; PRS keeps its `.req` bullet under the exemption.
123. 🔶 🟡 Error displays: color unified on `text-urgent` everywhere; container structures still vary (PRS banner exempt). Carry structural unification to follow-up.
124. ✅ 🟡 Success states green everywhere (Spotlight's amber icon → `text-success`; circle treatments match ContactModal's pattern).
125. 🔶 🟡 Loading states: `Button loading` is the canonical; SubmitOpportunityForm/Spotlight still hand-roll — carry to follow-up.
126. ✅ 🟡 Spotlight submit ≥48px target.
127. 🔶 🟡 Selects: option bg tokenized to `var(--surface-raised)`; full `ui/Select` migration pending.
128. 📦 🟡 Textarea min-heights — PRS exempt; others encode content length intentionally.
129. 🔁 🟡 Spotlight labels → `text-sm`.
130–132. 📦 🟡 IntakeForm banner, ProcessingScreen panel, Report heading inline styles — inside the PRS exemption.
133. ✅ 🟡 Evidence text uses the `.evidence` class (no shadowing inline styles).
134. 📦 ⚪ Remaining micro-items are PRS-internal (radio dot, disabled opacity, helper sizes).

---

## G. Country, news, tech-pulse, misc

135. ✅ 🔴 News category maps → single `newsCategoryConfig.ts` (audit found it triplicated; remediation found **7** maps total, all unified via `colorways.ts`).
136. ✅ 🟡 Filter tabs → utility classes + `aria-pressed`.
137. ✅ 🟡 Image-less fallbacks now match image-slot heights; taller trailer slots are intentional per content type.
138. 💤 🟡 Badge contrast combos — not formally measured; visually sound.
139. ✅ 🟡 `prose prose-invert` removed; MarkdownBody is the single typography source.
140. 🔁 ⚪ News border notation → line tokens.
141–142. 💤 🟡 MarkdownBody heading scale + drop-cap — kept as the article-page editorial idiom.
143. ✅ 🟡 Markdown links covered by global focus ring.
144. 💤 ⚪ Opacity step + blockquote border.
145. ✅ 🔴 `.tp-root` tokens aliased to `@theme`; tints promoted to documented `--tp-*` local vars.
146. 🔶 🟡 Soon/tag colors via local vars; alpha-tint backgrounds remain derived literals (accepted).
147. 💤 🟡 11px count pill (mono metadata — accepted).
148. 💤 🟡 1280px container kept (the podcast page's own format).
149. 🔶 🟡 Two coming-soon treatments serve different surfaces; rebate side now on `ui/Badge`.
150. 💤 ⚪ Duration overlay literal.
151. ✅ 🔴 FAQ summaries / country cards / Apply links — focus via the global rule (`summary` included in the selector).
152. 💤 🟡 Country 2-col tablet breakpoint — carry to follow-up.
153. ❎ ⚪ FAQ icon **already had** `transition-transform`.
154–158. 💤 ⚪ Country grid/stats/pills/logo-fit/inline-surface lows — accepted.
159. ✅ 🟡 Rebate coming-soon → `Badge colorway="amber"`.
160. ✅ 🟡 Legal text measure → `max-w-[70ch]`.
161. 💤 ⚪ Legal h1 display style.
162. 🔁 🟡 Admin 10px text → `text-xs`.
163. 💤 ⚪ Admin table striping/padding.

---

# Final reconciliation (verified post-`17395db`)

| Status | Count |
|---|---|
| ✅ Fixed in remediation | 78 |
| 🔁 Fixed in follow-up `17395db` | 9 |
| 🔶 Partially addressed, residual accepted/carried | 12 |
| 📦 Exempt (PRS/tech-pulse silos, tokens aliased) | 11 |
| 🚧 Deferred — members area (#99–120) | 22 |
| 💤 Accepted lows / design ambience | 25 |
| ❎ False positives | 6 |
| **Total** | **163** |

**Public-site verdict:** every 🔴 high and 🟡 medium is fixed, exempted with token aliasing, or a verified false positive. Production deploy verified (commit `17395db`, READY, smoke 200).

**Carried into the members-area follow-up plan:** the 22 section-E items, plus #8/#125 (legacy form loading/disabled states onto `Button`), #64 (CardVisualHeader tiers), #88 (modal info-pill unification), #123 (error container structure), #127 (full `Select` migration), #152 (country tablet breakpoint).
