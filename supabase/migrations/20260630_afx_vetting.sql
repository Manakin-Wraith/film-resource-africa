-- AFX submit-for-vetting (producer side): submissions table + isolated entity docs column.

create table if not exists public.afx_vetting_submissions (
  id             uuid primary key default gen_random_uuid(),
  producer_id    uuid not null references public.afx_producers on delete cascade,
  kind           text not null check (kind in ('case_study','entity')),
  target_id      uuid references public.afx_projects on delete cascade,
  status         text not null default 'submitted'
                 check (status in ('submitted','under_review','verified','changes_requested','withdrawn')),
  reviewer_notes text,
  submitted_at   timestamptz not null default now(),
  decided_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists afx_vs_producer_idx on public.afx_vetting_submissions (producer_id);
create unique index if not exists afx_vs_one_open_case on public.afx_vetting_submissions (target_id)
  where kind = 'case_study' and status in ('submitted','under_review');
create unique index if not exists afx_vs_one_open_entity on public.afx_vetting_submissions (producer_id)
  where kind = 'entity' and status in ('submitted','under_review');

alter table public.afx_vetting_submissions enable row level security;

create policy afx_vs_select_own on public.afx_vetting_submissions
  for select using (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
  );
create policy afx_vs_insert_own on public.afx_vetting_submissions
  for insert with check (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
    and status = 'submitted'
  );
create policy afx_vs_update_own on public.afx_vetting_submissions
  for update using (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
    and status in ('submitted','under_review')
  ) with check (
    producer_id in (select id from public.afx_producers where user_id = auth.uid())
    and status = 'withdrawn'
  );

alter table public.afx_producers add column if not exists entity_docs jsonb;
