-- 065 — FIZIK-TEDAVI-EXCEPTIONAL-01 (2026-09-19): Fiziksel Tıp ve Rehabilitasyon bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: tam hastane rehabilitasyon HIS, tanı auto-lock
-- ve uydurma ilaç dozu KAPSAM DIŞI. 062_noroloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya ilaç dozu üretmez, tanı kilitlemez,
-- VAS/ODI bandını tanıya çevirmez. Medula'ya canlı e-imza yoktur. Pediatri büyüme / baş çevresi sızmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_fizik_tedavi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_fizik_tedavi_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_fizik_tedavi_idx on hasta_fizik_tedavi (doctor_id, next_kontrol);

-- ── FTR seans planı: modalite + seans sayısı / sıklık (ilaç/doz YOK) ───────────────────────
create table if not exists ftr_seans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_fizik_tedavi_id uuid references hasta_fizik_tedavi(id) on delete cascade,
  tarih date not null,
  -- hekim girdileri: bolge, modaliteler[], seans_sayisi, haftalik_siklik, not — ilaç adı/doz yok
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists ftr_seans_idx on ftr_seans (patient_id, tarih desc);
create index if not exists ftr_seans_doktor_idx on ftr_seans (doctor_id, tarih desc);

-- ── VAS / ODI ölçek: karar desteği (tanı değil) ───────────────────────────────────────────
-- Skor SINIRLARI motorda (specialties/fizik-tedavi/engines/vasOdi.ts) doğrulanır; DB yalnız saklar.
create table if not exists ftr_olcek (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_fizik_tedavi_id uuid references hasta_fizik_tedavi(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('vas','odi')),
  maddeler jsonb,
  toplam numeric,
  bant text,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists ftr_olcek_idx on ftr_olcek (patient_id, tarih desc);
create index if not exists ftr_olcek_doktor_idx on ftr_olcek (doctor_id, tarih desc);

-- ── Ev egzersiz reçetesi: genel egzersiz adı + tekrar (ilaç/doz YOK) ───────────────────────
create table if not exists ftr_egzersiz (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_fizik_tedavi_id uuid references hasta_fizik_tedavi(id) on delete cascade,
  tarih date not null,
  -- hekim girdileri: egzersizler[{ad, tekrar, set, not}] — mg/ml yok
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists ftr_egzersiz_idx on ftr_egzersiz (patient_id, tarih desc);
create index if not exists ftr_egzersiz_doktor_idx on ftr_egzersiz (doctor_id, tarih desc);

-- ── Görevler: kontrol, ölçek tekrarı, seans takibi, egzersiz kontrolü ─────────────────────
create table if not exists ftr_gorevleri (
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
create index if not exists ftr_gorev_idx on ftr_gorevleri (patient_id, durum, due);
create index if not exists ftr_gorev_doktor_idx on ftr_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak: cauda equina, kırık şüphesi, enfeksiyon, … ─────────────────────
-- Ayaktan muayenehane akışı → 112 veya en yakın acil. Portal mesajı bu akışı YÖNETMEZ.
create table if not exists ftr_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_fizik_tedavi_id uuid references hasta_fizik_tedavi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ftr_risk_idx on ftr_risk (patient_id, tarih desc);
create index if not exists ftr_risk_doktor_idx on ftr_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_fizik_tedavi','ftr_seans','ftr_olcek','ftr_egzersiz','ftr_gorevleri','ftr_risk'] loop
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
values ('065', '065_fizik_tedavi_exceptional.sql', null, now(), false, 'FIZIK-TEDAVI-EXCEPTIONAL-01: hasta_fizik_tedavi, ftr_seans, ftr_olcek, ftr_egzersiz, ftr_gorevleri, ftr_risk + RLS')
on conflict (version) do nothing;
