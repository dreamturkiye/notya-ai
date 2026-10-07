-- 126 — MBYS-YARDIMCI-01 (2026-10-07): Gün sonu MBYS kuyruğu.
--
-- mbys_aktarimlar: per visit (note) MBYS state the doctor set — 'aktarildi' (record handed to the browser helper)
--   or 'kaydedildi' (doctor tapped "Kaydettim" after saving in MBYS). Hazır / Eksik are computed, never stored.
-- mbys_hasta_kimlik: identity fields MBYS needs that the patient record does not hold (kayıt türü, pasaport /
--   şahıs no, uyruk, separate ad/soyad). Encrypted JSON, own table — never in patients.notes_encrypted, which
--   reaches the assistant's model context.
-- users.mbys_ayar: the doctor's defaults for Muayene türü / Vaka türü.
--
-- No Ministry address is called by Notya; this only tracks what the doctor did. ADDITIVE only. Idempotent.

create table if not exists public.mbys_aktarimlar (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  durum text not null check (durum in ('aktarildi', 'kaydedildi')),
  aktarildi_at timestamptz,
  kaydedildi_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (doctor_id, note_id)
);

create index if not exists mbys_aktarimlar_hasta_idx on public.mbys_aktarimlar (doctor_id, patient_id);

create table if not exists public.mbys_hasta_kimlik (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  kimlik_encrypted text not null,
  updated_at timestamptz not null default now(),
  unique (doctor_id, patient_id)
);

alter table public.mbys_aktarimlar enable row level security;
alter table public.mbys_hasta_kimlik enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'mbys_aktarimlar' and policyname = 'doktor kendi mbys aktarimlari') then
    create policy "doktor kendi mbys aktarimlari" on public.mbys_aktarimlar
      for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'mbys_aktarimlar' and policyname = 'hasta_izolasyon_hasta_sahipligi') then
    create policy hasta_izolasyon_hasta_sahipligi on public.mbys_aktarimlar as restrictive for all to authenticated, anon
      using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'mbys_hasta_kimlik' and policyname = 'doktor kendi mbys kimlikleri') then
    create policy "doktor kendi mbys kimlikleri" on public.mbys_hasta_kimlik
      for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'mbys_hasta_kimlik' and policyname = 'hasta_izolasyon_hasta_sahipligi') then
    create policy hasta_izolasyon_hasta_sahipligi on public.mbys_hasta_kimlik as restrictive for all to authenticated, anon
      using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  end if;
end $$;

alter table public.users add column if not exists mbys_ayar jsonb;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('126', '126_mbys_yardimci.sql', null, now(), false,
  'MBYS-YARDIMCI-01: mbys_aktarimlar + mbys_hasta_kimlik + users.mbys_ayar')
on conflict (version) do nothing;
