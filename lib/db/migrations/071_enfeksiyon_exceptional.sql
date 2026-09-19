-- 071 — ENFEKSIYON-EXCEPTIONAL-01 (2026-09-19): Enfeksiyon Hastalıkları bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: hastane enfeksiyon kontrolü full HIS
-- core ürünü DEĞİLDİR; tanı kilidi ve uydurma antibiyotik dozu KAPSAM DIŞI.
-- 067_endokrinoloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- CD4/viral yük değerini tanıya çevirmez. Medula'ya canlı e-imza yoktur. Pediatri büyüme / baş çevresi sızmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_enfeksiyon (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- dates-only ATB kartı: { baslangic, bitis, kontrol, sinif_etiket, not } — doz yok
  atb jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_enfeksiyon_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_enfeksiyon_idx on hasta_enfeksiyon (doctor_id, next_kontrol);

-- ── İzolasyon / bildirim hatırlatma (tarih + tip; hastane HIS değil) ───────────────────────
create table if not exists enfeksiyon_izolasyon (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_enfeksiyon_id uuid references hasta_enfeksiyon(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('temas','damlacik','solunum','standart','diger')),
  baslangic date,
  bitis date,
  bildirim_tarihi date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists enfeksiyon_izolasyon_idx on enfeksiyon_izolasyon (patient_id, tarih desc);
create index if not exists enfeksiyon_izolasyon_doktor_idx on enfeksiyon_izolasyon (doctor_id, tarih desc);

-- ── ATB süre sayaç: yalnız süre / kontrol tarihi — doz / mg / rejim invent yok ─────────────
create table if not exists enfeksiyon_atb (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_enfeksiyon_id uuid references hasta_enfeksiyon(id) on delete cascade,
  tarih date not null,
  baslangic date not null,
  sure_gun integer not null check (sure_gun > 0 and sure_gun <= 365),
  bitis date not null,
  kontrol date,
  -- sınıf etiketi (örn. "beta-laktam") — etken madde / doz yazılmaz
  sinif_etiket text,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists enfeksiyon_atb_idx on enfeksiyon_atb (patient_id, tarih desc);
create index if not exists enfeksiyon_atb_doktor_idx on enfeksiyon_atb (doctor_id, bitis);

-- ── HIV / viral izlem vadeleri — tarih + tür; sayı tanıya çevrilmez ────────────────────────
create table if not exists enfeksiyon_viral (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_enfeksiyon_id uuid references hasta_enfeksiyon(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('hiv_cd4','hiv_viral','hbv','hcv','diger')),
  -- isteğe bağlı sayısal değer (hekim girer); motor yalnız sonraki izlem aralığı önerir
  deger numeric,
  birim text,
  sonraki_izlem date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists enfeksiyon_viral_idx on enfeksiyon_viral (patient_id, tarih desc);
create index if not exists enfeksiyon_viral_doktor_idx on enfeksiyon_viral (doctor_id, tarih desc);

-- ── Görevler: kontrol, izolasyon bitiş, ATB bitiş, viral izlem, aşı ────────────────────────
create table if not exists enfeksiyon_gorevleri (
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
create index if not exists enfeksiyon_gorev_idx on enfeksiyon_gorevleri (patient_id, durum, due);
create index if not exists enfeksiyon_gorev_doktor_idx on enfeksiyon_gorevleri (doctor_id, durum, due);

-- ── Acil / enfeksiyon kırmızı bayrak: sepsis, menenjit, nekrotizan, anafilaksi ─────────────
-- Ayaktan muayenehane akışı → 112. Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
create table if not exists enfeksiyon_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_enfeksiyon_id uuid references hasta_enfeksiyon(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists enfeksiyon_acil_idx on enfeksiyon_acil (patient_id, tarih desc);
create index if not exists enfeksiyon_acil_doktor_idx on enfeksiyon_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_enfeksiyon','enfeksiyon_izolasyon','enfeksiyon_atb','enfeksiyon_viral','enfeksiyon_gorevleri','enfeksiyon_acil'] loop
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
values ('071', '071_enfeksiyon_exceptional.sql', null, now(), false, 'ENFEKSIYON-EXCEPTIONAL-01: hasta_enfeksiyon, izolasyon, atb, viral, gorevleri, acil + RLS')
on conflict (version) do nothing;
