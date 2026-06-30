-- AFX S1 Foundation — additive only. New afx_* objects, no existing table touched.

create table public.afx_invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users
);
alter table public.afx_invites enable row level security;
-- intentionally NO client policies → unreadable/unwritable by anon/authenticated.

create table public.afx_producers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users on delete cascade,
  profile    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.afx_producers enable row level security;
create policy afx_producers_sel on public.afx_producers
  for select using (auth.uid() = user_id);
create policy afx_producers_upd on public.afx_producers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- insert is performed only by redeem_afx_invite() (security definer); no client insert policy.

create table public.afx_projects (
  id          uuid primary key,
  producer_id uuid not null references public.afx_producers on delete cascade,
  status      text not null check (status in ('case_study','live','archived')),
  deal_ref    text,
  body        jsonb not null,
  exact       jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index afx_projects_producer_idx on public.afx_projects (producer_id);
create index afx_projects_producer_status_idx on public.afx_projects (producer_id, status);
alter table public.afx_projects enable row level security;
create policy afx_projects_sel on public.afx_projects for select
  using (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()));
create policy afx_projects_ins on public.afx_projects for insert
  with check (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()));
create policy afx_projects_upd on public.afx_projects for update
  using (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()));
create policy afx_projects_del on public.afx_projects for delete
  using (exists (select 1 from public.afx_producers p where p.id = producer_id and p.user_id = auth.uid()));

-- Activation: idempotent, invite-gated. Runs as definer so it can read afx_invites
-- and insert afx_producers without exposing either to the client.
create or replace function public.redeem_afx_invite()
returns public.afx_producers
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_row public.afx_producers;
  v_default jsonb := jsonb_build_object(
    'name','', 'company','', 'bio','', 'careerStage','',
    'ratingBand','D', 'relationships', '[]'::jsonb,
    'entityK2', false, 'consentK4', false, 'ndaSigned', false
  );
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_row from public.afx_producers where user_id = v_uid;
  if found then return v_row; end if;                       -- already activated
  if not exists (select 1 from public.afx_invites where email = v_email and redeemed_at is null) then
    return null;                                            -- not invited
  end if;
  insert into public.afx_producers (user_id, profile) values (v_uid, v_default) returning * into v_row;
  update public.afx_invites set redeemed_at = now(), redeemed_by = v_uid
    where email = v_email and redeemed_at is null;
  return v_row;
end; $$;
revoke all on function public.redeem_afx_invite() from public;
grant execute on function public.redeem_afx_invite() to authenticated;
