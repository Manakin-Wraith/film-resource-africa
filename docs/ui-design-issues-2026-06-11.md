# UI Design Issues — Complete List (UI only)

Date: 2026-06-11. Compiled from a 6-agent parallel sweep of every UI surface (design system/shell, homepage, directory+modals, members area, forms/PRS, country/news/misc pages). UI/visual issues only — no UX-flow, backend, or performance findings. Companion to `ui-ux-audit-2026-06-11.md` (the high-level baseline).

Note: agents initially flagged `bg-linear-to-*` utilities as invalid CSS; this is **Tailwind v4 syntax and correct** — excluded as false positives.

Severity: 🔴 high · 🟡 medium · ⚪ low

---

## A. Systemic (site-wide)

1. 🔴 **No global focus-visible system.** Virtually no interactive element defines `:focus-visible` — header nav links, breadcrumbs, footer newsletter input (which sets `focus:outline-none`), mobile tab bar, directory filter chips, FAQ `<summary>`, country cards, markdown links, modal close buttons, member-area buttons. Keyboard users get no visible focus anywhere. (WCAG 2.4.7)
2. 🔴 **Hardcoded Tailwind color utilities bypass `@theme` tokens.** Semantic colors (primary blue, amber, urgent red, success green, teal) exist as CSS variables but are hardcoded as `text-amber-400`, `bg-red-500/20`, `text-teal-400`, etc. in 100+ places, including all three category config files (`directoryConfig.ts:29-33`, `industryDirectoryConfig.ts:18-20`, `callSheetConfig.ts:17-22`). A palette change requires a full sweep, not a token edit.
3. 🔴 **Mixed styling idioms everywhere.** Three coexisting approaches — Tailwind classes, inline `style={{...}}` objects, and arbitrary values (`text-[34px]`, `rounded-[1.5rem]`) — often within one component. Members area is ~50%+ inline-styled; PRS/Report and news tabs mix all three.
4. 🔴 **White-alpha border values are ad hoc.** `white/[0.08]`, `white/8`, `white/10`, `white/[0.1]`, `white/[0.12]`, `white/15`, `white/[0.16]`, `white/[0.2]` all used for "border" with no scale; `--border` token exists but is rarely referenced.
5. 🟡 **No unified transition/animation convention.** `transition: background 0.2s` (CSS), `transition-colors`, `transition-all duration-300` used interchangeably for the same patterns; hover-lift distance varies (`-translate-y-0.5` vs `-translate-y-1`).
6. 🟡 **Arbitrary pixel values instead of a type/spacing scale.** `text-[10px]`, `text-[11px]`, `text-[13px]`, `text-[15px]`, `min-w-[60px]`, `min-h-[52px]`, `pt-[64px]`, `pb-[72px]` etc. throughout, with no documented scale.
7. 🟡 **Sub-12px text is pervasive.** 10–11px text used for datelines, badges, pills, counters, error text, tags across nearly every surface (individual instances listed per file below).
8. 🟡 **No disabled-state convention.** Four different disabled-button treatments across forms (CSS `opacity:0.5`, inline `opacity:0.4`, Tailwind `opacity-70`, text-swap only).
9. 🟡 **Magic z-index values with no scale.** `z-10` (layout), `z-50` (nav), `z-[60]` (OpportunityModal), `z-[100]` (CallSheetModal), `z-index: 999` (film grain), inline `zIndex: 20` (sticky save bar).
10. 🟡 **Three siloed style systems.** Global tokens, `.prs-root` (394-line namespace re-declaring `--primary`, `--amber`, `--green`), and `tech-pulse.css` (`.tp-root` re-declaring `--primary`, `--accent`, its own surface color) drift independently.
11. 🟡 **Max-width inconsistency across pages.** News uses `max-w-5xl` (1024px), tech-pulse container is 1280px, other surfaces vary — no standard page width.

---

## B. Design system & shell

