-- 133 NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08)
-- What a country records about a visit NOTE that the core `notes` table has no place for
-- (docs/COUNTRY-PACK-CHECKLIST.md E6): the language the note's text is written in, and the SECOND DRAFT — the same
-- note rewritten in the country's other language on the doctor's click, kept beside the note until one of the two
-- is approved.
--
-- A NEW table on purpose: `notes` is not altered — no column, row, policy or index of an existing table changes.
-- Türkiye does not use it; there it stays empty. One row per note; removed with the note, the patient or the account.
--
-- Patient isolation (.cursor/skills/hasta-izolasyon/SKILL.md): server routes use the service role and scope every
-- query by doctor_id. Row-level security is the second line, in the same migration as the table:
--   - a signed-in doctor may read only rows that carry their own id, and cannot write from the browser;
--   - the RESTRICTIVE patient-ownership policy of migration 052 (the patient of the row must be the caller's patient).
--
-- NOT APPLIED by the job that wrote it. Apply to a country's database, after 132, before the visit screen is used.

create table if not exists public.not_dil_kaydi (
  note_id uuid primary key references public.notes(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- BCP-47 language (and script) of the text in notes.content_*.
  not_dili text not null check (not_dili ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  -- The second draft: the note rewritten in the other language. All null until the doctor asks for it.
  ikinci_dil text check (ikinci_dil is null or ikinci_dil ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  ikinci_s text,
  ikinci_o text,
  ikinci_a text,
  ikinci_p text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ikinci_dil is null or ikinci_dil <> not_dili)
);

create index if not exists not_dil_kaydi_doctor_idx on public.not_dil_kaydi (doctor_id);

alter table public.not_dil_kaydi enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.not_dil_kaydi;
create policy "hasta_izolasyon_kendi_satiri" on public.not_dil_kaydi
  for select to authenticated using (doctor_id = auth.uid());

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.not_dil_kaydi;
create policy "hasta_izolasyon_hasta_sahipligi" on public.not_dil_kaydi as restrictive for all to authenticated, anon
  using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
  with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));

revoke all on table public.not_dil_kaydi from anon, authenticated;
grant select on table public.not_dil_kaydi to authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('133', '133_not_dil_kaydi.sql', null, now(), false,
  'NOTYA-UZ-MUAYENE-01: per-note language and second-language draft (new table, owner-only, restrictive patient ownership)')
on conflict (version) do nothing;
