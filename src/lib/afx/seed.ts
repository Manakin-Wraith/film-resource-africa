import type { AfxSeed, DealEntity, ProducerProfile } from './types';

/* ============================================================
   Mock data ported from the Claude Design "AFX Deal Display"
   buildData(). The single dataset both AFX surfaces read.
   ============================================================ */

const producers: DealEntity[] = [
  {
    id: 'p1', name: 'Table Bay Features', sub: 'Cape Town, ZA', formatLabel: 'Feature', commercialPath: 'Streamer-first',
    band: 'A', score: 91, benchmark: 65, budgetUSD: 6800000, budgetLocal: 'R 126.0M', fundingPct: 88, gapUSD: 820000,
    rebatePct: 35, rebateConf: 'Confirmed', payoutShort: 'on completion', ratingBand: 'A', careerStage: 'Institutional', stage: 'Pre-sales', juris: ['ZA', 'GB'], asOf: '2026-06-20', stale: false,
    tags: [
      { label: 'High Rebate Security', why: 'Confirmed 35% enhanced rebate, QSAPE-eligible' },
      { label: 'Co-Production Optimized', why: 'ZA–UK treaty co-pro stacking incentives' },
      { label: 'Streamer-Aligned', why: 'Output deal with a global streamer' },
      { label: 'Bankable Slate', why: '88% of budget secured' },
    ],
    detail: {
      incentive: {
        blended: 35, valueUSD: 2380000, confidence: 'Confirmed', confNote: 'DTIC letter of approval issued', payout: 'On completion', payoutNote: 'paid on final audit, ~6mo post-delivery', qsape: 'Eligible (QSAPE verified)', asOf: '2026-06-20',
        lines: [
          { country: 'South Africa', pct: 30, scheme: 'DTIC foreign film & TV', status: 'Active', as: '2026-06-20' },
          { country: 'South Africa', pct: 5, scheme: 'Enhanced (B-BBEE uplift)', status: 'Active', as: '2026-06-20' },
          { country: 'United Kingdom', pct: 25, scheme: 'AVEC (co-pro share)', status: 'Active', as: '2026-06-12' },
        ],
      },
      stack: [{ label: 'Equity', pct: 42, usd: 2856000 }, { label: 'Soft', pct: 34, usd: 2312000 }, { label: 'Debt', pct: 12, usd: 816000 }, { label: 'Gap', pct: 12, usd: 816000 }],
      confidence: { completed: 14, raisedUSD: 62000000, bond: '4 bonded (Film Finances)', distribution: ['Showmax (output)', 'Canal+ (library)'], subscores: [{ label: 'Track record', v: 94 }, { label: 'Financial', v: 90 }, { label: 'Distribution', v: 92 }, { label: 'Bonding', v: 88 }] },
      packaging: [{ role: 'Director', name: 'Naledi Mokoena', prov: 'signed' }, { role: 'Lead cast', name: 'Thuso M. + ensemble', prov: 'signed' }, { role: 'Writer', name: 'K. van Wyk (final draft)', prov: 'signed' }, { role: 'Sales agent', name: 'Meridian Films Intl', prov: 'soft-hold' }], packagingScore: 88,
      market: { path: 'Streamer-first', tags: ['Pan-African', 'International', 'Diaspora'], comps: [{ title: 'Silverton Siege', note: 'streamer #1 in 12 markets' }, { title: 'Catch Me a Killer', note: 'multi-season renewal' }] },
      risk: { execution: 14, market: 30, gap: 18, timing: 20 },
    },
  },
  {
    id: 'p2', name: 'Kgosi Pictures', sub: 'Johannesburg, ZA', formatLabel: 'Series', commercialPath: 'Broadcaster',
    band: 'A', score: 86, benchmark: 65, budgetUSD: 4200000, budgetLocal: 'R 78.0M', fundingPct: 72, gapUSD: 1180000,
    rebatePct: 32, rebateConf: 'Confirmed', payoutShort: 'on completion', ratingBand: 'A', careerStage: 'Established', stage: 'In production', juris: ['ZA'], asOf: '2026-06-18', stale: false,
    tags: [
      { label: 'High Rebate Security', why: 'Confirmed DTIC rebate' },
      { label: 'Streamer-Aligned', why: 'Pre-sale to regional streamer' },
      { label: 'Co-Production Optimized', why: 'Single-territory, clean cap stack' },
    ],
    detail: {
      incentive: {
        blended: 32, valueUSD: 1344000, confidence: 'Confirmed', confNote: 'DTIC provisional approval + QSAPE filed', payout: 'On completion', payoutNote: 'final audit on wrap', qsape: 'Eligible', asOf: '2026-06-18',
        lines: [{ country: 'South Africa', pct: 32, scheme: 'DTIC local content', status: 'Active', as: '2026-06-18' }],
      },
      stack: [{ label: 'Equity', pct: 38, usd: 1596000 }, { label: 'Soft', pct: 30, usd: 1260000 }, { label: 'Debt', pct: 4, usd: 168000 }, { label: 'Gap', pct: 28, usd: 1176000 }],
      confidence: { completed: 11, raisedUSD: 38000000, bond: '2 bonded (Film Finances)', distribution: ['SABC (broadcast)', 'Showmax (SVOD window)'], subscores: [{ label: 'Track record', v: 88 }, { label: 'Financial', v: 82 }, { label: 'Distribution', v: 86 }, { label: 'Bonding', v: 80 }] },
      packaging: [{ role: 'Director', name: 'Sipho Dlamini', prov: 'signed' }, { role: 'Lead cast', name: 'Casting in progress', prov: 'soft-hold' }, { role: 'Writer', name: 'Room of 4 (commissioned)', prov: 'signed' }, { role: 'Sales agent', name: 'Kontinent Sales', prov: 'wishlist' }], packagingScore: 74,
      market: { path: 'Broadcaster', tags: ['Pan-African', 'Youth'], comps: [{ title: 'Reyka', note: 'crime drama, 2 seasons' }, { title: 'Adulting', note: 'youth ensemble, strong SVOD' }] },
      risk: { execution: 22, market: 34, gap: 46, timing: 24 },
    },
  },
  {
    id: 'p3', name: 'Riverstone Pictures', sub: 'Nairobi, KE', formatLabel: 'Feature', commercialPath: 'Festival-driven',
    band: 'B', score: 71, benchmark: 65, budgetUSD: 2600000, budgetLocal: 'KSh 336M', fundingPct: 54, gapUSD: 1196000,
    rebatePct: 25, rebateConf: 'Likely', payoutShort: 'milestone', ratingBand: 'B', careerStage: 'Early-Proven', stage: 'Packaging', juris: ['KE', 'ZA'], asOf: '2026-06-10', stale: false,
    tags: [
      { label: 'Festival Upside', why: 'Director has Cannes/TIFF selections' },
      { label: 'Pan-African', why: 'KE–ZA co-pro' },
      { label: 'Incentive-Timing Risk', why: 'Kenya rebate provisional, under review' },
    ],
    detail: {
      incentive: {
        blended: 25, valueUSD: 650000, confidence: 'Likely', confNote: 'Kenya cash rebate provisional; ZA leg confirmed', payout: 'Milestone', payoutNote: 'tranches on principal photography + delivery', qsape: 'ZA leg eligible', asOf: '2026-06-10',
        lines: [
          { country: 'Kenya', pct: 20, scheme: 'KFC cash rebate (pilot)', status: 'Under review', as: '2026-06-10' },
          { country: 'South Africa', pct: 30, scheme: 'DTIC co-pro share', status: 'Active', as: '2026-06-08' },
        ],
      },
      stack: [{ label: 'Equity', pct: 30, usd: 780000 }, { label: 'Soft', pct: 20, usd: 520000 }, { label: 'Debt', pct: 4, usd: 104000 }, { label: 'Gap', pct: 46, usd: 1196000 }],
      confidence: { completed: 5, raisedUSD: 9000000, bond: '1 bonded', distribution: ['Festival sales TBD', 'MultiChoice (talks)'], subscores: [{ label: 'Track record', v: 70 }, { label: 'Financial', v: 64 }, { label: 'Distribution', v: 62 }, { label: 'Bonding', v: 68 }] },
      packaging: [{ role: 'Director', name: 'Wanjiru Kamau', prov: 'signed' }, { role: 'Lead cast', name: 'A. Okonkwo (talks)', prov: 'wishlist' }, { role: 'Writer', name: 'W. Kamau (final)', prov: 'signed' }, { role: 'Sales agent', name: 'Atlas Sales', prov: 'soft-hold' }], packagingScore: 66,
      market: { path: 'Festival-driven', tags: ['International', 'Pan-African'], comps: [{ title: 'Rafiki', note: 'Cannes UCR, strong arthouse' }, { title: 'Nairobi Half Life', note: 'festival breakout' }] },
      risk: { execution: 34, market: 44, gap: 62, timing: 58 },
    },
  },
  {
    id: 'p4', name: 'Lagos Light Films', sub: 'Lagos, NG', formatLabel: 'Feature', commercialPath: 'Streamer-first',
    band: 'B', score: 67, benchmark: 65, budgetUSD: 3100000, budgetLocal: '₦ 4.65B', fundingPct: 41, gapUSD: 1829000,
    rebatePct: null, rebateConf: null, payoutShort: '', ratingBand: 'B', careerStage: 'Early-Proven', stage: 'Financing', juris: ['NG'], asOf: '2026-05-28', stale: true,
    tags: [
      { label: 'Streamer-Aligned', why: 'Two prior streamer originals' },
      { label: 'Youth', why: 'Lagos youth-skewing audience' },
      { label: 'No Incentive Cover', why: 'Nigeria has no national rebate scheme on file' },
    ],
    detail: {
      incentive: { blended: null },
      stack: [{ label: 'Equity', pct: 35, usd: 1085000 }, { label: 'Soft', pct: 0, usd: 0 }, { label: 'Debt', pct: 6, usd: 186000 }, { label: 'Gap', pct: 59, usd: 1829000 }],
      confidence: { completed: 6, raisedUSD: 11000000, bond: 'Not bonded', distribution: ['Netflix (2 prior originals)', 'Prime Video (talks)'], subscores: [{ label: 'Track record', v: 72 }, { label: 'Financial', v: 58 }, { label: 'Distribution', v: 74 }, { label: 'Bonding', v: 48 }] },
      packaging: [{ role: 'Director', name: 'Tunde Bakare', prov: 'signed' }, { role: 'Lead cast', name: 'Top-tier Nollywood lead', prov: 'soft-hold' }, { role: 'Writer', name: 'Draft 3 in progress', prov: 'soft-hold' }, { role: 'Sales agent', name: '—', prov: 'wishlist' }], packagingScore: 61,
      market: { path: 'Streamer-first', tags: ['Pan-African', 'Youth', 'Diaspora'], comps: [{ title: 'The Black Book', note: 'streamer global top-10' }, { title: 'Gangs of Lagos', note: 'Prime Video hit' }] },
      risk: { execution: 40, market: 36, gap: 66, timing: 50 },
    },
  },
  {
    id: 'p5', name: 'Sahel Story Co.', sub: 'Dakar, SN', formatLabel: 'Feature', commercialPath: 'Festival-driven',
    band: 'C', score: 52, benchmark: 65, budgetUSD: 1400000, budgetLocal: '€1.29M · XOF 845M', fundingPct: 28, gapUSD: 1008000,
    rebatePct: 30, rebateConf: 'Likely', payoutShort: 'delayed', ratingBand: 'C', careerStage: 'Emerging', stage: 'Development', juris: ['SN', 'FR'], asOf: '2026-06-15', stale: false,
    tags: [
      { label: 'Co-Production Optimized', why: 'SN–FR minority co-pro, CNC access' },
      { label: 'Festival Upside', why: 'Strong arthouse positioning' },
      { label: 'Emerging-Producer Risk', why: 'C-band rating, first international feature' },
    ],
    detail: {
      incentive: {
        blended: 30, valueUSD: 420000, confidence: 'Likely', confNote: 'CNC selective aid pending committee', payout: 'Delayed', payoutNote: 'reimbursed up to 18mo post-spend', qsape: 'N/A (France/CNC)', asOf: '2026-06-15',
        lines: [
          { country: 'France', pct: 30, scheme: 'CNC aide sélective (co-pro)', status: 'Provisional', as: '2026-06-15' },
          { country: 'Senegal', pct: 0, scheme: 'FOPICA (grant, separate)', status: 'Active', as: '2026-05-30' },
        ],
      },
      stack: [{ label: 'Equity', pct: 18, usd: 252000 }, { label: 'Soft', pct: 14, usd: 196000 }, { label: 'Debt', pct: 0, usd: 0 }, { label: 'Gap', pct: 68, usd: 952000 }],
      confidence: { completed: 2, raisedUSD: 1800000, bond: 'Not bonded', distribution: ['ARTE (talks)', 'Festival sales TBD'], subscores: [{ label: 'Track record', v: 48 }, { label: 'Financial', v: 42 }, { label: 'Distribution', v: 50 }, { label: 'Bonding', v: 40 }] },
      packaging: [{ role: 'Director', name: 'Aminata Diop', prov: 'signed' }, { role: 'Lead cast', name: 'Open casting', prov: 'wishlist' }, { role: 'Writer', name: 'A. Diop (draft 2)', prov: 'signed' }, { role: 'Sales agent', name: '—', prov: 'wishlist' }], packagingScore: 44,
      market: { path: 'Festival-driven', tags: ['International', 'Diaspora'], comps: [{ title: 'Atlantics', note: 'Cannes Grand Prix' }, { title: 'Banel & Adama', note: 'Cannes competition' }] },
      risk: { execution: 56, market: 52, gap: 78, timing: 62 },
    },
  },
];

