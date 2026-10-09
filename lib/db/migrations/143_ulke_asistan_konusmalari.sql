-- 143 NOTYA-ULKE-ASISTAN-01 (Kaan, 2026-10-09) — THE ASSISTANT'S CONVERSATIONS of a country build: what a doctor
-- asked the assistant in writing (or by voice, as text) and what it answered, kept per doctor so that a
-- conversation can be read again, continued and deleted.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once, after the country migrations before it. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
--   1. ulke_asistan_konusmalari   ONE ROW PER CONVERSATION of one doctor in one country. A conversation is either
--                                 GENERAL (patient_id null) or ABOUT ONE PATIENT of that doctor — fixed when it is
--                                 started and never changed. Its title (the beginning of the first question) is
--                                 text a doctor typed and may name a patient: one encrypted value.
--                                   rol       the role the account had when the conversation began (the assistant
--                                             it was held with). The application validates it against the pack;
--                                             here only its shape.
--   2. ulke_asistan_mesajlari     ONE ROW PER MESSAGE: the doctor's question ('hekim') or the assistant's answer
--                                 ('asistan'). THE TEXT IS HEALTH DATA (a question may describe a patient): one
--                                 encrypted value (AES-256-GCM, same helper as the rest of a patient's data).
--                                 A message belongs to ONE conversation of ONE doctor in ONE country, by its key.
--                                 NO AUDIO IS EVER STORED: a spoken question reaches this table as its text.
--   3. two triggers that hold, in the database, what no path of the application may break: a conversation never
--      moves to another country, doctor or patient and never changes the role it began with; a message never
--      changes at all (a new answer is a new message).
--
-- DELETING. A doctor deletes a conversation: its messages go with it (on delete cascade). A patient who is removed
-- takes the conversations ABOUT them along, and an account that is removed takes all of its own.
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles. A doctor's browser session never
-- reads these tables directly; the server's routes do, binding every statement to country and doctor (and to the
-- patient where the conversation is about one).
--
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 143 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_hastalar') is null then
    raise exception 'country migration 143 refused: the patient table of a country database (public.ulke_hastalar) is missing. Run the earlier country migrations first.';
  end if;
end $$;

-- ── 1. Conversations ─────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_asistan_konusmalari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  -- null = a general conversation. Otherwise the ONE patient it is about: this doctor's own, in this country.
  patient_id uuid,
  -- The role's key in the pack. The application validates it; here only its shape.
  rol text not null check (rol ~ '^[a-z]+(-[a-z]+)*$' and char_length(rol) <= 60),
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts).
  baslik_encrypted text not null check (char_length(baslik_encrypted) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_asistan_konusmalari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_asistan_konusmalari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  -- The key a message hangs from: country and doctor are part of it, so a message cannot point across either.
  constraint ulke_asistan_konusmalari_anahtar unique (ulke, doctor_id, id)
);

-- The history of one doctor, newest first.
create index if not exists ulke_asistan_konusmalari_hekim_idx on public.ulke_asistan_konusmalari (ulke, doctor_id, updated_at desc);
-- The conversations about one patient.
create index if not exists ulke_asistan_konusmalari_hasta_idx on public.ulke_asistan_konusmalari (ulke, doctor_id, patient_id) where patient_id is not null;

-- ── 2. Messages ──────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_asistan_mesajlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  konusma_id uuid not null,
  -- Who wrote it: the doctor, or the assistant.
  yazan text not null check (yazan in ('hekim', 'asistan')),
  -- AES-256-GCM: the question as it was asked, or the answer as it was given.
  metin_encrypted text not null check (char_length(metin_encrypted) > 0),
  created_at timestamptz not null default now(),
  constraint ulke_asistan_mesajlari_konusma_fk foreign key (ulke, doctor_id, konusma_id) references public.ulke_asistan_konusmalari (ulke, doctor_id, id) on delete cascade
);

-- The messages of one conversation, in the order they were written.
create index if not exists ulke_asistan_mesajlari_konusma_idx on public.ulke_asistan_mesajlari (ulke, doctor_id, konusma_id, created_at);

-- ── 3. What a conversation and a message may never do ────────────────────────────────────────────────────────
create or replace function public.ulke_asistan_konusma_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.patient_id is distinct from old.patient_id then
    raise exception 'ulke_asistan_konusmalari: a conversation never moves to another country, doctor or patient' using errcode = '23514';
  end if;
  if new.rol is distinct from old.rol or new.created_at is distinct from old.created_at then
    raise exception 'ulke_asistan_konusmalari: the role a conversation began with and the moment it began do not change' using errcode = '23514';
  end if;
  return new;
end $$;

create or replace function public.ulke_asistan_mesaj_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'ulke_asistan_mesajlari: a message does not change; a new answer is a new message' using errcode = '23514';
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_asistan_konusma_kilidi' and tgrelid = 'public.ulke_asistan_konusmalari'::regclass) then
    create trigger ulke_asistan_konusma_kilidi
      before update on public.ulke_asistan_konusmalari
      for each row execute function public.ulke_asistan_konusma_kilidi();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ulke_asistan_mesaj_kilidi' and tgrelid = 'public.ulke_asistan_mesajlari'::regclass) then
    create trigger ulke_asistan_mesaj_kilidi
      before update on public.ulke_asistan_mesajlari
      for each row execute function public.ulke_asistan_mesaj_kilidi();
  end if;
end $$;

alter table public.ulke_asistan_konusmalari enable row level security;
alter table public.ulke_asistan_mesajlari enable row level security;
revoke all on table public.ulke_asistan_konusmalari from anon, authenticated;
revoke all on table public.ulke_asistan_mesajlari from anon, authenticated;
revoke all on function public.ulke_asistan_konusma_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_asistan_mesaj_kilidi() from public, anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('143', '143_ulke_asistan_konusmalari.sql', null, now(), false,
  'NOTYA-ULKE-ASISTAN-01: the assistant''s conversations of a country build: one row per conversation of a doctor (general, or about one of that doctor''s patients; title encrypted) and one row per message (question or answer, text encrypted), two triggers that keep a conversation where it began and a message unchanged. No audio. Server only.')
on conflict (version) do nothing;

commit;