### src/app/globals.css
12. 🔴 `--foreground-tertiary: rgba(250,250,250,0.35)` — 35%-alpha text on `#09090b` is below WCAG AA 4.5:1 for the small sizes it's used at.
13. 🔴 `.prs-btn-primary` / `.prs-btn-ghost` (~lines 207-211) — no `:focus`/`:focus-visible` styles at all.
14. 🔴 `.prs-root .form-input:focus` (~line 226) — focus indicated only by faint border-color `rgba(59,130,246,0.55)`; no outline/ring fallback.
15. 🟡 `.section-rubric` 11px + `opacity: 0.4` — tiny AND low-contrast; the core editorial label of the whole site.
16. 🟡 `.editorial-dateline` hardcodes `color: #f59e0b` instead of the accent token; 13px vs rubric's 11px with no documented hierarchy.
17. 🟡 `.glass-card` / `.glass-panel` use hardcoded `rgba(25,25,25,0.6)` / `rgba(17,17,19,0.92)` rather than surface tokens.
18. 🟡 `.film-grain::before { z-index: 999 }` — magic value outside any z scale.
19. 🟡 PRS namespace re-declares site tokens (`--primary`, `--amber`, `--green` ~lines 171-182) — duplicate sources of truth.
20. 🟡 PRS accent cards use hardcoded 3px `border-left` colors in several variants (~lines 203, 238, 307, 316-318) with no border-width token.
21. ⚪ Scrollbar styling is WebKit-only; no `scrollbar-color` fallback for Firefox.
22. ⚪ `.prs-root .form-label .req` hardcoded `font-size: 10px`.
23. ⚪ `.char-counter.over` uses `--amber` for an over-limit (error) state instead of the urgent/red token.
24. ⚪ `.prs-container` hardcoded `padding: 0 20px`; spinner hardcoded `border: 2px`.

### src/app/layout.tsx
25. 🟡 `pt-[64px] pb-[72px]` magic numbers mirror header/tab-bar heights with no shared variable — change one, the other silently breaks.

### src/components/Header.tsx
26. 🔴 Desktop nav links, login button (line ~163), and mobile menu toggle (~174) have hover-only states — no focus-visible.
27. 🔴 Directory dropdown (~298-323) is hover-open with no keyboard/focus-within affordance.
28. 🟡 `text-[15px]` arbitrary heading size off the type scale (line ~98).
29. 🟡 Inline-styled avatar (`border: '1px solid rgba(255,255,255,0.16)'`, ~142) and initials chip (three hardcoded inline colors, ~145) duplicate token values.
30. 🟡 Mobile menu touch targets inconsistent: top-level `min-h-[44px]` vs nested directory children `min-h-[40px]` (~187 vs ~206).
31. ⚪ `style={{ background: 'var(--surface)' }}` inline instead of a class (~92); divider `bg-white/[0.08]` not the `--border` token (~309).

### src/components/Footer.tsx
32. 🔴 Newsletter input: `focus:outline-none` with only `focus:border-primary/50` replacement — near-invisible keyboard focus (~101).
33. 🟡 `bg-primary hover:bg-blue-600` — hover color hardcoded outside token system (~71).
34. 🟡 Error uses `text-red-400` Tailwind class while success uses `style={{ color: 'var(--color-success)' }}` — two idioms for sibling states (~118-119).
35. 🟡 Newsletter input/button sizing and radius (`py-3`, `rounded-lg`) match neither PRS form controls (14px/16px padding, 12px radius) nor other site forms.
36. ⚪ Error text is `text-[11px]`; social icon borders `border-white/[0.1]` off-scale.

### src/components/MobileTabBar.tsx
37. 🔴 Tab links have no focus-visible state; only `active:` pseudo-class feedback (~64-86).
38. 🟡 Inactive tabs `text-foreground/35` — low contrast for primary mobile navigation (~70).
39. ⚪ `min-w-[60px] min-h-[52px]` arbitrary (though above 44px minimum).

### src/components/Breadcrumbs.tsx
40. 🔴 `text-foreground/50` at `text-sm` — breadcrumb text well below AA contrast (~14).
41. 🔴 Breadcrumb links hover-only, no focus-visible (~26-32).
42. ⚪ Chevron at `/30` vs text at `/50` — undocumented hierarchy.

