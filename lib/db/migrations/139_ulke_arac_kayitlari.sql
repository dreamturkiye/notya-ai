-- 139 NOTYA-ULKE-ARACLAR-01 (Kaan, 2026-10-09) — THE TOOL RECORDS of a country build: what a doctor chose to keep
-- of a doctor tool's result, on one of their patients.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once, after 138. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
--   1. ulke_arac_kayitlari        ONE ROW PER RESULT a doctor saved to a patient's file. ONE TABLE FOR EVERY TOOL:
--                                 the row names the tool by its key (the kit's catalogue is the list; the
--                                 application checks the key against it and against the account's role — the
--                                 database checks only its shape). WHAT WAS ENTERED AND WHAT CAME OUT IS HEALTH
--                                 DATA: one encrypted value (AES-256-GCM, same helper as the rest of a patient's
--                                 data), never a column per field. A record belongs to ONE patient of ONE doctor
--                                 in ONE country, by its key.
--                                   takip_tarihi  the day THE DOCTOR entered for the next check, where they entered
--                                                 one. The application never proposes it. Plain, like the day of
--                                                 an appointment, so that the follow-up list can be read by day.
--                                   kapandi_at    the doctor marked that follow-up as done
--   2. ulke_arac_kaydi_kilidi     a trigger that holds, in the database, what no path of the application may break:
--                                 a record never moves to another country, doctor or patient; its tool, its content
--                                 and its follow-up day never change (a new result is a new record); a follow-up
--                                 that was closed stays closed.
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles. A doctor's browser session never
-- reads the table directly; the server's routes do, binding every statement to country, doctor and patient.
--
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 139 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_hastalar') is null then
    raise exception 'country migration 139 refused: the patient table of a country database (public.ulke_hastalar) is missing. Run the earlier country migrations first.';
  end if;
end $$;

-- ── 1. Records ───────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_arac_kayitlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  -- The tool's key in the kit's catalogue. The application validates it; here only its shape.
  arac text not null check (arac ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(arac) <= 60),
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts): what was entered and the
  -- result, as one value.
  kayit_encrypted text not null check (char_length(kayit_encrypted) > 0),
  takip_tarihi date,
  kapandi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Only a follow-up that exists can be closed.
  check (kapandi_at is null or takip_tarihi is not null),
  constraint ulke_arac_kayitlari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

create index if not exists ulke_arac_kayitlari_hasta_idx on public.ulke_arac_kayitlari (ulke, doctor_id, patient_id, created_at desc);
-- The follow-up list of one doctor: open follow-ups by day.
create index if not exists ulke_arac_kayitlari_takip_idx on public.ulke_arac_kayitlari (ulke, doctor_id, takip_tarihi) where takip_tarihi is not null and kapandi_at is null;

-- ── 2. What a record may never do ────────────────────────────────────────────────────────────────────────────
create or replace function public.ulke_arac_kaydi_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.patient_id is distinct from old.patient_id then
    raise exception 'ulke_arac_kayitlari: a record never moves to another country, doctor or patient' using errcode = '23514';
  end if;
  if new.arac is distinct from old.arac or new.kayit_encrypted is distinct from old.kayit_encrypted
     or new.takip_tarihi is distinct from old.takip_tarihi or new.created_at is distinct from old.created_at then
    raise exception 'ulke_arac_kayitlari: the tool, the content and the follow-up day of a record do not change; a new result is a new record' using errcode = '23514';
  end if;
  if old.kapandi_at is not null and new.kapandi_at is distinct from old.kapandi_at then
    raise exception 'ulke_arac_kayitlari: a follow-up that was closed stays closed' using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_arac_kaydi_kilidi' and tgrelid = 'public.ulke_arac_kayitlari'::regclass) then
    create trigger ulke_arac_kaydi_kilidi
      before update on public.ulke_arac_kayitlari
      for each row execute function public.ulke_arac_kaydi_kilidi();
  end if;
end $$;

alter table public.ulke_arac_kayitlari enable row level security;
revoke all on table public.ulke_arac_kayitlari from anon, authenticated;
revoke all on function public.ulke_arac_kaydi_kilidi() from public, anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('139', '139_ulke_arac_kayitlari.sql', null, now(), false,
  'NOTYA-ULKE-ARACLAR-01: tool records of a country build: one row per result a doctor saved to a patient (tool key, content as one encrypted value, the follow-up day the doctor entered, when it was closed), a trigger that keeps a record unchanged. Server only.')
on conflict (version) do nothing;

commit;
