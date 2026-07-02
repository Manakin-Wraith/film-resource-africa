-- AFX NDA read-and-sign: append-only signature audit log.
create table if not exists public.afx_nda_signatures (
  id           uuid primary key default gen_random_uuid(),
  producer_id  uuid not null references public.afx_producers on delete cascade,
  action       text not null check (action in ('signed','withdrawn')),
  signer_name  text not null,
  doc_version  text not null,
  created_at   timestamptz not null default now()
);
create index if not exists afx_nda_sig_producer_idx
  on public.afx_nda_signatures (producer_id, created_at desc);

alter table public.afx_nda_signatures enable row level security;

-- Append-only for client roles: producers may SELECT and INSERT their own rows.
-- No UPDATE/DELETE policy → authenticated/anon cannot mutate history (immutable).
-- Service-role and the on-delete cascade from afx_producers bypass RLS.
create policy afx_nda_sig_sel on public.afx_nda_signatures for select
  using (producer_id in (select id from public.afx_producers where user_id = auth.uid()));
create policy afx_nda_sig_ins on public.afx_nda_signatures for insert
  with check (producer_id in (select id from public.afx_producers where user_id = auth.uid()));