### src/components/GeoIndicator.tsx
43. 🟡 `country_specific` config has empty emoji — indicator can render with no visual at all (~34).
44. ⚪ `text-[11px]` pill text; label hidden on mobile leaving emoji-only meaning (~71-75).

### src/components/BuyCoffeeButton.tsx
45. 🟡 Tooltip glass style (`bg-white/10 border-white/15`) doesn't match `.glass-panel`; gradient `from-amber-500 to-orange-500` introduces orange — a color in no token set (~14, ~44).
46. ⚪ Width changes on hover (`px-3.5` → `px-5 pr-6`) without a transition — jumpy (~45).

### src/components/SponsorTicker.tsx
47. 🟡 Section label `text-[10px]` — smallest text on the site (~44).
48. ⚪ `[animation-play-state:paused]` hover-pause has patchy browser behavior; edge-fade gradients depend on `--background` staying fixed.

---

## C. Homepage sections & cards

49. 🔴 **Card pattern fragmentation across sections.** Same "opportunity card" concept renders with: `rounded-xl` (JustAdded) vs `rounded-2xl` (ClosingSoon) vs `rounded-[1.5rem]` (SponsoredCard/GhostCard); widths `min-w-[268px] max-w-[300px]` (OpenNow) vs `min-w-[320px]`/`[360px]` elsewhere; title sizes `text-[15px]` / `text-[14px]` / `text-[28px]`; hover lift `-translate-y-0.5` vs `-translate-y-1 hover:shadow-lg` (PartnersSection ~89).
50. 🔴 Datelines/labels at `text-[11px]` in JustAddedSection (~32) and NewsSection secondary cards (~78) — sub-12px recurring.
51. 🟡 Hardcoded `#ef4444` urgent red in JustAddedSection (~35) and ClosingSoonSection (~81) instead of `--color-urgent`.
52. 🟡 Section subtitle sizing mixes `text-sm` shorthand (NowScreening ~38) with `text-[14px]` arbitrary values elsewhere — same size, two notations, drifts easily.
53. 🟡 ClosingSoon deadline text `text-[12px]` vs JustAdded dateline `text-[11px]` — same semantic, different sizes (~50).
54. 🟡 NowScreening control buttons `rounded-xl bg-white/5 border-white/10` don't match site button/badge patterns (~44, 51).
55. 🟡 NowScreening trailer cards: `aspect-video` without width constraint — CLS risk (~88); pink glow shadow hardcodes `rgba(236,72,153,0.3)` — pink exists in no token set (~98).
56. 🟡 NewsSection featured image (~41) and cards lack explicit aspect-ratio reservation — layout shift on load.
57. 🟡 Featured news title `text-[20px] md:text-[26px]` — off-scale sizes unique to this card (~50).
58. 🟡 `style={{ color: 'var(--foreground-secondary)' }}` inline in page.tsx (~63), NewsSection (~53), NewsletterShowcase (~82-84), NewsletterCTA (~101) — repeated inline override pattern.
59. 🟡 NewsletterShowcase email mockup hardcodes `bg-[#111]` (~120) — not a surface token.
60. 🟡 **Focus treatment differs between the two newsletter forms:** NewsletterCTA `focus:ring-2 focus:ring-primary/50` vs NewsletterShowcase `focus:border-primary/50` only (~247 vs ~61).
61. 🟡 NewsletterCTA success state `bg-green-500` hardcoded vs `bg-success` token used in Footer (~69).
62. 🟡 SponsoredCard ecosystem uses its own visual language: amber borders (`border-amber-500/20`), amber titles (`text-amber-400/80`), while news-sponsored variant switches to **purple** (`border-purple-500/20`, ~230) — two sponsored color schemes, neither tokenized.
63. 🟡 SponsoredCard `opacity-60 hover:opacity-100` — large abrupt opacity jump (~184).
64. 🟡 CardVisualHeader heights inconsistent: `h-36` OG image vs `h-20` logo fallback vs featured-card `!h-56` override — three tiers, no system (~40, 82, 110).
65. 🟡 PartnersSection per-category colors hardcoded (blue-500/green-500/...) — fourth independent category-color map in the codebase (~47-54).
66. ⚪ NewsSection `hover:bg-white/2` — ambiguous non-bracket opacity notation (~67).
67. ⚪ OpenNow card title `text-[14px]` vs JustAdded `text-[15px]` for the same element (~36).
68. ⚪ NewWave rows use `-mx-4 px-4` negative-margin trick unlike grid sections — different gutter behavior (~17).
69. ⚪ PartnersSection descriptions `hidden md:block` — content silently dropped on mobile (~95).
70. ⚪ BrowseByCountry long names `truncate` with no title/tooltip fallback (~49).
71. ⚪ GhostCard icon `size={24}` differs from news variant icon sizing (~150).
72. ⚪ CardVisualHeader `sizes="360px"` fixed — not responsive to container (~45).

