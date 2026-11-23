-- 202 — ESNEK-MUAYENE-A (Kaan, 2026-11-23): "Notya hekime uyar, hekim Notya'ya değil."
-- A muayene can be built from any mix of sources (transcript, handwritten pages, typed note, documents, a secretary's
-- upload) and the doctor's own handwriting is read and learned per doctor. Phase A data model:
--
--   muayene_kaynaklari            every source of a muayene: who/when/channel, the reader's output, the masked page
--                                 pictures in the vault (medical_documents ids). Idempotent per (doctor, isleme_anahtari).
--   hekim_el_sozlugu              the doctor's handwriting lexicon: abbreviation / symbol -> meaning (asked once, learned).
--   hekim_el_yazisi_hafizasi      the doctor's personal handwriting memory: confirmed word/line crops -> text, with a small
--                                 on-device shape descriptor for retrieval. Crops are cut from the MASKED page and stored in
--                                 the vault (medical_documents, category 'el_notu_kirpinti'); no identity ever.
--   el_notu_sablonlari            form templates per doctor (optionally per clinic): header band(s) to black out by position,
--                                 drawing regions mapped to anatomy, a layout fingerprint for matching; 'serbest' = a plain
--                                 sheet the doctor declared once as carrying no identity.
--   esnek_muayene_ayarlari        per-doctor preferences: hekim_onayi_gerekli (secretary may finalize only when false),
--                                 el_notu_hazirlayan ('doktor' | 'sekreter'), baseline minutes per note (time meter).
--   okuma_dogrulamalari           reading-confirmation events (Doğrula): question, candidates, answer, who answered.
--   dokumantasyon_sureleri        time meter: real elapsed documentation time per note / source / person.
--   muayene_not_denetimi          audit trail: drafted / confirmed / edited / finalized / doctor-approved, by whom.
--   notes (+columns)              who drafted / finalized, approval-waiting flag, provenance (sentence -> source/crop).
--
-- Isolation: every table carries doctor_id; the application scopes every query by doctor_id (service role, hasta-izolasyon);
-- RLS on, authenticated clients see only their own rows, anon nothing; patient_id tables get the 052 restrictive policy.
-- Number 202: 201 is the latest on main, 200 is taken on the release branches.

create table if not exists public.muayene_kaynaklari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid,
  session_id uuid,
  note_id uuid,
  tur text not null check (tur in ('transkript', 'el_notu', 'yazili_not', 'belge', 'sekreter_yukleme')),
  kanal text not null default 'kamera' check (kanal in ('kamera', 'dosya', 'tarayici', 'gelen_belge', 'toplu', 'klavye', 'kayit')),
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'okunuyor', 'okundu', 'dogrulama', 'hata', 'iptal')),
  hata_kodu text,
  sayfa_sayisi integer not null default 0 check (sayfa_sayisi between 0 and 40),
  -- masked page pictures (outbound copies) and, separately, the originals the doctor sees (both in the vault)
  maskeli_belge_ids uuid[] not null default '{}',
  orijinal_belge_ids uuid[] not null default '{}',
  sablon_id uuid,
  gelen_belge_id uuid,
  okuma jsonb,
  metin text,
  acik_dogrula integer not null default 0,
  korumali_acik integer not null default 0,
  isleme_anahtari text not null check (char_length(isleme_anahtari) between 8 and 128),
  ziyaret_tarihi timestamptz,
  ekleyen_user_id uuid not null,
  ekleyen_rol text not null default 'doktor' check (ekleyen_rol in ('doktor', 'sekreter', 'asistan', 'hasta_danismani')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, isleme_anahtari)
);
create index if not exists muayene_kaynaklari_seans_idx on public.muayene_kaynaklari (doctor_id, session_id, created_at);
create index if not exists muayene_kaynaklari_hasta_idx on public.muayene_kaynaklari (doctor_id, patient_id, created_at desc);
create index if not exists muayene_kaynaklari_durum_idx on public.muayene_kaynaklari (doctor_id, durum, created_at desc);

