-- Rollback of 214_doz_kaydi_istege_bagli.sql (patients' logging choices are dropped; dose records are untouched).
alter table public.ev_ilac_planlari drop constraint if exists ev_ilac_planlari_kayit_tutma_ck;
alter table public.ev_ilac_planlari drop column if exists kayit_tutma;
alter table public.ev_tercihler drop constraint if exists ev_tercihler_doz_kaydi_ck;
alter table public.ev_tercihler drop column if exists doz_kaydi;
alter table public.ev_tercihler drop column if exists doz_kaydi_at;
delete from schema_migrations where version = '214';