---

## D. Directory surfaces & modals

### Cross-surface (DirectoryClient vs IndustryDirectoryClient vs CallSheetClient)
73. 🔴 Filter chips on all three surfaces have no focus-visible state — keyboard users can't see chip focus.
74. 🟡 **Search input left padding differs:** Directory & Industry use inline `paddingLeft: '3.25rem'` (52px) — Industry's silently overriding its own `pl-12` class — while CallSheet uses `pl-12` (48px). Identical control, 4px drift, mixed idioms (DirectoryClient ~116, IndustryDirectoryClient ~62-68, CallSheetClient ~53).
75. 🟡 Filter chip rows scroll horizontally on mobile with no scroll affordance (fade/indicator) (DirectoryClient ~133).
76. 🟡 Chip scroll-snap implemented differently (snap-start placement differs) between Directory and Industry — different scroll feel on parallel surfaces (~133 vs ~82/100).
77. 🟡 Active chip color logic differs: CallSheet forces `text-white` when active; Directory keeps category color (CallSheetClient ~86).
78. 🟡 Card padding differs: Directory `p-6` vs Industry `p-5` for the same listing card (~205 vs ~173).
79. 🟡 Faint `border-white/[0.08]` card border + bold 3px colored `border-l` — asymmetric border weight, repeated on cards and modal panels (DirectoryClient ~205, DirectoryListingModal ~173, CallSheetClient ~132).
80. 🟡 Badge sizes differ for same semantic: Directory badges `text-xs` (12px) vs OpportunityRow badges `text-[10px]` (~101).
81. ⚪ Empty-state vertical padding differs: `py-24` (Directory) vs `py-20` (Industry, CallSheet).
82. ⚪ Industry `<select>` dropdowns styled flatter than chips (no border/hover affordance) — look non-interactive (~129-151).
83. ⚪ CallSheet teal accents (`text-teal-400`, `teal-300`) hardcoded in 4+ places (~156, 159, 183, 189) — surface theme not tokenized.

### Modals (Opportunity / DirectoryListing / CallSheet / Contact)
84. 🔴 **CallSheetModal does not lock body scroll** — page scrolls behind the open modal; the other modals lock correctly (~30-40 area).
85. 🔴 CallSheetModal meta grid is fixed `grid-cols-2` with no mobile collapse — cramped on small screens; OpportunityModal/DirectoryListingModal are responsive `grid-cols-1 sm:grid-cols-2` (~78-126).
86. 🟡 z-index split: CallSheetModal `z-[100]` vs OpportunityModal `z-[60]` — no modal layer convention (~30).
87. 🟡 Header treatment differs: DirectoryListingModal has a `from-primary/10` gradient masthead; the others are plain border-bottom (~113).
88. 🟡 Info/meta layout pattern differs: DirectoryListingModal uses icon-in-box pills (~174-179); OpportunityModal inlines icons — same semantic, two designs.
89. 🟡 Close buttons inconsistent: floating large buttons (Opportunity/DirectoryListing) vs small static button (CallSheetModal ~163).
90. ⚪ Border opacity differs between modal shells: `white/[0.08]` vs `white/[0.12]`.
91. ⚪ Max-height differs: `max-h-[85vh]` (CallSheet) vs `max-h-[90vh]` (Opportunity).
92. ⚪ Badge-row gaps differ (`gap-2` vs `gap-1.5`); meta grid gaps differ (`gap-4` vs `gap-3`).
93. ⚪ OpportunityModal asymmetric padding `p-6 md:p-10 pb-5 md:pb-6` (shared by DirectoryListingModal) — top/bottom ratio lopsided.
94. ⚪ ContactModal one-off `shadow-xl shadow-primary/20` CTA shadow; padding scheme (`p-8 md:p-10`) differs from other modals (~57, ~129).
95. ⚪ Apply CTA sizing one-off: `min-h-[48px]`, `px-8 py-3.5` vs site `px-6 py-3` / `px-7 py-3.5` (~337, 346).
96. ⚪ Urgency badge mixes Tailwind classes with inline color styles (~241).
97. ⚪ JoinToContributeCTA primary/secondary buttons have unmatched padding (~32-34).
98. ⚪ OpportunityRow full-bleed alert bar via negative margins (`-mx-6 -mt-6`) — fragile one-off (~89-96); no responsive title scaling in narrow cards (~128).

