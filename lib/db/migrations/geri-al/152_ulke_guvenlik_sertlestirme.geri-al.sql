-- Rollback of 152: restores the previous (weaker) state. Only use if a country build is found to need browser-role access to these functions.
begin;
set local lock_timeout = '4s';
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname in ('vault_get_blob','vault_put_blob','log_audit_event') loop
    execute format('grant execute on function %s to anon, authenticated', r.sig);
  end loop;
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname in ('ulke_hesaplari_ulke_kilidi','log_audit_event','update_updated_at','set_updated_at_column','enforce_hekim_tani_referansi','notya_guvenli_uuid','randevu_v2_cakisma_kontrol','randevu_olaylari_salt_ekle','ses_profili_sayac_ekle','users_country_kilidi') loop
    execute format('alter function %s reset search_path', r.sig);
  end loop;
  if to_regclass('public.v_hiz_gunluk') is not null then
    execute 'alter view public.v_hiz_gunluk set (security_invoker = false)';
  end if;
end $$;
delete from schema_migrations where version = '152';
commit;
