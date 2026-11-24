-- Rollback of 204_degerlendirme_anahtarlari.sql
drop table if exists public.degerlendirme_anahtarlari;
delete from schema_migrations where version = '204';
