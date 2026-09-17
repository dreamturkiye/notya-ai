-- NOTYA-DAH-WOW Wave 0/1 (2026-09-16): kart kilitleri, ev kayıtları, KVR/SCORE2, CKD.
create table if not exists dahiliye_kart_kilitleri (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  kart text not null,
  alan text not null,
  deger jsonb,
  kaynak text,
  created_at timestamptz not null default now()
);
create index if not exists dahiliye_kart_kilitleri_idx on dahiliye_kart_kilitleri (patient_id, kart, alan, created_at desc);

create table if not exists dahiliye_ev_kayitlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  tip text not null check (tip in ('kb','glukoz','kilo','nabiz')),
  sbp int, dbp int,
  deger numeric,
  aclik boolean,
  olcum_at timestamptz not null default now(),
  kaynak text not null default 'hekim' check (kaynak in ('hekim','portal')),
  not_metni text,
  created_at timestamptz not null default now()
);
create index if not exists dahiliye_ev_kayitlari_idx on dahiliye_ev_kayitlari (patient_id, tip, olcum_at desc);

create table if not exists dahiliye_kvr (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  sigara boolean not null default false,
  askvh boolean not null default false,
  dm_tod boolean not null default false,
  dm_sure_10y boolean not null default false,
  statin_yogunluk text not null default 'yok',
  ezetimib boolean not null default false,
  sonuc jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (patient_id)
);

create table if not exists dahiliye_ckd (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  uacr_manual numeric,
  uacr_tarih date,
  ras_blokeri boolean not null default false,
  sglt2 boolean not null default false,
  nsaii boolean not null default false,
  sonuc jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (patient_id)
);
