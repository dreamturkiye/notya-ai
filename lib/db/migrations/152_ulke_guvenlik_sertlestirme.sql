-- 152 AU-MKT-AUDIT (Claude, 2026-10-22) — security hardening found by the Supabase advisor on the Australian project.
-- Idempotent. Applies to every country database (functions/view exist in all). No data touched.
--   1. SECURITY DEFINER functions vault_get_blob / vault_put_blob / log_audit_event were executable by anon + authenticated
--      through /rest/v1/rpc: revoked. The server uses the service role (kept).
--   2. v_hiz_gunluk was SECURITY DEFINER: now security_invoker.
--   3. Ten functions had a mutable search_path: pinned.
-- Initial compliance draft – external review later.
begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null or to_regclass('public.ulke_hastalar') is null then
    raise exception 'country migration 152 refused: public.ulke_hesaplari / public.ulke_hastalar is missing. Not a country database.';
  end if;
end $$;

do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname in ('vault_get_blob','vault_put_blob','log_audit_event') loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname in ('ulke_hesaplari_ulke_kilidi','log_audit_event','update_updated_at','set_updated_at_column','enforce_hekim_tani_referansi','notya_guvenli_uuid','randevu_v2_cakisma_kontrol','randevu_olaylari_salt_ekle','ses_profili_sayac_ekle','users_country_kilidi') loop
    execute format('alter function %s set search_path = public, pg_temp', r.sig);
  end loop;
  if to_regclass('public.v_hiz_gunluk') is not null then
    execute 'alter view public.v_hiz_gunluk set (security_invoker = true)';
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('152', '152_ulke_guvenlik_sertlestirme.sql', null, now(), false,
  'AU-MKT-AUDIT: browser roles lose EXECUTE on SECURITY DEFINER vault/audit functions; v_hiz_gunluk security_invoker; search_path pinned on 10 functions.')
on conflict (version) do nothing;

commit;
