-- NOTYA-JINE-OFIS (2026-09-16) — Unified office gynecology visit SOAP on jine_vizitler.
-- Additive only. Live jine_* tables remain CRUD truth; specialty_records.payload is not a store.
-- Numbered 034 (next free after 033_dahiliye). Open PR #255 yenidoğan uses 029, which already
-- landed on main as 029_kd_dogum_spine.sql — no collision.

alter table jine_vizitler add column if not exists soap jsonb not null default '{}'::jsonb;
alter table jine_vizitler add column if not exists kontrol_tarihi date;
alter table jine_vizitler add column if not exists kontrol_neden text;

comment on column jine_vizitler.soap is
  'Ofis jine SOAP: hikaye, muayene, degerlendirme/plan, tarama. Clinic-fit additive jsonb; not specialty_records.payload.';
comment on column jine_vizitler.kontrol_tarihi is
  'Sonraki kontrol tarihi (jine ofis). Gebelik TDT/GA buraya yazılmaz.';
comment on column jine_vizitler.kontrol_neden is
  'Kontrol nedeni (Pap tekrarı, RİA ip, HRT yıllık, semptom…).';

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values (
  '034',
  '034_jine_ofis_vizit.sql',
  null,
  now(),
  false,
  'Jine ofis vizit SOAP jsonb + kontrol tarihi/neden on jine_vizitler. Additive. 034 after dahiliye 033; #255 yenidoğan 029 already used by dogum spine.'
)
on conflict (version) do nothing;
