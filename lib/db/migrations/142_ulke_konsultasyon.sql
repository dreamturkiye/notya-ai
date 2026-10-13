-- 142 NOTYA-ULKE-MESAJ-01 (Kaan, 2026-10-09) — CONSULTATION BETWEEN DOCTORS of a country build: a doctor asks
-- another account OF THE SAME COUNTRY DATABASE for an opinion on one patient.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once, after 141. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
--   1. ulke_konsultasyon_kodlari  ONE ROW PER ACCOUNT that chose to be findable: its CONSULTATION CODE. A colleague
--                                 is found by typing that code, exactly, and in no other way: THERE IS NO DIRECTORY
--                                 OF DOCTORS, and no statement lists this table for anybody. The code is kept as a
--                                 hash (to find its owner by an exact match) and as an encrypted value (so that
--                                 its owner, and nobody else, can be shown it again). A new code replaces the old.
--   2. ulke_konsultasyonlar       ONE ROW PER CONSULTATION, and THE RECORD OF IT: who asked (`doctor_id`, the
--                                 patient's own doctor), about which patient, whom (`danisilan_id`), WHAT WAS
--                                 SHARED (nothing but the question; or a READ-ONLY COPY of one approved note; or of
--                                 the summary for the patient of one approved note — with the note it was taken
--                                 from), on which consent wording (`riza_surumu`) and when, when the consulted
--                                 doctor first read it, the answer and when, when it was closed, and UNTIL WHEN
--                                 THE CONSULTED DOCTOR MAY READ IT:
--                                   son_gecerlilik   while it is open: never later than this (the pack's period)
--                                   erisim_bitis     after it was closed: until this (closing + the pack's period)
--                                 The question, the shared copy and the answer are HEALTH DATA: encrypted values
--                                 (AES-256-GCM, same helper as the rest of a patient's data).
--                                 THE CONSULTED DOCTOR IS GIVEN THE COPY IN THIS ROW AND NOTHING ELSE: the row is
--                                 the only thing that names them, and no table of the patient does.
--   3. two triggers that hold, in the database, what no path of the application may break:
--        ulke_konsultasyon_kilidi      a shared note is this doctor's, APPROVED, and about THIS patient; a
--                                      consultation never moves; who was asked, the question, what was shared, the
--                                      consent and both periods never change; an answer is given once, and only
--                                      while the consultation is open; "read" is set once; closed stays closed.
--        ulke_konsultasyon_kodu_kilidi a code never moves to another country or account.
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles. No browser session reads either
-- table directly; the server's routes do, binding every statement to the country and to the signed-in account —
-- as the asking doctor (`doctor_id`) or as the consulted one (`danisilan_id`), never both ways at once.
--
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 142 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_notlar') is null or to_regclass('public.ulke_hastalar') is null then
    raise exception 'country migration 142 refused: the patient and note tables of a country database are missing. Run the earlier country migrations first.';
  end if;
end $$;

-- ── 1. Consultation codes ────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_konsultasyon_kodlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  -- SHA-256 of the code, hex: an exact match finds the account. The code itself is not stored in the clear.
  kod_hash text not null check (kod_hash ~ '^[0-9a-f]{64}$'),
  -- AES-256-GCM (lib/security/encryption.ts): the code, so that ITS OWNER can be shown it again.
  kod_encrypted text not null check (char_length(kod_encrypted) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_konsultasyon_kodlari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  -- One code per account; and a code names one account.
  constraint ulke_konsultasyon_kodlari_hesap_tekil unique (ulke, doctor_id),
  constraint ulke_konsultasyon_kodlari_kod_tekil unique (ulke, kod_hash)
);

create or replace function public.ulke_konsultasyon_kodu_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id then
    raise exception 'ulke_konsultasyon_kodlari: a code never moves to another country or account' using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_konsultasyon_kodu_kilidi' and tgrelid = 'public.ulke_konsultasyon_kodlari'::regclass) then
    create trigger ulke_konsultasyon_kodu_kilidi
      before update on public.ulke_konsultasyon_kodlari
      for each row execute function public.ulke_konsultasyon_kodu_kilidi();
  end if;
end $$;

alter table public.ulke_konsultasyon_kodlari enable row level security;
revoke all on table public.ulke_konsultasyon_kodlari from anon, authenticated;

-- ── 2. Consultations ─────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_konsultasyonlar (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  -- THE ASKING DOCTOR: the patient's own doctor.
  doctor_id uuid not null,
  patient_id uuid not null,
  -- THE CONSULTED DOCTOR: an account of the same country, never the asking one.
  danisilan_id uuid not null,
  -- What was shared beside the question: 'yok' nothing, 'not' a copy of one approved note, 'ozet' a copy of the
  -- summary for the patient of one approved note.
  paylasim_turu text not null check (paylasim_turu in ('yok', 'not', 'ozet')),
  -- The note the copy was taken from.
  note_id uuid,
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts).
  soru_encrypted text not null check (char_length(soru_encrypted) > 0),
  paylasim_encrypted text check (paylasim_encrypted is null or char_length(paylasim_encrypted) > 0),
  -- The stamp of the consent sentence the asking doctor ticked (the pack's wording at that moment), and when.
  riza_surumu text not null check (char_length(riza_surumu) between 1 and 80),
  riza_at timestamptz not null,
  -- When the consulted doctor first opened it.
  okundu_at timestamptz,
  cevap_encrypted text check (cevap_encrypted is null or char_length(cevap_encrypted) > 0),
  cevap_at timestamptz,
  kapandi_at timestamptz,
  -- While open, the consulted doctor reads it until this moment at the latest.
  son_gecerlilik timestamptz not null,
  -- After closing, the consulted doctor reads it until this moment. Set when it is closed.
  erisim_bitis timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (doctor_id <> danisilan_id),
  check ((paylasim_turu = 'yok') = (paylasim_encrypted is null)),
  check ((paylasim_turu = 'yok') = (note_id is null)),
  check ((cevap_encrypted is null) = (cevap_at is null)),
  check ((kapandi_at is null) = (erisim_bitis is null)),
  check (erisim_bitis is null or erisim_bitis >= kapandi_at),
  check (son_gecerlilik > created_at),
  constraint ulke_konsultasyonlar_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  constraint ulke_konsultasyonlar_danisilan_fk foreign key (ulke, danisilan_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_konsultasyonlar_not_fk foreign key (ulke, doctor_id, note_id) references public.ulke_notlar (ulke, doctor_id, id) on delete cascade
);

create index if not exists ulke_konsultasyonlar_isteyen_idx on public.ulke_konsultasyonlar (ulke, doctor_id, created_at desc);
create index if not exists ulke_konsultasyonlar_hasta_idx on public.ulke_konsultasyonlar (ulke, doctor_id, patient_id, created_at desc);
create index if not exists ulke_konsultasyonlar_danisilan_idx on public.ulke_konsultasyonlar (ulke, danisilan_id, created_at desc);

create or replace function public.ulke_konsultasyon_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_onay timestamptz;
  v_hasta uuid;
begin
  if tg_op = 'INSERT' then
    if new.note_id is not null then
      -- A shared note is this doctor's, about THIS patient, and APPROVED.
      select n.approved_at, m.patient_id into v_onay, v_hasta
        from public.ulke_notlar n
        join public.ulke_muayeneler m on m.id = n.session_id and m.ulke = n.ulke and m.doctor_id = n.doctor_id
       where n.id = new.note_id and n.ulke = new.ulke and n.doctor_id = new.doctor_id;
      if not found or v_hasta is distinct from new.patient_id then
        raise exception 'ulke_konsultasyonlar: the note is not a note of this patient' using errcode = '23514';
      end if;
      if v_onay is null then
        raise exception 'ulke_konsultasyonlar: only an approved note is shared' using errcode = '23514';
      end if;
    end if;
    if new.okundu_at is not null or new.cevap_at is not null or new.kapandi_at is not null then
      raise exception 'ulke_konsultasyonlar: a consultation begins unread, unanswered and open' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.patient_id is distinct from old.patient_id
     or new.danisilan_id is distinct from old.danisilan_id or new.created_at is distinct from old.created_at then
    raise exception 'ulke_konsultasyonlar: a consultation never moves to another country, doctor, patient or colleague' using errcode = '23514';
  end if;
  if new.paylasim_turu is distinct from old.paylasim_turu or new.note_id is distinct from old.note_id
     or new.soru_encrypted is distinct from old.soru_encrypted or new.paylasim_encrypted is distinct from old.paylasim_encrypted
     or new.riza_surumu is distinct from old.riza_surumu or new.riza_at is distinct from old.riza_at
     or new.son_gecerlilik is distinct from old.son_gecerlilik then
    raise exception 'ulke_konsultasyonlar: the question, what was shared, the consent and the period of a consultation do not change' using errcode = '23514';
  end if;
  if old.okundu_at is not null and new.okundu_at is distinct from old.okundu_at then
    raise exception 'ulke_konsultasyonlar: the first reading is recorded once' using errcode = '23514';
  end if;
  if old.cevap_at is not null and (new.cevap_at is distinct from old.cevap_at or new.cevap_encrypted is distinct from old.cevap_encrypted) then
    raise exception 'ulke_konsultasyonlar: an answer is given once and does not change' using errcode = '23514';
  end if;
  if old.kapandi_at is not null and (new.kapandi_at is distinct from old.kapandi_at or new.erisim_bitis is distinct from old.erisim_bitis
     or new.cevap_at is distinct from old.cevap_at or new.cevap_encrypted is distinct from old.cevap_encrypted) then
    raise exception 'ulke_konsultasyonlar: a closed consultation stays closed and takes no answer' using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_konsultasyon_kilidi' and tgrelid = 'public.ulke_konsultasyonlar'::regclass) then
    create trigger ulke_konsultasyon_kilidi
      before insert or update on public.ulke_konsultasyonlar
      for each row execute function public.ulke_konsultasyon_kilidi();
  end if;
end $$;

alter table public.ulke_konsultasyonlar enable row level security;
revoke all on table public.ulke_konsultasyonlar from anon, authenticated;
revoke all on function public.ulke_konsultasyon_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_konsultasyon_kodu_kilidi() from public, anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('142', '142_ulke_konsultasyon.sql', null, now(), false,
  'NOTYA-ULKE-MESAJ-01: consultation between doctors of a country build: the consultation code an account is found by (hash and encrypted value, no directory) and the consultations (who asked whom about which patient, the question, a read-only copy of one approved note or of its summary, the consent wording version, first reading, answer, closing, and until when the consulted doctor may read); two triggers. Server only.')
on conflict (version) do nothing;

commit;
