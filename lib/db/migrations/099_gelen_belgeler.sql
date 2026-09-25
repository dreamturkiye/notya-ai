-- 099 — NOTYA-GELEN-BELGELER phase 1 (Kaan, 2026-09-25): one inbox for incoming documents, images and sound.
--
-- Lab results, X-ray / ECG photos, consultation replies and voice notes reach the doctor; Notya reads each one,
-- suggests the patient, and the doctor files it with one tap (auto-filing: later, off by default).
--   • gelen_belgeler                one row per incoming file. Bytes live in the PRIVATE `hasta-belgeler` bucket under
--                                   <doctor id>/gelen/ until filed; filing copies them into the patient's encrypted
--                                   vault (medical_documents) and clears depo_yolu. Reading / sender are encrypted by the
--                                   app (*_sifreli). (doctor_id, sha256) is unique among live rows → a file is shown once.
--   • patients.gelen_belge_izni     KVKK consent: "Gönderdiğiniz belgeler, fotoğraflar ve sesli mesajlar dosyanıza
--                                   eklenebilir." Stored like 095's iletişim consent; history in iletisim_izin_kayitlari
--                                   with kanal 'gelen_belge'.
--   • users.gelen_belge_sekreter    the Ayarlar switch "Sekreterim gelen belgeleri görebilir ve dosyalayabilir".
--                                   DECIDED (Kaan, 2026-09-25): off by default (doctor-only).
--
-- STAFF (NOTYA-RANDEVU-01 personel): may see and file the doctor's incoming documents ONLY while that doctor's switch
--   is on. The API enforces this in application code (service-role client, lib/gelenBelgeler/yetki.ts); the staff
--   policy below is the second line, same model as 052 / 095.
--
-- ISOLATION: same pattern as 052_hasta_izolasyon_rls.sql — own-row policy + a RESTRICTIVE patient-ownership policy.
--   patient_id is NULL until the item is filed, so the restrictive policy admits NULL; when set, the patient must
--   belong to the row's doctor. It also admits the doctor's active staff (with the switch on), otherwise it would
--   AND-away the staff policy.
--
-- STORAGE: makes sure the `hasta-belgeler` bucket exists and is PRIVATE (served only through short-lived signed URLs).
--
-- ADDITIVE ONLY: new columns are nullable / default false, the new table is empty; existing data is untouched.
-- Idempotent. NOT APPLIED by the job that wrote it — applied after review. The code fails soft until then
-- (empty inbox, "kısa süre içinde açılacak" on upload, switch and consent hidden).

-- ── 1) Inbox ───────────────────────────────────────────────────────────────────────────────────────
create table if not exists gelen_belgeler (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  -- set when filed; suggestions before that live in `oneriler` (ids of the doctor's own patients + score)
  patient_id uuid references patients(id) on delete set null,
  kaynak text not null check (kaynak in ('surukle', 'yapistir', 'yukleme', 'kamera', 'ses_kaydi', 'eposta', 'whatsapp')),
  durum text not null default 'yeni' check (durum in ('yeni', 'dosyalandi', 'silindi')),
  dosya_adi text not null check (char_length(dosya_adi) between 1 and 200),
  mime text not null,
  bicim text not null check (bicim in ('pdf', 'gorsel', 'heic', 'ses', 'word', 'excel', 'metin')),
  boyut integer not null check (boyut >= 0),
  sha256 text not null check (char_length(sha256) = 64),
  -- object path in the private hasta-belgeler bucket; NULL once filed or deleted
  depo_yolu text,
  belge_turu text,
  okundu boolean not null default false,
  -- app-encrypted JSON: summary, transcript / text, identity as printed on the document
  okuma_sifreli text,
  -- app-encrypted JSON: sender phone / email / name when a channel provides it (phases 2–3)
  gonderen_sifreli text,
  oneriler jsonb not null default '[]'::jsonb,
  ekleyen_user_id uuid references auth.users(id) on delete set null,
  ekleyen_personel_id uuid references personel(id) on delete set null,
  -- audit: who filed it, when, into which vault document (the source is `kaynak`)
  dosyalayan_user_id uuid references auth.users(id) on delete set null,
  dosyalayan_personel_id uuid references personel(id) on delete set null,
  dosyalandi_at timestamptz,
  medical_document_id uuid references medical_documents(id) on delete set null,
  silen_user_id uuid references auth.users(id) on delete set null,
  silen_personel_id uuid references personel(id) on delete set null,
  silindi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists gelen_belgeler_tekil_idx on gelen_belgeler (doctor_id, sha256) where durum <> 'silindi';
create index if not exists gelen_belgeler_kutu_idx on gelen_belgeler (doctor_id, created_at desc) where durum = 'yeni';
create index if not exists gelen_belgeler_temizlik_idx on gelen_belgeler (created_at) where durum = 'yeni';

-- ── 2) Patient consent ─────────────────────────────────────────────────────────────────────────────
alter table patients add column if not exists gelen_belge_izni boolean;
alter table patients add column if not exists gelen_belge_izni_guncelleme timestamptz;
alter table patients add column if not exists gelen_belge_izni_guncelleyen uuid references auth.users(id) on delete set null;

-- consent history (095): allow the third kanal
do $$
declare
  ad text;
begin
  if to_regclass('public.iletisim_izin_kayitlari') is null then return; end if;
  for ad in
    select conname from pg_constraint
    where conrelid = 'public.iletisim_izin_kayitlari'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%kanal%'
  loop
    execute format('alter table public.iletisim_izin_kayitlari drop constraint %I', ad);
  end loop;
  alter table public.iletisim_izin_kayitlari add constraint iletisim_izin_kayitlari_kanal_check
    check (kanal in ('whatsapp', 'eposta', 'gelen_belge'));
end $$;

-- ── 3) The Ayarlar switch ──────────────────────────────────────────────────────────────────────────
alter table users add column if not exists gelen_belge_sekreter boolean not null default false;

