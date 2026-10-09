-- ONE DATABASE PER COUNTRY (Kaan, 2026-10-09) — READ FIRST. This file is run only on a country's OWN database, never on
-- the Turkish one. A new country's database is created with the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql),
-- which is generated from this file and its neighbours (lib/db/ulke/gocler.json); this file is not run by hand any
-- more. Where the comments below speak of a "shared database" or of Türkiye's tables, they describe the plan of
-- 2026-10-08, which this decision replaced. What holds now: docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
-- 131 NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08) · reshaped for the shared database by NOTYA-ULKE-SABLON-01
--
-- 1. ulke_hastalar        THE PATIENT of a country build. Same shape a country build always wrote (name, birth
--                         date, sex and phone encrypted with lib/security/encryption.ts) — but in a table of its own:
--                         in a shared database a country's patients must never sit in Türkiye's `patients`, where
--                         Türkiye's own screens and scheduled jobs would meet them.
-- 2. hasta_ulke_bilgisi   what a country records beside that (docs/COUNTRY-PACK-CHECKLIST.md E3, E7, G5): the
--                         patronymic as its own field, the PATIENT'S OWN LANGUAGE, an optional national identity
--                         number (free text, encrypted, not validated).
--
-- NEW tables only. `patients` is not read, written or altered. Rules of the shared database: migration 130.
--
-- Patient isolation (.cursor/skills/hasta-izolasyon/SKILL.md), unchanged in strictness and now also in the keys:
--   - server routes use the service role and scope every statement by country AND doctor_id;
--   - a patient belongs to (country, doctor): the foreign key of every table that names a patient is
--     (ulke, doctor_id, patient_id), so the database refuses a row that points at another doctor's patient or at a
--     patient of another country;
--   - row-level security, second line: a signed-in doctor may read only rows that carry their own id and their
--     session's country, and cannot write from the browser; plus the RESTRICTIVE patient-ownership policy in the
--     shape of migration 052 (the patient of the row must be the caller's patient).
--
-- Safe to run twice. One transaction. NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- ── 1. Patients ─────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_hastalar (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  -- AES-256-GCM (lib/security/encryption.ts), the country deployment's own key.
  name_encrypted text,
  dob_encrypted text,
  gender_encrypted text,
  phone_encrypted text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_hastalar_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  -- What visits, appointments and the side tables point at: a patient TOGETHER WITH its country and its doctor.
  constraint ulke_hastalar_sahip_tekil unique (ulke, doctor_id, id)
);

create index if not exists ulke_hastalar_doctor_idx on public.ulke_hastalar (ulke, doctor_id, created_at desc);

alter table public.ulke_hastalar enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.ulke_hastalar;
create policy "hasta_izolasyon_kendi_satiri" on public.ulke_hastalar
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

revoke all on table public.ulke_hastalar from anon, authenticated;
grant select on table public.ulke_hastalar to authenticated;

-- ── 2. What the country records beside the patient ──────────────────────────────────────────────────────────
create table if not exists public.hasta_ulke_bilgisi (
  patient_id uuid primary key,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted.
  ota_ismi_encrypted text,
  -- ISO 639 language code of the patient (uz, ru, en, …): one of the country pack's patient languages.
  dil text not null check (dil ~ '^[a-z]{2,3}$'),
  ulusal_kimlik_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_ulke_bilgisi_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

create index if not exists hasta_ulke_bilgisi_doctor_idx on public.hasta_ulke_bilgisi (ulke, doctor_id);

alter table public.hasta_ulke_bilgisi enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.hasta_ulke_bilgisi;
create policy "hasta_izolasyon_kendi_satiri" on public.hasta_ulke_bilgisi
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.hasta_ulke_bilgisi;
create policy "hasta_izolasyon_hasta_sahipligi" on public.hasta_ulke_bilgisi as restrictive for all to authenticated, anon
  using (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()))
  with check (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()));

revoke all on table public.hasta_ulke_bilgisi from anon, authenticated;
grant select on table public.hasta_ulke_bilgisi to authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('131', '131_hasta_ulke_bilgisi.sql', null, now(), false,
  'NOTYA-ULKE-SABLON-01: country patients (ulke_hastalar) + per-patient patronymic, language and optional identity number (new tables, country and doctor in every key, owner-and-country-only, restrictive patient ownership)')
on conflict (version) do nothing;

commit;
