-- Rollback of 211_ilac_ic_not.sql (doctors' internal medication notes are dropped; notlar is untouched).
-- The anon revoke is NOT reverted on purpose: RLS never gave anon a row of this table.
alter table public.hasta_ilaclar drop constraint if exists hasta_ilaclar_ic_not_uzunluk;
alter table public.hasta_ilaclar drop column if exists ic_not;
comment on column public.hasta_ilaclar.notlar is null;
delete from schema_migrations where version = '211';
