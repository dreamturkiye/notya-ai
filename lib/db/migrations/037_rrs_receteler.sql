-- NOTYA-RRS-01 (2026-09-16): Renkli Reçete Sistemi iş akışı kaydı.
-- Kırmızı/yeşil reçeteye tabi ilaçlar Türkiye'de RRS'de düzenlenir; Notya bir kayıt açar (bekliyor),
-- doktor RRS'de düzenleyip reçete numarasını girer (duzenlendi). TC saklanmaz — RRS'de girilir.
create table if not exists rrs_receteler (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  note_id uuid,
  patient_id uuid,
  renk text not null check (renk in ('kirmizi','yesil')),
  satirlar jsonb not null default '[]'::jsonb,
  rrs_recete_no text,
  durum text not null default 'bekliyor' check (durum in ('bekliyor','duzenlendi','iptal')),
  duzenlenme timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rrs_receteler_doktor_durum on rrs_receteler (doctor_id, durum, created_at desc);
create unique index if not exists rrs_receteler_note_renk on rrs_receteler (note_id, renk) where note_id is not null;
