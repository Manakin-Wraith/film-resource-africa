# AFX Producer Type & Region (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a producer declare Individual/freelance vs Company type, capture a structured Country (driving currency), show type-appropriate identity fields, and make the K2 gate copy type-aware — with zero data migration and full back-compat.

**Architecture:** Add `producerType` + `country` to `ProducerProfile` (both live in the profile blob — no migration). A new `countries.ts` holds the African country list + `currencyForCountry`; `constants.ts` gains `producerTypeOf`/`isIndividual`/`operatorGateLabel`. `IdentityPanel` gets a type toggle, a Country dropdown, and conditionally hides the Legal-entity field; `AccountVisibility` renders the K2 gate label by type. This is Phase 1 of the spec `2026-07-02-afx-producer-type-and-individual-vetting-design.md`; Phase 2 (individual vetting) is a separate plan.

**Tech Stack:** Next.js App Router client components, TypeScript, inline `var(--afx-*)` styling.

## Global Constraints

- `producerType` defaults to `'company'` when absent — every existing producer is unchanged. Never write a default eagerly; derive it via `producerTypeOf`.
- `producerType` and `country` live in the profile blob (persisted automatically by the existing upsert). NO migration, NO persistence-layer change in Phase 1.
- Currency: `currencyForCountry(country)` returns `'ZAR'` only for `'ZA'`, else `'USD'`. Undefined country → `'USD'` (preserves today's behavior for existing producers).
- Country list: the 54 African countries with South Africa first, then alphabetical, plus a final `{ code: 'INTL', name: 'Other / International' }`. Unset country shows a "Select country" placeholder (do not auto-select South Africa for existing profiles).
- Individual producers: hide the Legal-entity field; keep name (relabeled), country, city, bio, relationships.
- No test runner — verify with `npx tsc --noEmit -p tsconfig.json`, `npx next build`, and (Task 1) a temporary `npx tsx` assertion that is deleted, not committed.
- No change to vetting, NDA, funder preview, or `deriveVisibility` logic (it keeps reading `entityK2` verbatim).

---

### Task 1: Lib foundations — type, country list, currency + gate helpers

**Files:**
- Modify: `src/lib/afx/types.ts` (add `ProducerType` + two `ProducerProfile` fields)
- Create: `src/lib/afx/countries.ts`
- Modify: `src/lib/afx/constants.ts` (add helpers; make one `nextBestActions` line type-aware)

**Interfaces:**
- Produces: `type ProducerType = 'individual' | 'company'`; `AFRICAN_COUNTRIES: readonly Country[]`; `currencyForCountry(country?: string): AfxCurrency`; `producerTypeOf(p): ProducerType`; `isIndividual(p): boolean`; `operatorGateLabel(type): { title: string; note: string }`.

- [ ] **Step 1: Add the type + fields to `types.ts`**

In `src/lib/afx/types.ts`, directly above the `export interface ProducerProfile {` line, add:

```ts
export type ProducerType = 'individual' | 'company';
```

Then inside `ProducerProfile`, immediately below the `location?: string;` line, add:

```ts
  /** Individual/freelance vs company/entity. Absent = 'company' (back-compat). Profile blob. */
  producerType?: ProducerType;
  /** ISO-ish country code from AFRICAN_COUNTRIES (e.g. 'ZA', 'INTL'). Profile blob; drives currency. */
  country?: string;
```

- [ ] **Step 2: Create `countries.ts`**

Create `src/lib/afx/countries.ts` with exactly:

```ts
import type { AfxCurrency } from './types';

export interface Country {
  code: string;
  name: string;
}

/** African countries — South Africa first (default choice), then alphabetical,
 *  with an Other/International escape hatch last. */
export const AFRICAN_COUNTRIES: readonly Country[] = [
  { code: 'ZA', name: 'South Africa' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AO', name: 'Angola' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CV', name: 'Cape Verde' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo (Republic)' },
  { code: 'CD', name: 'Congo (DRC)' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'EG', name: 'Egypt' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'KE', name: 'Kenya' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'ML', name: 'Mali' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SN', name: 'Senegal' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SO', name: 'Somalia' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'SD', name: 'Sudan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TG', name: 'Togo' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'UG', name: 'Uganda' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'INTL', name: 'Other / International' },
];

/** ZAR only for South Africa; USD for everything else (incl. unset). */
export function currencyForCountry(country?: string): AfxCurrency {
  return country === 'ZA' ? 'ZAR' : 'USD';
}
```

- [ ] **Step 3: Add helpers to `constants.ts` + make `nextBestActions` type-aware**

In `src/lib/afx/constants.ts`, confirm `ProducerType` is available: add `ProducerType` to the existing `import type { ... } from './types'` line (it already imports `ProducerProfile`, `Project`, etc. from `./types` — add `ProducerType` to that import list).

Add these helpers (place them just above `export function meetsGoLive`):

```ts
export function producerTypeOf(p: { producerType?: ProducerType }): ProducerType {
  return p.producerType ?? 'company';
}

export function isIndividual(p: { producerType?: ProducerType }): boolean {
  return producerTypeOf(p) === 'individual';
}

/** Type-aware copy for the reused K2 "operator standing" gate. */
export function operatorGateLabel(type: ProducerType): { title: string; note: string } {
  return type === 'individual'
    ? { title: 'Individual / professional standing', note: 'Your standing as an individual producer. Missing caps your rating band.' }
    : { title: 'Legal entity / structure', note: 'An operating entity must be in place. Missing caps your rating band.' };
}
```

Then in `nextBestActions`, replace this exact line:

```ts
  if (!p.entityK2) out.push('Complete your legal entity (K2) to remove the rating cap.');
```

with:

```ts
  if (!p.entityK2) out.push(isIndividual(p) ? 'Confirm your individual / professional standing (K2) to remove the rating cap.' : 'Complete your legal entity (K2) to remove the rating cap.');
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 5: Temporary assertion (create, run, delete — do NOT commit)**

Create `test_phase1_lib.mts` in the repo ROOT (scratchpad can't resolve node_modules):

```ts
import assert from 'node:assert';
import { currencyForCountry, AFRICAN_COUNTRIES } from './src/lib/afx/countries';
import { producerTypeOf, isIndividual, operatorGateLabel } from './src/lib/afx/constants';

assert.equal(currencyForCountry('ZA'), 'ZAR');
assert.equal(currencyForCountry('KE'), 'USD');
assert.equal(currencyForCountry(undefined), 'USD');
assert.equal(AFRICAN_COUNTRIES[0].code, 'ZA');
assert.equal(AFRICAN_COUNTRIES[AFRICAN_COUNTRIES.length - 1].code, 'INTL');
assert.equal(producerTypeOf({}), 'company');
assert.equal(producerTypeOf({ producerType: 'individual' }), 'individual');
assert.equal(isIndividual({ producerType: 'individual' }), true);
assert.equal(isIndividual({}), false);
assert.equal(operatorGateLabel('company').title, 'Legal entity / structure');
assert.equal(operatorGateLabel('individual').title, 'Individual / professional standing');
console.log('PHASE1_LIB_OK');
```

Run: `npx tsx test_phase1_lib.mts`
Expected: prints `PHASE1_LIB_OK`. Then delete it: `rm test_phase1_lib.mts`

- [ ] **Step 6: Commit (only the three source files)**

```bash
git add src/lib/afx/types.ts src/lib/afx/countries.ts src/lib/afx/constants.ts
git commit -m "feat(afx): producer type + country lib foundations (phase 1)"
```

Note: the working tree has unrelated pre-existing dirty files (`scan_opportunities.mjs`, newsletter `.mjs`/`.html`, `supabase/*`) — do NOT stage them. Confirm `test_phase1_lib.mts` is gone before committing.

---

### Task 2: Identity UI — type toggle, country dropdown, conditional fields, currency

**Files:**
- Modify: `src/components/afx/producer/cockpitUi.tsx` (add `InlineSelect`)
- Modify: `src/components/afx/producer/IdentityPanel.tsx`
- Modify: `src/app/afx/producer/ProducerProfileClient.tsx` (extend `onIdentity` type; currency from country)

**Interfaces:**
- Consumes: `AFRICAN_COUNTRIES`, `currencyForCountry` from `@/lib/afx/countries`; `producerTypeOf` from `@/lib/afx/constants`; `ProducerType` from `@/lib/afx/types`.
- Produces: `InlineSelect` in `cockpitUi`.

- [ ] **Step 1: Add `InlineSelect` to `cockpitUi.tsx`**

In `src/components/afx/producer/cockpitUi.tsx`, add this exported function directly below the existing `InlineEdit` function:

```tsx
/** Inline labelled dropdown, styled to match InlineEdit. */
export function InlineSelect({
  value,
  onChange,
  label,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  options: readonly { code: string; name: string }[];
  placeholder?: string;
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--afx-body)', fontSize: 13.5, color: value ? '#1C1D21' : '#9A9CA3',
    border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none', cursor: 'pointer',
  };
  return (
    <label style={{ display: 'block' }}>
      {label ? (
        <span style={{ display: 'block', fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{label}</span>
      ) : null}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={baseStyle}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
    </label>
  );
}
```

- [ ] **Step 2: Rewrite `IdentityPanel.tsx`**

Replace the entire contents of `src/components/afx/producer/IdentityPanel.tsx` with:

```tsx
'use client';

import type { ProducerProfile, ProducerType } from '@/lib/afx/types';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import { producerTypeOf } from '@/lib/afx/constants';
import { AFRICAN_COUNTRIES } from '@/lib/afx/countries';
import { SectionCard, InlineEdit, InlineSelect } from './cockpitUi';

const mono = 'var(--afx-mono)';

interface Props {
  draft: ProducerProfile;
  onIdentity: (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location' | 'producerType' | 'country'>>) => void;
}

export default function IdentityPanel({ draft, onIdentity }: Props) {
  const type = producerTypeOf(draft);

  return (
    <SectionCard title="Operator Identity" hint="who you are">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['company', 'individual'] as const).map((t: ProducerType) => {
          const active = type === t;
          return (
            <button key={t} onClick={() => onIdentity({ producerType: t })}
              style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, padding: '7px 14px', borderRadius: 8,
                border: `1px solid ${active ? 'var(--afx-ink)' : '#E4E2DC'}`, background: active ? 'var(--afx-ink)' : '#fff', color: active ? '#fff' : '#5E6066' }}>
              {t === 'company' ? 'Company / entity' : 'Individual / freelance'}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        <InlineEdit label={type === 'individual' ? 'Producer name' : 'Producer / company'} value={draft.name} onChange={(v) => onIdentity({ name: v })} />
        {type === 'company' ? (
          <InlineEdit label="Legal entity" value={draft.company} onChange={(v) => onIdentity({ company: v })} />
        ) : (
          <div />
        )}
        <InlineSelect label="Country" value={draft.country ?? ''} onChange={(v) => onIdentity({ country: v })} options={AFRICAN_COUNTRIES} placeholder="Select country" />
        <InlineEdit label="City / base" value={draft.location ?? ''} onChange={(v) => onIdentity({ location: v })} />
        <div style={{ gridColumn: '1 / -1' }}>
          <InlineEdit label="Bio" value={draft.bio} onChange={(v) => onIdentity({ bio: v })} multiline />
        </div>
      </div>

      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 10 }}>Distribution &amp; finance relationships</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {draft.relationships.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #F2F0EB', borderRadius: 9 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, flex: 'none', minWidth: 130 }}>{r.name}</span>
            <span style={{ fontSize: 12.5, color: '#5E6066', flex: 1 }}>{r.role}</span>
            <ProvenanceBadge provenance={r.provenance} size="sm" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 3: Wire `onIdentity` type + currency in `ProducerProfileClient.tsx`**

In `src/app/afx/producer/ProducerProfileClient.tsx`:

(a) Add an import near the other `@/lib/afx` imports:

```tsx
import { currencyForCountry } from '@/lib/afx/countries';
```

(b) Replace the `onIdentity` definition:

```tsx
  const onIdentity = (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location'>>) =>
    setDraft((d) => ({ ...d, ...patch }));
```

with (adds `producerType` and `country` to the accepted patch keys):

```tsx
  const onIdentity = (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location' | 'producerType' | 'country'>>) =>
    setDraft((d) => ({ ...d, ...patch }));
```

(c) Replace the currency line:

```tsx
  const localCurrency: AfxCurrency = (draft.location ?? '').trim().endsWith('ZA') ? 'ZAR' : 'USD';
```

with:

```tsx
  const localCurrency: AfxCurrency = currencyForCountry(draft.country);
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 5: Production build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/afx/producer/cockpitUi.tsx src/components/afx/producer/IdentityPanel.tsx src/app/afx/producer/ProducerProfileClient.tsx
git commit -m "feat(afx): identity type toggle + country dropdown + currency-from-country"
```

---

### Task 3: Type-aware K2 gate label in Account & Visibility

**Files:**
- Modify: `src/components/afx/producer/AccountVisibility.tsx`

**Interfaces:**
- Consumes: `producerTypeOf`, `operatorGateLabel` from `@/lib/afx/constants` (Task 1).

- [ ] **Step 1: Make the K2 gate copy type-aware**

In `src/components/afx/producer/AccountVisibility.tsx`, add an import below the existing `import { deriveVisibility, VISIBILITY_META } from '@/lib/afx/constants';` line — or extend that line — so it reads:

```tsx
import { deriveVisibility, VISIBILITY_META, producerTypeOf, operatorGateLabel } from '@/lib/afx/constants';
```

Then inside `AccountVisibility`, just below the existing `const vMeta = VISIBILITY_META[visibility];` line, add:

```tsx
  const k2 = operatorGateLabel(producerTypeOf(draft));
```

And replace the K2 `<Gate .../>` element:

```tsx
        <Gate
          code="K2"
          title="Legal entity / structure"
          note="An operating entity must be in place. Missing caps your rating band."
          on={draft.entityK2}
          onToggle={onToggleK2}
        />
```

with:

```tsx
        <Gate
          code="K2"
          title={k2.title}
          note={k2.note}
          on={draft.entityK2}
          onToggle={onToggleK2}
        />
```

Leave the K4 gate unchanged.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 3: Production build**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/afx/producer/AccountVisibility.tsx
git commit -m "feat(afx): type-aware K2 gate label (individual vs entity)"
```

---

## Post-implementation manual verification (controller, after deploy)

On prod `/afx/producer`:
- Default (existing producer) still shows Company layout: Producer/company, Legal entity, Country, City, Bio; K2 gate reads "Legal entity / structure."
- Toggle to **Individual / freelance**: Legal-entity field disappears, name relabels to "Producer name", K2 gate reads "Individual / professional standing." Toggle back restores Company.
- Set Country = South Africa → exact-figure currency shows ZAR; set Kenya (or leave unset) → USD.
- Reload preserves the toggle + country (autosaved into the profile blob).

## Self-Review

- **Spec coverage:** producer type toggle (default company) → Task 1 (`producerType` + `producerTypeOf`) + Task 2 (toggle UI); type-aware identity fields (hide Legal entity for individuals) → Task 2; structured Country + currency (ZA→ZAR) → Task 1 (`countries.ts`) + Task 2 (dropdown + `currencyForCountry` wiring); type-aware K2 gate (reuse `entityK2`) → Task 1 (`operatorGateLabel`) + Task 3 (AccountVisibility) + Task 1 (`nextBestActions`); no migration / profile-blob storage → no persistence change in any task. Phase-1 spec sections all mapped; Phase 2 (individual vetting, migration) intentionally excluded.
- **Placeholder scan:** none — every code step is complete, including the full 54-country list.
- **Type consistency:** `ProducerType` defined in Task 1 `types.ts`, imported in Task 2 IdentityPanel and used by `producerTypeOf`/`operatorGateLabel`. `onIdentity` patch keys extended identically in IdentityPanel's `Props` (Task 2 Step 2) and `ProducerProfileClient` (Task 2 Step 3) — both add `'producerType' | 'country'`. `InlineSelect` options type `readonly { code: string; name: string }[]` matches `Country` shape from `countries.ts`. `currencyForCountry` returns `AfxCurrency`, matching the `localCurrency` annotation.
