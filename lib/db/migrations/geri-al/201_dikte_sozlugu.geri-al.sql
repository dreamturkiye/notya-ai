-- Rollback for 201_dikte_sozlugu.sql (manual, never automatic). Drops every doctor's personal dictation vocabulary.
drop table if exists public.doktor_dikte_sozlugu;
delete from schema_migrations where version = '201';
