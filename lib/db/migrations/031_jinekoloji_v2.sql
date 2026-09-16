-- NOTYA-JINE-02 (Kaan 2026-09-16) — Jinekoloji V2: AUB/PALM-COEIN + PMP pathway, KOK WHO-MEC gate, endometriozis,
-- tekrarlayan gebelik kaybı, erken gebelik kaybı. Every card stores the engine's draft (with ref_code dipnotlar) and the
-- doctor's locked plan separately. Refs shown only behind the clinician "kaynak" toggle; never on patient print.

create table if not exists jine_aub (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  palm jsonb not null default '{}'::jsonb, coein jsonb not null default '{}'::jsonb,
  menoraji jsonb,                                       -- {sureGun, pedAdet, pihti, hb, ferritin, anemi}
  postmenopoz boolean not null default false,
  taslak jsonb,                                         -- AubPlan (engine)
  hekim_plani text,
  ornekleme jsonb,                                      -- {tur: pipelle|dc|histeroskopi, tarih, sonuc, belge_id}
  tvus_et numeric,
  pmp_kapatildi boolean not null default false, pmp_kapatildi_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists jine_aub_hasta_idx on jine_aub (patient_id, created_at desc);

create table if not exists jine_kok (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  kontrol jsonb not null,                               -- KokGirdi
  sonuc jsonb not null,                                 -- KokSonuc (kategori, engeller, dikkat, alternatif)
  karar text not null default 'beklemede',              -- beklemede|baslandi|reddedildi|alternatif
  override boolean not null default false, override_gerekce text,
  preparat text,
  created_at timestamptz not null default now()
);

create table if not exists jine_endometriozis (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  girdi jsonb not null, taslak jsonb not null, hekim_plani text, sevk jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists jine_rm (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  girdi jsonb not null, taslak jsonb not null,
  tetkik_durumu jsonb not null default '{}'::jsonb,      -- {aps: {yapildi, sonuc}, kavite: {...}, tsh, karyotip}
  hekim_plani text, updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists jine_egk (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  gebelik_id uuid references gebelikler(id) on delete set null,   -- bound when <20 hf and not in the obstetri chart
  girdi jsonb not null, bhcg_serisi jsonb not null default '[]'::jsonb, taslak jsonb not null,
  secenek text,                                         -- bekleme|medikal|cerrahi (doctor)
  onam_id uuid references onamlar(id), anti_d_uygulandi boolean, kapali boolean not null default false,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