---

## E. Members area & auth

99. 🔴 **The entire members area is predominantly inline-styled** (`style={{...}}` for layout, color, type) — OnboardingClient, members DirectoryClient, both profile types, EditProfileClient, MemberProjects, ImageUpload, `/m/[username]`, members landing page. Diverges from the Tailwind-based public site and makes any reskin a rewrite.
100. 🔴 Members DirectoryClient responsive behavior implemented via inline `<style>` tag with `!important` media-query overrides (`.fra-row { grid-template-columns: 1fr 1fr !important }`) (~675-697).
101. 🔴 MemberProjects: EditForm and ProjectCardView are fully inline-styled with duplicated style objects (`linkBtn`, `inputStyle`, `labelStyle`), hardcoded `#3b82f6`/`#ef4444`, no hover/focus states on any button (~134-330).
102. 🔴 Discipline pills: opacity/border values hardcoded and inconsistent — directory cards `0.07` bg vs profile pages `0.10`; radius `6px` inline; no hover/focus (~153-168 directory, ~200-217 IndividualProfile).
103. 🟡 Hover states implemented by mutating `e.currentTarget.style` in `onMouseEnter/Leave` (Load-more button ~642-650, search input focus ~533-555) — anti-pattern, untestable, no keyboard parity.
104. 🟡 Mobile FilterSheet and filter chips: no focus rings, no hover transitions; static `cursor: pointer` only (~298-354).
105. 🟡 Input metrics differ between sibling forms: Onboarding `padding: '12px 14px'` vs EditProfile `'11px 14px'` — visible height difference (~186-189).
106. 🟡 Onboarding: checkbox `accentColor: '#3b82f6'` hardcoded, no focus ring (~243-253); disabled submit at `rgba(59,130,246,0.3)` — too-subtle disabled cue, no hover/focus (~255-266); MOU box hardcoded `maxHeight: '360px'` inline (~237-240).
107. 🟡 "Already on file" prefill pill duplicated as inline-styled markup in OnboardingClient (~174-181) and ImageUpload (~127-138) — copy-pasted micro-component, `fontSize: '10px'`.
108. 🟡 Avatar/logo containers: hardcoded `width: 48, height: 48`, conditional inline `borderRadius: isBiz ? '10px' : '999px'`, conditional padding logic inline (directory ~81-102; IndividualProfile ~160-182; BusinessProfile ~111-131).
109. 🟡 Tier/availability badges all inline with hardcoded opacities (0.1/0.25), no hover states (~114-128).
110. 🟡 Profile sidebar CTAs and Save/Share buttons have no hover/focus feedback on either profile type (IndividualProfile ~327-359, BusinessProfile ~278-287).
111. 🟡 Bio uses CSS `columnCount: 2` with inline `columnGap: '32px'` — not responsive-friendly (~260-265).
112. 🟡 BusinessProfile stat strip: inline `gridTemplateColumns: 'repeat(4, 1fr)'`, all borders/spacing inline (~198-219).
113. 🟡 Hero heading clamps differ across member surfaces: `/m/[username]` `clamp(32px, 5vw, 48px)` vs onboarding `clamp(28px, 5vw, 42px)` vs members page inline `fontSize: '56px'`/`'28px'` (not even clamped) — three different display scales for the same tier of heading.
114. 🟡 `/m/[username]` founding badge, breadcrumb, hero, discipline badges, CTA section: all inline-styled with hardcoded ambers (`rgba(245,158,11,…)`, `#f59e0b`) duplicating what Tailwind classes express elsewhere (~117-377).
115. 🟡 Members landing: founding counter progress bar hardcodes a repeating-linear-gradient amber stripe (~31-55); Business tier card inline amber gradient (~135-192); FAQ accordion `<summary>` has no focus-visible and inline `#f59e0b` plus icon (~237-268).
116. 🟡 Directory tease lock overlay: inline `filter: blur(3px)`, `rgba(9,9,11,0.72)` backdrop; lock icon `text-primary/60` on dark scrim — low contrast (~363-401).
117. 🟡 Login page: error box hardcodes `rgba(239,68,68,…)` inline rather than the red utility/token used elsewhere (~97-105); submit button lacks focus-visible (~107-120).
118. 🟡 ImageUpload: shape logic via nested ternaries inside `style` (`borderRadius: shape === 'circle' ? '999px' : …`), drag-over border via template string, upload button inline-styled with no focus ring, error text `fontSize: '11px'` hardcoded `#fca5a5` (~103-191).
119. 🟡 Submit page tier-restriction card mixes `style={{ background: 'var(--surface)' }}` with Tailwind classes (~32-48).
120. ⚪ Founding star inline-positioned with hardcoded `#f59e0b` (~73-74); owner edit bars hardcode border `rgba(59,130,246,0.15)` / amber equivalents on both profile types; skeleton cards hardcode `rgba(255,255,255,0.07)`; sticky bar `zIndex: 20` inline; add-credit/remove buttons hardcoded `#93c5fd`/`#f87171` with no states; check-email status icon sizing ambiguity; pulse animation built from inline box-shadow with `${dotColor}80` alpha-suffix trick.

