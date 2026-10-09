-- 132 NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08) · reshaped for the shared database by NOTYA-ULKE-SABLON-01
--
-- 1. ulke_muayeneler     THE VISIT of a country build: the patient, the consent, the transcript. A table of its
--                        own — a country's visits never sit in Türkiye's `sessions`.
-- 2. muayene_dil_kaydi   what the country records beside it (docs/COUNTRY-PACK-CHECKLIST.md A3, E5, L1): the
--                        recording consent and its wording, the language the speech engine predicted and how sure it
--                        was, whether a second pass ran (it costs a second transcription), whether confidence stayed low.
-- 3. ulke_kullanim       the daily counter behind the ceiling on visits per account, by the country's own day.
--                        A table of its own — Türkiye's `ai_kullanim` is not touched.
-- 4. The storage bucket a visit recording is uploaded to before it is transcribed and removed, and its upload rule.
--
-- NEW objects only. `sessions`, `notes`, `patients`, `ai_kullanim` and the existing buckets and their policies are
-- not read, written or altered. Rules of the shared database: migration 130.
--
-- STORAGE, PER COUNTRY. One private bucket for every country; inside it a recording lies under
-- `<country>/<account id>/<file>`. The upload rule checks BOTH folders: the first must be the country stamped on
-- the caller's session, the second the caller's own account id. An account of Türkiye (no country stamp) can upload
-- nothing there; an account of one country can upload nothing under another country's folder. The server checks the
-- same two folders as text before it touches storage (lib/ulke/uygulama/muayeneKaydi.ts).
-- The rule is ONE NEW POLICY on `storage.objects` that names only this bucket. Creating a policy takes a short
-- exclusive lock on `storage.objects`, a table Türkiye uses: it is created only if it does not exist yet, so a second
-- run takes no lock there at all (docs/COUNTRY-PACK-DB-ROLLOUT.md).
--
-- Safe to run twice. One transaction. NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- ── 1. Visits ───────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_muayeneler (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  patient_consent_given boolean not null default false,
  patient_consent_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  -- The note template the visit was recorded with (a role key of the country pack, or its general template).
  specialty text,
  session_type text,
  status text,
  transcript_cleaned text,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint ulke_muayeneler_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  constraint ulke_muayeneler_sahip_tekil unique (ulke, doctor_id, id)
);

create index if not exists ulke_muayeneler_doctor_idx on public.ulke_muayeneler (ulke, doctor_id, started_at desc);
create index if not exists ulke_muayeneler_patient_idx on public.ulke_muayeneler (ulke, doctor_id, patient_id, started_at desc);

alter table public.ulke_muayeneler enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.ulke_muayeneler;
create policy "hasta_izolasyon_kendi_satiri" on public.ulke_muayeneler
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.ulke_muayeneler;
create policy "hasta_izolasyon_hasta_sahipligi" on public.ulke_muayeneler as restrictive for all to authenticated, anon
  using (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()))
  with check (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()));

revoke all on table public.ulke_muayeneler from anon, authenticated;
grant select on table public.ulke_muayeneler to authenticated;

-- ── 2. Consent and speech-recognition record of a visit ─────────────────────────────────────────────────────
create table if not exists public.muayene_dil_kaydi (
  session_id uuid primary key,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
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
  created_at timestamptz not null default now(),
  constraint muayene_dil_kaydi_muayene_fk foreign key (ulke, doctor_id, session_id) references public.ulke_muayeneler (ulke, doctor_id, id) on delete cascade,
  constraint muayene_dil_kaydi_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

create index if not exists muayene_dil_kaydi_doctor_idx on public.muayene_dil_kaydi (ulke, doctor_id, created_at desc);

alter table public.muayene_dil_kaydi enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.muayene_dil_kaydi;
create policy "hasta_izolasyon_kendi_satiri" on public.muayene_dil_kaydi
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.muayene_dil_kaydi;
create policy "hasta_izolasyon_hasta_sahipligi" on public.muayene_dil_kaydi as restrictive for all to authenticated, anon
  using (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()))
  with check (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()));

revoke all on table public.muayene_dil_kaydi from anon, authenticated;
grant select on table public.muayene_dil_kaydi to authenticated;

-- ── 3. Daily counter ────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_kullanim (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  -- The country's own calendar day (the pack's time zone), not the server's.
  gun date not null,
  kova text not null,
  sayac integer not null default 0 check (sayac >= 0),
  primary key (ulke, doctor_id, gun, kova),
  constraint ulke_kullanim_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

-- Server only: no policy, no privilege for the browser roles.
alter table public.ulke_kullanim enable row level security;
revoke all on table public.ulke_kullanim from anon, authenticated;

-- ── 4. Visit recordings ─────────────────────────────────────────────────────────────────────────────────────
-- Private. A signed-in account may ADD an object under `<its country>/<its own account id>/` and do nothing else —
-- no read, no overwrite, no delete: only the server (service role) reads a recording, once, and removes it as soon
-- as it has been transcribed. The policy names this bucket only.
insert into storage.buckets (id, name, public)
values ('muayene-sesleri', 'muayene-sesleri', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'muayene_sesleri_ulke_ve_kendi_klasorune_yukle') then
    create policy "muayene_sesleri_ulke_ve_kendi_klasorune_yukle" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'muayene-sesleri'
        and public.ulke_oturum_ulkesi() <> ''
        and (storage.foldername(name))[1] = public.ulke_oturum_ulkesi()
        and (storage.foldername(name))[2] = auth.uid()::text
        and array_length(storage.foldername(name), 1) = 2
      );
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('132', '132_muayene_dil_kaydi.sql', null, now(), false,
  'NOTYA-ULKE-SABLON-01: country visits (ulke_muayeneler) + consent and speech record + daily counter (new tables, country and doctor in every key) + private bucket muayene-sesleri with an upload rule per country folder and own folder')
on conflict (version) do nothing;

commit;
