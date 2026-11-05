-- 189 — HASTA-DISA-AKTAR-01 (Kaan, 2026-11-05): the export's audit row in every database.
-- audit_logs.user_id references public.users. A country account lives in auth.users and the country tables, never in
-- public.users (lib/ulke/uygulama/tablolar.ts), so migration 188's insert failed in every country database (found by the
-- smoke test of 2026-11-05: no export could be written, and the route refused to export: fail closed). The doctor is now
-- ALWAYS named in new_values.doktor_id, and user_id is set where the account is also a row of public.users (Türkiye).
-- Same definition in all seven databases. Function body only: no table, grant or policy changes.
create or replace function public.hasta_disa_aktarim_kaydet(p_doctor_id uuid, p_patient_id uuid, p_bicim text, p_ulke text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_bicim not in ('pdf', 'json') or p_ulke !~ '^[a-z]{2}$' or p_doctor_id is null then raise exception 'hasta_disa_aktarim_kaydet: input' using errcode = '22023'; end if;
  insert into public.audit_logs (user_id, action, resource_type, resource_id, new_values, success)
    values ((select u.id from public.users u where u.id = p_doctor_id), 'export', 'hasta_disa_aktarim', p_patient_id,
            jsonb_build_object('bicim', p_bicim, 'ulke', p_ulke, 'doktor_id', p_doctor_id), true);
end $$;
revoke all on function public.hasta_disa_aktarim_kaydet(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.hasta_disa_aktarim_kaydet(uuid, uuid, text, text) to service_role;
insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('189', '189_disa_aktarim_denetim_hekim.sql', null, now(), false,
  'HASTA-DISA-AKTAR-01: export audit row names the doctor in new_values; user_id only where the account is in public.users (country databases)')
on conflict (version) do nothing;
