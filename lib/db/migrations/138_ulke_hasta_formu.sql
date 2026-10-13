-- 138 NOTYA-ULKE-INTAKE-01 (Kaan, 2026-10-09) — THE INTAKE FORM of a country build: the form a patient fills in
-- before a visit, in the patient portal.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once, after 137. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
--   1. ulke_hasta_formlari      ONE ROW PER FORM a doctor asked a patient to fill in. The questions are not here:
--                               they are the country pack's content, and the row names which set it was asked with
--                               (the doctor's role at that moment, the pack's version stamp, and whether the form
--                               is addressed to a parent or guardian). THE ANSWERS ARE HEALTH DATA: one encrypted
--                               value (AES-256-GCM, same helper as the rest of a patient's data), never a column
--                               per answer. A form belongs to ONE patient of ONE doctor in ONE country, by its key.
--                               A patient has at most one form that is still open (asked for, or begun).
--                                 bekliyor    asked for, nothing saved yet
--                                 taslak      begun: answers saved, not submitted (also: reopened by the doctor)
--                                 gonderildi  submitted, once. The answers no longer change.
--                                 iptal       withdrawn by the doctor before it was submitted
--   2. ulke_hasta_formu_kilidi  a trigger that holds, in the database, what no path of the application may break:
--                               a submitted form's answers do not change (the doctor reopens the form, which makes
--                               it a draft again); a withdrawn form does not change at all; the country, doctor,
--                               patient, question set and guardian mark of a form never change.
--   3. ulke_hasta_formu_iste    ONE TRANSACTION, bound to the country it is called for (`p_ulke` in every
--                               statement): asks a patient for the form and, IN THE SAME STEP, gives the patient
--                               portal access where they have none that works (or where the doctor asks for a new
--                               link) — through ulke_portal_erisim_ver of migration 137, so the link before it is
--                               withdrawn and the event is recorded exactly as when the doctor gives access by hand.
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles. Neither a doctor's browser
-- session nor a patient's ever reads the table directly; the server's routes do, binding every statement to
-- country, doctor and patient. The function is closed to the browser roles.
--
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 138 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_portal_erisimleri') is null then
    raise exception 'country migration 138 refused: the patient portal (migration 137) is not on this database. Run 137 first.';
  end if;
end $$;

-- ── 1. Forms ─────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_hasta_formlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  -- The appointment the form was asked for, where it was asked from one. The same country's, doctor's AND patient's.
  randevu_id uuid,
  -- The role whose questions follow the core questions: the doctor's role when the form was asked for.
  -- null = the account had no role: the form holds the core questions only.
  rol text check (rol is null or rol ~ '^[a-z]+(-[a-z]+)*$'),
  -- The pack's stamp of its question set at that moment, so that answers are always read against what was asked.
  soru_surumu text not null check (char_length(soru_surumu) between 1 and 80),
  -- true = the patient was below the country's guardian age: the form is addressed to a parent or guardian.
  veli boolean not null,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'taslak', 'gonderildi', 'iptal')),
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts): every answer, as one value.
  cevaplar_encrypted text,
  -- BCP-47 language (and script) the patient read and answered the form in.
  dil text check (dil is null or dil ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  -- The stamp of the consent sentence the patient accepted before the first question, and when.
  riza_surumu text check (riza_surumu is null or char_length(riza_surumu) between 1 and 80),
  riza_at timestamptz,
  gonderildi_at timestamptz,
  yeniden_acildi_at timestamptz,
  iptal_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((durum = 'gonderildi') = (gonderildi_at is not null)),
  check ((durum = 'iptal') = (iptal_at is not null)),
  -- Nothing is saved before the consent sentence was accepted; a submitted form has answers, a language and a consent.
  check (cevaplar_encrypted is null or (riza_at is not null and riza_surumu is not null and dil is not null)),
  check (durum <> 'gonderildi' or cevaplar_encrypted is not null),
  check (durum <> 'bekliyor' or cevaplar_encrypted is null),
  constraint ulke_hasta_formlari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  -- Checked only when there is an appointment.
  constraint ulke_hasta_formlari_randevu_fk foreign key (ulke, doctor_id, patient_id, randevu_id) references public.ulke_randevulari (ulke, doctor_id, patient_id, id)
);

-- At most one form per patient that is still open.
create unique index if not exists ulke_hasta_formlari_tek_acik on public.ulke_hasta_formlari (ulke, doctor_id, patient_id) where durum in ('bekliyor', 'taslak');
create index if not exists ulke_hasta_formlari_hasta_idx on public.ulke_hasta_formlari (ulke, doctor_id, patient_id, created_at desc);

-- ── 2. What a form may never do ──────────────────────────────────────────────────────────────────────────────
create or replace function public.ulke_hasta_formu_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.patient_id is distinct from old.patient_id then
    raise exception 'ulke_hasta_formlari: a form never moves to another country, doctor or patient' using errcode = '23514';
  end if;
  if new.rol is distinct from old.rol or new.soru_surumu is distinct from old.soru_surumu or new.veli is distinct from old.veli then
    raise exception 'ulke_hasta_formlari: the question set of a form is fixed when it is asked for' using errcode = '23514';
  end if;
  if old.durum = 'iptal' then
    raise exception 'ulke_hasta_formlari: a withdrawn form does not change' using errcode = '23514';
  end if;
  if old.durum = 'gonderildi' then
    -- A submitted form stays as it is, or is reopened by the doctor (a draft again, with the same answers).
    if new.durum not in ('gonderildi', 'taslak') then
      raise exception 'ulke_hasta_formlari: a submitted form is not withdrawn' using errcode = '23514';
    end if;
    if new.cevaplar_encrypted is distinct from old.cevaplar_encrypted or new.dil is distinct from old.dil
       or new.riza_surumu is distinct from old.riza_surumu or new.riza_at is distinct from old.riza_at then
      raise exception 'ulke_hasta_formlari: the answers of a submitted form do not change; the doctor reopens the form' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_hasta_formu_kilidi' and tgrelid = 'public.ulke_hasta_formlari'::regclass) then
    create trigger ulke_hasta_formu_kilidi
      before update on public.ulke_hasta_formlari
      for each row execute function public.ulke_hasta_formu_kilidi();
  end if;
