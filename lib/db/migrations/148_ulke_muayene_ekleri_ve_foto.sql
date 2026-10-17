-- 148 MUAYENE-EKLERI-07 / FOTO-ARSIV-01 (country build, Claude, 2026-10-17) — exam-visit attachments and the
-- patient photo archive, built FRESH for the `.ulke` tree. This is NOT the Turkish `hasta_foto_meta` / `medical_documents`
-- schema: those tables were restored onto this country database by an earlier job's migration 174 (applied against the
-- Türkiye-shaped tables that a country database still physically carries from its initial clone), but they key off
-- `patients` / `users` / `doctor_id` on `users` — tables a real country doctor's row NEVER appears in (country doctors
-- and patients live only in `ulke_hesaplari` / `ulke_hastalar`). Reusing them here would violate the ONE-DOOR rule
-- (lib/ulke/uygulama/tablolar.ts: a country build touches COUNTRY TABLES ONLY) and would be unreachable by the
-- isolation tests and the `.ulke` application code alike. This migration creates the country-shaped equivalent instead.
--
-- ONE DATABASE PER COUNTRY. Run only on a country's own database. Idempotent; one transaction.
--
--   1. ulke_muayene_ekleri      MUAYENE-EKLERI-07 — "Yüklenen dosyalar": a file (lab PDF, scanned referral, photo)
--                                attached to ONE visit of ONE patient of ONE doctor. The file's bytes live in the
--                                private bucket `muayene-ekleri`, under `<country>/<account id>/<random>.<ext>`
--                                (the browser's OWN upload, same two-folder rule as migration 132's recordings
--                                bucket); this row is the metadata the server writes after it has verified the visit
--                                and the patient are the uploading doctor's own. The original file name is health
--                                data (it can name a test or a diagnosis) and is encrypted like the rest of a
--                                patient's data (lib/security/encryption.ts). No row is ever updated: a replacement
--                                is a new row; removal deletes the row (the server also removes the object).
--   2. ulke_hasta_fotograflari  FOTO-ARSIV-01 — the clinical photo archive on a patient's file. One row per photo;
--                                `cekim_tarihi` is the clinical date of the photograph (may differ from the upload
--                                day) and `etiket_encrypted` is the doctor's own free-text label (also health data,
--                                encrypted) — both may be corrected after upload. `session_id` is OPTIONAL: a photo
--                                may be filed straight to the patient's file without being tied to one recorded
--                                visit. NO AI evaluation of any kind is wired to this table (FOTO-ARSIV-02 stays
--                                explicitly out of scope, `NOTYA_FOTO_AI` untouched); this is storage and viewing only.
--
-- SERVER ONLY for both tables (no `select` policy, no privilege for the browser roles) — exactly the pattern of
-- migration 139 (`ulke_arac_kayitlari`): the server's routes bind every statement to country, doctor and patient
-- before reading or writing, which is the primary enforcement (.cursor/skills/hasta-izolasyon/SKILL.md). The two new
-- storage buckets get ONE upload-only policy each, scoped to the caller's own country-and-account folder, mirroring
-- migration 132's `muayene_sesleri_ulke_ve_kendi_klasorune_yukle` — the server (service role) does every read,
-- every signed-URL issue and every delete, so no further storage policy is needed.
--
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 148 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_hastalar') is null then
    raise exception 'country migration 148 refused: the patient table of a country database (public.ulke_hastalar) is missing. Run the earlier country migrations first.';
  end if;
  if to_regclass('public.ulke_muayeneler') is null then
    raise exception 'country migration 148 refused: the visit table of a country database (public.ulke_muayeneler) is missing. Run migration 132 first.';
  end if;
end $$;

-- ── 1. MUAYENE-EKLERI-07: exam-visit attachments ────────────────────────────────────────────────────────────────
create table if not exists public.ulke_muayene_ekleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  session_id uuid not null,
  ad_encrypted text not null check (char_length(ad_encrypted) > 0),
  mime_turu text not null check (char_length(mime_turu) <= 100),
  boyut integer not null check (boyut > 0 and boyut <= 10485760), -- 10 MiB per file, v1 ceiling
  depolama_yolu text not null check (char_length(depolama_yolu) > 0),
  created_at timestamptz not null default now(),
  constraint ulke_muayene_ekleri_yol_tekil unique (depolama_yolu),
  constraint ulke_muayene_ekleri_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  constraint ulke_muayene_ekleri_muayene_fk foreign key (ulke, doctor_id, session_id) references public.ulke_muayeneler (ulke, doctor_id, id) on delete cascade
);

create index if not exists ulke_muayene_ekleri_muayene_idx on public.ulke_muayene_ekleri (ulke, doctor_id, session_id, created_at desc);
create index if not exists ulke_muayene_ekleri_hasta_idx on public.ulke_muayene_ekleri (ulke, doctor_id, patient_id, created_at desc);