---

## F. Forms & PRS funnel

121. 🔴 Report.tsx visibility radio control: ~11 lines of inline styles per button (grid, conditional borders `rgba(59,130,246,0.6)`, backgrounds, transitions) — heaviest inline cluster in the funnel (~300-314).
122. 🟡 **Required-field indicator differs by form:** PRS uses a red bullet (●) via `.req`; Spotlight and SubmitOpportunity use a red asterisk `<span className="text-red-400">*</span>` — two affordances for one convention.
123. 🟡 **Error display has no unified pattern:** PRS `.stale-banner` (icon + flex), IntakeForm inline hardcoded banner (`#fca5a5`, `rgba(239,68,68,…)` ~284-286), Spotlight plain red div (~188), NewsletterCTA naked `<p className="text-red-400 text-xs">` (~81), Report inline `color: '#ef4444'` (~320).
124. 🟡 **Success states inconsistent:** Spotlight animates (framer-motion fade+scale) and colors its success icon **amber** instead of green (~82); SubmitOpportunityForm and NewsletterCTA snap instantly; success color is `bg-green-500` here, `bg-success` there.
125. 🟡 Submit-button loading states differ: PRS opacity-only, SubmitOpportunityForm `opacity-70` + no text change (~203-204), Spotlight text-swap, Footer nothing.
126. 🟡 Spotlight submit button `text-sm` with height under the 44-48px touch-target the PRS system mandates (`min-height: 48px`) (~143/199).
127. 🟡 Select styling diverges: PRS has a custom 12px arrow; SubmitOpportunityForm uses browser default and hardcodes option `background: '#18181b'` instead of a surface token (~121).
128. 🟡 Textarea min-heights: PRS 120px, SubmitOpportunity `min-h-[140px]`, Spotlight `min-h-[80px]`/`min-h-[160px]` — four values, no scale.
129. 🟡 Label typography: Spotlight labels `text-[13px]` while its inputs use `text-sm`; PRS labels CSS-weighted 600 — mixed scales and notations within and across forms (~17, ~108-110).
130. 🟡 IntakeForm re-assess banner inline-hardcodes blue `rgba(59,130,246,…)` instead of a panel class (~192-199).
131. 🟡 ProcessingScreen ambient panel/items: layout and display typography (`fontFamily: var(--font-display)`, sizes, gaps) all inline; `prs-panel` class then overridden inline (~88-96).
132. 🟡 Report "What's next" heading inline `fontSize: 22` — off the PRS heading scale (28/32px) (~276); next-steps panel one-off inline gradient + border (~269-272).
133. 🟡 Report evidence text styled inline, shadowing the existing `.working-bullet .evidence` CSS class — two competing definitions (~469-470).
134. ⚪ Radio dot hardcoded `background: 'white'` (~105); Back-button disabled inline `opacity: 0.4` vs class's `0.5` (~292); "~10 min" helper `fontSize: 12` inline (~221); pathway row inline italics/typography (~442-445); SubmitOpportunityForm success modal inline surface bg (~47); NewsletterCTA hero icon `left-4` vs `pl-11` optical misalignment (~61-62); helper text `text-[11px]` (Spotlight ~119) vs PRS 13px.

