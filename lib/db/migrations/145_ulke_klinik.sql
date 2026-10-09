-- 145 NOTYA-ULKE-KLINIK-01 (Kaan, 2026-10-09) — CLINIC ACCOUNTS AND STAFF ROLES of a country build: a clinic with an
-- owner, its members and their positions, invitations to join, the GRANTS by which a doctor lets a member help with
-- that doctor's patients, and the RECORD of everything done through a grant.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once, after 139. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
-- A PATIENT STILL BELONGS TO ONE DOCTOR. Nothing here changes who owns a patient, and nothing here is a second way
-- to read a patient table: no existing table, key, policy, trigger or function is altered. Clinic access is ADDED,
-- as rows of ulke_klinik_yetkileri, each of which names the country, the clinic, the doctor whose patients it is
-- about, the member it is given to, and ONE capability. A position alone opens no patient.
--
--   1. ulke_klinikler               a clinic. `doctor_id` is its OWNER's account (the column is named as the account
--                                   column of every country table is). One clinic per owner.
--   2. ulke_klinik_uyeleri          a member: `doctor_id` is the member's account. AN ACCOUNT IS A MEMBER OF AT MOST
--                                   ONE CLINIC (unique (ulke, doctor_id)). `konum` is the member's one position:
--                                   sahip (owner) · yonetici (administrator) · hekim (doctor) · muttefik (allied
--                                   professional) · on-buro (front desk). Exactly one owner, who is the clinic's.
--                                   REMOVING A MEMBER IS DELETING THIS ROW: every grant given by or to that member
--                                   goes with it, by its foreign key, in the same statement.
--   3. ulke_klinik_davetleri        a one-use invitation code, stored only as a SHA-256 hash, with an expiry.
--                                   `doctor_id` is the member who issued it (owner or administrator; an invitation
--                                   to become an administrator only by the owner). Never a browsable list of clinics.
--   4. ulke_klinik_yetkileri        A GRANT. `doctor_id` is the doctor whose patients it is about; `alan_id` the
--                                   member it is given to; `tur` the one capability:
--                                     on-buro-randevu  see and manage that doctor's appointments, and the minimal
--                                                      patient card (name, birth date, phone)       → front desk
--                                     on-buro-hasta    create a patient with identity and contact fields only
--                                                                                                   → front desk
--                                     on-buro-portal   give a patient the portal link, ask for the intake form
--                                                                                                   → front desk
--                                     paylasim         read the approved notes of ONE NAMED PATIENT → allied
--                                     vekalet          cover: read approved notes and appointments of that doctor's
--                                                      patients FOR A STATED PERIOD (at most 31 days)
--                                                                                 → doctor, owner, administrator
--                                   Both must be members of the SAME clinic, by key. The patient of a share must be
--                                   that doctor's, by key. `kaydeden_id` is who entered the grant: the doctor, or the
--                                   clinic's owner (the application allows the second only where the country's pack
--                                   says so; the default is no). A grant never changes: it can only be withdrawn,
--                                   once. A new grant is a new row.
--   5. ulke_klinik_erisim_kayitlari THE RECORD. One row for every grant given, withdrawn or ended, and for EVERY
--                                   READ AND WRITE made through a grant: whose patients (`doctor_id`), who acted
--                                   (`kisi_id`), the member concerned (`alan_id`), which patient where there is one,
--                                   which capability, what was done, when. Append-only: a row is never changed and
--                                   never deleted by a statement (it goes only with the doctor or the patient it
--                                   belongs to). The owning doctor reads it as a list.
--
-- WHAT THE DATABASE HOLDS BY ITSELF, whatever the application does: the keys above; the position a capability may be
-- given to; that the owner stays the owner; that a member who changes position loses every grant; that an
-- invitation is used once; that a grant and a record row do not change.
-- WHAT THE APPLICATION CHECKS ON EVERY REQUEST (lib/ulke/klinik/yetki.ts): that the grant exists now, is not
-- withdrawn, is inside its period, that both are members now, that the position and the role still fit, and that the
-- country's pack allows the capability. Then it writes the record row, and only then reads.
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles, on all five tables.
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 145 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_hastalar') is null then
    raise exception 'country migration 145 refused: the patient table of a country database (public.ulke_hastalar) is missing. Run the earlier country migrations first.';
  end if;
end $$;