const projects: DealEntity[] = [
  {
    id: 'pr1', name: 'City of Gold', sub: 'Johannesburg, ZA', formatLabel: 'Feature', commercialPath: 'Streamer-first', band: 'A', score: 88, benchmark: 62, budgetUSD: 6800000, budgetLocal: 'R 126.0M', fundingPct: 84, gapUSD: 1088000, rebatePct: 35, rebateConf: 'Confirmed', payoutShort: 'on completion', ratingBand: 'A', careerStage: 'Institutional', stage: 'Pre-sales', juris: ['ZA', 'GB'], asOf: '2026-06-20', stale: false,
    tags: [{ label: 'High Rebate Security', why: '35% confirmed' }, { label: 'Co-Production Optimized', why: 'ZA–UK' }, { label: 'Streamer-Aligned', why: 'output deal' }],
    detail: {
      incentive: { blended: 35, valueUSD: 2380000, confidence: 'Confirmed', payout: 'On completion', qsape: 'Eligible', asOf: '2026-06-20', lines: [{ country: 'South Africa', pct: 30, scheme: 'DTIC foreign', status: 'Active', as: '2026-06-20' }, { country: 'United Kingdom', pct: 25, scheme: 'AVEC co-pro', status: 'Active', as: '2026-06-12' }] },
      stack: [{ label: 'Equity', pct: 44, usd: 2992000 }, { label: 'Soft', pct: 34, usd: 2312000 }, { label: 'Debt', pct: 6, usd: 408000 }, { label: 'Gap', pct: 16, usd: 1088000 }],
      packaging: [{ role: 'Director', name: 'Naledi Mokoena', prov: 'signed' }, { role: 'Lead cast', name: 'Confirmed ensemble', prov: 'signed' }, { role: 'Writer', name: 'Locked', prov: 'signed' }, { role: 'Sales agent', name: 'Meridian Films Intl', prov: 'soft-hold' }], packagingScore: 90,
      market: { path: 'Streamer-first', tags: ['Pan-African', 'International'], comps: [{ title: 'Silverton Siege', note: 'streamer #1, 12 markets' }] },
      risk: { execution: 14, market: 28, gap: 24, timing: 18 },
    },
  },
  {
    id: 'pr2', name: 'Borderless', sub: 'Lagos / Cape Town', formatLabel: 'Feature', commercialPath: 'Streamer-first', band: 'B', score: 69, benchmark: 62, budgetUSD: 4200000, budgetLocal: 'R 78.0M', fundingPct: 58, gapUSD: 1764000, rebatePct: 30, rebateConf: 'Likely', payoutShort: 'milestone', ratingBand: 'B', careerStage: 'Early-Proven', stage: 'In production', juris: ['NG', 'ZA'], asOf: '2026-06-09', stale: false,
    tags: [{ label: 'Co-Production Optimized', why: 'NG–ZA stack' }, { label: 'Streamer-Aligned', why: 'pre-sale' }, { label: 'Capital-Gap Risk', why: '42% unfunded' }],
    detail: {
      incentive: { blended: 30, valueUSD: 1260000, confidence: 'Likely', payout: 'Milestone', qsape: 'ZA leg eligible', asOf: '2026-06-09', lines: [{ country: 'South Africa', pct: 30, scheme: 'DTIC co-pro', status: 'Active', as: '2026-06-09' }, { country: 'Nigeria', pct: 0, scheme: 'none on file', status: 'Frozen', as: '2026-06-01' }] },
      stack: [{ label: 'Equity', pct: 34, usd: 1428000 }, { label: 'Soft', pct: 22, usd: 924000 }, { label: 'Debt', pct: 2, usd: 84000 }, { label: 'Gap', pct: 42, usd: 1764000 }],
      packaging: [{ role: 'Director', name: 'Tunde Bakare', prov: 'signed' }, { role: 'Lead cast', name: 'Dual-market leads', prov: 'soft-hold' }, { role: 'Writer', name: 'Locked', prov: 'signed' }, { role: 'Sales agent', name: 'Atlas Sales', prov: 'soft-hold' }], packagingScore: 72,
      market: { path: 'Streamer-first', tags: ['Pan-African', 'Diaspora', 'Youth'], comps: [{ title: 'The Black Book', note: 'global top-10' }] },
      risk: { execution: 30, market: 34, gap: 56, timing: 38 },
    },
  },
  {
    id: 'pr3', name: 'The Long Dry', sub: 'Nairobi, KE', formatLabel: 'Series', commercialPath: 'Broadcaster', band: 'B', score: 64, benchmark: 62, budgetUSD: 2600000, budgetLocal: 'KSh 336M', fundingPct: 49, gapUSD: 1326000, rebatePct: 20, rebateConf: 'Likely', payoutShort: 'milestone', ratingBand: 'B', careerStage: 'Early-Proven', stage: 'Packaging', juris: ['KE'], asOf: '2026-06-04', stale: false,
    tags: [{ label: 'Festival Upside', why: 'limited-series prestige' }, { label: 'Pan-African', why: 'EA distribution' }, { label: 'Incentive-Timing Risk', why: 'KE rebate pilot' }],
    detail: {
      incentive: { blended: 20, valueUSD: 520000, confidence: 'Likely', payout: 'Milestone', qsape: 'N/A', asOf: '2026-06-04', lines: [{ country: 'Kenya', pct: 20, scheme: 'KFC cash rebate (pilot)', status: 'Under review', as: '2026-06-04' }] },
      stack: [{ label: 'Equity', pct: 31, usd: 806000 }, { label: 'Soft', pct: 16, usd: 416000 }, { label: 'Debt', pct: 2, usd: 52000 }, { label: 'Gap', pct: 51, usd: 1326000 }],
      packaging: [{ role: 'Director', name: 'Wanjiru Kamau', prov: 'signed' }, { role: 'Lead cast', name: 'In casting', prov: 'wishlist' }, { role: 'Writer', name: 'Bible + 2 eps', prov: 'signed' }, { role: 'Sales agent', name: 'Kontinent Sales', prov: 'wishlist' }], packagingScore: 60,
      market: { path: 'Broadcaster', tags: ['Pan-African', 'International'], comps: [{ title: 'Country Queen', note: 'first Kenyan Netflix series' }] },
      risk: { execution: 36, market: 42, gap: 58, timing: 54 },
    },
  },
  {
    id: 'pr4', name: 'Mokete', sub: 'Durban, ZA', formatLabel: 'Documentary', commercialPath: 'Festival-driven', band: 'A', score: 82, benchmark: 62, budgetUSD: 900000, budgetLocal: 'R 16.7M', fundingPct: 76, gapUSD: 216000, rebatePct: 25, rebateConf: 'Confirmed', payoutShort: 'on completion', ratingBand: 'A', careerStage: 'Established', stage: 'Financing', juris: ['ZA'], asOf: '2026-06-17', stale: false,
    tags: [{ label: 'High Rebate Security', why: 'confirmed doc rebate' }, { label: 'Festival Upside', why: 'strong doc circuit' }],
    detail: {
      incentive: { blended: 25, valueUSD: 225000, confidence: 'Confirmed', payout: 'On completion', qsape: 'Eligible', asOf: '2026-06-17', lines: [{ country: 'South Africa', pct: 25, scheme: 'DTIC documentary', status: 'Active', as: '2026-06-17' }] },
      stack: [{ label: 'Equity', pct: 40, usd: 360000 }, { label: 'Soft', pct: 30, usd: 270000 }, { label: 'Debt', pct: 6, usd: 54000 }, { label: 'Gap', pct: 24, usd: 216000 }],
      packaging: [{ role: 'Director', name: 'Sipho Dlamini', prov: 'signed' }, { role: 'Subject access', name: 'Secured', prov: 'signed' }, { role: 'Editor', name: 'Attached', prov: 'soft-hold' }, { role: 'Sales agent', name: 'Dogwoof (talks)', prov: 'wishlist' }], packagingScore: 78,
      market: { path: 'Festival-driven', tags: ['International', 'Diaspora'], comps: [{ title: 'Strike a Rock', note: 'IDFA selection' }] },
      risk: { execution: 20, market: 38, gap: 30, timing: 22 },
    },
  },
  {
    id: 'pr5', name: 'Harmattan', sub: 'Dakar / Paris', formatLabel: 'Feature', commercialPath: 'Festival-driven', band: 'C', score: 51, benchmark: 62, budgetUSD: 1400000, budgetLocal: '€1.29M', fundingPct: 26, gapUSD: 1036000, rebatePct: 30, rebateConf: 'Likely', payoutShort: 'delayed', ratingBand: 'C', careerStage: 'Emerging', stage: 'Development', juris: ['SN', 'FR'], asOf: '2026-06-15', stale: false,
    tags: [{ label: 'Co-Production Optimized', why: 'SN–FR' }, { label: 'Festival Upside', why: 'arthouse' }, { label: 'Emerging-Producer Risk', why: 'first intl feature' }],
    detail: {
      incentive: { blended: 30, valueUSD: 420000, confidence: 'Likely', payout: 'Delayed', qsape: 'N/A', asOf: '2026-06-15', lines: [{ country: 'France', pct: 30, scheme: 'CNC sélective (co-pro)', status: 'Provisional', as: '2026-06-15' }] },
      stack: [{ label: 'Equity', pct: 18, usd: 252000 }, { label: 'Soft', pct: 8, usd: 112000 }, { label: 'Debt', pct: 0, usd: 0 }, { label: 'Gap', pct: 74, usd: 1036000 }],
      packaging: [{ role: 'Director', name: 'Aminata Diop', prov: 'signed' }, { role: 'Lead cast', name: 'Open casting', prov: 'wishlist' }, { role: 'Writer', name: 'Draft 2', prov: 'signed' }, { role: 'Sales agent', name: '—', prov: 'wishlist' }], packagingScore: 43,
      market: { path: 'Festival-driven', tags: ['International', 'Diaspora'], comps: [{ title: 'Atlantics', note: 'Cannes Grand Prix' }] },
      risk: { execution: 56, market: 50, gap: 80, timing: 60 },
    },
  },
];

