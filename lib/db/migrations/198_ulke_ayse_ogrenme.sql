-- 198 AYSE-OGRENME-V3f (Kaan, 2026-11-13: START) — THE LEARNING-MOMENTUM DATA OF A COUNTRY BUILD.
--
-- Migration 197 made the V3 tables for Türkiye. On a country database they cannot take a row: they point at the
-- Turkish `users` and `clinics` tables, which are empty there, because a country's accounts live in `ulke_hesaplari`
-- and its clinics in `ulke_klinikler` / `ulke_klinik_uyeleri` (migrations 130, 145). This file is the country's own
-- version, with the country and the account in every key like every other country table (migration 129 on).
-- It touches no table of Türkiye and no table of an earlier migration.
--
-- ONE DATABASE PER COUNTRY. Run only on a country's OWN database, never on the Turkish one. A new country's database
-- gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql).
--
--   1. ulke_not_taslaklari      the model's draft of a note, kept ONLY until the doctor approves it: the doctor edits
--                               the note in place, so without this copy the approval could not tell what the doctor
--                               changed. One row per note; the approval removes it; it goes with the note.
--   2. ulke_not_duzenlemeleri   the edit log: for every section the doctor changed before approving, the draft text and
--                               the approved text. One row per note and section; goes with the note.
--   3. ulke_ogrenme_metrik      per approved note, the real number of corrections (an integer, no text). One row per
--                               note. A note approved without a change counts 0; a note with no draft on record has no
--                               row (no measurement is invented).
--   4. ulke_klinik_uslup_katilim   a doctor's consent to share style rules with the clinic. No row = off. The key to
--                               the clinic's membership means leaving the clinic removes the consent.
--   5. ulke_klinik_ortak_uslup  the clinic's shared pool of style rules, split by role (`brans` = the role key of
--                               hekim_rolu). `doctor_id` is the SOURCE doctor, kept only so that a leaving doctor's rules
--                               can be removed; no answer of the application carries it. Removing the doctor's
--                               membership removes the rows by the key.
--
-- Rows 4 and 5 are written only by the application's clinic-style code, which stays OFF until the country has a store
-- of learned rules (docs/OPEN-COMMITMENTS.md, AYSE-OGRENME-V3f).
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles, on all five tables.
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it (the Supabase tools were disconnected).

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 198 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_notlar') is null then
    raise exception 'country migration 198 refused: the note table of a country database (public.ulke_notlar) is missing. Run the earlier country migrations first.';
  end if;
  if to_regclass('public.ulke_klinik_uyeleri') is null then
    raise exception 'country migration 198 refused: the clinic member table (public.ulke_klinik_uyeleri) is missing. Run migration 145 first.';
  end if;
end $$;

-- ── 1. The model's draft, until approval ─────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_not_taslaklari (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  note_id uuid not null,
  -- The language the draft is written in; only an approval in the same language is compared with it.
  dil text not null check (dil ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  s text not null default '' check (char_length(s) <= 20000),
  o text not null default '' check (char_length(o) <= 20000),
  a text not null default '' check (char_length(a) <= 20000),
  p text not null default '' check (char_length(p) <= 20000),
  created_at timestamptz not null default now(),
  primary key (ulke, doctor_id, note_id),
  constraint ulke_not_taslaklari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_not_taslaklari_not_fk foreign key (ulke, doctor_id, note_id) references public.ulke_notlar (ulke, doctor_id, id) on delete cascade
);

-- ── 2. The edit log ──────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_not_duzenlemeleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  note_id uuid not null,
  alan text not null check (alan in ('subjektif', 'objektif', 'degerlendirme', 'plan')),
  onceki text not null check (char_length(onceki) <= 20000),
  sonraki text not null check (char_length(sonraki) <= 20000),
  created_at timestamptz not null default now(),
  constraint ulke_not_duzenlemeleri_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_not_duzenlemeleri_not_fk foreign key (ulke, doctor_id, note_id) references public.ulke_notlar (ulke, doctor_id, id) on delete cascade,
  constraint ulke_not_duzenlemeleri_alan_tekil unique (ulke, doctor_id, note_id, alan)
);