create table if not exists public.hekim_el_sozlugu (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  kisaltma text not null check (char_length(kisaltma) between 1 and 24),
  kisaltma_anahtar text not null check (char_length(kisaltma_anahtar) between 1 and 24),
  anlam text not null check (char_length(anlam) between 1 and 80),
  brans text,
  kaynak text not null default 'dogrulama' check (kaynak in ('dogrulama', 'elle', 'ice_aktarim')),
  sayac integer not null default 1,
  son_kullanim timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, kisaltma_anahtar)
);

create table if not exists public.hekim_el_yazisi_hafizasi (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid,
  kaynak_id uuid,
  sinif text not null default 'kelime' check (sinif in ('kelime', 'satir', 'sembol')),
  metin text not null check (char_length(metin) between 1 and 160),
  okunan text,
  tanimlayici real[] not null check (array_length(tanimlayici, 1) between 16 and 512),
  en_boy real not null default 1,
  kirpinti_belge_id uuid,
  korumali boolean not null default false,
  onaylayan_user_id uuid not null,
  onaylayan_rol text not null default 'doktor' check (onaylayan_rol in ('doktor', 'sekreter', 'asistan', 'hasta_danismani')),
  created_at timestamptz not null default now()
);
create index if not exists hekim_el_yazisi_hafizasi_doktor_idx on public.hekim_el_yazisi_hafizasi (doctor_id, created_at desc);

create table if not exists public.el_notu_sablonlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  klinik_id uuid,
  ad text not null check (char_length(ad) between 1 and 80),
  tur text not null default 'formlu' check (tur in ('formlu', 'serbest')),
  brans text,
  en_boy real not null default 0.7071,
  baslik_bolgeleri jsonb not null default '[]'::jsonb,
  cizim_bolgeleri jsonb not null default '[]'::jsonb,
  parmak_izi real[],
  kullanim integer not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists el_notu_sablonlari_doktor_idx on public.el_notu_sablonlari (doctor_id, aktif);

create table if not exists public.esnek_muayene_ayarlari (
  doctor_id uuid primary key,
  hekim_onayi_gerekli boolean not null default true,
  el_notu_hazirlayan text not null default 'doktor' check (el_notu_hazirlayan in ('doktor', 'sekreter')),
  taban_dakika_not numeric(5, 1) check (taban_dakika_not is null or (taban_dakika_not > 0 and taban_dakika_not <= 120)),
  guncelleyen_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.okuma_dogrulamalari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid,
  kaynak_id uuid not null,
  soru_anahtari text not null check (char_length(soru_anahtari) between 1 and 64),
  sinif text not null check (sinif in ('kelime', 'kisaltma', 'korumali', 'cizim', 'celiski')),
  korumali_tur text check (korumali_tur is null or korumali_tur in ('taraf', 'olumsuzluk', 'sayi', 'doz', 'ilac', 'alerji')),
  okunan text,
  adaylar jsonb not null default '[]'::jsonb,
  sayfa integer not null default 0,
  kutu jsonb,
  cevap text,
  durum text not null default 'acik' check (durum in ('acik', 'cevaplandi', 'atlandi')),
  cevaplayan_user_id uuid,
  cevaplayan_rol text check (cevaplayan_rol is null or cevaplayan_rol in ('doktor', 'sekreter', 'asistan', 'hasta_danismani')),
  created_at timestamptz not null default now(),
  cevap_at timestamptz,
  unique (doctor_id, kaynak_id, soru_anahtari)
);
create index if not exists okuma_dogrulamalari_acik_idx on public.okuma_dogrulamalari (doctor_id, durum, created_at desc);

