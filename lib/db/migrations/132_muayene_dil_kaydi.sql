-- 132 NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08)
-- What a country records about a VISIT that the core `sessions` table has no place for
-- (docs/COUNTRY-PACK-CHECKLIST.md A3, E5, L1): the recording consent, the language the speech engine predicted and
-- how sure it was, whether a second pass ran (it costs a second transcription), and whether confidence stayed low.
-- Also the storage bucket a visit recording is uploaded to before it is transcribed and removed.
--
-- NEW objects only: one new table, one new storage bucket, one new policy that names only that bucket.
-- `sessions`, `notes`, `patients` and the existing buckets and their policies are not altered. Türkiye does not use
-- any of it; there the table and the bucket stay empty.
--
-- Patient isolation (.cursor/skills/hasta-izolasyon/SKILL.md): server routes use the service role and scope every
-- query by doctor_id. Row-level security is the second line, in the same migration as the table:
--   - a signed-in doctor may read only rows that carry their own id, and cannot write from the browser;
--   - the RESTRICTIVE patient-ownership policy of migration 052 (the patient of the row must be the caller's patient).
--
-- NOT APPLIED by the job that wrote it. Apply to a country's database before the visit screen is used there.

create table if not exists public.muayene_dil_kaydi (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- Recording consent: when the tick-box was confirmed, and which wording was on the screen.
  riza_at timestamptz not null,
  riza_surumu text not null,
  -- Speech recognition: the model, what the FIRST pass predicted, and the pass that was kept.
  stt_model text not null,
  taninan_dil text,
  dil_olasiligi numeric check (dil_olasiligi is null or (dil_olasiligi >= 0 and dil_olasiligi <= 1)),
  ortalama_log_olasilik numeric,
  ikinci_gecis boolean not null default false,
  ikinci_gecis_dili text,
  secilen_gecis smallint not null default 1 check (secilen_gecis in (1, 2)),
  -- Never more than two passes for one recording.
  gecis_sayisi smallint not null default 1 check (gecis_sayisi in (1, 2)),
  dusuk_guven boolean not null default false,
  ses_suresi_sn numeric,
  -- The doctor's note language when the visit was recorded (BCP-47), and the note template.
  not_dili text not null check (not_dili ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  sablon text not null,
  created_at timestamptz not null default now()
);

create index if not exists muayene_dil_kaydi_doctor_idx on public.muayene_dil_kaydi (doctor_id, created_at desc);

alter table public.muayene_dil_kaydi enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.muayene_dil_kaydi;
create policy "hasta_izolasyon_kendi_satiri" on public.muayene_dil_kaydi
  for select to authenticated using (doctor_id = auth.uid());

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.muayene_dil_kaydi;
create policy "hasta_izolasyon_hasta_sahipligi" on public.muayene_dil_kaydi as restrictive for all to authenticated, anon
  using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
  with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));

revoke all on table public.muayene_dil_kaydi from anon, authenticated;
grant select on table public.muayene_dil_kaydi to authenticated;

-- Visit recordings. Private. A signed-in account may ADD an object under the folder named after its own account id
-- and do nothing else — no read, no overwrite, no delete: only the server (service role) reads a recording, once,
-- and removes it as soon as it has been transcribed. The policy names this bucket only.
insert into storage.buckets (id, name, public)
values ('muayene-sesleri', 'muayene-sesleri', false)
on conflict (id) do nothing;

drop policy if exists "muayene_sesleri_kendi_klasorune_yukle" on storage.objects;
create policy "muayene_sesleri_kendi_klasorune_yukle" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'muayene-sesleri' and (storage.foldername(name))[1] = auth.uid()::text);

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('132', '132_muayene_dil_kaydi.sql', null, now(), false,
  'NOTYA-UZ-MUAYENE-01: per-visit recording consent and speech-recognition record (new table, owner-only, restrictive patient ownership) + private bucket muayene-sesleri with an own-folder upload policy')
on conflict (version) do nothing;
