-- 133 NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08) · reshaped for the shared database by NOTYA-ULKE-SABLON-01
--
-- 1. ulke_notlar     THE NOTE of a country build's visit: four sections, the model that wrote it, the approval.
--                    A table of its own — a country's notes never sit in Türkiye's `notes`.
-- 2. not_dil_kaydi   what the country records beside it (docs/COUNTRY-PACK-CHECKLIST.md E6): the language the
--                    note's text is written in, and the SECOND DRAFT — the same note rewritten in the country's other
--                    language on the doctor's click, kept beside the note until one of the two is approved.
--
-- NEW tables only. `notes` is not read, written or altered. Rules of the shared database: migration 130.
-- A note belongs to (country, doctor, visit); its language record to (country, doctor, note) and (country, doctor,
-- patient). Row-level security as in 131: own rows of the session's country only, no write from the browser, and
-- the restrictive patient-ownership policy on the table that names a patient.
--
-- Safe to run twice. One transaction. NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- ── 1. Notes ────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_notlar (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  session_id uuid not null,
  note_type text not null default 'soap',
  content_subjektif text,
  content_objektif text,
  content_degerlendirme text,
  content_plan text,
  -- The model the policy named for the note task when the note was written. A label, never a choice made here.
  ai_model text,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz not null default now(),
  constraint ulke_notlar_muayene_fk foreign key (ulke, doctor_id, session_id) references public.ulke_muayeneler (ulke, doctor_id, id) on delete cascade,
  constraint ulke_notlar_sahip_tekil unique (ulke, doctor_id, id),
  -- An approved note names who approved it, and only its own doctor can be that.
  constraint ulke_notlar_onaylayan check (approved_by is null or approved_by = doctor_id)
);

create index if not exists ulke_notlar_session_idx on public.ulke_notlar (ulke, doctor_id, session_id);

alter table public.ulke_notlar enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.ulke_notlar;
create policy "hasta_izolasyon_kendi_satiri" on public.ulke_notlar
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

revoke all on table public.ulke_notlar from anon, authenticated;
grant select on table public.ulke_notlar to authenticated;

-- ── 2. Language of the note, and the second draft ───────────────────────────────────────────────────────────
create table if not exists public.not_dil_kaydi (
  note_id uuid primary key,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  -- BCP-47 language (and script) of the text in ulke_notlar.content_*.
  not_dili text not null check (not_dili ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  -- The second draft: the note rewritten in the other language. All null until the doctor asks for it.
  ikinci_dil text check (ikinci_dil is null or ikinci_dil ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  ikinci_s text,
  ikinci_o text,
  ikinci_a text,
  ikinci_p text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ikinci_dil is null or ikinci_dil <> not_dili),
  constraint not_dil_kaydi_not_fk foreign key (ulke, doctor_id, note_id) references public.ulke_notlar (ulke, doctor_id, id) on delete cascade,
  constraint not_dil_kaydi_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);

create index if not exists not_dil_kaydi_doctor_idx on public.not_dil_kaydi (ulke, doctor_id);

alter table public.not_dil_kaydi enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.not_dil_kaydi;
create policy "hasta_izolasyon_kendi_satiri" on public.not_dil_kaydi
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.not_dil_kaydi;
create policy "hasta_izolasyon_hasta_sahipligi" on public.not_dil_kaydi as restrictive for all to authenticated, anon
  using (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()))
  with check (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()));

revoke all on table public.not_dil_kaydi from anon, authenticated;
grant select on table public.not_dil_kaydi to authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('133', '133_not_dil_kaydi.sql', null, now(), false,
  'NOTYA-ULKE-SABLON-01: country notes (ulke_notlar) + per-note language and second-language draft (new tables, country and doctor in every key, owner-and-country-only, restrictive patient ownership)')
on conflict (version) do nothing;

commit;
