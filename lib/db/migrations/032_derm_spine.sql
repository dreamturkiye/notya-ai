-- NOTYA-DERM-02 (Kaan 2026-09-16) — Dermatoloji eksik paket: ABCDE/resmi tanı on lesions, işlem paketi (biyopsi + küçük cerrahi),
-- biyolojik/izotretinoin ilaç güvenlik kayıtları, pediatrik bağ, kozmetik onam stubs. Reuses onamlar, belge vault, lab_*, muayene_revizyonlar.

alter table derm_lezyonlar add column if not exists size_mm numeric;
alter table derm_lezyonlar add column if not exists abcde jsonb;                       -- {asimetri, sinir, renk, cap6mm, evrim}
alter table derm_lezyonlar add column if not exists dermoskop_notu text;
alter table derm_lezyonlar add column if not exists dermoskop_uyari boolean not null default false;
alter table derm_lezyonlar add column if not exists cirkin_ordek boolean not null default false;
alter table derm_lezyonlar add column if not exists degerlendirme jsonb;               -- LezyonDegerlendirme (engine draft)
alter table derm_lezyonlar add column if not exists resmi_tani text;                   -- hekim kilitler
alter table derm_lezyonlar add column if not exists acil boolean not null default false;
alter table derm_lezyonlar add column if not exists patoloji_belge_id uuid;            -- specimen result bound to the same lezyon
alter table derm_lezyonlar add column if not exists patoloji_sonuc text;

create table if not exists derm_islemler (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  lezyon_id uuid references derm_lezyonlar(id) on delete set null,
  tur text not null,                                   -- punch|shave|eksizyon|kriyo|koter|tirnak_avulsiyon|sigil|kuretaj
  tarih date not null default current_date,
  onam_id uuid references onamlar(id),
  islem_notu jsonb not null default '{}'::jsonb,       -- anestezi, sutur, sinir_mm, hemostaz, numune_etiketi…
  numune_belge_id uuid,                                -- specimen photo/path belge
  patoloji_sonuc text, patoloji_belge_id uuid,
  yara_bakimi text[] not null default '{}',
  komplikasyon text, created_at timestamptz not null default now()
);
create index if not exists derm_islemler_hasta_idx on derm_islemler (patient_id, tarih desc);

create table if not exists derm_ilac_guvenlik (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  ilac text not null,                                  -- izotretinoin|biyolojik|acitretin|metotreksat
  kapisi jsonb not null,                               -- engine result (eksik/uyari)
  onam_id uuid references onamlar(id),
  baslangic date, bitis date,
  aylik_due date,                                      -- izotretinoin β-hCG
  aktif boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists derm_gorevleri (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  kod text not null, ad text not null, due date, kaynak text,   -- islem|ilac|pediatrik|lezyon
  durum text not null default 'acik', tamam_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists derm_gorevleri_hasta_idx on derm_gorevleri (patient_id, durum, due);
