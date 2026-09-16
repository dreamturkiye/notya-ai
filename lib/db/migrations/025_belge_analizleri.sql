-- NOTYA-BELGE-01 (Kaan 2026-09-15) — Notya Belgeler: multi-engine document AI (image + sound + PDF).
-- Tier A (Claude vision) + Tier B (browser engines) share one contract. No GPU worker in V1 (Kaan decision);
-- analiz_isleri (polled job queue) is NOT created here — it comes with Tier C.

create table if not exists belge_analizleri (
  id              uuid primary key default gen_random_uuid(),
  belge_id        uuid not null,                      -- vault document id
  doctor_id       uuid not null references auth.users(id),
  patient_id      uuid not null references patients(id),
  note_id         uuid references notes(id),           -- muayene the report was approved into (set at Onayla)
  brans           text not null,
  modality_final  text not null,
  yas_ay          int,
  cinsiyet        text,
  de_id_hash      text not null,                       -- sha256 of the de-identified derivative sent to the writer
  engine_set      text not null,                       -- e.g. 'tierA-v1' | 'tierA+txrv-v1'
  durum           text not null default 'taslak',      -- taslak|hekim_duzenledi|onaylandi|muayene_onaylandi|kalite_dusuk|modalite_uyusmazlik|hata
  sonuc           jsonb,                               -- validated Claude JSON (the report the doctor sees)
  motor_ciktilari jsonb not null default '[]'::jsonb,  -- raw engine outputs, immutable
  fusion          jsonb,                               -- fused findings + cap + acil reasons + validator corrections
  hekim_tanisi    jsonb not null default '[]'::jsonb,  -- doctor-locked official diagnoses [{ad, icd10}]
  hekim_ozet      text,                                -- doctor-edited summary (null = unchanged)
  onaylandi_at    timestamptz,
  olusturuldu     timestamptz not null default now(),
  guncellendi     timestamptz not null default now()
);
create index if not exists belge_analizleri_belge_idx on belge_analizleri (belge_id, olusturuldu desc);
create index if not exists belge_analizleri_hasta_idx on belge_analizleri (patient_id, olusturuldu desc);

create table if not exists belge_revizyonlar (
  id          uuid primary key default gen_random_uuid(),
  analiz_id   uuid not null references belge_analizleri(id) on delete cascade,
  doctor_id   uuid not null references auth.users(id),
  alan        text not null,                           -- ozet|tanilar|hekim_tanisi|plan|onay|muayene_onay
  onceki      jsonb,
  sonraki     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists belge_revizyonlar_analiz_idx on belge_revizyonlar (analiz_id, created_at);

create table if not exists muayene_revizyonlar (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references notes(id) on delete cascade,
  doctor_id   uuid not null references auth.users(id),
  kaynak      text not null,                           -- 'belge_analizi'
  kaynak_id   uuid,
  alan        text not null,                           -- objektif|plan
  onceki      text,
  sonraki     text,
  created_at  timestamptz not null default now()
);

-- Engine registry: what ships, which weights, which license, which tier, validation result.
create table if not exists motor_kayit (
  motor            text primary key,
  surum            text not null,
  tier             text not null,                      -- A|B|C
  weights_sha256   text,
  lisans           text,
  ticari_kullanim  boolean not null default false,
  dogrulama_seti   text,
  dogrulama_auroc  jsonb,
  model_url        text,                               -- Tier B: ONNX location (sha256-pinned)
  aktif            boolean not null default false,
  guncellendi      timestamptz not null default now()
);
insert into motor_kayit (motor, surum, tier, lisans, ticari_kullanim, aktif)
values ('claude-vision', 'sonnet-4.6', 'A', 'Anthropic API terms', true, true)
on conflict (motor) do nothing;
-- Tier B engines are registered (aktif=false) when their ONNX export + golden-set result lands (README_BELGELER.md).
insert into motor_kayit (motor, surum, tier, lisans, ticari_kullanim, dogrulama_seti, aktif) values
  ('txrv-densenet121', '1', 'B', 'Apache-2.0', true, 'CheXpert val', false),
  ('ptbxl-inception1d', '1', 'B', 'PTB-XL CC-BY 4.0 data', true, 'PTB-XL test', false),
  ('hear-icbhi', '1', 'B', 'HAI-DEF', true, 'ICBHI 2017 test', false),
  ('hear-circor', '1', 'B', 'HAI-DEF', true, 'CirCor 2022 val', false),
  ('grazpedwri-yolo', '1', 'B', 'GRAZPEDWRI-DX CC-BY 4.0 data', true, 'GRAZPEDWRI val', false),
  ('rsna-boneage', '1', 'B', 'RSNA bone age (check weights)', false, 'RSNA val', false),
  ('fracatlas-yolo', '1', 'B', 'FracAtlas CC-BY 4.0 data', true, 'FracAtlas val', false)
on conflict (motor) do nothing;