const slates: DealEntity[] = [
  {
    id: 's1', name: 'Table Bay Slate 26–27', sub: 'Cape Town, ZA', formatLabel: 'Slate', commercialPath: 'Mixed', band: 'A', score: 89, benchmark: 64, budgetUSD: 18400000, budgetLocal: 'R 341M', fundingPct: 79, gapUSD: 3864000, rebatePct: 33, rebateConf: 'Confirmed', payoutShort: 'blended', ratingBand: 'A', careerStage: 'Institutional', stage: 'Active', juris: ['ZA', 'GB'], asOf: '2026-06-20', stale: false,
    tags: [{ label: 'Diversified', why: '4 projects across 3 formats' }, { label: 'High Rebate Security', why: 'blended 33% confirmed' }, { label: 'Bankable Slate', why: '79% secured' }],
    detail: {
      incentive: { blended: 33, valueUSD: 6072000, confidence: 'Confirmed', payout: 'Blended', qsape: 'Mostly eligible', asOf: '2026-06-20', lines: [{ country: 'South Africa', pct: 32, scheme: 'DTIC (portfolio)', status: 'Active', as: '2026-06-20' }, { country: 'United Kingdom', pct: 25, scheme: 'AVEC (1 title)', status: 'Active', as: '2026-06-12' }] },
      stack: [{ label: 'Equity', pct: 43, usd: 7912000 }, { label: 'Soft', pct: 30, usd: 5520000 }, { label: 'Debt', pct: 6, usd: 1104000 }, { label: 'Gap', pct: 21, usd: 3864000 }],
      market: { path: 'Mixed (streamer + broadcast)', tags: ['Pan-African', 'International', 'Diaspora'], comps: [{ title: 'Portfolio blended ROI', note: 'projected 1.4x net' }] },
      risk: { execution: 18, market: 30, gap: 34, timing: 22 },
    },
  },
  {
    id: 's2', name: 'Riverstone Pan-African Slate', sub: 'Nairobi, KE', formatLabel: 'Slate', commercialPath: 'Festival + broadcast', band: 'B', score: 68, benchmark: 64, budgetUSD: 7400000, budgetLocal: 'KSh 956M', fundingPct: 51, gapUSD: 3626000, rebatePct: 23, rebateConf: 'Likely', payoutShort: 'blended', ratingBand: 'B', careerStage: 'Early-Proven', stage: 'Active', juris: ['KE', 'ZA'], asOf: '2026-06-10', stale: false,
    tags: [{ label: 'Festival Upside', why: 'prestige-led' }, { label: 'Pan-African', why: 'EA + SA' }, { label: 'Incentive-Timing Risk', why: 'KE pilot exposure' }],
    detail: {
      incentive: { blended: 23, valueUSD: 1702000, confidence: 'Likely', payout: 'Blended', qsape: 'Partial', asOf: '2026-06-10', lines: [{ country: 'Kenya', pct: 20, scheme: 'KFC pilot (portfolio)', status: 'Under review', as: '2026-06-10' }, { country: 'South Africa', pct: 30, scheme: 'DTIC (1 title)', status: 'Active', as: '2026-06-08' }] },
      stack: [{ label: 'Equity', pct: 32, usd: 2368000 }, { label: 'Soft', pct: 16, usd: 1184000 }, { label: 'Debt', pct: 3, usd: 222000 }, { label: 'Gap', pct: 49, usd: 3626000 }],
      market: { path: 'Festival + broadcast', tags: ['International', 'Pan-African'], comps: [{ title: 'Portfolio blended ROI', note: 'projected 1.1x net' }] },
      risk: { execution: 34, market: 44, gap: 60, timing: 56 },
    },
  },
  {
    id: 's3', name: 'Sahel Emerging Slate', sub: 'Dakar, SN', formatLabel: 'Slate', commercialPath: 'Festival-driven', band: 'C', score: 50, benchmark: 64, budgetUSD: 3100000, budgetLocal: '€2.86M', fundingPct: 27, gapUSD: 2263000, rebatePct: 30, rebateConf: 'Likely', payoutShort: 'delayed', ratingBand: 'C', careerStage: 'Emerging', stage: 'Developing', juris: ['SN', 'FR'], asOf: '2026-06-15', stale: false,
    tags: [{ label: 'Co-Production Optimized', why: 'SN–FR' }, { label: 'Festival Upside', why: 'arthouse' }, { label: 'Concentration Risk', why: '2 projects, single director' }],
    detail: {
      incentive: { blended: 30, valueUSD: 930000, confidence: 'Likely', payout: 'Delayed', qsape: 'N/A', asOf: '2026-06-15', lines: [{ country: 'France', pct: 30, scheme: 'CNC sélective (portfolio)', status: 'Provisional', as: '2026-06-15' }] },
      stack: [{ label: 'Equity', pct: 18, usd: 558000 }, { label: 'Soft', pct: 9, usd: 279000 }, { label: 'Debt', pct: 0, usd: 0 }, { label: 'Gap', pct: 73, usd: 2263000 }],
      market: { path: 'Festival-driven', tags: ['International', 'Diaspora'], comps: [{ title: 'Portfolio blended ROI', note: 'projected 0.9x net — speculative' }] },
      risk: { execution: 56, market: 52, gap: 80, timing: 62 },
    },
  },
];

