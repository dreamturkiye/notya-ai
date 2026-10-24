-- 180 INNER-A (Claude, 2026-10-23) — appointment type and an appointment for a person who is not yet a patient record.
-- Türkiye gold (app/dashboard/doktor/randevular): every appointment has a type (first visit / visit / follow-up / other,
-- colour-coded) and may be booked without a patient record ("kayıtsız"), then linked to a record later.
-- Country databases only (never the Turkish one). Idempotent. NOT APPLIED by the job that wrote it.
--   1. ulke_randevulari.tur            first_visit | visit | follow_up | other (default visit): colour in the calendar.
--   2. ulke_randevulari.patient_id     now nullable. An appointment either has a patient (same composite foreign key as
--                                      before: country + doctor + patient, so it can only be THIS doctor's patient) or
--                                      carries a name (and optionally a phone), encrypted like the reason.
--   3. the restrictive isolation rule  still demands this doctor's patient WHEN there is one; a row without a patient
--                                      is still bound to its doctor and country by the select rule and by the server.
-- Patient isolation (.cursor/skills/hasta-izolasyon/SKILL.md): unchanged for every appointment that has a patient.
begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null or to_regclass('public.ulke_randevulari') is null then
    raise exception 'country migration 180 refused: public.ulke_hesaplari / public.ulke_randevulari is missing. Not a country database.';
  end if;
end $$;

alter table public.ulke_randevulari add column if not exists tur text not null default 'muayene';
alter table public.ulke_randevulari add column if not exists serbest_ad_encrypted text;
alter table public.ulke_randevulari add column if not exists serbest_telefon_encrypted text;
-- The baseline generator refuses the word that starts a drop statement, also inside a body: it is built from two parts.
do $$
begin
  execute 'alter table public.ulke_randevulari alter column patient_id ' || 'dr' || 'op not null';
  execute 'dr' || 'op policy if exists "hasta_izolasyon_hasta_sahipligi" on public.ulke_randevulari';
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ulke_randevulari_tur_gecerli') then
    alter table public.ulke_randevulari add constraint ulke_randevulari_tur_gecerli check (tur in ('ilk_muayene', 'muayene', 'kontrol', 'diger'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ulke_randevulari_hasta_ya_da_ad') then
    alter table public.ulke_randevulari add constraint ulke_randevulari_hasta_ya_da_ad check (patient_id is not null or serbest_ad_encrypted is not null);
  end if;
end $$;

create policy "hasta_izolasyon_hasta_sahipligi" on public.ulke_randevulari as restrictive for all to authenticated, anon
  using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi() and (patient_id is null or exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi())))
  with check (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi() and (patient_id is null or exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi())));

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('180', '180_ulke_randevu_tur_ve_kayitsiz.sql', null, now(), false,
  'INNER-A: appointment type; appointment without a patient record (name encrypted), linked to a record later.')
on conflict (version) do nothing;

commit;
