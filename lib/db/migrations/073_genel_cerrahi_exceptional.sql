-- 073 — GENEL-CERRAHI-EXCEPTIONAL-01 (2026-09-19): Genel Cerrahi bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: ameliyathane planlama / OR scheduling, full surgical HIS,
-- tanı kilidi, uydurma doz ve canlı Medula e-imza KAPSAM DIŞI. 072_onkoloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- OR slot atamaz. Pediatri büyüme / baş çevresi sızmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_genel_cerrahi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- pre-op özeti: { planlananAmeliyatEtiket, ameliyatTarihi, tamamlanan[], not }
  preop jsonb,
  -- son yara/dren özeti
  yara jsonb,
  -- son patoloji takip özeti (tanı yok)
  patoloji jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_genel_cerrahi_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_genel_cerrahi_idx on hasta_genel_cerrahi (doctor_id, next_kontrol);

-- ── Pre-op checklist kayıtları ────────────────────────────────────────────────────────────
create table if not exists gc_preop (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_genel_cerrahi_id uuid references hasta_genel_cerrahi(id) on delete cascade,
  tarih date not null,
  etiket text,
  ameliyat_tarihi date,
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gc_preop_idx on gc_preop (patient_id, tarih desc);
create index if not exists gc_preop_doktor_idx on gc_preop (doctor_id, tarih desc);

-- ── Yara / dren izlem ─────────────────────────────────────────────────────────────────────
create table if not exists gc_yara_dren (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_genel_cerrahi_id uuid references hasta_genel_cerrahi(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('yara','dren','dikis','taburcu_kontrol')),
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gc_yara_dren_idx on gc_yara_dren (patient_id, tarih desc);
create index if not exists gc_yara_dren_doktor_idx on gc_yara_dren (doctor_id, tarih desc);

-- ── Patoloji belge köprüsü (tanı yok) ─────────────────────────────────────────────────────
create table if not exists gc_patoloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_genel_cerrahi_id uuid references hasta_genel_cerrahi(id) on delete cascade,
  tarih date not null,
  durum text not null check (durum in ('bekleniyor','geldi','hekim_gordü')),
  etiket text,
  ornek_tarihi date,
  rapor_tarihi date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gc_patoloji_idx on gc_patoloji (patient_id, tarih desc);
create index if not exists gc_patoloji_doktor_idx on gc_patoloji (doctor_id, tarih desc);

-- ── Görevler ──────────────────────────────────────────────────────────────────────────────
create table if not exists gc_gorevleri (
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
create index if not exists gc_gorev_idx on gc_gorevleri (patient_id, durum, due);
create index if not exists gc_gorev_doktor_idx on gc_gorevleri (doctor_id, durum, due);

-- ── Acil / cerrahi kırmızı bayrak ─────────────────────────────────────────────────────────
create table if not exists gc_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_genel_cerrahi_id uuid references hasta_genel_cerrahi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gc_acil_idx on gc_acil (patient_id, tarih desc);
create index if not exists gc_acil_doktor_idx on gc_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_genel_cerrahi','gc_preop','gc_yara_dren','gc_patoloji','gc_gorevleri','gc_acil'] loop
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
values ('073', '073_genel_cerrahi_exceptional.sql', null, now(), false, 'GENEL-CERRAHI-EXCEPTIONAL-01: hasta_genel_cerrahi, gc_preop, gc_yara_dren, gc_patoloji, gc_gorevleri, gc_acil + RLS')
on conflict (version) do nothing;
