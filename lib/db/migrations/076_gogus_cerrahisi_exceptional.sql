-- 076 — GOGUS-CERRAHISI-EXCEPTIONAL-01 (2026-09-19): Göğüs Cerrahisi bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: ameliyathane / full OR HIS core ürünü DEĞİLDİR;
-- tanı kilidi, uydurma doz ve canlı Medula e-imza KAPSAM DIŞI.
-- gogus-hastaliklari (pulmonoloji) CAT/mMRC/Akciğerlerim bu tablolara BAĞLANMAZ — ayrı branş.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, cerrahi karar ve doz YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- OR/HIS entegre etmez. Pediatri büyüme / baş çevresi sızmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_gogus_cerrahisi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- pre-op solunum checklist özeti (madde kodları) — tanı/doz yok
  preop jsonb,
  -- toraks tüp / yara izlem özeti — tarih + durum; tanı yok
  tup_yara jsonb,
  -- patoloji köprü: tarih + "rapor hazır" bayrağı; tanı metni yok
  patoloji jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_gogus_cerrahisi_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_gogus_cerrahisi_idx on hasta_gogus_cerrahisi (doctor_id, next_kontrol);

-- ── Pre-op solunum checklist kayıtları ────────────────────────────────────────────────────
create table if not exists gc_preop (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gogus_cerrahisi_id uuid references hasta_gogus_cerrahisi(id) on delete cascade,
  tarih date not null,
  maddeler text[] not null default '{}',
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gc_preop_idx on gc_preop (patient_id, tarih desc);
create index if not exists gc_preop_doktor_idx on gc_preop (doctor_id, tarih desc);

-- ── Toraks tüp / yara izlem ───────────────────────────────────────────────────────────────
create table if not exists gc_tup_yara (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gogus_cerrahisi_id uuid references hasta_gogus_cerrahisi(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('toraks_tup','yara','dren')),
  durum text not null default 'izlemde' check (durum in ('izlemde','cikarildi','iyilesiyor','dikkat')),
  sonraki_kontrol date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gc_tup_yara_idx on gc_tup_yara (patient_id, tarih desc);
create index if not exists gc_tup_yara_doktor_idx on gc_tup_yara (doctor_id, tarih desc);

-- ── Patoloji köprü — tarih + hazır bayrağı; tanı / ICD yazılmaz ────────────────────────────
create table if not exists gc_patoloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gogus_cerrahisi_id uuid references hasta_gogus_cerrahisi(id) on delete cascade,
  ornek_tarihi date,
  rapor_hazir_tarihi date,
  hazir boolean not null default false,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gc_patoloji_idx on gc_patoloji (patient_id, created_at desc);
create index if not exists gc_patoloji_doktor_idx on gc_patoloji (doctor_id, created_at desc);

-- ── Görevler: kontrol, tüp, yara, patoloji, pre-op ────────────────────────────────────────
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

-- ── Acil / toraks kırmızı bayrak: tansiyon pnömotoraks, masif hemotoraks, … ───────────────
-- Ayaktan muayenehane akışı → 112. Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
-- CAT/mMRC / inhaler / Akciğerlerim bu tabloya girmez.
create table if not exists gc_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gogus_cerrahisi_id uuid references hasta_gogus_cerrahisi(id) on delete cascade,
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
  foreach t in array array['hasta_gogus_cerrahisi','gc_preop','gc_tup_yara','gc_patoloji','gc_gorevleri','gc_acil'] loop
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
values ('076', '076_gogus_cerrahisi_exceptional.sql', null, now(), false, 'GOGUS-CERRAHISI-EXCEPTIONAL-01: hasta_gogus_cerrahisi, gc_preop, gc_tup_yara, gc_patoloji, gc_gorevleri, gc_acil + RLS')
on conflict (version) do nothing;
