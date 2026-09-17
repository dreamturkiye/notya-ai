-- NOTYA-DAH-WOW W1.4 (2026-09-16): SGK ilaç kullanım raporu şablonları (HT / DM / statin / DOAK) — kartlardan ön dolu taslak.
-- Hasta adı ve T.C. kimlik no SAKLANMAZ (taslak render sırasında doldurulur). Hekim kilitleyince durum = 'kilitli'.
create table if not exists dahiliye_sgk_raporlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  sablon text not null check (sablon in ('ht','dm','statin','doak')),
  draft jsonb not null,
  sut_kontrol jsonb,
  eksikler text[] not null default '{}',
  durum text not null default 'taslak' check (durum in ('taslak','kilitli')),
  kilit_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dahiliye_sgk_raporlari_idx on dahiliye_sgk_raporlari (patient_id, created_at desc);
alter table dahiliye_sgk_raporlari enable row level security;