-- No field of an existing row may ever change (a replacement is a new row; removal is a delete, not an update).
create or replace function public.ulke_muayene_ekleri_degismez() returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'ulke_muayene_ekleri: a row is never updated — delete and insert again' using errcode = '23514';
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_muayene_ekleri_degismez' and tgrelid = 'public.ulke_muayene_ekleri'::regclass) then
    create trigger ulke_muayene_ekleri_degismez
      before update on public.ulke_muayene_ekleri
      for each row execute function public.ulke_muayene_ekleri_degismez();
  end if;
end $$;

alter table public.ulke_muayene_ekleri enable row level security;
revoke all on table public.ulke_muayene_ekleri from anon, authenticated;
revoke all on function public.ulke_muayene_ekleri_degismez() from public, anon, authenticated;

-- ── 2. FOTO-ARSIV-01: the patient photo archive ─────────────────────────────────────────────────────────────────
create table if not exists public.ulke_hasta_fotograflari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  session_id uuid, -- optional: a photo may be filed without a recorded visit
  cekim_tarihi date not null,
  etiket_encrypted text, -- optional free-text label; may be null
  mime_turu text not null check (mime_turu in ('image/jpeg', 'image/png', 'image/webp', 'image/heic')),
  boyut integer not null check (boyut > 0 and boyut <= 12582912), -- 12 MiB per photo, v1 ceiling
  depolama_yolu text not null check (char_length(depolama_yolu) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_hasta_fotograflari_yol_tekil unique (depolama_yolu),
  constraint ulke_hasta_fotograflari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  -- NULL session_id skips this constraint entirely (Postgres MATCH SIMPLE): a photo with no visit is unconstrained by it.
  constraint ulke_hasta_fotograflari_muayene_fk foreign key (ulke, doctor_id, session_id) references public.ulke_muayeneler (ulke, doctor_id, id) on delete set null
);

create index if not exists ulke_hasta_fotograflari_hasta_idx on public.ulke_hasta_fotograflari (ulke, doctor_id, patient_id, cekim_tarihi desc);

-- Only the label and the clinical date may ever be corrected; everything that identifies the row, its owner and its
-- bytes is fixed at insert.
create or replace function public.ulke_hasta_fotograflari_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.patient_id is distinct from old.patient_id
     or new.session_id is distinct from old.session_id or new.depolama_yolu is distinct from old.depolama_yolu
     or new.mime_turu is distinct from old.mime_turu or new.boyut is distinct from old.boyut or new.created_at is distinct from old.created_at then
    raise exception 'ulke_hasta_fotograflari: only the label and the clinical date of a row may change' using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_hasta_fotograflari_kilidi' and tgrelid = 'public.ulke_hasta_fotograflari'::regclass) then
    create trigger ulke_hasta_fotograflari_kilidi
      before update on public.ulke_hasta_fotograflari
      for each row execute function public.ulke_hasta_fotograflari_kilidi();
  end if;
end $$;

alter table public.ulke_hasta_fotograflari enable row level security;
revoke all on table public.ulke_hasta_fotograflari from anon, authenticated;
revoke all on function public.ulke_hasta_fotograflari_kilidi() from public, anon, authenticated;

-- ── 3. Storage: both buckets, private, upload-only to the caller's own country-and-account folder ────────────────
insert into storage.buckets (id, name, public)
values ('muayene-ekleri', 'muayene-ekleri', false), ('hasta-fotograflari', 'hasta-fotograflari', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'muayene_ekleri_ulke_ve_kendi_klasorune_yukle') then
    create policy "muayene_ekleri_ulke_ve_kendi_klasorune_yukle" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'muayene-ekleri'
        and public.ulke_oturum_ulkesi() <> ''
        and (storage.foldername(name))[1] = public.ulke_oturum_ulkesi()
        and (storage.foldername(name))[2] = auth.uid()::text
        and array_length(storage.foldername(name), 1) = 2
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'hasta_fotograflari_ulke_ve_kendi_klasorune_yukle') then
    create policy "hasta_fotograflari_ulke_ve_kendi_klasorune_yukle" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'hasta-fotograflari'
        and public.ulke_oturum_ulkesi() <> ''
        and (storage.foldername(name))[1] = public.ulke_oturum_ulkesi()
        and (storage.foldername(name))[2] = auth.uid()::text
        and array_length(storage.foldername(name), 1) = 2
      );
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('148', '148_ulke_muayene_ekleri_ve_foto.sql', null, now(), false,
  'MUAYENE-EKLERI-07 (ulke_muayene_ekleri) + FOTO-ARSIV-01 (ulke_hasta_fotograflari), fresh country-shaped tables (not the old hasta_foto_* tables of the non-country product, migration 174) + two private storage buckets with an upload-only policy per country-and-account folder. Server only.')
on conflict (version) do nothing;

commit;