-- ── 1. Clinics ───────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_klinikler (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  -- The OWNER's account.
  doctor_id uuid not null,
  ad text not null check (char_length(btrim(ad)) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_klinikler_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_klinikler_ulke_id_tekil unique (ulke, id),
  constraint ulke_klinikler_sahip_tekil unique (ulke, doctor_id)
);

-- ── 2. Members ───────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_klinik_uyeleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  klinik_id uuid not null,
  -- The MEMBER's account.
  doctor_id uuid not null,
  konum text not null check (konum in ('sahip', 'yonetici', 'hekim', 'muttefik', 'on-buro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_klinik_uyeleri_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_klinik_uyeleri_klinik_fk foreign key (ulke, klinik_id) references public.ulke_klinikler (ulke, id) on delete cascade,
  -- AT MOST ONE CLINIC PER ACCOUNT.
  constraint ulke_klinik_uyeleri_tek_klinik unique (ulke, doctor_id),
  constraint ulke_klinik_uyeleri_uye_tekil unique (ulke, klinik_id, doctor_id)
);

-- Exactly one owner per clinic.
create unique index if not exists ulke_klinik_uyeleri_tek_sahip on public.ulke_klinik_uyeleri (ulke, klinik_id) where konum = 'sahip';

-- ── 3. Invitations ───────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_klinik_davetleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  klinik_id uuid not null,
  -- The member who ISSUED the invitation.
  doctor_id uuid not null,
  -- The position the invitation gives. Never the owner's.
  konum text not null check (konum in ('yonetici', 'hekim', 'muttefik', 'on-buro')),
  kod_hash text not null check (kod_hash ~ '^[0-9a-f]{64}$'),
  son_gecerlilik timestamptz not null,
  kullanildi_at timestamptz,
  kullanan_id uuid,
  iptal_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kullanildi_at is null) = (kullanan_id is null)),
  check (son_gecerlilik > created_at and son_gecerlilik <= created_at + interval '31 days'),
  constraint ulke_klinik_davetleri_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  -- The issuer must be a member of that clinic; an invitation goes with its issuer's membership.
  constraint ulke_klinik_davetleri_veren_fk foreign key (ulke, klinik_id, doctor_id) references public.ulke_klinik_uyeleri (ulke, klinik_id, doctor_id) on delete cascade,
  constraint ulke_klinik_davetleri_kod_tekil unique (kod_hash)
);

create index if not exists ulke_klinik_davetleri_klinik_idx on public.ulke_klinik_davetleri (ulke, klinik_id, created_at desc);

-- ── 4. Grants ────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_klinik_yetkileri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  klinik_id uuid not null,
  -- The doctor WHOSE PATIENTS the grant is about.
  doctor_id uuid not null,
  -- The member the grant is GIVEN TO.
  alan_id uuid not null,
  tur text not null check (tur in ('on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet')),
  -- A share names ONE patient; no other capability names any.
  patient_id uuid,
  -- Cover has a stated period; no other capability has one.
  baslangic timestamptz,
  bitis timestamptz,
  -- Who entered the grant: the doctor, or the clinic's owner.
  kaydeden_id uuid not null,
  iptal_at timestamptz,
  iptal_eden_id uuid,
  created_at timestamptz not null default now(),
  check (doctor_id <> alan_id),
  check ((tur = 'paylasim') = (patient_id is not null)),
  check ((tur = 'vekalet') = (baslangic is not null)),
  check ((baslangic is null) = (bitis is null)),
  check (bitis is null or (bitis > baslangic and bitis <= baslangic + interval '31 days')),
  check (iptal_eden_id is null or iptal_at is not null),
  constraint ulke_klinik_yetkileri_veren_fk foreign key (ulke, klinik_id, doctor_id) references public.ulke_klinik_uyeleri (ulke, klinik_id, doctor_id) on delete cascade,
  constraint ulke_klinik_yetkileri_alan_fk foreign key (ulke, klinik_id, alan_id) references public.ulke_klinik_uyeleri (ulke, klinik_id, doctor_id) on delete cascade,
  -- The patient of a share is THAT doctor's, in that country — and the share goes with the patient.
  constraint ulke_klinik_yetkileri_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

