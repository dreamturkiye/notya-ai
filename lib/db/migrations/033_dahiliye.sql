-- NOTYA-DAH-01 (Kaan 2026-09-16) — İç hastalıkları V1 (muayenehane dahiliye): kronik kartlar + görevler + sevk.
-- Lab values come from the existing lab engine (lab_satirlar onayli rows) — no second parser. İlaç listesi = hasta_ilaclar (reused).

create table if not exists dahiliye_ht (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tarih date not null default current_date, sbp int not null, dbp int not null, nabiz int, ev_kb jsonb,
  kirilgan boolean not null default false, evre_taslak text, evre_hekim text, hedef_hekim jsonb,   -- {sbp:[lo,hi], dbp:[lo,hi]}
  sekonder_suphe boolean not null default false, degerlendirme jsonb, not_id uuid references notes(id), created_at timestamptz not null default now()
);
create index if not exists dahiliye_ht_hasta_idx on dahiliye_ht (patient_id, tarih desc);

create table if not exists dahiliye_dm (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tip text not null default 'T2', tani_tarihi date, hedef_hba1c numeric, ilac_siniflari text[] not null default '{}',
  son_uacr date, son_goz_dibi date, son_ayak date, son_ekg date, hipo_dka_notu text, degerlendirme jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_lipid (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  hedef_ldl numeric, statin text, statin_baslangic date, ezetimib boolean not null default false, diger text, degerlendirme jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_tiroid (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  levo_mcg numeric, kilo_kg numeric, son_doz_degisim date, nodul boolean not null default false, degerlendirme jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);
create table if not exists dahiliye_checkup (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tarih date not null default current_date, panel_ids uuid[] not null default '{}', belge_ids uuid[] not null default '{}',
  analiz_id uuid references belge_analizleri(id), sevkler jsonb, susturuldu boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists dahiliye_gorevleri (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  kod text not null, ad text not null, due date, kaynak text, durum text not null default 'acik', tamam_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists dahiliye_gorevleri_hasta_idx on dahiliye_gorevleri (patient_id, durum, due);
create table if not exists sevkler (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  hedef text not null, not_metni text, ek_lab_panel_id uuid, kaynak text, durum text not null default 'acik', created_at timestamptz not null default now()
);
create table if not exists dahiliye_kirmizi (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  bayraklar text[] not null, acil_sevk_onayi boolean not null default false, not_metni text, created_at timestamptz not null default now()
);
