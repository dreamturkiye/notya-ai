-- Rollback of 186: removes the founder exemption flag (every account is then under the trial's limits again).
begin;
set local lock_timeout = '4s';
alter table public.ulke_hesaplari drop column if exists ozel_muafiyet;
delete from schema_migrations where version = '186';
commit;
