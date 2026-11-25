-- 211 — ILAC-NOTU-AYRIMI (Kaan, 2026-11-25): a medication's single free-text "Not" (hasta_ilaclar.notlar) was shown
-- verbatim to the patient on Sağlığım › İlaçlarım, and the doctor's form never said so. It is now split in two:
--
--   hasta_ilaclar.notlar   "Hastaya not" — unchanged column, unchanged data, still shown on Sağlığım (the form now says so).
--   hasta_ilaclar.ic_not   "İç not" — NEW, nullable text, seen only by the doctor who owns the row. Never selected by the
--                          portal bundle (app/api/portal/hasta/[token]/route.ts uses an explicit column list without it),
--                          never in a PDF / export / e-posta / WhatsApp share text / patient-facing Ayşe output.
--
-- Existing notlar values are NOT moved or copied: they stay exactly where they are and remain visible to the patient
-- (no silent change). CORE: every one of the 30 medical branches and the 10 Özel Branşlar (one shared table).
--
-- Access: unchanged posture. RLS stays on with the existing doctor-own-rows policies (002 "doctor sees own only",
-- 003 ilaclar_doctor: auth.uid() = doctor_id); the app reads and writes through the service role after the doctor's
-- token + hastaSahibiMi checks. anon gets no privilege on the table (RLS already returned anon nothing — this makes it
-- explicit for the new column); authenticated keeps only what 207 left it, still governed by the same RLS policies.
--
-- Additive and backward compatible: inserts that do not name ic_not (muayene onayı / reçete aktarımı, Ayşe eylemleri,
-- Klinik flows, scripts) keep working — the column is nullable with no default. MUST be applied before the code that
-- writes ic_not ships (POST/PUT /api/doktor/ilaclar would otherwise fail with "column ic_not does not exist" when a
-- doctor fills İç not; adds without an İç not still work because the route only sends the key when it is non-empty).
--
-- VERIFY (read-only):
--   select column_name, data_type, is_nullable, column_default from information_schema.columns
--     where table_schema = 'public' and table_name = 'hasta_ilaclar' and column_name = 'ic_not';
--   select relrowsecurity from pg_class where relname = 'hasta_ilaclar';
--   select grantee, privilege_type from information_schema.role_table_grants
--     where table_schema = 'public' and table_name = 'hasta_ilaclar' and grantee = 'anon';   -- expect 0 rows

alter table public.hasta_ilaclar add column if not exists ic_not text;
alter table public.hasta_ilaclar drop constraint if exists hasta_ilaclar_ic_not_uzunluk;
alter table public.hasta_ilaclar add constraint hasta_ilaclar_ic_not_uzunluk check (ic_not is null or char_length(ic_not) <= 2000);

comment on column public.hasta_ilaclar.notlar is 'Hastaya not — shown to the patient on Sağlığım › İlaçlarım.';
comment on column public.hasta_ilaclar.ic_not is 'İç not — doctor only. Never in any portal / patient / export / share payload (ILAC-NOTU-AYRIMI, 211).';

-- RLS / grants re-asserted (no change to the doctor's row access).
alter table public.hasta_ilaclar enable row level security;
revoke all on table public.hasta_ilaclar from anon;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('211', '211_ilac_ic_not.sql', null, now(), false,
  'ILAC-NOTU-AYRIMI: hasta_ilaclar.ic_not (doctor-only internal note, nullable text <= 2000); notlar unchanged (Hastaya not); RLS on, anon no privilege')
on conflict (version) do nothing;
