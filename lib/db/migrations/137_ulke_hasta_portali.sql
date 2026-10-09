-- 137 NOTYA-ULKE-PORTAL-01 (Kaan, 2026-10-09) — THE PATIENT PORTAL of a country build.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once, after 136. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
--   1. ulke_portal_erisimleri   ACCESS WITHOUT AN ACCOUNT. One row per link a doctor gave a patient: the link's
--                               token and the PIN, BOTH STORED ONLY AS HASHES (the token as SHA-256 of 256 random
--                               bits, the PIN as a slow salted hash made by the application), how many PIN tries
--                               were used, whether the link is locked, when it ends, whether it was withdrawn.
--                               A link belongs to ONE patient of ONE doctor in ONE country, by its key. A patient
--                               has at most one link that is not withdrawn.
--   2. ulke_portal_oturumlari   a patient's signed-in portal session, stored only as the hash of its random key.
--                               It hangs from its link: when the link is withdrawn, locked or ended, so is it.
--   3. ulke_hasta_ozetleri      a PLAIN-LANGUAGE SUMMARY of ONE APPROVED NOTE, for the patient. Encrypted like the
--                               rest of a patient's data. `paylasildi_at` null = the doctor has NOT shared it; the
--                               portal shows a summary only while it is set. A trigger refuses a summary of a note
--                               that is not approved, and of a note that is not this patient's.
--   4. ulke_portal_kayitlari    the record the doctor reads: every link given or withdrawn, every sign-in, every
--                               lock, every share and every unshare.
--   5. ulke_randevu_istekleri   a patient's REQUEST for an appointment (preferred days, a short reason) and its
--                               outcome. At most one unanswered request per patient. An accepted request points at
--                               the appointment it became — the same country's, doctor's and patient's.
--   6. Functions, each ONE TRANSACTION and each bound to the country it is called for (`p_ulke` in every statement):
--        ulke_portal_erisim_ver      gives a patient a new link and withdraws the one before it
--        ulke_portal_erisim_iptal    withdraws a patient's link and closes its sessions
--        ulke_portal_deneme_al       takes ONE PIN try from a link, before the PIN is looked at
--        ulke_portal_deneme_sonucu   a right PIN opens a session; a wrong one may lock the link
--        ulke_ozet_paylas            shares or unshares a summary, and records it
--        ulke_randevu_istegi_kabul   books the appointment and marks the request accepted, together or not at all
--
-- NO DOUBLE BOOKING: accepting a request inserts into ulke_randevulari under the exclusion constraint of migration
-- 135. A taken time raises 23P01 and the request stays unanswered.
--
-- SERVER ONLY, all five tables: row-level security on, NO rule, no privilege for the browser roles. Neither a
-- doctor's browser session nor a patient's ever reads them directly; the server's routes do, binding every statement
-- to country, doctor and patient. The functions are closed to the browser roles.
--
-- It alters one existing country table: `ulke_randevulari` gains a unique constraint (ulke, doctor_id, patient_id, id)
-- so that a request can point at an appointment TOGETHER WITH its patient. No column, no row and no rule changes.
--
-- Safe to run twice. One transaction. No "drop … if exists". NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 137 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
end $$;

-- ── 1. Links ─────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_portal_erisimleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  -- SHA-256 (hex) of the link's token. The token itself is shown once, to the doctor, and is stored nowhere.
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  -- The PIN as a slow, salted hash (scrypt, made by the application). Never the PIN.
  pin_hash text not null check (char_length(pin_hash) between 40 and 300),
  -- PIN tries used since the last right PIN.
  hatali_deneme smallint not null default 0 check (hatali_deneme >= 0),
  son_deneme_at timestamptz,
  -- Set when the tries ran out. A locked link never opens again; the doctor gives a new one.
  kilitlendi_at timestamptz,
  son_gecerlilik timestamptz not null,
  -- Set when the doctor withdrew the link, or gave a new one in its place.
  iptal_at timestamptz,
  son_giris_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ulke_portal_erisimleri_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  constraint ulke_portal_erisimleri_token_tekil unique (token_hash),
  -- What sessions point at: a link TOGETHER WITH its country, doctor and patient.
  constraint ulke_portal_erisimleri_sahip_tekil unique (ulke, doctor_id, patient_id, id)
);

