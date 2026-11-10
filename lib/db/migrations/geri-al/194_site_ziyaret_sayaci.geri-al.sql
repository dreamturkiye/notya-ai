-- Rollback of 194: removes the public-site visit counter (its aggregates are lost; nothing else depends on it).
begin;
set local lock_timeout = '4s';
drop function if exists public.site_visit_stats(text, date);
drop function if exists public.site_visit_record(text, date, text, text, text, text);
drop function if exists public.site_visit_salt(text, date);
drop table if exists public.site_visit_salts;
drop table if exists public.site_visit_uniques;
drop table if exists public.site_visits_daily;
delete from schema_migrations where version = '194';
commit;
