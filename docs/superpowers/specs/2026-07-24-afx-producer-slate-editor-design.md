# AFX Producer Cockpit — Slate Editor Design

**Date:** 2026-07-24
**Status:** Approved (design), pending implementation plan
**Area:** Producer cockpit (`/afx/producer`) — new "Portfolios" (Slate) editing zone
**Builds on:** the `Slate`/`RiskTier` types and funder-marketplace slate rendering already shipped (see `docs/superpowers/specs/2026-07-24-afx-funder-marketplace-slate-design.md`, `docs/superpowers/plans/2026-07-24-afx-funder-marketplace-slate.md`); the existing cockpit draft/autosave architecture (`ProducerProfileClient.tsx`, `useDebouncedAutosave`, `persistProfileAction`); the existing Live Slate / Case Study zone+drawer pattern (`LiveSlateZone.tsx`+`LiveProjectDrawer.tsx`, `TrackRecordZone.tsx`+`CaseStudyDrawer.tsx`).

## Problem

The funder-facing Slate feature shipped with no way for a producer to actually create one — `Slate` objects can only be inserted directly into `afx_producers.profile` via the Supabase dashboard. This spec adds the producer-facing editor so a producer can curate a subset of their live projects into a named, self-reported portfolio through the cockpit UI, using the same draft/autosave architecture every other cockpit section already uses.

## Confirmed decisions