-- ── 4) RLS ─────────────────────────────────────────────────────────────────────────────────────────
alter table gelen_belgeler enable row level security;

do $$
begin
  -- doctor: own rows (052 hasta_izolasyon_kendi_satiri pattern)
  begin
    create policy "hasta_izolasyon_kendi_satiri" on public.gelen_belgeler for all
      using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  exception when duplicate_object then null;
  end;

  -- restrictive patient ownership: unfiled (NULL) or the row's doctor's own patient; caller is that doctor or one of
  -- their active staff with the switch on. Columns of the policy's own table are qualified (gelen_belgeler.col).
  begin
    create policy "hasta_izolasyon_hasta_sahipligi" on public.gelen_belgeler as restrictive for all to authenticated, anon
      using (
        (gelen_belgeler.patient_id is null
          or exists (select 1 from public.patients p where p.id = gelen_belgeler.patient_id and p.doctor_id = gelen_belgeler.doctor_id))
        and (gelen_belgeler.doctor_id = auth.uid()
          or exists (select 1 from public.personel pe join public.users u on u.id = pe.doktor_id
                     where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = gelen_belgeler.doctor_id and u.gelen_belge_sekreter)))
      with check (
        (gelen_belgeler.patient_id is null
          or exists (select 1 from public.patients p where p.id = gelen_belgeler.patient_id and p.doctor_id = gelen_belgeler.doctor_id))
        and (gelen_belgeler.doctor_id = auth.uid()
          or exists (select 1 from public.personel pe join public.users u on u.id = pe.doktor_id
                     where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = gelen_belgeler.doctor_id and u.gelen_belge_sekreter)));
  exception when duplicate_object then null;
  end;

  -- staff: only while the doctor's switch is on
  if not exists (select 1 from pg_policies where tablename = 'gelen_belgeler' and policyname = 'personel_gelen_belgeler') then
    create policy "personel_gelen_belgeler" on gelen_belgeler for all
      using (exists (select 1 from personel pe join users u on u.id = pe.doktor_id
                     where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = gelen_belgeler.doctor_id and u.gelen_belge_sekreter))
      with check (exists (select 1 from personel pe join users u on u.id = pe.doktor_id
                     where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = gelen_belgeler.doctor_id and u.gelen_belge_sekreter));
  end if;
end $$;

-- ── 5) Private bucket ──────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('hasta-belgeler', 'hasta-belgeler', false)
on conflict (id) do update set public = false;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('099', '099_gelen_belgeler.sql', null, now(), false, 'NOTYA-GELEN-BELGELER: gelen_belgeler kutusu (RLS + sekreter anahtarlı personel politikası), patients.gelen_belge_izni, users.gelen_belge_sekreter, hasta-belgeler kovası özel')
on conflict (version) do nothing;

-- DOĞRULAMA (salt-okunur):
--   select tablename, policyname, permissive from pg_policies where tablename = 'gelen_belgeler' order by 2;
--   select column_name from information_schema.columns where table_name in ('patients', 'users') and column_name like 'gelen_belge%';
--   select id, public from storage.buckets where id = 'hasta-belgeler';
