-- 081 — KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 (2026-09-19): Kalp ve Damar Cerrahisi bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: ameliyathane / full OR HIS core ürünü DEĞİLDİR;
-- tanı kilidi, uydurma antikoagülan dozu ve canlı Medula e-imza KAPSAM DIŞI.
-- kardiyoloji SCORE2 / Kalbim / HT-KKY bu tablolara BAĞLANMAZ — ayrı branş (ve tersi).
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, cerrahi karar ve doz YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- OR/HIS entegre etmez. Pediatri büyüme / baş çevresi sızmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_kalp_damar_cerrahisi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- pre-op risk checklist özeti (madde kodları) — tanı/doz/SCORE2 yok
  preop jsonb,
  -- greft / yara izlem özeti — tarih + durum; tanı yok
  greft_yara jsonb,
  -- antikoagülan izlem vadeleri — sınıf + tarihler; mg / INR hedef YOK
  antikoag jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_kalp_damar_cerrahisi_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_kalp_damar_cerrahisi_idx on hasta_kalp_damar_cerrahisi (doctor_id, next_kontrol);

-- ── Pre-op risk checklist kayıtları ───────────────────────────────────────────────────────
create table if not exists kdc_preop (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kalp_damar_cerrahisi_id uuid references hasta_kalp_damar_cerrahisi(id) on delete cascade,
  tarih date not null,
  maddeler text[] not null default '{}',
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists kdc_preop_idx on kdc_preop (patient_id, tarih desc);
create index if not exists kdc_preop_doktor_idx on kdc_preop (doctor_id, tarih desc);

-- ── Greft / yara izlem ────────────────────────────────────────────────────────────────────
create table if not exists kdc_greft_yara (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kalp_damar_cerrahisi_id uuid references hasta_kalp_damar_cerrahisi(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('greft','yara','bypass','stent_graft')),
  durum text not null default 'izlemde' check (durum in ('izlemde','iyilesiyor','dikkat','kapandi')),
  sonraki_kontrol date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists kdc_greft_yara_idx on kdc_greft_yara (patient_id, tarih desc);
create index if not exists kdc_greft_yara_doktor_idx on kdc_greft_yara (doctor_id, tarih desc);

-- ── Antikoagülan izlem vadeleri — doz / INR hedef yazılmaz ────────────────────────────────
create table if not exists kdc_antikoag (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kalp_damar_cerrahisi_id uuid references hasta_kalp_damar_cerrahisi(id) on delete cascade,
  sinif text not null check (sinif in ('warfarin','doac','lmwh','antiplatelet','diger')),
  sonraki_kontrol date,
  lab_vadesi date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists kdc_antikoag_idx on kdc_antikoag (patient_id, created_at desc);
create index if not exists kdc_antikoag_doktor_idx on kdc_antikoag (doctor_id, created_at desc);

-- ── Görevler: kontrol, greft, antikoag, pre-op ────────────────────────────────────────────
create table if not exists kdc_gorevleri (
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
create index if not exists kdc_gorev_idx on kdc_gorevleri (patient_id, durum, due);
create index if not exists kdc_gorev_doktor_idx on kdc_gorevleri (doctor_id, durum, due);

-- ── Acil / vasküler kırmızı bayrak: akut ekstremite iskemisi, greft trombozu, … ───────────
-- Ayaktan muayenehane akışı → 112. Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
-- SCORE2 / Kalbim / HT-KKY bu tabloya girmez.
create table if not exists kdc_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kalp_damar_cerrahisi_id uuid references hasta_kalp_damar_cerrahisi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists kdc_acil_idx on kdc_acil (patient_id, tarih desc);
create index if not exists kdc_acil_doktor_idx on kdc_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_kalp_damar_cerrahisi','kdc_preop','kdc_greft_yara','kdc_antikoag','kdc_gorevleri','kdc_acil'] loop
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
values ('081', '081_kalp_damar_cerrahisi_exceptional.sql', null, now(), false, 'KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01: hasta_kalp_damar_cerrahisi, kdc_preop, kdc_greft_yara, kdc_antikoag, kdc_gorevleri, kdc_acil + RLS (not kardiyoloji kalp_*)')
on conflict (version) do nothing;
