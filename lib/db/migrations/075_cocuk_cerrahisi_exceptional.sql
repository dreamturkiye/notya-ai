-- 075 — COCUK-CERRAHISI-EXCEPTIONAL-01 (2026-09-19): Çocuk Cerrahisi bölüm derinliği.
-- Ticari ayaktan çocuk cerrahisi muayenehanesi / poliklinik. OR scheduling / full HIS,
-- tanı kilidi ve uydurma doz KAPSAM DIŞI. Pediatri büyüme/Neyzi chapter tabloları YOK.
-- YALNIZ EKLEME: yeni tablolar. Veri silinmez. İdempotent.
--
-- Hekim kilitleri: tanı, ilaç, doz YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez.
-- Visibility: cocuk-cerrahisi only — pediatri / genel-cerrahi tablolarına bağlanmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_cocuk_cerrahisi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- pre/post-op checklist özeti: { etiket, ameliyatTarihi, tamamlanan[], not }
  prepost jsonb,
  -- son yara/dren özeti
  yara jsonb,
  -- onam/veli checklist özeti (yaş kapılı — uygulama katmanı)
  onam jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_cocuk_cerrahisi_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_cc_idx on hasta_cocuk_cerrahisi (doctor_id, next_kontrol);

-- ── Pre/post-op checklist kayıtları ───────────────────────────────────────────────────────
create table if not exists cc_prepost (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_cc_id uuid references hasta_cocuk_cerrahisi(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('preop','postop')),
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists cc_prepost_idx on cc_prepost (patient_id, tarih desc);
create index if not exists cc_prepost_doktor_idx on cc_prepost (doctor_id, tarih desc);

-- ── Yara / dren (pediatrik cerrahi ofis) ───────────────────────────────────────────────────
create table if not exists cc_yara_dren (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_cc_id uuid references hasta_cocuk_cerrahisi(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('yara','dren','dikis','taburcu_kontrol')),
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists cc_yara_idx on cc_yara_dren (patient_id, tarih desc);
create index if not exists cc_yara_doktor_idx on cc_yara_dren (doctor_id, tarih desc);

-- ── Onam / veli checklist (yaş kapılı uygulama; reşitte veli maddesi yok) ──────────────────
create table if not exists cc_onam (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_cc_id uuid references hasta_cocuk_cerrahisi(id) on delete cascade,
  tarih date not null,
  yas_yil numeric,
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists cc_onam_idx on cc_onam (patient_id, tarih desc);
create index if not exists cc_onam_doktor_idx on cc_onam (doctor_id, tarih desc);

-- ── Görevler ──────────────────────────────────────────────────────────────────────────────
create table if not exists cc_gorevleri (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  kod text not null,
  ad text not null,
  due date,
  durum text not null default 'acik' check (durum in ('acik','tamam')),
  kaynak text,
  tamam_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cc_gorev_idx on cc_gorevleri (patient_id, durum, due);
create index if not exists cc_gorev_doktor_idx on cc_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak ─────────────────────────────────────────────────────────────────
create table if not exists cc_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_cc_id uuid references hasta_cocuk_cerrahisi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists cc_acil_idx on cc_acil (patient_id, tarih desc);
create index if not exists cc_acil_doktor_idx on cc_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_cocuk_cerrahisi','cc_prepost','cc_yara_dren','cc_onam','cc_gorevleri','cc_acil'] loop
    execute format('alter table public.%I enable row level security', t);
    begin
      execute format('create policy "hasta_izolasyon_kendi_satiri" on public.%I for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid())', t);
    exception when duplicate_object then null;
    end;
    begin
      execute format(
        'create policy "hasta_izolasyon_hasta_sahipligi" on public.%I as restrictive for all to authenticated, anon
           using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))',
        t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('075', '075_cocuk_cerrahisi_exceptional.sql', null, now(), false, 'COCUK-CERRAHISI-EXCEPTIONAL-01: hasta_cocuk_cerrahisi, cc_prepost, cc_yara_dren, cc_onam, cc_gorevleri, cc_acil + RLS')
on conflict (version) do nothing;
