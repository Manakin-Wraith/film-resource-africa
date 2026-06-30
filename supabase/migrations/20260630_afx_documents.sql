-- AFX confidential case-study documents — additive only.
-- New isolated `docs` column on afx_projects + a PRIVATE storage bucket.

alter table public.afx_projects add column if not exists docs jsonb;

-- Private bucket: public = false. No client storage policies — all access is
-- service-role-mediated through the /api/afx/documents/* routes.
insert into storage.buckets (id, name, public)
values ('afx-documents', 'afx-documents', false)
on conflict (id) do nothing;
