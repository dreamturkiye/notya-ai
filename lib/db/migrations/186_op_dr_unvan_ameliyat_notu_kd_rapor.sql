-- 186 — OP-DR-01 / AMELIYAT-NOTU-01 / KD-RAPOR-01 (Kaan, 2026-11-05): a Turkish private-practice KD surgeon
-- ("Op. Dr.") must be fully supported.
--
-- What is new (ADDITIVE; idempotent; no existing row changes):
--   1) users.title CHECK widened to the five Turkish titles in their order: Dr., Uzm. Dr., Op. Dr., Doç. Dr., Prof. Dr.
--      ("Op. Dr." = operatör doktor, the title of a surgical specialist). Existing rows keep their value.
--   2) ameliyat_notlari   CORE (every surgical branch): one structured operation note per row. The clinical content
--                         (diagnoses, team, findings, technique, specimens, EBL, drains, complications, implants,
--                         closure, post-op orders) is ONE encrypted JSON value (AES-256-GCM, lib/security/encryption.ts),
--                         never a column per field. Plain columns: the day of the operation (for the list), the
--                         template key the doctor started from, the delivery it belongs to (sezaryen), sign-off time.
--   3) kd_raporlari       KD only (Kadın Hastalıkları ve Doğum): structured obstetric USG, gynaecological USG and NST
--                         reports. Same shape: report type + day plain, content encrypted.
--
-- ISOLATION (hasta-izolasyon): server routes use the service role and scope every statement by doctor_id AND check the
-- patient belongs to the doctor first (hastaSahibiMi). RLS is the second line: own-row select for the browser role, the
-- RESTRICTIVE patient-ownership policy of 052 / 171 / 174, and no browser write grant at all.

-- ── 1) Title ──────────────────────────────────────────────────────────────────────────────────────────────
alter table public.users drop constraint if exists users_title_check;
alter table public.users add constraint users_title_check
  check (title is null or title = any (array['Dr.'::text, 'Uzm. Dr.'::text, 'Op. Dr.'::text, 'Doç. Dr.'::text, 'Prof. Dr.'::text]));

-- ── 2) Operation notes ────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ameliyat_notlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  ameliyat_tarihi date not null,
  -- The template the doctor started from (a key of the branch's own template list), or null for a blank note.
  sablon text check (sablon is null or (sablon ~ '^[a-z0-9]+(_[a-z0-9]+)*$' and char_length(sablon) <= 60)),
  -- Sezaryen: the delivery record the note belongs to (dogum_olaylari, KD spine).
  dogum_id uuid,
  veri_encrypted text not null check (char_length(veri_encrypted) > 0),
  imzalandi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ameliyat_notlari_hasta_idx on public.ameliyat_notlari (doctor_id, patient_id, ameliyat_tarihi desc);

-- ── 3) KD reports ─────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.kd_raporlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  gebelik_id uuid,
  tur text not null check (tur in ('usg_obstetrik', 'usg_jinekolojik', 'nst')),
  rapor_tarihi date not null,
  veri_encrypted text not null check (char_length(veri_encrypted) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kd_raporlari_hasta_idx on public.kd_raporlari (doctor_id, patient_id, rapor_tarihi desc);

-- ── 4) RLS ────────────────────────────────────────────────────────────────────────────────────────────────
alter table public.ameliyat_notlari enable row level security;
alter table public.kd_raporlari enable row level security;
revoke all on public.ameliyat_notlari from anon, authenticated;
revoke all on public.kd_raporlari from anon, authenticated;
grant select on public.ameliyat_notlari to authenticated;
grant select on public.kd_raporlari to authenticated;

do $$
declare t text;
begin
  foreach t in array array['ameliyat_notlari', 'kd_raporlari'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'doktor kendi satirlari') then
      execute format('create policy "doktor kendi satirlari" on public.%I for select to authenticated using (doctor_id = auth.uid())', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'hasta_izolasyon_hasta_sahipligi') then
      execute format(
        'create policy hasta_izolasyon_hasta_sahipligi on public.%I as restrictive for all to authenticated, anon
           using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))', t);
    end if;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('186', '186_op_dr_unvan_ameliyat_notu_kd_rapor.sql', null, now(), false,
  'OP-DR-01: users.title + Op. Dr.; AMELIYAT-NOTU-01: ameliyat_notlari (sifreli, RLS + restrictive hasta_izolasyon); KD-RAPOR-01: kd_raporlari (usg_obstetrik/usg_jinekolojik/nst, sifreli, RLS)')
on conflict (version) do nothing;

-- Rollback (manual, never automatic):
--   drop table if exists public.kd_raporlari; drop table if exists public.ameliyat_notlari;
--   (the title check is only widened; narrowing it back would fail while an "Op. Dr." row exists)
