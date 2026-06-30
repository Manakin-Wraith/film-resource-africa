-- Follow-up to 20260630_afx_s1_foundation: make invite email matching case-insensitive.
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
  if not exists (select 1 from public.afx_invites where lower(email) = lower(v_email) and redeemed_at is null) then
    return null;                                            -- not invited
  end if;
  insert into public.afx_producers (user_id, profile) values (v_uid, v_default) returning * into v_row;
  update public.afx_invites set redeemed_at = now(), redeemed_by = v_uid
    where lower(email) = lower(v_email) and redeemed_at is null;
  return v_row;
end; $$;
revoke all on function public.redeem_afx_invite() from public;
grant execute on function public.redeem_afx_invite() to authenticated;