export const afxSeed: AfxSeed = { producers, projects, slates };

/**
 * The cockpit subject. Its id matches afxSeed.producers[0] (Table Bay
 * Features), and it owns ≥2 projects (City of Gold, Mokete) so its Funder
 * Preview renders consistently with the marketplace.
 */
export const focusProducer: ProducerProfile = {
  id: 'p1',
  name: 'Table Bay Features',
  company: 'Table Bay Features (Pty) Ltd',
  bio: 'Cape Town production company with a 12-year track record in feature and premium series, specialising in ZA–UK treaty co-productions and streamer output deals.',
  ratingBand: 'A',
  careerStage: 'Institutional',
  location: 'Cape Town, ZA',
  relationships: [
    { id: 'r1', name: 'Showmax', role: 'Output deal', provenance: 'confirmed' },
    { id: 'r2', name: 'Canal+', role: 'Library licensing', provenance: 'self' },
    { id: 'r3', name: 'Film Finances', role: 'Completion bond', provenance: 'verified' },
  ],
  entityK2: true,
  consentK4: true,
  ndaSigned: false,
  slate: [
    // ---- Track record (case studies) ----
    {
      id: 'cs1', status: 'case_study', title: 'Silverton Siege', year: 2022, format: 'feature', genre: 'Thriller', role: 'Producer', jurisdiction: ['ZA'],
      budgetBand: { value: '$5–15M', provenance: 'verified' },
      outcomes: {
        recoupment: { value: 'Fully recouped', provenance: 'verified' },
        bondUsed: { value: 'Bonded (Film Finances)', provenance: 'verified' },
        distribution: [{ name: 'Netflix', type: 'streamer', provenance: 'verified' }],
        festivalsAwards: ['Netflix global top-10 (12 markets)'],
      },
    },
    {
      id: 'cs2', status: 'case_study', title: 'Catch Me a Killer', year: 2024, format: 'series', genre: 'Crime', role: 'Exec Producer', jurisdiction: ['ZA'],
      budgetBand: { value: '$5–15M', provenance: 'confirmed' },
      outcomes: {
        recoupment: { value: 'Partial', provenance: 'self' },
        bondUsed: { value: 'Bonded (Film Finances)', provenance: 'confirmed' },
        distribution: [{ name: 'Showmax', type: 'streamer', provenance: 'confirmed' }],
        festivalsAwards: ['Multi-season renewal'],
      },
    },
    {
      id: 'cs3', status: 'case_study', title: 'The Wound', year: 2017, format: 'feature', genre: 'Drama', role: 'Co-Producer', jurisdiction: ['ZA'],
      budgetBand: { value: '$0.5–2M', provenance: 'verified' },
      outcomes: {
        recoupment: { value: 'Fully recouped', provenance: 'confirmed' },
        bondUsed: { value: 'Not bonded', provenance: 'self' },
        distribution: [{ name: 'Kino Lorber', type: 'distributor', provenance: 'confirmed' }],
        festivalsAwards: ['Sundance 2017', 'Oscar shortlist (Foreign Language)'],
      },
    },
    // ---- Live slate (the asks) — bridge to marketplace DealEntities ----
    {
      id: 'pr1', status: 'live', title: 'City of Gold', format: 'feature', genre: 'Crime', role: 'Producer', jurisdiction: ['ZA', 'GB'], dealRef: 'pr1',
      budgetBand: { value: '$5–15M', provenance: 'confirmed' },
      ask: {
        logline: 'A gold-heist thriller across Johannesburg\'s underworld.', stage: 'pre', commercialPath: 'Streamer-first', fundingSecuredBand: '80–90% secured',
        capitalStack: { equityPct: 44, softPct: 34, debtPct: 6, gapPct: 16 },
        packaging: [
          { role: 'Director', name: 'Naledi Mokoena', status: 'signed' },
          { role: 'Writer', name: 'K. van Wyk (locked)', status: 'signed' },
          { role: 'Lead cast', name: 'Confirmed ensemble', status: 'signed' },
          { role: 'Sales agent', name: 'Meridian Films Intl', status: 'soft-hold' },
        ],
        comps: [{ title: 'Silverton Siege', note: 'streamer #1, 12 markets' }],
      },
    },
    {
      id: 'pr4', status: 'live', title: 'Mokete', format: 'doc', genre: 'Documentary', role: 'Producer', jurisdiction: ['ZA'], dealRef: 'pr4',
      budgetBand: { value: '$0.5–2M', provenance: 'self' },
      ask: {
        logline: 'A verité portrait of a Durban wedding choir.', stage: 'production', commercialPath: 'Festival-driven', fundingSecuredBand: '70–80% secured',
        capitalStack: { equityPct: 40, softPct: 30, debtPct: 6, gapPct: 24 },
        packaging: [
          { role: 'Director', name: 'Sipho Dlamini', status: 'signed' },
          { role: 'Writer', name: 'Sipho Dlamini', status: 'signed' },
          { role: 'Editor', name: 'Attached', status: 'soft-hold' },
          { role: 'Sales agent', name: 'Dogwoof (talks)', status: 'wishlist' },
        ],
      },
    },
  ],
};

export function assertFocusProducerHasProjects(p: ProducerProfile = focusProducer): void {
  const live = (p.slate ?? []).filter((pr) => pr.status === 'live');
  if (live.length < 1) {
    throw new Error('[afx/seed] focus producer must own ≥1 live project');
  }
}
