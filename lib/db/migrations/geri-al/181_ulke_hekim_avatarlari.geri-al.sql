-- Rollback of 181: removes the doctors' profile photos of this country database.
begin;
set local lock_timeout = '4s';
drop table if exists public.ulke_hekim_avatarlari;
delete from schema_migrations where version = '181';
commit;