end $$;

alter table public.ulke_hasta_formlari enable row level security;
revoke all on table public.ulke_hasta_formlari from anon, authenticated;

-- ── 3. Asking for the form ───────────────────────────────────────────────────────────────────────────────────
-- The doctor asks one of their patients to fill in the form. Runs inside the caller's transaction: if a statement
-- fails or the function raises, every statement before it is undone.
--   { durum: 'TAMAM', form_id, yeni_form, erisim }
--        yeni_form  true = a form was created; false = the patient already had an open one, which is kept as it is
--        erisim     'YENI' = a new portal link was given in this step (the application shows it and its PIN once);
--                   'VAR'  = the patient has a link that works and it was left alone
--   { durum: 'NOT_FOUND' }   the patient is not this doctor's in this country, or the appointment is not this patient's
--   { durum: 'GECERSIZ' }    a new link was needed and no token or PIN hash was passed. Nothing was written.
create or replace function public.ulke_hasta_formu_iste(
  p_ulke text,
  p_doctor_id uuid,
  p_patient_id uuid,
  p_randevu_id uuid,
  p_rol text,
  p_soru_surumu text,
  p_veli boolean,
  p_yeni_baglanti boolean,
  p_token_hash text,
  p_pin_hash text,
  p_son_gecerlilik timestamptz,
  p_simdi timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_form uuid;
  v_yeni boolean := false;
  v_calisan boolean;
  v_erisim text := 'VAR';
begin
  -- The patient row is locked, so two requests for the same patient at the same moment take turns.
  perform 1 from public.ulke_hastalar h where h.id = p_patient_id and h.doctor_id = p_doctor_id and h.ulke = p_ulke for update;
  if not found then
    return jsonb_build_object('durum', 'NOT_FOUND');
  end if;
  if p_randevu_id is not null then
    perform 1 from public.ulke_randevulari r where r.id = p_randevu_id and r.patient_id = p_patient_id and r.doctor_id = p_doctor_id and r.ulke = p_ulke;
    if not found then
      return jsonb_build_object('durum', 'NOT_FOUND');
    end if;
  end if;
  -- A link that works: not withdrawn, not locked, not ended.
  select exists (
    select 1 from public.ulke_portal_erisimleri e
     where e.ulke = p_ulke and e.doctor_id = p_doctor_id and e.patient_id = p_patient_id
       and e.iptal_at is null and e.kilitlendi_at is null and e.son_gecerlilik > p_simdi
  ) into v_calisan;
  if (not v_calisan or coalesce(p_yeni_baglanti, false)) and (p_token_hash is null or p_pin_hash is null or p_son_gecerlilik is null) then
    return jsonb_build_object('durum', 'GECERSIZ');
  end if;

  select f.id into v_form from public.ulke_hasta_formlari f
   where f.ulke = p_ulke and f.doctor_id = p_doctor_id and f.patient_id = p_patient_id and f.durum in ('bekliyor', 'taslak');
  if v_form is null then
    insert into public.ulke_hasta_formlari (ulke, doctor_id, patient_id, randevu_id, rol, soru_surumu, veli, durum, created_at, updated_at)
    values (p_ulke, p_doctor_id, p_patient_id, p_randevu_id, p_rol, p_soru_surumu, coalesce(p_veli, false), 'bekliyor', p_simdi, p_simdi)
    returning id into v_form;
    v_yeni := true;
  elsif p_randevu_id is not null then
    update public.ulke_hasta_formlari f
       set randevu_id = p_randevu_id, updated_at = p_simdi
     where f.id = v_form and f.ulke = p_ulke and f.doctor_id = p_doctor_id and f.patient_id = p_patient_id and f.randevu_id is distinct from p_randevu_id;
  end if;

  if not v_calisan or coalesce(p_yeni_baglanti, false) then
    perform public.ulke_portal_erisim_ver(p_ulke, p_doctor_id, p_patient_id, p_token_hash, p_pin_hash, p_son_gecerlilik, p_simdi);
    v_erisim := 'YENI';
  end if;
  return jsonb_build_object('durum', 'TAMAM', 'form_id', v_form, 'yeni_form', v_yeni, 'erisim', v_erisim);
end $$;

revoke all on function public.ulke_hasta_formu_kilidi() from public, anon, authenticated;
revoke all on function public.ulke_hasta_formu_iste(text, uuid, uuid, uuid, text, text, boolean, boolean, text, text, timestamptz, timestamptz) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.ulke_hasta_formu_iste(text, uuid, uuid, uuid, text, text, boolean, boolean, text, text, timestamptz, timestamptz) to service_role;
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('138', '138_ulke_hasta_formu.sql', null, now(), false,
  'NOTYA-ULKE-INTAKE-01: intake form of a country build: one row per form asked of a patient (role and version of the question set, guardian mark, answers as one encrypted value, consent stamp, state), a trigger that keeps a submitted form unchanged, one function that asks for the form and gives portal access in the same step. Server only.')
on conflict (version) do nothing;

commit;