create unique index if not exists ulke_portal_erisimleri_tek_acik on public.ulke_portal_erisimleri (doctor_id, patient_id) where iptal_at is null;

alter table public.ulke_portal_erisimleri enable row level security;
revoke all on table public.ulke_portal_erisimleri from anon, authenticated;

-- ── 2. Sessions ──────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_portal_oturumlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  erisim_id uuid not null,
  -- SHA-256 (hex) of the session's random key. The key itself lives only in the patient's browser.
  oturum_hash text not null check (oturum_hash ~ '^[0-9a-f]{64}$'),
  son_gecerlilik timestamptz not null,
  kapandi_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ulke_portal_oturumlari_erisim_fk foreign key (ulke, doctor_id, patient_id, erisim_id) references public.ulke_portal_erisimleri (ulke, doctor_id, patient_id, id) on delete cascade,
  constraint ulke_portal_oturumlari_hash_tekil unique (oturum_hash)
);

create index if not exists ulke_portal_oturumlari_erisim_idx on public.ulke_portal_oturumlari (ulke, doctor_id, patient_id, erisim_id);

alter table public.ulke_portal_oturumlari enable row level security;
revoke all on table public.ulke_portal_oturumlari from anon, authenticated;

-- ── 3. Summaries for the patient ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_hasta_ozetleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  note_id uuid not null,
  -- BCP-47 language (and script) the summary is written in: the patient's.
  dil text not null check (dil ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts).
  ozet_encrypted text not null,
  -- null = NOT shared. Set = the patient sees it in the portal, from that moment until it is taken back.
  paylasildi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_hasta_ozetleri_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  constraint ulke_hasta_ozetleri_not_fk foreign key (ulke, doctor_id, note_id) references public.ulke_notlar (ulke, doctor_id, id) on delete cascade,
  -- One summary per note.
  constraint ulke_hasta_ozetleri_not_tekil unique (ulke, doctor_id, note_id)
);

create index if not exists ulke_hasta_ozetleri_hasta_idx on public.ulke_hasta_ozetleri (ulke, doctor_id, patient_id, paylasildi_at);

-- A summary exists only for an APPROVED note, and only for the patient that note is about. Held here, in the
-- database, so that no path of the application can write or share a summary of an unapproved note.
create or replace function public.ulke_hasta_ozeti_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_onay timestamptz;
  v_hasta uuid;
begin
  select n.approved_at, m.patient_id into v_onay, v_hasta
    from public.ulke_notlar n
    join public.ulke_muayeneler m on m.id = n.session_id and m.ulke = n.ulke and m.doctor_id = n.doctor_id
   where n.id = new.note_id and n.ulke = new.ulke and n.doctor_id = new.doctor_id;
  if not found or v_hasta is distinct from new.patient_id then
    raise exception 'ulke_hasta_ozetleri: the note is not a note of this patient' using errcode = '23514';
  end if;
  if v_onay is null then
    raise exception 'ulke_hasta_ozetleri: a summary for the patient exists only for an approved note' using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_hasta_ozeti_kilidi' and tgrelid = 'public.ulke_hasta_ozetleri'::regclass) then
    create trigger ulke_hasta_ozeti_kilidi
      before insert or update on public.ulke_hasta_ozetleri
      for each row execute function public.ulke_hasta_ozeti_kilidi();
  end if;
end $$;

alter table public.ulke_hasta_ozetleri enable row level security;
revoke all on table public.ulke_hasta_ozetleri from anon, authenticated;

