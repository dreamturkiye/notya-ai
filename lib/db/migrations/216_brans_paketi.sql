-- 216 — BRANS-PAKETI Phase 1 (Kaan, 2026-11-27): branş signature modules of the patient portal (Sağlığım) for the 10
-- Özel Branşlar, full diyetisyen package first. Kaan: "Diyetisyen için yapacağın hasta portalını bütün branşlar için
-- gerektiği şekilde yap. Özel branşlar için de bunu yapman şart."
--
--   brans_paket_sablon   one row per (doctor, module): the professional's ACCEPTED copy of a module template (timeline,
--                        checklist, diary fields, photo angles …). A module never reaches a patient until its row has
--                        kabul_at (the treating professional is the reviewer — there is no external clinical reviewer).
--                        Every acceptance is appended to kabul_gecmisi (timestamp + whether the text was edited).
--   brans_paket_hasta    one row per (doctor, patient, module): the professional's per-patient switch (acik null =
--                        follow the default / diagnosis rule), the start date (operation / treatment day) and the
--                        per-patient settings (protein target, weekly plan, levothyroxine time …).
--   brans_paket_kayit    the patient's own entries (diary, checklist ticks, wear hours, screening answers). seviye is the
--                        alert level the server derived from the professional's red-flag rules (null = none).
--   brans_paket_foto     the patient's private photos (Tabağım meal photos, progress / lesion / growth photos) — the
--                        professional may leave one comment per photo. Deletable by the patient (row + object).
--   storage bucket       'brans-paket-foto' — PRIVATE. No storage.objects policy: anon / authenticated can neither list,
--                        read nor write it; every read and write goes through the server (service role) after the
--                        portal token + PIN gate (patient) or doktorOturum + hastaSahibiMi (professional). Paths are
--                        <doctor_id>/<patient_id>/<uuid>.<ext>. JPEG / PNG / WebP, 5 MB at most.
--
-- Access (hasta-izolasyon): RLS on all four tables; a doctor may SELECT only his own rows of his own patients (permissive
-- own-row + restrictive patient ownership, the 208 pattern); anon nothing; no write policy (writes are service role only).
-- Applied to production with the Supabase tools on 2026-11-27 UTC (migration log name: 216_brans_paketi).

create table if not exists public.brans_paket_sablon (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  brans text not null check (char_length(brans) between 2 and 40),
  modul text not null check (char_length(modul) between 2 and 60),
  icerik jsonb not null default '{}'::jsonb,
  kabul_at timestamptz,
  duzenlendi boolean not null default false,
  kabul_gecmisi jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (doctor_id, modul)
);

create table if not exists public.brans_paket_hasta (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  modul text not null check (char_length(modul) between 2 and 60),
  acik boolean,
  baslangic date,
  ayar jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (doctor_id, patient_id, modul)
);

create table if not exists public.brans_paket_kayit (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  modul text not null check (char_length(modul) between 2 and 60),
  gun date not null,
  veri jsonb not null default '{}'::jsonb,
  seviye text check (seviye is null or seviye in ('dikkat', 'hekime_bildir', 'acil')),
  created_at timestamptz not null default now()
);
create index if not exists brans_paket_kayit_kapsam_idx on public.brans_paket_kayit (doctor_id, patient_id, gun desc);

create table if not exists public.brans_paket_foto (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  modul text not null check (char_length(modul) between 2 and 60),
  etiket text check (etiket is null or char_length(etiket) <= 80),
  yol text not null check (char_length(yol) <= 200 and yol ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  uzman_yorum text check (uzman_yorum is null or char_length(uzman_yorum) <= 1000),
  yorum_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists brans_paket_foto_kapsam_idx on public.brans_paket_foto (doctor_id, patient_id, created_at desc);

comment on table public.brans_paket_sablon is 'BRANS-PAKETI: the professional''s accepted copy of a branş portal module template; kabul_at null = not delivered to any patient.';
comment on table public.brans_paket_hasta is 'BRANS-PAKETI: per-patient module switch, start date and settings set by the professional.';
comment on table public.brans_paket_kayit is 'BRANS-PAKETI: patient diary / checklist / screening entries; seviye = derived alert level.';
comment on table public.brans_paket_foto is 'BRANS-PAKETI: patient private photos (private bucket brans-paket-foto) + one professional comment.';

alter table public.brans_paket_sablon enable row level security;
alter table public.brans_paket_hasta enable row level security;
alter table public.brans_paket_kayit enable row level security;
alter table public.brans_paket_foto enable row level security;

do $$
begin
  create policy "doktor kendi satirlari" on public.brans_paket_sablon for select to authenticated using (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['brans_paket_hasta', 'brans_paket_kayit', 'brans_paket_foto'] loop
    begin
      execute format('create policy "doktor kendi satirlari" on public.%I for select to authenticated using (doctor_id = auth.uid())', t);
    exception when duplicate_object then null;
    end;
    begin
      execute format('create policy "hasta_izolasyon_hasta_sahipligi" on public.%I as restrictive for all to authenticated, anon using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid())) with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

revoke all on public.brans_paket_sablon, public.brans_paket_hasta, public.brans_paket_kayit, public.brans_paket_foto from anon;
revoke insert, update, delete, truncate, references, trigger on public.brans_paket_sablon, public.brans_paket_hasta, public.brans_paket_kayit, public.brans_paket_foto from authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brans-paket-foto', 'brans-paket-foto', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('216', '216_brans_paketi.sql', null, now(), false,
  'BRANS-PAKETI Phase 1: brans_paket_sablon / brans_paket_hasta / brans_paket_kayit / brans_paket_foto (RLS on, doctor select own rows of own patients, anon nothing, writes service role only) + PRIVATE storage bucket brans-paket-foto (no storage policy; jpeg/png/webp, 5 MB)')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select relname, relrowsecurity from pg_class where relname like 'brans\_paket\_%' and relkind = 'r' order by 1;
--   select tablename, policyname, permissive, cmd from pg_policies where tablename like 'brans\_paket\_%' order by 1, 2;
--   select id, public, file_size_limit from storage.buckets where id = 'brans-paket-foto';   -- public = false
--   select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and (qual like '%brans-paket-foto%' or with_check like '%brans-paket-foto%');  -- expect 0 rows
