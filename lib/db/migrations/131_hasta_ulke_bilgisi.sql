-- 131 NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08)
-- What a country records about a patient that the core `patients` table has no place for
-- (docs/COUNTRY-PACK-CHECKLIST.md E3, E7, G5): the patronymic as its own field, the PATIENT'S OWN LANGUAGE, and an
-- optional national identity number (free text, encrypted, not validated).
--
-- A NEW table on purpose: `patients` is not altered — no column, row, policy or index of an existing table changes.
-- Türkiye does not use it; there it stays empty. One row per patient; removed with the patient or the account.
--
-- Patient isolation (.cursor/skills/hasta-izolasyon/SKILL.md): server routes use the service role and scope every
-- query by doctor_id. Row-level security is the second line, in the same migration as the table:
--   - a signed-in doctor may read only rows that carry their own id, and cannot write from the browser;
--   - the RESTRICTIVE patient-ownership policy of migration 052 (the patient of the row must be the caller's patient),
--     which 052 could not add to a table that did not exist yet.
--
-- NOT APPLIED by the job that wrote it.

create table if not exists public.hasta_ulke_bilgisi (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  -- AES-256-GCM, same helper as patients.*_encrypted (lib/security/encryption.ts).
  ota_ismi_encrypted text,
  -- ISO 639 language code of the patient (uz, ru, …): one of the country pack's patient languages.
  dil text not null check (dil ~ '^[a-z]{2,3}$'),
  ulusal_kimlik_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hasta_ulke_bilgisi_doctor_idx on public.hasta_ulke_bilgisi (doctor_id);

alter table public.hasta_ulke_bilgisi enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.hasta_ulke_bilgisi;
create policy "hasta_izolasyon_kendi_satiri" on public.hasta_ulke_bilgisi
  for select to authenticated using (doctor_id = auth.uid());

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.hasta_ulke_bilgisi;
create policy "hasta_izolasyon_hasta_sahipligi" on public.hasta_ulke_bilgisi as restrictive for all to authenticated, anon
  using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
  with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));

revoke all on table public.hasta_ulke_bilgisi from anon, authenticated;
grant select on table public.hasta_ulke_bilgisi to authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('131', '131_hasta_ulke_bilgisi.sql', null, now(), false,
  'NOTYA-UZ-MUAYENE-01: per-patient patronymic, patient language and optional national identity number (new table, owner-only, restrictive patient ownership)')
on conflict (version) do nothing;
