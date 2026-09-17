-- NOTYA-DAH-WOW-NEXT (2026-09-17): yaşlı polifarmasi kararları, sigara bırakma, gut, osteoporoz DXA, Vit D/B12 ve hasta hedef kartı.
-- Hekim kilitleri ortak dahiliye_kart_kilitleri tablosunda (kart: polifarmasi | hedef | sigara | vitamin | gut | osteo).
create table if not exists dahiliye_polifarmasi_kararlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  kural_kod text not null, siddet text not null check (siddet in ('durdur','gozden_gecir','baslat')), engelleyici boolean not null default false,
  karar text not null check (karar in ('kabul','override')), gerekce text, ilaclar jsonb, baslik text,
  created_at timestamptz not null default now(),
  check (not (engelleyici and karar = 'override' and char_length(coalesce(gerekce, '')) < 15))
);
create index if not exists dahiliye_polifarmasi_kararlari_idx on dahiliye_polifarmasi_kararlari (patient_id, kural_kod, created_at desc);
alter table dahiliye_polifarmasi_kararlari enable row level security;

create table if not exists dahiliye_sigara (
  patient_id uuid primary key references patients(id), doctor_id uuid not null references auth.users(id),
  durum text check (durum in ('iciyor','birakti','hic')), gunluk_adet int, yil int, ilk_sigara_dk int,
  evre text check (evre in ('hazir_degil','dusunuyor','hazirlik','eylem','surdurme')), birakma_tarihi date,
  nobet_oyku boolean not null default false, yeme_bozuklugu boolean not null default false, psikiyatrik_oyku boolean not null default false,
  danisma jsonb, updated_at timestamptz not null default now()
);
alter table dahiliye_sigara enable row level security;

create table if not exists dahiliye_gut (
  patient_id uuid primary key references patients(id), doctor_id uuid not null references auth.users(id),
  atak_aktif boolean not null default false, ates boolean not null default false, kristal_kanit boolean not null default false,
  atak_sayisi_12ay int not null default 0, tofus boolean not null default false, radyografik_hasar boolean not null default false, urolitiyazis boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table dahiliye_gut enable row level security;

create table if not exists dahiliye_osteoporoz (
  patient_id uuid primary key references patients(id), doctor_id uuid not null references auth.users(id),
  t_lomber numeric, t_femur_boyun numeric, t_total_kalca numeric, dxa_tarihi date,
  t_kaynak text check (t_kaynak in ('belge','hekim')), belge_analiz_id uuid,
  riskler jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(),
  check (t_lomber is null or t_lomber between -6 and 4), check (t_femur_boyun is null or t_femur_boyun between -6 and 4), check (t_total_kalca is null or t_total_kalca between -6 and 4)
);
alter table dahiliye_osteoporoz enable row level security;

create table if not exists dahiliye_vitamin (
  patient_id uuid primary key references patients(id), doctor_id uuid not null references auth.users(id),
  noro_semptom boolean not null default false, malabsorpsiyon boolean not null default false, vegan boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table dahiliye_vitamin enable row level security;

create table if not exists dahiliye_hedef_kartlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  satirlar jsonb not null, yapraklar jsonb not null, created_at timestamptz not null default now()
);
create index if not exists dahiliye_hedef_kartlari_idx on dahiliye_hedef_kartlari (patient_id, created_at desc);
alter table dahiliye_hedef_kartlari enable row level security;
