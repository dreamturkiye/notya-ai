-- 174 — FOTO-ARSIV-01 / FOTO-AI-01 (2026-10-16): hasta fotoğraf arşivi + yapay zekâ fotoğraf değerlendirmesi.
--
-- WRITTEN ONLY — NOT APPLIED by the agent that wrote it. Idempotent and ADDITIVE: no existing column or row changes.
-- Until it is applied the code fails closed: the archive still lists the patient's photos (read from the document
-- vault); what is missing is every stored extra (region, tags, notes, adjustments, annotations, thumbnails, AI cache,
-- feedback, learning). Nothing here uses triggers.
--
-- What is new
--   1) hasta_foto_meta           one row per (doctor, vault document): region, favourite, stars, key-photo marker, the
--                                 doctor's corrected shot date. Everything free-text or clinical-shaped (tags, note,
--                                 adjustments, annotations) is ONE encrypted JSON blob (AES-256-GCM, same key as PII).
--   2) hasta_foto_kucuk          downscaled thumbnail per photo, encrypted exactly like the original (never a public URL).
--   3) hasta_foto_degerlendirme  AI evaluation cache keyed by image hash + prompt version; result encrypted.
--   4) hasta_foto_geri_bildirim  the doctor's Kabul / Düzelt / Reddet per AI observation (correction text encrypted).
--   5) hasta_foto_ogrenme        per-doctor counters keyed by a CLOSED vocabulary (no free text can enter).
--
-- ISOLATION: own-row select policy + the RESTRICTIVE patient-ownership policy of 052 / 171. Server code uses the service
-- role (RLS bypassed on purpose) and scopes every query by doctor_id; RLS is the second line. Browser roles never write.

-- ── 1) Meta ───────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.hasta_foto_meta (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  belge_id uuid not null references public.medical_documents(id) on delete cascade,
  bolge text check (bolge is null or bolge ~ '^[a-z][a-z-]{1,39}$'),
  bolge_kaynagi text check (bolge_kaynagi is null or bolge_kaynagi in ('hekim', 'ayse')),
  favori boolean not null default false,
  yildiz smallint not null default 0 check (yildiz between 0 and 5),
  anahtar boolean not null default false,
  cekim_tarihi date,
  -- true = the doctor removed this photo from the archive view (the file itself stays in the document vault)
  gizli boolean not null default false,
  -- JSON {v, etiketler, not, ayarlar, notasyonlar} AES-256-GCM; plaintext carries no clinical text.
  ozel_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, belge_id)
);

create index if not exists hasta_foto_meta_hasta_idx on public.hasta_foto_meta (doctor_id, patient_id, updated_at desc);

-- ── 2) Thumbnails ─────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.hasta_foto_kucuk (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  belge_id uuid not null references public.medical_documents(id) on delete cascade,
  mime text not null check (mime in ('image/jpeg', 'image/webp')),
  genislik integer not null check (genislik between 16 and 1024),
  yukseklik integer not null check (yukseklik between 16 and 1024),
  -- base64 of the AES-256-GCM envelope of the thumbnail bytes (lib/vault/crypto)
  veri_encrypted text not null,
  created_at timestamptz not null default now(),
  unique (doctor_id, belge_id)
);

create index if not exists hasta_foto_kucuk_hasta_idx on public.hasta_foto_kucuk (doctor_id, patient_id);

