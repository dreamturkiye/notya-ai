-- NOTYA-KHD-01 (Kaan 2026-09-14): Gebelik takibi — Kadın Hastalıkları ve Doğum chapter.
-- Kaynak takvim: SB Doğum Öncesi Bakım Yönetim Rehberi (4 izlem). Hesaplar lib/clinical/gebelik.ts'de.

create table if not exists gebelikler (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  sat date,                         -- son adet tarihi
  tdt date,                         -- tahmini doğum tarihi (US ile düzeltilmiş olabilir)
  tdt_kaynak text default 'sat',    -- 'sat' | 'usg'
  gravida int, para int, abortus int, yasayan int,
  gebelik_oncesi_kilo numeric, boy numeric,
  kan_grubu text, rh_negatif boolean default false,
  risk_faktorleri jsonb default '[]'::jsonb,
  durum text not null default 'aktif',  -- 'aktif' | 'tamamlandi' | 'sonlandi'
  dogum_tarihi date, dogum_sekli text, dogum_notu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gebelikler_patient_idx on gebelikler(patient_id, durum);

create table if not exists gebelik_izlemleri (
  id uuid primary key default gen_random_uuid(),
  gebelik_id uuid not null references gebelikler(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  tarih date not null default current_date,
  hafta int not null,
  kilo numeric, tansiyon_sistolik int, tansiyon_diastolik int,
  fundus_yuksekligi numeric, fetal_kalp_atimi int, proteinuri text,
  usg jsonb,                        -- {crl, bpd, hc, ac, fl, efw, amnion, plasenta, prezentasyon}
  not_metni text,
  not_id uuid references notes(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists gebelik_izlemleri_gebelik_idx on gebelik_izlemleri(gebelik_id, tarih desc);

alter table gebelikler enable row level security;
alter table gebelik_izlemleri enable row level security;
create policy "doktor kendi gebeliklerini gorur" on gebelikler for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
create policy "doktor kendi gebelik izlemlerini gorur" on gebelik_izlemleri for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
