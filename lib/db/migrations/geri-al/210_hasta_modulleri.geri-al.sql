-- Rollback of 210_hasta_modulleri.sql (the patient's module choices are dropped; the app falls back to no choices).
alter table public.ev_tercihler drop constraint if exists ev_tercihler_moduller_nesne;
alter table public.ev_tercihler drop column if exists moduller;
delete from schema_migrations where version = '210';
