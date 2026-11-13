-- Rollback of 197_ayse_ogrenme_v3.sql (AYSE-OGRENME-V3). Drops the correction-metric table and the two clinic shared-style
-- tables. The application treats the missing tables as "feature off": the ivme panel shows its empty state, the clinic
-- toggle reports no membership, and the note pipeline never reads the pool (every read is in try/catch). Safe at any time.
begin;
set local lock_timeout = '4s';
drop table if exists public.klinik_ortak_uslup;
drop table if exists public.klinik_uslup_katilim;
drop table if exists public.doktor_ogrenme_metrik;
delete from schema_migrations where version = '197';
commit;