-- ── 4. The record the doctor reads ───────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_portal_kayitlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  -- link given, link withdrawn, sign-in, link locked by wrong PINs, summary shared, summary taken back.
  olay text not null check (olay in ('erisim', 'iptal', 'giris', 'kilit', 'paylasim', 'geri-alma')),
  -- The summary a share or an unshare was about. null for the other events.
  ozet_id uuid,
  created_at timestamptz not null default now(),
  constraint ulke_portal_kayitlari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

create index if not exists ulke_portal_kayitlari_hasta_idx on public.ulke_portal_kayitlari (ulke, doctor_id, patient_id, created_at desc);

alter table public.ulke_portal_kayitlari enable row level security;
revoke all on table public.ulke_portal_kayitlari from anon, authenticated;

-- ── 5. Appointment requests ──────────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ulke_randevulari_hasta_tekil') then
    alter table public.ulke_randevulari add constraint ulke_randevulari_hasta_tekil unique (ulke, doctor_id, patient_id, id);
  end if;
end $$;

create table if not exists public.ulke_randevu_istekleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  -- The days the patient prefers, as calendar days of the doctor's own time zone.
  gunler date[] not null check (cardinality(gunler) between 1 and 5),
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted. A short reason, in the patient's words.
  neden_encrypted text,
  -- waiting, accepted, declined.
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'kabul', 'red')),
  -- The appointment an accepted request became.
  randevu_id uuid,
  cevap_at timestamptz,
  created_at timestamptz not null default now(),
  check ((durum = 'kabul') = (randevu_id is not null)),
  check ((durum = 'bekliyor') = (cevap_at is null)),
  constraint ulke_randevu_istekleri_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  -- The appointment must be the same country's, the same doctor's AND the same patient's. Checked only when there is one.
  constraint ulke_randevu_istekleri_randevu_fk foreign key (ulke, doctor_id, patient_id, randevu_id) references public.ulke_randevulari (ulke, doctor_id, patient_id, id)
);

create unique index if not exists ulke_randevu_istekleri_tek_bekleyen on public.ulke_randevu_istekleri (doctor_id, patient_id) where durum = 'bekliyor';
create index if not exists ulke_randevu_istekleri_doctor_idx on public.ulke_randevu_istekleri (ulke, doctor_id, durum, created_at);

alter table public.ulke_randevu_istekleri enable row level security;
revoke all on table public.ulke_randevu_istekleri from anon, authenticated;

-- ── 6. Functions ─────────────────────────────────────────────────────────────────────────────────────────────
-- Every function body runs inside the caller's transaction: if a statement fails or the function raises, every
-- statement before it is undone. Each takes the country as `p_ulke` and names it in every statement.

