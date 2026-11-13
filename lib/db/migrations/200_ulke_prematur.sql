-- 200 PREMATUR-ULKE-01 (Kaan, 2026-11-13) — THE PREMATURITY RECORDS of a country build: what a paediatrician enters about a
-- preterm baby (the history the corrected age and the follow-up plan read, and the doctor's own confirmation of each
-- plan item) and what an obstetrician-gynaecologist enters about a pregnancy at risk of early birth (cervical lengths,
-- steroid courses, PPROM, magnesium, progesterone).
--
-- Migration 199 made the Türkiye tables of the same module (pedi_prematur_kayit …). They point at the Turkish `patients`
-- table, which is empty on a country database, so a country has its own, keyed like every other country table (migration 129
-- on): the country and the doctor are part of every key and of the foreign key to the patient.
--
-- ONE DATABASE PER COUNTRY. Run only on a country's OWN database, never on the Turkish one. A new country's database gets
-- it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql).
--
--   1. ulke_prematur_kayitlari      ONE ROW PER BABY (patient): the history the doctor entered (gestation at birth, birth
--                                   weight, days in intensive care, the flags the follow-up rules read) and the doctor's
--                                   own mark on each follow-up item (planned / done / not applicable, a day, a short
--                                   note). HEALTH DATA: one encrypted value (AES-256-GCM, the same helper as the rest of
--                                   a patient's data), never a column per field. The country, doctor and patient are
--                                   inside the value as well as in the key.
--   2. ulke_erken_dogum_kayitlari   ONE ROW PER PATIENT (the pregnant woman): the start of the pregnancy as entered, the
--                                   pregnancy type, the cervical-length measurements, the steroid courses, PPROM,
--                                   magnesium and progesterone as the doctor entered them. The same single encrypted
--                                   value. No dose field exists anywhere.
--
-- Both are written only by the application's own routes, which work out the plan again on the server; nothing here is a
-- result a browser sends. A trigger keeps a row from moving to another country, doctor or patient.
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles, on both tables.
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 200 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_hastalar') is null then
    raise exception 'country migration 200 refused: the patient table of a country database (public.ulke_hastalar) is missing. Run the earlier country migrations first.';
  end if;
end $$;

-- ── 1. The baby's history and the doctor's marks ─────────────────────────────────────────────────────────────
create table if not exists public.ulke_prematur_kayitlari (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts): the history and the marks, as one value.
  kayit_encrypted text not null check (char_length(kayit_encrypted) between 1 and 60000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ulke, doctor_id, patient_id),
  constraint ulke_prematur_kayitlari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

-- ── 2. The early-birth record of a pregnancy ─────────────────────────────────────────────────────────────────
create table if not exists public.ulke_erken_dogum_kayitlari (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  kayit_encrypted text not null check (char_length(kayit_encrypted) between 1 and 60000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ulke, doctor_id, patient_id),
  constraint ulke_erken_dogum_kayitlari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

-- The cohort lists one doctor's rows, most recently changed first.
create index if not exists ulke_prematur_kayitlari_hekim_idx on public.ulke_prematur_kayitlari (ulke, doctor_id, updated_at desc);
create index if not exists ulke_erken_dogum_kayitlari_hekim_idx on public.ulke_erken_dogum_kayitlari (ulke, doctor_id, updated_at desc);

-- ── 3. What a row may never do ───────────────────────────────────────────────────────────────────────────────
create or replace function public.ulke_prematur_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.patient_id is distinct from old.patient_id then
    raise exception '%: a record never moves to another country, doctor or patient', tg_table_name using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_prematur_kilidi' and tgrelid = 'public.ulke_prematur_kayitlari'::regclass) then
    create trigger ulke_prematur_kilidi before update on public.ulke_prematur_kayitlari for each row execute function public.ulke_prematur_kilidi();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ulke_prematur_kilidi' and tgrelid = 'public.ulke_erken_dogum_kayitlari'::regclass) then
    create trigger ulke_prematur_kilidi before update on public.ulke_erken_dogum_kayitlari for each row execute function public.ulke_prematur_kilidi();
  end if;
end $$;

-- ── 4. Server only ───────────────────────────────────────────────────────────────────────────────────────────
alter table public.ulke_prematur_kayitlari enable row level security;
revoke all on table public.ulke_prematur_kayitlari from anon, authenticated;
alter table public.ulke_erken_dogum_kayitlari enable row level security;
revoke all on table public.ulke_erken_dogum_kayitlari from anon, authenticated;
revoke all on function public.ulke_prematur_kilidi() from public, anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('200', '200_ulke_prematur.sql', null, now(), false,
  'PREMATUR-ULKE-01: prematurity records of a country build: the baby''s history and the doctor''s marks on the follow-up plan, and the early-birth record of a pregnancy (country, doctor and patient in every key; one encrypted value each; server only)')
on conflict (version) do nothing;

commit;