create table if not exists public.dokumantasyon_sureleri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid,
  session_id uuid,
  note_id uuid,
  kaynak_id uuid,
  user_id uuid not null,
  rol text not null default 'doktor' check (rol in ('doktor', 'sekreter', 'asistan', 'hasta_danismani')),
  asama text not null check (asama in ('yakalama', 'dogrulama', 'duzenleme', 'onay', 'kayit')),
  sure_ms integer not null check (sure_ms between 0 and 3600000),
  gun date not null default (now() at time zone 'Europe/Istanbul')::date,
  created_at timestamptz not null default now()
);
create index if not exists dokumantasyon_sureleri_gun_idx on public.dokumantasyon_sureleri (doctor_id, gun);

create table if not exists public.muayene_not_denetimi (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid,
  note_id uuid,
  session_id uuid,
  kaynak_id uuid,
  eylem text not null check (eylem in ('kaynak_eklendi', 'taslak', 'dogrulama', 'duzenleme', 'kesinlestirme', 'hekim_onayi', 'hekime_gonderildi', 'iade')),
  user_id uuid not null,
  rol text not null check (rol in ('doktor', 'sekreter', 'asistan', 'hasta_danismani')),
  ayrinti jsonb,
  created_at timestamptz not null default now()
);
create index if not exists muayene_not_denetimi_not_idx on public.muayene_not_denetimi (doctor_id, note_id, created_at);

alter table public.notes add column if not exists taslak_hazirlayan_user_id uuid;
alter table public.notes add column if not exists taslak_hazirlayan_rol text;
alter table public.notes add column if not exists kesinlestiren_user_id uuid;
alter table public.notes add column if not exists kesinlestiren_rol text;
alter table public.notes add column if not exists kesinlestirme_at timestamptz;
alter table public.notes add column if not exists hekim_onayi_bekliyor boolean not null default false;
alter table public.notes add column if not exists kaynak_izleri jsonb;
alter table public.notes add column if not exists kaynak_ozeti jsonb;
create index if not exists notes_hekim_onayi_bekliyor_idx on public.notes (doctor_id, hekim_onayi_bekliyor) where hekim_onayi_bekliyor;

-- RLS: own rows only for authenticated clients (the application uses the service role and scopes by doctor_id).
alter table public.muayene_kaynaklari enable row level security;
alter table public.hekim_el_sozlugu enable row level security;
alter table public.hekim_el_yazisi_hafizasi enable row level security;
alter table public.el_notu_sablonlari enable row level security;
alter table public.esnek_muayene_ayarlari enable row level security;
alter table public.okuma_dogrulamalari enable row level security;
alter table public.dokumantasyon_sureleri enable row level security;
alter table public.muayene_not_denetimi enable row level security;

do $$
declare t text;
begin
  foreach t in array array['muayene_kaynaklari', 'hekim_el_sozlugu', 'hekim_el_yazisi_hafizasi', 'el_notu_sablonlari',
                           'esnek_muayene_ayarlari', 'okuma_dogrulamalari', 'dokumantasyon_sureleri', 'muayene_not_denetimi'] loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    begin
      execute format('create policy "hasta_izolasyon_kendi_satiri" on public.%I for select to authenticated using (doctor_id = auth.uid())', t);
    exception when duplicate_object then null;
    end;
  end loop;
  -- 052's restrictive patient-ownership policy for the new patient_id tables.
  foreach t in array array['muayene_kaynaklari', 'hekim_el_yazisi_hafizasi', 'okuma_dogrulamalari', 'dokumantasyon_sureleri', 'muayene_not_denetimi'] loop
    begin
      execute format(
        'create policy "hasta_izolasyon_hasta_sahipligi" on public.%I as restrictive for all to authenticated, anon
           using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))',
        t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('202', '202_esnek_muayene.sql', null, now(), false,
  'ESNEK-MUAYENE-A: muayene_kaynaklari, hekim_el_sozlugu, hekim_el_yazisi_hafizasi, el_notu_sablonlari, esnek_muayene_ayarlari, okuma_dogrulamalari, dokumantasyon_sureleri, muayene_not_denetimi; notes provenance/finalize columns; RLS own rows')
on conflict (version) do nothing;
