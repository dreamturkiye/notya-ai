-- Rollback for 216_brans_paketi.sql (BRANS-PAKETI Phase 1). Drops the four tables; the private bucket is emptied by the
-- storage API first (objects cannot be deleted with SQL), then removed.
drop table if exists public.brans_paket_foto;
drop table if exists public.brans_paket_kayit;
drop table if exists public.brans_paket_hasta;
drop table if exists public.brans_paket_sablon;
-- delete from storage.buckets where id = 'brans-paket-foto';  -- only after the objects are removed via the storage API
delete from schema_migrations where version = '216';