-- ── 3) AI evaluation cache ────────────────────────────────────────────────────────────────────────────────
create table if not exists public.hasta_foto_degerlendirme (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  belge_id uuid not null references public.medical_documents(id) on delete cascade,
  -- 'tek' = one photo; 'karsilastirma' = change detection against onceki_belge_id
  tur text not null check (tur in ('tek', 'karsilastirma')),
  onceki_belge_id uuid references public.medical_documents(id) on delete cascade,
  -- sha256(original bytes [+ previous bytes] + prompt version + mode + age group): same input -> no new call
  girdi_hash text not null check (char_length(girdi_hash) between 16 and 128),
  surum text not null check (char_length(surum) between 1 and 40),
  istem_izi text check (istem_izi is null or char_length(istem_izi) <= 40),
  durum text not null check (durum in ('tamam', 'hata')),
  model text check (model is null or char_length(model) <= 80),
  -- JSON (FotoDegerlendirme | FotoKarsilastirma) AES-256-GCM; plaintext carries no clinical text.
  sonuc_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists hasta_foto_degerlendirme_tekil
  on public.hasta_foto_degerlendirme (doctor_id, belge_id, tur, coalesce(onceki_belge_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists hasta_foto_degerlendirme_hash_idx on public.hasta_foto_degerlendirme (doctor_id, girdi_hash);

-- ── 4) Doctor feedback ────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.hasta_foto_geri_bildirim (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  belge_id uuid not null references public.medical_documents(id) on delete cascade,
  degerlendirme_id uuid references public.hasta_foto_degerlendirme(id) on delete set null,
  -- stable key of the observation inside the evaluation: bolge | morfoloji | g1.. | bayrak:<kod> | ayirici:<slug>
  gozlem_anahtari text not null check (char_length(gozlem_anahtari) between 1 and 80),
  ozellik text not null check (char_length(ozellik) between 1 and 80),
  karar text not null check (karar in ('kabul', 'duzelt', 'reddet')),
  duzeltme_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, belge_id, gozlem_anahtari)
);

create index if not exists hasta_foto_geri_bildirim_hasta_idx on public.hasta_foto_geri_bildirim (doctor_id, patient_id);

-- ── 5) Per-doctor learning counters ───────────────────────────────────────────────────────────────────────
create table if not exists public.hasta_foto_ogrenme (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  brans text not null default 'genel' check (char_length(brans) between 1 and 60),
  ozellik text not null check (char_length(ozellik) between 1 and 80),
  kabul integer not null default 0 check (kabul >= 0),
  duzelt integer not null default 0 check (duzelt >= 0),
  reddet integer not null default 0 check (reddet >= 0),
  updated_at timestamptz not null default now(),
  unique (doctor_id, brans, ozellik)
);

-- ── 6) RLS ────────────────────────────────────────────────────────────────────────────────────────────────
alter table public.hasta_foto_meta enable row level security;
alter table public.hasta_foto_kucuk enable row level security;
alter table public.hasta_foto_degerlendirme enable row level security;
alter table public.hasta_foto_geri_bildirim enable row level security;
alter table public.hasta_foto_ogrenme enable row level security;

-- Browser roles never write (the server writes with the service role); reads are limited to the doctor's own rows.
revoke all on public.hasta_foto_meta from anon, authenticated;
revoke all on public.hasta_foto_kucuk from anon, authenticated;
revoke all on public.hasta_foto_degerlendirme from anon, authenticated;
revoke all on public.hasta_foto_geri_bildirim from anon, authenticated;
revoke all on public.hasta_foto_ogrenme from anon, authenticated;
grant select on public.hasta_foto_meta to authenticated;
grant select on public.hasta_foto_degerlendirme to authenticated;
grant select on public.hasta_foto_geri_bildirim to authenticated;
grant select on public.hasta_foto_ogrenme to authenticated;
-- hasta_foto_kucuk: no browser grant at all (thumbnails stream only through the authenticated API route).

do $$
declare t text;
begin
  foreach t in array array['hasta_foto_meta', 'hasta_foto_degerlendirme', 'hasta_foto_geri_bildirim', 'hasta_foto_ogrenme'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'doktor kendi satirlari') then
      execute format('create policy "doktor kendi satirlari" on public.%I for select to authenticated using (doctor_id = auth.uid())', t);
    end if;
  end loop;

  foreach t in array array['hasta_foto_meta', 'hasta_foto_kucuk', 'hasta_foto_degerlendirme', 'hasta_foto_geri_bildirim'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'hasta_izolasyon_hasta_sahipligi') then
      execute format(
        'create policy hasta_izolasyon_hasta_sahipligi on public.%I as restrictive for all to authenticated, anon
           using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))', t);
    end if;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('174', '174_hasta_foto_arsivi.sql', null, now(), false,
  'FOTO-ARSIV-01 / FOTO-AI-01: hasta_foto_meta (bolge, favori, yildiz, anahtar + sifreli etiket/not/ayar/notasyon), hasta_foto_kucuk (sifreli kucuk resim), hasta_foto_degerlendirme (hash+surum onbellegi, sifreli sonuc), hasta_foto_geri_bildirim, hasta_foto_ogrenme; RLS + restrictive hasta_izolasyon')
on conflict (version) do nothing;

-- Rollback (manual, never automatic):
--   drop table if exists public.hasta_foto_ogrenme; drop table if exists public.hasta_foto_geri_bildirim;
--   drop table if exists public.hasta_foto_degerlendirme; drop table if exists public.hasta_foto_kucuk; drop table if exists public.hasta_foto_meta;