---

## G. Country guides, news, tech-pulse, misc pages

### News
135. 🔴 **Category color taxonomy duplicated and hardcoded twice:** identical 8-category color maps in `NewsPageClient.tsx` (~16-25) and `news/[slug]/page.tsx` (~17-26) — hardcoded Tailwind colors, not DRY, and unrelated to the directory/industry/call-sheet/partners category color maps (5 independent category-color systems site-wide).
136. 🟡 Filter tabs styled via conditional inline `style` objects (`background`/`color` vars) mixed with Tailwind (~73-78).
137. 🟡 Image heights differ by content type within the same grid — trailers `h-64 md:h-80` vs articles `h-52 md:h-72` — layout jumps when filtering (~109).
138. 🟡 Category badge combos like `text-blue-400` on `bg-blue-500/10` unverified for AA contrast (~131-134).
139. 🟡 Article page applies Tailwind `prose prose-invert` on top of custom MarkdownBody styles — two typography systems competing in one article (~170-175).
140. ⚪ Featured card `border-white/8` vs grid cards `border-white/[0.08]` — notation drift (~105); hero image hardcoded `h-56 md:h-[420px]` instead of aspect-ratio (~152-162).

### MarkdownBody
141. 🟡 Heading scale (`text-2xl`/`text-xl`) doesn't match page heading scales used elsewhere (~95-102).
142. 🟡 Drop-cap (`first-letter:text-5xl float-left`) is a one-off editorial idiom appearing nowhere else (also duplicated in tech-pulse.css ~110) (~104-115).
143. 🟡 Links `text-primary hover:text-primary/80` with no focus-visible (~138-147).
144. ⚪ First paragraph `text-foreground/90` vs body `/80` — undocumented opacity step (~111); blockquote `border-l-4 border-primary/40` hardcoded (~152).

### Tech-Pulse (tech-pulse.css + TechPulseClient)
145. 🔴 `.tp-root` re-declares `--primary`, `--accent`, adds its own `--surface-raised-2` — third independent token system (~8-19).
146. 🟡 "Soon" state hardcodes `rgba(245,158,11,.1)` / `#ffd17a` (~42-44); tags hardcode `rgba(59,130,246,.25)` / `#9cc0ff` (~133-134).
147. 🟡 `.count-pill` 11px text (~38); rubric size drifts from global rubric (~28).
148. 🟡 Container max-width 1280px vs news 1024px (~21).
149. 🟡 Off-air/coming-soon band (`.band-soon`, dashed border ~423-436) doesn't match the rebate-calculator coming-soon treatment — two coming-soon designs.
150. ⚪ Duration badge `rgba(0,0,0,.6)` overlay hardcoded (~88).

