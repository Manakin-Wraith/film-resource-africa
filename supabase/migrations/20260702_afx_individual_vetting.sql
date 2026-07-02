-- AFX individual vetting (Phase 2): CV/links verification for freelance producers.

-- Isolated columns (never inside the profile JSONB blob), parallel to the entity lanes.
alter table public.afx_producers add column if not exists individual_docs jsonb;
alter table public.afx_producers add column if not exists individual_verified_at timestamptz;

-- Extend the existing anti-forge guard to ALSO block client roles from setting
-- individual_verified_at. The trigger afx_producers_guard_verified is already bound to
-- this function (S2b migration), so replacing the function is sufficient. Service-role
-- (staff actions) + migrations pass through; 'authenticated'/'anon' are blocked.
create or replace function public.afx_guard_entity_verified()
returns trigger language plpgsql as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if new.entity_verified_at is distinct from old.entity_verified_at then
    raise exception 'entity_verified_at is FRA-only';
  end if;
  if new.individual_verified_at is distinct from old.individual_verified_at then
    raise exception 'individual_verified_at is FRA-only';
  end if;
  return new;
end $$;

-- Allow the new 'individual' vetting kind (widen the CHECK from 20260630_afx_vetting.sql).
alter table public.afx_vetting_submissions drop constraint if exists afx_vetting_submissions_kind_check;
alter table public.afx_vetting_submissions add constraint afx_vetting_submissions_kind_check
  check (kind in ('case_study','entity','individual'));

-- One open individual submission per producer (DB-level dedup, parallel to afx_vs_one_open_entity).
create unique index if not exists afx_vs_one_open_individual on public.afx_vetting_submissions (producer_id)
  where kind = 'individual' and status in ('submitted','under_review');
