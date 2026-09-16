-- NOTYA-DERM-clinic-fit (2026-09-16): Dermatoloji visit-first clinic surface.
-- Additive only. Live clinical truth = these tables/jsonb (like gebelik_*), NOT specialty_records.payload.
-- Photos stay in core hasta_goruntulemeler / vault — coreImageId / documentId only. No second blob store. No auto-delete.
-- Numbered 027 so 025 (belge_analizleri) and 026 (KD clinic-fit) stay reserved.

-- PACS CHECK: allow derm capture codes used by Deri tab CTAs. Drop+recreate is additive (more values).
alter table hasta_goruntulemeler drop constraint if exists hasta_goruntulemeler_modalite_check;
alter table hasta_goruntulemeler
  add constraint hasta_goruntulemeler_modalite_check
  check (
    modalite is null or modalite in (
      'xray', 'mri', 'bt', 'us', 'pet', 'ekg', 'eko', 'mamografi', 'diger',
      'dermatoskopi', 'derm', 'yara'
    )
  );

comment on column hasta_goruntulemeler.modalite is
  'Canonical modality: xray|mri|bt|us|pet|ekg|eko|mamografi|diger|dermatoskopi|derm|yara';

-- Episode-level dermatology clinical state (one row per patient × doctor).
create table if not exists hasta_derm (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  unit text not null default 'genel',
  visit_type text not null default 'genel-poliklinik',
  durum text not null default 'aktif',
  patient_derm jsonb not null default '{}'::jsonb,
  gop jsonb not null default '{}'::jsonb,
  total_body_map jsonb,
  bedside_tests jsonb not null default '[]'::jsonb,
  hair_workup jsonb,
  bullous_workup jsonb,
  behcet_card jsonb,
  last_tbse_iso date,
  next_photo_iso date,
  acitretin_ban boolean not null default false,
  tb_screen boolean not null default false,
  hbv_screen boolean not null default false,
  bzbh_kind text,
  ugly_duckling boolean not null default false,
  psa_joint boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, doctor_id)
);
create index if not exists hasta_derm_patient_idx on hasta_derm (patient_id, doctor_id);

comment on table hasta_derm is
  'Dermatoloji episode CRUD truth. PASI/Fitzpatrick/GÖP live here — never on core patient types.';

create table if not exists derm_ziyaretleri (
  id uuid primary key default gen_random_uuid(),
  hasta_derm_id uuid not null references hasta_derm(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  tarih date not null default current_date,
  unit text not null default 'genel',
  visit_type text not null default 'genel-poliklinik',
  checklist jsonb not null default '{}'::jsonb,
  not_metni text,
  created_at timestamptz not null default now()
);
create index if not exists derm_ziyaretleri_ep_idx on derm_ziyaretleri (hasta_derm_id, tarih desc);

create table if not exists derm_lezyonlar (
  id uuid primary key default gen_random_uuid(),
  hasta_derm_id uuid not null references hasta_derm(id) on delete cascade,
  region text not null,
  morphology text not null default 'unspecified',
  body_map_node text,
  notes text,
  document_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists derm_lezyonlar_ep_idx on derm_lezyonlar (hasta_derm_id);

create table if not exists derm_skor_anlari (
  id uuid primary key default gen_random_uuid(),
  hasta_derm_id uuid not null references hasta_derm(id) on delete cascade,
  recorded_at date not null default current_date,
  pasi numeric,
  easi numeric,
  dlqi int,
  uas7 int,
  salt numeric,
  pdai numeric,
  created_at timestamptz not null default now()
);
create index if not exists derm_skor_anlari_ep_idx on derm_skor_anlari (hasta_derm_id, recorded_at desc);

create table if not exists derm_fototerapi_seanslari (
  id uuid primary key default gen_random_uuid(),
  hasta_derm_id uuid not null references hasta_derm(id) on delete cascade,
  seans_tarihi date not null default current_date,
  device text not null,
  j_cm2 numeric not null default 0,
  med_test boolean not null default false,
  burn boolean not null default false,
  session_photo_core_image_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists derm_fototerapi_ep_idx on derm_fototerapi_seanslari (hasta_derm_id, seans_tarihi desc);

create table if not exists derm_yama_kurslari (
  id uuid primary key default gen_random_uuid(),
  hasta_derm_id uuid not null references hasta_derm(id) on delete cascade,
  series text not null default 'european_baseline',
  applied_at date not null,
  read_d2 date,
  read_d4 date,
  photo_ids jsonb not null default '[]'::jsonb,
  positives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists derm_yama_ep_idx on derm_yama_kurslari (hasta_derm_id, applied_at desc);

create table if not exists derm_vision_reads (
  id uuid primary key default gen_random_uuid(),
  hasta_derm_id uuid not null references hasta_derm(id) on delete cascade,
  asset_ids jsonb not null default '[]'::jsonb,
  task text not null,
  status text not null default 'draft',
  drafted_by text not null,
  approved_by text,
  observations text not null default '',
  differentials jsonb not null default '[]'::jsonb,
  next_step text not null default '',
  disclaimer text not null default 'Tarama desteği, tanı değildir. Doktor onayı gerekir.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists derm_vision_ep_idx on derm_vision_reads (hasta_derm_id, created_at desc);

-- Consent + derm kind + belge link keyed by core görüntüleme id. Never pixels.
create table if not exists derm_foto_meta (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  core_image_id uuid not null,
  lesion_id uuid,
  document_id uuid,
  kind text,
  genital_consent boolean not null default false,
  pediatric_consent boolean not null default false,
  education_anonymized boolean not null default false,
  patient_share boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, core_image_id)
);
create index if not exists derm_foto_meta_hasta_idx on derm_foto_meta (patient_id, doctor_id);

alter table hasta_derm enable row level security;
alter table derm_ziyaretleri enable row level security;
alter table derm_lezyonlar enable row level security;
alter table derm_skor_anlari enable row level security;
alter table derm_fototerapi_seanslari enable row level security;
alter table derm_yama_kurslari enable row level security;
alter table derm_vision_reads enable row level security;
alter table derm_foto_meta enable row level security;

do $$ begin
  create policy "doktor kendi hasta_derm gorur" on hasta_derm for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi derm ziyaretlerini gorur" on derm_ziyaretleri for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi derm lezyonlarini gorur" on derm_lezyonlar for all
    using (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()))
    with check (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi derm skorlarini gorur" on derm_skor_anlari for all
    using (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()))
    with check (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi derm fototerapi gorur" on derm_fototerapi_seanslari for all
    using (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()))
    with check (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi derm yama gorur" on derm_yama_kurslari for all
    using (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()))
    with check (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi derm vision gorur" on derm_vision_reads for all
    using (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()))
    with check (exists (select 1 from hasta_derm h where h.id = hasta_derm_id and h.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi derm foto meta gorur" on derm_foto_meta for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values (
  '027',
  '027_derm_clinic_fit.sql',
  null,
  now(),
  false,
  'Derm clinic-fit: hasta_derm + visits/lesions/scores/phototherapy/patch/vision/foto_meta. Additive. Photos remain hasta_goruntulemeler. Preview/prod share Supabase — apply before persistence QA.'
)
on conflict (version) do nothing;