create index if not exists ulke_not_duzenlemeleri_zaman_idx on public.ulke_not_duzenlemeleri (ulke, doctor_id, created_at desc);

-- ── 3. The correction count per approved note ────────────────────────────────────────────────────────────────
create table if not exists public.ulke_ogrenme_metrik (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  note_id uuid not null,
  duzeltme_sayisi integer not null check (duzeltme_sayisi >= 0),
  onay_at timestamptz not null default now(),
  primary key (ulke, doctor_id, note_id),
  constraint ulke_ogrenme_metrik_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_ogrenme_metrik_not_fk foreign key (ulke, doctor_id, note_id) references public.ulke_notlar (ulke, doctor_id, id) on delete cascade
);

create index if not exists ulke_ogrenme_metrik_zaman_idx on public.ulke_ogrenme_metrik (ulke, doctor_id, onay_at desc);

-- ── 4. Consent to the clinic's shared style (default OFF: no row) ────────────────────────────────────────────
create table if not exists public.ulke_klinik_uslup_katilim (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  klinik_id uuid not null,
  aktif boolean not null default false,
  onay_at timestamptz,
  ayrildi_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (ulke, doctor_id),
  constraint ulke_klinik_uslup_katilim_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  -- The consent belongs to a MEMBER of that clinic: leaving the clinic removes it.
  constraint ulke_klinik_uslup_katilim_uye_fk foreign key (ulke, klinik_id, doctor_id) references public.ulke_klinik_uyeleri (ulke, klinik_id, doctor_id) on delete cascade
);

create index if not exists ulke_klinik_uslup_katilim_klinik_idx on public.ulke_klinik_uslup_katilim (ulke, klinik_id) where aktif;

-- ── 5. The clinic's shared pool of style rules ───────────────────────────────────────────────────────────────
create table if not exists public.ulke_klinik_ortak_uslup (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  klinik_id uuid not null,
  -- The SOURCE doctor. Never answered to a client.
  doctor_id uuid not null,
  -- The role key of hekim_rolu: the pool is split by role, so one role's rule never reaches another.
  brans text not null check (brans ~ '^[a-z]+(-[a-z]+)*$' and char_length(brans) <= 60),
  anahtar text not null check (char_length(anahtar) between 1 and 60),
  deger text not null check (char_length(deger) between 1 and 300),
  created_at timestamptz not null default now(),
  constraint ulke_klinik_ortak_uslup_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_klinik_ortak_uslup_uye_fk foreign key (ulke, klinik_id, doctor_id) references public.ulke_klinik_uyeleri (ulke, klinik_id, doctor_id) on delete cascade,
  constraint ulke_klinik_ortak_uslup_kural_tekil unique (ulke, klinik_id, doctor_id, anahtar)
);

create index if not exists ulke_klinik_ortak_uslup_okuma_idx on public.ulke_klinik_ortak_uslup (ulke, klinik_id, brans, created_at desc);

-- ── 6. Server only ───────────────────────────────────────────────────────────────────────────────────────────
alter table public.ulke_not_taslaklari enable row level security;
revoke all on table public.ulke_not_taslaklari from anon, authenticated;
alter table public.ulke_not_duzenlemeleri enable row level security;
revoke all on table public.ulke_not_duzenlemeleri from anon, authenticated;
alter table public.ulke_ogrenme_metrik enable row level security;
revoke all on table public.ulke_ogrenme_metrik from anon, authenticated;
alter table public.ulke_klinik_uslup_katilim enable row level security;
revoke all on table public.ulke_klinik_uslup_katilim from anon, authenticated;
alter table public.ulke_klinik_ortak_uslup enable row level security;
revoke all on table public.ulke_klinik_ortak_uslup from anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('198', '198_ulke_ayse_ogrenme.sql', null, now(), false,
  'AYSE-OGRENME-V3f: learning momentum of a country build: the draft kept until approval, the edit log, the correction count per approved note, the consent to the clinic''s shared style and its pool (country and account in every key; server only)')
on conflict (version) do nothing;

commit;
