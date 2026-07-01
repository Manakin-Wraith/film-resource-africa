-- AFX FRA review surface (S2b): staff allowlist + audit + entity verification marker.

create table if not exists public.afx_staff (
  user_id    uuid primary key references auth.users on delete cascade,
  role       text not null default 'reviewer' check (role in ('reviewer','admin')),
  created_at timestamptz not null default now()
);
alter table public.afx_staff enable row level security;
-- No client policies: only the service-role staff guard reads this table.

-- Audit: which staff member decided a submission (decided_at already exists).
alter table public.afx_vetting_submissions add column if not exists reviewed_by uuid references auth.users;

-- Entity verification marker — its OWN column, never inside the profile JSONB blob.
alter table public.afx_producers add column if not exists entity_verified_at timestamptz;

-- Anti-forge triggers: producers can write their own rows via RLS with no column/content
-- restriction, so 'verified' must be blocked at the DB for client roles. Only 'authenticated'/
-- 'anon' are guarded; service-role (staff actions) + migrations pass through.
create or replace function public.afx_guard_entity_verified()
returns trigger language plpgsql as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if new.entity_verified_at is distinct from old.entity_verified_at then
    raise exception 'entity_verified_at is FRA-only';
  end if;
  return new;
end $$;
drop trigger if exists afx_producers_guard_verified on public.afx_producers;
create trigger afx_producers_guard_verified
  before update on public.afx_producers for each row
  execute function public.afx_guard_entity_verified();

-- Block a client role from INTRODUCING provenance='verified' into a case study's body.
-- Allows verified→self (producer edits revert) and re-saving a body that retains an
-- already-verified field (so autosave of unrelated fields still works).
create or replace function public.afx_guard_verified_provenance()
returns trigger language plpgsql as $$
declare new_d jsonb; old_d jsonb; i int;
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if (new.body->'budgetBand'->>'provenance') = 'verified'
     and (old.body->'budgetBand'->>'provenance') is distinct from 'verified' then
    raise exception 'verified provenance is FRA-only (budgetBand)'; end if;
  if (new.body->'outcomes'->'recoupment'->>'provenance') = 'verified'
     and (old.body->'outcomes'->'recoupment'->>'provenance') is distinct from 'verified' then
    raise exception 'verified provenance is FRA-only (recoupment)'; end if;
  if (new.body->'outcomes'->'bondUsed'->>'provenance') = 'verified'
     and (old.body->'outcomes'->'bondUsed'->>'provenance') is distinct from 'verified' then
    raise exception 'verified provenance is FRA-only (bondUsed)'; end if;
  new_d := coalesce(new.body->'outcomes'->'distribution', '[]'::jsonb);
  old_d := coalesce(old.body->'outcomes'->'distribution', '[]'::jsonb);
  for i in 0 .. greatest(jsonb_array_length(new_d) - 1, -1) loop
    if (new_d->i->>'provenance') = 'verified'
       and (old_d->i->>'provenance') is distinct from 'verified' then
      raise exception 'verified provenance is FRA-only (distribution)'; end if;
  end loop;
  return new;
end $$;
drop trigger if exists afx_projects_guard_verified on public.afx_projects;
create trigger afx_projects_guard_verified
  before update on public.afx_projects for each row
  execute function public.afx_guard_verified_provenance();
