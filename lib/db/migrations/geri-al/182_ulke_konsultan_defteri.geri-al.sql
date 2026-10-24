-- Rollback of 182: removes the doctors' colleague address books of this country database.
begin;
set local lock_timeout = '4s';
drop table if exists public.ulke_konsultan_defteri;
delete from schema_migrations where version = '182';
commit;
