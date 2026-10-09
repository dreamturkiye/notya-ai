-- 140 NOTYA-ULKE-MESAJ-01 (Kaan, 2026-10-09) — MESSAGES BETWEEN A DOCTOR AND A PATIENT of a country build, inside the
-- patient portal.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once, after 139. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
--   1. ulke_mesaj_yazismalari     ONE ROW PER CONVERSATION between one doctor and one of that doctor's patients.
--                                 THE DOCTOR OPENS IT (by writing first) and THE DOCTOR CLOSES IT. A patient has at
--                                 most ONE conversation that is open. A closed conversation stays closed and takes
--                                 no further message from either side; the doctor's next message opens a new one.
--   2. ulke_hasta_mesajlari       ONE ROW PER MESSAGE. Who wrote it ('hekim' the doctor, 'hasta' the patient), the
--                                 text as ONE ENCRYPTED VALUE (AES-256-GCM, same helper as the rest of a patient's
--                                 data), and when THE OTHER SIDE read it (`okundu_at`: empty = unread). A message
--                                 belongs to ONE conversation of ONE patient of ONE doctor in ONE country, by its key.
--                                 NO ATTACHMENT: there is no column for one.
--   3. two triggers that hold, in the database, what no path of the application may break:
--        ulke_mesaj_yazismasi_kilidi   a conversation never moves to another country, doctor or patient; once
--                                      closed it is not opened again.
--        ulke_hasta_mesaji_kilidi      a message is written only into an OPEN conversation; it never moves, its
--                                      writer and its text never change; "read" is set once and stays.
--
-- NOTHING LEAVES THE DATABASE: there is no outbound channel (no SMS, no e-mail, no messenger). A message is read
-- inside the portal, by the patient who signed in with their link and PIN, and inside the application by the doctor.
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles. Neither a doctor's browser
-- session nor a patient's ever reads the tables directly; the server's routes do, binding every statement to
-- country, doctor and patient.
--
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 140 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_portal_erisimleri') is null then
    raise exception 'country migration 140 refused: the patient portal (migration 137) is not on this database. Run the earlier country migrations first.';
  end if;
end $$;

-- ── 1. Conversations ─────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_mesaj_yazismalari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  -- The doctor closed the conversation. Empty = open.
  kapandi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_mesaj_yazismalari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  -- So that a message can name its conversation TOGETHER WITH its country, doctor and patient.
  constraint ulke_mesaj_yazismalari_sahip_tekil unique (ulke, doctor_id, patient_id, id)
);

-- At most one OPEN conversation per patient of a doctor — also for two requests at the same moment.
create unique index if not exists ulke_mesaj_yazismalari_tek_acik on public.ulke_mesaj_yazismalari (ulke, doctor_id, patient_id) where kapandi_at is null;
create index if not exists ulke_mesaj_yazismalari_hasta_idx on public.ulke_mesaj_yazismalari (ulke, doctor_id, patient_id, created_at desc);

create or replace function public.ulke_mesaj_yazismasi_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.patient_id is distinct from old.patient_id
     or new.created_at is distinct from old.created_at then
    raise exception 'ulke_mesaj_yazismalari: a conversation never moves to another country, doctor or patient' using errcode = '23514';
  end if;
  if old.kapandi_at is not null and new.kapandi_at is distinct from old.kapandi_at then
    raise exception 'ulke_mesaj_yazismalari: a closed conversation stays closed' using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_mesaj_yazismasi_kilidi' and tgrelid = 'public.ulke_mesaj_yazismalari'::regclass) then
    create trigger ulke_mesaj_yazismasi_kilidi
      before update on public.ulke_mesaj_yazismalari
      for each row execute function public.ulke_mesaj_yazismasi_kilidi();
  end if;
end $$;

alter table public.ulke_mesaj_yazismalari enable row level security;
revoke all on table public.ulke_mesaj_yazismalari from anon, authenticated;

-- ── 2. Messages ──────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_hasta_mesajlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  yazisma_id uuid not null,
  -- Who wrote it: the doctor, or the patient (signed in to the portal with their link and PIN).
  gonderen text not null check (gonderen in ('hekim', 'hasta')),
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts): the text, as one value.
  metin_encrypted text not null check (char_length(metin_encrypted) > 0),
  -- When the OTHER side read it. Empty = unread.
  okundu_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ulke_hasta_mesajlari_yazisma_fk foreign key (ulke, doctor_id, patient_id, yazisma_id) references public.ulke_mesaj_yazismalari (ulke, doctor_id, patient_id, id) on delete cascade,
  constraint ulke_hasta_mesajlari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

create index if not exists ulke_hasta_mesajlari_yazisma_idx on public.ulke_hasta_mesajlari (ulke, doctor_id, patient_id, yazisma_id, created_at);
-- What a doctor has not read yet, across their patients; and what one patient has not read yet.
create index if not exists ulke_hasta_mesajlari_okunmamis_idx on public.ulke_hasta_mesajlari (ulke, doctor_id, gonderen, patient_id) where okundu_at is null;

create or replace function public.ulke_hasta_mesaji_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_kapandi timestamptz;
begin
  if tg_op = 'INSERT' then
    -- The conversation is read under a lock: closing it and writing into it cannot pass each other.
    select y.kapandi_at into v_kapandi
      from public.ulke_mesaj_yazismalari y
     where y.id = new.yazisma_id and y.ulke = new.ulke and y.doctor_id = new.doctor_id and y.patient_id = new.patient_id
       for share;
    if not found then
      raise exception 'ulke_hasta_mesajlari: the conversation is not a conversation of this patient' using errcode = '23503';
    end if;
    if v_kapandi is not null then
      raise exception 'ulke_hasta_mesajlari: a closed conversation takes no message' using errcode = '23514';
    end if;
    if new.okundu_at is not null then
      raise exception 'ulke_hasta_mesajlari: a message is written unread' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.patient_id is distinct from old.patient_id
     or new.yazisma_id is distinct from old.yazisma_id then
    raise exception 'ulke_hasta_mesajlari: a message never moves to another country, doctor, patient or conversation' using errcode = '23514';
  end if;
  if new.gonderen is distinct from old.gonderen or new.metin_encrypted is distinct from old.metin_encrypted or new.created_at is distinct from old.created_at then
    raise exception 'ulke_hasta_mesajlari: the writer, the text and the moment of a message do not change' using errcode = '23514';
  end if;
  if old.okundu_at is not null and new.okundu_at is distinct from old.okundu_at then
    raise exception 'ulke_hasta_mesajlari: a message that was read stays read' using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_hasta_mesaji_kilidi' and tgrelid = 'public.ulke_hasta_mesajlari'::regclass) then
    create trigger ulke_hasta_mesaji_kilidi
      before insert or update on public.ulke_hasta_mesajlari
      for each row execute function public.ulke_hasta_mesaji_kilidi();
  end if;
end $$;

alter table public.ulke_hasta_mesajlari enable row level security;
revoke all on table public.ulke_hasta_mesajlari from anon, authenticated;
revoke all on function public.ulke_mesaj_yazismasi_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_hasta_mesaji_kilidi() from public, anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('140', '140_ulke_hasta_mesajlari.sql', null, now(), false,
  'NOTYA-ULKE-MESAJ-01: messages between a doctor and a patient of a country build, inside the patient portal: conversations (opened and closed by the doctor, one open per patient) and messages (writer, text as one encrypted value, read mark); two triggers that keep a closed conversation closed and a message unchanged. No attachment, nothing leaves the database. Server only.')
on conflict (version) do nothing;

commit;