1. **Placement:** a new "Portfolios" zone sits between the existing `TrackRecordZone` and `LiveSlateZone` in `ProducerProfileClient.tsx` — slates are shown before the full live-project list, matching the funder view's ordering (slate cards render above standalone projects there too).
2. **No database migration.** `ProducerProfile.slates?: Slate[]` already exists (shipped in the funder-marketplace slice) and flows through the `afx_producers.profile` jsonb column automatically via the `...profile` spread in `profileToRows`/`rowsToProfile` — confirmed by re-reading `src/lib/afx/persistence.ts`. The existing RLS policy `afx_producers_upd` already lets a producer update their own row's `profile` column. No new table, column, or policy.
3. **Membership picker is a checklist**, not an add-one-at-a-time picker: the slate drawer lists every one of the producer's current live (non-archived) projects as a checkbox. Checking a project reveals an inline risk-tier `<select>` (`low` / `mid` / `high-upside`) for it. This is the full live-project set (`liveProjects(draft)`, same as `LiveSlateZone` shows) — not filtered to funder-screenable projects, since screenability is a funder-side concept (`meetsCorePackaging`) the producer editing a slate shouldn't have to reason about; the funder-marketplace mapper already silently drops non-screenable members from a slate's rollup downstream.
4. **At-most-one-slate is enforced in the UI**, not just documented as a data invariant. When editing a slate, a project that's already a member of a *different* slate renders as a disabled checkbox with a note ("Already in [Slate name]"). This makes the invariant `Slate.projectIds` types.ts already documents ("A live project belongs to at most one Slate") actually true, closing the gap the Task 1 code review flagged as unenforced.
5. **Minimum slate size: 2 projects.** A slate cannot be saved with 0 or 1 members — enforced client-side in the drawer (Save button disabled + inline message below 2 checked projects), mirroring the existing "you're 1 project from going live" gating copy pattern already used elsewhere in the cockpit for a structurally identical reason (a single-item "portfolio" undermines the feature's own pitch).
6. **Econ/text fields follow existing field-level conventions exactly**, no new input paradigm:
   - `name`, `genreStrategy`, `distributionStrategy`: free-text `<input>`.
   - `stage`: `<select>` over the fixed `'packaging' | 'financing' | 'ready'` enum (same `Select` helper `CaseStudyDrawer`/`LiveProjectDrawer` already use).
   - `totalBudgetBand`, `askBand`, `targetIRR`, `portfolioROI`: free-text `<input>` with a placeholder example (e.g. `"e.g. R50–100M"`), provenance forced to `'self'` on every edit — identical to how `budgetBand` works in `LiveProjectDrawer` today. Each renders its `ProvenanceBadge` next to the input, same layout.
   - `securedBand`: `<select>` reusing the existing `FUNDING_SECURED_BANDS` controlled options (`src/lib/afx/constants.ts`) — conceptually the same "how much financing is secured" question `ProjectAsk.fundingSecuredBand` already asks, so it gets the same controlled vocabulary rather than free text.
   - `evidence`: exact reuse of `CaseStudyDrawer`'s tagged-evidence editor (add/update/remove helpers, `Select` over `EVIDENCE_CLAIM_LABELS`, `RemoveBtn`, `+ Add link` `GhostButton`).
7. **No new save path.** Slate edits flow through the exact same mechanism as every other cockpit edit: they patch local `draft` state, the existing `useDebouncedAutosave(draft, persistProfileAction)` hook fires ~800ms after the last change, and `persistProfileAction` persists the whole `ProducerProfile` (slates included, since it's not excluded from the `profileToRows` destructure). No new server action, no new autosave hook, no per-slate save button beyond the drawer's own explicit "Save" (which just closes the drawer and lets autosave pick up the change — same as `LiveProjectDrawer`/`CaseStudyDrawer` today).
8. **Deleting a slate** removes it from `draft.slates`; it does **not** touch or archive the member projects themselves — they simply become standalone again (exactly what the funder-marketplace mapper already does for any project not claimed by a slate).
9. **No cleanup of stale project ids.** If a project inside a slate is later archived, its id is left in `slate.projectIds` (not auto-removed) — this is harmless because the funder-marketplace mapper (already shipped) filters `slate.projectIds` down to currently-screenable live projects before rendering. A future edit to that slate in the drawer will simply show the archived project absent from the "currently live" checklist (it's not in `liveProjects(draft)` anymore, so it won't appear as a checkable option, but its stale id stays in the array until the producer re-saves the slate, at which point the drawer writes back only the checked ids). This mirrors how the existing codebase already tolerates similar staleness elsewhere (e.g. `dealRef` pointing at a project that's since changed).

## Out of scope (explicitly deferred)

- Any change to the funder-marketplace rendering or `funderMarketplace.ts` pure module — that shipped already and is untouched by this spec.
- Multi-producer pooled slates (still deferred from the original design).
- Server-side validation of slate membership/minimum-size rules — this spec is client-side (drawer) enforcement only, consistent with how the rest of the cockpit works today (e.g. archiving your last screenable project is a client-side confirm dialog, not a server rejection).
- A slate-level "submit for vetting" workflow — slate econ fields stay self-reported/unverified in this slice, same status quo as the funder-marketplace slice shipped with.

## Data model

No new types. Reuses `Slate`/`RiskTier` from `src/lib/afx/types.ts` (already shipped):

```ts
export type RiskTier = 'low' | 'mid' | 'high-upside';

export interface Slate {
  id: string;
  name: string;
  genreStrategy: string;
  stage: 'packaging' | 'financing' | 'ready';
  projectIds: string[];
  riskTiers: Record<string, RiskTier>;
  totalBudgetBand: Provenanced<string>;
  securedBand: string;
  askBand: Provenanced<string>;
  targetIRR: Provenanced<string>;
  portfolioROI: Provenanced<string>;
  distributionStrategy: string;
  evidence?: EvidenceLink[];
}
```

`ProducerProfile.slates?: Slate[]` (already shipped).

## Component structure

### `src/components/afx/producer/SlatesZone.tsx` (new)

Mirrors `LiveSlateZone.tsx`'s shape exactly:

```ts
interface Props {
  draft: ProducerProfile;
  onAddSlate: () => void;
  onOpenSlate: (id: string) => void;
  onRemoveSlate: (id: string) => void;
}
```

Renders inside a `SectionCard` (reusing the existing primitive from `cockpitUi.tsx`) titled "Portfolios", with a `+ New slate` `GhostButton` action. Empty state (`draft.slates` empty/undefined) shows a short explainer ("Group live projects into a portfolio to pitch funders diversification, not a single bet.") rather than a dashed empty box like `LiveSlateZone`'s (that empty state is about *going live at all*; this one is about an optional additional step, so it reads softer). Each slate renders as a compact card: name, `{genreStrategy} · {volume} films`, stage chip, Edit/Delete `GhostButton`s — visually consistent with `LiveProjectCard`'s card chrome (border, radius, padding) but without the packaging/incentive rows a live-project card has, since a slate card here just needs to be a summary + entry point into the drawer.

### `src/components/afx/producer/SlateDrawer.tsx` (new)

Mirrors `LiveProjectDrawer.tsx`'s shape:

```ts
interface Props {
  initial: Slate;
  isNew: boolean;
  liveProjects: Project[];        // draft's current live (non-archived) projects
  otherSlates: Slate[];           // draft.slates minus this one, for the exclusivity check
  onSave: (slate: Slate) => void;
  onClose: () => void;
  onRemove?: () => void;          // absent when isNew
}
```

Internal local `slate` state (`useState(() => structuredClone(initial))`), same pattern as `LiveProjectDrawer`'s `proj` state. Fields, top to bottom: Name, Genre strategy, Stage (`Select`), the four provenanced econ inputs + `securedBand` dropdown (per decision #6), Distribution strategy, Evidence & links (per decision #6), then Member projects — the checklist:

```tsx
{liveProjects.map((p) => {
  const claimedBy = otherSlates.find((s) => s.projectIds.includes(p.id));
  const checked = slate.projectIds.includes(p.id);
  return (
    <div key={p.id}>
      <input type="checkbox" disabled={!!claimedBy && !checked} checked={checked} onChange={...} />
      <span>{p.title}</span>
      {claimedBy ? <span className="hint">Already in {claimedBy.name}</span> : null}
      {checked ? (
        <Select value={slate.riskTiers[p.id] ?? 'mid'} options={['low','mid','high-upside']}
          onChange={(tier) => setSlate((s) => ({ ...s, riskTiers: { ...s.riskTiers, [p.id]: tier } }))} />
      ) : null}
    </div>
  );
})}
```

Checking a project adds its id to `slate.projectIds` and defaults its `riskTiers` entry to `'mid'`; unchecking removes both the id and its `riskTiers` entry. Save button is disabled (with an inline "Select at least 2 projects" message) while `slate.projectIds.length < 2`, per decision #5.

### `src/components/afx/producer/ProducerProfileClient.tsx` (modified)

New state: `const [editingSlate, setEditingSlate] = useState<{ slate: Slate; isNew: boolean } | null>(null);`

New handlers, matching the existing `onAddCaseStudy`/`onSaveCaseStudy`/`onRemoveCaseStudy` shape exactly:

```ts
const onAddSlate = () => setEditingSlate({ slate: newSlate(), isNew: true });
const onEditSlate = (id: string) => {
  const found = (draft.slates ?? []).find((s) => s.id === id);
  if (found) setEditingSlate({ slate: structuredClone(found), isNew: false });
};
const onSaveSlate = (slate: Slate) => {
  setDraft((d) => {
    const list = d.slates ?? [];
    const exists = list.some((s) => s.id === slate.id);
    return { ...d, slates: exists ? list.map((s) => (s.id === slate.id ? slate : s)) : [...list, slate] };
  });
  setEditingSlate(null);
};
const onRemoveSlate = (id: string) => {
  setDraft((d) => ({ ...d, slates: (d.slates ?? []).filter((s) => s.id !== id) }));
  setEditingSlate(null);
};
```

`newSlate()` (new helper in a new `src/lib/afx/slate.ts`, sibling to the existing `src/lib/afx/caseStudy.ts` which exports `newCaseStudy()` the same way) returns a fresh `Slate` with a generated id and sensible defaults (`stage: 'packaging'`, empty bands, empty `projectIds`/`riskTiers`).

`<SlatesZone draft={draft} onAddSlate={onAddSlate} onOpenSlate={onEditSlate} onRemoveSlate={onRemoveSlate} />` renders between `<TrackRecordZone .../>` and `<LiveSlateZone .../>`. `{editingSlate ? <SlateDrawer initial={editingSlate.slate} isNew={editingSlate.isNew} liveProjects={liveProjects(draft)} otherSlates={(draft.slates ?? []).filter((s) => s.id !== editingSlate.slate.id)} onSave={onSaveSlate} onClose={() => setEditingSlate(null)} onRemove={editingSlate.isNew ? undefined : () => onRemoveSlate(editingSlate.slate.id)} /> : null}` renders alongside the existing `editing`/`editingLive` drawers at the bottom of the component.

## Error handling / edge cases

- Zero live projects: the checklist in `SlateDrawer` (and the "+ New slate" flow generally) is still reachable, but with nothing to check, the ≥2 minimum can never be met — the drawer's inline message covers this ("Select at least 2 projects") without needing a special-cased empty state.
- A slate whose only two members both get archived after the slate was saved: the slate silently stops appearing on the funder marketplace (already-shipped mapper behavior — zero screenable members ⇒ dropped), but stays visible and editable in the cockpit `SlatesZone` (producer can still see/edit/delete it; nothing forces cleanup).
- Renaming/deleting a slate never touches the underlying `Project` objects in `draft.slate` — this is purely a `draft.slates` array operation, never a `draft.slate` (project list) mutation.

## Testing

Same constraints as the funder-marketplace slice: no test runner exists in this repo. Verification is `npx tsc --noEmit -p tsconfig.json`, `npx next build`, plus a manual browser walkthrough in the running dev server (this feature, unlike the funder-marketplace render, *is* directly testable end-to-end without seed data — the producer cockpit is the producer's own account, reachable via the existing `/afx/producer` dev flow) — create a producer, add 2+ live projects, create a slate, verify it autosaves, verify it appears correctly on `/afx/marketplace` (staff view) using the already-shipped funder-marketplace rendering.
