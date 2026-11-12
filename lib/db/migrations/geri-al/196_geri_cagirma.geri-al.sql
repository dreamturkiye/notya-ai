-- Rollback of 196_geri_cagirma.sql (GERI-CAGIRMA-01). Drops the three recall tables and everything that hangs on
-- them (indexes, row rules). No other table was changed by 196. The application treats the missing tables as
-- "feature off" (lib/geriCagirma/README.md), so this can be run at any time.
begin;
set local lock_timeout = '4s';
drop table if exists public.geri_cagirma_aylik;
drop table if exists public.geri_cagirma_ayarlari;
drop table if exists public.geri_cagirma_kayitlari;
delete from schema_migrations where version = '196';
commit;
