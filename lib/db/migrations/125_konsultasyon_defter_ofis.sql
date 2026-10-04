-- 125 — KONSULTASYONLAR-02 (2026-10-04): Defter ofis telefonu.
--
-- telefon = cep; ofis_telefon = muayenehane / sabit hat.
-- Genel notlar zaten not_metni kolonunda (hekim + sekreter görür).
-- ADDITIVE only. Idempotent.

alter table public.konsultasyon_defter add column if not exists ofis_telefon text;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('125', '125_konsultasyon_defter_ofis.sql', null, now(), false,
  'KONSULTASYONLAR-02: konsultasyon_defter.ofis_telefon')
on conflict (version) do nothing;
