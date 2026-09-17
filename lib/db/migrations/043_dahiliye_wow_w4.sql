-- NOTYA-DAH-WOW Wave 4 (2026-09-16): kohort paneli indeksleri + bakım kalitesi dürtmeleri (FRAIL, düşme, PHQ-2, KB ölçüm tekniği).
alter table dahiliye_ht add column if not exists teknik_onay boolean;
alter table dahiliye_ht add column if not exists teknik_liste jsonb;
create table if not exists dahiliye_taramalar (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tip text not null check (tip in ('frail','dusme','phq2')), cevaplar jsonb not null, skor int, pozitif boolean not null default false, not_metni text,
  created_at timestamptz not null default now()
);
create index if not exists dahiliye_taramalar_idx on dahiliye_taramalar (patient_id, tip, created_at desc);
alter table dahiliye_taramalar enable row level security;
create index if not exists dahiliye_gorevleri_doktor_idx on dahiliye_gorevleri (doctor_id, durum, due);
create index if not exists dahiliye_ht_doktor_idx on dahiliye_ht (doctor_id, patient_id, tarih desc);
