-- Rollback of 215_doz_hatirlatma_istege_bagli.sql (per-medicine reminder switches and the one-time answer are dropped).
alter table public.ev_ilac_planlari drop column if exists hatirlatma_acik;
alter table public.ev_tercihler drop constraint if exists ev_tercihler_doz_secimi_ck;
alter table public.ev_tercihler drop column if exists doz_secimi;
delete from schema_migrations where version = '215';
