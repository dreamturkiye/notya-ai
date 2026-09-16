-- NOTYA-JINE-04 / KD-05 — Sprint wow storage (JSON documents per patient)
create table if not exists kd_wow_kayitlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  tur text not null, -- cybh_tedavi|acil_kb|menoraji|usg|anti_d|e_dogum|paket|cs|urojine|onkoloji|infertilite|siddet|kok_yillik|yontem_mec|postpartum_kb
  veri jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists kd_wow_hasta_idx on kd_wow_kayitlari (patient_id, tur, created_at desc);

alter table cybh_episodlari add column if not exists tedavi jsonb;
alter table jine_aub add column if not exists tedavi_basamak jsonb;
alter table kontrasepsiyon add column if not exists mec jsonb;
alter table kontrasepsiyon add column if not exists acil jsonb;
