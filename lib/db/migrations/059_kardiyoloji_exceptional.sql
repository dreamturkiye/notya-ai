-- 059 — KARDIO-EXCEPTIONAL-01 (2026-09-19): Kardiyoloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: cath lab planlama, canlı Medula e-imza ve tanı
-- auto-lock KAPSAM DIŞI. 056_psikiyatri / 057_kbb_exceptional biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç, doz ve risk kategorisi kararı YALNIZ hekimin. Notya doz üretmez, tanı
-- kilitlemez, SCORE2 bandını tanıya çevirmez (band karar desteğidir). Medula'ya canlı e-imza yoktur.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_kardiyoloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- serbest bölüm notları (hekimin kendi girdiği): NYHA, EF bandı hekim, HT/KKY izlem tercihi
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_kardiyoloji_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_kardiyoloji_idx on hasta_kardiyoloji (doctor_id, next_kontrol);

-- ── SCORE2 / KV risk kaydı: yalnız hekimin girdiği girdi + hesap çıktısı ───────────────────
-- Bant SINIRLARI motorda (specialties/kardiyoloji/engines/score2.ts → dahiliye ESC motoru) doğrulanır; DB yalnız saklar.
create table if not exists kardio_score2 (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kardiyoloji_id uuid references hasta_kardiyoloji(id) on delete cascade,
  tarih date not null,
  -- hekim girdileri + motor çıktısı (risk_pct, kova_taslak, bolge) — tanı DEĞİL
  maddeler jsonb,
  risk_pct numeric,
  -- hekim sonucu gördü ve kilitledi (kova tanı DEĞİLDİR)
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists kardio_score2_idx on kardio_score2 (patient_id, tarih desc);
create index if not exists kardio_score2_doktor_idx on kardio_score2 (doctor_id, tarih desc);

-- ── HT / KKY izlem kayıtları ──────────────────────────────────────────────────────────────
create table if not exists kardio_izlem (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kardiyoloji_id uuid references hasta_kardiyoloji(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('ht','kky','af','diger')),
  -- hekim alanları: KB, kilo, NYHA (hekim seçimi), semptom bayrakları — doz YOK
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists kardio_izlem_idx on kardio_izlem (patient_id, tarih desc);
create index if not exists kardio_izlem_doktor_idx on kardio_izlem (doctor_id, tarih desc);

-- ── Görevler: kontrol, lab, EKG belge, rapor yenileme ─────────────────────────────────────
create table if not exists kardio_gorevleri (
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
create index if not exists kardio_gorev_idx on kardio_gorevleri (patient_id, durum, due);
create index if not exists kardio_gorev_doktor_idx on kardio_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak: göğüs ağrısı, ani nefes darlığı, bayılma, … ────────────────────
-- Ayaktan muayenehane akışı → 112 veya en yakın acil. Portal mesajı bu akışı YÖNETMEZ.
create table if not exists kardio_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kardiyoloji_id uuid references hasta_kardiyoloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists kardio_risk_idx on kardio_risk (patient_id, tarih desc);
create index if not exists kardio_risk_doktor_idx on kardio_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_kardiyoloji','kardio_score2','kardio_izlem','kardio_gorevleri','kardio_risk'] loop
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
values ('059', '059_kardiyoloji_exceptional.sql', null, now(), false, 'KARDIO-EXCEPTIONAL-01: hasta_kardiyoloji, kardio_score2, kardio_izlem, kardio_gorevleri, kardio_risk + RLS')
on conflict (version) do nothing;
