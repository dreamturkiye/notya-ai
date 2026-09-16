-- NOTYA-LAB-01 (Kaan 2026-09-15, built overnight) — Notya Belgeler LAB + TREND.
-- Extract (faithful numbers) → interpret (özet/trend/taslak tanı) → doctor approves into the last muayene.
-- Trend compares ONLY this patient's prior APPROVED rows. Reference ranges are printed-only, never invented.
-- 026/027 were taken by KD/derm clinic-fit — hence 028.

create table if not exists lab_paneller (
  id              uuid primary key default gen_random_uuid(),
  belge_id        uuid not null,                            -- vault document
  doctor_id       uuid not null references auth.users(id),
  patient_id      uuid not null references patients(id),
  analiz_id       uuid references belge_analizleri(id),     -- interpret result lives in belge_analizleri (modality 'lab')
  lab_adi         text,
  numune_tarihi   date,
  rapor_tarihi    date,
  kaynaklar       text[] not null default '{}',             -- {'yapi','gorsel'} — which extraction passes ran
  extract_json    jsonb not null default '{}'::jsonb,       -- both raw passes + reconciliation (immutable)
  kalite          text not null default 'iyi',              -- iyi|orta|dusuk
  kimlik_uyari    jsonb,                                    -- {ad, dogum, tc_son4, eslesme:boolean} — used for the guard, never the TC itself
  tablo_onayli    boolean not null default false,           -- doctor confirmed the table (edits done)
  durum           text not null default 'cikarildi',        -- cikarildi|tablo_onayli|raporlandi|onaylandi|muayene_onaylandi|hata
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists lab_paneller_belge_idx on lab_paneller (belge_id, created_at desc);
create index if not exists lab_paneller_hasta_idx on lab_paneller (patient_id, numune_tarihi desc);

create table if not exists lab_satirlar (
  id               uuid primary key default gen_random_uuid(),
  panel_id         uuid not null references lab_paneller(id) on delete cascade,
  patient_id       uuid not null references patients(id),
  doctor_id        uuid not null references auth.users(id),
  sira             int not null default 0,
  raw_name         text not null,
  canonical_key    text,
  loinc            text,
  value_num        numeric,
  value_text       text,
  unit             text,
  kanonik_deger    numeric,                                 -- converted to canonical unit (trend basis)
  kanonik_birim    text,
  ref_low          numeric,
  ref_high         numeric,
  flag             text not null default 'unknown',         -- H|L|critical|normal|unknown
  kritik           boolean not null default false,
  kritik_neden     text,
  prior_value      numeric,
  prior_date       date,
  delta            numeric,
  delta_pct        numeric,
  trend            text not null default 'no_prior',        -- rising|falling|stable|new_abn|new_normal|unit_mismatch|no_prior
  page             int,
  dogrulanacak     boolean not null default false,          -- extraction passes disagreed
  dogrulama_notu   text,
  doctor_corrected boolean not null default false,
  onayli           boolean not null default false,          -- becomes true when the panel is approved → eligible as a prior
  numune_tarihi    date,
  created_at       timestamptz not null default now()
);
create index if not exists lab_satirlar_trend_idx on lab_satirlar (patient_id, canonical_key, numune_tarihi desc) where onayli;
create index if not exists lab_satirlar_panel_idx on lab_satirlar (panel_id, sira);

-- "bunu ALT say" — per-doctor raw-name → canonical alias memory
create table if not exists lab_takma_adlar (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references auth.users(id),
  raw_norm      text not null,                              -- normalized raw name
  canonical_key text not null,
  created_at    timestamptz not null default now(),
  unique (doctor_id, raw_norm)
);
