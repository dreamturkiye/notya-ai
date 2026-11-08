-- Rollback of 192: removes the once-only trial-signup flag (the e-mail would then be sent again on the next role change).
begin;
set local lock_timeout = '4s';
alter table public.ulke_hesaplari drop column if exists deneme_bildirim_at;
delete from schema_migrations where version = '192';
commit;
