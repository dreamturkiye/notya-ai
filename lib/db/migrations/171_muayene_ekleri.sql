-- 171 — MUAYENE-EKLERI-01 (2026-10-16): post-muayene "Ekleri Ekle" akışı — ek değerlendirmeleri + hekime özel sınıflandırma öğrenmesi.
--
-- WRITTEN ONLY — NOT APPLIED by the agent that wrote it. Idempotent and ADDITIVE: no existing column or row changes.
-- (170 is reserved by another agent.)
-- Until it is applied the code fails closed: attachments still upload to the document vault and are still evaluated
-- (results are held by the browser for this visit and re-validated by the server when the note is generated); what is
-- missing is (a) the server-side per-attachment cache, (b) resume-after-refresh, (c) the per-doctor classification learning.
--
-- What is new
--   1) muayene_ek_degerlendirmeleri  one row per (doctor, vault document): final tür, durum, and the değerlendirme
--      itself ENCRYPTED (AES-256-GCM, same key as patient PII) — plaintext carries only ids, tür, durum, hash.
--   2) muayene_ek_ogrenme            per-doctor (+ branş) counters: feature → tür, confirmations vs corrections.
--      Features come from a closed vocabulary (e.g. "ad:tahlil", "mime:pdf", "ai:foto+kaynak:kamera"); free text
--      such as a file name is never stored, so no PII can enter this table.
--
-- ISOLATION: own-row policy + the RESTRICTIVE patient-ownership policy of 052 / 103 / 168 / 169. Server code uses the
-- service role (RLS bypassed on purpose) and scopes every query by doctor_id; RLS is the second line.

-- ── 1) Değerlendirmeler ───────────────────────────────────────────────────────────────────────────────────
create table if not exists public.muayene_ek_degerlendirmeleri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  belge_id uuid not null,
  tur text not null check (tur in ('lab', 'asi', 'foto', 'rontgen', 'ekg', 'epikriz', 'diger')),
  tur_guven numeric(4, 3) check (tur_guven is null or (tur_guven >= 0 and tur_guven <= 1)),
  tur_kaynagi text not null default 'otomatik' check (tur_kaynagi in ('otomatik', 'hekim', 'ogrenilen')),
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'tamam', 'hata', 'atlandi')),
  -- sha256(belge baytları + tür + değerlendirme sürümü): aynı girdi için yeniden değerlendirme AÇIK bir istek ister.
  girdi_hash text,
  surum text,
  -- JSON (EkSonuc) AES-256-GCM ile şifreli; düz metin klinik içerik bu tabloda tutulmaz.
  sonuc_encrypted text,
  -- Tür öğrenmesi bu satır için bir kez işlendi mi (çift sayım olmasın).
  ogrenme_islendi boolean not null default false,
  note_id uuid references public.notes(id) on delete set null,
  onaylandi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, belge_id)
);

create index if not exists muayene_ek_degerlendirmeleri_seans_idx
  on public.muayene_ek_degerlendirmeleri (doctor_id, session_id);
create index if not exists muayene_ek_degerlendirmeleri_hasta_idx
  on public.muayene_ek_degerlendirmeleri (doctor_id, patient_id, created_at desc);

-- ── 2) Hekime özel sınıflandırma öğrenmesi ─────────────────────────────────────────────────────────────────
create table if not exists public.muayene_ek_ogrenme (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  brans text not null default 'genel' check (char_length(brans) between 1 and 60),
  ozellik text not null check (char_length(ozellik) between 1 and 80),
  tur text not null check (tur in ('lab', 'asi', 'foto', 'rontgen', 'ekg', 'epikriz', 'diger')),
  onay integer not null default 0 check (onay >= 0),
  duzeltme integer not null default 0 check (duzeltme >= 0),
  updated_at timestamptz not null default now(),
  unique (doctor_id, brans, ozellik, tur)
);

create index if not exists muayene_ek_ogrenme_doktor_idx
  on public.muayene_ek_ogrenme (doctor_id, brans);

-- ── 3) RLS ────────────────────────────────────────────────────────────────────────────────────────────────
alter table public.muayene_ek_degerlendirmeleri enable row level security;
alter table public.muayene_ek_ogrenme enable row level security;

-- Tarayıcı rolleri bu tablolara yazmaz (sunucu service role ile yazar); okuma yalnız kendi satırı.
revoke all on public.muayene_ek_degerlendirmeleri from anon, authenticated;
revoke all on public.muayene_ek_ogrenme from anon, authenticated;
grant select on public.muayene_ek_degerlendirmeleri to authenticated;
grant select on public.muayene_ek_ogrenme to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'muayene_ek_degerlendirmeleri' and policyname = 'doktor kendi ek degerlendirmeleri') then
    create policy "doktor kendi ek degerlendirmeleri" on public.muayene_ek_degerlendirmeleri
      for select to authenticated using (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'muayene_ek_degerlendirmeleri' and policyname = 'hasta_izolasyon_hasta_sahipligi') then
    create policy hasta_izolasyon_hasta_sahipligi on public.muayene_ek_degerlendirmeleri as restrictive for all to authenticated, anon
      using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'muayene_ek_ogrenme' and policyname = 'doktor kendi ek ogrenmesi') then
    create policy "doktor kendi ek ogrenmesi" on public.muayene_ek_ogrenme
      for select to authenticated using (doctor_id = auth.uid());
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('171', '171_muayene_ekleri.sql', null, now(), false,
  'MUAYENE-EKLERI-01: muayene_ek_degerlendirmeleri (şifreli sonuç, önbellek anahtarı, not bağlantısı) + muayene_ek_ogrenme (hekime özel sınıflandırma sayaçları), RLS + restrictive hasta_izolasyon')
on conflict (version) do nothing;

-- Rollback (manual, never automatic):
--   drop table if exists public.muayene_ek_ogrenme; drop table if exists public.muayene_ek_degerlendirmeleri;
