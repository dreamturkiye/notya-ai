-- 210 — HASTA-MODULLERI (Kaan, 2026-11-24): Sağlığım modules resolved PER PATIENT ("a hypertension-only patient needs no
-- diabetic charts"). Resolver: lib/saglikEvi/moduller.ts (doctor switches > diagnoses / drugs on the file > patient's
-- choice > branş default). CORE: every one of the 30 medical branches and the 10 Özel Branşlar.
--
--   ev_tercihler.moduller   the PATIENT's own choices: { eklenen: [kilo|nabiz|su|bel], cikarilan: [module keys] }
--                           (optional modules added / branş-default modules switched off). The resolver never lets it
--                           remove a doctor-enabled or diagnosis / drug-derived module.
--
-- The DOCTOR's per-patient switches need no schema change: they live in ev_hedefler.ayarlar.moduller ({ acik, kapali }),
-- the existing per (doctor_id, patient_id) row (unique, RLS on, doctor SELECT own rows of own patients via the restrictive
-- patient-ownership policy, writes service role only — migration 208), written by PATCH /api/doktor/hastalar/[id]/ev-verisi
-- { modul } after hastaSahibiMi.
--
-- Access is unchanged from 208 (hasta-izolasyon): ev_tercihler keeps RLS on, the doctor's select-own-rows policy and the
-- restrictive patient-ownership policy; anon has no grant; writes are service role only (the patient reaches the column
-- only through /api/portal/hasta/[token]/gunluk after the PIN unlock, scoped by the token's doctor_id AND patient_id).
-- Additive and backward compatible: until this runs, everything works except saving the patient's own module choice
-- (that one upsert fails with a 500; the app reads the column with select('*') so a missing column is simply absent).
-- Applied to production on 2026-11-24 (Kaan's day; Supabase migration log name: 210_hasta_modulleri) and verified: column
-- jsonb default {}, RLS on, policies unchanged (doktor kendi satirlari + restrictive hasta sahipliği), anon no select.

alter table public.ev_tercihler add column if not exists moduller jsonb not null default '{}'::jsonb;
alter table public.ev_tercihler drop constraint if exists ev_tercihler_moduller_nesne;
alter table public.ev_tercihler add constraint ev_tercihler_moduller_nesne check (jsonb_typeof(moduller) = 'object' and pg_column_size(moduller) <= 2048);

-- RLS / grants re-asserted (no change intended; keeps 208's posture explicit for the new column).
alter table public.ev_tercihler enable row level security;
revoke insert, update, delete, truncate, references, trigger on public.ev_tercihler from anon, authenticated;
revoke select on public.ev_tercihler from anon;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('210', '210_hasta_modulleri.sql', null, now(), false,
  'HASTA-MODULLERI: ev_tercihler.moduller jsonb (patient module choices); doctor switches in ev_hedefler.ayarlar.moduller (no schema change); RLS unchanged')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select column_name, data_type, column_default from information_schema.columns where table_name = 'ev_tercihler' and column_name = 'moduller';
--   select relrowsecurity from pg_class where relname = 'ev_tercihler';
--   select policyname, permissive, cmd from pg_policies where tablename = 'ev_tercihler' order by 1;