-- A new link for one patient of one doctor. The link before it, if any, is withdrawn in the same step and its
-- sessions are closed. Returns the new link's id, or null when the patient is not this doctor's in this country.
create or replace function public.ulke_portal_erisim_ver(
  p_ulke text,
  p_doctor_id uuid,
  p_patient_id uuid,
  p_token_hash text,
  p_pin_hash text,
  p_son_gecerlilik timestamptz,
  p_simdi timestamptz
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- The patient row is locked, so two requests for the same patient at the same moment take turns.
  perform 1 from public.ulke_hastalar h where h.id = p_patient_id and h.doctor_id = p_doctor_id and h.ulke = p_ulke for update;
  if not found then
    return null;
  end if;
  update public.ulke_portal_oturumlari o
     set kapandi_at = p_simdi
   where o.ulke = p_ulke and o.doctor_id = p_doctor_id and o.patient_id = p_patient_id and o.kapandi_at is null;
  update public.ulke_portal_erisimleri e
     set iptal_at = p_simdi
   where e.ulke = p_ulke and e.doctor_id = p_doctor_id and e.patient_id = p_patient_id and e.iptal_at is null;
  insert into public.ulke_portal_erisimleri (ulke, doctor_id, patient_id, token_hash, pin_hash, son_gecerlilik, created_at)
  values (p_ulke, p_doctor_id, p_patient_id, p_token_hash, p_pin_hash, p_son_gecerlilik, p_simdi)
  returning id into v_id;
  insert into public.ulke_portal_kayitlari (ulke, doctor_id, patient_id, olay, created_at)
  values (p_ulke, p_doctor_id, p_patient_id, 'erisim', p_simdi);
  return v_id;
end $$;

-- Withdraws a patient's link. true = a link was withdrawn; false = there was none (nothing changed, nothing recorded).
create or replace function public.ulke_portal_erisim_iptal(
  p_ulke text,
  p_doctor_id uuid,
  p_patient_id uuid,
  p_simdi timestamptz
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  n integer;
begin
  update public.ulke_portal_erisimleri e
     set iptal_at = p_simdi
   where e.ulke = p_ulke and e.doctor_id = p_doctor_id and e.patient_id = p_patient_id and e.iptal_at is null;
  get diagnostics n = row_count;
  if n = 0 then
    return false;
  end if;
  update public.ulke_portal_oturumlari o
     set kapandi_at = p_simdi
   where o.ulke = p_ulke and o.doctor_id = p_doctor_id and o.patient_id = p_patient_id and o.kapandi_at is null;
  insert into public.ulke_portal_kayitlari (ulke, doctor_id, patient_id, olay, created_at)
  values (p_ulke, p_doctor_id, p_patient_id, 'iptal', p_simdi);
  return true;
end $$;

-- Takes ONE PIN try from the link with this token, BEFORE the application looks at the PIN: a try is counted even
-- if the request is cut off afterwards, and two requests at the same moment cannot share one try.
--   'YOK'      no such link in this country, or it was withdrawn, or it has ended. One answer for all three.
--   'KILITLI'  the tries ran out
--   'YAVAS'    the try before this one was less than p_aralik_sn seconds ago: not counted, not looked at
--   'DENE'     a try was taken; the answer carries what the application needs to check the PIN
create or replace function public.ulke_portal_deneme_al(
  p_ulke text,
  p_token_hash text,
  p_azami integer,
  p_aralik_sn integer,
  p_simdi timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  e public.ulke_portal_erisimleri%rowtype;
begin
  select * into e from public.ulke_portal_erisimleri x where x.token_hash = p_token_hash and x.ulke = p_ulke for update;
  if not found or e.iptal_at is not null or e.son_gecerlilik <= p_simdi then
    return jsonb_build_object('durum', 'YOK');
  end if;
  if e.kilitlendi_at is not null then
    return jsonb_build_object('durum', 'KILITLI');
  end if;
  if e.hatali_deneme >= p_azami then
    update public.ulke_portal_erisimleri x set kilitlendi_at = p_simdi where x.id = e.id and x.ulke = p_ulke;
    update public.ulke_portal_oturumlari o set kapandi_at = p_simdi where o.erisim_id = e.id and o.ulke = p_ulke and o.kapandi_at is null;
    insert into public.ulke_portal_kayitlari (ulke, doctor_id, patient_id, olay, created_at) values (p_ulke, e.doctor_id, e.patient_id, 'kilit', p_simdi);
    return jsonb_build_object('durum', 'KILITLI');
  end if;
  if e.son_deneme_at is not null and p_simdi < e.son_deneme_at + make_interval(secs => p_aralik_sn) then
    return jsonb_build_object('durum', 'YAVAS');
  end if;
  update public.ulke_portal_erisimleri x
     set hatali_deneme = x.hatali_deneme + 1, son_deneme_at = p_simdi
   where x.id = e.id and x.ulke = p_ulke;
  return jsonb_build_object('durum', 'DENE', 'erisim_id', e.id, 'doctor_id', e.doctor_id, 'patient_id', e.patient_id, 'pin_hash', e.pin_hash);
end $$;

-- What the try turned out to be.
--   right PIN   the tries are given back, a session is opened (stored as the hash of its key), the sign-in is recorded → 'TAMAM'
--   wrong PIN   tries left → 'YANLIS' with how many; none left → the link is locked, its sessions are closed, the
--               lock is recorded → 'KILITLI'
--   'YOK'       the link was withdrawn, locked or ended meanwhile: nothing is opened
create or replace function public.ulke_portal_deneme_sonucu(
  p_ulke text,
  p_erisim_id uuid,
  p_dogru boolean,
  p_azami integer,
  p_oturum_hash text,
  p_oturum_bitis timestamptz,
  p_simdi timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  e public.ulke_portal_erisimleri%rowtype;
begin
  select * into e from public.ulke_portal_erisimleri x where x.id = p_erisim_id and x.ulke = p_ulke for update;
  if not found or e.iptal_at is not null or e.son_gecerlilik <= p_simdi then
    return jsonb_build_object('durum', 'YOK');
  end if;
  if e.kilitlendi_at is not null then
    return jsonb_build_object('durum', 'KILITLI');
  end if;
  if p_dogru then
    update public.ulke_portal_erisimleri x set hatali_deneme = 0, son_giris_at = p_simdi where x.id = e.id and x.ulke = p_ulke;
    insert into public.ulke_portal_oturumlari (ulke, doctor_id, patient_id, erisim_id, oturum_hash, son_gecerlilik, created_at)
    values (p_ulke, e.doctor_id, e.patient_id, e.id, p_oturum_hash, least(p_oturum_bitis, e.son_gecerlilik), p_simdi);
    insert into public.ulke_portal_kayitlari (ulke, doctor_id, patient_id, olay, created_at) values (p_ulke, e.doctor_id, e.patient_id, 'giris', p_simdi);
    return jsonb_build_object('durum', 'TAMAM', 'doctor_id', e.doctor_id, 'patient_id', e.patient_id);
  end if;
  if e.hatali_deneme >= p_azami then
    update public.ulke_portal_erisimleri x set kilitlendi_at = p_simdi where x.id = e.id and x.ulke = p_ulke;
    update public.ulke_portal_oturumlari o set kapandi_at = p_simdi where o.erisim_id = e.id and o.ulke = p_ulke and o.kapandi_at is null;
    insert into public.ulke_portal_kayitlari (ulke, doctor_id, patient_id, olay, created_at) values (p_ulke, e.doctor_id, e.patient_id, 'kilit', p_simdi);
    return jsonb_build_object('durum', 'KILITLI');
  end if;
  return jsonb_build_object('durum', 'YANLIS', 'kalan', p_azami - e.hatali_deneme);
end $$;

-- Shares (p_paylas true) or takes back (false) ONE summary of this doctor, and records it.
--   'TAMAM'      done, and recorded
--   'AYNI'       it already was that way: nothing changed, nothing recorded
--   'NOT_FOUND'  no such summary for this doctor in this country
-- (That the note is approved is held by the trigger on the table: an update of a summary of an unapproved note raises.)
create or replace function public.ulke_ozet_paylas(
  p_ulke text,
  p_doctor_id uuid,
  p_ozet_id uuid,
  p_paylas boolean,
  p_simdi timestamptz
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  z public.ulke_hasta_ozetleri%rowtype;
begin
  select * into z from public.ulke_hasta_ozetleri x where x.id = p_ozet_id and x.doctor_id = p_doctor_id and x.ulke = p_ulke for update;
  if not found then
    return 'NOT_FOUND';
  end if;
  if (z.paylasildi_at is not null) = p_paylas then
    return 'AYNI';
  end if;
  update public.ulke_hasta_ozetleri x
     set paylasildi_at = case when p_paylas then p_simdi else null end, updated_at = p_simdi
   where x.id = p_ozet_id and x.doctor_id = p_doctor_id and x.ulke = p_ulke;
  insert into public.ulke_portal_kayitlari (ulke, doctor_id, patient_id, olay, ozet_id, created_at)
  values (p_ulke, p_doctor_id, z.patient_id, case when p_paylas then 'paylasim' else 'geri-alma' end, p_ozet_id, p_simdi);
  return 'TAMAM';
end $$;

-- The doctor accepts a request by choosing a time: the appointment is booked and the request is marked accepted
-- TOGETHER. If the time is taken the insert raises 23P01 (the exclusion constraint of migration 135) and nothing
-- changes: the request is still waiting.
--   { durum: 'TAMAM', randevu_id }   { durum: 'CEVAPLANDI' } it was answered already   { durum: 'NOT_FOUND' }
create or replace function public.ulke_randevu_istegi_kabul(
  p_ulke text,
  p_doctor_id uuid,
  p_istek_id uuid,
  p_baslangic timestamptz,
  p_bitis timestamptz,
  p_neden_encrypted text,
  p_mesai_disi boolean,
  p_simdi timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  i public.ulke_randevu_istekleri%rowtype;
  v_id uuid;
begin
  select * into i from public.ulke_randevu_istekleri x where x.id = p_istek_id and x.doctor_id = p_doctor_id and x.ulke = p_ulke for update;
  if not found then
    return jsonb_build_object('durum', 'NOT_FOUND');
  end if;
  if i.durum <> 'bekliyor' then
    return jsonb_build_object('durum', 'CEVAPLANDI');
  end if;
  insert into public.ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis, neden_encrypted, durum, mesai_disi, created_at, updated_at)
  values (p_ulke, p_doctor_id, i.patient_id, p_baslangic, p_bitis, p_neden_encrypted, 'planlandi', coalesce(p_mesai_disi, false), p_simdi, p_simdi)
  returning id into v_id;
  update public.ulke_randevu_istekleri x
     set durum = 'kabul', randevu_id = v_id, cevap_at = p_simdi
   where x.id = p_istek_id and x.doctor_id = p_doctor_id and x.ulke = p_ulke;
  return jsonb_build_object('durum', 'TAMAM', 'randevu_id', v_id);
end $$;

revoke all on function public.ulke_hasta_ozeti_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_portal_erisim_ver(text, uuid, uuid, text, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_portal_erisim_iptal(text, uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_portal_deneme_al(text, text, integer, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_portal_deneme_sonucu(text, uuid, boolean, integer, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_ozet_paylas(text, uuid, uuid, boolean, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_randevu_istegi_kabul(text, uuid, uuid, timestamptz, timestamptz, text, boolean, timestamptz) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.ulke_portal_erisim_ver(text, uuid, uuid, text, text, timestamptz, timestamptz) to service_role;
    grant execute on function public.ulke_portal_erisim_iptal(text, uuid, uuid, timestamptz) to service_role;
    grant execute on function public.ulke_portal_deneme_al(text, text, integer, integer, timestamptz) to service_role;
    grant execute on function public.ulke_portal_deneme_sonucu(text, uuid, boolean, integer, text, timestamptz, timestamptz) to service_role;
    grant execute on function public.ulke_ozet_paylas(text, uuid, uuid, boolean, timestamptz) to service_role;
    grant execute on function public.ulke_randevu_istegi_kabul(text, uuid, uuid, timestamptz, timestamptz, text, boolean, timestamptz) to service_role;
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('137', '137_ulke_hasta_portali.sql', null, now(), false,
  'NOTYA-ULKE-PORTAL-01: patient portal of a country build: links (token and PIN as hashes, tries, lock, end, withdrawal), sessions, summaries of approved notes with a share switch, the record of sign-ins and shares, appointment requests; six functions, each one transaction and bound to the country. Server only.')
on conflict (version) do nothing;

commit;
