-- 199 — PREMATURE-MODUL (Kaan, 2026-11-13): prematurity support, Pediatri and Kadın Hastalıkları ve Doğum only.
--   1) gebelikler.erken_dogum          KD preterm-birth risk record (jsonb): cervical-length log, PPROM, antenatal corticosteroid
--                                      course dates, magnesium sulfate record, progesterone as a doctor-entered fact. Validated
--                                      by the shared engine specialties/kadin-dogum/engines/erkenDogum.ts before it is written.
--                                      Records only: no dose or order is ever proposed or stored by the engine.
--   2) bebek_kartlari.erken_dogum_ozeti  summary carried through the KD discharge packet (olusturCanliDogum): gestational week
--                                      at birth, steroid course yes/no, PPROM yes/no, magnesium yes/no. Pre-fills the pediatric
--                                      follow-up plan; it is history, never a rule input.
--   3) pedi_prematur_kayit             pediatric side: the doctor's NICU history profile (profil) and the doctor's own mark on each
--                                      follow-up item (ogeler: planned / done / not applicable). One row per patient.
-- Türkiye database only for now; the six country databases get the same definition in the country port job
-- (docs/OPEN-COMMITMENTS.md, PREMATUR-ULKE-01). Number 199: 197 is taken on main and 198 is taken by the country-only Ayşe migration (release branches).
-- HASTA-IZOLASYON: RLS on; anon gets nothing; authenticated may only SELECT its own rows, under the restrictive
-- patient-ownership policy (052 / 190 / 193 pattern). The application uses the service role.

alter table public.gebelikler add column if not exists erken_dogum jsonb;
alter table public.bebek_kartlari add column if not exists erken_dogum_ozeti jsonb;

create table if not exists public.pedi_prematur_kayit (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  profil jsonb not null default '{}'::jsonb,
  ogeler jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, patient_id)
);
create index if not exists pedi_prematur_kayit_doktor_idx on public.pedi_prematur_kayit (doctor_id, updated_at desc);

alter table public.pedi_prematur_kayit enable row level security;
revoke all on public.pedi_prematur_kayit from anon, authenticated;
grant select on public.pedi_prematur_kayit to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pedi_prematur_kayit' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.pedi_prematur_kayit for select to authenticated using (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pedi_prematur_kayit' and policyname = 'hasta_izolasyon_hasta_sahipligi') then
    create policy hasta_izolasyon_hasta_sahipligi on public.pedi_prematur_kayit as restrictive for all to authenticated, anon
      using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('199', '199_prematur_modul.sql', null, now(), false,
  'PREMATURE-MODUL: gebelikler.erken_dogum + bebek_kartlari.erken_dogum_ozeti (jsonb) + pedi_prematur_kayit (RLS + restrictive hasta_izolasyon)')
on conflict (version) do nothing;