-- One grant of a kind, from one doctor to one member (for one patient), that is not withdrawn.
create unique index if not exists ulke_klinik_yetkileri_tek_acik
  on public.ulke_klinik_yetkileri (ulke, doctor_id, alan_id, tur, coalesce(patient_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where iptal_at is null;
create index if not exists ulke_klinik_yetkileri_alan_idx on public.ulke_klinik_yetkileri (ulke, alan_id, tur) where iptal_at is null;
create index if not exists ulke_klinik_yetkileri_veren_idx on public.ulke_klinik_yetkileri (ulke, doctor_id, created_at desc);

-- ── 5. The record ────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_klinik_erisim_kayitlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  -- The doctor WHOSE PATIENTS were reached, and who reads this record.
  doctor_id uuid not null,
  -- Who acted, and the member the grant was given to (the same account for a read or a write through a grant).
  kisi_id uuid not null,
  alan_id uuid not null,
  patient_id uuid,
  -- The grant it happened through. No key on purpose: the row outlives the grant.
  yetki_id uuid,
  tur text not null check (tur in ('on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet')),
  olay text not null check (olay in ('verildi', 'geri-alindi', 'bitti', 'okuma', 'yazma')),
  -- What was read or written, as a key of the application ('randevu-listesi', 'hasta-karti', 'not', …).
  ne text check (ne is null or (ne ~ '^[a-z]+(-[a-z]+)*$' and char_length(ne) <= 40)),
  created_at timestamptz not null default now(),
  check ((olay in ('okuma', 'yazma')) = (ne is not null)),
  constraint ulke_klinik_erisim_kayitlari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade,
  constraint ulke_klinik_erisim_kayitlari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  -- NO cascade: an account that appears in another doctor's record cannot be removed while that record stands.
  constraint ulke_klinik_erisim_kayitlari_kisi_fk foreign key (ulke, kisi_id) references public.ulke_hesaplari (ulke, id),
  constraint ulke_klinik_erisim_kayitlari_alan_fk foreign key (ulke, alan_id) references public.ulke_hesaplari (ulke, id)
);

create index if not exists ulke_klinik_erisim_kayitlari_doctor_idx on public.ulke_klinik_erisim_kayitlari (ulke, doctor_id, created_at desc);
create index if not exists ulke_klinik_erisim_kayitlari_hasta_idx on public.ulke_klinik_erisim_kayitlari (ulke, doctor_id, patient_id, created_at desc) where patient_id is not null;

-- ── 6. What these rows may never do ──────────────────────────────────────────────────────────────────────────

-- A clinic keeps its country and its owner.
create or replace function public.ulke_klinik_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'ulke_klinikler: a clinic keeps its country and its owner' using errcode = '23514';
  end if;
  return new;
end $$;

-- A member: the owner is the clinic's owner and nobody else is; a member never moves; the owner's position never
-- changes and is never given; a member whose position changes loses every grant, given and received.
create or replace function public.ulke_klinik_uye_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_sahip uuid;
begin
  if tg_op = 'DELETE' then
    if old.konum = 'sahip' and exists (select 1 from public.ulke_klinikler k where k.id = old.klinik_id and k.ulke = old.ulke) then
      raise exception 'ulke_klinik_uyeleri: the owner is not removed from the clinic' using errcode = '23514';
    end if;
    return old;
  end if;
  if tg_op = 'INSERT' then
    select k.doctor_id into v_sahip from public.ulke_klinikler k where k.id = new.klinik_id and k.ulke = new.ulke;
    if not found then
      raise exception 'ulke_klinik_uyeleri: no such clinic in this country' using errcode = '23503';
    end if;
    if (new.konum = 'sahip') is distinct from (new.doctor_id = v_sahip) then
      raise exception 'ulke_klinik_uyeleri: the owner''s position belongs to the clinic''s owner and to nobody else' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.ulke is distinct from old.ulke or new.klinik_id is distinct from old.klinik_id or new.doctor_id is distinct from old.doctor_id or new.id is distinct from old.id then
    raise exception 'ulke_klinik_uyeleri: a member never moves to another country, clinic or account' using errcode = '23514';
  end if;
  if new.konum is distinct from old.konum then
    if old.konum = 'sahip' or new.konum = 'sahip' then
      raise exception 'ulke_klinik_uyeleri: the owner''s position is not changed and not given' using errcode = '23514';
    end if;
    update public.ulke_klinik_yetkileri y
       set iptal_at = now()
     where y.ulke = old.ulke and y.klinik_id = old.klinik_id and y.iptal_at is null
       and (y.doctor_id = old.doctor_id or y.alan_id = old.doctor_id);
  end if;
  return new;
end $$;

-- An invitation: issued by the owner or an administrator of that clinic (an administrator's only by the owner);
-- nothing about it changes; it is used once or withdrawn once, never both.
create or replace function public.ulke_klinik_davet_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_konum text;
begin
  if tg_op = 'INSERT' then
    select u.konum into v_konum from public.ulke_klinik_uyeleri u where u.ulke = new.ulke and u.klinik_id = new.klinik_id and u.doctor_id = new.doctor_id;
    if v_konum is null or v_konum not in ('sahip', 'yonetici') or (new.konum = 'yonetici' and v_konum <> 'sahip') then
      raise exception 'ulke_klinik_davetleri: this member may not issue this invitation' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.ulke is distinct from old.ulke or new.klinik_id is distinct from old.klinik_id or new.doctor_id is distinct from old.doctor_id
     or new.konum is distinct from old.konum or new.kod_hash is distinct from old.kod_hash or new.son_gecerlilik is distinct from old.son_gecerlilik
     or new.created_at is distinct from old.created_at or new.id is distinct from old.id then
    raise exception 'ulke_klinik_davetleri: an invitation does not change' using errcode = '23514';
  end if;
  if (old.kullanildi_at is not null or old.iptal_at is not null)
     and (new.kullanildi_at is distinct from old.kullanildi_at or new.kullanan_id is distinct from old.kullanan_id or new.iptal_at is distinct from old.iptal_at) then
    raise exception 'ulke_klinik_davetleri: an invitation is used once or withdrawn once' using errcode = '23514';
  end if;
  if new.kullanildi_at is not null and new.iptal_at is not null then
    raise exception 'ulke_klinik_davetleri: an invitation is used or withdrawn, never both' using errcode = '23514';
  end if;
  return new;
end $$;

-- A grant: the capability fits the position of the member it is given to; the doctor whose patients it is about is
-- not a front-desk member; it was entered by that doctor or by the clinic's owner; nothing about it changes; it is
-- withdrawn once.
create or replace function public.ulke_klinik_yetki_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_alan text;
  v_veren text;
  v_kaydeden text;
begin
  if tg_op = 'INSERT' then
    select u.konum into v_alan from public.ulke_klinik_uyeleri u where u.ulke = new.ulke and u.klinik_id = new.klinik_id and u.doctor_id = new.alan_id;
    select u.konum into v_veren from public.ulke_klinik_uyeleri u where u.ulke = new.ulke and u.klinik_id = new.klinik_id and u.doctor_id = new.doctor_id;
    if v_alan is null or v_veren is null then
      raise exception 'ulke_klinik_yetkileri: both must be members of the clinic' using errcode = '23503';
    end if;
    if v_veren = 'on-buro' then
      raise exception 'ulke_klinik_yetkileri: a front-desk member has no patients to give a grant for' using errcode = '23514';
    end if;
    if not ((new.tur in ('on-buro-randevu', 'on-buro-hasta', 'on-buro-portal') and v_alan = 'on-buro')
         or (new.tur = 'paylasim' and v_alan = 'muttefik')
         or (new.tur = 'vekalet' and v_alan in ('hekim', 'sahip', 'yonetici'))) then
      raise exception 'ulke_klinik_yetkileri: this capability is not given to a member in that position' using errcode = '23514';
    end if;
    if new.kaydeden_id <> new.doctor_id then
      select u.konum into v_kaydeden from public.ulke_klinik_uyeleri u where u.ulke = new.ulke and u.klinik_id = new.klinik_id and u.doctor_id = new.kaydeden_id;
      if v_kaydeden is distinct from 'sahip' then
        raise exception 'ulke_klinik_yetkileri: a grant is entered by the doctor whose patients it is about, or by the clinic''s owner' using errcode = '23514';
      end if;
    end if;
    if new.iptal_at is not null then
      raise exception 'ulke_klinik_yetkileri: a grant is not born withdrawn' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.ulke is distinct from old.ulke or new.klinik_id is distinct from old.klinik_id or new.doctor_id is distinct from old.doctor_id
     or new.alan_id is distinct from old.alan_id or new.tur is distinct from old.tur or new.patient_id is distinct from old.patient_id
     or new.baslangic is distinct from old.baslangic or new.bitis is distinct from old.bitis or new.kaydeden_id is distinct from old.kaydeden_id
     or new.created_at is distinct from old.created_at or new.id is distinct from old.id then
    raise exception 'ulke_klinik_yetkileri: a grant does not change; a new grant is a new row' using errcode = '23514';
  end if;
  if old.iptal_at is not null and (new.iptal_at is distinct from old.iptal_at or new.iptal_eden_id is distinct from old.iptal_eden_id) then
    raise exception 'ulke_klinik_yetkileri: a withdrawn grant stays withdrawn' using errcode = '23514';
  end if;
  return new;
end $$;

-- The record is append-only. A row is never changed, and never deleted by a statement of its own: it goes only when
-- the doctor or the patient it belongs to goes (a delete that arrives through a foreign key runs one level deeper).
create or replace function public.ulke_klinik_erisim_kaydi_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'ulke_klinik_erisim_kayitlari: a record row does not change' using errcode = '23514';
  end if;
  if pg_trigger_depth() < 2 then
    raise exception 'ulke_klinik_erisim_kayitlari: a record row is not deleted' using errcode = '23514';
  end if;
  return old;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_klinik_kilidi' and tgrelid = 'public.ulke_klinikler'::regclass) then
    create trigger ulke_klinik_kilidi
      before update on public.ulke_klinikler
      for each row execute function public.ulke_klinik_kilidi();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ulke_klinik_uye_kilidi' and tgrelid = 'public.ulke_klinik_uyeleri'::regclass) then
    create trigger ulke_klinik_uye_kilidi
      before insert or update or delete on public.ulke_klinik_uyeleri
      for each row execute function public.ulke_klinik_uye_kilidi();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ulke_klinik_davet_kilidi' and tgrelid = 'public.ulke_klinik_davetleri'::regclass) then
    create trigger ulke_klinik_davet_kilidi
      before insert or update on public.ulke_klinik_davetleri
      for each row execute function public.ulke_klinik_davet_kilidi();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ulke_klinik_yetki_kilidi' and tgrelid = 'public.ulke_klinik_yetkileri'::regclass) then
    create trigger ulke_klinik_yetki_kilidi
      before insert or update on public.ulke_klinik_yetkileri
      for each row execute function public.ulke_klinik_yetki_kilidi();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ulke_klinik_erisim_kaydi_kilidi' and tgrelid = 'public.ulke_klinik_erisim_kayitlari'::regclass) then
    create trigger ulke_klinik_erisim_kaydi_kilidi
      before update or delete on public.ulke_klinik_erisim_kayitlari
      for each row execute function public.ulke_klinik_erisim_kaydi_kilidi();
  end if;
end $$;

-- ── 7. Functions ─────────────────────────────────────────────────────────────────────────────────────────────
-- Every function body runs inside the caller's transaction: if a statement fails or the function raises, every
-- statement before it is undone. Each takes the country as `p_ulke` and names it in every statement.

-- An account creates a clinic and becomes its owner, in one step.
--   'UYE'    the account is already a member of a clinic (its own or another): nothing is written
--   'TAMAM'  with the clinic's id
create or replace function public.ulke_klinik_kur(
  p_ulke text,
  p_doctor_id uuid,
  p_ad text,
  p_simdi timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- The account row is locked, so two requests of the same account at the same moment take turns.
  perform 1 from public.ulke_hesaplari h where h.id = p_doctor_id and h.ulke = p_ulke for update;
  if not found then
    return jsonb_build_object('durum', 'NOT_FOUND');
  end if;
  if exists (select 1 from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.doctor_id = p_doctor_id) then
    return jsonb_build_object('durum', 'UYE');
  end if;
  insert into public.ulke_klinikler (ulke, doctor_id, ad, created_at, updated_at)
  values (p_ulke, p_doctor_id, btrim(p_ad), p_simdi, p_simdi)
  returning id into v_id;
  insert into public.ulke_klinik_uyeleri (ulke, klinik_id, doctor_id, konum, created_at, updated_at)
  values (p_ulke, v_id, p_doctor_id, 'sahip', p_simdi, p_simdi);
  return jsonb_build_object('durum', 'TAMAM', 'klinik_id', v_id);
end $$;

-- An account joins a clinic with an invitation code (its hash). The code is used up in the same step.
--   'KOD'    no such code in this country, or it was used, withdrawn or has ended. One answer for all four.
--   'UYE'    the account is already a member of a clinic: the code is NOT used up
--   'TAMAM'  with the clinic's id and the position
create or replace function public.ulke_klinik_katil(
  p_ulke text,
  p_kod_hash text,
  p_doctor_id uuid,
  p_simdi timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  d record;
begin
  perform 1 from public.ulke_hesaplari h where h.id = p_doctor_id and h.ulke = p_ulke for update;
  if not found then
    return jsonb_build_object('durum', 'KOD');
  end if;
  select x.id, x.klinik_id, x.konum, x.kullanildi_at, x.iptal_at, x.son_gecerlilik into d
    from public.ulke_klinik_davetleri x
   where x.kod_hash = p_kod_hash and x.ulke = p_ulke
     for update;
  if not found or d.kullanildi_at is not null or d.iptal_at is not null or d.son_gecerlilik <= p_simdi then
    return jsonb_build_object('durum', 'KOD');
  end if;
  if exists (select 1 from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.doctor_id = p_doctor_id) then
    return jsonb_build_object('durum', 'UYE');
  end if;
  insert into public.ulke_klinik_uyeleri (ulke, klinik_id, doctor_id, konum, created_at, updated_at)
  values (p_ulke, d.klinik_id, p_doctor_id, d.konum, p_simdi, p_simdi);
  update public.ulke_klinik_davetleri x
     set kullanildi_at = p_simdi, kullanan_id = p_doctor_id
   where x.id = d.id and x.ulke = p_ulke;
  return jsonb_build_object('durum', 'TAMAM', 'klinik_id', d.klinik_id, 'konum', d.konum);
end $$;

-- Who may act on a member of a clinic: the owner on anybody but the owner; an administrator on a doctor, an allied
-- professional or a front-desk member. Internal to the two functions below.
create or replace function public.ulke_klinik_yonetebilir(p_yapan_konum text, p_hedef_konum text) returns boolean
language sql immutable
set search_path = public
as $$
  select p_hedef_konum is not null and p_hedef_konum <> 'sahip'
     and (p_yapan_konum = 'sahip' or (p_yapan_konum = 'yonetici' and p_hedef_konum in ('hekim', 'muttefik', 'on-buro')))
$$;

-- A member leaves (p_yapan_id = p_doctor_id) or is removed by the owner or an administrator. Every grant given by
-- or to that member ENDS in the same step (the rows go with the membership, by key); each one that was still open
-- is written to the record first.
--   'NOT_FOUND'  no such member of that clinic in this country, or the one who asks is not a member of it
--   'SAHIP'      the owner is not removed
--   'YETKI_YOK'  the one who asks may not remove that member
--   'TAMAM'
create or replace function public.ulke_klinik_uye_cikar(
  p_ulke text,
  p_klinik_id uuid,
  p_doctor_id uuid,
  p_yapan_id uuid,
  p_simdi timestamptz
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_hedef text;
  v_yapan text;
begin
  select u.konum into v_hedef from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_doctor_id for update;
  select u.konum into v_yapan from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_yapan_id;
  if v_hedef is null or v_yapan is null then
    return 'NOT_FOUND';
  end if;
  if v_hedef = 'sahip' then
    return 'SAHIP';
  end if;
  if p_yapan_id <> p_doctor_id and not public.ulke_klinik_yonetebilir(v_yapan, v_hedef) then
    return 'YETKI_YOK';
  end if;
  insert into public.ulke_klinik_erisim_kayitlari (ulke, doctor_id, kisi_id, alan_id, patient_id, yetki_id, tur, olay, created_at)
  select y.ulke, y.doctor_id, p_yapan_id, y.alan_id, y.patient_id, y.id, y.tur, 'bitti', p_simdi
    from public.ulke_klinik_yetkileri y
   where y.ulke = p_ulke and y.klinik_id = p_klinik_id and y.iptal_at is null
     and (y.doctor_id = p_doctor_id or y.alan_id = p_doctor_id);
  delete from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_doctor_id;
  return 'TAMAM';
end $$;

-- The owner or an administrator changes a member's position. Every grant given by or to that member ends in the
-- same step, and each is written to the record: a position is never changed with access left standing.
--   'NOT_FOUND' · 'SAHIP' (the owner's position is not changed and not given) · 'YETKI_YOK' · 'AYNI' · 'TAMAM'
create or replace function public.ulke_klinik_konum_degistir(
  p_ulke text,
  p_klinik_id uuid,
  p_doctor_id uuid,
  p_konum text,
  p_yapan_id uuid,
  p_simdi timestamptz
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_hedef text;
  v_yapan text;
begin
  select u.konum into v_hedef from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_doctor_id for update;
  select u.konum into v_yapan from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_yapan_id;
  if v_hedef is null or v_yapan is null then
    return 'NOT_FOUND';
  end if;
  if v_hedef = 'sahip' or p_konum = 'sahip' then
    return 'SAHIP';
  end if;
  if p_konum is null or p_konum not in ('yonetici', 'hekim', 'muttefik', 'on-buro') then
    return 'YETKI_YOK';
  end if;
  -- Both the position the member has and the one they would get must be within what the one who asks may manage.
  if p_yapan_id = p_doctor_id or not public.ulke_klinik_yonetebilir(v_yapan, v_hedef) or not public.ulke_klinik_yonetebilir(v_yapan, p_konum) then
    return 'YETKI_YOK';
  end if;
  if v_hedef = p_konum then
    return 'AYNI';
  end if;
  insert into public.ulke_klinik_erisim_kayitlari (ulke, doctor_id, kisi_id, alan_id, patient_id, yetki_id, tur, olay, created_at)
  select y.ulke, y.doctor_id, p_yapan_id, y.alan_id, y.patient_id, y.id, y.tur, 'bitti', p_simdi
    from public.ulke_klinik_yetkileri y
   where y.ulke = p_ulke and y.klinik_id = p_klinik_id and y.iptal_at is null
     and (y.doctor_id = p_doctor_id or y.alan_id = p_doctor_id);
  update public.ulke_klinik_yetkileri y
     set iptal_at = p_simdi, iptal_eden_id = p_yapan_id
   where y.ulke = p_ulke and y.klinik_id = p_klinik_id and y.iptal_at is null
     and (y.doctor_id = p_doctor_id or y.alan_id = p_doctor_id);
  update public.ulke_klinik_uyeleri u
     set konum = p_konum, updated_at = p_simdi
   where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_doctor_id;
  return 'TAMAM';
end $$;

-- A grant is given. `p_doctor_id` is the doctor whose patients it is about, `p_kaydeden_id` who asks: that doctor,
-- or the clinic's owner (the application decides whether the country allows the second at all).
--   'NOT_FOUND'  one of the two is not a member of that clinic in this country, or the patient is not that doctor's
--   'YETKI_YOK'  the one who asks is neither that doctor nor the clinic's owner
--   'KONUM'      the capability is not given to a member in that position
--   'GECERSIZ'   a share without a patient, cover without a period, a period that is too long or has ended
--   'VAR'        the same grant already stands (with its id); nothing is written
--   'TAMAM'      with the new grant's id. Cover that already stood is withdrawn and replaced by the new period.
create or replace function public.ulke_klinik_yetki_ver(
  p_ulke text,
  p_klinik_id uuid,
  p_doctor_id uuid,
  p_alan_id uuid,
  p_tur text,
  p_patient_id uuid,
  p_baslangic timestamptz,
  p_bitis timestamptz,
  p_kaydeden_id uuid,
  p_simdi timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_veren text;
  v_alan text;
  v_kaydeden text;
  v_var uuid;
  v_id uuid;
begin
  -- The grantor's membership row is locked, so two requests for the same doctor at the same moment take turns.
  select u.konum into v_veren from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_doctor_id for update;
  select u.konum into v_alan from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_alan_id;
  if v_veren is null or v_alan is null or p_doctor_id = p_alan_id then
    return jsonb_build_object('durum', 'NOT_FOUND');
  end if;
  if p_kaydeden_id <> p_doctor_id then
    select u.konum into v_kaydeden from public.ulke_klinik_uyeleri u where u.ulke = p_ulke and u.klinik_id = p_klinik_id and u.doctor_id = p_kaydeden_id;
    if v_kaydeden is distinct from 'sahip' then
      return jsonb_build_object('durum', 'YETKI_YOK');
    end if;
  end if;
  if p_tur is null or p_tur not in ('on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet') then
    return jsonb_build_object('durum', 'GECERSIZ');
  end if;
  if v_veren = 'on-buro'
     or not ((p_tur in ('on-buro-randevu', 'on-buro-hasta', 'on-buro-portal') and v_alan = 'on-buro')
          or (p_tur = 'paylasim' and v_alan = 'muttefik')
          or (p_tur = 'vekalet' and v_alan in ('hekim', 'sahip', 'yonetici'))) then
    return jsonb_build_object('durum', 'KONUM');
  end if;
  if (p_tur = 'paylasim') is distinct from (p_patient_id is not null) then
    return jsonb_build_object('durum', 'GECERSIZ');
  end if;
  if p_tur = 'vekalet' then
    if p_baslangic is null or p_bitis is null or p_bitis <= p_baslangic or p_bitis <= p_simdi or p_bitis > p_baslangic + interval '31 days' then
      return jsonb_build_object('durum', 'GECERSIZ');
    end if;
  elsif p_baslangic is not null or p_bitis is not null then
    return jsonb_build_object('durum', 'GECERSIZ');
  end if;
  if p_patient_id is not null and not exists (select 1 from public.ulke_hastalar h where h.id = p_patient_id and h.doctor_id = p_doctor_id and h.ulke = p_ulke) then
    return jsonb_build_object('durum', 'NOT_FOUND');
  end if;
  select y.id into v_var
    from public.ulke_klinik_yetkileri y
   where y.ulke = p_ulke and y.doctor_id = p_doctor_id and y.alan_id = p_alan_id and y.tur = p_tur
     and y.patient_id is not distinct from p_patient_id and y.iptal_at is null;
  if v_var is not null then
    if p_tur <> 'vekalet' then
      return jsonb_build_object('durum', 'VAR', 'yetki_id', v_var);
    end if;
    update public.ulke_klinik_yetkileri y set iptal_at = p_simdi, iptal_eden_id = p_kaydeden_id where y.id = v_var and y.ulke = p_ulke;
    insert into public.ulke_klinik_erisim_kayitlari (ulke, doctor_id, kisi_id, alan_id, patient_id, yetki_id, tur, olay, created_at)
    values (p_ulke, p_doctor_id, p_kaydeden_id, p_alan_id, null, v_var, p_tur, 'geri-alindi', p_simdi);
  end if;
  insert into public.ulke_klinik_yetkileri (ulke, klinik_id, doctor_id, alan_id, tur, patient_id, baslangic, bitis, kaydeden_id, created_at)
  values (p_ulke, p_klinik_id, p_doctor_id, p_alan_id, p_tur, p_patient_id, p_baslangic, p_bitis, p_kaydeden_id, p_simdi)
  returning id into v_id;
  insert into public.ulke_klinik_erisim_kayitlari (ulke, doctor_id, kisi_id, alan_id, patient_id, yetki_id, tur, olay, created_at)
  values (p_ulke, p_doctor_id, p_kaydeden_id, p_alan_id, p_patient_id, v_id, p_tur, 'verildi', p_simdi);
  return jsonb_build_object('durum', 'TAMAM', 'yetki_id', v_id);
end $$;

-- A grant is withdrawn: by the doctor whose patients it is about, by the member it was given to (who gives it up),
-- or by whoever entered it. It ends at once and is written to the record.
--   'NOT_FOUND'  no such grant in this country FOR THE ONE WHO ASKS
--   'AYNI'       it was already withdrawn; nothing is written
--   'TAMAM'
create or replace function public.ulke_klinik_yetki_geri_al(
  p_ulke text,
  p_yetki_id uuid,
  p_yapan_id uuid,
  p_simdi timestamptz
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  y record;
begin
  select x.id, x.doctor_id, x.alan_id, x.patient_id, x.tur, x.iptal_at into y
    from public.ulke_klinik_yetkileri x
   where x.id = p_yetki_id and x.ulke = p_ulke
     and (x.doctor_id = p_yapan_id or x.alan_id = p_yapan_id or x.kaydeden_id = p_yapan_id)
     for update;
  if not found then
    return 'NOT_FOUND';
  end if;
  if y.iptal_at is not null then
    return 'AYNI';
  end if;
  update public.ulke_klinik_yetkileri x set iptal_at = p_simdi, iptal_eden_id = p_yapan_id where x.id = y.id and x.ulke = p_ulke;
  insert into public.ulke_klinik_erisim_kayitlari (ulke, doctor_id, kisi_id, alan_id, patient_id, yetki_id, tur, olay, created_at)
  values (p_ulke, y.doctor_id, p_yapan_id, y.alan_id, y.patient_id, y.id, y.tur, 'geri-alindi', p_simdi);
  return 'TAMAM';
end $$;

alter table public.ulke_klinikler enable row level security;
alter table public.ulke_klinik_uyeleri enable row level security;
alter table public.ulke_klinik_davetleri enable row level security;
alter table public.ulke_klinik_yetkileri enable row level security;
alter table public.ulke_klinik_erisim_kayitlari enable row level security;
revoke all on table public.ulke_klinikler from anon, authenticated;
revoke all on table public.ulke_klinik_uyeleri from anon, authenticated;
revoke all on table public.ulke_klinik_davetleri from anon, authenticated;
revoke all on table public.ulke_klinik_yetkileri from anon, authenticated;
revoke all on table public.ulke_klinik_erisim_kayitlari from anon, authenticated;

revoke all on function public.ulke_klinik_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_klinik_uye_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_klinik_davet_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_klinik_yetki_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_klinik_erisim_kaydi_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_klinik_yonetebilir(text, text) from public, anon, authenticated;
revoke all on function public.ulke_klinik_kur(text, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_klinik_katil(text, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_klinik_uye_cikar(text, uuid, uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_klinik_konum_degistir(text, uuid, uuid, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_klinik_yetki_ver(text, uuid, uuid, uuid, text, uuid, timestamptz, timestamptz, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.ulke_klinik_yetki_geri_al(text, uuid, uuid, timestamptz) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.ulke_klinik_yonetebilir(text, text) to service_role;
    grant execute on function public.ulke_klinik_kur(text, uuid, text, timestamptz) to service_role;
    grant execute on function public.ulke_klinik_katil(text, text, uuid, timestamptz) to service_role;
    grant execute on function public.ulke_klinik_uye_cikar(text, uuid, uuid, uuid, timestamptz) to service_role;
    grant execute on function public.ulke_klinik_konum_degistir(text, uuid, uuid, text, uuid, timestamptz) to service_role;
    grant execute on function public.ulke_klinik_yetki_ver(text, uuid, uuid, uuid, text, uuid, timestamptz, timestamptz, uuid, timestamptz) to service_role;
    grant execute on function public.ulke_klinik_yetki_geri_al(text, uuid, uuid, timestamptz) to service_role;
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('145', '145_ulke_klinik.sql', null, now(), false,
  'NOTYA-ULKE-KLINIK-01: clinic accounts of a country build: clinics, members with one position each (one clinic per account), one-use invitation codes as hashes, grants by which a doctor lets a member help with that doctor''s patients (one capability each, same clinic by key), and the append-only record of every grant and of every read and write made through one. Six functions, each one transaction and bound to the country. No existing table is altered. Server only.')
on conflict (version) do nothing;

commit;
