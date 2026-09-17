-- NOTYA-DAH-WOW Wave 2 (2026-09-16): bakım döngüleri — DM kapalı döngü, anemi, obezite, KETEM tarama, HT panel istemleri,
-- erişkin aşı takvimi, muayene öncesi hasta anketi (portal). Lab girdisi yalnız lab_satirlar onayli=true (tablolarda lab kopyası yok).
alter table dahiliye_dm add column if not exists kky boolean not null default false;
alter table dahiliye_dm add column if not exists son_ayak_foto date;
alter table dahiliye_dm add column if not exists dongu jsonb;

create table if not exists dahiliye_anemi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  menstruasyon boolean, gis_kanama boolean not null default false, sonuc jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_obezite (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  boy_cm numeric, bel_cm numeric, kilo_kg numeric, komorbidite jsonb not null default '{}', farmakoterapi_baslangic date, sonuc jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_tarama (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  son_ggk date, son_kolonoskopi date, son_mamografi date, son_hpv date, son_pap date, histerektomi boolean not null default false, ggk_pozitif boolean not null default false,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_lab_istemleri (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  panel text not null, kalemler jsonb not null, istem_tarihi date not null default current_date,
  durum text not null default 'acik' check (durum in ('acik','tamam','iptal')), created_at timestamptz not null default now()
);
create index if not exists dahiliye_lab_istemleri_idx on dahiliye_lab_istemleri (patient_id, durum);
create table if not exists dahiliye_asilar (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  asi text not null check (asi in ('grip','pcv20','pcv13','ppsv23','zona','td','hbv','covid')), tarih date not null, kaynak text not null default 'hekim',
  created_at timestamptz not null default now()
);
create index if not exists dahiliye_asilar_idx on dahiliye_asilar (patient_id, asi, tarih desc);
create table if not exists dahiliye_asi_profil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  akciger boolean not null default false, karaciger boolean not null default false, immunsup boolean not null default false, asplenik boolean not null default false, alkol boolean not null default false,
  updated_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_anketler (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  cevaplar jsonb not null, alarmlar text[] not null default '{}', soap_metni text,
  okundu_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists dahiliye_anketler_idx on dahiliye_anketler (patient_id, created_at desc);
alter table dahiliye_anemi enable row level security;
alter table dahiliye_obezite enable row level security;
alter table dahiliye_tarama enable row level security;
alter table dahiliye_lab_istemleri enable row level security;
alter table dahiliye_asilar enable row level security;
alter table dahiliye_asi_profil enable row level security;
alter table dahiliye_anketler enable row level security;
