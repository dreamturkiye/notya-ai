-- 193 — KD-TARAMA-01 (Kaan, 2026-11-09): obstetric and gynaecological records, Kadın Hastalıkları ve Doğum only.
--   1) kd_tarama_kayitlari   one record per row: a thyroid result in pregnancy, the thyroid status, the clinician's own
--                            levothyroxine note, an HPV vaccine dose, the SMA carrier-screening record, a PMS/PMDD diary
--                            (open/closed) or the doctor's PMDD checklist. Content in `veri` (jsonb), validated by the
--                            shared engine lib/clinical/kdTaramalar.ts before it is written. No dose is ever proposed.
--   2) kd_semptom_gunlugu    the prospective daily diary: one row per diary per day, written by the patient in the portal
--                            (kaynak = 'portal') or by the doctor from a paper diary (kaynak = 'klinik').
-- Same definition in all seven databases (Türkiye and the six country builds keep one schema); number 193 is the first free
-- number in every database (Türkiye ends at 191, the country databases at 192).
-- HASTA-IZOLASYON: RLS on; anon gets nothing; authenticated may only SELECT its own rows, under the restrictive
-- patient-ownership policy (052 / 190 pattern). The application uses the service role.

create table if not exists public.kd_tarama_kayitlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  gebelik_id uuid,
  tur text not null check (tur in ('tiroid_olcum', 'tiroid_durum', 'lt4_not', 'hpv_doz', 'sma', 'pmdd_gunluk', 'pmdd_kontrol')),
  kayit_tarihi date not null,
  veri jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kd_tarama_kayitlari_hasta_idx on public.kd_tarama_kayitlari (doctor_id, patient_id, created_at desc);

create table if not exists public.kd_semptom_gunlugu (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  gunluk_id uuid not null references public.kd_tarama_kayitlari(id) on delete cascade,
  tarih date not null,
  adet boolean not null default false,
  puan jsonb not null default '{}'::jsonb,
  islev jsonb not null default '{}'::jsonb,
  kaynak text not null default 'portal' check (kaynak in ('portal', 'klinik')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gunluk_id, tarih)
);
create index if not exists kd_semptom_gunlugu_hasta_idx on public.kd_semptom_gunlugu (doctor_id, patient_id, tarih desc);

alter table public.kd_tarama_kayitlari enable row level security;
alter table public.kd_semptom_gunlugu enable row level security;
revoke all on public.kd_tarama_kayitlari from anon, authenticated;
revoke all on public.kd_semptom_gunlugu from anon, authenticated;
grant select on public.kd_tarama_kayitlari to authenticated;
grant select on public.kd_semptom_gunlugu to authenticated;

do $$
declare t text;
begin
  foreach t in array array['kd_tarama_kayitlari', 'kd_semptom_gunlugu'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'doktor kendi satirlari') then
      execute format('create policy "doktor kendi satirlari" on public.%I for select to authenticated using (doctor_id = auth.uid())', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'hasta_izolasyon_hasta_sahipligi') then
      execute format(
        'create policy hasta_izolasyon_hasta_sahipligi on public.%I as restrictive for all to authenticated, anon
           using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))', t);
    end if;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('193', '193_kd_taramalar.sql', null, now(), false,
  'KD-TARAMA-01: kd_tarama_kayitlari (tiroid/HPV/SMA/PMDD kayitlari) + kd_semptom_gunlugu (prospektif gunluk); RLS + restrictive hasta_izolasyon')
on conflict (version) do nothing;

-- Rollback (manual, never automatic):
--   drop table if exists public.kd_semptom_gunlugu; drop table if exists public.kd_tarama_kayitlari;