### Country pages
151. 🔴 CountryFAQ `<summary>`: hover-only, no focus-visible (~35-50). Same for country cards on `/film-opportunities` (~103-104) and Apply links in CountryOpportunities (~153-160).
152. 🟡 Country page 2-col layout has no md-breakpoint optimization — sidebar drops below at awkward tablet widths (~206).
153. ⚪ FAQ plus icon `group-open:rotate-45` with no transition — snaps instantly (~43).
154. ⚪ Opportunity grid `md:grid-cols-2` cramped on small tablets, no `lg:` step (~87).
155. ⚪ CountryStats single panel, no dividers between subsections — cramped (~10); nested borders `white/[0.08]` outside vs `white/10` inside.
156. ⚪ CountryHero stat pills wrap unevenly on mobile (~36-49).
157. ⚪ CountryDirectory logos `object-cover` in `w-10 h-10` crops logos — should be `object-contain` (~218-220).
158. ⚪ Inline `style={{ background: 'var(--surface)' }}` repeated on cards (CountryOpportunities ~96, community-spotlight page ~67-68).

### Coming-soon & legal pages
159. 🟡 Rebate-calculator "Coming Soon" badge (amber utility classes ~78-81) vs tech-pulse `.count-pill.soon` — same state, two designs.
160. 🟡 Privacy/terms: `prose-sm` with no max-width constraint on content — legal text lines exceed comfortable measure (~33).
161. ⚪ Privacy/terms h1 `text-4xl md:text-5xl font-extrabold` inconsistent with site display type (Outfit clamp system) (~26-27); list `space-y-1` too tight for dense legal text (~82-100); rebate feature list `p-4` off the card-padding rhythm (~97-99).

### Admin
162. 🟡 Logo preview `w-16 h-16` with `text-[10px]` "No Logo" fallback — sub-minimum text (~82-87); feature tags `text-[10px]` with `px-1.5 py-0.5` (~655-658).
163. ⚪ Tables: no alternating row background, uniform `p-4` cell padding wastes space in narrow columns (~420-544).

---

## Counts

| Severity | Count |
|---|---|
| 🔴 High | 24 |
| 🟡 Medium | 81 |
| ⚪ Low | 58 (many bundle multiple micro-issues) |

**The five issues that, if fixed, dissolve dozens of the rest:** (1) a global focus-visible style; (2) primitives — `<Button>`, `<Badge>`, `<Card>`, `<Input>`, `<Modal>` — to kill the per-surface drift; (3) tokenize the semantic colors and sweep the hardcoded Tailwind color utilities (including all 5 category-color maps); (4) convert the members area off inline styles; (5) merge or formally exempt the `.prs-root` / `.tp-root` token silos.

---

# Verification — post-remediation re-audit (2026-06-11, after `ui-remediation` merge + `17395db`)

A 5-agent re-audit verified every numbered issue against the deployed code. Verdict counts:

| Verdict | Count | Notes |
|---|---|---|
| **Fixed** | 96 | incl. all 20 public-site highs |
| **Fixed in follow-up commit `17395db`** | 9 | #59, #60, #66, #78, #81, #83, #129, #140, #162 — misses caught by this re-audit |
| **Deferred — members area (agreed scope)** | 22 | section E (#99–120), incl. highs #99–102; consumes the new primitives in its own plan |
| **Deferred — PRS/tech-pulse exemption (agreed)** | 14 | class-anatomy items inside `.prs-root`/`.tp-root` (#20, #22–24, #122, #128, #130–132, #134-partial, #146–147, #149–150); color tokens are aliased so reskins propagate |
| **Deferred — accepted lows** | 17 | decorative/ambient by design (ghost-card text, watermarks, rubric 11px signature, mockup chrome) or micro-polish outside touched files (#42, #44, #47–48, #55, #58, #63–64, #72, #88, #92, #98, #144, #152, #154–157, #163 subset) |
| **False positives in original audit** | 5 | #38 (fixed in Phase 0 pre-sweep), #46 (transition-all was present), #67, #71, #97, #153 (FAQ icon already had transition-transform) |

**Bottom line:** every high- and medium-severity issue on the public site is resolved, explicitly exempted (PRS/tech-pulse with token aliasing), or a verified false positive. The open work is exactly the agreed deferrals: the **members-area conversion** (section E) and a tail of accepted low-severity polish.

**Remaining medium-grade items worth carrying into the members-area follow-up plan:** unified loading-state via Button `loading` for SubmitOpportunityForm/Spotlight (#125), CardVisualHeader's 3-tier heights (#64), modal info-pill pattern divergence (#88, currently a documented variant), country-page tablet breakpoint (#152).
