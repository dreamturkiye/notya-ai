-- ROLLBACK of migration 151 (BYO-PAYMENTS-01). Refuses while a LIVE connection or an invoice paid in live mode exists. One transaction.
-- It reverts live mode only (the `mod` check back to 'test' and the `odeme_modu` column). It does NOT drop the payment tables: in the Australian
-- database they belong to 149/150 (geri-al/149, geri-al/150); in the other four they are left in place, empty or not, for the same reason.
-- NEVER RUN by the job that wrote it except on a throwaway database.
begin;
set local lock_timeout = '4s';
do $$
declare n bigint;
begin
  select count(*) into n from public.ulke_odeme_baglantilari where mod = 'live';
  if n > 0 then raise exception 'rollback 151 refused: % live connection(s) exist', n; end if;
  select count(*) into n from public.ulke_faturalar where odeme_modu = 'live';
  if n > 0 then raise exception 'rollback 151 refused: % invoice(s) were paid in live mode', n; end if;
end $$;
alter table public.ulke_odeme_baglantilari drop constraint if exists ulke_odeme_baglantilari_mod_check;
alter table public.ulke_odeme_baglantilari add constraint ulke_odeme_baglantilari_mod_check check (mod in ('test'));
alter table public.ulke_faturalar drop constraint if exists ulke_faturalar_odeme_modu_check;
alter table public.ulke_faturalar drop column if exists odeme_modu;
delete from schema_migrations where version = '151';
commit;
