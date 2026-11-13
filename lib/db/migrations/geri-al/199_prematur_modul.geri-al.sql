-- Rollback for 199_prematur_modul.sql (manual, never automatic). Drops prematurity-module data: export first if any was entered.
drop table if exists public.pedi_prematur_kayit;
alter table public.bebek_kartlari drop column if exists erken_dogum_ozeti;
alter table public.gebelikler drop column if exists erken_dogum;
delete from schema_migrations where version = '199';
