-- NOTYA-DAH-WOW Wave 3 (2026-09-16): KY/GDMT, antikoagülan, KOAH/astım, ofis GI, EKG rapor, tiroid nodül, Ramazan, check-up paket defteri.
-- Lab/INR değerleri tablolara kopyalanmaz; lab_satirlar onayli=true okunur. Check-up paketleri kendi ödemeli (SGK faturası yok).
create table if not exists dahiliye_hf (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  ef numeric, nyha int check (nyha between 1 and 4), eko_tarihi date, yatis_12ay boolean not null default false, sonuc jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_antikoagulan (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  endikasyon text check (endikasyon in ('af','vte','mekanik_kapak','diger')), hedef_inr_alt numeric, hedef_inr_ust numeric, kilo_kg numeric, has_bled jsonb not null default '{}',
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_pulm (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tani text check (tani in ('koah','astim')), fev1_fvc numeric, fev1_yuzde numeric, bd_artis_yuzde numeric, bd_artis_ml numeric, mmrc int, cat int,
  orta_alevlenme int not null default 0, yatisli_alevlenme int not null default 0, spo2 numeric, astim_kontrol jsonb, oks_kur int not null default 0,
  son_spirometri date, teknik jsonb not null default '[]',
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_gi (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  alarm jsonb not null default '{}', gerd jsonb, ibs jsonb, hp jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_ekg (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  girdi jsonb not null, rapor text not null, acil text[] not null default '{}', durum text not null default 'taslak' check (durum in ('taslak','onayli')),
  belge_id uuid, created_at timestamptz not null default now()
);
create index if not exists dahiliye_ekg_idx on dahiliye_ekg (patient_id, created_at desc);
create table if not exists dahiliye_tiroid_nodul (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  lokasyon text, girdi jsonb not null, sonuc jsonb, us_tarihi date not null, aktif boolean not null default true, created_at timestamptz not null default now()
);
create index if not exists dahiliye_tiroid_nodul_idx on dahiliye_tiroid_nodul (patient_id, aktif, us_tarihi desc);
create table if not exists dahiliye_ramazan (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  yil int not null, aktif boolean not null default true, girdi jsonb not null default '{}',
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id, yil)
);
create table if not exists dahiliye_checkup_paketleri (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  sku text not null, tarih date not null default current_date, manuel_tamam text[] not null default '{}', ucret numeric,
  odeme text not null default 'kendi_odemeli' check (odeme = 'kendi_odemeli'), durum text not null default 'acik' check (durum in ('acik','tamam','iptal')),
  rapor_kilit_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists dahiliye_checkup_paketleri_idx on dahiliye_checkup_paketleri (patient_id, created_at desc);
alter table dahiliye_hf enable row level security;
alter table dahiliye_antikoagulan enable row level security;
alter table dahiliye_pulm enable row level security;
alter table dahiliye_gi enable row level security;
alter table dahiliye_ekg enable row level security;
alter table dahiliye_tiroid_nodul enable row level security;
alter table dahiliye_ramazan enable row level security;
alter table dahiliye_checkup_paketleri enable row level security;
