# Opportunities → Directory Split: Content Audit

**Date:** 2026-05-29
**Goal:** Split the bundled "Opportunities" into a public **Directory** and a members-only **Opportunities** feed.

**Two corrections from the owner (2026-05-29) that shape this audit:**
1. **All current scraped opportunities are free-tier** → every existing item belongs to the public **Directory**. None move to members.
2. **The members-only Opportunities feed is net-new content the owner adds personally** (curated briefs, private/commission/crew calls). It starts empty — no current item seeds it.
3. **Directory is the full public taxonomy** (owner chose "expand Directory categories"): Grants, Funds, Festivals **plus** Labs & Fellowships, Markets & Pitching, AI & Emerging Tech, and a Calls & Deadlines bucket.

IA decision reference: memory `fra-directory-split` (2026-05-28).

## How the tagging is stored

Column `opportunities.directory_destination` (text, nullable) records each item's destination.

| Value | Meaning | Surface |
|---|---|---|
| `directory_funds` | Standing financing body / film fund / co-pro fund / commission production fund | Directory › Funds |
| `directory_grants` | Standing grant programme (recurring non-repayable awards) | Directory › Grants |
| `directory_festivals` | Festival with a confirmed cash prize / material award | Directory › Festivals |
| `directory_labs_fellowships` | Labs, fellowships, residencies, workshops, accelerators, training | Directory › Labs & Fellowships |
| `directory_markets_pitching` | Co-production markets, pitch competitions, industry summits | Directory › Markets & Pitching |
| `directory_ai` | AI & emerging-tech opportunities | Directory › AI & Emerging Tech |
| `directory_calls` | Time-bound open calls, festival call-for-entries, commissions, bursaries, dated grant cycles | Directory › Calls & Deadlines |
| `omit` | Junk scrape, news article, non-film, or non-Africa — drop entirely | — |
| `members_opportunities` | **Reserved** for the net-new members feed. No current item carries it. | Members (future) |

Scope: **186 approved (live) items** fully tagged. Pending/unapproved rows untagged — classified at review time.

## Result (approved items)

| Directory category | Count |
|---|---|
| Labs & Fellowships | 57 |
| Calls & Deadlines | 40 |
| Funds | 26 |
| Markets & Pitching | 21 |
| AI & Emerging Tech | 17 |
| Grants | 9 |
| Festivals (confirmed cash prize) | 9 |
| (omit) | 5 |
| **Total** | **186** |

## Key finding: the source `category` field can't drive the Directory

The old category is a poor proxy. Notably **"Funds & Grants" (101 approved) is a grab-bag** — only 35 are real funds/grants; the other 66 are labs, festivals, markets, pitch comps, residencies, training, and dated open calls. **The Directory must filter on `directory_destination`, not `category`.**

The cash-prize rule for Festivals is strict by design. After web verification (2026-05-29) of 10 borderline festivals, 9 festivals carry a confirmed cash prize; the rest are call-for-entries → Calls & Deadlines.

## Confirmed Directory-bound items (by category)

### Funds (26)
9 Berlinale World Cinema Fund · 10 Hubert Bals Fund · 11 IDFA Bertha Fund · 12 TorinoFilmLab Co-Production Fund · 13 Hot Docs–Blue Ice Docs Fund · 35 Next Narrative Africa Fund · 37 NFVF Production & Development Funding · 39 Sundance Documentary Fund · 40 ITVS Open Call · 42 Docubox · 44 ACP-EU Culture Programme · 47 Africa No Filter / Kekere Fund · 76 Goethe-Institut Coproduction Fund · 131 Regional Competitive Creativity Fund · 200 Creative Economy Development Fund (Nigeria) · 287 IDFA IBF Europe Minority Co-Pro Fund · 289 Boomerang Fund · 290 Sundance Sandbox Fund · 324/325/326 Gauteng FC (Production / Marketing & Distribution / Content Development) · 338 Hot Docs–Blue Ice (African Doc) · 389 Red Sea Fund · 403 UNESCO IFCD · 513 Cape Town Film Fund · 636 FVG Film Fund

### Grants (9)
36 AFAC Documentary Film Program · 38 Doha Film Institute Grants · 57 Alter-Ciné Documentary Grants · 63 KOSINIMA Short Film Grant · 313 RRI Startup Grants · 346 Entertainmint Grant · 354 Redford Center Grants · 490 SFP9 Short Film Production Grant (Sharjah) · 491 AFAC Cinema Grant Program

### Festivals — confirmed cash prize (9)
41 FESPACO (Étalon de Yennenga) · 211 FESPACO 2027 · 28 Marrakech / Atlas Workshops (€120k pool) · 43 AFRIFF (₦2M grant) · 60 Carthage JCC (Tanit d'Or ~20k TND) · 61 ZIFF Zanzibar (Golden Dhow, Showmax cash) · 165 Beijing IFF (project-market pitches up to ¥500k) · 201 Luxor African FF (Nile prizes $1k–$10k) · 492 Durban IFF (Best Feature R50k + cash slate)

(Labs & Fellowships 57, Markets & Pitching 21, AI 17, Calls & Deadlines 42 — full lists in the DB; query below.)

## Festival prize verification — resolved (2026-05-29)
The 10 borderline festivals were web-verified for cash/material awards:
- **→ Festivals (cash confirmed):** 28 Marrakech/Atlas, 43 AFRIFF, 60 Carthage/JCC, 61 ZIFF, 165 Beijing (via project market), 201 Luxor, 492 Durban.
- **→ Markets & Pitching:** 46 CPH:FORUM — awards cash, but it is a co-production financing *forum*, not a screening festival.
- **→ Calls & Deadlines:** 19 CanneSeries (trophies only, no cash); 74 Sotambe/ZAMIFF (no cash found — UNCERTAIN; promote to Festivals if a prize is later confirmed).

## Omitted (5)
121 Open Cities Cascais (junk scrape) · 122 HBF+Europe announcement (news) · 156 EEP Africa (energy fund, not film) · 300 ASEAN producers call (non-Africa) · 302 Central Asia grant (non-Africa)

## Duplicates to resolve during build
- Hot Docs–Blue Ice Docs Fund: 13 + 338
- IDFA IBF Europe Minority Co-Pro: 287 + 123
- UNESCO IFCD 17th Call: 403 + 489
- FESPACO: 41 + 211
- Alaka Film Lab: 115 + 132

## Next steps
1. ~~Verify the 10 `review_festival_prize` festivals~~ ✅ done 2026-05-29.
2. Tag pending/unapproved rows.
3. Resolve flagged duplicates.
4. Build Directory routes filtering on `directory_destination` (7 public categories), not `category`.
5. Members feed: net-new surface, owner-curated — no migration of current content.
6. Sotambe/ZAMIFF (74): re-check for a cash prize; promote to Festivals if confirmed.

## Reproduce
```sql
select directory_destination, count(*) from opportunities
where status='approved' group by directory_destination order by 2 desc;
```
